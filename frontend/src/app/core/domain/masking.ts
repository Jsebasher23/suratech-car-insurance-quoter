/** US-03-AC-02 — keep the last N alphanumerics, mask the rest, keep separators. */
export const VISIBLE_DOCUMENT_CHARS = 3;
export const MASK_CHAR = '•';

export function maskDocument(value: string, visible = VISIBLE_DOCUMENT_CHARS): string {
  const total = (value.match(/[a-z0-9]/gi) ?? []).length;
  const keepFrom = total <= visible ? Infinity : total - visible;
  let seen = 0;
  return value.replace(/[a-z0-9]/gi, (ch) => (seen++ >= keepFrom ? ch : MASK_CHAR));
}
