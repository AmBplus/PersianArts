<#
.SYNOPSIS
Safe checkpoint for the motion/Persian workspace: scan -> whitelisted add -> commit -> push main (with retry).

.PARAMETER Message
Commit subject line. Required unless -DryRun or -PushOnly.

.PARAMETER DryRun
Lists what would be committed (and how many commits would be pushed). Changes nothing (no index, commit, push or log writes).

.PARAMETER Paths
Extra repo-relative paths to include. Added to the default whitelist, or the whole set with -Only.

.PARAMETER Only
Use only -Paths (no default whitelist). For targeted commits.

.PARAMETER PushOnly
Skip scan, staging and commit. Only push local commits that are not yet on the last PUSH-OK point.

.PARAMETER Remote
SSH URL used as the primary push destination (default: the PersianArts repo from AGENTS.md).

Push order: (a) git push origin HEAD:main with GIT_TERMINAL_PROMPT=0 (HTTPS, credential manager);
(b) on failure, git push <SSH URL> HEAD:main with GIT_SSH_COMMAND='ssh -o BatchMode=yes'.
Each run logs PUSH-OK or PUSH-FAILED (with reason) to docs/motion/last-checkpoint.txt. A run with nothing new to commit
still retries every commit after the last PUSH-OK point, so a failed push is retried by the next checkpoint.

Exit codes: 0 ok or nothing to commit or nothing to push; 1 refused or aborted (nothing committed); 2 push failed (local commits kept).
Never pulls, rebases, resets the remote config or force-pushes. Other workers' paths (docs/motion/reports, work/persian/src/film/uni) are always excluded.
#>
param(
  [string]$Message = '',
  [switch]$DryRun,
  [string[]]$Paths = @(),
  [switch]$Only,
  [switch]$PushOnly,
  [string]$Remote = 'git@github.com:AmBplus/PersianArts.git'
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
$logPath = Join-Path $repo 'docs/motion/last-checkpoint.txt'

$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Host "REFUSE: branch is '$branch', expected 'main'"; exit 1 }

# ---- push helpers -------------------------------------------------------------
function Get-LastPushedHash {
  # Last PUSH-OK line in the log = the last commit known to be on the remote (null if none or unknown).
  if (-not (Test-Path -LiteralPath $logPath)) { return $null }
  $line = Get-Content -LiteralPath $logPath -Encoding utf8 | Where-Object { $_ -match ' PUSH-OK ' } | Select-Object -Last 1
  if (-not $line) { return $null }
  $h = ($line -split ' ')[1]
  $ErrorActionPreference = 'Continue'
  & git cat-file -e "$h^{commit}" 2>$null
  $ok = ($LASTEXITCODE -eq 0)
  $ErrorActionPreference = 'Stop'
  if ($ok) { return $h } else { return $null }
}

function Get-UnpushedCount {
  # -1 = unknown (no PUSH-OK point yet): the caller attempts a push, which is idempotent.
  $base = Get-LastPushedHash
  if (-not $base) { return -1 }
  $n = @(& git rev-list --count "$base..HEAD") | Select-Object -Last 1
  return [int]$n
}

function Invoke-GitPushAttempt([string[]]$PushArgs, [hashtable]$EnvSet) {
  # Runs one git push with temporary env vars; returns @{ Ok; Text }.
  $saved = @{}
  foreach ($k in $EnvSet.Keys) { $saved[$k] = [Environment]::GetEnvironmentVariable($k); [Environment]::SetEnvironmentVariable($k, $EnvSet[$k]) }
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = @(& git push @PushArgs 2>&1 | ForEach-Object { "$_" })
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $prevEap
    foreach ($k in $EnvSet.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k]) }
  }
  $text = (($out | Where-Object { $_ -and $_.Trim() }) -join ' | ')
  return @{ Ok = ($code -eq 0); Code = $code; Text = $text }
}

function Invoke-PushMain {
  $reasons = @()
  # (a) primary: configured origin over HTTPS (credential manager); no terminal prompt, never force
  $a = Invoke-GitPushAttempt @('origin', 'HEAD:main') @{ GIT_TERMINAL_PROMPT = '0' }
  if ($a.Ok) { return @{ Ok = $true; Via = 'origin'; Text = $a.Text } }
  $reasons += "origin exit $($a.Code): $($a.Text)"
  # (b) fallback: explicit SSH URL with BatchMode (never prompts)
  $b = Invoke-GitPushAttempt @($Remote, 'HEAD:main') @{ GIT_SSH_COMMAND = 'ssh -o BatchMode=yes'; GIT_TERMINAL_PROMPT = '0' }
  if ($b.Ok) { return @{ Ok = $true; Via = 'ssh'; Text = $b.Text } }
  $reasons += "ssh exit $($b.Code): $($b.Text)"
  return @{ Ok = $false; Via = ''; Text = ($reasons -join ' || ') }
}

function Sync-Push([string]$Detail) {
  # Pushes HEAD if it is ahead of the last PUSH-OK point. Logs PUSH-OK / PUSH-FAILED. Returns exit code.
  $n = Get-UnpushedCount
  if ($n -eq 0) { Write-Host 'Push: nothing unpushed (HEAD is at the last PUSH-OK point).'; return 0 }
  if ($DryRun) { Write-Host "DRY RUN push: $n unpushed commit(s) would be pushed to $Remote (fallback origin if PersianArts)."; return 0 }
  $r = Invoke-PushMain
  $hash = (& git rev-parse HEAD).Trim()
  $ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:sszzz'
  $nText = if ($n -lt 0) { 'unknown' } else { "$n" }
  if ($r.Ok) { $status = "PUSH-OK via=$($r.Via)" } else {
    $reason = $r.Text -replace "`r?`n", ' '
    if ($reason.Length -gt 600) { $reason = $reason.Substring(0, 600) + '...' }
    $status = "PUSH-FAILED reason=[$reason]"
  }
  $logLine = "$ts $hash $status unpushed=$nText $Detail"
  Add-Content -LiteralPath $logPath -Value $logLine -Encoding utf8
  Write-Host $logLine
  if ($r.Ok) { return 0 }
  Write-Host 'PUSH FAILED: local commit(s) kept. The next checkpoint retries. No pull/rebase/force was done.'
  return 2
}

# ---- push-only mode -----------------------------------------------------------
if ($PushOnly) {
  if ($DryRun) { $n = Get-UnpushedCount; Write-Host "DRY RUN push-only: $n unpushed commit(s), nothing pushed."; exit 0 }
  exit (Sync-Push 'mode=push-only')
}

if (-not $DryRun -and [string]::IsNullOrWhiteSpace($Message)) { Write-Host 'REFUSE: -Message is required'; exit 1 }

# 1. Confidentiality and secrets scan (whole repo). Any non-zero exit aborts.
& node contracts/scan.mjs
if ($LASTEXITCODE -ne 0) { Write-Host "ABORT: scan exit $LASTEXITCODE (nothing staged)"; exit 1 }

# 2. Whitelist (pathspecs). Default excludes apply to everything.
$defaultInclude = @('docs', 'contracts', 'evals', 'sound', 'work/persian', 'plugins/persianarts-motion')
$include = if ($Only) { @($Paths) } else { @($defaultInclude) + @($Paths) }
if ($include.Count -eq 0) { Write-Host 'REFUSE: empty whitelist (-Only without -Paths)'; exit 1 }
# node_modules is excluded per root: a leading '**/' exclude in git 2.55 drops every include match (verified).
$exclude = @(
  ':(exclude)work/persian/_bench',
  ':(exclude)work/persian/.remotion',
  ':(exclude,glob)contracts/**/node_modules/**',
  ':(exclude,glob)docs/**/node_modules/**',
  ':(exclude,glob)evals/**/node_modules/**',
  ':(exclude,glob)sound/**/node_modules/**',
  ':(exclude,glob)work/persian/**/node_modules/**',
  ':(exclude,glob)plugins/persianarts-motion/**/node_modules/**',
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

if ($files.Count -eq 0) {
  Write-Host 'Nothing to commit (whitelist clean). Retrying unpushed commits.'
  if ($DryRun) { $n = Get-UnpushedCount; Write-Host "DRY RUN: nothing to commit; $n unpushed commit(s)."; exit 0 }
  exit (Sync-Push 'mode=retry-no-new-changes')
}

if ($DryRun) {
  Write-Host "DRY RUN: $($files.Count) file(s) would be committed on main (nothing staged, nothing pushed):"
  $files | Select-Object -First 200 | ForEach-Object { Write-Host "  $_" }
  if ($files.Count -gt 200) { Write-Host "  ... $($files.Count - 200) more" }
  $n = Get-UnpushedCount
  Write-Host "DRY RUN: $n unpushed commit(s) from earlier runs would also be pushed."
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
if ($staged.Count -eq 0) { Write-Host 'Nothing to commit after staging. Retrying unpushed commits.'; exit (Sync-Push 'mode=retry-after-empty-stage') }

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

# 5. Push (with retry rules above). Local commit is kept on failure. Exit 2 = committed but not pushed.
exit (Sync-Push "files=$($staged.Count) msg=$Message")
