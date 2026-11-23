import { TestBed } from '@angular/core/testing';
import { I18nService, LANGUAGE_STORAGE_KEY, detectInitialLanguage, interpolate } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => localStorage.clear());

  it('US-04-AC-06 initial language: saved → browser → es', () => {
    expect(detectInitialLanguage('pt', ['en-US'])).toBe('pt');
    expect(detectInitialLanguage(null, ['pt-BR', 'en'])).toBe('pt');
    expect(detectInitialLanguage(null, ['en-GB'])).toBe('en');
    expect(detectInitialLanguage(null, ['fr-FR', 'de'])).toBe('es');
    expect(detectInitialLanguage('xx', [])).toBe('es');
  });

  it('US-04-AC-02 switching language updates translations, <html lang> and the saved preference', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('pt');
    expect(i18n.t('wizard.continue')).toBe('Continuar');
    expect(document.documentElement.lang).toBe('pt-BR');
    i18n.setLanguage('en');
    expect(i18n.t('wizard.back')).toBe('Back');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });

  it('interpolates parameters', () => {
    expect(interpolate('Paso {current} de {total}', { current: 1, total: 3 })).toBe('Paso 1 de 3');
    expect(interpolate('Hola {x}', {})).toBe('Hola {x}');
  });
});
