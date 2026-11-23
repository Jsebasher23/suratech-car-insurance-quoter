import { QUOTE_NUMBER_PATTERN, generateQuoteNumber } from './quote-number';

describe('generateQuoteNumber', () => {
  it('US-03-AC-09 follows CC-YYYYMMDD-XXXXXX', () => {
    const n = generateQuoteNumber('co', new Date(2026, 10, 22), () => 0);
    expect(n).toBe('CO-20261122-AAAAAA');
    expect(QUOTE_NUMBER_PATTERN.test(generateQuoteNumber('CL', new Date()))).toBe(true);
  });
});
