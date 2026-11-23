/** Date helpers that work on the user's *local* calendar (US-01 R2). */

/** Parses `YYYY-MM-DD` as a local date. Returns null for anything else. */
export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  // reject overflow like 2023-02-31
  return date.getFullYear() === y && date.getMonth() === mo && date.getDate() === d ? date : null;
}

/** Completed years between `birth` and `today` (birthday today counts as completed). */
export function completedYears(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age;
}

export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
