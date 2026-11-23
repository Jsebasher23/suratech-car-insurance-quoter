import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MoneyPipe } from '../../core/format/money.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { QuoteStore } from '../../core/state/quote.store';

/** US-03-AC-09 — confirmation with the simulated quote number. */
@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, MoneyPipe],
  template: `
    @if (store.confirmation(); as c) {
      <div class="done" data-testid="confirmation">
        <div class="seal" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="M24 3 6 10v12c0 11.2 7.7 19.8 18 22.5C34.3 41.8 42 33.2 42 22V10L24 3Z" fill="var(--signal)" stroke="var(--ink)" stroke-width="3"/><path d="m15 24 6 6 12-13" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h1 #heading tabindex="-1">{{ 'confirmation.title' | t }}</h1>
        <p class="lead">{{ 'confirmation.lead' | t }}</p>
        <dl class="receipt panel">
          <div class="receipt__main">
            <dt>{{ 'confirmation.quoteNumber' | t }}</dt>
            <dd data-testid="quote-number">{{ c.quoteNumber }}</dd>
          </div>
          <div><dt>{{ 'confirmation.plan' | t }}</dt><dd>{{ c.planName }}</dd></div>
          <div><dt>{{ 'confirmation.paid' | t }}</dt><dd>{{ c.amount | money: c.currency : c.numberLocale }} · {{ paidAt(c.paidAt) }}</dd></div>
        </dl>
        <div class="actions no-print">
          <button type="button" class="btn btn--ghost" (click)="print()">{{ 'confirmation.print' | t }}</button>
          <button type="button" class="btn" (click)="startOver()" data-testid="new-quote">{{ 'confirmation.new' | t }}</button>
        </div>
      </div>
    }
  `,
  styles: `
    .done { max-width: 640px; }
    .seal svg { width: 64px; height: 64px; margin-bottom: 12px; }
    .receipt { margin: 0; display: grid; gap: 16px; dt { color: var(--ink-soft); font-size: var(--fs-sm); } dd { margin: 0; font-weight: 600; } }
    .receipt__main dd { font: 800 var(--fs-2xl)/1.1 var(--font-display); letter-spacing: .04em; overflow-wrap: anywhere; }
  `,
})
export class Confirmation {
  protected readonly store = inject(QuoteStore);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  constructor() {
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  paidAt(iso: string): string {
    return new Intl.DateTimeFormat(this.i18n.tag(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  }
  print(): void {
    window.print();
  }
  startOver(): void {
    this.store.reset();
    void this.router.navigate(['../data'], { relativeTo: this.route });
  }
}
