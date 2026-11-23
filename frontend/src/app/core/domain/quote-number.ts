const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** US-03-AC-09 — `CC-YYYYMMDD-XXXXXX` (simulated quote number). */
export function generateQuoteNumber(countryCode: string, date: Date, random: () => number = Math.random): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const ymd = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return `${countryCode.toUpperCase()}-${ymd}-${suffix}`;
}

export const QUOTE_NUMBER_PATTERN = /^[A-Z]{2}-\d{8}-[A-Z0-9]{6}$/;
