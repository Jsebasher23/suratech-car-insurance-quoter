import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { buildSummary } from '../../core/domain/summary';
import { MoneyPipe, formatMoney } from '../../core/format/money.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translation-key';
import { PaymentGateway, SandboxOutcome } from '../../core/payment/payment-gateway';
import { QuoteContent } from '../../core/state/quote-content';
import { QuoteStore } from '../../core/state/quote.store';
import { LoadError } from '../../shared/ui/load-error';
import { Skeleton } from '../../shared/ui/skeleton';

/** US-03 — summary, country terms from Strapi and simulated payment. */
@Component({
  selector: 'app-summary-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, MoneyPipe, Skeleton, LoadError],
  templateUrl: './summary-step.html',
  styleUrl: './summary-step.scss',
})
export class SummaryStep {
  protected readonly content = inject(QuoteContent);
  protected readonly store = inject(QuoteStore);
  private readonly i18n = inject(I18nService);
  private readonly gateway = inject(PaymentGateway);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly payError = viewChild<ElementRef<HTMLElement>>('payError');
  protected readonly country = inject(CountryContext).country;

  protected readonly outcome = signal<SandboxOutcome>('approve');

  protected readonly sectionLabel: Record<string, TranslationKey> = {
    policyholder: 'data.section.policyholder',
    vehicle: 'data.section.vehicle',
  };

  protected readonly summary = computed(() =>
    buildSummary(this.content.fields.value() ?? [], this.store.formValues(), {
      yes: this.i18n.t('summary.yes'),
      no: this.i18n.t('summary.no'),
      dateLocale: this.i18n.tag(),
    }),
  );
  protected readonly plan = this.content.selectedPlan;
  protected readonly terms = this.content.terms;

  protected readonly dataState = computed(() => {
    const s = [this.content.fields.state().status, this.content.plans.state().status];
    return s.includes('error') ? 'error' : s.includes('loading') ? 'loading' : 'success';
  });

  /** US-03 rule: pay ⇔ terms present ∧ accepted ∧ not processing/paid. */
  protected readonly canPay = computed(
    () =>
      !!this.terms.value() &&
      !!this.plan() &&
      this.store.termsAccepted() &&
      !this.store.isProcessing() &&
      this.store.payment().status !== 'paid',
  );

  protected readonly priceLabel = computed(() => {
    const p = this.plan();
    const c = this.country();
    return p && c ? formatMoney(p.finalPrice, c.currency, c.numberLocale) : '';
  });

  constructor() {
    effect(() => {
      const t = this.terms.state();
      if (t.status === 'success') this.store.syncTermsVersion(t.value?.version ?? null);
    });
    // a plan withdrawn while on the summary → back to plans
    effect(() => {
      if (this.content.pricedPlans() && !this.plan() && !this.store.confirmation()) {
        void this.router.navigate(['../plans'], { relativeTo: this.route });
      }
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  onAccept(ev: Event): void {
    this.store.setTermsAccepted((ev.target as HTMLInputElement).checked);
  }

  onOutcome(ev: Event): void {
    this.outcome.set((ev.target as HTMLSelectElement).value as SandboxOutcome);
  }

  async pay(): Promise<void> {
    const p = this.plan();
    const c = this.country();
    if (!p || !c || !this.canPay()) return;
    await this.store.pay(
      this.gateway,
      { countryCode: c.code, planCode: p.code, amount: p.finalPrice, currency: c.currency, outcome: this.outcome() },
      { planName: p.name, amount: p.finalPrice, currency: c.currency, numberLocale: c.numberLocale },
    );
    if (this.store.payment().status === 'paid') {
      await this.router.navigate(['../confirmation'], { relativeTo: this.route, replaceUrl: true });
    } else {
      setTimeout(() => this.payError()?.nativeElement.focus());
    }
  }

  go(step: 'data' | 'plans'): void {
    void this.router.navigate(['..', step], { relativeTo: this.route });
  }
}
