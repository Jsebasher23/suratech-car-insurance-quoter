import { mapFormFields } from './form-field.mapper';
import { FormFieldDto } from './strapi.types';

const dto = (p: Partial<FormFieldDto> & Pick<FormFieldDto, 'key'>): FormFieldDto => ({
  id: 1, documentId: p.key, label: p.key, type: 'text', section: 'policyholder', role: 'none', required: false, order: 0, ...p,
});

describe('mapFormFields', () => {
  it('US-01-AC-02 sorts by section (policyholder → vehicle), then order, then key', () => {
    const out = mapFormFields([
      dto({ key: 'plate', section: 'vehicle', order: 1 }),
      dto({ key: 'b', order: 20 }),
      dto({ key: 'a', order: 20 }),
      dto({ key: 'first', order: 5 }),
    ]);
    expect(out.map((f) => f.key)).toEqual(['first', 'a', 'b', 'plate']);
  });

  it('US-01-AC-07 maps select options from Strapi', () => {
    const [f] = mapFormFields([
      dto({ key: 'make', type: 'select', options: [{ value: 'MZ', label: 'Mazda' }] }),
    ]);
    expect(f.options).toEqual([{ value: 'MZ', label: 'Mazda' }]);
  });

  it('US-01-AC-14 skips unsupported field types and warns without values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const out = mapFormFields([dto({ key: 'sig', type: 'signature' }), dto({ key: 'ok' })]);
    expect(out.map((f) => f.key)).toEqual(['ok']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unsupported type "signature"'));
    warn.mockRestore();
  });

  it('maps typed validation, ignoring nulls and unknown validators', () => {
    const [f] = mapFormFields([
      dto({ key: 'y', type: 'number', validation: { minYearOffset: -20, maxYearOffset: 1, min: null, validator: 'none' } }),
    ]);
    expect(f.validation).toEqual({ minYearOffset: -20, maxYearOffset: 1 });
  });

  it('ignores duplicated keys (content error)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(mapFormFields([dto({ key: 'x' }), dto({ key: 'x' })])).toHaveLength(1);
  });
});
