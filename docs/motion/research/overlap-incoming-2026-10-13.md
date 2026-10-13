# OVERLAP BRIEF: incoming origin/main (10 commits) vs our docs/motion system, 2026-10-13

Read-only comparison made after the pull (HEAD = origin/main = 24baaae). Nothing reconciled.

1. New paths and collisions
- Added: `.agents/skills/persian-arts*` (10), `.claude/skills/persian-arts*` (10), `.claude/commands/persian-arts.md`, `plugins/` (README changed), `docs/motion/` (INTAKE, STUDIO, LOOP-POLICY, METERING, METRICS, STATUS-PROTOCOL, GOAL-MEMORY, ADVISOR, FILM-GATES, LESSONS-LEDGER.*, brief/director schemas, todo template, recipes/catalog.json, plans/).
- Collisions by name: `docs/motion/ledger/` is ours (4 files), incoming has `LESSONS-LEDGER.*` at the top level. `build_ledger.mjs` was edited (QH_HOME default), not replaced. No collision on `RESUME.md`, `STATE.md`, `AUTOPILOT.md`: incoming changed RESUME.md and STATE.md, did not create them.
- Tools added: `work/persian/tools/pa.ps1` (setup, setup-private, check, status), `film-process-gates.mjs`, `film-action-log.mjs`, `gates/*.mjs`, `metrics-timeline.mjs`, `cues/*.py|ps1` (beatlib, make_long/short_sound, r30_*, waveform_*), `status/serve.mjs` (board on port 4747).
- Commit guard: `checkpoint.ps1` (ours) now refuses `-Message` containing "Co-Authored-By", a second `Claude-Session:` trailer, or a multi-line message. It appends only `Claude-Session:`. It also blocks fonts over 2 MB. This CONFLICTS with the attribution reminder that asks for `Co-Authored-By: Claude Haiku 5.5` on commits. Our current format will be refused; the owner must choose one rule.

2. Did incoming touch files we created yesterday?
- Modified (not deleted): `work/persian/render_all.ps1` (added browser detection, auto setup, 'uni/short', 'uni/long', 'conference'); `work/persian/tools/cues/build_v4.py`, `build_v5.py`, `build_v51.py`, `make_cues_v51.py` (2-4 lines each); `work/persian/tools/ledger/build_ledger.mjs`.
- Not touched in the diff (no M or D): `mix_film.ps1`, `mix_sfx.ps1`, `sound/library/**`, `work/persian/src/film/social`, `work/persian/src/film/uni`, `evals/rubric-v2.md`. No deletions in the 10 commits.

3. Which README/RESUME describes the truth
- `docs/motion/README.md` now describes the incoming system (brain-and-hands workflow, "Fresh machine" with pa.ps1, live status board). It is consistent with our rules (lead does not run git, Sol/GLM routing, DECISIONS.jsonl). Its file list still points to our tools (render_all, mix_film, cues, sound/library), so it is a merged view.
- `docs/motion/RESUME.md` now has two truths in one file: the incoming "Owner standing orders 2026-10-13 (D-20261013-13/14)" block at the top, and our "AUTOPILOT PAUSED ~08:20" block below. The pause block says GLM is sidelined and Sol is used; the standing-orders block does not mention it. Also, "Next 3 actions" conflicts with "Next 5 actions" in the same file.
- `STATE.md` is still our snapshot (2 lines changed). Conflicts: its open decision 3 (media/dana) and our "Waiting for owner" list do not mention the incoming standing orders.
- Verdict: the README is the incoming-facing entry point; RESUME mixes both; STATE is ours.

4. Commands and skills a new chat would now use
- Skills: `persian-arts` (only entry point, also `/persian-arts`), internal: `persian-arts-director`, `-motion-designer`, `-motion-editor`, `-art-director`, `-copy-editor`, `-writer`, `-technical`, `-sound`, `-qc`.
- Tools: `pa.ps1` (setup, setup-private, check, status), `render_all.ps1`, `checkpoint.ps1`, `serve.mjs`, `run-gates.mjs`, `film-process-gates.mjs`, `metrics-timeline.mjs`, `build_ledger.mjs`, `cues/*`. Plus our `qh order`, `qh orders`, `qh result`.

5. Risks and merge plan
- Risks: two skill systems (incoming `persian-arts` vs our PLAYBOOK-BUILD-MOTION) can both claim "build a motion"; the commit guard can block our checkpoint; two RESUME truths can send a new chat to the wrong next step; the ledger name is reused.
- Recommended: keep both with a clear map. Incoming owns the entry point and the skill orchestration; ours owns the render/sound history and the qh ops. Reconcile specific files only.
- First 3 steps:
  1. Decide the commit trailer rule (Co-Authored-By vs Claude-Session) and edit only `work/persian/tools/checkpoint.ps1` to match it.
  2. Split `docs/motion/RESUME.md` into two dated sections, or make the standing-orders block the single current state and fold the AUTOPILOT PAUSED facts into it (owner decision).
  3. Add a short map at the top of `docs/motion/README.md` (which skill/tool owns what) and rename or note the ledger collision (`LESSONS-LEDGER` vs `ledger/`).
