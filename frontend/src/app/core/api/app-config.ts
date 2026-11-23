import { InjectionToken } from '@angular/core';

/**
 * Base URL of the Strapi REST API. Same-origin `/api` by default (nginx / dev proxy),
 * so no CORS widening and — by design — no token anywhere in the bundle (ADR-0004).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
