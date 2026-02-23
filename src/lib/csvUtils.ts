import type { ColumnMapping, ValidationResult, CSVRow } from '../types';
import { isValidFrenchPhone, toE164 } from './phoneUtils';
import { parseCheckoutDate } from './dateUtils';

export type { CSVRow } from '../types';

export interface ParsedCSV {
  headers: string[];
  rows: CSVRow[];
}

/**
 * Parse CSV text (comma or semicolon separated, with quotes, UTF-8)
 */
export function parseCSV(text: string): ParsedCSV {
  // Detect separator
  const firstLine = text.split('\n')[0] || '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const sep = semicolonCount > commaCount ? ';' : ',';

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0], sep);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], sep);
    if (values.length === 0 || values.every(v => !v.trim())) continue;
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  result.push(current.trim());
  return result;
}

// Patterns for column detection
const COLUMN_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  first_name: [
    /^(prénom|prenom|firstname|first.?name|nom.?client|given.?name|prenom.?client)$/i
  ],
  phone: [
    /^(téléphone|telephone|phone|tel|mobile|portable|gsm|numero|numéro|sms|contact)$/i
  ],
  checkout_date: [
    /^(checkout|check.?out|départ|depart|date.?départ|date.?sortie|departure|sortie|date.?checkout|end.?date)$/i
  ],
  email: [
    /^(email|e.?mail|courriel|mail|adresse.?mail)$/i
  ],
  room_number: [
    /^(chambre|room|room.?number|numéro.?chambre|numero.?chambre|no.?chambre|chambre.?no)$/i
  ],
  nights: [
    /^(nuits|nights|nuitées|duree|durée|séjour|sejour|nb.?nuits|nombre.?nuits|length.?stay)$/i
  ],
};

/**
 * Auto-detect CSV column mapping from headers
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    first_name: null,
    phone: null,
    checkout_date: null,
    email: null,
    room_number: null,
    nights: null,
  };

  for (const header of headers) {
    const normalizedHeader = header.trim();
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (mapping[field as keyof ColumnMapping] === null) {
        if (patterns.some(p => p.test(normalizedHeader))) {
          mapping[field as keyof ColumnMapping] = normalizedHeader;
        }
      }
    }
  }

  return mapping;
}

/**
 * Validate a single guest row
 */
export function validateGuestRow(
  row: CSVRow,
  mapping: ColumnMapping,
  optOutPhones: Set<string> = new Set()
): ValidationResult {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  // First name
  const firstName = mapping.first_name ? row[mapping.first_name]?.trim() : '';
  if (!firstName) {
    errors.push('Prénom manquant');
  } else {
    data.first_name = firstName;
  }

  // Phone
  const rawPhone = mapping.phone ? row[mapping.phone]?.trim() : '';
  if (!rawPhone) {
    errors.push('Téléphone manquant');
  } else if (!isValidFrenchPhone(rawPhone)) {
    errors.push(`Téléphone invalide: ${rawPhone}`);
  } else {
    const e164 = toE164(rawPhone);
    if (!e164) {
      errors.push(`Impossible de formater le téléphone: ${rawPhone}`);
    } else {
      if (optOutPhones.has(e164)) {
        errors.push('Numéro inscrit sur liste d\'opposition (opt-out)');
      }
      data.phone = e164;
    }
  }

  // Checkout date
  const rawDate = mapping.checkout_date ? row[mapping.checkout_date]?.trim() : '';
  if (!rawDate) {
    errors.push('Date de départ manquante');
  } else {
    const parsed = parseCheckoutDate(rawDate);
    if (!parsed) {
      errors.push(`Date invalide: ${rawDate}`);
    } else {
      data.checkout_date = parsed.toISOString().split('T')[0];
    }
  }

  // Optional fields
  if (mapping.email && row[mapping.email]?.trim()) {
    data.email = row[mapping.email].trim();
  }
  if (mapping.room_number && row[mapping.room_number]?.trim()) {
    data.room_number = row[mapping.room_number].trim();
  }
  if (mapping.nights && row[mapping.nights]?.trim()) {
    const nights = parseInt(row[mapping.nights].trim());
    if (!isNaN(nights) && nights > 0) {
      data.nights = nights;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data as Partial<import('../types').Guest> : undefined,
  };
}

/**
 * Build SMS message from template and guest data
 */
export function buildSMSMessage(template: string, guest: { first_name: string; nights?: number | null; room_number?: string | null }, hotelName: string, guestId: string): string {
  const link = `avisio.app/g/${guestId}`;
  return template
    .replace('{prenom}', guest.first_name)
    .replace('{hotel}', hotelName)
    .replace('{lien}', link)
    .replace('{nuits}', guest.nights ? String(guest.nights) : '')
    .replace('{chambre}', guest.room_number || '');
}

/**
 * Count SMS segments (160 chars per segment)
 */
export function countSMSSegments(text: string): number {
  if (text.length <= 160) return 1;
  return Math.ceil(text.length / 153); // GSM7 multi-part
}
