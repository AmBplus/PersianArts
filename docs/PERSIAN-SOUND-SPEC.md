# PERSIAN-SOUND-SPEC — sound for the Persian shotcraft renders

> **Superseded in part (2026-10-12, owner decision).** Synthesized music and SFX are no longer used. Use recorded, curated SFX and background music only, following video-shotcraft's method (music first → beat-grid acceptance → picture on the grid → authored SFX table → post-render backtest). Rationale and evidence: `docs/research/SHOTCRAFT-AUDIO-STUDY.md`. Tooling: `sound/`. The analysis/loudness parts of this spec remain valid where they don't contradict this.

Decisions by the main Claude session (2026-10-11). Implementation by cheaper models per the delegation rule
(see `~/.claude/skills/quota-hub`). The upstream demos are silent; the Persian renders become short product-film clips
with music + picture-timed SFX. Everything is **synthesized, deterministic and project-owned** (no stock audio, so no
license/attribution question). Verification is objective (levels, alignment, spectrogram) because nobody can listen
in CI; the owner does a final listening pass on a sample.

## Pipeline

```
work/persian/out/<slug>/<Stem>.fa.mp4      (silent, from render-card.mjs --video)
        |  scripts/persian-sound/make_sound.py   (analyze picture -> synthesize -> mux)
        v
work/persian/out/<slug>/<Stem>.fa.sound.mp4  + sound/<Stem>.json (cue list) + sound/<Stem>.spec.png + sound/<Stem>.wav
        |  scripts/link-persian-shotcraft-media.mjs prefers *.fa.sound.mp4 when it exists (H.264 stays, AAC 96k)
        v
library/media/shotcraft/<card>/fa/<style>/preview.mp4   (< 2 MB incl. audio)
```

CLI: `python scripts/persian-sound/make_sound.py --in X.fa.mp4 --out X.fa.sound.mp4 --slug S --category C [--tags a,b] [--profile P] [--debug-dir D]`
and `python scripts/persian-sound/batch.py [--slugs a,b | --all-approved] [--force]` (reads `work/persian/progress.json` for
approved/fixed cards, `work/upstream/src/gallery/api/library.json` for category/tags, skips existing outputs unless --force).
Requires only Python 3 + numpy + the `ffmpeg`/`ffprobe` binaries already on PATH. No other pip packages (write WAV with the
`wave` module, spectrogram PNG with a tiny pure-numpy colour map + `zlib` PNG writer or via ffmpeg `showspectrumpic`).

## 1. Picture analysis (picture-locked cues)

- Decode the video at 30 fps (or its native fps), grayscale, downscale to 96x54 via ffmpeg rawvideo pipe.
- Motion energy `m[f] = mean(|frame[f]-frame[f-1]|)`; smooth with a 3-frame box filter; spectral flux onset strength
  `o[f] = max(0, m[f] - median(m[f-6:f]))`.
- Peak-pick onsets: local maxima with `o[f] > 0.6 * (median of top-5 o) * 0.5` and at least 5 frames apart
  (min gap 0.17 s). Keep at most 16 cues per clip, strongest first.
- Classify each cue by magnitude `s = o[f] / max(o)` and local context:
  - `impact`: s >= 0.70 and sharp (energy before the cue < 25 % of the peak) -> low thump + noise burst + short reverb tail.
  - `whoosh`: motion energy rises over >= 5 frames before the peak (a sweep) -> band-passed noise sweep, up-sweep when the
    energy centroid moves right-to-left (Persian reading direction) / otherwise down-sweep, 0.35-0.6 s long, peak at the cue.
  - `tick`: a run of >= 4 small cues (s < 0.45) with near-even spacing (CV < 0.35) -> short filtered-noise key click
    (typing/list/stagger); alternate 2 click timbres, +-1.5 dB random gain.
  - `pop`: everything else (s 0.3-0.7, isolated) -> soft sine pop (pitch drop 880 -> 440 Hz in 60 ms) with tiny noise.
- Also detect `intro` (video starts static: first cue after t0 > 0.25 s) and `outro` (last 12 % of frames static): intro gets a
  soft riser starting 0.5 s before the first strong cue (if available) and the outro gets a resolve (see music).

## 2. Music (generated per clip, locked to the picture)

Clip length is 3-8 s, so the "track" is a **sting-style loop-free cue**: attack -> groove -> resolve. Seeded RNG:
`seed = fnv1a(slug + stem)`.

Tempo: `bpm` from the profile range; then snap the grid so that the **strongest `impact`/first strong cue lands exactly on a beat 1**
(shift the grid offset, not the tempo) and beats 1 of later bars land near other strong cues (nudge bpm by <= +-4 %
to maximize aligned cues). Quantize SFX to the grid only when the offset is < 40 ms; never move the picture-locked cue
more than that.

Layers (all stereo, gain in dBFS before master): kick -12 (sine 120->45 Hz, 0.18 s, click), clap/snare -16 (noise band
1.2-3.5 kHz, 90 ms), hat -22 (HP noise, 25 ms, 8th notes, swing 0 / 54 % for `playful`), bass -18 (saw/square through a
1-pole lowpass at 280 Hz, notes on the chord roots), pad -24 (3 detuned saws, slow attack 0.25 s, LPF 1.2 kHz), pluck/lead
-20 (Karplus-Strong or additive pluck) playing a short motif from the scale, sparkle -26 (high sine bells on cues).
Sidechain: duck pad + bass by 3 dB for 90 ms after each kick. Reverb: a small Schroeder reverb (4 combs + 2 allpass) at
18 % wet on pad/pluck/SFX only. Intro fade-in 60 ms, tail: final chord rings out 0.45 s past the last picture cue and the
whole mix fades to silence by the end of the clip (clip end is always silent, no clicks: 40 ms cosine fade).

Profiles (`profiles.json`, chosen by `--profile` or auto from category/tags; the table is the decision):

| profile | when | bpm | scale / feel | layers |
|---|---|---|---|---|
| `clean-tech` | ui-entrance, interaction, data | 104-116 | A natural minor pentatonic, plucky | kick light, hat 8ths, pluck motif, pad soft, ticks prominent |
| `cinematic` | opening, outro, camera | 84-96 | D minor, wide pad, no hats | big impacts, riser, low drone, pad strong, resolve to tonic |
| `punchy` | rhythm, effects (glitch, flash, slam) | 120-128 | E phrygian, tight | kick 4-on-floor, clap on 2/4, bass, no pad |
| `editorial` | typography | 88-100 | A dorian, airy | soft ticks (typewriter), pad, sparse pluck, light hat |
| `persian-shur` | tags/categories hinting calligraphy, ink, poetry, elegant (Aref Ruqaa, Amiri, Nastaliq, 'ink', 'brush', 'poem') or `--profile persian-shur` | 76-88 | Shur-like: D, E(-50 cents), F, G, A, Bb, C; Karplus-Strong "setar" pluck, drone on D+A, no kick | pluck motif with ornament (grace note), pad drone, tiny hat/brush noise |
| `playful` | tags friendly/casual/pill/chip | 108-118 | C major pentatonic, bouncy, swing 54 % | pop-heavy, marimba-ish pluck, light kick |
| `transition` | transition | 112-122 | G minor, whoosh-forward | whoosh/riser dominant, kick on cuts, short pad |

Fallback when no mapping: `clean-tech`.

## 3. Mix, loudness and delivery

- SFX bus peak about -10 dBFS (impact up to -6), music bus about -20 dBFS before master; music is ducked 2.5 dB under
  `impact`/`whoosh` for their duration (release 150 ms).
- Master: `ffmpeg loudnorm=I=-14:TP=-1.5:LRA=7` two-pass (measure then apply), stereo, 44.1 kHz; limiter `alimiter=limit=0.89`.
- Mux: `-c:v copy -c:a aac -b:a 96k -movflags +faststart`; audio length must equal video length (pad/trim with `apad`/`-shortest`
  after `atrim`). Output must stay playable in browsers (yuv420p video untouched).

## 4. Verification (objective gates, `verify_sound.py`)

For each output the script prints a JSON verdict and fails the gate if any rule breaks:
1. Integrated loudness -14 +- 1.5 LUFS (clips < 3 s: use short-term, +- 2.0), true peak <= -1.0 dBTP, no sample > 0.99.
2. Audio duration within 25 ms of video duration; first and last 30 ms are silent (no click).
3. Every cue in `sound/<Stem>.json` has `picture_frame`, `time`, `kind`, `gain`; sound onset (RMS rise) within 25 ms of the cue time.
4. No silent gap > 1.2 s inside the clip, no DC offset > 0.002, no NaN/Inf.
5. File size: video unchanged (stream copy) and total < 2 MB.
6. Determinism: running twice gives byte-identical WAV.
7. Debug image `sound/<Stem>.spec.png`: spectrogram on top, waveform below with cue markers (vertical lines labelled by kind) for the human/reviewer check.

## 5. Delivery rules

- Do not touch demo sources or the Persian kit. New code lives in `scripts/persian-sound/` only; tests in
  `scripts/persian-sound/test_*.py` (unittest, no extra deps).
- Do not commit generated audio under `work/` (git-ignored); the library packager writes the final mp4 files.
- Document knobs in `scripts/persian-sound/README.md`. Add the new lessons to `docs/PERSIAN-LOCALIZATION-LESSONS.md` only via the
  main session.
