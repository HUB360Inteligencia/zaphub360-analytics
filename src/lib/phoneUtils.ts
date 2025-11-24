// Utility functions for phone number handling with country codes (DDI)

export interface DDIOption {
  code: string;
  country: string;
  flag: string;
}

export const DDI_OPTIONS: DDIOption[] = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'EUA/Canadá', flag: '🇺🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
];

/**
 * Normalize phone number by removing non-digit characters
 */
export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Combine DDI and phone number into MSISDN format
 * Example: combineDDIAndPhone('+55', '(11) 99999-8888') => '5511999998888'
 */
export const combineDDIAndPhone = (ddi: string, phone: string): string => {
  const cleanDDI = ddi.replace(/\D/g, '');
  const cleanPhone = normalizePhone(phone);
  return cleanDDI + cleanPhone;
};

/**
 * Format phone number with mask (DD) XXXXX-XXXX
 */
export const formatPhoneBR = (value: string): string => {
  const digits = normalizePhone(value);
  
  if (digits.length <= 2) {
    return digits;
  }
  
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  
  if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  
  // Limit to 11 digits
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Format birthday with mask DD/MM or DD/MM/YYYY
 */
export const formatBirthday = (value: string): string => {
  const digits = normalizePhone(value);
  
  if (digits.length <= 2) {
    return digits;
  }
  
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  
  // Limit to 8 digits (DD/MM/YYYY)
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

/**
 * Validate Brazilian phone number (10 or 11 digits)
 */
export const isValidBRPhone = (phone: string): boolean => {
  const digits = normalizePhone(phone);
  return digits.length === 10 || digits.length === 11;
};
