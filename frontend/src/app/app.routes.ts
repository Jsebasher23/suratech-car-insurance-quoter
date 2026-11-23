import { Routes } from '@angular/router';
import {
  confirmationGuard,
  countryGuard,
  notPaidGuard,
  planSelectedGuard,
  step1CompleteGuard,
} from './core/routing/guards';

/** ADR-0001 — the country is the first path segment; one build serves every market. */
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/country-picker/country-picker').then((m) => m.CountryPicker) },
  {
    path: ':country',
    canActivate: [countryGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'quote/data' },
      {
        path: 'quote',
        loadComponent: () => import('./features/wizard/wizard-shell').then((m) => m.WizardShell),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'data' },
          {
            path: 'data',
            canActivate: [notPaidGuard],
            loadComponent: () => import('./features/data-step/data-step').then((m) => m.DataStep),
          },
          {
            path: 'plans',
            canActivate: [step1CompleteGuard],
            loadComponent: () => import('./features/plans-step/plans-step').then((m) => m.PlansStep),
          },
          {
            path: 'summary',
            canActivate: [planSelectedGuard],
            loadComponent: () => import('./features/summary-step/summary-step').then((m) => m.SummaryStep),
          },
          {
            path: 'confirmation',
            canActivate: [confirmationGuard],
            loadComponent: () => import('./features/confirmation/confirmation').then((m) => m.Confirmation),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
