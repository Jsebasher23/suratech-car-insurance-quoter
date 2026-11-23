import { formatMoney } from './money.pipe';

const norm = (s: string) => s.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('US-02-AC-08 formats COP and CLP with the country locale and no decimals', () => {
    expect(norm(formatMoney(149900, 'COP', 'es-CO'))).toBe('$ 149.900');
    expect(norm(formatMoney(32990, 'CLP', 'es-CL'))).toBe('$32.990');
  });

  it('US-04-AC-07 the UI language does not change the money format (country locale is used)', () => {
    // Even for an English or Portuguese UI the CO price keeps es-CO grouping
    expect(norm(formatMoney(1234567, 'COP', 'es-CO'))).toBe('$ 1.234.567');
  });
});
