import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  it('US-04-AC-01 offers ES/EN/PT named in their own language, as toggle buttons', async () => {
    localStorage.setItem('ciq.lang', 'es');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const buttons = [...el.querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Español', 'English', 'Português']);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');

    buttons[2].click();
    await fixture.whenStable();
    expect(TestBed.inject(I18nService).lang()).toBe('pt');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });
});
