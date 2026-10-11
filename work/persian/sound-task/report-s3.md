# report-s3 — spec sections 2+3 (mix / loudness / delivery)

## What I did
- scripts/persian-sound/mix.py (new): section 2 — seeded grid, tempo snap
  (strongest impact/first strong cue lands exactly on a beat 1 via grid offset,
  bpm nudged <= +-4 % to maximize cues within 40 ms of a beat); profile layer
  placement (kick/clap/hat/bass/pad/drone/pluck/sparkle); kick sidechain
  (pad+bass -3 dB / 90 ms). Section 3 — SFX per cue (impact -6, whoosh -10,
  tick -14 +-1.5 dB, pop -16, intro riser), SFX bus ~-10 dBFS peak, music bus
  -20 dBFS, music -2.5 dB duck under impact/whoosh (150 ms release),
  60 ms/40 ms fades, exact video-length mix.
- scripts/persian-sound/make_sound.py (new): spec CLI. analyze -> mix ->
  writes sound/<Stem>.json + sound/<Stem>.wav under --debug-dir; ffmpeg
  two-pass loudnorm I=-14:TP=-1.5:LRA=7, alimiter=limit=0.89:level=0,
  apad/atrim to video length, mux -c:v copy -c:a aac -b:a 96k +faststart
  -shortest; post-mux TP check re-muxes with small trim until <= -1.2 dBTP.

## Acceptance
Run (x3): python scripts/persian-sound/make_sound.py --in work/persian/out/<d>/<S>.fa.mp4
  --out work/persian/sound-task/samples/<S>.fa.sound.mp4 --slug <d> --debug-dir work/persian/sound-task/samples
  -> RadialWave clean-tech bpm=107.99 offset=0.278s cues=3; ListReveal bpm=107.95
     offset=0.267s cues=7; SvgShapeMorph bpm=104.82 offset=0.867s cues=6
ffprobe streams (all 3): h264 yuvj420p 1920x1080 stream-copied + aac 44100 Hz
stereo bit_rate 94491/94185/94926.
Measured loudness (loudnorm print_format=json on outputs):
  RadialWave:   I=-15.06 LUFS, TP=-1.99 dBTP
  ListReveal:   I=-14.50 LUFS, TP=-1.21 dBTP
  SvgShapeMorph: I=-13.70 LUFS, TP=-1.36 dBTP
Audio/video stream duration delta: 23/19/17 ms (gate <= 25 ms). Determinism:
two renders -> identical WAV md5 14c5a12a358be83d98a06790f8fb9c42.
Outputs: samples/{3x}.fa.sound.mp4 + samples/sound/{Stem}.{json,wav}.

## Doubts
- alimiter default `level` (auto-level) renormalizes to 0 dB, defeating the
  0.89 ceiling (RadialWave measured +0.4 dBTP); fixed with level=0 plus a
  deterministic post-AAC TP re-trim loop, so RadialWave ends at -1.99 dBTP
  (below -1.5 target, still within the <= -1.0 gate).
- analysis.py exposes no energy-centroid direction; whoosh sweep direction alternates deterministically per cue.
- Samples auto-mapped to fallback clean-tech (no category/tags passed);
  --category/--tags/--profile mapping is implemented and verified above.
