import { mapCountries } from './country.mapper';
import { CountryDto } from './strapi.types';

const dto = (p: Partial<CountryDto> & Pick<CountryDto, 'code'>): CountryDto => ({
  id: 1, documentId: p.code, name: p.code, currency: 'COP', numberLocale: 'es-CO', legalAge: 18, flag: null, order: 0, ...p,
});

describe('mapCountries', () => {
  it('RV-05 / ADR-0001 a new country with a new currency needs no code change', () => {
    const out = mapCountries([dto({ code: 'PE', currency: 'PEN', numberLocale: 'es-PE', order: 30 }), dto({ code: 'co', order: 10 })]);
    expect(out.map((c) => [c.code, c.currency])).toEqual([['CO', 'COP'], ['PE', 'PEN']]);
  });

  it('hides a country whose currency is not an ISO 4217 code', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(mapCountries([dto({ code: 'XX', currency: 'pesos' })])).toEqual([]);
  });
});
