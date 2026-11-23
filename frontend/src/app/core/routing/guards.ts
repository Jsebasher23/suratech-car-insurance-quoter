import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { CountryContext } from '../country/country-context';
import { QuoteStore } from '../state/quote.store';

/** US-01-AC-13 — unknown country → picker; known → set context + restore its quote. */
export const countryGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const ctx = inject(CountryContext);
  const store = inject(QuoteStore);
  const segment = route.paramMap.get('country') ?? '';
  try {
    const country = await ctx.resolve(segment);
    if (!country) return router.createUrlTree(['/'], { queryParams: { unknown: segment } });
    store.useCountry(country.code);
    return true;
  } catch {
    // Strapi unreachable: let the picker show its error + retry state
    return router.createUrlTree(['/']);
  }
};

/** Params are inherited (`paramsInheritanceStrategy: 'always'`), so child routes see `:country`. */
const countryPath = (route: ActivatedRouteSnapshot): string => route.paramMap.get('country') ?? '';

/** Data step after payment → confirmation (cannot re-pay, US-03-AC-11). */
export const notPaidGuard: CanActivateFn = (route) => {
  const store = inject(QuoteStore);
  return store.confirmation()
    ? inject(Router).createUrlTree(['/', countryPath(route), 'quote', 'confirmation'])
    : true;
};

/** US-02-AC-11 — plans need a valid step 1. */
export const step1CompleteGuard: CanActivateFn = (route) => {
  const store = inject(QuoteStore);
  const router = inject(Router);
  if (store.confirmation()) return router.createUrlTree(['/', countryPath(route), 'quote', 'confirmation']);
  return store.step1Complete() ? true : router.createUrlTree(['/', countryPath(route), 'quote', 'data']);
};

/** US-03-AC-13 / US-03-AC-11 — summary needs a plan; after paying it redirects to the confirmation. */
export const planSelectedGuard: CanActivateFn = (route) => {
  const store = inject(QuoteStore);
  const router = inject(Router);
  const c = countryPath(route);
  if (store.confirmation()) return router.createUrlTree(['/', c, 'quote', 'confirmation']);
  if (!store.step1Complete()) return router.createUrlTree(['/', c, 'quote', 'data']);
  return store.planCode() ? true : router.createUrlTree(['/', c, 'quote', 'plans']);
};

export const confirmationGuard: CanActivateFn = (route) => {
  const store = inject(QuoteStore);
  return store.confirmation() ? true : inject(Router).createUrlTree(['/', countryPath(route), 'quote', 'data']);
};
