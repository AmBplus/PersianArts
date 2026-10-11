# Periodic commit + push of the Persian shotcraft work so nothing is lost if a session stops (usage limit, crash).
# Stages ONLY this project's paths (never the owner's unrelated changes) and pushes the current work branch (default main) over SSH.
# Usage (repo root):  pwsh -File work/persian/autosync.ps1 [-IntervalSec 600] [-Once]
param([int]$IntervalSec = 300, [switch]$Once, [string]$Branch = 'main')
$ErrorActionPreference = 'Continue'
Set-Location (Resolve-Path "$PSScriptRoot\..\..")
$remote = 'git@github.com:AmBplus/PersianArts.git'
$branch = $Branch  # owner decided (2026-10-11) to work on main directly
$paths = @('work/persian', 'docs/PERSIAN-LOCALIZATION-LESSONS.md', 'docs/PERSIAN-SHOTCRAFT-HANDOFF.md', 'AGENTS.md', 'CLAUDE.md')
while ($true) {
  if ((git branch --show-current) -eq $branch) {
    node work/persian/progress.mjs | Out-Null
    git add -- $paths 2>$null
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
      $summary = (Get-Content work/persian/progress.json -Raw | ConvertFrom-Json).summary
      $done = $summary.approved + $summary.fixed
      git commit -q -m "wip(persian-shotcraft): autosync $(Get-Date -Format 'yyyy-MM-dd HH:mm') — $done/$($summary.total) done" -m "Automatic snapshot (cards may be mid-edit by running agents; the batch-end commit is authoritative)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
    }
    # integrate other writers (parallel sessions push to main too); local wins on conflicts in generated files
    git fetch -q $remote $branch 2>&1 | Out-Null
    git merge -q --no-edit -X ours FETCH_HEAD 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { git merge --abort 2>$null; "$(Get-Date -Format HH:mm:ss) MERGE FAILED - manual fix needed" }
    $pushOut = git push -q $remote "HEAD:$branch" 2>&1
    if ($LASTEXITCODE -ne 0) { "$(Get-Date -Format HH:mm:ss) PUSH FAILED: $pushOut" }
    "$(Get-Date -Format HH:mm:ss) synced $(git rev-parse --short HEAD)"
  } else {
    "$(Get-Date -Format HH:mm:ss) skipped: not on $branch"
  }
  if ($Once) { break }
  Start-Sleep -Seconds $IntervalSec
}
