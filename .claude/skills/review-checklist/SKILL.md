---
name: review-checklist
description: Code-review checklist and report template for this repo (spec conformance, multi-country, security, Angular quality, a11y, tests). Use when acting as code-reviewer or when self-checking before handoff.
---

# Review checklist (project skill)

## Report template → docs/reviews/REVIEW-<increment>.md
```markdown
# Review <increment> — <date>
Reviewer: code-reviewer (model) · Scope: <commits/folders> · Specs: US-…
Tests re-run by reviewer: <command> → <result>

| ID | Sev | File:line | Rule / AC | Finding & failure scenario | Suggested fix | Triage (HC-3) | Resolution |
|----|-----|-----------|-----------|----------------------------|---------------|---------------|------------|
```
Severities: **blocker** (AC broken, security hole) · **major** (likely bug, missing AC test)
· **minor** (maintainability) · **nit** (style).

## Checklist
### Spec conformance
- [ ] Every AC of the spec has code *and* a test whose title has the AC ID.
- [ ] Gap-table decisions are implemented as written (boundaries!).
### Multi-country / configurability
- [ ] No `'CO'`/`'CL'` literals or country `if`s outside seed/fixtures/registry.
- [ ] No business copy in templates or TS; all from Strapi or i18n dictionaries.
- [ ] Unknown field type from Strapi degrades gracefully (skipped + logged), never crashes.
### Security & privacy
- [ ] No token / secret in `frontend/` or `environment*.ts`; Public role read-only.
- [ ] Document number masked in summary; no PII in `console.*`.
- [ ] No `innerHTML` with CMS content (or it is sanitized).
### Angular quality
- [ ] Standalone, OnPush, signals, `input()/output()`, control flow, no NgModules.
- [ ] Loading / error+retry / empty states on every async view.
- [ ] No subscriptions leaking (use `toSignal`, `takeUntilDestroyed`, or `firstValueFrom`).
### Accessibility & responsive
- [ ] Labels, `aria-describedby`, `aria-invalid`, focus management on step change.
- [ ] Keyboard-only path through the whole wizard (e2e covers it).
- [ ] Layout works at 360 px and ≥ 1280 px.
### Tests
- [ ] Tests assert behaviour, not implementation; boundaries covered; no skipped tests.
