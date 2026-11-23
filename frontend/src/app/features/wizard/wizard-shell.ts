import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { CountryContext } from '../../core/country/country-context';
import { MoneyPipe } from '../../core/format/money.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translation-key';
import { QuoteContent } from '../../core/state/quote-content';
import { QuoteStore } from '../../core/state/quote.store';
import { Plate } from '../../shared/ui/plate';

interface StepDef {
  path: 'data' | 'plans' | 'summary';
  label: TranslationKey;
}
const STEPS: StepDef[] = [
  { path: 'data', label: 'wizard.step.data' },
  { path: 'plans', label: 'wizard.step.plans' },
  { path: 'summary', label: 'wizard.step.summary' },
];

@Component({
  selector: 'app-wizard-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, TranslatePipe, MoneyPipe, Plate],
  template: `
    <nav class="steps no-print" [attr.aria-label]="'wizard.steps' | t">
      <p class="steps__mobile" aria-hidden="true">{{ 'wizard.stepOf' | t: { current: currentIndex() + 1, total: steps.length } }}</p>
      <ol>
        @for (s of steps; track s.path; let i = $index) {
          <li class="step" [class.step--done]="i < currentIndex()" [class.step--current]="i === currentIndex()">
            <span class="step__dot" aria-hidden="true">{{ i + 1 }}</span>
            @if (i !== currentIndex() && reachable(i)) {
              <a [routerLink]="[s.path]" class="step__label">
                {{ s.label | t }}@if (i < currentIndex()) {<span class="visually-hidden">, {{ 'wizard.completed' | t }}</span>}
              </a>
            } @else {
              <span class="step__label" [attr.aria-current]="i === currentIndex() ? 'step' : null">
                {{ s.label | t }}@if (i === currentIndex()) {<span class="visually-hidden">, {{ 'wizard.current' | t }}</span>}
              </span>
            }
          </li>
        }
      </ol>
    </nav>

    <div class="layout">
      <section class="content"><router-outlet /></section>

      @if (country(); as c) {
        <aside class="ticket no-print" [attr.aria-label]="'ticket.title' | t" data-testid="ticket">
          <h2 class="ticket__title">{{ 'ticket.title' | t }}</h2>
          <app-plate [value]="content.plate()" [country]="c.code" size="sm" />
          <p class="ticket__vehicle">{{ content.vehicleLine() || ('ticket.noPlate' | t) }}</p>
          <div class="ticket__tear" aria-hidden="true"></div>
          @if (content.selectedPlan(); as p) {
            <p class="ticket__plan">{{ p.name }}</p>
            <p class="ticket__price" data-testid="ticket-price">
              {{ p.finalPrice | money: c.currency : c.numberLocale }}<span>{{ 'plans.perMonth' | t }}</span>
            </p>
          } @else {
            <p class="ticket__muted">{{ 'ticket.noPlan' | t }}</p>
          }
        </aside>
      }
    </div>
  `,
  styles: `
    .steps { margin-bottom: 32px; }
    .steps ol { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; counter-reset: s; }
    .step { flex: 1; display: flex; align-items: center; gap: 10px; padding-top: 12px; border-top: 4px solid var(--line); color: var(--ink-soft); }
    .step--done { border-top-color: var(--ink); color: var(--ink); }
    .step--current { border-top-color: var(--signal); color: var(--ink); font-weight: 700; }
    .step__dot { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 2px solid currentColor; font-size: var(--fs-sm); font-weight: 700; flex: none; }
    .step--done .step__dot { background: var(--ink); color: #fff; border-color: var(--ink); }
    .step--current .step__dot { background: var(--signal); border-color: var(--ink); }
    .step__label { color: inherit; min-height: 44px; display: inline-flex; align-items: center; }
    a.step__label { color: var(--route); }
    .steps__mobile { display: none; margin: 0 0 8px; font-weight: 600; color: var(--ink-soft); }

    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 40px; align-items: start; }
    .ticket { position: sticky; top: 20px; padding: 24px; border-radius: var(--r-md); background: var(--card); border: 1px solid var(--line); box-shadow: var(--shadow-lift); }
    .ticket__title { font-size: var(--fs-sm); color: var(--ink-soft); font-family: var(--font-body); font-weight: 600; margin-bottom: 16px; }
    .ticket__vehicle { margin: 14px 0 0; color: var(--ink-soft); }
    .ticket__tear { margin: 20px -24px; border-top: 2px dashed var(--line); position: relative; }
    .ticket__tear::before, .ticket__tear::after { content: ''; position: absolute; top: -11px; width: 20px; height: 20px; border-radius: 50%; background: var(--paper); border: 1px solid var(--line); }
    .ticket__tear::before { left: -11px; } .ticket__tear::after { right: -11px; }
    .ticket__plan { font: 700 var(--fs-lg)/1.2 var(--font-display); margin: 0; }
    .ticket__price { font: 800 var(--fs-2xl)/1.1 var(--font-display); margin: 6px 0 0; font-variant-numeric: tabular-nums; }
    .ticket__price span { font: 500 var(--fs-sm) var(--font-body); color: var(--ink-soft); margin-left: 4px; }
    .ticket__muted { color: var(--ink-soft); margin: 0; }

    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
      .ticket { position: static; order: -1; display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 16px; padding: 16px; }
      .ticket__title, .ticket__tear { display: none; }
      .ticket__vehicle { margin: 0; grid-column: 2; grid-row: 1; }
      .ticket__plan, .ticket__price, .ticket__muted { grid-column: 1 / -1; }
      .ticket__plan { margin-top: 12px; }
    }
    @media (max-width: 640px) {
      .steps__mobile { display: block; }
      .step__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .step { justify-content: center; }
    }
  `,
})
export class WizardShell {
  private readonly router = inject(Router);
  private readonly store = inject(QuoteStore);
  protected readonly content = inject(QuoteContent);
  protected readonly country = inject(CountryContext).country;
  protected readonly steps = STEPS;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** confirmation counts as "all steps done" */
  protected readonly currentIndex = computed(() => {
    const segment = this.url().split('?')[0].split('/').pop() ?? '';
    const i = STEPS.findIndex((s) => s.path === segment);
    return i === -1 ? STEPS.length : i;
  });

  protected reachable(i: number): boolean {
    if (this.store.confirmation()) return false;
    if (i === 0) return true;
    if (i === 1) return this.store.step1Complete();
    return this.store.step1Complete() && !!this.store.planCode();
  }
}
