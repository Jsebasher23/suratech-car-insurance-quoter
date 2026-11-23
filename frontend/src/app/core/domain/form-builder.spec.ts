import { CO_FIELDS, TODAY, VALID_CO_VALUES, field } from '../../../testing/fixtures';
import { buildFormGroup } from './form-builder';

const ctx = { today: TODAY, legalAge: 18 };

describe('buildFormGroup', () => {
  it('US-01-AC-05 builds a control for ANY configured field without code changes', () => {
    const newField = field({ key: 'licenseSince', type: 'date', required: true });
    const fg = buildFormGroup([...CO_FIELDS, newField], {}, ctx);
    expect(Object.keys(fg.controls)).toContain('licenseSince');
    expect(fg.controls['licenseSince'].hasError('required')).toBe(true);
  });

  it('US-01-AC-06 restores saved values and is valid with valid data', () => {
    const fg = buildFormGroup(CO_FIELDS, VALID_CO_VALUES, ctx);
    expect(fg.getRawValue()).toEqual(VALID_CO_VALUES);
    expect(fg.valid).toBe(true);
  });

  it('US-01 G-09 drops values of removed fields and resets options that no longer exist', () => {
    const fg = buildFormGroup(CO_FIELDS, { ...VALID_CO_VALUES, removedField: 'x', documentType: 'PASSPORT' }, ctx);
    expect(fg.getRawValue()).not.toHaveProperty('removedField');
    expect(fg.controls['documentType'].value).toBeNull();
  });
});
