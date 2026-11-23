import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ContentApi } from '../api/content-api';
import { Country } from '../domain/models';
import { I18nService } from '../i18n/i18n.service';
import { asyncResource } from '../util/async-state';

/**
 * ADR-0001 — the current market. Set by `countryGuard` from the URL; components read
 * `country()` and never branch on its code.
 */
@Injectable({ providedIn: 'root' })
export class CountryContext {
  private readonly api = inject(ContentApi);
  private readonly i18n = inject(I18nService);

  private readonly code = signal<string | null>(null);

  /** Countries in the active language (names are localized). */
  readonly countries = asyncResource(() => this.i18n.lang(), (lang) => this.api.countries(lang));

  readonly country = computed<Country | null>(() => {
    const code = this.code();
    return this.countries.value()?.find((c) => c.code === code) ?? null;
  });
  readonly countryCode = this.code.asReadonly();

  /** Resolves a URL segment against Strapi. Returns the country or null if unknown. */
  async resolve(segment: string): Promise<Country | null> {
    const code = segment.toUpperCase();
    const list = await firstValueFrom(this.api.countries(this.i18n.lang()));
    const found = list.find((c) => c.code === code) ?? null;
    this.code.set(found ? found.code : null);
    return found;
  }
}
