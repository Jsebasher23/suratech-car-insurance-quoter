import { TestBed } from '@angular/core/testing';
import { CO_FIELDS, CO_PLANS, VALID_CO_VALUES } from '../../../testing/fixtures';
import { setupStep } from '../../../testing/harness';
import { PlansStep } from './plans-step';

async function render() {
  const ctx = await setupStep();
  ctx.store.setFormValues(VALID_CO_VALUES, true);
  const fixture = TestBed.createComponent(PlansStep);
  const el: HTMLElement = fixture.nativeElement;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); };
  await settle();
  return { ...ctx, el, settle };
}
const continueBtn = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('[data-testid=continue]')!;

describe('PlansStep (US-02)', () => {
  it('US-02-AC-12 shows loading, then error with retry', async () => {
    const { el, api, settle } = await render();
    expect(el.querySelector('[data-testid=skeleton]')).not.toBeNull();
    api.fields$.next(CO_FIELDS);
    api.plans$.error(new Error('500'));
    await settle();
    expect(el.querySelector('[data-testid=load-error]')).not.toBeNull();
  });

  it('US-02-AC-07 explains that no plans are available and keeps Continue disabled', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next([]);
    await settle();
    expect(el.querySelector('[data-testid=no-plans]')?.textContent).toContain('No hay planes disponibles');
    expect(continueBtn(el).disabled).toBe(true);
  });

  it('US-02-AC-03 distinguishes the recommended plan visually and for assistive tech', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    await settle();
    const plus = el.querySelector('[data-testid=plan-CO-PLUS]')!;
    expect(plus.classList).toContain('plan--featured');
    expect(plus.querySelector('[data-testid=recommended-badge]')?.textContent).toContain('Recomendado');
    expect(el.querySelector('#plan-name-CO-PLUS')?.textContent).toContain('Recomendado'); // in the radio's accessible name
    expect(el.querySelectorAll('.plan--featured').length).toBe(1);
  });

  it('US-02-AC-05 marks the selection and enables continue; US-02-AC-06 single selection', async () => {
    const { el, api, store, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    await settle();
    expect(continueBtn(el).disabled).toBe(true);
    const radios = el.querySelectorAll<HTMLInputElement>('input[type=radio][name=plan]');
    expect(radios.length).toBe(3);
    radios[0].click();
    await settle();
    radios[2].click();
    await settle();
    expect(store.planCode()).toBe('CO-FULL');
    expect([...radios].filter((r) => r.checked).length).toBe(1);
    expect(el.querySelector('[data-testid=plan-CO-FULL]')!.classList).toContain('plan--chosen');
    expect(continueBtn(el).disabled).toBe(false);
  });

  it('US-02-AC-08/09 shows the final price in the country format', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    await settle();
    const price = el.querySelector('[data-testid=plan-CO-PLUS] [data-testid=plan-price]')!.textContent!.replace(/\s/g, ' ');
    expect(price).toBe('$ 149.900'); // vehicle 5 y, driver 36 y → factors 1.0
  });

  it('US-02-AC-09 the "Why this price?" disclosure lists the factors applied', async () => {
    const { el, api, store, settle } = await render();
    store.setFormValues({ ...VALID_CO_VALUES, vehicleYear: 2012, birthDate: '2004-01-01' }, true);
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    await settle();
    const why = el.querySelector('details.why')!;
    expect(why.querySelector('summary')?.textContent).toContain('¿Cómo calculamos este precio?');
    const items = [...why.querySelectorAll('li')].map((li) => li.textContent?.trim());
    expect(items).toEqual(['Antigüedad del vehículo: 14 años × 1.25', 'Edad del conductor: 22 años × 1.20']);
    expect(el.querySelector('[data-testid=plan-CO-BASIC] [data-testid=plan-price]')!.textContent!.replace(/\s/g, ' ')).toBe('$ 134.900');
  });

  it('US-02 G-04 explains why the selection was cleared when the plan was withdrawn', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    await settle();
    expect(el.querySelector('[data-testid=plan-withdrawn]')).toBeNull();
  });
});
