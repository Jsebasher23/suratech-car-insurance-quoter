# AGENTS.md

This repository's global agent context lives in [`CLAUDE.md`](./CLAUDE.md).
Tools that read `AGENTS.md` (Codex, OpenCode, Cursor, Copilot) must load and follow
`CLAUDE.md` in full — it is the single source of conventions, so they never diverge.

Subagent definitions: [`.claude/agents/`](./.claude/agents) · Skills: [`.claude/skills/`](./.claude/skills)
· Flow: [`FLOW.md`](./FLOW.md)
