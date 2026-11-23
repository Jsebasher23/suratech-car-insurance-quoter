import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoadError } from '../../shared/ui/load-error';
import { Plate } from '../../shared/ui/plate';
import { Skeleton } from '../../shared/ui/skeleton';

/** Landing: lists the countries returned by Strapi, so a new market appears with no code change. */
@Component({
  selector: 'app-country-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, Skeleton, LoadError, Plate],
  template: `
    <section class="hero">
      <div class="hero__copy">
        <h1>{{ 'picker.title' | t }}</h1>
        <p class="lead">{{ 'picker.lead' | t }}</p>
        @if (unknown()) {
          <p class="alert alert--info" role="status" data-testid="unknown-country">{{ 'picker.unknown' | t: { code: unknown()! } }}</p>
        }
        @switch (ctx.countries.state().status) {
          @case ('loading') { <app-skeleton [count]="2" /> }
          @case ('error') { <app-load-error (retry)="ctx.countries.reload()" /> }
          @default {
            <ul class="markets" role="list">
              @for (c of ctx.countries.value(); track c.code) {
                <li>
                  <a class="market" [routerLink]="['/', c.code.toLowerCase(), 'quote', 'data']" [attr.data-testid]="'country-' + c.code">
                    <span class="market__flag" aria-hidden="true">{{ c.flag }}</span>
                    <span class="market__text">
                      <span class="market__name">{{ c.name }}</span>
                      <span class="market__cta">{{ 'picker.choose' | t: { country: c.name } }}</span>
                    </span>
                    <span class="market__cur" aria-hidden="true">{{ c.currency }}</span>
                  </a>
                </li>
              }
            </ul>
          }
        }
      </div>
      <div class="hero__art" aria-hidden="true">
        <div class="road"></div>
        <app-plate value="RUTA26" country="" />
      </div>
    </section>
  `,
  styles: `
    .hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: 48px; align-items: center; min-height: 60vh; }
    h1 { font-size: clamp(2.2rem, 6vw, 4rem); max-width: 14ch; }
    .markets { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; max-width: 520px; }
    .market {
      display: flex; align-items: center; gap: 16px; padding: 18px 20px; border-radius: var(--r-md);
      background: var(--card); border: 1.5px solid var(--line); color: var(--ink); text-decoration: none;
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .market:hover { border-color: var(--ink); transform: translateX(4px); }
    .market__flag { font-size: 2rem; line-height: 1; }
    .market__text { display: grid; flex: 1; }
    .market__name { font: 700 var(--fs-lg)/1.2 var(--font-display); }
    .market__cta { color: var(--route); font-weight: 600; font-size: var(--fs-sm); }
    .market__cur { font-weight: 700; color: var(--ink-soft); font-size: var(--fs-sm); padding: 4px 10px; border-radius: 999px; background: var(--paper); }
    .hero__art { position: relative; display: grid; place-items: center; min-height: 340px; }
    .road { position: absolute; inset: 0; border-radius: var(--r-lg); background:
      repeating-linear-gradient(180deg, var(--signal) 0 38px, transparent 38px 76px) center / 10px 100% no-repeat, var(--ink); }
    app-plate { position: relative; transform: scale(1.4); }
    @media (max-width: 860px) { .hero { grid-template-columns: 1fr; } .hero__art { min-height: 180px; order: -1; } app-plate { transform: scale(1.1); } }
  `,
})
export class CountryPicker {
  protected readonly ctx = inject(CountryContext);
  /** `?unknown=xx` set by countryGuard (US-01-AC-13). */
  readonly unknown = input<string>();
}
