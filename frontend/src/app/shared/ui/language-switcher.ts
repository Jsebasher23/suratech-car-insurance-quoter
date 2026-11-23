import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { LANGUAGES, LANGUAGE_META, Language } from '../../core/i18n/languages';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

/**
 * US-04-AC-01 — segmented control; each option is announced in its own language.
 * RV-12: the accessible name starts with the visible text ("PT – Português", WCAG 2.5.3).
 */
@Component({
  selector: 'app-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="switch" role="group" [attr.aria-label]="'app.language' | t">
      @for (l of languages; track l) {
        <button
          type="button"
          class="switch__opt"
          [attr.lang]="meta[l].tag"
          [attr.aria-pressed]="i18n.lang() === l"
          [attr.aria-label]="l.toUpperCase() + ' – ' + meta[l].native"
          [attr.data-testid]="'lang-' + l"
          (click)="choose(l)"
        >
          {{ l.toUpperCase() }}
        </button>
      }
    </div>
  `,
  styles: `
    .switch { display: inline-flex; padding: 3px; border-radius: 999px; background: rgb(255 255 255 / 0.12); }
    .switch__opt {
      min-width: 44px; min-height: 36px; padding: 0 10px; border: 0; border-radius: 999px;
      background: transparent; color: #fff; font: 600 var(--fs-sm) / 1 var(--font-body); cursor: pointer;
      letter-spacing: 0.02em;
    }
    .switch__opt[aria-pressed='true'] { background: #fff; color: var(--ink); }
    .switch__opt:focus-visible { box-shadow: 0 0 0 3px var(--signal); }
  `,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);
  protected readonly languages = LANGUAGES;
  protected readonly meta = LANGUAGE_META;
  choose(l: Language): void {
    this.i18n.setLanguage(l);
  }
}
