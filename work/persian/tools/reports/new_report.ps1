#Requires -Version 7
# Appends a timestamped checkpoint section to a day's summary.md and detail.md.
# Creates the day folder and empty files with a title if they do not exist yet.
# Never overwrites: it only appends.
#
# Usage:
#   pwsh -File work/persian/tools/reports/new_report.ps1 -Summary <file> -Detail <file> [-Date yyyy-MM-dd]
#     -Summary / -Detail  optional markdown files whose text is appended as "## HH:MM checkpoint"
#     -Date               day folder; default today (local time)
#     -Init               only create the day folder and title files, no checkpoint
param(
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd'),
  [string]$Summary,
  [string]$Detail,
  [switch]$Init
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')
$dayDir = Join-Path $root "docs/motion/reports/$Date"
$sumPath = Join-Path $dayDir 'summary.md'
$detPath = Join-Path $dayDir 'detail.md'

if ($Date -notmatch '^\d{4}-\d{2}-\d{2}$') { throw "Date must be yyyy-MM-dd: $Date" }
New-Item -ItemType Directory -Force -Path $dayDir | Out-Null

if (-not (Test-Path $sumPath)) {
  Set-Content -Path $sumPath -Encoding utf8 -Value "# گزارش روز $Date (خلاصه تصمیم)`n"
}
if (-not (Test-Path $detPath)) {
  Set-Content -Path $detPath -Encoding utf8 -Value "# Detail report $Date (technical)`n"
}

if ($Init) { Write-Output "initialised $dayDir"; return }

$stamp = Get-Date -Format 'HH:mm'

function Add-Checkpoint([string]$target, [string]$source) {
  if (-not $source) { return }
  if (-not (Test-Path $source)) { throw "missing input: $source" }
  $body = (Get-Content -Path $source -Raw -Encoding utf8).TrimEnd()
  $section = "`n## $stamp checkpoint`n`n$body`n"
  Add-Content -Path $target -Encoding utf8 -Value $section
  Write-Output "appended $stamp to $target"
}

Add-Checkpoint $sumPath $Summary
Add-Checkpoint $detPath $Detail
