const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Load config from .env.local or JSON file
function loadConfig() {
  // Try to load from JSON file first (if exists)
  const jsonFiles = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.json') && f.includes('quanly'));
  if (jsonFiles.length > 0) {
    const jsonPath = path.join(__dirname, '..', jsonFiles[0]);
    console.log(`📄 Loading config from: ${jsonFiles[0]}`);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    // Also need spreadsheet ID from .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    let spreadsheetId = null;
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/GOOGLE_SPREADSHEET_ID=([^\s]+)/);
      if (match) {
        spreadsheetId = match[1];
      }
    }
    
    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SPREADSHEET_ID not found in .env.local');
      console.error('Please add GOOGLE_SPREADSHEET_ID to .env.local');
      process.exit(1);
    }
    
    return {
      spreadsheetId,
      clientEmail: jsonData.client_email,
      privateKey: jsonData.private_key
    };
  }
  
  // Fallback to .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  // Simple parser for .env.local
  const lines = envContent.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inQuotes = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (!inQuotes && trimmed.includes('=')) {
      if (currentKey) {
        env[currentKey] = currentValue.trim();
      }
      const eqIndex = trimmed.indexOf('=');
      currentKey = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();
      
      if (value.startsWith('"')) {
        inQuotes = true;
        value = value.substring(1);
        if (value.endsWith('"') && value.length > 1) {
          env[currentKey] = value.substring(0, value.length - 1);
          currentKey = null;
          currentValue = '';
          continue;
        }
      }
      currentValue = value;
    } else if (inQuotes) {
      if (trimmed.endsWith('"')) {
        currentValue += '\n' + trimmed.substring(0, trimmed.length - 1);
        env[currentKey] = currentValue.trim();
        currentKey = null;
        currentValue = '';
        inQuotes = false;
      } else {
        currentValue += '\n' + trimmed;
      }
    } else if (currentKey) {
      currentValue += ' ' + trimmed;
    }
  }
  
  if (currentKey) {
    env[currentKey] = currentValue.trim();
  }
  
  return {
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };
}

const config = loadConfig();
const { spreadsheetId, clientEmail, privateKey } = config;

if (!spreadsheetId || !clientEmail || !privateKey) {
  console.error('❌ Missing Google Sheets configuration');
  console.error('Please check: GOOGLE_SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
  console.error('Or provide a JSON key file in project root');
  process.exit(1);
}

// CSV files to upload (mapping: filename -> sheet name)
const csvFiles = [
  { file: 'NguoiDung.csv', sheet: 'NguoiDung' },
  { file: 'ToaNha.csv', sheet: 'ToaNha' },
  { file: 'Phong.csv', sheet: 'Phong' },
  { file: 'KhachThue.csv', sheet: 'KhachThue' },
  { file: 'HopDong.csv', sheet: 'HopDong' },
  { file: 'HoaDon.csv', sheet: 'HoaDon' },
  { file: 'ThanhToan.csv', sheet: 'ThanhToan' },
  { file: 'ChiSoDienNuoc.csv', sheet: 'ChiSoDienNuoc' },
  { file: 'SuCo.csv', sheet: 'SuCo' },
  { file: 'ThongBao.csv', sheet: 'ThongBao' },
];

// Parse CSV to array of objects (handles quoted values with commas)
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  
  // Parse headers
  const headerLine = lines[0];
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim());
  
  const rows = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = [];
    current = '';
    inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    // Only add row if it has the correct number of columns
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        row[header] = value;
      });
      rows.push(row);
    } else {
      console.warn(`   ⚠️  Row ${i} has ${values.length} columns, expected ${headers.length}. Skipping.`);
    }
  }
  
  return { headers, rows };
}

async function uploadCSVToSheet(doc, csvFilePath, sheetName) {
  try {
    console.log(`\n📤 Uploading ${path.basename(csvFilePath)} to sheet "${sheetName}"...`);
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const { headers, rows } = parseCSV(csvContent);
    
    if (rows.length === 0) {
      console.log(`⚠️  No data found in ${csvFilePath}`);
      return;
    }
    
    // Get or create sheet
    let sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
      console.log(`   Creating new sheet "${sheetName}"...`);
      sheet = await doc.addSheet({ 
        title: sheetName,
        headerValues: headers
      });
      // Resize sheet after creation if needed
      await sheet.loadCells();
      if (sheet.columnCount < headers.length) {
        await sheet.resize({ columnCount: Math.max(headers.length, 30) });
      }
    } else {
      console.log(`   Sheet "${sheetName}" already exists, updating...`);
      // Resize sheet if needed
      await sheet.loadCells();
      if (sheet.columnCount < headers.length) {
        await sheet.resize({ columnCount: Math.max(headers.length, 30) });
      }
      // Clear existing data
      await sheet.clear();
      // Update headers
      await sheet.setHeaderRow(headers);
    }
    
    // Add rows
    if (rows.length > 0) {
      console.log(`   Adding ${rows.length} row(s)...`);
      await sheet.addRows(rows);
    }
    
    console.log(`✅ Successfully uploaded ${rows.length} row(s) to "${sheetName}"`);
    
  } catch (error) {
    console.error(`❌ Error uploading ${csvFilePath}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting CSV upload to Google Sheets...\n');
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
    console.log(`👤 Service Account: ${clientEmail}\n`);
    
    // Initialize Google Sheets
    const doc = new GoogleSpreadsheet(spreadsheetId, new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    }));
    
    // Load document info
    await doc.loadInfo();
    console.log(`📄 Connected to: "${doc.title}"\n`);
    
    // Upload each CSV file
    const templatesDir = path.join(__dirname, '..', 'database-templates');
    
    for (const { file, sheet } of csvFiles) {
      const csvPath = path.join(templatesDir, file);
      
      if (!fs.existsSync(csvPath)) {
        console.log(`⚠️  File not found: ${csvPath}`);
        continue;
      }
      
      await uploadCSVToSheet(doc, csvPath, sheet);
    }
    
    console.log('\n✨ All CSV files uploaded successfully!');
    console.log(`\n🔗 View your spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    if (error.response) {
      console.error('   Details:', error.response.data);
    }
    process.exit(1);
  }
}

main();

