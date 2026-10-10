# CLAUDE.md — PersianArts

@AGENTS.md

## For Claude Code specifically

- Keep decision-making (what to change, accept/reject results, what ships) in the main session.
- Delegate implementation work to subagents running **Sonnet 5.5 with high effort** (`model: "sonnet"`, `effort: "high"`).
- Before any Persian conversion task, read `docs/PERSIAN-LOCALIZATION-LESSONS.md`; after each batch merge the agents' new
  lessons into it.
- After each completed batch of work: commit and push to the feature branch (never straight to `main`, see AGENTS.md).
