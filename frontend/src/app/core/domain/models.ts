/** Domain models. Components only ever see these — never raw Strapi DTOs (CLAUDE.md §3.7). */

export const FIELD_TYPES = ['text', 'number', 'select', 'date', 'checkbox'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const SECTIONS = ['policyholder', 'vehicle'] as const;
export type FieldSection = (typeof SECTIONS)[number];

/** Semantic role of a field (ADR-0006). Logic uses roles, never keys. */
export type FieldRole =
  | 'none'
  | 'fullName'
  | 'documentType'
  | 'documentNumber'
  | 'birthDate'
  | 'email'
  | 'phone'
  | 'city'
  | 'vehicleMake'
  | 'vehicleYear'
  | 'vehiclePlate'
  | 'vehicleUse';

export type NamedValidator = 'rut' | 'co-document' | 'plate-co' | 'plate-cl' | 'email' | 'phone';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  minYearOffset?: number;
  maxYearOffset?: number;
  minAgeYears?: number;
  validator?: NamedValidator;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  section: FieldSection;
  role: FieldRole;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  requiredMessage?: string;
  validation: FieldValidation;
  options: FieldOption[];
}

/** Any ISO 4217 code; a new market's currency is content, not code (ADR-0001, RV-05). */
export type CurrencyCode = string;

export interface Country {
  code: string;
  name: string;
  currency: CurrencyCode;
  numberLocale: string;
  legalAge: number;
  flag: string;
}

export interface Coverage {
  name: string;
  detail?: string;
}

export interface Plan {
  code: string;
  name: string;
  shortDescription: string;
  badge?: string;
  basePrice: number;
  currency: CurrencyCode;
  order: number;
  /** true only for the first recommended plan by order (US-02-AC-04). */
  highlighted: boolean;
  coverages: Coverage[];
  benefits: string[];
}

export interface LegalTerms {
  title: string;
  paragraphs: string[];
  version: string;
}

export type FormValues = Record<string, unknown>;
