import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="sk" [class.sk--cards]="variant() === 'cards'" aria-busy="true" data-testid="skeleton">
      <span class="visually-hidden" role="status">{{ 'state.loading' | t }}</span>
      @for (i of rows(); track i) {
        <div class="sk__item"></div>
      }
    </div>
  `,
  styles: `
    .sk { display: grid; gap: 16px; }
    .sk--cards { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .sk__item { height: 64px; border-radius: var(--r-sm); background: linear-gradient(90deg, #e6eaf0, #f4f6f9, #e6eaf0); background-size: 200% 100%; animation: sh 1.4s infinite linear; }
    .sk--cards .sk__item { height: 320px; border-radius: var(--r-md); }
    @keyframes sh { to { background-position: -200% 0; } }
  `,
})
export class Skeleton {
  readonly count = input(3);
  readonly variant = input<'rows' | 'cards'>('rows');
  protected rows = () => Array.from({ length: this.count() }, (_, i) => i);
}
