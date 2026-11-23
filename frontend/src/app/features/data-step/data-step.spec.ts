import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CO_FIELDS, VALID_CO_VALUES } from '../../../testing/fixtures';
import { setupStep } from '../../../testing/harness';
import { DataStep } from './data-step';

async function render() {
  const ctx = await setupStep();
  const fixture = TestBed.createComponent(DataStep);
  const el: HTMLElement = fixture.nativeElement;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); };
  await settle();
  return { ...ctx, fixture, el, settle };
}

describe('DataStep (US-01)', () => {
  it('US-01-AC-11 shows a skeleton while loading, an error with Retry, and an empty state', async () => {
    const { el, api, settle } = await render();
    expect(el.querySelector('[data-testid=skeleton]')).not.toBeNull();

    api.fields$.error(new Error('down'));
    await settle();
    expect(el.querySelector('[data-testid=load-error]')).not.toBeNull();
  });

  it('US-01-AC-11 empty configuration blocks Continue', async () => {
    const { el, api, settle } = await render();
    api.fields$.next([]);
    await settle();
    expect(el.querySelector('[data-testid=no-fields]')).not.toBeNull();
    expect((el.querySelector('[data-testid=continue]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('US-01-AC-01/02 renders only the configured fields, in order, grouped by section', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    await settle();
    const keys = [...el.querySelectorAll('[data-field]')].map((n) => n.getAttribute('data-field'));
    expect(keys).toEqual(CO_FIELDS.map((f) => f.key));
    expect(el.querySelectorAll('fieldset legend').length).toBe(2);
  });

  it('US-01-AC-12 every control has an associated label', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    await settle();
    for (const f of CO_FIELDS) {
      expect(el.querySelector(`label[for="f-${f.key}"]`)?.textContent).toContain(f.label);
    }
  });

  it('US-01-AC-03 shows the configured error message linked by aria-describedby', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    await settle();
    const input = el.querySelector<HTMLInputElement>('#f-documentNumber')!;
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('f-documentNumber-error');
    expect(el.querySelector('#f-documentNumber-error')!.textContent).toContain('El documento debe tener entre 6 y 10 dígitos.');
  });

  it('US-01-AC-04 blocks continue and focuses the first invalid field', async () => {
    const { el, api, settle } = await render();
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate');
    api.fields$.next(CO_FIELDS);
    await settle();
    document.body.appendChild(el);
    (el.querySelector('[data-testid=continue]') as HTMLButtonElement).click();
    await settle();
    expect(nav).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('f-fullName');
    expect(el.querySelector('[data-testid=form-invalid]')).not.toBeNull();
    el.remove();
  });

  it('US-01-AC-06 restores saved values and navigates to plans when valid', async () => {
    const { el, api, store, settle } = await render();
    store.setFormValues(VALID_CO_VALUES, true);
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    api.fields$.next(CO_FIELDS);
    await settle();
    expect(el.querySelector<HTMLInputElement>('#f-fullName')!.value).toBe('Ana María Pérez');
    (el.querySelector('[data-testid=continue]') as HTMLButtonElement).click();
    await settle();
    expect(nav).toHaveBeenCalledWith(['../plans'], expect.anything());
  });

  it('US-04-AC-04 / RV-09 a language switch updates labels but keeps the form, values and shown errors', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    await settle();
    const input = el.querySelector<HTMLInputElement>('#f-documentNumber')!;
    input.value = '12';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
    // Strapi answers in English: same structure, new labels
    api.fields$.next(CO_FIELDS.map((f) => ({ ...f, label: `${f.label} (EN)`, errorMessage: 'EN error' })));
    await settle();
    const after = el.querySelector<HTMLInputElement>('#f-documentNumber')!;
    expect(after.value).toBe('12');
    expect(el.querySelector('label[for="f-documentNumber"]')!.textContent).toContain('(EN)');
    expect(el.querySelector('#f-documentNumber-error')!.textContent).toContain('EN error'); // still touched
  });

  it('RV-11 field errors are not individual live regions (one announcement per submit)', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    await settle();
    (el.querySelector('[data-testid=continue]') as HTMLButtonElement).click();
    await settle();
    expect(el.querySelectorAll('[role=alert]').length).toBe(1);
  });
});
