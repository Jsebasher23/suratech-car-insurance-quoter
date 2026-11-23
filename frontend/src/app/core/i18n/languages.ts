export const LANGUAGES = ['es', 'en', 'pt'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'es';

/** Native names (US-04-AC-01) and BCP-47 tags used for <html lang> and date formatting. */
export const LANGUAGE_META: Record<Language, { native: string; tag: string }> = {
  es: { native: 'Español', tag: 'es' },
  en: { native: 'English', tag: 'en' },
  pt: { native: 'Português', tag: 'pt-BR' },
};
