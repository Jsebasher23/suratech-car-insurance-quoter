/**
 * Seed data for Colombia (CO) and Chile (CL) in es / en / pt.
 * ALL DATA IS FICTITIOUS (company names, terms, people). See CLAUDE.md §3.5.
 *
 * Shape: `shared` = non-localized attributes (ADR-0002), `i18n` = localized attributes per locale.
 */
export type Locale = 'es' | 'en' | 'pt';
export const LOCALES: Locale[] = ['es', 'en', 'pt'];
export const DEFAULT_LOCALE: Locale = 'es';

type Localized<T> = Record<Locale, T>;

export interface SeedEntry<S, L> {
  shared: S;
  i18n: Localized<L>;
  publish?: boolean; // default true — false keeps a draft to prove "only published" (US-02-AC-01)
}

type Option = { value: string; label: string };
const opts = (values: string[], labels: Localized<string[]>): Localized<Option[]> => ({
  es: values.map((value, i) => ({ value, label: labels.es[i] })),
  en: values.map((value, i) => ({ value, label: labels.en[i] })),
  pt: values.map((value, i) => ({ value, label: labels.pt[i] })),
});
const same = (values: string[]): Localized<Option[]> => opts(values, { es: values, en: values, pt: values });

/* ───────────────────────────── Countries ───────────────────────────── */
export const countries: SeedEntry<
  { code: string; currency: string; numberLocale: string; legalAge: number; flag: string; order: number },
  { name: string }
>[] = [
  {
    shared: { code: 'CO', currency: 'COP', numberLocale: 'es-CO', legalAge: 18, flag: '🇨🇴', order: 10 },
    i18n: { es: { name: 'Colombia' }, en: { name: 'Colombia' }, pt: { name: 'Colômbia' } },
  },
  {
    shared: { code: 'CL', currency: 'CLP', numberLocale: 'es-CL', legalAge: 18, flag: '🇨🇱', order: 20 },
    i18n: { es: { name: 'Chile' }, en: { name: 'Chile' }, pt: { name: 'Chile' } },
  },
];

/* ───────────────────────────── Form fields ───────────────────────────── */
type FieldShared = {
  key: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  section: 'policyholder' | 'vehicle';
  role: string;
  required: boolean;
  order: number;
  validation?: Record<string, unknown>;
};
type FieldText = {
  label: string;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  requiredMessage?: string;
};
export type FieldSeed = SeedEntry<FieldShared, FieldText> & { options?: Localized<Option[]> };

const fullName = (order: number): FieldSeed => ({
  shared: { key: 'fullName', type: 'text', section: 'policyholder', role: 'fullName', required: true, order, validation: { minLength: 3, maxLength: 80 } },
  i18n: {
    es: { label: 'Nombre completo', placeholder: 'Ej. Ana María Pérez', errorMessage: 'Escribe tu nombre completo (3 a 80 caracteres).', requiredMessage: 'El nombre es obligatorio.' },
    en: { label: 'Full name', placeholder: 'e.g. Ana María Pérez', errorMessage: 'Enter your full name (3 to 80 characters).', requiredMessage: 'Name is required.' },
    pt: { label: 'Nome completo', placeholder: 'Ex. Ana María Pérez', errorMessage: 'Informe seu nome completo (3 a 80 caracteres).', requiredMessage: 'O nome é obrigatório.' },
  },
});
const birthDate = (order: number): FieldSeed => ({
  shared: { key: 'birthDate', type: 'date', section: 'policyholder', role: 'birthDate', required: true, order },
  i18n: {
    es: { label: 'Fecha de nacimiento', helpText: 'Debes ser mayor de edad para contratar.', errorMessage: 'Debes tener al menos 18 años.', requiredMessage: 'Indica tu fecha de nacimiento.' },
    en: { label: 'Date of birth', helpText: 'You must be of legal age to buy a policy.', errorMessage: 'You must be at least 18 years old.', requiredMessage: 'Enter your date of birth.' },
    pt: { label: 'Data de nascimento', helpText: 'Você precisa ser maior de idade para contratar.', errorMessage: 'Você precisa ter pelo menos 18 anos.', requiredMessage: 'Informe sua data de nascimento.' },
  },
});
const email = (order: number): FieldSeed => ({
  shared: { key: 'email', type: 'text', section: 'policyholder', role: 'email', required: true, order, validation: { validator: 'email', maxLength: 120 } },
  i18n: {
    es: { label: 'Correo electrónico', placeholder: 'nombre@ejemplo.com', helpText: 'Te enviaremos aquí la cotización.', errorMessage: 'Escribe un correo válido, por ejemplo nombre@ejemplo.com.' },
    en: { label: 'Email', placeholder: 'name@example.com', helpText: 'We will send your quote here.', errorMessage: 'Enter a valid email, for example name@example.com.' },
    pt: { label: 'E-mail', placeholder: 'nome@exemplo.com', helpText: 'Enviaremos a cotação para este e-mail.', errorMessage: 'Informe um e-mail válido, por exemplo nome@exemplo.com.' },
  },
});
const vehicleYear = (order: number): FieldSeed => ({
  shared: { key: 'vehicleYear', type: 'number', section: 'vehicle', role: 'vehicleYear', required: true, order, validation: { minYearOffset: -20, maxYearOffset: 1 } },
  i18n: {
    es: { label: 'Año del vehículo (modelo)', placeholder: 'Ej. 2021', helpText: 'Aseguramos vehículos de hasta 20 años de antigüedad.', errorMessage: 'El año debe estar entre hace 20 años y el próximo año.' },
    en: { label: 'Vehicle year (model)', placeholder: 'e.g. 2021', helpText: 'We insure vehicles up to 20 years old.', errorMessage: 'The year must be between 20 years ago and next year.' },
    pt: { label: 'Ano do veículo (modelo)', placeholder: 'Ex. 2021', helpText: 'Seguramos veículos com até 20 anos de uso.', errorMessage: 'O ano deve estar entre 20 anos atrás e o próximo ano.' },
  },
});
const vehicleUse = (order: number): FieldSeed => ({
  shared: { key: 'vehicleUse', type: 'select', section: 'vehicle', role: 'vehicleUse', required: true, order },
  i18n: {
    es: { label: 'Uso del vehículo', errorMessage: 'Selecciona el uso del vehículo.' },
    en: { label: 'Vehicle use', errorMessage: 'Select how the vehicle is used.' },
    pt: { label: 'Uso do veículo', errorMessage: 'Selecione o uso do veículo.' },
  },
  options: opts(['private', 'rideshare'], {
    es: ['Particular', 'Plataformas de transporte'],
    en: ['Private', 'Ride-hailing apps'],
    pt: ['Particular', 'Aplicativos de transporte'],
  }),
});

export const formFields: Record<string, FieldSeed[]> = {
  CO: [
    fullName(10),
    {
      shared: { key: 'documentType', type: 'select', section: 'policyholder', role: 'documentType', required: true, order: 20 },
      i18n: {
        es: { label: 'Tipo de documento', errorMessage: 'Selecciona tu tipo de documento.' },
        en: { label: 'ID document type', errorMessage: 'Select your ID document type.' },
        pt: { label: 'Tipo de documento', errorMessage: 'Selecione o tipo de documento.' },
      },
      options: opts(['CC', 'CE'], {
        es: ['Cédula de ciudadanía', 'Cédula de extranjería'],
        en: ['Citizenship ID (Cédula de ciudadanía)', 'Foreigner ID (Cédula de extranjería)'],
        pt: ['Cédula de cidadania', 'Cédula de estrangeiro'],
      }),
    },
    {
      shared: { key: 'documentNumber', type: 'text', section: 'policyholder', role: 'documentNumber', required: true, order: 30, validation: { validator: 'co-document' } },
      i18n: {
        es: { label: 'Número de documento', placeholder: '1020304050', helpText: 'Solo números, sin puntos ni espacios.', errorMessage: 'El documento debe tener entre 6 y 10 dígitos.' },
        en: { label: 'ID number', placeholder: '1020304050', helpText: 'Digits only, no dots or spaces.', errorMessage: 'The ID must have 6 to 10 digits.' },
        pt: { label: 'Número do documento', placeholder: '1020304050', helpText: 'Somente números, sem pontos ou espaços.', errorMessage: 'O documento deve ter de 6 a 10 dígitos.' },
      },
    },
    birthDate(40),
    email(50),
    {
      shared: { key: 'mobile', type: 'text', section: 'policyholder', role: 'phone', required: true, order: 60, validation: { pattern: '3\\d{9}' } },
      i18n: {
        es: { label: 'Celular', placeholder: '3001234567', helpText: '10 dígitos, empieza por 3.', errorMessage: 'Escribe un celular colombiano de 10 dígitos que empiece por 3.' },
        en: { label: 'Mobile phone', placeholder: '3001234567', helpText: '10 digits, starts with 3.', errorMessage: 'Enter a 10-digit Colombian mobile number starting with 3.' },
        pt: { label: 'Celular', placeholder: '3001234567', helpText: '10 dígitos, começa com 3.', errorMessage: 'Informe um celular colombiano de 10 dígitos começando com 3.' },
      },
    },
    {
      shared: { key: 'city', type: 'select', section: 'policyholder', role: 'city', required: true, order: 70 },
      i18n: {
        es: { label: 'Ciudad de circulación', errorMessage: 'Selecciona la ciudad donde circula el vehículo.' },
        en: { label: 'City where the car is driven', errorMessage: 'Select the city where the vehicle is driven.' },
        pt: { label: 'Cidade de circulação', errorMessage: 'Selecione a cidade onde o veículo circula.' },
      },
      options: same(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga']),
    },
    {
      shared: { key: 'dataConsent', type: 'checkbox', section: 'policyholder', role: 'none', required: true, order: 80 },
      i18n: {
        es: { label: 'Autorizo el tratamiento de mis datos personales (Ley 1581 de 2012 – Habeas Data).', errorMessage: 'Debes autorizar el tratamiento de datos para cotizar.' },
        en: { label: 'I authorize the processing of my personal data (Colombian Law 1581 of 2012 – Habeas Data).', errorMessage: 'You must authorize data processing to get a quote.' },
        pt: { label: 'Autorizo o tratamento dos meus dados pessoais (Lei colombiana 1581 de 2012 – Habeas Data).', errorMessage: 'Você deve autorizar o tratamento de dados para cotar.' },
      },
    },
    {
      shared: { key: 'plate', type: 'text', section: 'vehicle', role: 'vehiclePlate', required: true, order: 10, validation: { validator: 'plate-co' } },
      i18n: {
        es: { label: 'Placa', placeholder: 'ABC123', helpText: '3 letras y 3 números.', errorMessage: 'La placa debe tener 3 letras y 3 números, por ejemplo ABC123.' },
        en: { label: 'License plate (placa)', placeholder: 'ABC123', helpText: '3 letters and 3 digits.', errorMessage: 'The plate must have 3 letters and 3 digits, e.g. ABC123.' },
        pt: { label: 'Placa', placeholder: 'ABC123', helpText: '3 letras e 3 números.', errorMessage: 'A placa deve ter 3 letras e 3 números, por exemplo ABC123.' },
      },
    },
    {
      shared: { key: 'make', type: 'select', section: 'vehicle', role: 'vehicleMake', required: true, order: 20 },
      i18n: {
        es: { label: 'Marca', errorMessage: 'Selecciona la marca.' },
        en: { label: 'Make', errorMessage: 'Select the make.' },
        pt: { label: 'Marca', errorMessage: 'Selecione a marca.' },
      },
      options: same(['Chevrolet', 'Renault', 'Mazda', 'Kia', 'Toyota', 'Nissan']),
    },
    vehicleYear(30),
    vehicleUse(40),
  ],
  CL: [
    fullName(10),
    {
      shared: { key: 'rut', type: 'text', section: 'policyholder', role: 'documentNumber', required: true, order: 20, validation: { validator: 'rut' } },
      i18n: {
        es: { label: 'RUT', placeholder: '12.345.678-5', helpText: 'Con o sin puntos, con guion y dígito verificador.', errorMessage: 'El RUT no es válido. Revisa el dígito verificador.' },
        en: { label: 'RUT (Chilean tax ID)', placeholder: '12.345.678-5', helpText: 'With or without dots, with hyphen and check digit.', errorMessage: 'The RUT is not valid. Check the verification digit.' },
        pt: { label: 'RUT (documento chileno)', placeholder: '12.345.678-5', helpText: 'Com ou sem pontos, com hífen e dígito verificador.', errorMessage: 'O RUT não é válido. Verifique o dígito verificador.' },
      },
    },
    birthDate(30),
    email(40),
    {
      shared: { key: 'mobile', type: 'text', section: 'policyholder', role: 'phone', required: false, order: 50, validation: { pattern: '9\\d{8}' } },
      i18n: {
        es: { label: 'Celular (opcional)', placeholder: '912345678', helpText: '9 dígitos, empieza por 9.', errorMessage: 'Escribe un celular chileno de 9 dígitos que empiece por 9.' },
        en: { label: 'Mobile phone (optional)', placeholder: '912345678', helpText: '9 digits, starts with 9.', errorMessage: 'Enter a 9-digit Chilean mobile number starting with 9.' },
        pt: { label: 'Celular (opcional)', placeholder: '912345678', helpText: '9 dígitos, começa com 9.', errorMessage: 'Informe um celular chileno de 9 dígitos começando com 9.' },
      },
    },
    {
      shared: { key: 'region', type: 'select', section: 'policyholder', role: 'city', required: true, order: 60 },
      i18n: {
        es: { label: 'Región', errorMessage: 'Selecciona tu región.' },
        en: { label: 'Region', errorMessage: 'Select your region.' },
        pt: { label: 'Região', errorMessage: 'Selecione sua região.' },
      },
      options: same(['Metropolitana de Santiago', 'Valparaíso', 'Biobío', 'Antofagasta', 'La Araucanía', 'Los Lagos']),
    },
    {
      shared: { key: 'patente', type: 'text', section: 'vehicle', role: 'vehiclePlate', required: true, order: 10, validation: { validator: 'plate-cl' } },
      i18n: {
        es: { label: 'Patente', placeholder: 'BCDF12', helpText: 'Formato BBBB12 (nuevo) o AA1234 (antiguo).', errorMessage: 'La patente debe tener el formato BBBB12 o AA1234.' },
        en: { label: 'License plate (patente)', placeholder: 'BCDF12', helpText: 'Format BBBB12 (new) or AA1234 (old).', errorMessage: 'The plate must look like BBBB12 or AA1234.' },
        pt: { label: 'Placa (patente)', placeholder: 'BCDF12', helpText: 'Formato BBBB12 (novo) ou AA1234 (antigo).', errorMessage: 'A placa deve ter o formato BBBB12 ou AA1234.' },
      },
    },
    {
      shared: { key: 'make', type: 'select', section: 'vehicle', role: 'vehicleMake', required: true, order: 20 },
      i18n: {
        es: { label: 'Marca', errorMessage: 'Selecciona la marca.' },
        en: { label: 'Make', errorMessage: 'Select the make.' },
        pt: { label: 'Marca', errorMessage: 'Selecione a marca.' },
      },
      options: same(['Suzuki', 'Hyundai', 'Chevrolet', 'Toyota', 'Kia', 'MG']),
    },
    vehicleYear(30),
    {
      shared: { key: 'fuel', type: 'select', section: 'vehicle', role: 'none', required: true, order: 35 },
      i18n: {
        es: { label: 'Combustible', errorMessage: 'Selecciona el tipo de combustible.' },
        en: { label: 'Fuel type', errorMessage: 'Select the fuel type.' },
        pt: { label: 'Combustível', errorMessage: 'Selecione o tipo de combustível.' },
      },
      options: opts(['gasoline', 'diesel', 'hybrid', 'electric'], {
        es: ['Bencina', 'Diésel', 'Híbrido', 'Eléctrico'],
        en: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'],
        pt: ['Gasolina', 'Diesel', 'Híbrido', 'Elétrico'],
      }),
    },
    vehicleUse(40),
  ],
};

/* ───────────────────────────── Plans ───────────────────────────── */
type PlanShared = { code: string; basePrice: number; currency: string; order: number; recommended: boolean; active: boolean };
type PlanText = {
  name: string;
  shortDescription: string;
  badge?: string;
  coverages: { name: string; detail?: string }[];
  benefits: { text: string }[];
};
export type PlanSeed = SeedEntry<PlanShared, PlanText>;

export const plans: Record<string, PlanSeed[]> = {
  CO: [
    {
      shared: { code: 'CO-BASIC', basePrice: 89900, currency: 'COP', order: 10, recommended: false, active: true },
      i18n: {
        es: { name: 'Básico', shortDescription: 'Responsabilidad civil para manejar tranquilo sin pagar de más.', coverages: [{ name: 'Responsabilidad civil extracontractual', detail: 'Hasta $500.000.000' }, { name: 'Asistencia jurídica', detail: 'Penal y civil' }], benefits: [{ text: 'Grúa 1 vez al año' }, { text: 'Línea de asistencia 24/7' }] },
        en: { name: 'Basic', shortDescription: 'Third-party liability to drive with peace of mind without overpaying.', coverages: [{ name: 'Third-party liability', detail: 'Up to COP 500,000,000' }, { name: 'Legal assistance', detail: 'Criminal and civil' }], benefits: [{ text: 'Tow truck once a year' }, { text: '24/7 assistance line' }] },
        pt: { name: 'Básico', shortDescription: 'Responsabilidade civil para dirigir tranquilo sem pagar a mais.', coverages: [{ name: 'Responsabilidade civil perante terceiros', detail: 'Até COP 500.000.000' }, { name: 'Assistência jurídica', detail: 'Penal e civil' }], benefits: [{ text: 'Guincho 1 vez por ano' }, { text: 'Central de assistência 24/7' }] },
      },
    },
    {
      shared: { code: 'CO-PLUS', basePrice: 149900, currency: 'COP', order: 20, recommended: true, active: true },
      i18n: {
        es: { name: 'Plus', badge: 'Recomendado', shortDescription: 'El equilibrio ideal: protege a terceros y a tu carro.', coverages: [{ name: 'Responsabilidad civil extracontractual', detail: 'Hasta $1.000.000.000' }, { name: 'Pérdida total por daño o hurto', detail: '100 % del valor comercial' }, { name: 'Asistencia jurídica', detail: 'Penal y civil' }], benefits: [{ text: 'Grúa ilimitada' }, { text: 'Conductor elegido 3 veces al año' }, { text: 'Talleres en convenio' }] },
        en: { name: 'Plus', badge: 'Recommended', shortDescription: 'The sweet spot: protects third parties and your car.', coverages: [{ name: 'Third-party liability', detail: 'Up to COP 1,000,000,000' }, { name: 'Total loss from damage or theft', detail: '100% of market value' }, { name: 'Legal assistance', detail: 'Criminal and civil' }], benefits: [{ text: 'Unlimited towing' }, { text: 'Designated driver 3 times a year' }, { text: 'Partner repair shops' }] },
        pt: { name: 'Plus', badge: 'Recomendado', shortDescription: 'O equilíbrio ideal: protege terceiros e o seu carro.', coverages: [{ name: 'Responsabilidade civil perante terceiros', detail: 'Até COP 1.000.000.000' }, { name: 'Perda total por dano ou roubo', detail: '100% do valor de mercado' }, { name: 'Assistência jurídica', detail: 'Penal e civil' }], benefits: [{ text: 'Guincho ilimitado' }, { text: 'Motorista da rodada 3 vezes por ano' }, { text: 'Oficinas credenciadas' }] },
      },
    },
    {
      shared: { code: 'CO-FULL', basePrice: 239900, currency: 'COP', order: 30, recommended: false, active: true },
      i18n: {
        es: { name: 'Todo Riesgo', shortDescription: 'Cobertura total, incluso daños parciales y vehículo de reemplazo.', coverages: [{ name: 'Responsabilidad civil extracontractual', detail: 'Hasta $2.000.000.000' }, { name: 'Pérdida total y parcial por daño', detail: 'Deducible desde 0 %' }, { name: 'Hurto total y parcial' }, { name: 'Eventos de la naturaleza' }], benefits: [{ text: 'Vehículo de reemplazo 10 días' }, { text: 'Grúa ilimitada' }, { text: 'Conductor elegido ilimitado' }] },
        en: { name: 'Full Coverage', shortDescription: 'Total protection, including partial damage and a replacement car.', coverages: [{ name: 'Third-party liability', detail: 'Up to COP 2,000,000,000' }, { name: 'Total and partial damage', detail: 'Deductible from 0%' }, { name: 'Total and partial theft' }, { name: 'Natural events' }], benefits: [{ text: 'Replacement car for 10 days' }, { text: 'Unlimited towing' }, { text: 'Unlimited designated driver' }] },
        pt: { name: 'Cobertura Total', shortDescription: 'Proteção total, inclusive danos parciais e carro reserva.', coverages: [{ name: 'Responsabilidade civil perante terceiros', detail: 'Até COP 2.000.000.000' }, { name: 'Perda total e parcial por dano', detail: 'Franquia a partir de 0%' }, { name: 'Roubo total e parcial' }, { name: 'Eventos da natureza' }], benefits: [{ text: 'Carro reserva por 10 dias' }, { text: 'Guincho ilimitado' }, { text: 'Motorista da rodada ilimitado' }] },
      },
    },
    {
      // Inactive: must NOT be shown (US-02-AC-01)
      shared: { code: 'CO-LEGACY', basePrice: 59900, currency: 'COP', order: 5, recommended: false, active: false },
      i18n: {
        es: { name: 'Plan Antiguo (inactivo)', shortDescription: 'No debe mostrarse.', coverages: [], benefits: [] },
        en: { name: 'Legacy Plan (inactive)', shortDescription: 'Must not be shown.', coverages: [], benefits: [] },
        pt: { name: 'Plano Antigo (inativo)', shortDescription: 'Não deve ser exibido.', coverages: [], benefits: [] },
      },
    },
    {
      // Draft (never published): must NOT be shown (US-02-AC-01)
      publish: false,
      shared: { code: 'CO-PILOT', basePrice: 1, currency: 'COP', order: 1, recommended: false, active: true },
      i18n: {
        es: { name: 'Piloto en borrador', shortDescription: 'No publicado.', coverages: [], benefits: [] },
        en: { name: 'Draft pilot', shortDescription: 'Not published.', coverages: [], benefits: [] },
        pt: { name: 'Piloto em rascunho', shortDescription: 'Não publicado.', coverages: [], benefits: [] },
      },
    },
  ],
  CL: [
    {
      shared: { code: 'CL-ESSENTIAL', basePrice: 19990, currency: 'CLP', order: 10, recommended: false, active: true },
      i18n: {
        es: { name: 'Esencial', shortDescription: 'Responsabilidad civil y asistencia en ruta para el día a día.', coverages: [{ name: 'Responsabilidad civil', detail: 'Hasta UF 500' }, { name: 'Defensa penal' }], benefits: [{ text: 'Asistencia en ruta 24/7' }] },
        en: { name: 'Essential', shortDescription: 'Liability and roadside assistance for everyday driving.', coverages: [{ name: 'Third-party liability', detail: 'Up to UF 500' }, { name: 'Criminal defense' }], benefits: [{ text: '24/7 roadside assistance' }] },
        pt: { name: 'Essencial', shortDescription: 'Responsabilidade civil e assistência na estrada para o dia a dia.', coverages: [{ name: 'Responsabilidade civil', detail: 'Até UF 500' }, { name: 'Defesa penal' }], benefits: [{ text: 'Assistência na estrada 24/7' }] },
      },
    },
    {
      shared: { code: 'CL-COMPLETE', basePrice: 32990, currency: 'CLP', order: 20, recommended: true, active: true },
      i18n: {
        es: { name: 'Completo', badge: 'Más elegido', shortDescription: 'Daños propios con deducible bajo y auto de reemplazo.', coverages: [{ name: 'Daño propio', detail: 'Deducible UF 5' }, { name: 'Robo, hurto o uso no autorizado' }, { name: 'Responsabilidad civil', detail: 'Hasta UF 1.000' }], benefits: [{ text: 'Auto de reemplazo 7 días' }, { text: 'Asistencia en ruta 24/7' }, { text: 'Cobertura en Argentina' }] },
        en: { name: 'Complete', badge: 'Most chosen', shortDescription: 'Own-damage cover with a low deductible and a replacement car.', coverages: [{ name: 'Own damage', detail: 'Deductible UF 5' }, { name: 'Theft or unauthorized use' }, { name: 'Third-party liability', detail: 'Up to UF 1,000' }], benefits: [{ text: 'Replacement car for 7 days' }, { text: '24/7 roadside assistance' }, { text: 'Coverage in Argentina' }] },
        pt: { name: 'Completo', badge: 'Mais escolhido', shortDescription: 'Danos ao próprio veículo com franquia baixa e carro reserva.', coverages: [{ name: 'Danos ao próprio veículo', detail: 'Franquia UF 5' }, { name: 'Roubo, furto ou uso não autorizado' }, { name: 'Responsabilidade civil', detail: 'Até UF 1.000' }], benefits: [{ text: 'Carro reserva por 7 dias' }, { text: 'Assistência na estrada 24/7' }, { text: 'Cobertura na Argentina' }] },
      },
    },
    {
      shared: { code: 'CL-PREMIUM', basePrice: 49990, currency: 'CLP', order: 30, recommended: false, active: true },
      i18n: {
        es: { name: 'Full Premium', shortDescription: 'Deducible cero, cristales y cobertura en el Mercosur.', coverages: [{ name: 'Daño propio', detail: 'Deducible UF 0' }, { name: 'Robo, hurto o uso no autorizado' }, { name: 'Cristales y accesorios' }, { name: 'Responsabilidad civil', detail: 'Hasta UF 2.000' }], benefits: [{ text: 'Auto de reemplazo 15 días' }, { text: 'Cobertura en países del Mercosur' }, { text: 'Retiro y entrega en taller' }] },
        en: { name: 'Full Premium', shortDescription: 'Zero deductible, glass cover and coverage across Mercosur.', coverages: [{ name: 'Own damage', detail: 'Deductible UF 0' }, { name: 'Theft or unauthorized use' }, { name: 'Glass and accessories' }, { name: 'Third-party liability', detail: 'Up to UF 2,000' }], benefits: [{ text: 'Replacement car for 15 days' }, { text: 'Coverage in Mercosur countries' }, { text: 'Pick-up and drop-off at the shop' }] },
        pt: { name: 'Full Premium', shortDescription: 'Franquia zero, vidros e cobertura no Mercosul.', coverages: [{ name: 'Danos ao próprio veículo', detail: 'Franquia UF 0' }, { name: 'Roubo, furto ou uso não autorizado' }, { name: 'Vidros e acessórios' }, { name: 'Responsabilidade civil', detail: 'Até UF 2.000' }], benefits: [{ text: 'Carro reserva por 15 dias' }, { text: 'Cobertura nos países do Mercosul' }, { text: 'Retirada e entrega na oficina' }] },
      },
    },
    {
      shared: { code: 'CL-OLD', basePrice: 9990, currency: 'CLP', order: 1, recommended: false, active: false },
      i18n: {
        es: { name: 'Plan descontinuado (inactivo)', shortDescription: 'No debe mostrarse.', coverages: [], benefits: [] },
        en: { name: 'Discontinued plan (inactive)', shortDescription: 'Must not be shown.', coverages: [], benefits: [] },
        pt: { name: 'Plano descontinuado (inativo)', shortDescription: 'Não deve ser exibido.', coverages: [], benefits: [] },
      },
    },
  ],
};

/* ───────────────────────────── Legal terms ───────────────────────────── */
export type TermsSeed = SeedEntry<{ version: string }, { title: string; body: string }>;
export const legalTerms: Record<string, TermsSeed> = {
  CO: {
    shared: { version: 'CO-2026.1' },
    i18n: {
      es: {
        title: 'Términos y condiciones — Seguro de Autos Colombia',
        body: 'Aseguradora Demo S.A.S. (entidad ficticia para esta prueba) ofrece este seguro voluntario de automóviles en Colombia.\n\nEste seguro no reemplaza el SOAT, que es obligatorio por ley. La vigencia inicia a las 00:00 del día siguiente al pago y la prima se cobra mensualmente en pesos colombianos (COP).\n\nTus datos personales serán tratados conforme a la Ley 1581 de 2012 y podrás ejercer tus derechos de conocer, actualizar y rectificar tu información. Puedes revocar esta póliza en cualquier momento sin penalidad.',
      },
      en: {
        title: 'Terms and conditions — Car Insurance Colombia',
        body: 'Aseguradora Demo S.A.S. (a fictitious company for this assessment) offers this voluntary car insurance in Colombia.\n\nThis policy does not replace SOAT, the mandatory insurance required by law. Coverage starts at 00:00 on the day after payment and the premium is charged monthly in Colombian pesos (COP).\n\nYour personal data will be processed in accordance with Law 1581 of 2012 and you may exercise your rights to access, update and correct your information. You may cancel this policy at any time without penalty.',
      },
      pt: {
        title: 'Termos e condições — Seguro Auto Colômbia',
        body: 'A Aseguradora Demo S.A.S. (empresa fictícia para este teste) oferece este seguro auto voluntário na Colômbia.\n\nEste seguro não substitui o SOAT, obrigatório por lei. A vigência começa às 00:00 do dia seguinte ao pagamento e o prêmio é cobrado mensalmente em pesos colombianos (COP).\n\nSeus dados pessoais serão tratados conforme a Lei 1581 de 2012 e você poderá exercer seus direitos de conhecer, atualizar e retificar suas informações. Você pode cancelar esta apólice a qualquer momento sem multa.',
      },
    },
  },
  CL: {
    shared: { version: 'CL-2026.1' },
    i18n: {
      es: {
        title: 'Términos y condiciones — Seguro Automotriz Chile',
        body: 'Compañía de Seguros Demo SpA (entidad ficticia para esta prueba) ofrece este seguro automotriz voluntario en Chile.\n\nEste seguro es complementario al Seguro Obligatorio de Accidentes Personales (SOAP). La prima se expresa y cobra mensualmente en pesos chilenos (CLP); los montos en UF se convierten al valor del día del siniestro.\n\nTus datos serán tratados conforme a la Ley 19.628 sobre protección de la vida privada. Dispones de un plazo de retracto de 10 días desde la contratación.',
      },
      en: {
        title: 'Terms and conditions — Car Insurance Chile',
        body: 'Compañía de Seguros Demo SpA (a fictitious company for this assessment) offers this voluntary car insurance in Chile.\n\nThis policy complements the mandatory personal accident insurance (SOAP). The premium is quoted and charged monthly in Chilean pesos (CLP); amounts in UF are converted at the value on the date of the claim.\n\nYour data will be processed under Law 19,628 on the protection of private life. You have a 10-day cooling-off period from purchase.',
      },
      pt: {
        title: 'Termos e condições — Seguro Auto Chile',
        body: 'A Compañía de Seguros Demo SpA (empresa fictícia para este teste) oferece este seguro auto voluntário no Chile.\n\nEste seguro é complementar ao seguro obrigatório de acidentes pessoais (SOAP). O prêmio é cotado e cobrado mensalmente em pesos chilenos (CLP); valores em UF são convertidos pelo valor do dia do sinistro.\n\nSeus dados serão tratados conforme a Lei 19.628 de proteção da vida privada. Você tem um prazo de arrependimento de 10 dias a partir da contratação.',
      },
    },
  },
};
