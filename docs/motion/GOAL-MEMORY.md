# GOAL MEMORY: semantic memory per goal (protocol, 2026-10-13)

Problem: short disconnected jobs are fine for mechanical work (render, probe, copy, git), but when every semantic step starts cold, the goal, the through-line, decisions, rejected ideas and owner feedback are lost and quality drops (v3 repeated one design; v4 fixes re-proposed rejected ideas). Fix: one memory file per goal that every semantic actor reads before and appends to after working, plus a small persistent cast.

## 1. Where
`media/briefs-local/<label>/memory/goal-memory.md` (git-ignored; client content stays private). A sanitized copy (label only, no client name or private copy) may be kept in `docs/motion/plans/`. Template: `docs/motion/goal-memory.template.md`. Created by the `memory-init` TODO step, right after the brief (INTAKE.md).

## 2. File format (8 sections, in this order)
| Section | Content | Edit rule |
|---|---|---|
| GOAL | objective, audience, desiredAction (+CTA), tone | Scribe, from brief; changes only on owner order |
| THROUGH-LINE | dramatic device + the one-sentence idea | Director only |
| DECISIONS | `- date time \| who \| decision \| rejected: alternative \| why` | append-only, every S actor |
| REJECTED | `- idea \| why \| date` so nobody re-proposes it | append-only, every S actor |
| OWNER FEEDBACK | verbatim quotes with date | Scribe on the lead's order; never paraphrased |
| CONSTRAINTS | truth (verified/forbidden claims), brand, project rules | Director (add), Writer (claims) |
| CURRENT STATE | "Files" block (what exists, paths, versions): Builder; "Open defects" block (id, scene, frame, status): QC | one block per owner |
| NEXT | the next 1-3 steps and who | Scribe on the lead's order |

## 3. Protocol
1. READ-BEFORE-WORK: every semantic (class S) step reads the whole memory first and states in its report which GOAL, THROUGH-LINE and REJECTED lines constrain its work.
2. APPEND-AFTER-WORK: before reporting, the S actor appends its DECISIONS (with the rejected alternative) and updates only its own section. A decision not written down is lost.
3. Mechanical (class M) steps get a 5-line context header only (goal, label, step, inputs, acceptance command) and return numbers. They never write the memory.
4. The lead never edits the memory. If an S worker could not write (blocked, ended), the lead orders a Scribe (Haiku) to apply that worker's report to the right sections verbatim.
5. Conflicts: the newer owner feedback wins; the Director resolves the rest and logs it in DECISIONS. Never silently delete a line; strike it with `[superseded <date>]`.
6. Keep it short: when DECISIONS exceeds about 60 lines, the Scribe adds a "Summary so far" block at the top of the section and keeps the lines.

## 4. Continuity: single-agent mode (DEFAULT) and cast mode
DEFAULT (todo field mode = single-agent): ONE named persistent STUDIO agent (Sonnet, continued with SendMessage) wears every craft hat (director, writer, copy-editor, art-director, motion-editor, motion-designer, technical, sound) by reading the craft skills in sequence, so the semantic memory lives in one head and the prompt cache stays warm. Cast around it: QC = independent fresh Sonnet (independence is its value; it still reads and appends the memory); HAIKU for simple mechanical jobs (render, probe, copy, status, git via script, scribe edits) returning numbers only; an OPUS ADVISOR on call (docs/motion/ADVISOR.md, at most 3 consults per film, logged in DECISIONS with the tag "advisor:").
CACHE ORDER (stable first, append-only): 1 craft skills, 2 goal memory, 3 the TODO, 4 the current step. Never rewrite earlier material in place; append, and strike superseded lines. This keeps the cached prefix valid across steps.
CAST MODE (todo field mode = cast, large films only): Director (director, writer, copy-editor, art-director, animatic), Builder (technical, motion fixes, sound, fix rounds), QC; each persistent via SendMessage, same memory protocol.
If the persistent agent is gone, start a new one whose first action is reading the memory: the memory, not the agent, is the source of truth.
