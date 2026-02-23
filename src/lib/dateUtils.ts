const FRENCH_MONTHS: Record<string, number> = {
  'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
  'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
  'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
  'jan': 0, 'fév': 1, 'feb': 1, 'mar': 2, 'apr': 3, 'avr': 3,
  'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
};

const ENGLISH_MONTHS: Record<string, number> = {
  'january': 0, 'february': 1, 'march': 2, 'april': 3,
  'may': 4, 'june': 5, 'july': 6, 'august': 7,
  'september': 8, 'october': 9, 'november': 10, 'december': 11,
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3,
  'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
};

/**
 * Parse checkout dates from various PMS export formats:
 * "25/02/2026", "2026-02-25", "25-Feb-2026",
 * "02/25/2026", "25.02.2026", "25 février 2026"
 */
export function parseCheckoutDate(raw: string): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    return isValidDate(d) ? d : null;
  }

  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY (European format)
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1]);
    const month = parseInt(dmyMatch[2]);
    const year = parseInt(dmyMatch[3]);
    // If day > 12, it must be DD/MM/YYYY
    if (day > 12) {
      const d = new Date(year, month - 1, day);
      return isValidDate(d) ? d : null;
    }
    // Default: DD/MM/YYYY (European)
    const d = new Date(year, month - 1, day);
    return isValidDate(d) ? d : null;
  }

  // DD-Mon-YYYY or DD Mon YYYY (e.g. "25-Feb-2026", "25 février 2026")
  const namedMatch = trimmed.match(/^(\d{1,2})[\s\-]([a-zA-ZÀ-ÿ]+)[\s\-](\d{4})$/);
  if (namedMatch) {
    const day = parseInt(namedMatch[1]);
    const monthStr = namedMatch[2].toLowerCase();
    const year = parseInt(namedMatch[3]);
    const monthIdx = FRENCH_MONTHS[monthStr] ?? ENGLISH_MONTHS[monthStr] ?? -1;
    if (monthIdx >= 0) {
      const d = new Date(year, monthIdx, day);
      return isValidDate(d) ? d : null;
    }
  }

  // Try native Date parse as fallback
  const native = new Date(trimmed);
  return isValidDate(native) ? native : null;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

export function formatDateFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}
