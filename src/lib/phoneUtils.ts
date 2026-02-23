/**
 * Validate a French phone number (mobile or landline)
 */
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '');
  // French mobile: 06/07, local format or E.164
  const patterns = [
    /^0[67]\d{8}$/, // 06/07XXXXXXXX
    /^0[1-9]\d{8}$/, // 0X XXXXXXXX (landline)
    /^\+33[67]\d{8}$/, // +336/+337XXXXXXXX
    /^\+33[1-9]\d{8}$/, // +33XXXXXXXXX
    /^0033[67]\d{8}$/, // 00336/00337XXXXXXXX
    /^0033[1-9]\d{8}$/, // 0033XXXXXXXXX
  ];
  return patterns.some(p => p.test(cleaned));
}

/**
 * Convert a French phone number to E.164 format (+33XXXXXXXXX)
 */
export function toE164(phone: string): string | null {
  const cleaned = phone.replace(/[\s.\-()]/g, '');

  // Already E.164 French
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // 0033 prefix
  if (/^0033[1-9]\d{8}$/.test(cleaned)) {
    return '+33' + cleaned.slice(4);
  }

  // 0X format (French local)
  if (/^0[1-9]\d{8}$/.test(cleaned)) {
    return '+33' + cleaned.slice(1);
  }

  return null;
}

/**
 * Format an E.164 phone number for display as French local format
 * "+33612345678" → "06 12 34 56 78"
 */
export function formatPhoneDisplay(phone: string): string {
  const e164 = toE164(phone);
  if (!e164) return phone;

  const local = '0' + e164.slice(3);
  return local.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}
