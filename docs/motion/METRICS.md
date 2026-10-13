# METRICS / سنجه‌ها

**خلاصه:** جلسهٔ ۱۳ مهر (۰۴:۴۷ تا ۰۶:۳۴ UTC) **۱۰۶٫۹ دقیقهٔ ساعت دیواری** طول کشید، نه ۲۵۷. بیشترین زمان **انتظار برای پاسخ مالک** بود: ۴۴٫۴ دقیقه (۴۲٪)، که ۳۱٫۲ دقیقه‌اش فقط بعد از گزارش «P3 مسدود شد» گذشت. رندر ۱۰٫۳ دقیقه (۱۰٪) بود و موسیقی/SFX/میکس فقط ۵٫۴ دقیقه. اجرای همهٔ دستورهای صوتی کمتر از ۴۵ ثانیه طول کشید و بقیه‌اش نوشتن اسکریپت و جست‌وجو بود. اولین ویدیوی قابل‌دیدن ۷۲ دقیقه بعد از شروع جلسه ساخته شد. اگر همان برش کوتاه را امروز با قواعد پایین بسازیم، حدود ۲۵ دقیقه طول می‌کشد. عدد ۲۵۷ روی تابلو گمراه‌کننده است، چون بازه‌های هم‌پوشان را جمع می‌زند و سه آیتم هیچ‌وقت بسته نشده‌اند.

Source of every number: Claude Code transcripts of session `dd8b1f7e` (lead + 29 worker transcripts), rebuilt by
`node work/persian/tools/metrics-timeline.mjs --end 2026-10-13T06:34:19Z` -> `work/persian/status/metrics.json`.
Window = first lead event 04:47:26Z to the METRICS-REVIEW request 06:34:19Z.

## Metric definitions (formula, source, current value)
| Metric | Formula | Source | Value |
|---|---|---|---|
| Lead time to first watchable | first playable mp4 mtime − request time | transcript + mp4 mtime | 72.2 min from session start; 31.2 min from the uni request (05:28:23Z) to `first-video/uni-9x16-12s-silent.mp4` (05:59:35Z). Final short with sound, 4 ratios: 97.2 / 56.2 min |
| Worker time | Σ (worker last event − first event) | worker transcripts | 77.7 worker-min over 29 orders (METERING.md said 76.7; it left out the METERING order itself) |
| Queue wait | worker first event − Agent launch | lead + worker transcripts | about 0 (under 5 s per order). No `qh`/GLM queue was used |
| Decision wait (owner) | wall seconds with no worker and no lead turn running | lead transcript | 44.4 min, 41.5%: 31.2 (04:51→05:22, after the P3-blocked report), 4.4, 4.0, 4.7 |
| Lead overhead | wall seconds where only the lead turn runs | lead transcript | 5.9 min wall (lead turns total 14.3 min, mostly overlapping workers) |
| Permission wait | tool_use → tool_result latency on the lead | lead transcript | 0 prompts. 1 auto-mode denial (8 s) silently dropped the UNI-PORTABLE order |
| Render speed | render wall ÷ frames, and ÷ film seconds | first-video, S2 reports, render logs | 9:16 1080×1920: 92 ms/frame = 2.75 s per film second (12 s in 33 s; 24 s in 62 s). Four ratios in parallel: 46 ms/frame effective, 66.6 s for 12 s. Stills about 0.75 s each |
| Rework ratio | worker-min spent redoing ÷ worker-min | transcripts | 20.5 / 77.7 = **26%** (fix round 8.9, render-fix 4.7, P3 blocked 3.0, S1 EPERM retry about 2, S2 re-render 1.5, board-fix 0.4) |
| Overhead ratio | 1 − (build + render + audio wall) ÷ wall | metrics.json | 1 − 24.2/106.9 = **77%** |
| Plan-vs-build | worker-min on plans/docs/reviews ÷ worker-min on film build | transcripts | 20.2 / 29.0 = **0.70**. On the critical path, 27 min of brief + review + fix round ran before S1 could start |
| Orders per deliverable | orders ÷ watchable deliverables | lead transcript | 30 orders (29 run + 1 denied) for 1 deliverable; 8 were on its critical path |

## Misleading numbers and fixes
1. **Board "مجموع دقیقه کار" = 257 (273 at 06:34).** This sums overlapping intervals, and three items never close: M4 running, M8 queued but carrying a startedAt, and UNBLOCK left running. Together they add 3 min per minute (141.6 min). Eight items were backfilled with startedAt 05:45:51 (board creation) although they ran 05:30–05:39, which counts 10.1 min each instead of 0.4–5.6. *Fix:* the panel shows wall-clock (union) from metrics.json, closes items on hand-back and gives queued items no startedAt.
2. **Late = 0.** Every item has expectedMinutes 20 by default, while the real median order is 1.4 min, so nothing can be late. *Fix:* expected = the order's own time box, or the p75 of past orders of the same kind.
3. **Percent.** The goal % is a mean of item step %, so a 1-step item weighs as much as a 5-step one. Items without steps are ignored: goal A shows 91% with M4, M8 and UNBLOCK unfinished. The overall % is a mean of goals, so empty goal C weighs as much as B. *Fix:* overall = Σ done steps ÷ Σ total steps, and show the count of open items next to it.
4. **METERING.md.** It says "wall-clock not measured": wall-clock is now measured (106.9). It says "permission questions interrupted": there were 0 permission prompts, and the real cost was the 31-min owner wait. It gives portability overhead as "about 25": the measured figure is 20.4 including render-fix and P3.

## Time by activity (wall-clock; concurrent workers share each second)
| Activity | Min | % |
|---|---|---|
| Waiting for owner / decision gaps | 44.4 | 41.5 |
| Rendering (stills + video) | 10.3 | 9.6 |
| Implementation of film code (S1, logo) | 8.5 | 8.0 |
| Writing plans / documents / briefs | 6.7 | 6.3 |
| Slow recursive file searches (inside other orders) | 6.1 | 5.7 |
| Lead deciding / writing orders (nothing else running) | 5.9 | 5.6 |
| Portability / setup tooling | 5.8 | 5.4 |
| Reviews and fix rounds | 5.5 | 5.2 |
| Music + SFX + mixing | 5.4 | 5.1 |
| Dashboard / metering tooling | 4.5 | 4.2 |
| npm install + bundling | 2.3 | 2.2 |
| Git / checkpoint | 0.8 | 0.7 |
| Blocked attempts (P3, besides its 2-min search) | 0.6 | 0.6 |
| **Total** | **106.9** | 100 |

**Dominant:** waiting for the owner (42%), more than all film production combined (render + build + audio = 24.2 min, 23%).
**Surprisingly small:** music/SFX/mix, where all audio commands (synthesis, mix, mux, probe) took under 45 s in total, and npm/bundle, at 4.2 raw min including two failed npm ci runs.
**Surprisingly large:** slow file searches. Three recursive scans of `C:\Work` or `node_modules` took 121 s, 121 s and 50 s, plus a 73 s grep and smaller ones: 6.9 raw min, as much as all render commands (7.2 raw min).

## Improvements, ranked by minutes saved (this session as baseline)
1. **Never end a lead turn on "blocked"** (try the next path; rule D-20261013-14 now exists): −31 min (the 04:51→05:22 gap).
2. **No brief/review/fix-round before the first render**: a one-page shot list, then S1 at once, with the review on the rendered contact sheet. −20 min on the critical path (27 → about 7).
3. **Environment is pre-built** (npm ci fix, fonts, paths, board are done and committed): −10 min (setup + npm + render-fix).
4. **Ban recursive scans** of `C:\Work`/`node_modules` in orders and give exact paths: −6 min.
5. **Reuse `tools/cues/make_short_sound.py`** as the sound template (S3 spent about 4 min writing it): −3 min.
6. **Render only 9:16 until approved**, then all four ratios in one pass: −1.5 min (the S2 re-render).
7. **Dashboard work is finished**: −4.5 min.

**Estimate if started now:** shot list 5, S1 build about 7, four-ratio render about 4, sound about 4, lead gaps about 2, which gives **about 22–25 min** to the four sound versions, with the first watchable 9:16 at about 12 min. This assumes the owner answers within a minute or is not needed.

## Not measurable from files, and the measurement added
- Whether an owner gap was reading time, away time or thinking time cannot be told; only the gap length is known. *Added:* `metrics-timeline.mjs` lists every gap of a minute or more (`waits` in metrics.json). The lead should record in one line why it waits whenever it ends a turn with a question.
- Earlier sessions (`c7a6f7de`, 11–13 Oct) are not in this breakdown. The same script can be run with `--session c7a6f7de-9534-4c1e-a040-793db7a5cdfb`.
