import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { completedYears, parseIsoDate } from './dates';
import { FormFieldConfig, NamedValidator } from './models';
import { isValidRut } from './rut';

/** Context that validators need but must not read from globals (testability). */
export interface ValidationContext {
  today: Date;
  legalAge: number;
}

export const isEmpty = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

/** Wraps a predicate so that empty values are left to `required`. */
const rule =
  (name: string, ok: (value: unknown) => boolean): ValidatorFn =>
  (c: AbstractControl): ValidationErrors | null =>
    isEmpty(c.value) || ok(c.value) ? null : { [name]: true };

const NAMED: Record<NamedValidator, (v: string) => boolean> = {
  rut: isValidRut,
  'co-document': (v) => /^\d{6,10}$/.test(v.trim()),
  'plate-co': (v) => /^[A-Z]{3}\d{3}$/.test(v.replace(/[\s-]/g, '').toUpperCase()),
  // New format: 4 consonants (no vowels, no M/N/Ñ/Q) + 2 digits; old format: 2 letters + 4 digits
  'plate-cl': (v) => {
    const p = v.replace(/[\s-·.]/g, '').toUpperCase();
    return /^[BCDFGHJKLPRSTVWXYZ]{4}\d{2}$/.test(p) || /^[A-Z]{2}\d{4}$/.test(p);
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  phone: (v) => /^\+?\d{7,15}$/.test(v.replace(/[\s-]/g, '')),
};

/** Compiles a CMS pattern safely and anchored (US-01 R5). Invalid regex → ignored + warning. */
export function compilePattern(source: string): RegExp | null {
  try {
    return new RegExp(`^(?:${source})$`);
  } catch {
    console.warn('[form] Ignoring invalid pattern from CMS');
    return null;
  }
}

/** Builds the typed validator list for a field from its Strapi configuration. */
export function buildValidators(field: FormFieldConfig, ctx: ValidationContext): ValidatorFn[] {
  const v = field.validation;
  const out: ValidatorFn[] = [];

  if (field.required) out.push(field.type === 'checkbox' ? Validators.requiredTrue : Validators.required);

  if (field.type === 'text') {
    if (v.minLength != null) out.push(rule('minlength', (x) => String(x).trim().length >= v.minLength!));
    if (v.maxLength != null) out.push(rule('maxlength', (x) => String(x).length <= v.maxLength!));
    if (v.pattern) {
      const re = compilePattern(v.pattern);
      if (re) out.push(rule('pattern', (x) => re.test(String(x).trim())));
    }
    if (v.validator) {
      const check = NAMED[v.validator];
      if (check) out.push(rule(v.validator, (x) => check(String(x))));
    }
  }

  if (field.type === 'number') {
    out.push(rule('number', (x) => typeof x === 'number' && Number.isFinite(x)));
    if (v.min != null) out.push(rule('min', (x) => Number(x) >= v.min!));
    if (v.max != null) out.push(rule('max', (x) => Number(x) <= v.max!));
    if (v.minYearOffset != null || v.maxYearOffset != null) {
      const year = ctx.today.getFullYear();
      const lo = year + (v.minYearOffset ?? -Infinity);
      const hi = year + (v.maxYearOffset ?? Infinity);
      out.push(rule('yearRange', (x) => Number.isInteger(x) && Number(x) >= lo && Number(x) <= hi));
    }
  }

  if (field.type === 'date') {
    out.push(rule('date', (x) => parseIsoDate(x) !== null));
    const minAge = v.minAgeYears ?? (field.role === 'birthDate' ? ctx.legalAge : undefined);
    if (minAge != null) {
      out.push(
        rule('minAge', (x) => {
          const d = parseIsoDate(x);
          return d !== null && d <= ctx.today && completedYears(d, ctx.today) >= minAge;
        }),
      );
    }
  }

  if (field.type === 'select' && field.options.length > 0) {
    const allowed = new Set(field.options.map((o) => o.value));
    out.push(rule('option', (x) => allowed.has(String(x))));
  }

  return out;
}

/** Which configured message to show for a control in error (US-01 R4). */
export function errorMessageFor(field: FormFieldConfig, control: AbstractControl): string | null {
  if (!control.errors) return null;
  const emptyRequired = control.hasError('required') || control.hasError('requiredTrue');
  if (emptyRequired && field.requiredMessage) return field.requiredMessage;
  return field.errorMessage ?? field.requiredMessage ?? null;
}
