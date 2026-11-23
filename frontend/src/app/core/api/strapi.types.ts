/** Raw Strapi 5 REST DTOs. Only mappers may import this file. */
export interface StrapiList<T> {
  data: T[];
  meta?: { pagination?: { total: number } };
}

interface StrapiDoc {
  id: number;
  documentId: string;
  locale?: string;
}

export interface CountryDto extends StrapiDoc {
  code: string;
  name: string;
  currency: string;
  numberLocale: string;
  legalAge: number | null;
  flag: string | null;
  order: number | null;
}

export interface ValidationDto {
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | string | null;
  max?: number | string | null;
  pattern?: string | null;
  minYearOffset?: number | null;
  maxYearOffset?: number | null;
  minAgeYears?: number | null;
  validator?: string | null;
}

export interface FormFieldDto extends StrapiDoc {
  key: string;
  label: string;
  type: string;
  section: string;
  role: string | null;
  required: boolean | null;
  order: number | null;
  placeholder?: string | null;
  helpText?: string | null;
  errorMessage?: string | null;
  requiredMessage?: string | null;
  validation?: ValidationDto | null;
  options?: { value: string; label: string }[] | null;
}

export interface PlanDto extends StrapiDoc {
  code: string;
  name: string;
  shortDescription?: string | null;
  badge?: string | null;
  basePrice: number | string;
  currency: string;
  order: number | null;
  recommended: boolean | null;
  active: boolean | null;
  coverages?: { name: string; detail?: string | null }[] | null;
  benefits?: { text: string }[] | null;
}

export interface LegalTermDto extends StrapiDoc {
  title: string;
  body: string;
  version: string;
}
