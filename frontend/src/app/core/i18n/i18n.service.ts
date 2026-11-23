import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';
import { pt } from './dictionaries/pt';
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_META, Language } from './languages';
import { Dictionary, TranslationKey } from './translation-key';
import { safeStorage } from '../util/safe-storage';

const DICTIONARIES: Record<Language, Dictionary> = { es, en, pt };
export const LANGUAGE_STORAGE_KEY = 'ciq.lang';

export type TranslateParams = Record<string, string | number>;

/** US-04-AC-06 — saved preference → browser language → default. */
export function detectInitialLanguage(saved: string | null, browserLanguages: readonly string[]): Language {
  if (saved && (LANGUAGES as readonly string[]).includes(saved)) return saved as Language;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split('-')[0];
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Language;
  }
  return DEFAULT_LANGUAGE;
}

export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** ADR-0003 — runtime UI translations, same build, signal-based. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = safeStorage(() => this.document.defaultView?.localStorage);

  private readonly _lang = signal<Language>(
    detectInitialLanguage(this.storage.get(LANGUAGE_STORAGE_KEY), this.document.defaultView?.navigator.languages ?? []),
  );
  readonly lang = this._lang.asReadonly();
  readonly dictionary = computed(() => DICTIONARIES[this._lang()]);
  /** BCP-47 tag for dates in the UI language (money uses the country locale instead). */
  readonly tag = computed(() => LANGUAGE_META[this._lang()].tag);

  constructor() {
    this.applyHtmlLang(this._lang());
  }

  setLanguage(lang: Language): void {
    if (!LANGUAGES.includes(lang) || lang === this._lang()) return;
    this._lang.set(lang);
    this.storage.set(LANGUAGE_STORAGE_KEY, lang);
    this.applyHtmlLang(lang);
  }

  t(key: TranslationKey, params?: TranslateParams): string {
    return interpolate(this.dictionary()[key] ?? key, params);
  }

  private applyHtmlLang(lang: Language): void {
    this.document.documentElement.lang = LANGUAGE_META[lang].tag;
  }
}
