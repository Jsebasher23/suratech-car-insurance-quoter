import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-load-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div class="panel err" role="alert" data-testid="load-error">
      <h2>{{ 'state.error.title' | t }}</h2>
      <p>{{ 'state.error.body' | t }}</p>
      <button type="button" class="btn" (click)="retry.emit()" data-testid="retry">{{ 'state.retry' | t }}</button>
    </div>
  `,
  styles: `.err { border-left: 4px solid var(--danger); }`,
})
export class LoadError {
  readonly retry = output<void>();
}
