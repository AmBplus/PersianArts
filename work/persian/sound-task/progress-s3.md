Plan: 1) Read spec sections 2-3 + analysis.py/synth.py APIs; 2) Implement mix.py and make_sound.py; 3) Run on 3 sample videos, capture ffprobe + loudness, write report.
Step 2 in progress: mix.py written (tempo snap, layers, ducking, buses). Now make_sound.py CLI.
Step 2 done: mix.py (tempo snap, grid layer placement, sidechain ducks, bus peaks) + make_sound.py (CLI, two-pass loudnorm, mux AAC 96k video copy, cue JSON + WAV debug outputs).
Step 3 done: rendered all 3 samples; ffprobe streams OK (h264 copy + aac 44.1k stereo ~95k), loudness measured: RadialWave -15.06 LUFS / -1.99 dBTP, ListReveal -14.50 / -1.21, SvgShapeMorph -13.70 / -1.36; determinism verified (identical WAV md5 twice).
All steps complete; report written.
