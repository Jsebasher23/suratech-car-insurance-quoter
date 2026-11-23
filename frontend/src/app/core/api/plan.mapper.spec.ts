import { mapPlans } from './plan.mapper';
import { PlanDto } from './strapi.types';

const dto = (p: Partial<PlanDto> & Pick<PlanDto, 'code'>): PlanDto => ({
  id: 1, documentId: p.code, name: p.code, basePrice: '1000', currency: 'COP', order: 0, recommended: false, active: true, ...p,
});

describe('mapPlans', () => {
  it('US-02-AC-02 sorts by order then name', () => {
    const out = mapPlans([dto({ code: 'C', order: 2 }), dto({ code: 'B', name: 'Beta', order: 1 }), dto({ code: 'A', name: 'Alfa', order: 1 })], 'COP');
    expect(out.map((p) => p.code)).toEqual(['A', 'B', 'C']);
  });

  it('US-02-AC-04 highlights only the first recommended plan by order', () => {
    const out = mapPlans([dto({ code: 'X', order: 3, recommended: true }), dto({ code: 'Y', order: 1, recommended: true })], 'COP');
    expect(out.map((p) => [p.code, p.highlighted])).toEqual([['Y', true], ['X', false]]);
  });

  it('US-02-AC-10 drops plans whose currency is not the country currency', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const out = mapPlans([dto({ code: 'OK' }), dto({ code: 'BAD', currency: 'CLP' })], 'COP');
    expect(out.map((p) => p.code)).toEqual(['OK']);
  });

  it('US-02-AC-01 defensively drops inactive plans and parses decimal prices', () => {
    const out = mapPlans([dto({ code: 'OFF', active: false }), dto({ code: 'ON', basePrice: '149900.00' })], 'COP');
    expect(out).toHaveLength(1);
    expect(out[0].basePrice).toBe(149900);
  });
});
