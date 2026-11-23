import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, TranslateParams } from './i18n.service';
import { TranslationKey } from './translation-key';

/**
 * `{{ 'wizard.continue' | t }}` — impure on purpose: it reads the language signal, so the
 * template re-renders (zoneless) when the language changes.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(key: TranslationKey, params?: TranslateParams): string {
    return this.i18n.t(key, params);
  }
}
