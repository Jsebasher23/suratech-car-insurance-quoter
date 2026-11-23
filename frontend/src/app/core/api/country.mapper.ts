import { Country, CurrencyCode } from '../domain/models';
import { CountryDto } from './strapi.types';

const CURRENCIES: readonly CurrencyCode[] = ['COP', 'CLP'];

export function mapCountries(dtos: CountryDto[]): Country[] {
  return [...dtos]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((d) => CURRENCIES.includes(d.currency as CurrencyCode))
    .map((d) => ({
      code: d.code.toUpperCase(),
      name: d.name,
      currency: d.currency as CurrencyCode,
      numberLocale: d.numberLocale || 'es',
      legalAge: d.legalAge ?? 18,
      flag: d.flag ?? '',
    }));
}
