# RESUME HERE (updated at each checkpoint)

Date: 2026-10-14. Start on any machine: [START.md](../../START.md).

## CURRENT STATE (2026-10-14 01:10 +03:30; single source; the older blocks below are history)

- Date and time: 2026-10-14 01:10 (+03:30). Last commit before this refresh: `08427c01` (S07 kite-wind film v1). This refresh is committed on top of it; its hash is the newest line in `docs/motion/last-checkpoint.txt` (this block cannot name its own hash). Check with `git log -1`.
- Image FX phase 1 done (skill 2.12): `pa fx find|list|check|demo`, work/persian/htmlfilm/lib/pa-fx.js, 36 shaders (34 verified), docs/motion/fx/catalog.json. Next: phase 2 geometry effects only if a story needs them (TODO).
- Weekly Claude quota: about 88% used at 2026-10-14 01:xx. Stop at the quota limit only after a checkpoint, then RESUME after the reset.
- Git pack: 301 MB after prune. Git-first: everything needed to continue is committed, except media, output and binaries.

### How to start (any machine, any new chat)
1. Read [START.md](../../START.md) at the repo root.
2. Clone over SSH: `git@github.com:AmBplus/PersianArts.git`.
3. Install: `install.ps1` (Windows) or `install.sh` (macOS/Linux) at the repo root.
4. Run `pa sync` (`pwsh -File work/persian/tools/pa.ps1 sync`; `pa` is not on PATH).
5. Open `output/LATEST` (or `deliver/LATEST` for finals of our own films).
6. Client material: set `PA_VAULT_PASS`, then `pa vault unpack` (see [PORTABILITY.md](PORTABILITY.md)).

### What exists now
- Default lane: html-film (`work/persian/htmlfilm/`: film.html, events.json, rules.json per film; `lib/pa-motion.js`).
- Skill `persian-arts` 2.11 with rules 9-15 and step 0 (env check) in `.claude/skills` and `.agents/skills`.
- Kit sound: 15 music tracks and 304 SFX; mixer with `--loop` and the final-role fix (`sound/tools`, `build_sound.py`).
- Compression, and TV-safe deliver with `deliver/LATEST` (S06 final: `deliver/s06-clock-never-zero-9x16.mp4`).
- `pa` tools: `time`, `meter`, `todo` (list|next|add|done), `metrics`, `pacing` (`--cuts`, `--track`, `--one-take`), `arc`, `music-pick`, `music-drop`, `audio-check` (`--loop`, `--events`), `loop-check`, `strip`, `doctor`, `bootstrap`, `sync`, `install-skill`, `assets-check`, `vault` (pack|unpack|list).
- Story lab S01-S10: S06 built (v1), S03 built (v1, libs `pa-camera.js`, `pa-maze.js`), S07 built (v1, lib `pa-chain.js`, `pa music-drop`), S05 built (v1, 11 min, lib `pa-ink.js`, canvas pattern; skill 2.13). S02 built (v1, both ratios, lib `pa-layout.js`, skill 2.14); the story lab S01..S10 first batch is complete except S01/S04/S08-S10.
- Conference teaser v1-v5 (client; vault pending).

### OWNER STANDING RULES (verbatim in short; apply to every order and reply)
- Git-first and portable.
- Budget: 10 minutes per small task, 20 minutes per film. Overruns are reported in one line.
- Scope freeze: no side tasks while a film is being built.
- One persistent studio per film.
- Haiku never for craft (quick lookups and small actions only).
- No side tasks during a film.
- Personal use only. Do not raise licence talk unless the owner asks.
- Stop at Claude limits only after a checkpoint; RESUME after the reset.

### AUTOPILOT
- A durable cron job runs the improvement loop: every 25 minutes, id `d021db32`, expires 2026-10-21.
- In a NEW chat say `ادامه از RESUME.md` (continue from RESUME.md), then re-create the cron job with the cycle prompt stored in [AUTOPILOT.md](AUTOPILOT.md) (section "Cycle prompt").

### Next actions, in order
1. T021 Image-FX phase 1: GL-transition shader runner, catalog, `pa fx find`. Spike target: fix the abrupt cut of the client teaser with a shader transition on a neutral test first.
2. Next story from docs/motion/stories/STORIES.md (S02 done): S04 or S01.
3. Apply a pa fx shader to a real film (spike: the client teaser abrupt cut).
4. Story-lab learnings are folded into the skill up to 2.13.
5. Open tool defects: pa compress mis-measures TP (L-106); pa compress keeps hot-TP files (L-103); kit hard-drop audit (L-097); pacing drops 0.2 s early; `.agents` skill_version line; duplicate decision ids D-20261013-01 and D-20261013-16 (T014); carry-over 4 simultaneous cues in old finals (T013).

### Waiting for owner (only the owner decides)
- Vault passphrase `PA_VAULT_PASS`, then `pa vault pack` for client folders (T010).
- qh vendor decision.
- `media/dana/`: keep, move to vault, or drop (T007).
- Remove `http.sslverify false` from the global `.gitconfig` (T008).
- Public Pages URL: still `persiandoodle` in README, index.html and the workflow (T009).
- Research-centre emblem asset (T012).
- Preact build step (T011).
- Owner opinions pending on conference teaser v5: finale world; cards into the finale; university emblem contrast; research-centre card.

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
