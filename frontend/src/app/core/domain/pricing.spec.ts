import { CO_FIELDS, CO_PLANS, TODAY, VALID_CO_VALUES } from '../../../testing/fixtures';
import { driverAgeFactor, finalPrice, priceFactors, pricePlans, vehicleAgeFactor } from './pricing';

describe('pricing (ADR-0007)', () => {
  it.each([
    [0, 0.95], [1, 0.95], [2, 1], [5, 1], [6, 1.1], [10, 1.1], [11, 1.25], [20, 1.25],
  ])('US-02-AC-09 vehicle age %s → factor %s', (age, f) => expect(vehicleAgeFactor(age)).toBe(f));

  it.each([
    [18, 1.2], [24, 1.2], [25, 1], [64, 1], [65, 1.1],
  ])('US-02-AC-09 driver age %s → factor %s', (age, f) => expect(driverAgeFactor(age)).toBe(f));

  it('US-02-AC-09 applies both factors and rounds to the nearest 100', () => {
    // vehicle 2012 → 14 y → 1.25 ; driver born 2004-01-01 → 22 y → 1.2
    const values = { ...VALID_CO_VALUES, vehicleYear: 2012, birthDate: '2004-01-01' };
    const factors = priceFactors(CO_FIELDS, values, TODAY);
    expect(factors.map((f) => f.factor)).toEqual([1.25, 1.2]);
    expect(finalPrice(89900, factors)).toBe(134900); // 89 900 × 1.5 = 134 850 → 134 900
  });

  it('US-02-AC-09 missing role data → base price (factor 1.0)', () => {
    const plans = pricePlans(CO_PLANS, [], {}, TODAY);
    expect(plans.map((p) => p.finalPrice)).toEqual([89900, 149900, 239900]);
    expect(plans[0].factors).toEqual([]);
  });

  it('US-02-AC-09 uses roles, not keys (business can rename keys)', () => {
    const renamed = CO_FIELDS.map((f) => (f.role === 'vehicleYear' ? { ...f, key: 'anioModelo' } : f));
    const factors = priceFactors(renamed, { anioModelo: 2026, birthDate: '1990-05-17' }, TODAY);
    expect(factors.find((f) => f.id === 'vehicleAge')?.factor).toBe(0.95);
  });
});
