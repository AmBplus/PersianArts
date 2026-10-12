#Requires -Version 7.0
<#
Fast, quality-neutral render pipeline for the Persian films (Remotion 4). See render_all.md.
  pwsh -File work/persian/render_all.ps1 -Film social -Bpm 124 -T0 0.24283 -OutDir media/film-versions/pencil-social/<version>
#>
param(
  [ValidateSet('social', 'uni')][string]$Film,
  [string]$Ratios = '9x16,1x1,4x5,16x9',
  [double]$Bpm,
  [double]$T0,
  [string]$PropsJson = '{}',
  [string]$OutDir,
  [ValidateSet('final', 'preview', 'stills')][string]$Mode = 'final',
  [string]$Frames,
  [int]$Parallel = 4,
  [int]$Concurrency = 2,
  # native: Remotion's single encode, unchanged (yuvj420p, full range; the measured quality-neutral choice).
  # bt709: Remotion's own single encode to limited (tv) range with bt709 tags (zscale path); costs SSIM, see render_all.md.
  [ValidateSet('native', 'bt709')][string]$Output = 'native',
  [switch]$NoCache,
  [switch]$Preflight
)

$ErrorActionPreference = 'Stop'
$total = [Diagnostics.Stopwatch]::StartNew()

# ---------- preflight: what else is loading the machine (renders are slow under load) ----------
function Show-Preflight {
  $os = Get-CimInstance Win32_OperatingSystem
  $freeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
  $nodeN = @(Get-Process node -ErrorAction SilentlyContinue).Count
  $chromeN = @(Get-Process chrome -ErrorAction SilentlyContinue).Count
  Write-Host "preflight: freeRAM=${freeGB}GB otherNodeProcs=$nodeN otherChromeProcs=$chromeN"
  if ($chromeN -gt 4) { Write-Warning "preflight: $chromeN chrome.exe processes are running (more than 4); they slow renders. Close them or expect slower wall times." }
}
Show-Preflight
if ($Preflight) { exit 0 }
if (-not $Film -or -not $OutDir) { throw 'Film and OutDir are required (or pass -Preflight alone to only print the preflight line).' }

# ---------- paths ----------
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Persian = Join-Path $Root 'work\persian'
$Wb = Join-Path $Persian 'src\workbench'
$FilmSrc = Join-Path $Persian "src\film\$Film"
$Cli = Join-Path $Wb 'node_modules\@remotion\cli\remotion-cli.js'
$FvRoot = Join-Path $Root 'media\film-versions'
$CacheRoot = Join-Path $FvRoot '_bundle-cache'
$SilentRoot = Join-Path $FvRoot '_silent-cache'
$Node = (Get-Command node -ErrorAction Stop).Source
if (-not (Test-Path $Cli)) { throw "Remotion CLI not found: $Cli (run npm install in work/persian/src/workbench)" }

# OutDir must be media/film-versions/<film-name>/<version>
$OutFull = [IO.Path]::GetFullPath($(if ([IO.Path]::IsPathRooted($OutDir)) { $OutDir } else { Join-Path $Root $OutDir })).TrimEnd('\')
$FvFull = [IO.Path]::GetFullPath($FvRoot).TrimEnd('\')
if (-not $OutFull.StartsWith($FvFull + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "OutDir must be under media\film-versions: $OutFull" }
$rel = $OutFull.Substring($FvFull.Length + 1).Split('\')
if ($rel.Count -lt 2 -or $rel[0].StartsWith('_')) { throw "OutDir must be media\film-versions\<film-name>\<version> (got $OutFull)" }
New-Item -ItemType Directory -Force -Path $OutFull, $CacheRoot, $SilentRoot | Out-Null

# ---------- ratios and composition ids ----------
$known = @('9x16', '1x1', '4x5', '16x9')
$ratioList = $Ratios.Split(',') | ForEach-Object { $_.Trim() }
foreach ($r in $ratioList) { if ($r -notin $known) { throw "Unknown ratio '$r' (use $($known -join ','))" } }
$prefix = if ($Film -eq 'social') { 'Social' } else { 'Uni' }
# Verify the ids exist in the entry file (composition ids are derived from it).
$entryText = Get-Content -Raw (Join-Path $Persian "src\film\$Film\entry.tsx")
foreach ($r in $ratioList) { if ($entryText -notmatch [regex]::Escape("`"$prefix$r`"")) { throw "Composition $prefix$r not in entry.tsx" } }

# ---------- props ----------
$props = [ordered]@{}
$extra = $PropsJson | ConvertFrom-Json -AsHashtable
foreach ($k in $extra.Keys) { $props[$k] = $extra[$k] }
if ($PSBoundParameters.ContainsKey('Bpm')) { $props['BPM'] = $Bpm }
if ($PSBoundParameters.ContainsKey('T0')) { $props['T0_S'] = $T0 }
$propsJson = if ($props.Count) { $props | ConvertTo-Json -Compress -Depth 10 } else { '{}' }

function Get-Sha1([string]$text) {
  $bytes = [Text.Encoding]::UTF8.GetBytes($text)
  [Convert]::ToHexString([Security.Cryptography.SHA1]::HashData($bytes)).ToLowerInvariant()
}

# ---------- bundle key: film source + demos/_fa + remotion version + workbench config ----------
$remVer = (Get-Content -Raw (Join-Path $Wb 'node_modules\remotion\package.json') | ConvertFrom-Json).version
$srcLines = foreach ($d in @($FilmSrc, (Join-Path $Persian 'src\demos\_fa'))) {
  if (Test-Path $d) {
    Get-ChildItem -LiteralPath $d -Recurse -File | Sort-Object FullName | ForEach-Object {
      $_.FullName.Substring($Root.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA1).Hash
    }
  }
}
$cfgHash = (Get-FileHash -LiteralPath (Join-Path $Wb 'remotion.config.ts') -Algorithm SHA1).Hash
# Workbench public/** (fonts, textures, sfx/bgm libs and the git-ignored public/uni-local assets) is bundled into the
# Remotion bundle, so it must be part of the key. Name + size + mtime (no content hashing: the tree is ~10 MB, 117 files).
$pubDir = Join-Path $Wb 'public'
$pubLines = if (Test-Path -LiteralPath $pubDir) {
  Get-ChildItem -LiteralPath $pubDir -Recurse -File | Sort-Object FullName | ForEach-Object {
    $_.FullName.Substring($Root.Length) + ':' + $_.Length + ':' + $_.LastWriteTimeUtc.Ticks
  }
}
$keyBody = (@($srcLines) + @($pubLines) | Where-Object { $_ } | ForEach-Object { "$_" }) -join "`n"
$bKey = Get-Sha1 ($keyBody + "`nremotion=$remVer`ncfg=$cfgHash")
$bundleDir = Join-Path $CacheRoot $bKey
$entryRel = "..\film\$Film\entry.tsx"

# ---------- helpers ----------
function Enter-Lock([string]$path) {
  $deadline = (Get-Date).AddMinutes(15)
  while ($true) {
    try {
      return [IO.File]::Open($path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    } catch [IO.IOException] {
      # The owner holds the file open; if it is older than 15 min the owner must have died.
      if (Test-Path $path) { $age = (Get-Date) - (Get-Item $path).LastWriteTime; if ($age.TotalMinutes -gt 15) { Remove-Item $path -Force -ErrorAction SilentlyContinue } }
      if ((Get-Date) -gt $deadline) { throw "Timed out waiting for lock $path" }
      Start-Sleep -Milliseconds 500
    }
  }
}

function Invoke-Pool([object[]]$jobs, [int]$throttle) {
  $queue = [System.Collections.Generic.Queue[object]]::new()
  foreach ($j in $jobs) { $queue.Enqueue($j) }
  $running = [System.Collections.Generic.List[object]]::new()
  $done = [System.Collections.Generic.List[object]]::new()
  while ($queue.Count -gt 0 -or $running.Count -gt 0) {
    while ($queue.Count -gt 0 -and $running.Count -lt $throttle) {
      $j = $queue.Dequeue()
      $j.Clock = [Diagnostics.Stopwatch]::StartNew()
      $j.Proc = Start-Process -FilePath $j.Exe -ArgumentList $j.Args -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput "$($j.Log).out" -RedirectStandardError "$($j.Log).err"
      $running.Add($j)
    }
    Start-Sleep -Milliseconds 150
    foreach ($j in @($running)) {
      if ($j.Proc.HasExited) {
        $j.Clock.Stop(); $j.Exit = $j.Proc.ExitCode; $j.Wall = [math]::Round($j.Clock.Elapsed.TotalSeconds, 2)
        [void]$running.Remove($j); $done.Add($j)
      }
    }
  }
  return $done
}

function Get-VideoInfo([string]$path) {
  $raw = & ffprobe -v error -select_streams v:0 -show_entries 'stream=codec_name,pix_fmt,color_range,width,height,nb_frames' -of json $path
  ($raw | ConvertFrom-Json).streams[0]
}

function Expand-Spec([string]$spec, [bool]$expand) {
  $items = @()
  foreach ($part in $spec.Split(',')) {
    $p = $part.Trim()
    if ($p -match '^(\d+)-(\d+)$') { $a = [int]$matches[1]; $b = [int]$matches[2] }
    elseif ($p -match '^\d+$') { $a = [int]$p; $b = $a }
    else { throw "Bad frame spec '$p'" }
    if ($expand) { for ($f = $a; $f -le $b; $f++) { $items += [pscustomobject]@{ A = $f; B = $f } } }
    else { $items += [pscustomobject]@{ A = $a; B = $b } }
  }
  $items
}

# ---------- 1. bundle once (cached by source hash, guarded by a lock) ----------
$bundleHit = $false
$bundleWall = 0
if (-not $NoCache -and (Test-Path (Join-Path $bundleDir '.complete'))) {
  $bundleHit = $true
} else {
  $lock = Enter-Lock "$bundleDir.lock"
  try {
    if (-not $NoCache -and (Test-Path (Join-Path $bundleDir '.complete'))) {
      $bundleHit = $true
    } else {
      $tmp = "$bundleDir.tmp-$PID-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
      $bsw = [Diagnostics.Stopwatch]::StartNew()
      $log = Join-Path $CacheRoot "$bKey.bundle"
      $p = Start-Process -FilePath $Node -ArgumentList @($Cli, 'bundle', $entryRel, '--out-dir', $tmp, '--log=error') `
        -WorkingDirectory $Wb -PassThru -WindowStyle Hidden -Wait -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
      $bsw.Stop(); $bundleWall = [math]::Round($bsw.Elapsed.TotalSeconds, 2)
      if ($p.ExitCode -ne 0) { throw "remotion bundle failed (exit $($p.ExitCode)); see $log.err" }
      Set-Content -LiteralPath (Join-Path $tmp '.complete') -Value $bKey
      if (Test-Path $bundleDir) { Rename-Item $bundleDir "$bundleDir.old-$([guid]::NewGuid().ToString('N').Substring(0, 8))" }
      Rename-Item $tmp $bundleDir
      Get-ChildItem -Path $CacheRoot -Directory -Filter "$bKey.old-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
  } finally {
    $lock.Dispose(); Remove-Item "$bundleDir.lock" -Force -ErrorAction SilentlyContinue
  }
}
Write-Host "bundle $bKey cacheHit=$bundleHit wall=${bundleWall}s"

# props file (Remotion reads --props from a file, which avoids quoting problems on Windows)
$propsFile = Join-Path $OutFull '_props.json'
[IO.File]::WriteAllText($propsFile, $propsJson, [Text.UTF8Encoding]::new($false))
$logDir = Join-Path $OutFull '_logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# ---------- 2. build jobs ----------
$renders = [System.Collections.Generic.List[object]]::new()
$jobs = [System.Collections.Generic.List[object]]::new()
$propsBase = "$bKey|$propsJson"

if ($Mode -eq 'final') {
  foreach ($r in $ratioList) {
    $comp = "$prefix$r"
    $out = Join-Path $OutFull "silent-$r.mp4"
    $rKey = Get-Sha1("$propsBase|$comp|final|$Output|angle|v2")
    $cacheFile = Join-Path $SilentRoot "$rKey.mp4"
    $entry = [pscustomobject]@{ ratio = $r; compId = $comp; props = $props; frames = 'all'; output = $out; cacheHit = $false; wall = 0; exit = 0; cacheKey = $rKey }
    if (-not $NoCache -and (Test-Path $cacheFile)) {
      Copy-Item -LiteralPath $cacheFile -Destination $out -Force
      $entry.cacheHit = $true
    } else {
      $entry | Add-Member -NotePropertyName cacheFile -NotePropertyValue $cacheFile
      $jobs.Add(@{
        Exe = $Node; Log = (Join-Path $logDir "final-$r"); Entry = $entry
        Args = @($Cli, 'render', $bundleDir, $comp, $out, "--props=$propsFile", '--concurrency', "$Concurrency",
          '--gl=angle', '--pixel-format=yuv420p', '--overwrite', '--log=error') +
          $(if ($Output -eq 'bt709') { @('--color-space=bt709') } else { @() })
      })
    }
    $renders.Add($entry)
  }
} elseif ($Mode -eq 'preview') {
  $spec = if ($Frames) { $Frames } else { '0-59' }
  foreach ($r in $ratioList) {
    foreach ($rg in (Expand-Spec $spec $false)) {
      $comp = "$prefix$r"; $tag = "$($rg.A)-$($rg.B)"
      $out = Join-Path $OutFull "preview-$r-$tag.mp4"
      $entry = [pscustomobject]@{ ratio = $r; compId = $comp; props = $props; frames = $tag; output = $out; cacheHit = $false; wall = 0; exit = 0 }
      $jobs.Add(@{
        Exe = $Node; Log = (Join-Path $logDir "preview-$r-$tag"); Entry = $entry
        Args = @($Cli, 'render', $bundleDir, $comp, $out, "--props=$propsFile", '--frames', $tag, '--scale', '0.5',
          '--concurrency', "$Concurrency", '--gl=angle', '--overwrite', '--log=error')
      })
      $renders.Add($entry)
    }
  }
} else {
  $spec = if ($Frames) { $Frames } else { '3,15,48,64,98' }
  foreach ($r in $ratioList) {
    foreach ($fr in (Expand-Spec $spec $true)) {
      $comp = "$prefix$r"
      $out = Join-Path $OutFull "still-$r-f$($fr.A).png"
      $entry = [pscustomobject]@{ ratio = $r; compId = $comp; props = $props; frames = "$($fr.A)"; output = $out; cacheHit = $false; wall = 0; exit = 0 }
      $jobs.Add(@{
        Exe = $Node; Log = (Join-Path $logDir "still-$r-f$($fr.A)"); Entry = $entry
        Args = @($Cli, 'still', $bundleDir, $comp, $out, "--frame=$($fr.A)", "--props=$propsFile", '--gl=angle', '--overwrite', '--log=error')
      })
      $renders.Add($entry)
    }
  }
}

# ---------- 3. run ----------
$throttle = if ($Mode -eq 'stills') { [math]::Min(8, [math]::Max(1, $Parallel * 2)) } else { $Parallel }
if ($jobs.Count) {
  $done = Invoke-Pool @($jobs) $throttle
  foreach ($j in $done) { $j.Entry.wall = $j.Wall; $j.Entry.exit = $j.Exit }
}

# ---------- 4. verify, cache and report ----------
$failures = @()
foreach ($e in $renders) {
  if ($e.cacheHit) { continue }
  if ($e.exit -ne 0 -or -not (Test-Path $e.output)) { $failures += "$($e.compId) $($e.frames): exit $($e.exit)"; continue }
  if ($Mode -eq 'final') {
    # No second encode: Remotion's output is the delivered file (a re-encode costs SSIM, see render_all.md).
    # Check only: bt709 mode must have produced limited range; native mode is recorded as-is.
    $info = Get-VideoInfo $e.output
    $e | Add-Member -NotePropertyName pixelInfo -NotePropertyValue "pix_fmt=$($info.pix_fmt) color_range=$($info.color_range)"
    if ($Output -eq 'bt709' -and $info.color_range -ne 'tv') { $failures += "$($e.compId): bt709 requested but color_range=$($info.color_range)" }
    $cacheTmp = "$($e.cacheFile).tmp"
    Copy-Item -LiteralPath $e.output -Destination $cacheTmp -Force
    Move-Item -LiteralPath $cacheTmp -Destination $e.cacheFile -Force
  }
}
if ($Mode -eq 'final') { $renders | ForEach-Object { if ($_.PSObject.Properties['cacheFile']) { $_.PSObject.Properties.Remove('cacheFile') } } }

$report = [ordered]@{
  film = $Film; mode = $Mode; bundleKey = $bKey; bundleCacheHit = $bundleHit; bundleWallSeconds = $bundleWall
  propsJson = $propsJson; concurrency = $Concurrency; parallel = $throttle; remotionVersion = $remVer
  renders = @($renders | ForEach-Object {
    $o = [ordered]@{ ratio = $_.ratio; compId = $_.compId; props = $_.props; frames = $_.frames; wallSeconds = $_.wall
      cacheHit = $_.cacheHit; output = $_.output; exitCode = $_.exit }
    if ($_.PSObject.Properties['pixelInfo']) { $o.pixelInfo = $_.pixelInfo }
    if ($_.PSObject.Properties['cacheKey']) { $o.cacheKey = $_.cacheKey }
    if (Test-Path $_.output) {
      $o.sizeBytes = (Get-Item $_.output).Length
      if ($_.output -like '*.mp4') { $vi = Get-VideoInfo $_.output; $o.pix_fmt = $vi.pix_fmt; $o.color_range = $vi.color_range; $o.width = $vi.width; $o.height = $vi.height; $o.nb_frames = $vi.nb_frames }
    }
    $o
  })
  failures = $failures
  totalWallSeconds = [math]::Round($total.Elapsed.TotalSeconds, 2)
}
$reportPath = Join-Path $OutFull 'render-report.json'
$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Host "total wall=$($report.totalWallSeconds)s report=$reportPath"
foreach ($e in $renders) { Write-Host ("  {0,-8} {1,-8} cache={2,-5} wall={3,7}s  {4}" -f $e.ratio, $e.frames, $e.cacheHit, $e.wall, $e.output) }
if ($failures.Count) { [Console]::Error.WriteLine("FAILED: " + ($failures -join '; ')); exit 1 }
