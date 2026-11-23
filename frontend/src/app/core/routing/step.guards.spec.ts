import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ContentApi } from '../api/content-api';
import { CO, CL } from '../../../testing/fixtures';
import { QuoteStore } from '../state/quote.store';
import { confirmationGuard, countryGuard, planSelectedGuard, step1CompleteGuard } from './guards';

const route = (country = 'co') => ({ paramMap: convertToParamMap({ country }) }) as unknown as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('guards', () => {
  let store: QuoteStore;
  let router: Router;
  const run = (g: typeof step1CompleteGuard, r = route()) => TestBed.runInInjectionContext(() => g(r, state));
  const url = (v: unknown) => router.serializeUrl(v as UrlTree);

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ContentApi, useValue: { countries: () => of([CO, CL]) } }],
    });
    store = TestBed.inject(QuoteStore);
    router = TestBed.inject(Router);
    store.useCountry('CO');
  });

  it('US-01-AC-13 redirects an unknown country to the picker', async () => {
    const r = await run(countryGuard, route('ar'));
    expect(url(r)).toBe('/?unknown=ar');
  });

  it('US-01-AC-13 accepts a known country case-insensitively', async () => {
    expect(await run(countryGuard, route('cl'))).toBe(true);
  });

  it('US-02-AC-11 plans require a completed step 1', () => {
    expect(url(run(step1CompleteGuard))).toBe('/co/quote/data');
    store.setFormValues({ a: 1 }, true);
    expect(run(step1CompleteGuard)).toBe(true);
  });

  it('US-03-AC-13 summary requires a selected plan', () => {
    store.setFormValues({ a: 1 }, true);
    expect(url(run(planSelectedGuard))).toBe('/co/quote/plans');
    store.selectPlan('CO-PLUS');
    expect(run(planSelectedGuard)).toBe(true);
  });

  it('US-03-AC-11 after paying, summary and plans redirect to the confirmation', async () => {
    store.setFormValues({ a: 1 }, true);
    store.selectPlan('CO-PLUS');
    store.setTermsAccepted(true);
    await store.pay(
      { charge: async () => ({ quoteNumber: 'CO-20261122-AAAAAA', paidAt: '' }) },
      { countryCode: 'CO', planCode: 'CO-PLUS', amount: 1, currency: 'COP', outcome: 'approve' },
      { planName: 'Plus', amount: 1, currency: 'COP', numberLocale: 'es-CO' },
    );
    expect(url(run(planSelectedGuard))).toBe('/co/quote/confirmation');
    expect(url(run(step1CompleteGuard))).toBe('/co/quote/confirmation');
    expect(run(confirmationGuard)).toBe(true);
  });
});
