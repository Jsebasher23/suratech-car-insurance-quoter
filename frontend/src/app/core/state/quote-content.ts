import { Injectable, computed, inject } from '@angular/core';
import { ContentApi } from '../api/content-api';
import { CountryContext } from '../country/country-context';
import { pricePlans } from '../domain/pricing';
import { I18nService } from '../i18n/i18n.service';
import { asyncResource } from '../util/async-state';
import { QuoteStore } from './quote.store';
import { Clock } from '../util/clock';

/**
 * Read model shared by the steps and the quote ticket: Strapi content for the current
 * country + language, combined with the user's answers. Re-fetches on language change (US-04-AC-03).
 */
@Injectable({ providedIn: 'root' })
export class QuoteContent {
  private readonly api = inject(ContentApi);
  private readonly ctx = inject(CountryContext);
  private readonly i18n = inject(I18nService);
  private readonly store = inject(QuoteStore);
  private readonly clock = inject(Clock);

  private readonly key = computed(() => {
    const c = this.ctx.country();
    return c ? { code: c.code, currency: c.currency, lang: this.i18n.lang() } : undefined;
  });

  readonly fields = asyncResource(this.key, (k) => this.api.formFields(k.code, k.lang));
  readonly plans = asyncResource(this.key, (k) => this.api.plans(k.code, k.currency, k.lang));
  readonly terms = asyncResource(this.key, (k) => this.api.terms(k.code, k.lang));

  readonly pricedPlans = computed(() => {
    const plans = this.plans.value();
    const fields = this.fields.value();
    if (!plans || !fields) return undefined;
    return pricePlans(plans, fields, this.store.formValues(), this.clock.today());
  });

  readonly selectedPlan = computed(() => this.pricedPlans()?.find((p) => p.code === this.store.planCode()) ?? null);

  readonly plate = computed(() => {
    const f = this.fields.value()?.find((x) => x.role === 'vehiclePlate');
    const v = f ? this.store.formValues()[f.key] : undefined;
    return typeof v === 'string' && v.trim() ? v.trim().toUpperCase() : null;
  });

  readonly vehicleLine = computed(() => {
    const fields = this.fields.value() ?? [];
    const values = this.store.formValues();
    const make = fields.find((f) => f.role === 'vehicleMake');
    const year = fields.find((f) => f.role === 'vehicleYear');
    const makeLabel = make?.options.find((o) => o.value === values[make.key])?.label;
    const yearValue = year ? values[year.key] : undefined;
    return [makeLabel, typeof yearValue === 'number' ? String(yearValue) : undefined].filter(Boolean).join(' ');
  });
}
