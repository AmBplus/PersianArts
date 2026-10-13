# Periodic commit + push of the Persian shotcraft work so nothing is lost if a session stops (usage limit, crash).
# Stages ONLY this project's paths (never the owner's unrelated changes) and pushes the current work branch (default main) over SSH.
# Guards: media/ is never staged; binaries are excluded under the new text-only roots; the commit is refused
# when `node contracts/scan.mjs` exits non-zero (nothing is committed or pushed in that cycle).
# Usage (repo root):  pwsh -File work/persian/autosync.ps1 [-IntervalSec 600] [-Once] [-DryRun]
#   -DryRun: lists what would be staged and runs the scan, but stages, commits and pushes nothing (implies a single pass).
param([int]$IntervalSec = 300, [switch]$Once, [switch]$DryRun, [string]$Branch = 'main')
$ErrorActionPreference = 'Continue'
Set-Location (Resolve-Path "$PSScriptRoot\..\..")
$remote = 'git@github.com:AmBplus/PersianArts.git'
$branch = $Branch  # owner decided (2026-10-11) to work on main directly
if ($DryRun) { $Once = $true }

# Existing Persian roots (kept) plus structural text roots added with the architecture/contracts work.
$paths = @('work/persian', 'docs/PERSIAN-LOCALIZATION-LESSONS.md', 'docs/PERSIAN-SHOTCRAFT-HANDOFF.md', 'AGENTS.md', 'CLAUDE.md')
$textRoots = @('docs/motion', 'contracts', 'evals', 'sound') | Where-Object { Test-Path $_ }
# Excludes applied to every add: never media/, the local confidential terms file, the Remotion Chrome cache, and binaries.
$binaryExt = @('mp3', 'ogg', 'wav', 'flac', 'm4a', 'zip', 'mp4', 'mov', 'webm', 'png', 'jpg', 'jpeg', 'gif', 'webp',
               'ttf', 'otf', 'woff', 'woff2', 'pdf', 'psd', 'bin', 'exe', 'dll', 'pak', 'dat', 'hyb')
$textExcludes = @(':(exclude)media', ':(exclude)contracts/confidential-terms.local.txt', ':(exclude)work/persian/.remotion') +
                ($binaryExt | ForEach-Object { ":(glob,exclude)**/*.$_" })

while ($true) {
  $stamp = Get-Date -Format HH:mm:ss
  if ((git branch --show-current) -ne $branch) {
    "$stamp skipped: not on $branch"
  } else {
    node work/persian/progress.mjs | Out-Null
    if ($DryRun) {
      "$stamp dry run: paths that would be staged (no index change):"
      git add --dry-run -- $paths $textRoots $textExcludes 2>$null
    } else {
      git add -- $paths $textRoots $textExcludes 2>$null
    }

    $ok = $true
    $mediaStaged = @(git diff --cached --name-only | Where-Object { $_ -match '^media/' })
    if ($mediaStaged.Count -gt 0) {
      "$stamp REFUSED: $($mediaStaged.Count) media/ path(s) are staged; media is never committed by autosync. Nothing committed or pushed."
      $ok = $false
    }

    $scanOut = node contracts/scan.mjs 2>&1
    $scanExit = $LASTEXITCODE
    if ($scanExit -ne 0) {
      "$stamp REFUSED: contracts/scan.mjs exit $scanExit; nothing committed or pushed (paths only): $(($scanOut | Select-String '^  ') -join '; ')"
      $ok = $false
    } else {
      "$stamp scan clean"
    }

    if ($DryRun) {
      "$stamp dry run finished (guards ok: $ok)"
      break
    }

    if ($ok) {
      git diff --cached --quiet
      if ($LASTEXITCODE -ne 0) {
        $summary = (Get-Content work/persian/progress.json -Raw | ConvertFrom-Json).summary
        $done = $summary.approved + $summary.fixed
        git commit -q -m "wip(persian-shotcraft): autosync $(Get-Date -Format 'yyyy-MM-dd HH:mm') - $done/$($summary.total) done" -m "Automatic snapshot (cards may be mid-edit by running agents; the batch-end commit is authoritative)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
      }
    }

    # integrate other writers (parallel sessions push to main too); local wins on conflicts in generated files
    git fetch -q $remote $branch 2>&1 | Out-Null
    git merge -q --no-edit -X ours FETCH_HEAD 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { git merge --abort 2>$null; "$stamp MERGE FAILED - manual fix needed" }
    $pushOut = git push -q $remote "HEAD:$branch" 2>&1
    if ($LASTEXITCODE -ne 0) { "$stamp PUSH FAILED: $pushOut" }
    "$stamp synced $(git rev-parse --short HEAD)"
  }
  if ($Once) { break }
  Start-Sleep -Seconds $IntervalSec
}
