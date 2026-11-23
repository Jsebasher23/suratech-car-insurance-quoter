---
name: angular-conventions
description: Angular 21 coding conventions for this repo (standalone, signals, zoneless, control flow, typed forms, a11y, i18n service, testing with Vitest). Use when writing or reviewing any file under frontend/src.
---

# Angular conventions (project skill)

## Component skeleton
```ts
@Component({
  selector: 'app-plan-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, TranslatePipe],
  templateUrl: './plan-card.html',
  styleUrl: './plan-card.scss',
})
export class PlanCard {
  readonly plan = input.required<Plan>();
  readonly selected = input(false);
  readonly choose = output<string>();
  private readonly i18n = inject(I18nService);
  protected readonly isFeatured = computed(() => this.plan().recommended);
}
```
- No `constructor` injection, no `@Input()`/`@Output()` decorators, no NgModules.
- Templates: `@if`/`@for (x of xs; track x.id)`/`@switch`; never structural directives.
- State that outlives a component → `QuoteStore` (signals). Derived values → `computed`.
  Side effects (persistence, focus) → `effect` in services or `afterNextRender`.

## Forms
- Reactive typed forms (`FormGroup<Record<string, FormControl<unknown>>>`) built by
  `DynamicFormBuilder` from `FormFieldConfig[]`. Validators come from `core/domain/validators.ts`.
- Show errors when `control.invalid && (control.touched || submitted())`.
- On invalid submit: mark all touched and move focus to the first invalid control.

## i18n (ADR-0003)
- UI chrome: `{{ 'wizard.next' | t }}`; keys are typed (`TranslationKey`) so a missing key
  is a compile error. Dictionaries: `core/i18n/dictionaries/{es,en,pt}.ts`.
- Business copy: from Strapi in the active locale (re-fetched on language change).
- Money: `MoneyPipe` uses the **country's** `numberLocale` + currency, not the UI language.

## Accessibility
- `<label [for]>` on every control; help and error ids in `aria-describedby`;
  `aria-invalid` on invalid controls; error text inside `role="alert"`.
- Step change → focus the `<h1 tabindex="-1">` of the new step.
- Plan selection is a native radio group (arrow keys work for free).
- Visible focus ring; colour contrast ≥ 4.5:1; touch targets ≥ 44 px.

## Testing
- Pure functions: plain Vitest, no TestBed.
- Components: `TestBed` + `provideZonelessChangeDetection()` + `HttpTestingController`
  or a fake `ContentApi`.
- Test title starts with the AC ID.
