import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ContentApi, mergeByDocumentId } from './content-api';

describe('ContentApi', () => {
  let api: ContentApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ContentApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('US-01-AC-01 queries form fields filtered by country and locale, without any auth header', async () => {
    const p = firstValueFrom(api.formFields('CL', 'es'));
    const req = http.expectOne((r) => r.url === '/api/form-fields');
    expect(req.request.params.get('filters[country][code][$eq]')).toBe('CL');
    expect(req.request.params.get('locale')).toBe('es');
    expect(req.request.headers.has('Authorization')).toBe(false); // ADR-0004
    req.flush({ data: [] });
    expect(await p).toEqual([]);
  });

  it('US-02-AC-01 queries only active plans of the country, sorted by order', async () => {
    const p = firstValueFrom(api.plans('CO', 'COP', 'es'));
    const req = http.expectOne((r) => r.url === '/api/plans');
    expect(req.request.params.get('filters[active][$eq]')).toBe('true');
    expect(req.request.params.get('filters[country][code][$eq]')).toBe('CO');
    expect(req.request.params.get('sort[0]')).toBe('order:asc');
    req.flush({ data: [] });
    await p;
  });

  it('US-04-AC-03 passes the active locale and US-04-AC-05 falls back to es for missing translations', async () => {
    const p = firstValueFrom(api.terms('CO', 'pt'));
    const reqs = http.match((r) => r.url === '/api/legal-terms');
    expect(reqs.map((r) => r.request.params.get('locale')).sort()).toEqual(['es', 'pt']);
    reqs.find((r) => r.request.params.get('locale') === 'es')!.flush({ data: [{ id: 1, documentId: 't1', title: 'ES', body: 'a', version: '1' }] });
    reqs.find((r) => r.request.params.get('locale') === 'pt')!.flush({ data: [] });
    expect((await p)?.title).toBe('ES');
  });

  it('caches successful responses but not errors (Retry re-fetches)', async () => {
    const first = firstValueFrom(api.countries('es'));
    http.expectOne('/api/countries?sort%5B0%5D=order:asc&locale=es&pagination%5BpageSize%5D=100').flush('boom', { status: 500, statusText: 'err' });
    await expect(first).rejects.toBeTruthy();
    const second = firstValueFrom(api.countries('es'));
    http.expectOne((r) => r.url === '/api/countries').flush({ data: [] });
    await second;
    await firstValueFrom(api.countries('es')); // cached: no request
  });

  it('mergeByDocumentId prefers the wanted locale and keeps fallback-only documents', () => {
    const out = mergeByDocumentId(
      [{ documentId: 'a', v: 'es' }, { documentId: 'b', v: 'es' }],
      [{ documentId: 'a', v: 'pt' }],
    );
    expect(out).toEqual([{ documentId: 'a', v: 'pt' }, { documentId: 'b', v: 'es' }]);
  });
});
