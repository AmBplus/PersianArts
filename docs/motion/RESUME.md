# RESUME HERE (updated at each checkpoint)

## Owner standing orders 2026-10-13 (DECISIONS D-20261013-13)
- (a) Owner approves `npm ci` (pinned dependency downloads) in `work/persian/src/workbench`.
- (b) Lead stops asking permission for routine unblock steps: act, then report. Missing client-private files get clearly-labelled placeholders (never invented client claims); `contracts/confidential-terms.local.txt` is created locally (git-ignored) so the safe checkpoint scan works.
- (c) Every worker order reports progress to the live status board (`docs/motion/STATUS-PROTOCOL.md`, being created); 10 minutes of silence = stalled.
- (d) Reports state plainly what is done, what is not, and the measured time. No excuses.
- (5) Resilience rule (DECISIONS D-20261013-14): do not quit and do not complain about limits. On a block, try at least two alternative reasonable paths before reporting a blocker; the report states the paths tried and their results. Involve the owner only when it truly cannot be done without them. Full rule: [STATUS-PROTOCOL.md](STATUS-PROTOCOL.md) "Resilience rule".

Portability: milestones M1-M6 done (fonts in `work/persian/assets`, `pa.ps1`, render auto-setup, private-file copy, no hard-coded D: paths, checkpoint font guard); M7 docs done (see "Fresh machine" in [README.md](README.md)).
Open owner items: `contracts/confidential-terms.local.txt` source (RESOLVED 2026-10-13, D-20261013-13: create locally, placeholders for missing client-private files); approval to run `npm ci` (RESOLVED 2026-10-13, D-20261013-13: approved for `work/persian/src/workbench`); where the private files (`PA_PRIVATE_DIR`) are kept (still open).
Known gap: audio does not travel via git. Audio binaries made in earlier sessions are gitignored and absent on this machine (`.gitignore:53-58`, `:97-99`), so the v51 mix cannot be reproduced here (`hit-stamp-sub.wav` missing) and `pa.ps1` skips the sfx/bgm links on a fresh clone. Status OPEN, decision pending owner/lead (options: `PA_PRIVATE_DIR` audio subfolder, shared folder, or small allowlisted audio with a size cap). Details: [PLAYBOOK-SOUND.md](PLAYBOOK-SOUND.md) section 9 and DECISIONS `D-20261013-12`.

## AUTOPILOT PAUSED by owner 2026-10-13 ~08:20
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

## Next 3 actions
1. B1: wait for P3 (order 13), then full silent render of the uni-admissions teaser (see AUTOPILOT backlog).
2. B2: re-measure render benchmarks with raw logs into `work/persian/_bench/results-<date>.csv`.
3. B5: keep `docs/motion/STATE.md` fresh; rebuild the ledger; merge Haiku order records.

## Waiting for owner
rubric-v2 weights (rec accept 1.5, cap 6); `media/dana/` (rec keep tracked);
pencil v51 listening feedback; public wording for the uni-admissions teaser.
