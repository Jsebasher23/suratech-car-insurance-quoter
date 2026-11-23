import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { ContentApi } from '../app/core/api/content-api';
import { CountryContext } from '../app/core/country/country-context';
import { FormFieldConfig, LegalTerms, Plan } from '../app/core/domain/models';
import { PAYMENT_LATENCY_MS, PaymentGateway } from '../app/core/payment/payment-gateway';
import { QuoteStore } from '../app/core/state/quote.store';
import { Clock } from '../app/core/util/clock';
import { CL, CO, CO_FIELDS, CO_PLANS, CO_TERMS, TODAY } from './fixtures';

/** Controllable fake of the Strapi gateway: each resource is a Subject the test drives. */
export class FakeContentApi {
  fields$ = new Subject<FormFieldConfig[]>();
  plans$ = new Subject<Plan[]>();
  terms$ = new Subject<LegalTerms | null>();
  countries = () => of([CO, CL]);
  formFields = (): Observable<FormFieldConfig[]> => this.fields$;
  plans = (): Observable<Plan[]> => this.plans$;
  terms = (): Observable<LegalTerms | null> => this.terms$;
  clearCache() {}

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
