<#
.SYNOPSIS
Verify the tracked sound kit, or (with -Full) rebuild the untracked full library on a fresh clone.

.DESCRIPTION
Default (-KitOnly, implied): checks sound/library/kit (catalog.json, manifest.json, every file present, size limits).
Nothing is downloaded.

-Full: prints (and with -Run executes) the rebuild steps. Without -Run it is a plan only.
 1. Freesound clips:   python -I work/persian/freesound_fetch.py / freesound_fill.py / freesound_payoff_fill.py
                       needs work/persian/.freesound.env (gitignored) with FREESOUND_API_KEY=<your key>. No key is stored in the repo.
 2. Jamendo tracks:    python -I work/persian/jamendo_fetch.py --out media/music-staging/jamendo
                       needs work/persian/.jamendo.env (gitignored) with JAMENDO_CLIENT_ID=<your id>.
 3. Kenney packs:      zips are named media/sfx/_downloads/kenney_<pack>.zip; pack pages are in
                       sound/library/sfx/kenney/manifest.json (field source_page, licence CC0). Download the zips manually, then -Run extracts them.
 4. Internet Archive:  python -I media/music-staging/archive-org/_script/fetch_archive_org.py (see media/music-staging/archive-org/manifest.json).
 5. Owner pack / owner music: personal files, not downloadable; the kit holds the curated clips and 5 music excerpts.
 The full library layout and catalog (sound/library/sfx/CATALOG.json) are rebuilt by the scripts and manifests above.
#>
param([switch]$KitOnly, [switch]$Full, [switch]$Run)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
Set-Location $repo
$kit = 'sound/library/kit'
function Test-Kit {
  $cat = Get-Content -LiteralPath "$kit/catalog.json" -Raw -Encoding utf8 | ConvertFrom-Json
  $missing = 0; $big = 0; $bytes = 0
  foreach ($e in $cat.entries) {
    if (-not (Test-Path -LiteralPath $e.path)) { Write-Host "MISSING $($e.id) $($e.path)"; $missing++; continue }
    $len = (Get-Item -LiteralPath $e.path).Length; $bytes += $len
    if ($len -gt 2MB) { Write-Host "OVER 2 MB $($e.path)"; $big++ }
  }
  $music = @(Get-ChildItem "$kit/music" -Filter *.ogg)
  foreach ($m in $music) { $bytes += $m.Length; if (-not (Test-Path ($m.FullName -replace '\.ogg$', '.music.json'))) { Write-Host "NO SIDECAR $($m.Name)"; $missing++ } }
  Write-Host ("Kit: {0} sfx entries, {1} music tracks, {2:N1} MB, missing={3}, over2MB={4}" -f $cat.entries.Count, $music.Count, ($bytes / 1MB), $missing, $big)
  return ($missing -eq 0 -and $big -eq 0)
}
$ok = Test-Kit
if (-not $Full) { if ($ok) { exit 0 } else { exit 1 } }

Write-Host '--- full rebuild plan ---'
$steps = @(
  'python -I work/persian/freesound_fetch.py --per-category 25   (needs work/persian/.freesound.env)',
  'python -I work/persian/freesound_fill.py --per-category 20',
  'python -I work/persian/freesound_payoff_fill.py --minutes 18',
  'python -I work/persian/jamendo_fetch.py --limit 100 --out media/music-staging/jamendo   (needs work/persian/.jamendo.env)',
  'python -I media/music-staging/archive-org/_script/fetch_archive_org.py',
  'Kenney: download zips (pages in sound/library/sfx/kenney/manifest.json) to media/sfx/_downloads/kenney_<pack>.zip'
)
$steps | ForEach-Object { Write-Host "  $_" }
if (-not $Run) { Write-Host 'Plan only. Add -Run to execute (heavy downloads; credentials required).'; exit 0 }
foreach ($f in 'work/persian/.freesound.env', 'work/persian/.jamendo.env') {
  if (-not (Test-Path -LiteralPath $f)) { Write-Host "SKIP step needing $f (file missing; create it with your own key)" }
}
if (Test-Path 'work/persian/.freesound.env') {
  python -I work/persian/freesound_fetch.py; python -I work/persian/freesound_fill.py; python -I work/persian/freesound_payoff_fill.py
}
if (Test-Path 'work/persian/.jamendo.env') { python -I work/persian/jamendo_fetch.py --out media/music-staging/jamendo }
if (Test-Path 'media/music-staging/archive-org/_script/fetch_archive_org.py') { python -I media/music-staging/archive-org/_script/fetch_archive_org.py }
$man = Get-Content 'sound/library/sfx/kenney/manifest.json' -Raw -Encoding utf8 | ConvertFrom-Json
foreach ($pack in ($man.files.PSObject.Properties.Value.pack | Sort-Object -Unique)) {
  $zip = "media/sfx/_downloads/kenney_$pack.zip"
  if (Test-Path $zip) { Expand-Archive -LiteralPath $zip -DestinationPath "media/sfx/kenney/$pack" -Force; Write-Host "extracted $pack" }
  else { Write-Host "Kenney pack ${pack}: put the zip at $zip (page: https://kenney.nl/assets/$pack)" }
}
Write-Host 'Done. Kenney files then need re-sorting by category per sound/library/sfx/kenney/manifest.json (original_path -> key).'
