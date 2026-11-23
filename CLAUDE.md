# CLAUDE.md — Global context for every agent

> This file governs **all** agents and subagents working in this repository
> (Claude Code reads it automatically; `AGENTS.md` points here for other tools).
> If an instruction in a subagent definition contradicts this file, **this file wins**.

## 1. Product in one paragraph

Multi-country (Colombia `CO`, Chile `CL`) car-insurance quoting wizard. One Angular build
serves both countries; all form fields, plans and legal terms come from Strapi and are
editable by a non-technical business team without a deployment. The UI is available in
Spanish, English and Portuguese (runtime switch, same build).

## 2. Repository map

| Path | What lives there | Owner agent |
|---|---|---|
| `docs/user-stories/` | Functional stories as received (input, read-only) | human (PO) |
| `docs/specs/` | One spec per story — **source of truth** for code and tests | `spec-writer` |
| `docs/adr/` | Architecture decisions (MADR 3 format) | `architect` |
| `docs/reviews/` | Code-review reports and their resolution | `code-reviewer` |
| `docs/qa/` | QA handoff notes per increment | `qa-handoff` |
| `backend/` | Strapi 5 project (content types, seed, permissions) | `implementer` |
| `frontend/` | Angular 21 app + Vitest unit tests + Playwright e2e | `implementer`, `test-engineer` |
| `.claude/agents/` | Subagent definitions (versioned) | human (tech lead) |
| `.claude/skills/` | Custom skills with reusable project knowledge | human (tech lead) |
| `logs/` | Unedited tool/test/build logs of agent sessions | all |

## 3. Non-negotiable rules

1. **Spec first.** No production code for a story until `docs/specs/US-XX.md` exists with
   status `Approved`. Every acceptance criterion in the spec has an ID (`US-01-AC-03`).
2. **Traceability.** Every commit message, test name and review finding references the
   spec IDs it touches: `feat(form): dynamic validators [US-01-AC-02]`.
   Unit/e2e test titles start with the AC ID: `it('US-01-AC-02 shows configured error …')`.
3. **No country `if`s in components.** Country differences come from Strapi content or from
   the `CountryContext` (see ADR-0001). A literal `'CO'` / `'CL'` is only allowed in seed
   data, fixtures and the country registry.
4. **No hard-coded business copy.** Field labels, help texts, error messages, plan copy and
   terms come from Strapi. UI chrome (buttons, headings) comes from
   `frontend/src/app/core/i18n/dictionaries/*.ts` (ADR-0003) — never inline strings in templates.
5. **Security.** No Strapi API token is ever shipped to the browser. The Public role has
   `find`/`findOne` only on read models listed in ADR-0004. Payment is simulated; never ask
   for or store card data. Only fictitious personal data anywhere (fixtures, seed, logs).
6. **Modern Angular only.** Standalone components, `signal`/`computed`/`effect`,
   `input()`/`output()`, `inject()`, built-in control flow (`@if`, `@for`, `@switch`),
   `ChangeDetectionStrategy.OnPush`, zoneless. **No NgModules, no `*ngIf`/`*ngFor`.**
7. **Strict typing.** `strict: true`. No `any` (use `unknown` + narrowing). Strapi DTOs are
   mapped to domain models in `core/api/*.mapper.ts` — components never see raw DTOs.
8. **Accessibility is a feature.** Every input has a `<label for>`; errors are linked with
   `aria-describedby` and announced (`role="alert"` / live region); the whole wizard is
   operable by keyboard; focus moves to the step heading on step change.
9. **Every async view has 3 states:** loading (skeleton), error (message + retry), empty.

## 4. Conventions

- Branches `feat/US-XX-short-name`; Conventional Commits.
- File names kebab-case; one component per folder under `features/<step>/`.
- Pure business logic (pricing, validators, masking, RUT) lives in `core/domain/` as pure
  functions → 100 % unit-testable without TestBed.
- State: one `QuoteStore` (signals) persisted to `sessionStorage` (ADR-0005).
- Tests: Vitest for units (`*.spec.ts` next to the file), Playwright for e2e in `frontend/e2e/`.
- Definition of Done: `node tools/traceability.mjs --check` passes (every AC has ≥1 test — the
  spec §8 tables are generated, never hand-written), `npm run lint && npm test && npm run e2e`
  green (e2e also against the production build: `npm run preview:prod`), review report has no
  open `blocker`/`major` findings, QA note written.

## 5. Skills available to agents

| Skill | Use it when |
|---|---|
| `spec-authoring` | turning a user story into a verifiable spec with gap analysis |
| `country-content-model` | adding/changing anything country- or language-dependent (Strapi model + Angular mapping) |
| `angular-conventions` | writing or reviewing any Angular code in this repo |
| `review-checklist` | performing a code review and writing the report |

## 6. Human checkpoints (summary — detail in FLOW.md)

`HC-1` spec approval · `HC-2` ADR approval · `HC-3` review triage · `HC-4` QA acceptance.
An agent **must stop and ask** at each checkpoint; it may not self-approve.
