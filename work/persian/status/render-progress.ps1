# Dot-sourced by render_all.ps1: writes the "render" section of status/board.json while Remotion renders.
# Never throws (status must not break a render).
$script:RpLastWrite = [DateTime]::MinValue
$script:RpT0 = $null; $script:RpF0 = 0

function Get-RenderProgress([string]$logPath) {
  # Parses the last "x/y" after Rendered/Rendering/Encoded in the Remotion progress output (CR-separated).
  try {
    if (-not (Test-Path -LiteralPath $logPath)) { return $null }
    $fs = [IO.File]::Open($logPath, 'Open', 'Read', 'ReadWrite')
    try {
      $len = $fs.Length; $take = [math]::Min(8192, $len); $fs.Seek($len - $take, 'Begin') | Out-Null
      $buf = New-Object byte[] $take; [void]$fs.Read($buf, 0, $take)
    } finally { $fs.Dispose() }
    $txt = [Text.Encoding]::UTF8.GetString($buf)
    $m = [regex]::Matches($txt, '(?:Rendered|Rendering|Encoded|Encoding)[^\r\n]*?(\d+)\s*/\s*(\d+)')
    if ($m.Count -eq 0) { return $null }
    $l = $m[$m.Count - 1]
    return @{ frame = [int]$l.Groups[1].Value; total = [int]$l.Groups[2].Value }
  } catch { return $null }
}

function Set-RenderBoard([hashtable]$r) {
  try {
    $p = Join-Path $PSScriptRoot 'board.json'
    if (-not (Test-Path -LiteralPath $p)) { return }
    $b = Get-Content -Raw -Encoding utf8 $p | ConvertFrom-Json -Depth 20 -DateKind String
    $b.render = [pscustomobject]$r
    $tmp = "$p.tmp-$PID"
    [IO.File]::WriteAllText($tmp, ($b | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $tmp -Destination $p -Force
  } catch { }
}

# $running / $done: job hashtables with .Log (prefix; stdout in "$Log.out") and .Entry.ratio
function Update-RenderBoard($running, $done, [string]$film, [int]$queued, [switch]$Force) {
  if (-not $Force -and ([DateTime]::UtcNow - $script:RpLastWrite).TotalSeconds -lt 2) { return }
  $script:RpLastWrite = [DateTime]::UtcNow
  $frame = 0; $total = 0; $ratios = @()
  foreach ($j in @($done)) { if ($j.ContainsKey('TotalFrames')) { $frame += [int]$j.TotalFrames; $total += [int]$j.TotalFrames } }
  foreach ($j in @($running)) {
    $ratios += $j.Entry.ratio
    $pr = Get-RenderProgress "$($j.Log).out"
    if ($pr) { $j.TotalFrames = $pr.total; $frame += $pr.frame; $total += $pr.total }
  }
  if ($queued -gt 0 -and $total -gt 0) { $per = $total / [math]::Max(1, @($running).Count + @($done).Count); $total += [int]($per * $queued) }
  $now = [DateTime]::UtcNow
  if (-not $script:RpT0) { $script:RpT0 = $now; $script:RpF0 = $frame }
  $el = ($now - $script:RpT0).TotalSeconds
  $fps = if ($el -gt 1 -and $frame -gt $script:RpF0) { [math]::Round(($frame - $script:RpF0) / $el, 1) } else { 0 }
  $eta = if ($fps -gt 0 -and $total -gt $frame) { [int](($total - $frame) / $fps) } else { 0 }
  Set-RenderBoard @{ running = $true; film = $film; ratio = ($ratios -join ','); frame = $frame; total = $total; fps = [double]$fps; etaSeconds = $eta; updatedAt = [DateTime]::UtcNow.ToString('o') }
}

function Stop-RenderBoard([string]$film) {
  Set-RenderBoard @{ running = $false; film = $film; ratio = ''; frame = 0; total = 0; fps = 0; etaSeconds = 0; updatedAt = [DateTime]::UtcNow.ToString('o') }
}
