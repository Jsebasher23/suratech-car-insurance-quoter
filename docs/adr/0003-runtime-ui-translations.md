# ADR-0003 — Runtime UI translations with a typed signal-based I18nService

- Status: Proposed — **HC-2 Johan Sebastian Beltran 2026-11-22** (tech lead: name + date) · Specs: US-04-AC-01, -02, -06

## Context
UI chrome (buttons, step names, generic states) is not business content, must switch at runtime
(same build) and must not lose wizard state.

## Options
| Option | Pros | Cons |
|---|---|---|
| `@angular/localize` | Official, extraction tooling | Build per locale, switching = full reload to another bundle |
| `ngx-translate` / Transloco | Mature, lazy JSON | Extra dependency; keys are strings → typos only found at runtime |
| **Own `I18nService` (signal) + typed TS dictionaries + pure `t` pipe** | ~80 lines; `TranslationKey` derived from the `es` dictionary → missing key = **compile error**; `en`/`pt` typed as `Record<TranslationKey,string>` so a missing translation also fails the build | We own interpolation & plural rules (only simple `{name}` interpolation needed) |

## Decision
Own service. Language stored in `localStorage` (`ciq.lang`), initial value saved → browser → `es`.
Changing the language updates `<html lang>` and triggers Strapi re-fetch via a `locale` signal
that `ContentApi` resources depend on. The language is **not** in the URL (country is) to keep
URLs short and shareable across languages.

## Consequences
- ✅ Type-safe keys; no dependency; zoneless-friendly (`pure: false` pipe reading a signal).
- ⚠️ No pluralization ICU support — not needed by current copy; revisit if needed.
