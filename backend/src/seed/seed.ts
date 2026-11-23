import type { Core } from '@strapi/strapi';
import {
  DEFAULT_LOCALE,
  LOCALES,
  countries,
  formFields,
  legalTerms,
  plans,
  type Locale,
  type SeedEntry,
} from './data';

type UID = 'api::country.country' | 'api::form-field.form-field' | 'api::plan.plan' | 'api::legal-term.legal-term';

const LOCALE_NAMES: Record<Locale, string> = { es: 'Spanish (es)', en: 'English (en)', pt: 'Portuguese (pt)' };

async function ensureLocales(strapi: Core.Strapi): Promise<void> {
  const service = strapi.plugin('i18n').service('locales');
  for (const code of LOCALES) {
    if (!(await service.findByCode(code))) {
      await service.create({ code, name: LOCALE_NAMES[code] });
    }
  }
  await service.setDefaultLocale({ code: DEFAULT_LOCALE });
}

/** Creates the default-locale document, then the other localizations, then publishes all of them. */
async function createLocalized<S extends object, L extends object>(
  strapi: Core.Strapi,
  uid: UID,
  entry: SeedEntry<S, L>,
  perLocale: (locale: Locale) => Record<string, unknown> = () => ({}),
): Promise<string> {
  const docs = strapi.documents(uid);
  const created = await docs.create({
    locale: DEFAULT_LOCALE,
    data: { ...entry.shared, ...entry.i18n[DEFAULT_LOCALE], ...perLocale(DEFAULT_LOCALE) } as never,
  });
  for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
    await docs.update({
      documentId: created.documentId,
      locale,
      data: { ...entry.shared, ...entry.i18n[locale], ...perLocale(locale) } as never,
    });
  }
  if (entry.publish !== false) {
    for (const locale of LOCALES) {
      await docs.publish({ documentId: created.documentId, locale });
    }
  }
  return created.documentId;
}

export async function seedIfEmpty(strapi: Core.Strapi): Promise<void> {
  await ensureLocales(strapi);

  const existing = await strapi.documents('api::country.country').count({});
  if (existing > 0 && process.env.SEED_FORCE !== 'true') {
    strapi.log.info(`[seed] ${existing} countries found — skipping seed`);
    return;
  }

  strapi.log.info('[seed] Seeding fictitious data for CO and CL in es/en/pt …');
  for (const country of countries) {
    const code = country.shared.code;
    const countryId = await createLocalized(strapi, 'api::country.country', country);

    for (const field of formFields[code] ?? []) {
      await createLocalized(strapi, 'api::form-field.form-field', field, (locale) => ({
        country: countryId,
        validation: field.shared.validation ?? null,
        options: field.options?.[locale] ?? [],
      }));
    }
    for (const plan of plans[code] ?? []) {
      await createLocalized(strapi, 'api::plan.plan', plan, () => ({ country: countryId }));
    }
    const terms = legalTerms[code];
    if (terms) {
      await createLocalized(strapi, 'api::legal-term.legal-term', terms, () => ({ country: countryId }));
    }
    strapi.log.info(`[seed] ${code}: ${formFields[code]?.length ?? 0} fields, ${plans[code]?.length ?? 0} plans, terms ✔`);
  }
}
