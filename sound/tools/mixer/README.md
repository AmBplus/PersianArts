# Sound mixer (the pencil method, generic)

Builds a film's sound from the tracked kit (`sound/library/kit`): events -> layered cues -> bed -> master. Runs only on the owner's word.

    sound/.venv/Scripts/python.exe -I sound/tools/mixer/build_sound.py --film <silent.mp4> --events <events.json> \
      --track tr-lnplus-597024 --rules sound/tools/mixer/rules.default.json --out-dir <dir> [--bpm 110 --t0 0.027] [--seed 7]
    pwsh -File work/persian/tools/pa.ps1 sound -Film <silent.mp4> -Events <events.json> -Track tr-lnplus-597024 -OutDir <dir>

Outputs in `<dir>`: `cues-resolved.json`, `verify.json` (LUFS, true peak, tail peak, max audible simultaneous, offset table cue vs contact,
downbeat vs settle, cut-to-beat error), `social-<ratio>-final.mp4` (video copy, AAC 192k), `render.txt` (ffmpeg log), `tmp/`.

## events.json (contracts/schemas/events.schema.json)
`{fps, bpm, t0_s, cut_frames, duration_frames, events:[{name, type, frame|t_s, variant?, intensity?, role?, dur_s?}]}`.
`frame` is the visual CONTACT frame; sound lands on it (+0 ms). `role:"final"` marks the settle: a bar downbeat of the bed is aligned to it.
Interior `cut_frames` get a whoosh at cut-5 frames automatically. Types: stamp hit thud ring tick bell count-tick whoosh transition settle riser reveal ambient pop slide typing success fail glitch.

## rules.json
`types.<type>` = `{layers:[...]}` or `{cycle:[{layers}...]}` (successive events use successive entries) or `{alias:"other"}`; `variants.<name>` overrides by `event.variant`.
Layer: `role` (anticipation/hit/ring/tail), `clip` (kit id) or `category`+`pick:"seeded"`, `offset_ms` (negative = before contact), `dur_s` or `span:true`,
`gain_db` or `target_db` (+`cap_db`), `fade_ms`, `duck` (default: categories in `duck_categories`). Copy `rules.default.json`, edit, pass `--rules`.

## Expected numbers (pencil html v2 rebuild)
Integrated -14.1 LUFS, true peak -2.1 dBTP (<= -1.0), last 0.25 s peak -inf (< -50), audible simultaneous 3, audio length within 1 frame of video,
payoff cues within 0.3 ms of contact. Compare against an original with `compare_sound.py` (LUFS/TP/tail, cue deltas, envelope correlation, band energy).
Example events: `examples/pencil-v2.events.json` (made by `examples/make_pencil_events.py`).

## Settle role (L-a)
Only an event with `role: "final"` (or `ends_film: true`) ends the film: the bed aligns to it and fades from it. A plain type `settle` mid-film does not. The build fails if the bed is silent (< -40 dB RMS) for more than 1.5 s before the film end. Regression: `python sound/tools/mixer/test_build_sound.py`.
