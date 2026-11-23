/** Chilean RUT validation with modulo-11 check digit (US-01-AC-10). */

export function normalizeRut(raw: string): string {
  return raw.replace(/[.\s-]/g, '').toUpperCase();
}

export function rutCheckDigit(body: string): string {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  return rest === 11 ? '0' : rest === 10 ? 'K' : String(rest);
}

export function isValidRut(raw: string): boolean {
  const clean = normalizeRut(raw);
  if (!/^\d{7,8}[\dK]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return rutCheckDigit(body) === dv;
}
