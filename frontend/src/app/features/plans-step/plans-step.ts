import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, effect, inject, input, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { MoneyPipe } from '../../core/format/money.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { QuoteContent } from '../../core/state/quote-content';
import { QuoteStore } from '../../core/state/quote.store';
import { LoadError } from '../../shared/ui/load-error';
import { Skeleton } from '../../shared/ui/skeleton';

/**
 * US-02 — plan list. Native radio group = single selection + arrow-key navigation for free
 * (US-02-AC-06). Prices are re-computed locally from step-1 data (ADR-0007).
 */
@Component({
  selector: 'app-plans-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, MoneyPipe, Skeleton, LoadError],
  template: `
    <h1 #heading tabindex="-1">{{ 'plans.title' | t }}</h1>
    <p class="lead">{{ 'plans.lead' | t }}</p>

    @if (state() === 'loading') {
      <app-skeleton variant="cards" [count]="3" />
    } @else if (state() === 'error') {
      <app-load-error (retry)="retry()" />
    } @else if (plans().length === 0) {
      <div class="panel empty" role="status" data-testid="no-plans">
        <h2>{{ 'plans.empty.title' | t }}</h2>
        <p>{{ 'plans.empty.body' | t }}</p>
      </div>
    } @else if (country(); as c) {
      @if (withdrawn()) {
        <p class="alert alert--info" role="status" data-testid="plan-withdrawn">{{ 'plans.withdrawn' | t }}</p>
      }
      <fieldset class="plans">
        <legend class="visually-hidden">{{ 'plans.title' | t }}</legend>
        @for (p of plans(); track p.code) {
          <!-- RV-18: the card is a div; only the radio + name are inside the <label>; the label is
               stretched over the card (CSS) so clicking anywhere selects, with no extra handlers -->
          <div class="plan" [class.plan--featured]="p.highlighted" [class.plan--chosen]="p.code === selected()" [attr.data-testid]="'plan-' + p.code">
            @if (p.highlighted) {
              <span class="plan__flag" data-testid="recommended-badge" aria-hidden="true">{{ p.badge || ('plans.recommended' | t) }}</span>
            }
            <label class="plan__head">
              <input type="radio" name="plan" class="plan__radio" [value]="p.code" [checked]="p.code === selected()" (change)="choose(p.code)"
                [attr.aria-describedby]="'plan-desc-' + p.code" />
              <span class="plan__name" [id]="'plan-name-' + p.code">
                {{ p.name }}
                @if (p.highlighted) {<span class="visually-hidden">— {{ p.badge || ('plans.recommended' | t) }}</span>}
              </span>
            </label>
            <p class="plan__price">
              <strong data-testid="plan-price">{{ p.finalPrice | money: c.currency : c.numberLocale }}</strong>
              <span>{{ 'plans.perMonth' | t }}</span>
            </p>
            <p class="plan__desc" [id]="'plan-desc-' + p.code">{{ p.shortDescription }}</p>

            @if (p.coverages.length) {
              <h3 class="plan__h">{{ 'plans.coverages' | t }}</h3>
              <ul class="plan__list">
                @for (cv of p.coverages; track $index) {
                  <li><span>{{ cv.name }}</span>@if (cv.detail) {<small>{{ cv.detail }}</small>}</li>
                }
              </ul>
            }
            @if (p.benefits.length) {
              <h3 class="plan__h">{{ 'plans.benefits' | t }}</h3>
              <ul class="plan__list plan__list--plus">
                @for (b of p.benefits; track $index) { <li>{{ b }}</li> }
              </ul>
            }
            @if (p.code === selected()) {
              <span class="plan__chosen" aria-hidden="true">✓ {{ 'plans.selected' | t }}</span>
            }
          </div>
        }
      </fieldset>

      @if (plans()[0]; as first) {
        <details class="why">
          <summary>{{ 'plans.why' | t }}</summary>
          <ul>
            @for (f of first.factors; track f.id) {
              <li>{{ (f.id === 'vehicleAge' ? 'plans.factor.vehicleAge' : 'plans.factor.driverAge') | t: { years: f.years, factor: f.factor.toFixed(2) } }}</li>
            } @empty {
              <li>{{ 'plans.factor.none' | t }}</li>
            }
          </ul>
        </details>
      }
    }

    <div class="actions">
      <button type="button" class="btn btn--ghost" (click)="back()" data-testid="back">{{ 'wizard.back' | t }}</button>
      @let showHint = state() === 'success' && plans().length > 0 && !selected();
      @if (showHint) {
        <span class="hint" id="plans-hint">{{ 'plans.selectToContinue' | t }}</span>
      }
      <button type="button" class="btn" data-testid="continue" [disabled]="!canContinue()" (click)="next()"
        [attr.aria-describedby]="showHint ? 'plans-hint' : null">
        {{ 'wizard.continue' | t }}
      </button>
    </div>
  `,
  styleUrl: './plans-step.scss',
})
export class PlansStep {
  private readonly content = inject(QuoteContent);
  private readonly store = inject(QuoteStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  protected readonly country = inject(CountryContext).country;
  /** `?withdrawn=1` when the summary found the chosen plan was withdrawn (US-02 G-04) */
  readonly withdrawn = input<string>();

  protected readonly state = computed(() => {
    const a = this.content.plans.state().status;
    const b = this.content.fields.state().status;
    return a === 'error' || b === 'error' ? 'error' : a === 'loading' || b === 'loading' ? 'loading' : 'success';
  });
  protected readonly plans = computed(() => this.content.pricedPlans() ?? []);
  protected readonly selected = this.store.planCode;
  protected readonly canContinue = computed(() => this.plans().some((p) => p.code === this.selected()));

  constructor() {
    // US-02-AC-13 — a plan withdrawn in Strapi is unselected
    effect(() => {
      if (this.state() !== 'success') return;
      const codes = this.plans().map((p) => p.code);
      untracked(() => this.store.reconcilePlan(codes)); // RV-16: do not track the whole store
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  choose(code: string): void {
    this.store.selectPlan(code);
  }
  retry(): void {
    this.content.plans.reload();
    this.content.fields.reload();
  }
  back(): void {
    void this.router.navigate(['../data'], { relativeTo: this.route });
  }
  next(): void {
    if (this.canContinue()) void this.router.navigate(['../summary'], { relativeTo: this.route });
  }
}
