# Mix a silent social film with its music bed (beat-aligned, dynamic two-pass loudnorm).
#
# Usage:
#   pwsh -File work/persian/mix_film.ps1 -Film <silent.mp4> -Track <track.mp3> -T0 <seconds> -Out <out.mp4>
#
#   -Film   silent film rendered with --props='{"BPM":124,"T0_S":<T0>}' (film time of the first downbeat = T0)
#   -Track  music file; its sidecar is sound/library/bgm/<basename>.music.json (field "t0" = track time of first downbeat)
#   -T0     the T0_S the film was rendered with
#   -Out    output mp4 (video stream copied, AAC 192k audio)
#
# Alignment: track time (t0_track) is moved so that its first downbeat sits at film time T0.
#   offset = t0_track - T0 ; offset > 0 trims the track start, offset < 0 delays the track.
# Audio: 0.4 s fade-in before loudnorm; loudnorm I=-13.8 target, TP=-2.5, LRA=11, dynamic two passes; then apad/atrim to film length and a 1.6 s qsin fade-out as the LAST audio filter (ends in true silence).

param(
    [Parameter(Mandatory = $true)][string]$Film,
    [Parameter(Mandatory = $true)][string]$Track,
    [Parameter(Mandatory = $true)][double]$T0,
    [Parameter(Mandatory = $true)][string]$Out
)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Inv = [System.Globalization.CultureInfo]::InvariantCulture

$Film = (Resolve-Path $Film).Path
$Track = (Resolve-Path $Track).Path
$Out = [IO.Path]::GetFullPath([IO.Path]::Combine((Get-Location).Path, $Out))

# Track sidecar: first downbeat time in track time.
$sidecar = Join-Path $Root ("sound/library/bgm/" + [IO.Path]::GetFileNameWithoutExtension($Track) + ".music.json")
$t0Track = [double](Get-Content $sidecar -Raw | ConvertFrom-Json).t0
$offset = $t0Track - $T0

# Film duration (seconds).
$durStr = (& ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=nk=1:nw=1 $Film) | Select-Object -First 1
$dur = [double]::Parse($durStr, $Inv)

# Input-side offset (trim) or delay (adelay, ms).
$pre = @()
$lead = ""
if ($offset -ge 0) {
    $pre = @("-ss", $offset.ToString("0.00000", $Inv))
} else {
    $ms = [int][math]::Round(-$offset * 1000)
    $lead = "adelay=${ms}|${ms},"
}
$durS = $dur.ToString('0.000', $Inv)
# Fade-in before loudnorm; fade-out is applied AFTER loudnorm as the last audio filter (1.6 s qsin to true silence at the film end).
$chain = "$lead" + "afade=t=in:st=0:d=0.4"
$tail = "apad,atrim=end=$durS,asetpts=N/SR/TB,afade=t=out:st=$(($dur - 1.6).ToString('0.000', $Inv)):d=1.6:curve=qsin"

# Pass 1: measure.
$p1 = & ffmpeg -hide_banner -nostats @pre -i $Track -t $dur.ToString('0.000', $Inv) -af "$chain,loudnorm=I=-14:TP=-1:LRA=11:print_format=json" -f null - 2>&1 | Out-String
$json = [regex]::Match($p1, '\{[^{}]*"input_i"[^{}]*\}').Value | ConvertFrom-Json
if (-not $json) { throw "loudnorm pass 1 did not return stats" }

# Pass 2: apply with measured values (dynamic mode).
$tmpWav = Join-Path ([IO.Path]::GetTempPath()) ("mix_film_" + [guid]::NewGuid().ToString("N") + ".wav")
# Dynamic two-pass loudnorm, TP -2.5 dBTP: AAC encoding overshoots the decoded true peak by about 1.3 dB.
$ln = "loudnorm=I=-13.8:TP=-2.5:LRA=11:measured_I=$($json.input_i):measured_TP=$($json.input_tp):measured_LRA=$($json.input_lra):measured_thresh=$($json.input_thresh):offset=$($json.target_offset):linear=false"
& ffmpeg -hide_banner -loglevel error -y @pre -i $Track -t $durS -af "$chain,$ln,$tail" -ar 48000 -ac 2 -c:a pcm_s24le $tmpWav
if ($LASTEXITCODE -ne 0) { throw "loudnorm pass 2 failed" }

# Mux: copy video, encode audio to AAC 192k.
# Video: re-encode to yuv420p, tv range (silent source is yuvj420p), crf 16. Audio: AAC 192k.
& ffmpeg -hide_banner -loglevel error -y -i $Film -i $tmpWav -map 0:v:0 -map 1:a:0 -vf "scale=out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 16 -color_range tv -c:a aac -b:a 192k -t $durS -movflags +faststart $Out
if ($LASTEXITCODE -ne 0) { throw "mux failed" }
Remove-Item $tmpWav -ErrorAction SilentlyContinue

Write-Output ("track t0={0:0.00000}s  film T0={1:0.00000}s  offset={2:0.00000}s  duration={3:0.000}s" -f $t0Track, $T0, $offset, $dur)
Write-Output ("pass1 measured: I={0} LUFS  TP={1} dBTP  LRA={2}" -f $json.input_i, $json.input_tp, $json.input_lra)
Write-Output "wrote $Out"
