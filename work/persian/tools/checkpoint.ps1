<#
.SYNOPSIS
Safe checkpoint for the motion/Persian workspace: scan -> whitelisted add -> commit -> push origin main.

.PARAMETER Message
Commit subject line. Required unless -DryRun.

.PARAMETER DryRun
Lists what would be committed. Changes nothing (no index, commit, push or log writes).

.PARAMETER Paths
Extra repo-relative paths to include. Added to the default whitelist, or the whole set with -Only.

.PARAMETER Only
Use only -Paths (no default whitelist). For targeted commits.

Exit codes: 0 ok or nothing to commit; 1 refused or aborted (nothing committed); 2 committed locally but push failed.
Never pulls, rebases or force-pushes. Other workers' paths (docs/motion/reports, work/persian/src/film/uni) are always excluded.
#>
param(
  [string]$Message = '',
  [switch]$DryRun,
  [string[]]$Paths = @(),
  [switch]$Only
)
$ErrorActionPreference = 'Stop'
$Trailer = 'Claude-Session: https://claude.ai/code/session_01Coo1bMt6WZLj2vRESMYssc'
$Utf8 = New-Object System.Text.UTF8Encoding $false

# Repo root = work/persian/tools/../../..
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$cwd = [IO.Path]::GetFullPath((Get-Location).Path)
$top = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $top) { Write-Host 'REFUSE: cwd is not inside a git repo'; exit 1 }
$top = [IO.Path]::GetFullPath(($top -replace '/', '\'))
if ($top -ne $repo -or -not $cwd.StartsWith($repo, [StringComparison]::OrdinalIgnoreCase)) {
  Write-Host "REFUSE: cwd ($cwd) is not inside the repo ($repo)"; exit 1
}
Set-Location $repo

$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Host "REFUSE: branch is '$branch', expected 'main'"; exit 1 }
if (-not $DryRun -and [string]::IsNullOrWhiteSpace($Message)) { Write-Host 'REFUSE: -Message is required'; exit 1 }

# 1. Confidentiality and secrets scan (whole repo). Any non-zero exit aborts.
& node contracts/scan.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "ABORT: scan exit $LASTEXITCODE (nothing staged)"; exit 1 }

# 2. Whitelist (pathspecs). Default excludes apply to everything.
$defaultInclude = @('docs', 'contracts', 'evals', 'sound', 'work/persian', 'plugins/persianarts-motion')
$include = if ($Only) { @($Paths) } else { @($defaultInclude) + @($Paths) }
if ($include.Count -eq 0) { Write-Host 'REFUSE: empty whitelist (-Only without -Paths)'; exit 1 }
$exclude = @(
  ':(exclude)work/persian/_bench',
  ':(exclude)work/persian/.remotion',
  ':(exclude,glob)**/node_modules/**',
  ':(exclude)contracts/confidential-terms.local.txt',
  ':(exclude)docs/motion/reports',
  ':(exclude)work/persian/src/film/uni'
)
$pathspec = @($include) + $exclude

# Changed, untracked (not ignored) and deleted files inside the whitelist.
$raw = @(& git -c core.quotepath=off ls-files -m -o -d --exclude-standard -- @pathspec | Where-Object { $_ })

$binExt = @('.mp3', '.wav', '.ogg', '.flac', '.m4a', '.mp4', '.mov', '.webm', '.png', '.jpg', '.jpeg', '.webp', '.zip')
$soundTextExt = @('.md', '.json', '.jsonl', '.txt', '.csv', '.mjs', '.js', '.ts', '.ps1', '.yml', '.yaml')
$files = New-Object System.Collections.Generic.List[string]
$skippedBinary = 0
foreach ($f in $raw) {
  if ($f -match '^media/') { Write-Host "ABORT: media path in candidates: $f"; exit 1 }
  $ext = [IO.Path]::GetExtension($f).ToLowerInvariant()
  if ($f.StartsWith('sound/') -and ($soundTextExt -notcontains $ext)) { $skippedBinary++; continue }   # sound/: text only
  if ($binExt -contains $ext) {
    # Default whitelist: binaries are never committed (skipped and counted).
    # Binaries the caller names explicitly are included unless over 1 MB (then abort).
    $explicit = @($Paths | Where-Object { $f.StartsWith(($_ -replace '\\', '/').TrimEnd('/') + '/') -or $f -eq $_ }).Count -gt 0
    if (-not $explicit) { $skippedBinary++; continue }
    $full = Join-Path $repo $f
    if ((Test-Path -LiteralPath $full) -and ((Get-Item -LiteralPath $full).Length -gt 1MB)) {
      Write-Host "ABORT: explicit binary over 1 MB: $f"; exit 1
    }
  }
  $files.Add($f)
}
if ($skippedBinary -gt 0) { Write-Host "Skipped $skippedBinary binary/non-text file(s) (binaries are never committed by default)." }

if ($files.Count -eq 0) { Write-Host 'Nothing to commit (whitelist clean).'; exit 0 }

if ($DryRun) {
  Write-Host "DRY RUN: $($files.Count) file(s) would be committed on main (nothing staged, nothing pushed):"
  $files | Select-Object -First 200 | ForEach-Object { Write-Host "  $_" }
  if ($files.Count -gt 200) { Write-Host "  ... $($files.Count - 200) more" }
  exit 0
}

# Refuse if the index already holds foreign staged changes (commit must contain only our files).
$preStaged = @(& git diff --cached --name-only)
if ($preStaged.Count -gt 0) {
  Write-Host "REFUSE: index already has $($preStaged.Count) staged file(s); unstage them first (git reset)."; exit 1
}

# 3. Stage the explicit list (file list via pathspec-from-file, literal paths).
$listFile = [IO.Path]::GetTempFileName()
try {
  [IO.File]::WriteAllText($listFile, ($files -join "`n") + "`n", $Utf8)
  & git --literal-pathspecs add -A --pathspec-from-file=$listFile
  if ($LASTEXITCODE -ne 0) { & git reset -q; Write-Host 'ABORT: git add failed (index reset)'; exit 1 }
} finally { Remove-Item -LiteralPath $listFile -ErrorAction SilentlyContinue }

# Post-stage guard: no media, no big binaries.
$staged = @(& git diff --cached --name-only)
foreach ($s in $staged) {
  $ext = [IO.Path]::GetExtension($s).ToLowerInvariant()
  $bad = $s -match '^media/'
  if (-not $bad -and ($binExt -contains $ext)) {
    $full = Join-Path $repo $s
    if ((Test-Path -LiteralPath $full) -and ((Get-Item -LiteralPath $full).Length -gt 1MB)) { $bad = $true }
  }
  if ($bad) { & git reset -q; Write-Host "ABORT: guard tripped on staged file: $s (index reset, nothing committed)"; exit 1 }
}
if ($staged.Count -eq 0) { Write-Host 'Nothing to commit after staging.'; exit 0 }

Write-Host "Staged $($staged.Count) file(s):"
& git diff --cached --shortstat
& git diff --cached --stat | Select-Object -First 60

# 4. Commit with trailer (no Co-Authored-By).
$msgFile = [IO.Path]::GetTempFileName()
try {
  [IO.File]::WriteAllText($msgFile, "$Message`n`n$Trailer`n", $Utf8)
  & git commit -q -F $msgFile
  if ($LASTEXITCODE -ne 0) { & git reset -q; Write-Host 'ABORT: commit failed (index reset)'; exit 1 }
} finally { Remove-Item -LiteralPath $msgFile -ErrorAction SilentlyContinue }
$hash = (& git rev-parse HEAD).Trim()
Write-Host "Committed $hash"

# 5. Push. On rejection: report, keep the local commit, exit 2. No pull, rebase or force.
& git push origin main
$pushOk = ($LASTEXITCODE -eq 0)
$status = if ($pushOk) { 'pushed' } else { "PUSH-FAILED(exit $LASTEXITCODE)" }

# 6. Append-only checkpoint log (picked up by the next checkpoint).
$ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'
$logLine = "$ts $hash $status files=$($staged.Count) msg=$Message"
Add-Content -LiteralPath (Join-Path $repo 'docs/motion/last-checkpoint.txt') -Value $logLine -Encoding utf8
Write-Host $logLine

if (-not $pushOk) {
  Write-Host 'PUSH FAILED: local commit kept. Resolve manually (no pull/rebase/force was done).'
  exit 2
}
exit 0
