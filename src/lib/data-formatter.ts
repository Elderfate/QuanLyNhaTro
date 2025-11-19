import { parsePhoneNumber } from 'libphonenumber-js';
import { format, parse, isValid } from 'date-fns';

// ===== PHONE NUMBER FORMATTING =====
export const formatPhoneNumber = (phone: string): string => {
  try {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add +84 prefix if needed (Vietnamese numbers)
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '84' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('84')) {
      formattedPhone = '84' + cleanPhone;
    }
    
    const phoneNumber = parsePhoneNumber('+' + formattedPhone);
    return phoneNumber.isValid() ? phoneNumber.formatInternational() : phone;
  } catch {
    return phone;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '84' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('84')) {
      formattedPhone = '84' + cleanPhone;
    }
    
    const phoneNumber = parsePhoneNumber('+' + formattedPhone);
    return phoneNumber.isValid();
  } catch {
    return false;
  }
};

// ===== DATE FORMATTING =====
export const formatDate = (dateInput: string | Date): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return isValid(date) ? format(date, 'dd/MM/yyyy') : '';
  } catch {
    return '';
  }
};

export const formatDateTime = (dateInput: string | Date): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : '';
  } catch {
    return '';
  }
};

export const parseDate = (dateString: string): Date | null => {
  try {
    // Try different date formats
    const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(dateString, fmt, new Date());
        if (isValid(parsed)) return parsed;
      } catch {
        continue;
      }
    }
    
    // Try native Date parsing
    const nativeDate = new Date(dateString);
    return isValid(nativeDate) ? nativeDate : null;
  } catch {
    return null;
  }
};

export const validateDate = (dateString: string): boolean => {
  return parseDate(dateString) !== null;
};

// ===== CCCD FORMATTING =====
export const formatCCCD = (cccd: string): string => {
  // Remove all non-digit characters
  const cleanCCCD = cccd.replace(/\D/g, '');
  
  // Format as XXX XXX XXX (12 digits)
  if (cleanCCCD.length === 12) {
    return cleanCCCD.replace(/(\d{3})(\d{3})(\d{6})/, '$1 $2 $3');
  }
  
  return cleanCCCD;
};

export const validateCCCD = (cccd: string): boolean => {
  const cleanCCCD = cccd.replace(/\D/g, '');
  return cleanCCCD.length === 12 && /^\d{12}$/.test(cleanCCCD);
};

// ===== PRICE/MONEY FORMATTING =====
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbols and spaces, keep only digits and decimal points
  const cleanString = currencyString.replace(/[^\d.,]/g, '');
  const number = parseFloat(cleanString.replace(/,/g, ''));
  return isNaN(number) ? 0 : number;
};

// ===== TEXT FORMATTING =====
export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatAddress = (address: string): string => {
  return capitalizeWords(address.trim());
};

// ===== ROOM CODE FORMATTING =====
export const formatRoomCode = (roomCode: string): string => {
  // Remove spaces and convert to uppercase
  const clean = roomCode.replace(/\s/g, '').toUpperCase();
  
  // Format as letter + numbers (e.g., A101, B205)
  const match = clean.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return match[1] + match[2].padStart(3, '0'); // A001, B205
  }
  
  return clean;
};

export const validateRoomCode = (roomCode: string): boolean => {
  const clean = roomCode.replace(/\s/g, '').toUpperCase();
  return /^[A-Z]+\d+$/.test(clean);
};

// ===== CONTRACT CODE FORMATTING =====
export const generateContractCode = (buildingCode: string, roomCode: string): string => {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  
  const building = buildingCode.replace(/\s/g, '').toUpperCase().slice(0, 3);
  const room = roomCode.replace(/\s/g, '').toUpperCase().slice(-3);
  
  return `HD${building}${room}${year}${month}`;
};

// ===== EMAIL FORMATTING =====
export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ===== VALIDATION HELPERS =====
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export const createValidationError = (field: string, message: string, value?: any): ValidationError => ({
  field,
  message,
  value
});

// ===== UTILITY FUNCTIONS =====
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  return `${safeName}_${timestamp}.${extension}`;
};