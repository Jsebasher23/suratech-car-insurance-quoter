import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, throwError } from 'rxjs';
import { Country, CurrencyCode, FormFieldConfig, LegalTerms, Plan } from '../domain/models';
import { DEFAULT_LANGUAGE, Language } from '../i18n/languages';
import { API_BASE_URL } from './app-config';
import { mapCountries } from './country.mapper';
import { mapFormFields } from './form-field.mapper';
import { mapPlans } from './plan.mapper';
import { CountryDto, FormFieldDto, LegalTermDto, PlanDto, StrapiList } from './strapi.types';
import { mapTerms } from './terms.mapper';

type Params = Record<string, string>;

/**
 * Single gateway to Strapi (read-only, public role). Responsibilities:
 *  - build country/locale filtered queries (ADR-0001, ADR-0002)
 *  - fallback to the default locale for documents not translated (US-04-AC-05)
 *  - map DTOs → domain models
 *  - cache per (resource, country, locale); errors are not cached so Retry re-fetches
 */
@Injectable({ providedIn: 'root' })
export class ContentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly cache = new Map<string, Observable<unknown>>();

  countries(locale: Language): Observable<Country[]> {
    return this.cached(`countries|${locale}`, () =>
      this.localized<CountryDto>('countries', { 'sort[0]': 'order:asc' }, locale).pipe(map(mapCountries)),
    );
  }

  formFields(countryCode: string, locale: Language): Observable<FormFieldConfig[]> {
    return this.cached(`fields|${countryCode}|${locale}`, () =>
      this.localized<FormFieldDto>(
        'form-fields',
        { ...countryFilter(countryCode), 'sort[0]': 'order:asc', populate: '*' },
        locale,
      ).pipe(map(mapFormFields)),
    );
  }

  /** `fresh: true` skips (and replaces) the cached entry — used right before paying (RV-03). */
  plans(countryCode: string, currency: CurrencyCode, locale: Language, opts: { fresh?: boolean } = {}): Observable<Plan[]> {
    const key = `plans|${countryCode}|${locale}`;
    if (opts.fresh) this.cache.delete(key);
    return this.cached(key, () =>
      this.localized<PlanDto>(
        'plans',
        { ...countryFilter(countryCode), 'filters[active][$eq]': 'true', 'sort[0]': 'order:asc', populate: '*' },
        locale,
      ).pipe(map((dtos) => mapPlans(dtos, currency))),
    );
  }

  terms(countryCode: string, locale: Language): Observable<LegalTerms | null> {
    return this.cached(`terms|${countryCode}|${locale}`, () =>
      this.localized<LegalTermDto>('legal-terms', { ...countryFilter(countryCode), 'sort[0]': 'updatedAt:desc' }, locale).pipe(
        map(mapTerms),
      ),
    );
  }

  /** For tests and for an explicit "refresh content" action. */
  clearCache(): void {
    this.cache.clear();
  }

  private cached<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const hit = this.cache.get(key) as Observable<T> | undefined;
    if (hit) return hit;
    const obs = factory().pipe(
      catchError((err: unknown) => {
        this.cache.delete(key);
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(key, obs);
    return obs;
  }

  /** Fetches `locale` and, if different, the default locale; merges by documentId preferring `locale`. */
  private localized<T extends { documentId: string }>(path: string, params: Params, locale: Language): Observable<T[]> {
    const get = (loc: Language) => this.get<T>(path, { ...params, locale: loc, 'pagination[pageSize]': '100' });
    if (locale === DEFAULT_LANGUAGE) return get(locale);
    return forkJoin([get(DEFAULT_LANGUAGE), get(locale).pipe(catchError(() => of([] as T[])))]).pipe(
      map(([fallback, wanted]) => mergeByDocumentId(fallback, wanted)),
    );
  }

  private get<T>(path: string, params: Params): Observable<T[]> {
    return this.http
      .get<StrapiList<T>>(`${this.baseUrl}/${path}`, { params: new HttpParams({ fromObject: params }) })
      .pipe(map((r) => r.data ?? []));
  }
}

export const countryFilter = (code: string): Params => ({ 'filters[country][code][$eq]': code });

/** Keeps the order of `wanted` first, then documents that only exist in `fallback`. */
export function mergeByDocumentId<T extends { documentId: string }>(fallback: T[], wanted: T[]): T[] {
  const ids = new Set(wanted.map((w) => w.documentId));
  return [...wanted, ...fallback.filter((f) => !ids.has(f.documentId))];
}
