import { Country } from '../domain/models';
import { CountryDto } from './strapi.types';

const ISO_4217 = /^[A-Z]{3}$/;

/** RV-05: any ISO 4217 currency is accepted, so a new country needs no code change (ADR-0001). */
export function mapCountries(dtos: CountryDto[]): Country[] {
  return [...dtos]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((d) => {
      const ok = ISO_4217.test(d.currency ?? '');
      if (!ok) console.warn(`[countries] Hiding "${d.code}": invalid currency`);
      return ok;
    })
    .map((d) => ({
      code: d.code.toUpperCase(),
      name: d.name,
      currency: d.currency,
      numberLocale: d.numberLocale || 'es',
      legalAge: d.legalAge ?? 18,
      flag: d.flag ?? '',
    }));
}
