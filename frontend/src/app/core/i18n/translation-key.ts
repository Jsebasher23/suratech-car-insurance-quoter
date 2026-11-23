import { es } from './dictionaries/es';

/** Every UI string key. A typo in a template or a missing translation is a compile error. */
export type TranslationKey = keyof typeof es;
export type Dictionary = Record<TranslationKey, string>;
