# Report: Pixabay queue runner, milestone 2 (unattended)

Launch command (owner, from repo root): `pwsh -NoProfile -File work/persian/pixabay-queue.ps1`
DryRun: `pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -DryRun` - or double-click `work/persian/pixabay-queue-run.cmd`.

- Wrapper-only change: `work/persian/pixabay-queue.ps1` rewritten; `fetch_pixabay_track.py` untouched. New files: `pixabay-queue-run.cmd` (pwsh launcher, window stays open), state file `pixabay-queue.state`.
- Runs the whole 31-line queue by default; `-Limit N` caps fetches; `-Resume` continues past the last OK line; `-DryRun` parses and lists every queue line without opening a browser, exits 0.
- Unattended loop: launches the fetch helper (1 URL), polls every 5 s up to 10 min for `<slug>.mp3`; on timeout it kills the process, logs FAIL, skips, continues; exits 1 only if some track failed.
- Challenge handling: helper output markers ("solve it by hand", "click Download", or >15 s stall with no file) trigger: Chrome window raised to foreground via user32 (never typed/clicked), "ACTION NEEDED: solve the challenge in Chrome" printed and logged, polling continues until page proceeds or file appears. No CAPTCHA/bot/login is ever solved, bypassed or automated.
- Politeness/safety: strict one-at-a-time, random 20-40 s pause between tracks, run aborts after 5 consecutive failures.
- Verification: agent sandbox could not execute pwsh (approval wall). Desk-checked plus a Python static check: braces/quotes/here-strings balanced, 31 queue lines parse, DryRun path lists all lines. Owner should run the DryRun command above once before the live run.
