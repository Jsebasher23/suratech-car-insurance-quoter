import { Country, FormFieldConfig, LegalTerms, Plan } from '../app/core/domain/models';

/** Fictitious test data (CLAUDE.md §3.5). */
export const CO: Country = { code: 'CO', name: 'Colombia', currency: 'COP', numberLocale: 'es-CO', legalAge: 18, flag: '🇨🇴' };
export const CL: Country = { code: 'CL', name: 'Chile', currency: 'CLP', numberLocale: 'es-CL', legalAge: 18, flag: '🇨🇱' };

export const TODAY = new Date(2026, 10, 22); // 2026-11-22 local

export const field = (p: Partial<FormFieldConfig> & Pick<FormFieldConfig, 'key'>): FormFieldConfig => ({
  label: p.key,
  type: 'text',
  section: 'policyholder',
  role: 'none',
  required: false,
  order: 0,
  validation: {},
  options: [],
  ...p,
});

export const CO_FIELDS: FormFieldConfig[] = [
  field({ key: 'fullName', label: 'Nombre completo', role: 'fullName', required: true, order: 10, validation: { minLength: 3 }, errorMessage: 'Escribe tu nombre completo.', requiredMessage: 'El nombre es obligatorio.' }),
  field({ key: 'documentType', label: 'Tipo de documento', type: 'select', role: 'documentType', required: true, order: 20, options: [{ value: 'CC', label: 'Cédula de ciudadanía' }, { value: 'CE', label: 'Cédula de extranjería' }], errorMessage: 'Selecciona tu tipo de documento.' }),
  field({ key: 'documentNumber', label: 'Número de documento', role: 'documentNumber', required: true, order: 30, validation: { validator: 'co-document' }, errorMessage: 'El documento debe tener entre 6 y 10 dígitos.', helpText: 'Solo números.' }),
  field({ key: 'birthDate', label: 'Fecha de nacimiento', type: 'date', role: 'birthDate', required: true, order: 40, errorMessage: 'Debes tener al menos 18 años.' }),
  field({ key: 'consent', label: 'Autorizo', type: 'checkbox', required: true, order: 50, errorMessage: 'Debes autorizar.' }),
  field({ key: 'plate', label: 'Placa', section: 'vehicle', role: 'vehiclePlate', required: true, order: 10, validation: { validator: 'plate-co' }, errorMessage: 'Placa inválida.' }),
  field({ key: 'vehicleYear', label: 'Año', type: 'number', section: 'vehicle', role: 'vehicleYear', required: true, order: 20, validation: { minYearOffset: -20, maxYearOffset: 1 }, errorMessage: 'Año fuera de rango.' }),
];

export const VALID_CO_VALUES = {
  fullName: 'Ana María Pérez',
  documentType: 'CC',
  documentNumber: '1020304050',
  birthDate: '1990-05-17',
  consent: true,
  plate: 'ABC123',
  vehicleYear: 2021,
};

export const plan = (p: Partial<Plan> & Pick<Plan, 'code'>): Plan => ({
  name: p.code,
  shortDescription: '',
  basePrice: 100000,
  currency: 'COP',
  order: 0,
  highlighted: false,
  coverages: [],
  benefits: [],
  ...p,
});

export const CO_PLANS: Plan[] = [
  plan({ code: 'CO-BASIC', name: 'Básico', basePrice: 89900, order: 10 }),
  plan({ code: 'CO-PLUS', name: 'Plus', basePrice: 149900, order: 20, highlighted: true, badge: 'Recomendado' }),
  plan({ code: 'CO-FULL', name: 'Todo Riesgo', basePrice: 239900, order: 30 }),
];

export const CO_TERMS: LegalTerms = {
  title: 'Términos CO',
  version: 'CO-2026.1',
  paragraphs: ['Primer párrafo <b>sin HTML</b>.', 'Segundo párrafo.'],
};
