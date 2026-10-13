# Master (-14 LUFS, TP -1.5), mux into 4 ratios. Run after make_short_sound.py. REPO from script location.
$repo = if ($env:PA_REPO) { $env:PA_REPO } else { (Resolve-Path "$PSScriptRoot/../../../..").Path }
Set-Location "$repo/media/film-versions/uni/long-v1"
$a = "audio"
$j = ffmpeg -hide_banner -i $a/mix-pre.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json" -f null - 2>&1 | Out-String
$m = [regex]::Match($j, '\{[^}]+\}').Value | ConvertFrom-Json
$af = "loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=$($m.input_i):measured_TP=$($m.input_tp):measured_LRA=$($m.input_lra):measured_thresh=$($m.input_thresh):offset=$($m.target_offset):linear=true,alimiter=limit=0.84:level=disabled,aresample=48000"
ffmpeg -v error -y -i $a/mix-pre.wav -af $af -ar 48000 -c:a pcm_s16le $a/mix-final.wav
foreach ($r in '9x16', '1x1', '4x5', '16x9') {
  ffmpeg -v error -y -i uni-long-$r-silent.mp4 -i $a/mix-final.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -t 30 -movflags +faststart uni-long-$r-sound.mp4
}

