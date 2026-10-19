# StoryLab batch 2 — consolidated SYSTEM register (S08–S12, 2026-10-16)

Scope: five films built in one day to stress-test the motion-graphics system, plus three fix rounds and one tooling round. This register records what the SYSTEM proved, not a film report. Every row names its evidence. `FIXED` = I verified it in the working tree today; report-only claims are marked *(claim)*.

## What was tested (the five genres and the axis each one stressed)

| film | genre | axis it stressed |
|---|---|---|
| s08-damnoosh-steam | product-ad (tea/steam) | one continuous take, canvas-only rewrite, `empty-band` on a dark room |
| s09-university-sun | university intro | cut-based 7-scene list, 750 f/25 s (longest render), a `?debug` source flag |
| s10-factory-parsa | factory/company | beat-locked hard cuts on a 120 BPM grid, `events.json` frame base |
| s11-sabadak-app | shopping app | per-ratio re-composition, inline brand mark, 130 BPM non-integer beat |
| s12-pikavar-route | logistics route | ONE continuous camera take + live counter, the ~300 s capture ceiling |

## Verdicts at a glance

| film | genre | v1 score | verdict | remaining defects (v1) | version delivered |
|---|---|---|---|---|---|
| s08-damnoosh-steam | product-ad | 74 | FIX | empty-band FAIL both ratios (worst 62%); 16:9 hero glass cut by bottom edge | v1 only |
| s09-university-sun | university intro | 59 | FIX | burned-in debug HUD in every frame; black bands in the 16:9 raster | v2 |
| s10-factory-parsa | factory | 56 | FIX | events.json on a 24-f/p-beat base vs the renderer's 15; text cut at edges | v2 |
| s11-sabadak-app | shopping app | 75 | FIX | coral chip over a letter in the finale; 9:16 static tail; off-frame card entrances | v2 |
| s12-pikavar-route | logistics | 66 | FIX | no brand name/CTA on screen; 16:9 label-over-digit collisions; finals over 12 MB | v1 only |

Scores are the reviewers' own (`review-1.md`, all five, all verdict FIX). `v2` exists for s09/s10/s11 (verified on disk); no s08–s12 folder exists in `output/` *(claim: integrity round ran dry runs only)*.

## STRENGTHS OF THE SYSTEM (what worked and is worth keeping)

1. **`scenery` survives the delivery hop:** `run-gates.mjs:72` emits an explicit `N/A` row, and round 1 made `deliver.mjs` forward `VERSION.json scenery:true` as `--scenery` (test `PASS D3 …`, `fixes-round1.md`).
2. **The per-ratio LAYOUT table is real:** s11's 16:9 is independently re-composed (logo 1.15→0.72, headline centre→left third, 10 slots→3-column stage), measured by the reviewer from stills, not from the source.
3. **`capture.mjs` is now fail-fast:** port auto-isolation (`:107,140`), `Runtime.enable` + `exceptionThrown` (`:176,211`), a hard abort when `window.film` never arrives, and a pre-launch `@font-face` check that exits 4 (`:81-88`).
4. **Concurrency is safe:** two films, two ratios, no `--port` → ports 8166/8174 auto-chosen, both exit 0, one run (`fixes-round2.md` V1, quoted output).
5. **Claims became measurements:** `tvSafeVerdict()` re-runs the real `tv_check` on the delivered hardlinks; an unverifiable claim prints `claimed, not verified` plus the reason (`fixes-round1.md` D3).
6. **`film-integrity.mjs` adds three checks the system never had** — events-vs-render, stale-stills by pixel MAD, frame-base sanity — and `--write-version` omits anything it cannot measure.
7. **The gates admit their blindness:** `number-lint.mjs` FAILs (never PASSes) when `--src` was given but no source matched; `overlay-hud.mjs` and `black-bands.mjs` each document exactly what they miss.

## DEFECTS FOUND

Class: accidental / systematic / misunderstanding / rule-conflict. `status` is FIXED (verified in the tree) or OPEN.

| id | symptom | class | evidence | status | file that must change |
|---|---|---|---|---|---|
| D1 | `pa assets tv-check <one path>` split the path into characters (python saw `'m'`) | accidental | `fixes-round1.md` D1 raw before/after; `work/persian/tools/pa.ps1:296` | FIXED r1 | (done) |
| D2 | `compress.mjs` compared `'fail'` against `"FAIL"` → TV check always pass, and that false pass was written into `OUTPUT.md` | systematic | `fixes-round1.md` D2; `compress.mjs:63` | FIXED r1 | (done) |
| D3 | `deliver.mjs` printed "TV-safe: بله" from a recorded claim it never checked | systematic | `fixes-round1.md` D3; `deliver.mjs:61` | FIXED r1 | (done) |
| D4 | docs drift: 9 capture flags undocumented; changelog bootstrap-font claim and PORTABILITY doctor-font claim false | misunderstanding | `fixes-round1.md` D4a-c | FIXED r1 | (done) |
| D5 | fixed DevTools port 9333: concurrent captures shared a page target → stills from ANOTHER film, truncated encode (`moov atom not found`) | systematic | `progress-s12.md:7`; `friction-mining.md` F4; `capture.mjs:107,140` | FIXED r2 | (done) |
| D6 | renderer blind to page errors: an inline-script throw looked like a hang/blank still; s12 needed 4 throwaway debug scripts | systematic | `friction-mining.md` F1; `progress-s12.md:7-8`; `capture.mjs:176,211` | FIXED r2 | (done) |
| D7 | silent font fallback: s11 had no `fonts/` and rendered in a substituted font, invisible to every gate | systematic | `portability-audit.md` §1-3; `capture.mjs:81-88,233-245` | FIXED r2 | (done: all five folders now carry `fonts/`) |
| D8 | Windows-only venv python path meant the asset pre-pass and TV check silently did nothing on POSIX | systematic | `fixes-round1.md` D5; `fixes-round2.md` F4; `capture.mjs:45-64` | FIXED r2 | (done) |
| D9 | forced debug overlay burned into every frame: s09 v1 used `new URLSearchParams(location.search + "&debug=2")`; seen only as a 2-frame edge-touch hit | systematic | `overlay-hud.mjs:1-5`; `s09-university-sun/film.html:14-15,69,130,444` | source FIXED (v2); detector UNWIRED → OPEN | `run-gates.mjs:9-15,29` |
| D10 | black bands inside the raster: s09 v1 16:9 measured `crop=1876:1038:0:20` = ~43 px right + 20/21 px top+bottom inside 1920×1080 | systematic | my `ffmpeg cropdetect` run; `black-bands.mjs:1-8` | render FIXED (v2 `crop=1920:1080:0:0`); detector UNWIRED → OPEN | `run-gates.mjs:9-15,29` |
| D11 | `events.json` disagreed with the delivered edit: s10 on a 24-f/p-beat base vs the renderer's 15, s09 wrong cut list, s11 stale | systematic | `integrity-round.md` I1 (declared/detected/render-truth) | OPEN (s09/s10 corrected by another worker; s08/s11 still FAIL) | `work/persian/htmlfilm/<film>/events.json` |
| D12 | stale stills: 10/11 of s09 `_stills/` disagree with the delivered mp4 (MAD 8.33–29.06 vs 1.29–2.79 for matches); s12 26/26 older than its mp4 | systematic | `integrity-round.md` I2 (bimodal split, threshold in a real gap) | OPEN everywhere; detector built | capture/still workflow |
| D13 | frame base unsound: s10 cuts on a 48-step grid, three beyond the film; s11 at 130 BPM gcd 1 / 13.846 f-per-beat | systematic | `integrity-round.md` I3 | s10 FIXED (v2 PASS); s11 OPEN | `events.json` / beat grid |
| D14 | no `VERSION.json` for the batch → deliver and QC had no measured record (s12 review called it blocking) | systematic | `recon-qc.md` R3; `integrity-round.md` I4 | FIXED (all five verified present) | (done: `film-integrity.mjs --write-version`) |
| D15 | `number-lint` scanned 0 files on a single-`.html` film → a vacuous PASS used as delivery evidence | systematic | s11 `review-1.md`; my re-run now prints `2 files` | FIXED (hardened) | (done: `number-lint.mjs`) |
| D16 | `hero-size` measured the largest decorative blob (coral ring 41%), not text (headline 8.1%) → never tested the rule it names | systematic | s11 `review-1.md`; `hero-size.mjs:1-9` | FIXED (hardened) | (done: `hero-size.mjs`) |
| D17 | `duplicate-template` printed `N/A needs scene starts` even with `--events` passed, so the key gate for cut-based films silently did not run | systematic | s11 `review-1.md`; s12 `review-1.md` D10; v2 rows now `FAIL` | FIXED (hardened) | (done) |
| D18 | `logo-colour`: false-FAIL on a foreign hardcoded blue, `skipped` on a film with an inline mark, and no row at all under `--only logo-colour` | systematic | `logo-colour.mjs:1-12`; my run on s11 without `--no-logo` still FAILs naming `rgb(105,131,208)` and exits 1 | PARTIAL → OPEN | `logo-colour.mjs` (default `--logo-files`) |
| D19 | gate evidence not comparable: v1 JSONs from the OLD detectors (19:34–19:55), v2 from the hardened ones (20:44–20:45), so the v1→v2 delta mixes film change with detector change | systematic | gate JSON mtimes vs rows (`number-lint` PASS→FAIL, `empty-band` PASS→FAIL on s09); `gates/lib.mjs` mtime 20:11 | OPEN | `run-gates.mjs` (record suite revision) |
| D20 | every capture fails TV `gop_le_2s`: no `-g` is passed, so x264 keyint 250 gives `gop=8.33s` in all ten capture logs | systematic | `results/_cap-s09-9x16.log` tv-check line; `capture.mjs:283-284` | OPEN | `work/persian/htmlfilm/capture.mjs` |
| D21 | silent v1 is structurally TV-unsafe: `range_tv`, `bt709_tags` and the AAC-track check all FAIL a deliberately silent file; only the injected inaudible track passes, and compress's own encode still omits `color_primaries`/`color_transfer` | rule-conflict | `silent-deliver.md` check map + verified fix recipe | verdict FIXED (r1); enforcement OPEN | `optimize_assets.py` / TV order |
| D22 | the ~300 s ceiling forces hand-rolled segmentation: s09 16:9 took 318.4 s; s12 shipped two stream-copied 300-frame segments (8,328,762+8,776,080 ≈ 17,104,127 B) → 43% over the 12 MB guidance, no single encode pass | systematic | `results/_cap-s09-16x9.log.exit` `SECS=318.8`; s12 `review-1.md` D6; `_list-9x16.txt` | OPEN | capture tool (segment + mandatory re-encode) |
| D23 | still filenames carry no ratio and no film label → the shared `_stills` folder let a 16:9 run overwrite a 9:16 set | systematic | `progress-s08.md:10`; `friction-mining.md` F4; name pattern `capture.mjs:138` | OPEN | `capture.mjs` naming |
| D24 | no parse/lint step before opening the film: 3 JS syntax defects in s12 cost a hand-written lexer plus an orphan-token scanner | systematic | `friction-mining.md` F2; `_bal.mjs:1`, `_scan.mjs:3`; `progress-s12.md:8` | OPEN | `work/persian/htmlfilm/lib/pa-selftest.mjs` |
| D25 | `PA.layout` clobbers caller-visible `W`/`H`; cut counts are never checked against scene counts (10 cuts / 9 scenes crashed) | systematic | `progress-s11.md:4`; `friction-mining.md` F5 | OPEN | `work/persian/htmlfilm/lib/pa-layout.js` |
| D26 | the LTR-isolate rule is re-implemented per film (3 copies) and still broke: an isolate mirrored «۱۵» into «۵۱» | rule-conflict | `progress-s12.md:13`; `friction-mining.md` F3; s12 `review-1.md` D8 (header claims behaviour the code lacks) | OPEN | `lib/pa-motion.js` (`PA.ltr`) + `SPEC.md` |
| D27 | header contract unenforced: `FIX LOG` absent 5/5, `treatment` absent 5/5, `GOAL` missing 2/5 — fixes were made and never written into the file | misunderstanding | `friction-mining.md` §5 matrix (per-film line numbers) | OPEN | `SPEC.md` / `PLAYBOOK-BUILD-MOTION.md` |
| D28 | `dead-frames` PASS rests on one scene start when `cut_frames:[0]`, so mid-film uniformity is unproven | systematic | s11 and s12 `review-1.md` D10 (both quote `1 scene starts checked`) | OPEN | `events.json` scene starts or the gate |
| D29 | the s10 v1→v2 edge-touch jump (15/249 → 236/270 sampled frames) cannot be attributed: film and detector both changed in that window | systematic (measurement) | `s10-factory-parsa/{v1,v2}/gates-*.json` rows; `gates/lib.mjs` 20:11 vs v1 gate 19:50 | OPEN | same as D19 |

## WHAT THE GATES COULD NOT SEE

| blind spot | today's evidence | now? |
|---|---|---|
| vacuous `number-lint` (`0 files`) | s11 review; my re-run prints `2 files` | FIXED |
| unclosable `duplicate-template` (`N/A` with `--events` passed) | s11 review; v2 row now FAIL | FIXED |
| decorative `hero-size` (ring 41% vs text 8.1%) | s11 review; `hero-size.mjs` header | FIXED (new `hero-text`) |
| `logo-colour`'s three wrong behaviours | `logo-colour.mjs:1-12`; my run still false-FAILs a no-brand film | PARTIAL |
| no debug-overlay detector | `overlay-hud.mjs` exists and documents the s09 case; `run-gates.mjs` does not import it | OPEN (unwired) |
| no black-band detector | `black-bands.mjs` exists; my `cropdetect` confirms the s09 v1 bands; not imported | OPEN (unwired) |
| no events-vs-render check | `film-integrity.mjs` I1 built; s08/s11 FAIL | OPEN (tool built, films not fixed) |
| no stale-stills check | `film-integrity.mjs` I2 built; fails on all five | OPEN (tool built) |
| no font-fallback detector | `capture.mjs:81-88` exits 4 on a missing file; a network font still substitutes silently | PARTIAL |
| no page-error surface | `capture.mjs:176,211` now collects `exceptionThrown` | FIXED |
| `empty-band` had one threshold for both ratios | `empty-band.mjs` per-ratio baseline measured on the five v1 masters (9:16 p90 0.400, 16:9 p90 0.367) | FIXED |

## MEASUREMENTS

Capture (real log tails; `ms per screenshot` is the cost driver; all 30 fps, png, no audio stream):

| film | frames | 9:16 wall | 16:9 wall | fps 9:16 / 16:9 | ms per screenshot | v1 mp4 9:16 / 16:9 |
|---|---|---|---|---|---|---|
| s08 | 450 (15 s) | 250.3 s | 235.5 s | 1.8 / 1.9 | 549 / 517 | 8,252,701 / 7,374,770 B |
| s09 | 750 (25 s) | 267.1 s | **318.4 s** | 2.8 / 2.4 | 352 / 420 | 9,393,267 / 10,706,174 B |
| s10 | 600 (20 s) | 192.1 s | 222.7 s | 3.1 / 2.7 | 317 / 367 | 2,926,672 / 3,249,782 B |
| s11 | 540 (18 s) | 51.3 s | 49.3 s | 10.6 / 11.0 | 92 / 88 | 2,964,092 / 2,573,072 B |
| s12 | 600 (20 s) | not logged | not logged | segmented 2×300 f | — | 17,104,127 / 13,999,190 B |

Throughput spread **1.8–11.0 fps** (6× slowest to fastest) and **49–318 s** wall per ratio; s09 16:9 at 318.4 s is the run that passed the ~300 s ceiling. Reference: s07 smoke `9.4 fps` full film, 10.2 fps short range (`smoke.md`).

Gate delta v1→v2 (raw rows; **contaminated by detector hardening, see D19** — gate JSON mtimes v1 19:34–19:55, v2 20:44–20:45; `s09 number-lint PASS→FAIL` is the hardened gate, not a film regression):

| film/ratio | v1 | v2 |
|---|---|---|
| s09 9:16 | edge FAIL, empty PASS, dead PASS, dup FAIL, num PASS, hero WARN | edge FAIL, empty FAIL, dead PASS, dup FAIL, num FAIL, hero WARN |
| s09 16:9 | edge FAIL, empty PASS, dead PASS, dup FAIL, num PASS | edge FAIL, empty FAIL, dead PASS, dup FAIL, num FAIL |
| s10 9:16 | edge PASS, empty FAIL, dead PASS, dup FAIL, num PASS | edge FAIL, empty FAIL, dead PASS, dup FAIL, num FAIL |
| s10 16:9 | edge FAIL, empty FAIL, dead PASS, dup FAIL, num PASS | edge FAIL, empty FAIL, dead PASS, dup FAIL, num FAIL |
| s11 9:16 | edge FAIL, empty FAIL, dead PASS, dup **N/A**, num PASS | edge FAIL, empty FAIL, dead FAIL, dup FAIL, num PASS, hero WARN |
| s11 16:9 | edge FAIL, empty FAIL, dead PASS, dup **N/A**, num PASS | edge FAIL, empty FAIL, dead FAIL, dup FAIL, num PASS |

Other verified numbers: s09 v1 16:9 `crop=1876:1038:0:20` vs v2 `crop=1920:1080:0:0` (my run); `pa assets-check` → `FAIL 0 WARN 0 PASS 13` (my run); s12 final = stream-copied concat of two segments (8,328,762 + 8,776,080 ≈ 17,104,127 B); review scores 74 / 59 / 56 / 75 / 66, all FIX.

## OPEN ITEMS / NEXT ROUND (ranked; file to change + one-line acceptance test)

1. **Wire the two new detectors.** `work/persian/tools/gates/run-gates.mjs` — add `overlay-hud` and `black-bands` to imports and to the default `--only` list. *Accept:* `run-gates.mjs media/film-versions/s09-university-sun/v1/silent-16x9.mp4 --only overlay,black` prints both rows and exits 1 on the v1 master, 0 on v2.
2. **Record the detector revision in every gate run** (D19/D29). `run-gates.mjs` — write a `suite` revision into the `--json` output. *Accept:* gate JSONs from different suite revisions carry different `suite` values, so a v1→v2 delta can be attributed.
3. **Fix the capture GOP** (D20). `work/persian/htmlfilm/capture.mjs:283` — add `-g 60 -keyint_min 30`. *Accept:* `python work/persian/tools/assets/tv_check.py <new capture>` no longer lists `gop_le_2s`.
4. **Own segmentation in the capture tool** (D22). `capture.mjs` — a `--segment <n>` mode that writes segments and ALWAYS re-encodes the joined file. *Accept:* a >300 s film yields one re-encoded final under 12 MB whose `nb_frames` equals the declared count.
5. **Regenerate stills from the final mp4** (D12). `work/persian/tools/verify/film-integrity.mjs` — a `--restill` mode. *Accept:* after a source change, every `_stills*/` PNG passes I2 with MAD ≤ 4.0.
6. **`--write-version` before `deliver`** (D14/D21). `work/persian/tools/deliver/deliver.mjs` — refuse a version folder with no `VERSION.json`. *Accept:* `pa deliver s13 v1` with no VERSION.json exits non-zero naming `film-integrity.mjs --write-version`.
7. **`logo-colour` must not use a foreign default asset** (D18). `logo-colour.mjs` — treat the default uni-local `--logo-files` as absent unless the film's source names a mark. *Accept:* `run-gates … s11 … --only logo` (no `--no-logo`) prints `N/A` with a reason and never names `rgb(105,131,208)`.
8. **Make `dead-frames` require ≥ 3 scene windows** (D28). `work/persian/tools/gates/dead-frames.mjs`. *Accept:* a one-take film reports ≥ 3 checked windows or an explicit under-sampled FAIL.
9. **A parse step for the inline script** (D24). `work/persian/htmlfilm/lib/pa-selftest.mjs` — parse each film's inline `<script>` plus an orphan-token scan. *Accept:* the three s12 v1 defects are caught with no bespoke script.
10. **`PA.layout` return values + scene/cut cross-check** (D25). `work/persian/htmlfilm/lib/pa-layout.js`. *Accept:* a film with 10 cuts and 9 scenes fails a self-test with a named message.
11. **One shared LTR-isolate helper** (D26). `work/persian/htmlfilm/lib/pa-motion.js` + `SPEC.md`. *Accept:* a Persian-numeral token renders in RTL-logical order (no mirroring) using only `PA.ltr`.
12. **Enforce the header contract** (D27). `work/persian/htmlfilm/SPEC.md` / `docs/motion/PLAYBOOK-BUILD-MOTION.md`. *Accept:* a pre-capture check FAILs a film.html with no `FIX LOG` field.
