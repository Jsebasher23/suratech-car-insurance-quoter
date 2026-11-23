import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The one loud element of the identity: the user's own registration plate, live.
 * Purely visual (aria-hidden); the plate is also present as text where it matters.
 */
@Component({
  selector: 'app-plate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plate" [class.plate--empty]="!value()" [class.plate--sm]="size() === 'sm'" aria-hidden="true">
      @if (country()) {
        <span class="plate__country">{{ country() }}</span>
      }
      <span class="plate__value">{{ value() || placeholder() }}</span>
    </div>
  `,
  styles: `
    :host { display: inline-block; }
    .plate {
      display: inline-flex; align-items: stretch; border: 3px solid var(--ink); border-radius: 10px;
      background: var(--signal); color: #1a1a1a; box-shadow: inset 0 0 0 2px rgb(255 255 255 / .45), 0 6px 0 -2px rgb(20 35 66 / .25);
      font-family: var(--font-display); overflow: hidden; transform: rotate(-2deg);
    }
    .plate__country { display: grid; place-items: center; padding: 0 8px; background: var(--ink); color: var(--signal); font-size: .75rem; font-weight: 700; letter-spacing: .06em; }
    .plate__value { padding: 4px 16px; font-size: 2rem; font-weight: 800; letter-spacing: .12em; font-variant-numeric: tabular-nums; min-width: 6ch; text-align: center; }
    .plate--sm .plate__value { font-size: 1.25rem; padding: 2px 10px; }
    .plate--empty .plate__value { color: rgb(26 26 26 / .35); }
  `,
})
export class Plate {
  readonly value = input<string | null>(null);
  readonly country = input('');
  readonly placeholder = input('······');
  readonly size = input<'md' | 'sm'>('md');
}
