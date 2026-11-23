# ADR-0002 — Content localization with the Strapi i18n plugin (language ≠ country)

- Status: Proposed — **HC-2 sign-off pending** (tech lead: name + date)
- Specs: US-04-AC-03, US-04-AC-05, US-04-AC-07, US-01-AC-07 · Origin: human request (US-04)

## Context
The human operator added a requirement: the app must work in Spanish, English and Portuguese.
Business copy (labels, help, errors, plan names, coverages, terms) lives in Strapi, so it must be
translatable by the business team too.

## Options
| Option | Pros | Cons |
|---|---|---|
| **A. Strapi 5 i18n plugin, locales `es` (default), `en`, `pt`; only text attributes localized** | Native admin UX (locale switcher, "fill from another locale"); non-localized attributes (price, order, flags, validation) are shared → changed once | Each document must be published per locale; REST returns nothing for a locale without localization → we need a fallback |
| B. Duplicate text attributes (`label_es`, `label_en`, `label_pt`) | One request, no fallback logic | Schema change per new language; ugly admin; easy to forget one |
| C. Machine-translate at runtime in the browser (external API) | No content work | Needs an external API key in the browser (ADR-0004 forbids), legal terms must not be machine-translated, latency/cost |
| D. Angular i18n (`@angular/localize`) for everything | Compile-time safety | One build per language (violates "same build" spirit) and cannot translate CMS content |

## Decision
**Option A.** `pluginOptions.i18n.localized=true` on the content types; `false` on every
non-text attribute. Locale codes are languages only (`es`, `en`, `pt`) — never `es-CO`.

**Fallback:** `ContentApi` requests the active locale **and** `es` in parallel when the active
locale is not `es`, and merges by `documentId` preferring the active locale. Numbers/currency
are formatted with `country.numberLocale`, not with the language.

## Consequences
- ✅ Business translates in the admin they already use; prices are never duplicated.
- ✅ A missing translation degrades to Spanish instead of an empty page.
- ⚠️ 2 requests per content load when the locale is not `es` (small JSON, acceptable; could be
  replaced by a Strapi custom controller later).
- ⚠️ Seed must create 3 localizations per document (done in `backend/src/seed`).
