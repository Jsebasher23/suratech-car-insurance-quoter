import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CountryContext } from '../../core/country/country-context';
import { buildFormGroup } from '../../core/domain/form-builder';
import { FieldSection, FormFieldConfig, SECTIONS } from '../../core/domain/models';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translation-key';
import { QuoteContent } from '../../core/state/quote-content';
import { QuoteStore } from '../../core/state/quote.store';
import { Clock } from '../../core/util/clock';
import { LoadError } from '../../shared/ui/load-error';
import { Skeleton } from '../../shared/ui/skeleton';
import { DynamicField } from './dynamic-field';

/** US-01 — step 1, generated 100 % from the Strapi configuration of the current country. */
@Component({
  selector: 'app-data-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslatePipe, DynamicField, Skeleton, LoadError],
  template: `
    <h1 #heading tabindex="-1">{{ 'data.title' | t }}</h1>
    <p class="lead">{{ 'data.lead' | t }}</p>

    @switch (content.fields.state().status) {
      @case ('loading') { <app-skeleton [count]="5" /> }
      @case ('error') { <app-load-error (retry)="content.fields.reload()" /> }
      @default {
        @if (form(); as fg) {
          @if (sections().length === 0) {
            <p class="alert alert--info" role="status" data-testid="no-fields">{{ 'data.empty' | t }}</p>
          }
          <form [formGroup]="fg" (ngSubmit)="submit()" novalidate data-testid="data-form">
            @for (s of sections(); track s.section) {
              <fieldset class="section" [attr.data-section]="s.section">
                <legend>{{ sectionLabel[s.section] | t }}</legend>
                <div class="grid">
                  @for (f of s.fields; track f.key) {
                    <app-dynamic-field [field]="f" [control]="fg.controls[f.key]" [submitted]="submitted()" />
                  }
                </div>
              </fieldset>
            }
            @if (submitted() && fg.invalid) {
              <p class="alert" role="alert" data-testid="form-invalid">{{ 'data.fixErrors' | t }}</p>
            }
            <div class="actions">
              <span></span>
              <button type="submit" class="btn" data-testid="continue" [disabled]="sections().length === 0">{{ 'wizard.continue' | t }}</button>
            </div>
          </form>
        }
      }
    }
  `,
  styles: `
    .section { border: 0; margin: 0 0 32px; padding: 0; }
    legend { font: 700 var(--fs-lg)/1.2 var(--font-display); margin-bottom: 16px; padding: 0; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 24px; }
    @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class DataStep {
  protected readonly content = inject(QuoteContent);
  private readonly store = inject(QuoteStore);
  private readonly ctx = inject(CountryContext);
  private readonly clock = inject(Clock);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');

  protected readonly submitted = signal(false);
  protected readonly sectionLabel: Record<FieldSection, TranslationKey> = {
    policyholder: 'data.section.policyholder',
    vehicle: 'data.section.vehicle',
  };

  /**
   * Rebuilt when the configuration changes (country / language / reload). Values come from
   * the store, so switching language never loses data (US-04-AC-04).
   */
  protected readonly form = computed(() => {
    const fields = this.content.fields.value();
    const country = this.ctx.country();
    if (!fields || !country) return null;
    return untracked(() =>
      buildFormGroup(fields, this.store.formValues(), { today: this.clock.today(), legalAge: country.legalAge }),
    );
  });

  protected readonly sections = computed(() => {
    const fields = this.content.fields.value() ?? [];
    return SECTIONS.map((section) => ({ section, fields: fields.filter((f) => f.section === section) })).filter(
      (s) => s.fields.length > 0,
    );
  });

  constructor() {
    // Persist every change (US-01-AC-06) and keep "step 1 complete" in sync with validity.
    effect((onCleanup) => {
      const fg = this.form();
      if (!fg) return;
      untracked(() => this.store.setFormValues(fg.getRawValue(), fg.valid)); // drops stale keys (G-09)
      const sub = fg.valueChanges.subscribe(() => this.store.setFormValues(fg.getRawValue(), fg.valid));
      onCleanup(() => sub.unsubscribe());
    });
    afterNextRender(() => this.heading()?.nativeElement.focus());
  }

  submit(): void {
    const fg = this.form();
    if (!fg) return;
    this.submitted.set(true);
    fg.markAllAsTouched();
    if (fg.invalid) {
      this.focusFirstInvalid(this.content.fields.value() ?? []);
      return;
    }
    this.store.setFormValues(fg.getRawValue(), true);
    void this.router.navigate(['../plans'], { relativeTo: this.route });
  }

  /** US-01-AC-04 — focus the first invalid control in visual order. */
  private focusFirstInvalid(fields: FormFieldConfig[]): void {
    const fg = this.form();
    const ordered = this.sections().flatMap((s) => s.fields);
    const first = ordered.find((f) => fg?.controls[f.key]?.invalid) ?? fields[0];
    if (!first) return;
    // getElementById: no selector escaping needed for CMS-defined keys (CSS.escape is not universal)
    this.host.nativeElement.ownerDocument.getElementById(`f-${first.key}`)?.focus();
  }
}
