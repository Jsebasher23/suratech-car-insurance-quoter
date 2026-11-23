import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldConfig, FormValues } from './models';
import { ValidationContext, buildValidators } from './validators';

export type DynamicFormGroup = FormGroup<Record<string, FormControl<unknown>>>;

/**
 * US-01 G-09 — values saved for a field that no longer exists are dropped (not in the group);
 * values incompatible with the current config are reset.
 */
export function sanitizeInitialValue(field: FormFieldConfig, value: unknown): unknown {
  switch (field.type) {
    case 'checkbox':
      return value === true;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    case 'select':
      return typeof value === 'string' && field.options.some((o) => o.value === value) ? value : null;
    default:
      return typeof value === 'string' ? value : '';
  }
}

/** US-01-AC-05 — builds a typed reactive form for ANY field configuration coming from Strapi. */
export function buildFormGroup(fields: FormFieldConfig[], values: FormValues, ctx: ValidationContext): DynamicFormGroup {
  const controls: Record<string, FormControl<unknown>> = {};
  for (const f of fields) {
    controls[f.key] = new FormControl<unknown>(sanitizeInitialValue(f, values[f.key]), {
      validators: buildValidators(f, ctx),
    });
  }
  return new FormGroup(controls);
}
