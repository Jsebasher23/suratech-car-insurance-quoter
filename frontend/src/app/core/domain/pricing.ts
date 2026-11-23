import { completedYears, parseIsoDate } from './dates';
import { FormFieldConfig, FormValues, Plan } from './models';

/** ADR-0007 — documented simulated pricing rule. */
export interface PriceFactor {
  id: 'vehicleAge' | 'driverAge';
  /** years used to pick the bracket */
  years: number;
  factor: number;
}

export interface PricedPlan extends Plan {
  finalPrice: number;
  factors: PriceFactor[];
}

export function vehicleAgeFactor(age: number): number {
  if (age <= 1) return 0.95;
  if (age <= 5) return 1.0;
  if (age <= 10) return 1.1;
  return 1.25;
}

export function driverAgeFactor(age: number): number {
  if (age < 25) return 1.2;
  if (age < 65) return 1.0;
  return 1.1;
}

export const roundTo100 = (n: number): number => Math.round(n / 100) * 100;

const valueByRole = (fields: FormFieldConfig[], values: FormValues, role: FormFieldConfig['role']): unknown => {
  const f = fields.find((x) => x.role === role);
  return f ? values[f.key] : undefined;
};

/** Factors applicable to this quote. Missing data → factor not applied (= 1.0). */
export function priceFactors(fields: FormFieldConfig[], values: FormValues, today: Date): PriceFactor[] {
  const out: PriceFactor[] = [];
  const year = valueByRole(fields, values, 'vehicleYear');
  if (typeof year === 'number' && Number.isInteger(year)) {
    const age = Math.max(0, today.getFullYear() - year);
    out.push({ id: 'vehicleAge', years: age, factor: vehicleAgeFactor(age) });
  }
  const birth = parseIsoDate(valueByRole(fields, values, 'birthDate'));
  if (birth) {
    const age = completedYears(birth, today);
    out.push({ id: 'driverAge', years: age, factor: driverAgeFactor(age) });
  }
  return out;
}

export function finalPrice(basePrice: number, factors: PriceFactor[]): number {
  return roundTo100(factors.reduce((acc, f) => acc * f.factor, basePrice));
}

export function pricePlans(plans: Plan[], fields: FormFieldConfig[], values: FormValues, today: Date): PricedPlan[] {
  const factors = priceFactors(fields, values, today);
  return plans.map((p) => ({ ...p, factors, finalPrice: finalPrice(p.basePrice, factors) }));
}
