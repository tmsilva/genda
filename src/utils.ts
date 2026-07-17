/**
 * Formats a raw input string into a Brazilian phone mask:
 * (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export const formatPhone = (value: string): string => {
  if (!value) return '';
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits
  const truncated = digits.slice(0, 11);
  
  if (truncated.length <= 2) {
    return truncated.length > 0 ? `(${truncated}` : '';
  }
  if (truncated.length <= 6) {
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`;
  }
  if (truncated.length <= 10) {
    return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 6)}-${truncated.slice(6)}`;
  }
  return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`;
};

/**
 * Normalizes a phone number to be used in a WhatsApp Link (wa.me)
 * It preserves the country code if it already exists (starts with '+'),
 * or defaults to prepending '55' (Brazil) if it's a standard 10 or 11-digit local number.
 */
export const getWhatsAppNumber = (phone: string): string => {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return '55' + digits;
  }
  return digits;
};

/**
 * Formats a number to Brazilian currency (BRL) with 2 decimal places and a comma.
 * Example: 93.5 -> "93,50"
 */
export const formatPrice = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};


