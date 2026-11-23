import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { CountryContext } from './core/country/country-context';
import { I18nService } from './core/i18n/i18n.service';
import { TranslatePipe } from './core/i18n/translate.pipe';
import { TranslationKey } from './core/i18n/translation-key';
import { LanguageSwitcher } from './shared/ui/language-switcher';

const STEP_TITLES: Record<string, TranslationKey> = {
  data: 'wizard.step.data',
  plans: 'wizard.step.plans',
  summary: 'wizard.step.summary',
  confirmation: 'confirmation.title',
};

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, TranslatePipe, LanguageSwitcher],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly ctx = inject(CountryContext);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly title = inject(Title);

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.split('#')[0]),
      startWith(this.router.url.split('#')[0]),
    ),
    { initialValue: '/' },
  );

  /** RV-13 — "<step> · <country> · Ruta Segura", in the active language (WCAG 2.4.2). */
  private readonly pageTitle = computed(() => {
    const segment = this.currentUrl().split('?')[0].split('/').pop() ?? '';
    const step = STEP_TITLES[segment];
    const country = this.ctx.country();
    const parts = [step ? this.i18n.t(step) : this.i18n.t('app.tagline'), country?.name, this.i18n.t('app.brand')];
    return parts.filter(Boolean).join(' · ');
  });

  constructor() {
    effect(() => this.title.setTitle(this.pageTitle()));
  }

  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
  }
}
