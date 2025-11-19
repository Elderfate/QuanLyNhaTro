import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { DatabaseDocument, QueryFilter, AggregationPipeline } from '@/types/googlesheets';

// Type alias for the actual Google Spreadsheet Row from the library
type GoogleSpreadsheetRow = {
  get(key: string): string | number | boolean | null;
  set(key: string, value: string | number | boolean | null): void;
  save(): Promise<void>;
  delete(): Promise<void>;
  toObject?(): Record<string, string | number | boolean | null>;
  _sheet?: { headerValues: string[] };
};

interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientEmail: string;
  privateKey: string;
}

export class GoogleSheetsDB {
  private doc: GoogleSpreadsheet;
  private isConnected: boolean = false;
  private sheetCache: Map<string, { sheet: any; rows: any[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 1000; // 5 seconds cache

  constructor(private config: GoogleSheetsConfig) {
    // Ensure private key is properly formatted
    let key = config.privateKey;
    
    // Remove surrounding quotes if present
    if ((key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    key = key.replace(/\\n/g, '\n');
    
    // Trim whitespace (but preserve internal newlines)
    key = key.trim();
    
    // Remove any leading/trailing whitespace from each line
    const lines = key.split('\n');
    key = lines.map(line => line.trim()).join('\n');
    
    this.doc = new GoogleSpreadsheet(config.spreadsheetId, new JWT({
      email: config.clientEmail,
      key: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    }));
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      await this.doc.loadInfo();
      this.isConnected = true;
      console.log('✅ Connected to Google Sheets:', this.doc.title);
    } catch (error) {
      console.error('❌ Failed to connect to Google Sheets:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error code:', (error as any).code);
        if (error.message.includes('DECODER') || error.message.includes('unsupported')) {
          console.error('   ⚠️  This is likely a private key format issue!');
          console.error('   Check GOOGLE_PRIVATE_KEY in .env.local');
        }
      }
      throw error;
    }
  }

  async getSheet(sheetTitle: string) {
    await this.connect();
    
    let sheet = this.doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
      // Tạo sheet mới nếu chưa tồn tại
      sheet = await this.doc.addSheet({ 
        title: sheetTitle,
        headerValues: ['_id', 'createdAt', 'updatedAt'] // Default headers
      });
    }
    return sheet;
  }

  private async getCachedRows(sheetTitle: string, forceRefresh: boolean = false): Promise<any[]> {
    const cached = this.sheetCache.get(sheetTitle);
    const now = Date.now();
    
    // Return cached rows if still valid and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.rows;
    }
    
    // Fetch fresh rows
    const sheet = await this.getSheet(sheetTitle);
    const rows = await sheet.getRows();
    
    // Update cache
    this.sheetCache.set(sheetTitle, { sheet, rows, timestamp: now });
    
    return rows;
  }

  private invalidateCache(sheetTitle: string) {
    this.sheetCache.delete(sheetTitle);
  }

  // CRUD Operations
  async find(collection: string, query?: QueryFilter, forceRefresh: boolean = false): Promise<DatabaseDocument[]> {
    const rows = await this.getCachedRows(collection, forceRefresh);
    
    if (!query) {
      return rows.map(row => this.rowToObject(row as GoogleSpreadsheetRow));
    }

    // Simple query filtering
    return rows
      .filter(row => this.matchesQuery(row as GoogleSpreadsheetRow, query))
      .map(row => this.rowToObject(row as GoogleSpreadsheetRow));
  }

  async findById(collection: string, id: string): Promise<DatabaseDocument | null> {
    const rows = await this.getCachedRows(collection);
    
    const row = rows.find(r => r.get('_id') === id);
    return row ? this.rowToObject(row as GoogleSpreadsheetRow) : null;
  }

  async create(collection: string, data: DatabaseDocument): Promise<DatabaseDocument> {
    const sheet = await this.getSheet(collection);
    
    // Generate ID if not provided
    if (!data._id) {
      data._id = this.generateId();
    }
    
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();

    // Ensure headers exist for all data fields
    await this.ensureHeaders(sheet, Object.keys(data));
    
    // Convert data to the format expected by Google Sheets
    const rowData: Record<string, string | number | boolean> = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== null && value !== undefined) {
        // Special handling for phone numbers - prefix with ' to prevent Google Sheets from converting to number
        if (key === 'soDienThoai' && typeof value === 'string') {
          rowData[key] = `'${value}`; // Prefix with ' to keep as text
        } else {
          rowData[key] = Array.isArray(value) ? JSON.stringify(value) : String(value);
        }
      }
    });
    
    const row = await sheet.addRow(rowData);
    // Invalidate cache after create
    this.invalidateCache(collection);
    return this.rowToObject(row as GoogleSpreadsheetRow);
  }

  async updateById(collection: string, id: string, update: Partial<DatabaseDocument>): Promise<DatabaseDocument | null> {
    const rows = await this.getCachedRows(collection, true); // Force refresh for update
    
    const row = rows.find(r => r.get('_id') === id);
    if (!row) return null;

    // Update fields
    Object.keys(update).forEach(key => {
      if (key !== '_id') {
        const value = update[key];
        if (value !== null && value !== undefined) {
          // Special handling for phone numbers - prefix with ' to prevent Google Sheets from converting to number
          if (key === 'soDienThoai' && typeof value === 'string') {
            row.set(key, `'${value}`); // Prefix with ' to keep as text
          } else {
            row.set(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
          }
        }
      }
    });
    
    row.set('updatedAt', new Date().toISOString());
    await row.save();
    
    // Invalidate cache after update
    this.invalidateCache(collection);
    
    return this.rowToObject(row as GoogleSpreadsheetRow);
  }

  async deleteById(collection: string, id: string): Promise<boolean> {
    const rows = await this.getCachedRows(collection, true); // Force refresh for delete
    
    const row = rows.find(r => r.get('_id') === id);
    if (!row) return false;

    await row.delete();
    
    // Invalidate cache after delete
    this.invalidateCache(collection);
    
    return true;
  }

  // Helper methods
  private rowToObject(row: GoogleSpreadsheetRow): DatabaseDocument {
    const obj: DatabaseDocument = {};
    
    // Use toObject() method if available, otherwise fallback to manual mapping
    if (typeof row.toObject === 'function') {
      const rowData = row.toObject();
      Object.keys(rowData).forEach(key => {
        let value = rowData[key];
        
        // Special handling for phone numbers - normalize to string
        if (key === 'soDienThoai') {
          if (typeof value === 'number') {
            // If Google Sheets converted to number, pad with leading zero if needed
            value = value.toString().padStart(10, '0');
          } else if (typeof value === 'string') {
            // Remove ' prefix if present (from our formatting)
            value = value.replace(/^'/, '');
            // If it's a number string without leading zero, pad it
            if (/^\d{9,10}$/.test(value) && !value.startsWith('0')) {
              value = '0' + value;
            }
          }
        }
        
        // Try to parse JSON strings back to arrays/objects
        // BUT: Don't parse password hashes (they start with $2a$, $2b$, etc.)
        if (typeof value === 'string' && 
            (value.startsWith('[') || value.startsWith('{')) &&
            !value.startsWith('$2a$') && !value.startsWith('$2b$')) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parse fails
          }
        }
        obj[key] = value;
      });
    } else if (row._sheet && row._sheet.headerValues) {
      row._sheet.headerValues.forEach((header: string) => {
        let value = row.get(header);
        
        // Special handling for phone numbers - normalize to string and remove ' prefix if present
        if (header === 'soDienThoai') {
          if (typeof value === 'number') {
            // If Google Sheets converted to number, pad with leading zero if needed
            value = value.toString().padStart(10, '0');
          } else if (typeof value === 'string') {
            // Remove ' prefix if present (from our formatting)
            value = value.replace(/^'/, '');
            // If it's a number string without leading zero, pad it
            if (/^\d{9,10}$/.test(value) && !value.startsWith('0')) {
              value = '0' + value;
            }
          }
        }
        
        // Don't parse password hashes
        if (typeof value === 'string' && 
            (value.startsWith('[') || value.startsWith('{')) &&
            !value.startsWith('$2a$') && !value.startsWith('$2b$')) {
          try {
            obj[header] = JSON.parse(value);
          } catch {
            obj[header] = value;
          }
        } else {
          obj[header] = value;
        }
      });
    }
    
    return obj;
  }

  private matchesQuery(row: GoogleSpreadsheetRow, query: QueryFilter): boolean {
    return Object.keys(query).every(key => {
      const rowValue = row.get(key);
      const queryValue = query[key];
      
      if (typeof queryValue === 'object' && queryValue !== null) {
        // Handle MongoDB-like operators
        if (queryValue.$eq) return rowValue === queryValue.$eq;
        if (queryValue.$ne) return rowValue !== queryValue.$ne;
        if (queryValue.$in) return queryValue.$in.includes(rowValue);
        if (queryValue.$nin) return !queryValue.$nin.includes(rowValue);
        if (queryValue.$regex) return new RegExp(queryValue.$regex as string, queryValue.$options || '').test(String(rowValue || ''));
      }
      
      // Case-insensitive comparison for email field
      if (key === 'email' && typeof rowValue === 'string' && typeof queryValue === 'string') {
        const rowEmailLower = rowValue.toLowerCase().trim();
        const queryEmailLower = queryValue.toLowerCase().trim();
        const match = rowEmailLower === queryEmailLower;
        return match;
      }
      
      // Normalize phone numbers for comparison
      if (key === 'soDienThoai') {
        const normalizePhone = (phone: any): string => {
          if (typeof phone === 'number') {
            return phone.toString().padStart(10, '0');
          }
          const phoneStr = String(phone || '').replace(/^'/, '').replace(/\D/g, '');
          // If it's 9-10 digits without leading zero, add it
          if (/^\d{9,10}$/.test(phoneStr) && !phoneStr.startsWith('0')) {
            return '0' + phoneStr;
          }
          return phoneStr;
        };
        const normalizedRow = normalizePhone(rowValue);
        const normalizedQuery = normalizePhone(queryValue);
        return normalizedRow === normalizedQuery;
      }
      
      // For other fields, do exact match
      const match = rowValue === queryValue;
      return match;
    });
  }

  private async ensureHeaders(sheet: { headerValues: string[]; setHeaderRow: (headers: string[]) => Promise<void>; loadHeaderRow: () => Promise<void> }, headers: string[]) {
    // Always try to load header row first
    try {
      await sheet.loadHeaderRow();
    } catch {
      // If no header row exists, create one with all headers
      await sheet.setHeaderRow(headers);
      return;
    }
    
    // Now check if we need to add new headers
    const currentHeaders = sheet.headerValues || [];
    const newHeaders = headers.filter(h => !currentHeaders.includes(h));
    
    if (newHeaders.length > 0) {
      await sheet.setHeaderRow([...currentHeaders, ...newHeaders]);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // MongoDB-like aggregation (simplified)
  async aggregate(collection: string, pipeline: AggregationPipeline[]): Promise<DatabaseDocument[]> {
    // Basic implementation - can be extended
    let data = await this.find(collection);
    
    for (const stage of pipeline) {
      if (stage.$match) {
        data = data.filter(item => this.matchesQuery({ get: (key: string) => item[key] } as GoogleSpreadsheetRow, stage.$match!));
      }
      if (stage.$sort) {
        const [sortKey, sortOrder] = Object.entries(stage.$sort)[0] as [string, number];
        data.sort((a, b) => {
          const aVal = a[sortKey] as string | number;
          const bVal = b[sortKey] as string | number;
          return sortOrder === 1 ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
      }
      if (stage.$limit) {
        data = data.slice(0, stage.$limit);
      }
    }
    
    return data;
  }
}

// Validate Google Sheets environment variables
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (!spreadsheetId || !clientEmail || !privateKey) {
  console.warn('⚠️ Google Sheets configuration missing.');
  console.warn('Please add GOOGLE_SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY to your .env.local file');
  console.warn('See database-templates/README.md for setup instructions');
}

// Singleton instance
let gsdb: GoogleSheetsDB | null = null;

export default function connectGoogleSheets(): GoogleSheetsDB {
  if (!gsdb) {
    if (!spreadsheetId || !clientEmail || !privateKey) {
      throw new Error('Google Sheets configuration is missing. Please check your .env.local file.');
    }

    // Clean up private key - remove quotes, fix newlines, trim whitespace
    let cleanedPrivateKey = privateKey;
    
    // Debug: Log original key info (first/last 50 chars only for security)
    console.log('🔍 Original private key length:', cleanedPrivateKey.length);
    if (cleanedPrivateKey.length > 0) {
      console.log('🔍 First 50 chars:', cleanedPrivateKey.substring(0, 50));
      console.log('🔍 Last 50 chars:', cleanedPrivateKey.substring(Math.max(0, cleanedPrivateKey.length - 50)));
    }
    
    // Remove surrounding quotes if present
    if ((cleanedPrivateKey.startsWith('"') && cleanedPrivateKey.endsWith('"')) ||
        (cleanedPrivateKey.startsWith("'") && cleanedPrivateKey.endsWith("'"))) {
      cleanedPrivateKey = cleanedPrivateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');
    
    // Trim whitespace (but preserve internal newlines)
    cleanedPrivateKey = cleanedPrivateKey.trim();
    
    // Remove any leading/trailing whitespace from each line
    const lines = cleanedPrivateKey.split('\n');
    cleanedPrivateKey = lines.map(line => line.trim()).join('\n');
    
    // Check if private key seems corrupted (contains other env vars)
    if (cleanedPrivateKey.includes('CLOUDINARY') || 
        cleanedPrivateKey.includes('NEXTAUTH') ||
        cleanedPrivateKey.includes('=') && !cleanedPrivateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ Private key appears to be corrupted or incorrectly formatted in .env.local');
      console.error('   It may contain other environment variables or be missing quotes.');
      console.error('   Please ensure GOOGLE_PRIVATE_KEY is properly quoted in .env.local:');
      console.error('   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
      throw new Error('Invalid GOOGLE_PRIVATE_KEY format. The key appears to be corrupted or incorrectly formatted.');
    }
    
    // Validate private key format
    if (!cleanedPrivateKey.includes('BEGIN PRIVATE KEY') || !cleanedPrivateKey.includes('END PRIVATE KEY')) {
      console.error('❌ Invalid GOOGLE_PRIVATE_KEY format');
      console.error('   Must include BEGIN PRIVATE KEY and END PRIVATE KEY markers.');
      throw new Error('Invalid GOOGLE_PRIVATE_KEY format. Must include BEGIN PRIVATE KEY and END PRIVATE KEY markers.');
    }
    
    console.log('✅ Cleaned private key length:', cleanedPrivateKey.length);

    const config = {
      spreadsheetId,
      clientEmail,
      privateKey: cleanedPrivateKey,
    };
    
    gsdb = new GoogleSheetsDB(config);
  }
  
  return gsdb;
}