#Requires -Version 7.0
<#
PersianArts portability helper.
  pwsh -File work/persian/tools/pa.ps1 setup [-Quick]
  pwsh -File work/persian/tools/pa.ps1 setup-private     (needs env PA_PRIVATE_DIR)
  pwsh -File work/persian/tools/pa.ps1 check
#>
param(
  [Parameter(Position = 0)][ValidateSet('setup', 'setup-private', 'check', 'status', 'render', 'sound', 'assets', 'time', 'deliver')][string]$Command = 'check',
  [Parameter(Position = 1)][string]$Sub,      # status: set | add-item | blocker | show
  [Parameter(Position = 2)][string]$Id,       # status: item id (set/add-item) or add|clear (blocker)
  [Parameter(Position = 3)][string]$Arg3,     # status blocker add: text
  [string]$State,                             # queued|running|blocked|done|stalled (validated in Invoke-StatusInner)
  [int]$Percent = -1,                         # LEGACY: the board ignores it; use -StepsDone/-StepsTotal
  [int]$StepsDone = -1,
  [int]$StepsTotal = -1,
  [string]$Label,
  [string]$Note,
  [string]$Title,
  [string]$Goal,
  [int]$ExpectedMinutes = -1,
  [string]$Owner = 'lead',
  [string]$UpdatedAt,                         # test hook: force an old updatedAt to see stalled detection
  [string]$Lane = 'html',                     # render: html (htmlfilm capture.mjs)
  [string]$Film,                              # render: path to film.html
  [string]$OutDir,                            # render: output folder (silent-9x16.mp4 + _stills)
  [string]$Events,                            # sound: events.json (schema contracts/schemas/events.schema.json)
  [string]$Track,                             # sound: kit music id, e.g. tr-lnplus-597024
  [string]$Stills,                            # render: optional comma list of seconds for stills only
  [Parameter(ValueFromRemainingArguments = $true)][string[]]$More,
  [double]$BudgetMinutes = 20,               # time start: film budget (target 10, cap 20)
  [string]$Phase,                             # time mark: phase (alt to Arg3)
  [string]$Actor = 'studio',
  [switch]$Quick
)
$ErrorActionPreference = 'Stop'

$Persian = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Root = (Resolve-Path (Join-Path $Persian '..\..')).Path
$Wb = Join-Path $Persian 'src\workbench'
$Pub = Join-Path $Wb 'public'
$FontsSrc = Join-Path $Persian 'assets\fonts'
$FontsDst = Join-Path $Pub 'fonts'
$UniLocal = Join-Path $Pub 'uni-local'
$UniFiles = @('emblem-layers.svg', 'layers.json', 'qr.json', 'arch-gateway-flat.png')
$BriefsLocal = Join-Path $Root 'media\briefs-local\university-admissions'
$TermsDst = Join-Path $Root 'contracts\confidential-terms.local.txt'

function Get-ReferencedFonts {
  $names = [Collections.Generic.HashSet[string]]::new()
  $src = Join-Path $Persian 'src'
  if (Test-Path $src) {
    Get-ChildItem $src -Recurse -File -Include *.ts, *.tsx, *.mjs, *.css -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch '[\\/]node_modules[\\/]' } |
      Select-String -Pattern 'fonts/([A-Za-z0-9_.-]+\.(?:ttf|otf|woff2?))' -AllMatches |
      ForEach-Object { foreach ($m in $_.Matches) { [void]$names.Add($m.Groups[1].Value) } }
  }
  return @($names | Sort-Object)
}

function Add-Link($Dst, $Src, $Label) {
  if (-not (Test-Path $Src)) { Write-Host "skip   $Label (source missing)"; return }
  if (Test-Path $Dst) { Write-Host "ok     $Label (exists)"; return }
  try { New-Item -ItemType Junction -Path $Dst -Target $Src | Out-Null; Write-Host "linked $Label" }
  catch { Copy-Item $Src $Dst -Recurse; Write-Host "copied $Label" }
}

function Invoke-Setup {
  if (-not (Test-Path (Join-Path $Wb 'node_modules'))) {
    if ($Quick) { Write-Warning 'node_modules missing; -Quick does not install. Run setup without -Quick.' }
    else { Push-Location $Wb; try { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed' } } finally { Pop-Location } }
  } else { Write-Host 'ok     node_modules present (npm ci skipped)' }

  New-Item -ItemType Directory -Force -Path $Pub | Out-Null
  if (Test-Path $FontsSrc) {
    New-Item -ItemType Directory -Force -Path $FontsDst | Out-Null
    $n = 0
    foreach ($f in Get-ChildItem $FontsSrc -File) { Copy-Item $f.FullName (Join-Path $FontsDst $f.Name) -Force; $n++ }
    Write-Host "copied $n font file(s) to public/fonts"
  } else { Write-Warning "font source missing: $FontsSrc (continuing)" }

  Add-Link (Join-Path $Pub 'sfxlib') (Join-Path $Persian 'assets\audio\sfx') 'sfxlib'
  Add-Link (Join-Path $Pub 'bgmlib') (Join-Path $Persian 'assets\audio\bgm') 'bgmlib'
  Add-Link (Join-Path $Pub 'cardpreviews') (Join-Path $Persian 'gallery\media') 'cardpreviews'
}

function Invoke-SetupPrivate {
  $dir = $env:PA_PRIVATE_DIR
  if (-not $dir) { Write-Host 'PA_PRIVATE_DIR is not set. Point it at the private assets folder (uni-admissions) and retry.'; exit 2 }
  if (-not (Test-Path $dir)) { Write-Host 'PA_PRIVATE_DIR does not exist.'; exit 2 }
  $script:missing = 0
  function Find-One($name) { Get-ChildItem $dir -Recurse -File -Filter $name -ErrorAction SilentlyContinue | Select-Object -First 1 }
  function Copy-One($name, $destDir) {
    $f = Find-One $name
    if ($f) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null; Copy-Item $f.FullName (Join-Path $destDir $name) -Force; Write-Host ("PASS     {0}" -f $name) }
    else { Write-Host ("MISSING  {0}" -f $name); $script:missing++ }
  }
  Copy-One 'copy-map.json' $BriefsLocal
  foreach ($n in $UniFiles) { Copy-One $n $UniLocal }
  Copy-One 'confidential-terms.local.txt' (Join-Path $Root 'contracts')
  if ($script:missing) { exit 1 }
}

function Invoke-Check {
  $rows = [Collections.Generic.List[object]]::new()
  function Row($item, $ok) { $rows.Add([pscustomobject]@{ Item = $item; Status = $(if ($ok) { 'PASS' } else { 'MISSING' }) }) }
  Row 'node_modules (workbench)' (Test-Path (Join-Path $Wb 'node_modules'))
  foreach ($f in Get-ReferencedFonts) { Row "font: $f" (Test-Path (Join-Path $FontsDst $f)) }
  foreach ($n in $UniFiles) { Row "uni-local: $n" (Test-Path (Join-Path $UniLocal $n)) }
  Row 'briefs-local: copy-map.json' (Test-Path (Join-Path $BriefsLocal 'copy-map.json'))
  Row 'contracts: confidential-terms.local.txt' (Test-Path $TermsDst)
  Row 'ffmpeg on PATH' ([bool](Get-Command ffmpeg -ErrorAction SilentlyContinue))
  Row 'pwsh on PATH' ([bool](Get-Command pwsh -ErrorAction SilentlyContinue))
  $rows | Format-Table -AutoSize | Out-String | Write-Host
  $bad = @($rows | Where-Object Status -eq 'MISSING').Count
  Write-Host "missing: $bad"
  if ($bad) { exit 1 }
}

function Read-Board {
  $p = Join-Path $Persian 'status\board.json'
  if (-not (Test-Path $p)) { throw "board.json missing: $p" }
  Get-Content -Raw -Encoding utf8 $p | ConvertFrom-Json -Depth 20 -DateKind String
}
function Save-Board($b) {
  foreach ($g in $b.goals) {
    $its = @($g.items)
    $ws = @($its | Where-Object { $_.steps -and $_.steps.total -gt 0 })
    $g.percent = if ($ws.Count) { [int][math]::Round((($ws | ForEach-Object { 100.0 * [math]::Min($_.steps.done, $_.steps.total) / $_.steps.total } | Measure-Object -Average).Average), 0, 'AwayFromZero') }
      elseif ($its.Count) { [int][math]::Round(100.0 * @($its | Where-Object state -eq 'done').Count / $its.Count, 0, 'AwayFromZero') } else { 0 }
  }
  $p = Join-Path $Persian 'status\board.json'
  $tmp = "$p.tmp-$PID"
  [IO.File]::WriteAllText($tmp, ($b | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $tmp -Destination $p -Force
}
function Invoke-StatusInner {
  $now = [DateTime]::UtcNow.ToString('o')
  $stamp = if ($UpdatedAt) { $UpdatedAt } else { $now }
  $validStates = 'queued', 'running', 'blocked', 'done', 'stalled'
  if ($Sub -eq 'set' -and -not $State -and $Arg3) { $script:State = $Arg3 }   # positional: status set <id> <state>
  if ($State) {
    $lc = $State.ToLower()
    if ($lc -notin $validStates) { Write-Host "FAIL invalid state '$State'. valid: $($validStates -join ', ')"; exit 1 }
    $script:State = $lc
  }
  switch ($Sub) {
    'set' {
      if (-not $Id) { throw 'usage: status set <itemId> [-State s] [-Percent n] [-Note t]' }
      $b = Read-Board
      $it = $b.goals.items | Where-Object { $_.id -eq $Id } | Select-Object -First 1
      if (-not $it) { throw "unknown item '$Id' (use status show)" }
      if ($State) {
        if ($State -eq 'running' -and $it.state -ne 'running') { $it | Add-Member -NotePropertyName startedAt -NotePropertyValue $now -Force; $it | Add-Member -NotePropertyName finishedAt -NotePropertyValue $null -Force; $it | Add-Member -NotePropertyName actualMinutes -NotePropertyValue $null -Force }
        if ($State -in 'done', 'blocked' -and $it.state -notin 'done', 'blocked') {
          $it | Add-Member -NotePropertyName finishedAt -NotePropertyValue $now -Force
          if ($it.startedAt) { $it | Add-Member -NotePropertyName actualMinutes -NotePropertyValue ([math]::Round(([DateTime]::Parse($now).ToUniversalTime() - [DateTime]::Parse($it.startedAt).ToUniversalTime()).TotalMinutes, 1)) -Force }
        }
        $it.state = $State
        if ($State -eq 'done' -and $Percent -lt 0) { $it.percent = 100 }
      }
      if ($Percent -ge 0) { $it.percent = [math]::Min(100, $Percent) }  # legacy, not shown on the board
      if ($StepsDone -ge 0 -or $StepsTotal -ge 0) {
        $old = $it.steps; $tot = if ($StepsTotal -ge 0) { $StepsTotal } elseif ($old) { [int]$old.total } else { 0 }; $dn = if ($StepsDone -ge 0) { $StepsDone } elseif ($old) { [int]$old.done } else { 0 }
        $it | Add-Member -NotePropertyName steps -NotePropertyValue ([pscustomobject]@{ done = $dn; total = $tot }) -Force
        $it.percent = if ($tot -gt 0) { [int][math]::Round(100.0 * [math]::Min($dn, $tot) / $tot) } else { 0 }
      }
      if ($PSBoundParameters.ContainsKey('Note')) { $it.note = $Note }
      if ($ExpectedMinutes -ge 0) { $it.expectedMinutes = $ExpectedMinutes }
      $it.updatedAt = $stamp
      Save-Board $b
      $chk = (Read-Board).goals.items | Where-Object { $_.id -eq $Id } | Select-Object -First 1
      $cs = if ($chk.steps) { "$($chk.steps.done)/$($chk.steps.total)" } else { '0/0' }
      if (-not $chk -or ($State -and $chk.state -ne $State)) { Write-Host "FAIL status set $Id : requested state=$State persisted state=$($chk.state)"; exit 1 }
      if ($StepsDone -ge 0 -and [int]$chk.steps.done -ne $StepsDone) { Write-Host "FAIL status set $Id : steps not persisted"; exit 1 }
      Write-Host "ok id=$Id state=$($chk.state) steps=$cs"
    }
    'add-item' {
      if (-not $Id -or -not $Goal) { throw 'usage: status add-item <itemId> -Goal <goalId> [-Title t] [-State s] [-Percent n] [-ExpectedMinutes m] [-Note t]' }
      $b = Read-Board
      $g = $b.goals | Where-Object { $_.id -eq $Goal } | Select-Object -First 1
      if (-not $g) { $b.goals = @($b.goals) + [pscustomobject]@{ id = $Goal; title = $(if ($Title) { $Title } else { $Goal }); percent = 0; items = @() }; $g = $b.goals | Where-Object { $_.id -eq $Goal } }
      $st = if ($State) { $State } else { 'queued' }
      $new = [pscustomobject]@{ id = $Id; title = $(if ($Title) { $Title } else { $Id }); state = $st; percent = $(if ($Percent -ge 0) { $Percent } else { 0 })
        startedAt = $(if ($st -eq 'running') { $now } else { $null }); finishedAt = $null; actualMinutes = $null; expectedMinutes = $(if ($ExpectedMinutes -ge 0) { $ExpectedMinutes } else { 20 }); updatedAt = $stamp; note = [string]$Note }
      $g.items = @($g.items) + $new
      Save-Board $b
      Write-Host "added $Id to goal $Goal"
    }
    'output' {
      if (-not $Id -or -not $Arg3) { throw 'usage: status output <itemId> <path relative to repo root> [-Label t]' }
      $b = Read-Board
      $it = $b.goals.items | Where-Object { $_.id -eq $Id } | Select-Object -First 1
      if (-not $it) { throw "unknown item '$Id'" }
      $p = $Arg3.Replace([string][char]92, '/')
      $x = [IO.Path]::GetExtension($p).TrimStart('.').ToLower()
      $kind = switch ($x) { { $_ -in 'png', 'jpg', 'jpeg', 'svg' } { 'image' } { $_ -in 'mp4', 'webm' } { 'video' } { $_ -in 'wav', 'mp3' } { 'audio' } default { 'report' } }
      $lab = if ($Label) { $Label } else { [IO.Path]::GetFileName($p) }
      $outs = @($it.outputs | Where-Object { $_ -and $_.path -ne $p }) + [pscustomobject]@{ label = $lab; path = $p; kind = $kind }
      $it | Add-Member -NotePropertyName outputs -NotePropertyValue $outs -Force
      $it.updatedAt = $stamp
      Save-Board $b
      Write-Host "output added to $Id ($kind): $p"
    }
    'blocker' {
      $b = Read-Board
      if ($Id -eq 'add') {
        if (-not $Arg3) { throw 'usage: status blocker add "<text>" [-Owner o]' }
        $b.blockers = @($b.blockers) + [pscustomobject]@{ text = $Arg3; owner = $Owner }
      } elseif ($Id -eq 'clear') {
        $b.blockers = if ($Arg3) { @($b.blockers | Where-Object { $_.text -notlike "*$Arg3*" }) } else { @() }
      } else { throw 'usage: status blocker add "<text>" | status blocker clear ["<text part>"]' }
      Save-Board $b
      Write-Host "blockers: $(@($b.blockers).Count)"
    }
    'remove' {
      if (-not $Id) { throw 'usage: status remove <itemId>  (removes the LAST row with that id if duplicated, unless -Note keep-first)' }
      $b = Read-Board; $hit = 0
      foreach ($g in $b.goals) {
        $its = @($g.items); $idx = @(for ($i = 0; $i -lt $its.Count; $i++) { if ($its[$i].id -eq $Id) { $i } })
        if ($idx.Count -eq 0) { continue }
        $drop = if ($Note -eq 'keep-first') { $idx[1..($idx.Count - 1)] } elseif ($idx.Count -gt 1) { @($idx[-1]) } else { @($idx[0]) }
        if ($idx.Count -gt 1 -and $Note -ne 'keep-first') { $drop = @($idx[-1]) }
        if ($Note -eq 'keep-first' -and $idx.Count -eq 1) { $drop = @() }
        $g.items = @(for ($i = 0; $i -lt $its.Count; $i++) { if ($drop -notcontains $i) { $its[$i] } }); $hit += @($drop).Count
      }
      if (-not $hit) { throw "unknown item '$Id'" }
      Save-Board $b
      Write-Host "removed $hit row(s) of $Id"
    }
    'rename' {
      if (-not $Id -or -not $Arg3) { throw 'usage: status rename <oldId> <newId>' }
      $b = Read-Board
      $it = $b.goals.items | Where-Object { $_.id -eq $Id } | Select-Object -First 1
      if (-not $it) { throw "unknown item '$Id'" }
      if ($b.goals.items | Where-Object { $_.id -eq $Arg3 }) { throw "item '$Arg3' already exists" }
      $it.id = $Arg3; $it.updatedAt = $stamp
      Save-Board $b
      Write-Host "renamed $Id -> $Arg3"
    }
    'show' {
      $b = Read-Board
      $rows = foreach ($g in $b.goals) { foreach ($i in $g.items) {
        $age = if ($i.updatedAt) { [int](([DateTime]::UtcNow - [DateTime]::Parse($i.updatedAt).ToUniversalTime()).TotalMinutes) } else { -1 }
        $st = if ($i.state -eq 'running' -and $age -gt 10) { 'stalled' } else { $i.state }
        [pscustomobject]@{ Goal = $g.id; Item = $i.id; State = $st; Pct = $i.percent; AgeMin = $age; Note = $i.note } } }
      $rows | Format-Table -AutoSize | Out-String | Write-Host
      foreach ($g in $b.goals) { Write-Host ("goal {0}: {1}%" -f $g.id, $g.percent) }
      foreach ($x in @($b.blockers)) { Write-Host "blocker: $($x.text)" }
      if ($b.render.running) { Write-Host "render: $($b.render.film) $($b.render.ratio) $($b.render.frame)/$($b.render.total) eta=$($b.render.etaSeconds)s" }
    }
    default { throw 'usage: pa.ps1 status set|add-item|output|remove|rename|blocker|show ...' }
  }
}

function Invoke-Status {
  $mutating = $Sub -in 'set', 'add-item', 'output', 'blocker', 'remove', 'rename'
  if (-not $mutating) { Invoke-StatusInner; return }
  $mx = [Threading.Mutex]::new($false, 'Global\PersianArtsBoardLock')
  $got = $false
  try {
    try { $got = $mx.WaitOne(60000) } catch [Threading.AbandonedMutexException] { $got = $true }
    if (-not $got) { Write-Host 'FAIL: could not get board lock within 60s'; exit 1 }
    Invoke-StatusInner
  } finally { if ($got) { $mx.ReleaseMutex() }; $mx.Dispose() }
}

function Invoke-Render {
  # pa render -Lane html -Film <film.html> -OutDir <dir> [-Stills 0.1,0.5,...]
  if ($Lane -ne 'html') { Write-Host "FAIL render: only -Lane html is wired (remotion: work/persian/render_all.ps1)"; exit 1 }
  if (-not $Film -or -not $OutDir) { Write-Host 'usage: pa render -Lane html -Film <film.html> -OutDir <dir> [-Stills t1,t2]'; exit 1 }
  $cap = Join-Path $Persian 'htmlfilm\capture.mjs'
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  $a = @($cap, '--html', (Resolve-Path $Film).Path, '--out', (Join-Path $OutDir 'silent-9x16.mp4'), '--stills-dir', (Join-Path $OutDir '_stills'))
  if ($Stills) { $a += @('--still', $Stills) }
  & node @a
  exit $LASTEXITCODE
}

function Invoke-Sound {
  # pa sound -Film silent.mp4 -Events events.json -Track tr-lnplus-597024 -OutDir dir [-Sub "--bpm 110 --t0 0.027"]
  Write-Host 'REMINDER: sound runs ONLY on the owner''s word (PLAYBOOK-SOUND owner gate). Personal use; nothing is public.' -ForegroundColor Yellow
  if (-not ($Film -and $Events -and $Track -and $OutDir)) { throw 'usage: pa sound -Film <silent.mp4> -Events <events.json> -Track <kit music id> -OutDir <dir> [-Sub "<extra build_sound args>"]' }
  $py = Join-Path $Root 'sound\.venv\Scripts\python.exe'
  $args2 = @('-I', (Join-Path $Root 'sound\tools\mixer\build_sound.py'), '--film', $Film, '--events', $Events, '--track', $Track, '--out-dir', $OutDir)
  if ($Sub) { $args2 += ($Sub -split '\s+') }
  & $py @args2
  if ($LASTEXITCODE -ne 0) { throw "build_sound failed ($LASTEXITCODE)" }
  Write-Host "done: $OutDir (cues-resolved.json, verify.json, social-<ratio>-final.mp4). Listen before any claim."
}

function Invoke-Assets {
  # pa assets optimize|tv-check|report <paths...> [--dry-run --rewrite-refs --audio --svg --fonts ...]
  $py = @((Join-Path $PSScriptRoot 'assets\.venv\Scripts\python.exe')) | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $py) { $py = 'python' }  # system python needs: pillow numpy fonttools brotli (optional resvg-py)
  $paths = @($Id, $Arg3) + @($More) | Where-Object { $_ }
  $t = Join-Path $PSScriptRoot 'assets'
  switch ($Sub) {
    'optimize' { & $py -P (Join-Path $t 'optimize_assets.py') @paths }
    'tv-check' { & $py -P (Join-Path $t 'tv_check.py') @paths }
    'report'   { & $py -P (Join-Path $t 'optimize_assets.py') @paths --dry-run --report (Join-Path $Root 'mediailm-versions\_benchssets-report.json') }
    default    { Write-Host 'usage: pa assets <optimize|tv-check|report> <paths...>'; exit 1 }
  }
  exit $LASTEXITCODE
}

function Invoke-Time {
  $a = @((Join-Path $PSScriptRoot 'timing/time.mjs'), $Sub, $Id)
  if ($Sub -eq 'start') { $a += @('--budget', $BudgetMinutes) }
  if ($Sub -eq 'mark') { $a += $(if ($Phase) { $Phase } else { $Arg3 }); $a += @('--actor', $Actor) }
  if ($Note) { $a += @('--note', $Note) }
  node @a; exit $LASTEXITCODE
}

switch ($Command) {
  'time' { Invoke-Time }
  'assets' { Invoke-Assets }
  'sound' { Invoke-Sound }
  'render' { Invoke-Render }
  'status' { Invoke-Status }
  'setup' { Invoke-Setup }
  'setup-private' { Invoke-SetupPrivate }
  'check' { Invoke-Check }
  'deliver' {
    # pa deliver <film> <version> [--dry-run] | --rebuild | --list  (see output/README.md)
    $dA = @(@($Sub, $Id, $Arg3) + @($More) | Where-Object { $_ })
    & node (Join-Path $PSScriptRoot 'deliver/deliver.mjs') @dA
    exit $LASTEXITCODE
  }
}
