import { FormControl } from '@angular/forms';
import { CO_FIELDS, TODAY, field } from '../../../testing/fixtures';
import { FormFieldConfig } from './models';
import { buildValidators, compilePattern, errorMessageFor } from './validators';

const ctx = { today: TODAY, legalAge: 18 };
const control = (f: FormFieldConfig, value: unknown) => new FormControl<unknown>(value, buildValidators(f, ctx));
const year = field({ key: 'y', type: 'number', role: 'vehicleYear', validation: { minYearOffset: -20, maxYearOffset: 1 } });
const birth = field({ key: 'b', type: 'date', role: 'birthDate', validation: { minAgeYears: 18 } });

describe('validators', () => {
  describe('US-01-AC-08 vehicle year: currentYear-20 ≤ year ≤ currentYear+1 (inclusive)', () => {
    it.each([
      [2027, true], // next year
      [2028, false], // two years ahead
      [2006, true], // exactly 20 years old
      [2005, false], // 21 years old
      [2021.5, false], // not an integer
    ])('US-01-AC-08 year %s valid=%s', (value, valid) => {
      expect(control(year, value).valid).toBe(valid);
    });
  });

  describe('US-01-AC-09 legal age on the local calendar', () => {
    it.each([
      ['2008-11-22', true], // turns 18 today
      ['2008-11-23', false], // turns 18 tomorrow
      ['1990-01-01', true],
      ['2030-01-01', false], // future date
      ['2008-02-30', false], // impossible date
    ])('US-01-AC-09 born %s valid=%s', (value, valid) => {
      expect(control(birth, value).valid).toBe(valid);
    });

    it('US-01-AC-09 falls back to country.legalAge when the birthDate field has no minAgeYears', () => {
      const f = field({ key: 'b', type: 'date', role: 'birthDate' });
      const c = new FormControl<unknown>('2010-01-01', buildValidators(f, { today: TODAY, legalAge: 21 }));
      expect(c.hasError('minAge')).toBe(true);
    });
  });

  it('US-01-AC-03 required checkbox must be checked', () => {
    const f = field({ key: 'c', type: 'checkbox', required: true });
    expect(control(f, false).valid).toBe(false);
    expect(control(f, true).valid).toBe(true);
  });

  it('US-01-AC-03 select only accepts configured options', () => {
    const f = CO_FIELDS[1];
    expect(control(f, 'CC').valid).toBe(true);
    expect(control(f, 'PASSPORT').valid).toBe(false);
  });

  it.each([
    ['co-document', '1020304050', true],
    ['co-document', '12345', false],
    ['co-document', '12.345.678', false],
    ['plate-co', 'abc123', true],
    ['plate-co', 'AB1234', false],
    ['plate-cl', 'BCDF12', true],
    ['plate-cl', 'AE1234', true],
    ['plate-cl', 'AEIO12', false], // vowels are not used in the new format
    ['email', 'ana@example.com', true],
    ['email', 'ana@example', false],
  ] as const)('named validator %s(%s) → %s', (validator, value, valid) => {
    const f = field({ key: 'x', validation: { validator } });
    expect(control(f, value).valid).toBe(valid);
  });

  it('empty optional values are valid (rules only apply to non-empty values)', () => {
    const f = field({ key: 'x', validation: { pattern: '9\\d{8}', minLength: 3 } });
    expect(control(f, '').valid).toBe(true);
  });

  it('US-01 R5 patterns from the CMS are anchored', () => {
    const f = field({ key: 'x', validation: { pattern: '3\\d{9}' } });
    expect(control(f, '3001234567').valid).toBe(true);
    expect(control(f, 'xx3001234567xx').valid).toBe(false);
  });

  it('US-01 R5 an invalid regex from the CMS is ignored instead of crashing', () => {
    expect(compilePattern('([')).toBeNull();
  });

  describe('US-01-AC-03 error message selection (R4)', () => {
    const f = CO_FIELDS[0]; // has requiredMessage + errorMessage
    it('US-01-AC-03 shows requiredMessage when empty', () => {
      expect(errorMessageFor(f, control(f, ''))).toBe('El nombre es obligatorio.');
    });
    it('US-01-AC-03 shows the configured errorMessage when a rule fails', () => {
      expect(errorMessageFor(f, control(f, 'A'))).toBe('Escribe tu nombre completo.');
    });
    it('returns null for a valid control', () => {
      expect(errorMessageFor(f, control(f, 'Ana Pérez'))).toBeNull();
    });
  });
});
