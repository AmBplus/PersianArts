PLAN m2: upgrade pixabay-queue.ps1 (unattended poll loop, challenge->foreground+ACTION NEEDED, -Limit/-Resume/-DryRun, 5-fail stop, 20-40s pauses); add pixabay-queue-run.cmd; write report-pixabay-queue-m2.md; verify -DryRun exits 0 listing all 31 queue lines. NO real downloads, no git ops, no installs, no tracked-file edits (wrapper only).
STEP: read queue.txt, pixabay-queue.ps1, fetch_pixabay_track.py, FETCH-PIXABAY.md, audio-sources-brief.md - done.
STEP: rewrote work/persian/pixabay-queue.ps1 (wrapper-only; fetch script untouched): -DryRun listing all queue lines, -Limit, -Resume (state file), unattended poll loop 5s/10min, foreground-Chrome + ACTION NEEDED on challenge markers, FAIL-and-continue, stop after 5 consecutive failures, 20-40s random pauses - done.
STEP: added work/persian/pixabay-queue-run.cmd (pwsh launcher, pause keeps window open) - done.
STEP: attempted acceptance run `pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -DryRun` - BLOCKED: sandbox/agent policy requires interactive approval for pwsh/cmd/powershell; no human present.
STEP: fallback verification with Python static check: brace/paren/quote/here-string balance OK, 31 queue lines parse cleanly, cmd launcher references ps1 - done.
STEP: wrote work/persian/report-pixabay-queue-m2.md with exact launch command and verification caveat - done.
DONE m2: deliverables in place; owner runs the DryRun command once (acceptance) then the live run.
