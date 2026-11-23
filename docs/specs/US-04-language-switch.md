# US-04 — Language switch (ES / EN / PT)

Status: Approved (HC-1 — candidate, 2026-11-22)
Story: [docs/user-stories/US-04-language.md](../user-stories/US-04-language.md) · ADRs: [ADR-0002](../adr/0002-content-localization-strapi-i18n.md), [ADR-0003](../adr/0003-runtime-ui-translations.md)

## 1. Goal
Same build, runtime language switch for UI chrome **and** CMS content, independent of country.

## 3. Acceptance criteria
| ID | Given / When / Then | Source | Test type |
|----|---|---|---|
| US-04-AC-01 | A language selector (ES / EN / PT) is in the header, reachable by keyboard, with `lang` names in their own language ("Español", "English", "Português") | Story | component |
| US-04-AC-02 | Switching language updates all UI chrome immediately and sets `<html lang>` | Story | unit (I18nService) |
| US-04-AC-03 | Switching language re-fetches Strapi content in the new locale (labels, errors, plans, terms) | Story | unit (ContentApi locale) + e2e |
| US-04-AC-04 | Entered data, selected plan and terms acceptance are preserved after switching | Story scenario | e2e |
| US-04-AC-05 | Missing Strapi translation falls back to `es` | Business rule | unit |
| US-04-AC-06 | Initial language: saved preference → browser language (`pt-*`→pt, `en-*`→en) → `es` | G-01 | unit |
| US-04-AC-07 | Prices keep the **country** format whatever the language | ADR-0002 | unit (MoneyPipe) |

## 5. Gap analysis
| Gap | Question | Decision |
|---|---|---|
| G-01 | Default language? | Saved → browser → `es` |
| G-02 | Language in URL? | No — preference in `localStorage`; URL carries only country (ADR-0003) |
| G-03 | Fallback granularity | Whole-entry fallback: if a document has no `pt` localization, the `es` one is used |

## 8. Traceability
| AC | Test | Status |
|---|---|---|
| AC-01 | `language-switcher.spec.ts › US-04-AC-01 …` | ✅ |
| AC-02 | `i18n.service.spec.ts › US-04-AC-02 …` | ✅ |
| AC-03 | `content-api.spec.ts › US-04-AC-03 passes the active locale` | ✅ |
| AC-04 | `e2e/quote-flow.spec.ts › US-04-AC-04 switch language keeps data` | ✅ |
| AC-05 | `content-api.spec.ts › US-04-AC-05 falls back to es` | ✅ |
| AC-06 | `i18n.service.spec.ts › US-04-AC-06 …` | ✅ |
| AC-07 | `money.spec.ts › US-04-AC-07 …` | ✅ |
