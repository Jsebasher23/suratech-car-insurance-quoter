import { CO_FIELDS, VALID_CO_VALUES } from '../../../testing/fixtures';
import { buildSummary } from './summary';

const text = { yes: 'Sí', no: 'No', dateLocale: 'es' };

describe('buildSummary', () => {
  const sections = buildSummary(CO_FIELDS, VALID_CO_VALUES, text);
  const row = (key: string) => sections.flatMap((s) => s.rows).find((r) => r.key === key)!;

  it('US-03-AC-01 groups rows by policyholder and vehicle, keeping field order', () => {
    expect(sections.map((s) => s.section)).toEqual(['policyholder', 'vehicle']);
    expect(sections[1].rows.map((r) => r.key)).toEqual(['plate', 'vehicleYear']);
  });

  it('US-03-AC-02 masks the documentNumber role', () => {
    expect(row('documentNumber')).toMatchObject({ value: '•••••••050', masked: true });
  });

  it('US-03-AC-03 shows option labels, Yes/No and localized dates', () => {
    expect(row('documentType').value).toBe('Cédula de ciudadanía');
    expect(row('consent').value).toBe('Sí');
    expect(row('birthDate').value).toBe('17 de mayo de 1990');
  });

  it('US-03-AC-03 empty values are shown as a dash', () => {
    const s = buildSummary(CO_FIELDS, {}, text);
    expect(s[0].rows[0].value).toBe('—');
  });
});
