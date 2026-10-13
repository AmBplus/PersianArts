# RESUME HERE (updated at each checkpoint)

Date: 2026-10-14. Start on any machine: [START.md](../../START.md).

## CURRENT STATE (2026-10-14, single source; the older blocks below are history)

- Date: 2026-10-14. Last film checkpoint: `9f06ed84` (S06 clock film, 15 files, pushed to origin main). This RESUME refresh is committed right after it; its hash is the newest line in `docs/motion/last-checkpoint.txt` (this block cannot name its own hash).
- Cross-machine start (any new chat, any machine): read [START.md](../../START.md) at the repo root. Clone over SSH (`git@github.com:AmBplus/PersianArts.git`), then `pwsh -File work/persian/tools/pa.ps1 bootstrap`, then `pwsh -File work/persian/tools/pa.ps1 sync`, then open `output/LATEST` (or `deliver/` for finals of our own films). Client material: set `PA_VAULT_PASS`, then `pa vault unpack` (see [PORTABILITY.md](PORTABILITY.md)). `pa` = `pwsh -File work/persian/tools/pa.ps1` (not on PATH).
- What exists:
  - html-film default lane: `work/persian/htmlfilm/` (film.html, events.json, rules.json per film; `lib/pa-motion.js`).
  - Skill 2.7 with rules 9-13 (`.claude/skills`, `.agents/skills`).
  - Kit sound and mixer (`sound/tools`, `build_sound.py`).
  - Compression (`pa compress`) and `deliver/LATEST` (S06 final: `deliver/s06-clock-never-zero-9x16.mp4`).
  - Pacing tool (`pa pacing`, `work/persian/tools/pacing/`).
  - Story lab S01-S10: S06 built (v1, 10.7 min). S03 and S07 are next; S05 and S02 later.
  - Tools: `pa todo` (list|next|add|done), `pa meter` (task|seed), `pa metrics`, `pa doctor`, `pa vault` (pack|unpack|list).
- Owner standing rules (apply to every order and every reply):
  - Git-first and portable: everything needed to continue must be committed (except media, output and binaries; see below).
  - Time budget: 10 minutes for a small task, 20 minutes for a standard order; overruns are reported in one line.
  - Scope freeze during a film: no side tasks while a film is being built.
  - Persistent studio: the same studio worker continues its films.
  - Haiku is never used for craft (quick lookups and small actions only).
  - Personal, non-commercial use. Do not raise licence talk unless the owner asks.
  - Sample films are tested in 9:16 only for now; every ingredient must still work in 1:1, 4:5 and 16:9.
  - Quota ownership: stop at 90% of the weekly quota, after a checkpoint.
  - Sound on request only (D-20261013-19). Cues land on beat or bar. No text-to-speech or synthesis for voice.
  - Anti-slideshow rule; client name and institution words never appear in tracked files (label `uni-admissions`).
  - Resilience (D-20261013-14): try at least two reasonable alternatives before reporting a blocker.
  - Do not commit media/**, output/** or other binaries except the owner-listed deliver/ finals.
- TODO top 10 (`pa todo list`, open items, 2026-10-14):
  1. T015 (now) Checkpoint policy: commit after every task.
  2. T002 Story build S03.
  3. T003 Story build S07.
  4. T004 Pacing calibration: conference v5 known cuts 4.07/10.17/16.27/22.37 s vs detected.
  5. T013 Carry-over: 4 simultaneous-cue defect in old finals (rebuild with build_sound).
  6. T014 Cleanup duplicate decision ids D-20261013-01/-16 in DECISIONS.jsonl.
  7. T017 Add loop-seam gate to build_sound.py.
  8. T018 Add loop mode to build_sound.py.
  9. T019 Logo-colour gate: add a switch for logo-less films.
  10. T020 Fix pa meter -Kind/-Worker flag parse bug and malformed tasks.jsonl line.
- Next 3 actions, in order:
  1. Story S03, then S07 (S05 and S02 later).
  2. Fix the tools above: pacing calibration (T004), meter flags (T020), loop-seam gate and loop mode (T017, T018), logo gate switch (T019).
  3. Vault: set `PA_VAULT_PASS`, then `pa vault pack` for the client folders (T010).
- Known defects (not yet fixed):
  - `pa pacing` beat calibration: conference v5 cuts sit on bars, but the tool reported 0% (T004).
  - `pa meter`: -Kind/-Worker flag parse bug, and one malformed line in tasks.jsonl (T020).
  - No loop-seam gate and no loop mode in `build_sound.py` (T017, T018).
  - Logo-colour gate has no switch for logo-less films (T019).
  - PNG capture is slow: use `--draft` for previews.
  - Duplicate decision ids D-20261013-01 and D-20261013-16 (T014).
  - 4 simultaneous cues in old finals (T013).
  - `pa todo add --owner` is ignored: items default to owner lead.
- Waiting for owner (only the owner decides these):
  - Vault passphrase `PA_VAULT_PASS`, then `pa vault pack` for client folders (T010).
  - qh vendor decision.
  - `media/dana/` keep, move to vault, or drop (T007). The working tree has uncommitted deletions there; they are not committed.
  - Remove `http.sslverify false` from the global `.gitconfig` (T008).
  - Public Pages URL: still persiandoodle in README, index.html and the workflow (T009).
  - Research-centre emblem asset: owner can send it (T012).
  - Preact build step decision (T011).
  - Local git prune of unreachable objects (T006): owner approved on 2026-10-14; run after this refresh commit (see the prune report in the chat log, not in this file).

---

## History: incoming owner standing orders

### Owner standing orders 2026-10-13 (DECISIONS D-20261013-13)
- (a) Owner approves `npm ci` (pinned dependency downloads) in `work/persian/src/workbench`.
- (b) Lead stops asking permission for routine unblock steps: act, then report. Missing client-private files get clearly-labelled placeholders (never invented client claims); `contracts/confidential-terms.local.txt` is created locally (git-ignored) so the safe checkpoint scan works.
- (c) Every worker order reports progress to the live status board (`docs/motion/STATUS-PROTOCOL.md`, being created); 10 minutes of silence = stalled.
- (d) Reports state plainly what is done, what is not, and the measured time. No excuses.
- (5) Resilience rule (DECISIONS D-20261013-14): do not quit and do not complain about limits. On a block, try at least two alternative reasonable paths before reporting a blocker; the report states the paths tried and their results. Involve the owner only when it truly cannot be done without them. Full rule: [STATUS-PROTOCOL.md](STATUS-PROTOCOL.md) "Resilience rule".

Portability: milestones M1-M6 done (fonts in `work/persian/assets`, `pa.ps1`, render auto-setup, private-file copy, no hard-coded D: paths, checkpoint font guard); M7 docs done (see "Fresh machine" in [README.md](README.md)).
Open owner items: `contracts/confidential-terms.local.txt` source (RESOLVED 2026-10-13, D-20261013-13: create locally, placeholders for missing client-private files); approval to run `npm ci` (RESOLVED 2026-10-13, D-20261013-13: approved for `work/persian/src/workbench`); where the private files (`PA_PRIVATE_DIR`) are kept (still open).
Known gap: audio does not travel via git. Audio binaries made in earlier sessions are gitignored and absent on this machine (`.gitignore:53-58`, `:97-99`), so the v51 mix cannot be reproduced here (`hit-stamp-sub.wav` missing) and `pa.ps1` skips the sfx/bgm links on a fresh clone. Status OPEN, decision pending owner/lead (options: `PA_PRIVATE_DIR` audio subfolder, shared folder, or small allowlisted audio with a size cap). Details: [PLAYBOOK-SOUND.md](PLAYBOOK-SOUND.md) section 9 and DECISIONS `D-20261013-12`.

---

## History: autopilot pause (our system)

Kept as written at the pause. Its state and next-step lists are superseded by CURRENT STATE above.

### AUTOPILOT PAUSED by owner 2026-10-13 ~08:20
GLM (zcode) sidelined: it timed out on P2 (1500 s) and P3 (1202 s); do not use GLM for scene work. Use Haiku for quick
actions and Sol (codex-a gpt-6.1-sol via `qh order` / `qh run`) for implementation until the owner says otherwise.

State at pause (as recorded by the stop run; not re-verified by a render):
- Running orders: none. Order 15 (uni-teaser-P3b-sol, codex-a) was stopped by the owner's stop run. Its half-edited
  output in `work/persian/src/film/uni` was NOT reverted; treat it as unverified.
- Uni teaser: 8 scenes in `work/persian/src/film/uni`. P3 fixes are uncertain or partly done (timed-out GLM, then the
  stopped Sol order 15). No full render yet. No sound.
- Pencil v51: 2 versions with sound, waiting for the owner's listening feedback.
- Render pipeline: `render_all.ps1` uses native output. Benchmark numbers need re-measurement with raw logs (B2).
- Architecture option C adopted: M1 and M2 done; M3 and later pending (see AUTOPILOT backlog B3).
- Report store: `docs/motion/reports/` (daily folders; INDEX.md). Ledger: `docs/motion/ledger/`.
- Git: the stop run committed and pushed paths via the checkpoint script (see `last-checkpoint.txt`).

Owner waiting list:
- rubric-v2 weights (rec accept 1.5, cap 6 recs).
- `http.sslverify false` is set in global gitconfig (TLS verification off). Owner should remove it.
- Pages URL still says persiandoodle in README/index.html/workflow; the owner must decide the public URL.
- `media/dana/` decision (rec keep tracked).
- Pencil v51 listening feedback.
- Public wording for the uni-admissions teaser.

Next 5 actions, in order:
1. Re-check `work/persian/src/film/uni` against the P3 acceptance (Sol order, short brief, no GLM).
2. Full silent render of the uni teaser after the check passes; record numbers from raw logs.
3. B2: re-measure render benchmarks into `work/persian/_bench/results-<date>.csv`.
4. B3: architecture M3 (`render_all.ps1` canonical VERSION.json, `pa` CLI skeleton).
5. B5: keep `docs/motion/STATE.md` fresh; rebuild the ledger; merge Haiku order records.

- Date: 2026-10-13
- Last checkpoint: see the newest line in `docs/motion/last-checkpoint.txt` (commit hash, status, timestamp).
- Running orders: not recorded at write time. First step on resume: `qh orders` and `qh result` for each one.
- Protocol: [AUTOPILOT.md](AUTOPILOT.md). Checkpoint: `work/persian/tools/checkpoint.ps1 -DryRun`, then the real run with `-Message`.
- Remote: `origin` = `git@github.com:AmBplus/PersianArts.git` (SSH, owner-set 2026-10-13). Push: `checkpoint.ps1` pushes over SSH (BatchMode, GCM_INTERACTIVE=never); `-PushOnly` retries unpushed commits.
- Owner note: global `C:/Users/Amir/.gitconfig` has `http.sslverify false` (TLS verification off for all HTTPS git). Recommend removing it; not changed by the agent.

### Next 3 actions (superseded by the ordered list in CURRENT STATE)
1. B1: wait for P3 (order 13), then full silent render of the uni-admissions teaser (see AUTOPILOT backlog).
2. B2: re-measure render benchmarks with raw logs into `work/persian/_bench/results-<date>.csv`.
3. B5: keep `docs/motion/STATE.md` fresh; rebuild the ledger; merge Haiku order records.

### Waiting for owner (at pause; superseded by the list in CURRENT STATE)
rubric-v2 weights (rec accept 1.5, cap 6); `media/dana/` (rec keep tracked);
pencil v51 listening feedback; public wording for the uni-admissions teaser.
