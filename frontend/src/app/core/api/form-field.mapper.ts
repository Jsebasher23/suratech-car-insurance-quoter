import {
  FIELD_TYPES,
  FieldRole,
  FieldSection,
  FieldType,
  FieldValidation,
  FormFieldConfig,
  NamedValidator,
  SECTIONS,
} from '../domain/models';
import { FormFieldDto, ValidationDto } from './strapi.types';

const NAMED: readonly NamedValidator[] = ['rut', 'co-document', 'plate-co', 'plate-cl', 'email', 'phone'];

const num = (v: number | string | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function mapValidation(dto: ValidationDto | null | undefined): FieldValidation {
  if (!dto) return {};
  const out: FieldValidation = {
    minLength: num(dto.minLength),
    maxLength: num(dto.maxLength),
    min: num(dto.min),
    max: num(dto.max),
    pattern: dto.pattern || undefined,
    minYearOffset: num(dto.minYearOffset),
    maxYearOffset: num(dto.maxYearOffset),
    minAgeYears: num(dto.minAgeYears),
    validator: NAMED.includes(dto.validator as NamedValidator) ? (dto.validator as NamedValidator) : undefined,
  };
  // drop undefined keys for cleaner equality in tests
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as FieldValidation;
}

const sectionRank = (s: FieldSection) => SECTIONS.indexOf(s);

/**
 * US-01-AC-02 sort: section (policyholder → vehicle), then order, then key.
 * US-01-AC-14 unsupported types are skipped with a warning (no user values logged).
 */
export function mapFormFields(dtos: FormFieldDto[]): FormFieldConfig[] {
  const out: FormFieldConfig[] = [];
  const seen = new Set<string>();
  for (const d of dtos) {
    if (!FIELD_TYPES.includes(d.type as FieldType)) {
      console.warn(`[form] Skipping field "${d.key}": unsupported type "${d.type}"`);
      continue;
    }
    if (seen.has(d.key)) {
      console.warn(`[form] Skipping duplicated field key "${d.key}"`);
      continue;
    }
    seen.add(d.key);
    const section = SECTIONS.includes(d.section as FieldSection) ? (d.section as FieldSection) : 'policyholder';
    out.push({
      key: d.key,
      label: d.label,
      type: d.type as FieldType,
      section,
      role: (d.role ?? 'none') as FieldRole,
      required: d.required ?? false,
      order: d.order ?? 0,
      placeholder: d.placeholder ?? undefined,
      helpText: d.helpText ?? undefined,
      errorMessage: d.errorMessage ?? undefined,
      requiredMessage: d.requiredMessage ?? undefined,
      validation: mapValidation(d.validation),
      options: (d.options ?? []).map((o) => ({ value: o.value, label: o.label })),
    });
  }
  return out.sort(
    (a, b) => sectionRank(a.section) - sectionRank(b.section) || a.order - b.order || a.key.localeCompare(b.key),
  );
}
