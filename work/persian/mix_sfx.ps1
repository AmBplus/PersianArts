# Mix a beat-placed SFX cue sheet into a film (ffmpeg only).
# Beat -> seconds: t = T0 + beat * 60 / BPM. Each cue: atrim -> volume(gain_db) -> fades -> adelay -> amix (normalize=0).
# Film audio (if any) is the bed, untouched except for a -3 dB dip (150 ms) under impact / stinger / ding cues.
# Video is stream-copied. Output audio: AAC 192k, 48 kHz, stereo, length = film length.
#
# Example:
#   pwsh -File work/persian/mix_sfx.ps1 -Film media/film-v2-local/beat124/social-9x16.mp4 `
#        -Cues media/film-v2-local/sfx/cues-9x16.json -BPM 124 -T0 0.24283 -Out media/film-v2-local/sfx/test-sfx-only-9x16.mp4
param(
  [Parameter(Mandatory = $true)][string]$Film,
  [Parameter(Mandatory = $true)][string]$Cues,
  [double]$BPM = 124,
  [double]$T0 = 0,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$ChunkSize = 12
)
$ErrorActionPreference = "Stop"
$inv = [System.Globalization.CultureInfo]::InvariantCulture
function F([double]$x) { return $x.ToString("0.###", $inv) }

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$filmPath = (Resolve-Path $Film).Path
$cuesPath = (Resolve-Path $Cues).Path
$outPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Out))
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outPath) | Out-Null

$filmDur = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 $filmPath)
$hasAudio = [bool](& ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 $filmPath)
$cueJson = [System.IO.File]::ReadAllText($cuesPath, [System.Text.Encoding]::UTF8)
$cueList = @(ConvertFrom-Json -InputObject $cueJson)

$inputs = [System.Collections.Generic.List[string]]::new()
$inputs.Add("-i"); $inputs.Add($filmPath)
$fc = [System.Collections.Generic.List[string]]::new()
$duckWin = [System.Collections.Generic.List[string]]::new()
$cueLabels = [System.Collections.Generic.List[string]]::new()

for ($k = 0; $k -lt $cueList.Count; $k++) {
  $c = $cueList[$k]
  $src = Join-Path $repo ([string]$c.file)
  if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { throw "cue file missing: $($c.file)" }
  $idx = $k + 1
  $inputs.Add("-i"); $inputs.Add($src)
  $t = $T0 + [double]$c.beat * 60.0 / $BPM
  $ms = [int][math]::Round($t * 1000.0)
  $d = [double]$c.duration_s; $tr = [double]$c.trim_start_s; $fd = [double]$c.fade_ms / 1000.0
  $chain = "[" + $idx + ":a]atrim=start=" + (F $tr) + ":duration=" + (F $d) +
    ",asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo" +
    ",volume=" + (F ([double]$c.gain_db)) + "dB,afade=t=in:st=0:d=0.003"
  if ($fd -gt 0) { $chain += ",afade=t=out:st=" + (F ([math]::Max(0.0, $d - $fd))) + ":d=" + (F $fd) }
  $chain += ",adelay=" + $ms + "|" + $ms + "[c" + $idx + "]"
  $fc.Add($chain)
  $cueLabels.Add("[c" + $idx + "]")
  if ($src -match '[\\/](impact|stinger|ding)[\\/]') {
    $duckWin.Add("between(t\," + (F $t) + "\," + (F ($t + 0.15)) + ")")
  }
}

# Bed: film audio (or silence of film length), with -3 dB dips under impacts.
if ($hasAudio) {
  $bed = "[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atrim=duration=" + (F $filmDur)
  if ($duckWin.Count -gt 0) { $bed += ",volume=enable='" + ($duckWin -join "+") + "':volume=0.708" }
  $bed += "[bed]"
} else {
  $bed = "anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration=" + (F $filmDur) + "[bed]"
}
$fc.Insert(0, $bed)

# Sum cues in chunks (amix has a practical input limit), then sum chunks with the bed.
$chunkOut = [System.Collections.Generic.List[string]]::new()
for ($g = 0; $g -lt $cueLabels.Count; $g += $ChunkSize) {
  $end = [math]::Min($cueLabels.Count - 1, $g + $ChunkSize - 1)
  $labs = ($cueLabels.ToArray()[$g..$end]) -join ""
  $n = $end - $g + 1
  $fc.Add($labs + "amix=inputs=" + $n + ":normalize=0:duration=longest:dropout_transition=0[m" + $chunkOut.Count + "]")
  $chunkOut.Add("[m" + ($chunkOut.Count) + "]")
}
$finalIn = "[bed]" + ($chunkOut -join "")
$fc.Add($finalIn + "amix=inputs=" + ($chunkOut.Count + 1) + ":normalize=0:duration=first:dropout_transition=0[aout]")

$fcFile = Join-Path $env:TEMP ("mix_sfx_" + [guid]::NewGuid().ToString() + ".txt")
[System.IO.File]::WriteAllText($fcFile, ($fc -join ";`n"), [System.Text.UTF8Encoding]::new($false))

$args2 = @("-hide_banner", "-loglevel", "error", "-y") + $inputs.ToArray() +
  @("-filter_complex_script", $fcFile, "-map", "0:v:0", "-map", "[aout]", "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", $outPath)
if ($env:MIX_SFX_DEBUG) { $args2 | Select-Object -First 12 | ForEach-Object { "[" + $_ + "]" } }
& ffmpeg @args2
$rc = $LASTEXITCODE
Remove-Item -LiteralPath $fcFile -ErrorAction SilentlyContinue
if ($rc -ne 0) { throw "ffmpeg failed with exit code $rc" }
Write-Output ("mixed {0} cues, film {1} s, BPM {2}, T0 {3} s, ducks {4} -> {5}" -f $cueList.Count, (F $filmDur), $BPM, $T0, $duckWin.Count, $outPath)
