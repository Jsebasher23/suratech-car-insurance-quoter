# ADR-0009 — AI tooling (Claude Code) and a lightweight in-repo SDD variant

- Status: Proposed — **HC-2 sign-off pending** (tech lead: name + date)

## Context
The brief requires subagents, skills, a context file, specs before code and traceable review,
and asks to justify the tool and whether an SDD framework is used.

## Options (tool)
| Tool | Subagents versioned in repo | Skills | Notes |
|---|---|---|---|
| **Claude Code** | ✅ `.claude/agents/*.md` (instructions + allowed tools + model in front-matter) | ✅ `.claude/skills/*/SKILL.md` | `CLAUDE.md` loaded automatically; per-agent tool allow-lists enforce "reviewer cannot edit code" |
| Cursor | Rules yes, subagents limited | partial | Less explicit tool scoping per agent |
| GitHub Copilot agent | Custom agents in `.github/agents` | partial | Tied to GitHub PR flow |
| Codex / OpenCode | `AGENTS.md` | partial | Good, but fewer native per-agent tool restrictions |

## Options (SDD)
| Option | Pros | Cons |
|---|---|---|
| GitHub Spec Kit (`/specify`, `/plan`, `/tasks`) | Opinionated, popular | Generates plan/task files we would not review; its templates don't contain our gap table |
| Kiro | Integrated SDD | Different IDE, not available in this environment |
| **Own variant: spec template in a skill + human gates** | Spec format tailored to what the evaluators value (gap analysis, AC IDs, data contract, traceability matrix); zero extra tooling | We maintain the template |

## Decision
Claude Code with 6 subagents and 4 skills; own SDD variant (`spec-authoring` skill). `AGENTS.md`
points to `CLAUDE.md` so other tools share the same rules.

## Consequences
- ✅ Tool permissions per role are code-reviewed like any other file.
- ⚠️ Vendor-specific folder (`.claude/`); the agent markdown is portable to other tools with
  minimal edits (front-matter keys differ).
