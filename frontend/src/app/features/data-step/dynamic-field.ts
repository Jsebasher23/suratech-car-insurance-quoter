import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormFieldConfig } from '../../core/domain/models';
import { errorMessageFor } from '../../core/domain/validators';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

/**
 * Renders ONE Strapi-configured field (US-01). Accessibility contract (CLAUDE.md §3.8):
 * <label for>, aria-describedby → help + error, aria-invalid, error in role="alert".
 */
@Component({
  selector: 'app-dynamic-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    @let f = field();
    @let c = control();
    @let invalid = showError();
    <div class="field" [class.field--check]="f.type === 'checkbox'" [attr.data-field]="f.key">
      @if (f.type !== 'checkbox') {
        <label class="field__label" [for]="id()">
          {{ f.label }}
          @if (f.required) {<span class="field__req" aria-hidden="true">*</span><span class="visually-hidden">({{ 'data.required' | t }})</span>}
        </label>
      }

      @switch (f.type) {
        @case ('select') {
          <select class="control" [id]="id()" [formControl]="c" [attr.aria-invalid]="invalid" [attr.aria-required]="f.required" [attr.aria-describedby]="describedBy()">
            <option [ngValue]="null" disabled>{{ 'data.selectPlaceholder' | t }}</option>
            @for (o of f.options; track o.value) {
              <option [ngValue]="o.value">{{ o.label }}</option>
            }
          </select>
        }
        @case ('number') {
          <input class="control" type="number" inputmode="numeric" [id]="id()" [formControl]="c" [placeholder]="f.placeholder ?? ''"
            [attr.aria-invalid]="invalid" [attr.aria-required]="f.required" [attr.aria-describedby]="describedBy()" />
        }
        @case ('date') {
          <input class="control" type="date" [id]="id()" [formControl]="c"
            [attr.aria-invalid]="invalid" [attr.aria-required]="f.required" [attr.aria-describedby]="describedBy()" />
        }
        @case ('checkbox') {
          <div class="check">
            <input type="checkbox" class="check__box" [id]="id()" [formControl]="c"
              [attr.aria-invalid]="invalid" [attr.aria-required]="f.required" [attr.aria-describedby]="describedBy()" />
            <label class="check__label" [for]="id()">
              {{ f.label }}
              @if (f.required) {<span class="field__req" aria-hidden="true">*</span><span class="visually-hidden">({{ 'data.required' | t }})</span>}
            </label>
          </div>
        }
        @default {
          <input class="control" type="text" [id]="id()" [formControl]="c" [placeholder]="f.placeholder ?? ''"
            [attr.autocomplete]="autocomplete()" [attr.aria-invalid]="invalid" [attr.aria-required]="f.required" [attr.aria-describedby]="describedBy()" />
        }
      }

      @if (f.helpText) {
        <p class="field__help" [id]="id() + '-help'">{{ f.helpText }}</p>
      }
      <p class="field__error" [id]="id() + '-error'" role="alert" [attr.data-testid]="'error-' + f.key">
        @if (invalid) {
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor"/><path d="M8 4v5M8 11v1" stroke="#fff" stroke-width="2"/></svg>
          {{ message() }}
        }
      </p>
    </div>
  `,
  styles: `
    .field { display: grid; gap: 6px; align-content: start; }
    .field__label { font-weight: 600; }
    .field__req { color: var(--danger); margin-left: 2px; }
    .field__help { margin: 0; color: var(--ink-soft); font-size: var(--fs-sm); }
    .field__error { margin: 0; min-height: 0; color: var(--danger); font-size: var(--fs-sm); font-weight: 600; display: flex; gap: 6px; align-items: flex-start; }
    .field__error:empty { display: none; }
    .field__error svg { width: 16px; height: 16px; flex: none; margin-top: 2px; }
    .check { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: var(--r-sm); background: var(--paper); border: 1px solid var(--line); }
    .check__box { width: 22px; height: 22px; margin: 1px 0 0; accent-color: var(--ink); flex: none; }
    .check__label { font-weight: 500; }
    .field--check { grid-column: 1 / -1; }
  `,
})
export class DynamicField {
  readonly field = input.required<FormFieldConfig>();
  readonly control = input.required<FormControl<unknown>>();
  /** true after a submit attempt */
  readonly submitted = input(false);
  private readonly i18n = inject(I18nService);

  protected id = () => `f-${this.field().key}`;

  protected showError(): boolean {
    const c = this.control();
    return c.invalid && (c.touched || this.submitted());
  }

  protected message(): string {
    return errorMessageFor(this.field(), this.control()) ?? this.i18n.t('form.errors.generic');
  }

  protected describedBy(): string | null {
    const ids = [this.field().helpText ? `${this.id()}-help` : null, this.showError() ? `${this.id()}-error` : null].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  protected autocomplete(): string | null {
    switch (this.field().role) {
      case 'fullName': return 'name';
      case 'email': return 'email';
      case 'phone': return 'tel-national';
      default: return 'off';
    }
  }
}
