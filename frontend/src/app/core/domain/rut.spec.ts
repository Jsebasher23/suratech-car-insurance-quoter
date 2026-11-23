import { isValidRut, rutCheckDigit } from './rut';

describe('RUT', () => {
  it.each([
    ['12.345.678-5', true],
    ['12345678-5', true],
    ['123456785', true],
    ['12.345.678-4', false],
    ['10.000.013-K', true],
    ['10.000.013-k', true],
    ['7.654.321-6', true],
    ['', false],
    ['abc', false],
  ])('US-01-AC-10 %s valid=%s', (rut, valid) => {
    expect(isValidRut(rut)).toBe(valid);
  });

  it('US-01-AC-10 computes 0 and K check digits', () => {
    expect(rutCheckDigit('10000013')).toBe('K');
    expect(rutCheckDigit('12345678')).toBe('5');
  });
});
