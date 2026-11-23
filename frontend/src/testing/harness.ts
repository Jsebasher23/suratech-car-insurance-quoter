import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, ReplaySubject, of } from 'rxjs';
import { ContentApi } from '../app/core/api/content-api';
import { CountryContext } from '../app/core/country/country-context';
import { FormFieldConfig, LegalTerms, Plan } from '../app/core/domain/models';
import { PAYMENT_LATENCY_MS, PaymentGateway } from '../app/core/payment/payment-gateway';
import { QuoteStore } from '../app/core/state/quote.store';
import { Clock } from '../app/core/util/clock';
import { CL, CO, CO_FIELDS, CO_PLANS, CO_TERMS, TODAY } from './fixtures';

/** Controllable fake of the Strapi gateway: each resource is a Subject the test drives. */
export class FakeContentApi {
  fields$ = new ReplaySubject<FormFieldConfig[]>(1);
  plans$ = new ReplaySubject<Plan[]>(1);
  terms$ = new ReplaySubject<LegalTerms | null>(1);
  /** What Strapi answers to a cache-bypassing request (RV-03); defaults to the latest plans$ value. */
  freshPlans: Plan[] | null = null;
  freshCalls = 0;
  countries = () => of([CO, CL]);
  formFields = (): Observable<FormFieldConfig[]> => this.fields$;
  plans = (_c?: string, _cur?: string, _l?: string, opts: { fresh?: boolean } = {}): Observable<Plan[]> => {
    if (!opts.fresh) return this.plans$;
    this.freshCalls++;
    return this.freshPlans ? of(this.freshPlans) : this.plans$;
  };
  terms = (): Observable<LegalTerms | null> => this.terms$;
  clearCache(): void {
    // the fake has no cache
  }

  emitDefaults(): void {
    this.fields$.next(CO_FIELDS);
    this.plans$.next(CO_PLANS);
    this.terms$.next(CO_TERMS);
  }
}

export async function setupStep(extraProviders: unknown[] = []) {
  sessionStorage.clear();
  localStorage.setItem('ciq.lang', 'es');
  const api = new FakeContentApi();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ContentApi, useValue: api },
      { provide: Clock, useValue: { today: () => TODAY } },
      { provide: PAYMENT_LATENCY_MS, useValue: 0 },
      { provide: ActivatedRoute, useValue: {} },
      ...(extraProviders as never[]),
    ],
  });
  await TestBed.inject(CountryContext).resolve('CO');
  const store = TestBed.inject(QuoteStore);
  store.useCountry('CO');
  return { api, store };
}

export { PaymentGateway };
