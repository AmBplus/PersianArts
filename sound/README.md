# sound/ - music-first tooling

Decision (owner, 2026-10-12): PersianArts uses only ready-made recorded SFX and background music (no synthesis).
**Music comes first; the picture is cut to the track's beat grid.** This is the method of upstream video-shotcraft
(`references/music-beat-sync.md`, `sound-design.md`). Upstream documents the method but ships no tooling; these
scripts are that tooling. The method and gate values are credited to video-shotcraft; the implementation is ours.

```
sound/
  tools/music_map.py        analyse ONE track -> sidecar JSON (+ optional click preview)
  tools/grid_accept.py      print the acceptance table for sidecars, exit 1 on any FAIL
  tools/test_music_map.py   unit tests on synthetic drum tracks (~5 s)
  library/bgm/<name>.music.json   sidecars (metadata only - audio is never copied into the repo)
  requirements.txt          pinned versions (needs ffmpeg for .mp3 click previews)
```

## Run

```bash
pip install --break-system-packages -r sound/requirements.txt
python3 sound/tools/music_map.py track.mp3 --out sound/library/bgm/track.music.json \
        --click /tmp/track.click.mp3 --click-seconds 30 --bars 4
python3 sound/tools/grid_accept.py sound/library/bgm/*.json        # exit 1 if any FAIL
python3 -m unittest sound/tools/test_music_map.py
```

Flags: `--click` writes the original with short clicks on the fitted beats (1.0 kHz on beats, 1.8 kHz on downbeats;
`.wav` or `.mp3` 128k) so the owner can hear-check the grid; `--click-seconds N` limits it; `--bars N` is the phrase
length used for `safe_cuts`; `--hpss` analyses the percussive component (vocal/pad-heavy mixes; ~20 s slower).
A free-tempo or failed grid still writes the sidecar, with `grid.verdict = "FAIL"` and the reasons.

## Method (what music_map does)

1. Decode with soundfile (mono float for analysis, int16 PCM for the md5).
2. `librosa.beat.beat_track(tightness=400)`, then a least-squares line `t_i = t0 + i*T` over the beats. The tempo scalar is
   recorded (`grid.beat_track_tempo`) but never used.
3. Drum transients per band (zero-phase Butterworth, trailing RMS envelope, centred flux, leading-edge time):
   kick 40-160 Hz; snare = 150-500 Hz body AND 1-3 kHz face (geometric mean); hihat 6-14 kHz. Simultaneous hits
   (<= 20 ms) are merged into drum events; an event is *strong* if it holds a kick or snare hit with s >= 0.3.
4. The line is re-fitted on the real strong events (shrinking tolerance 60/40/25 ms, outliers trimmed) because
   beat_track's own beat times sit on an 11.6 ms hop grid. Deviation from upstream: upstream fits beat_track's beats only.
5. Candidate grids 0.5x (both phases), 1x, 2x are each refitted and scored on drum events: F-beta (beta 0.5) of
   precision (grid beats that carry a strong event) and recall (strong events that sit on a grid beat), times a tempo prior
   (x0.5 outside 70-180 BPM). Ties prefer 1x. All candidates and the winning reason are stored.
6. Gates on the winner, scored only over *drum-active* beats (>= 3 strong events in each of the 3 s before and after the
   beat, so drum-less intros, breakdowns and tails are not counted against the grid):
   `match >= 98 %`, `mean_abs < 10 ms`, `drift < 5 ms`, first drum-active beat on a real attack (15 ms).
   Tolerance for a "hit" is 35 ms (about one frame at 30 fps). `grid_accept.py` re-derives the verdict from the numbers.
7. Bars: `beats_per_bar` is 4 unless the strength sequence is clearly 3-periodic. Beat 0 / `t0` is the first *downbeat*; the
   downbeat phase comes from accents plus RMS change at phrase boundaries and falls back to "first beat" when unsure
   (`grid.downbeat_confidence` < 0.08). `grid.downbeat_pickup_beats` says how many beats precede `t0`.
8. Energy per bar (mean RMS / 98th percentile, 0..1), drum density per bar, sections, top hits, safe cuts (below).

Times are float seconds; nothing is rounded to frames. In the film code use `beatT(n) = t0 + n*beat_s`
(+ a separately measured output-audio offset, never folded into `t0`), exactly as upstream section 4.

## Sidecar fields (`schema: persianarts.music_map/1`)

| field | meaning |
|---|---|
| `file`, `md5_pcm`, `decoder`, `sample_rate`, `duration_s`, `tool` | identity. `md5_pcm` = md5 of the decoded int16 PCM (all channels, native rate) - proves the sidecar belongs to this decode of this audio. Times are relative to the decoded stream (soundfile and ffmpeg agree to the sample on the 2 files tested). |
| `bpm`, `t0`, `beat_s` | of the winning grid; beat `n` is at `t0 + n*beat_s`. `bar_s = beats_per_bar*beat_s`; bar `b` starts at beat `b*beats_per_bar`. All indices 0-based. |
| `beats_per_bar`, `n_bars` | 4 unless clearly 3; last partial bar counted if >= half a bar |
| `grid.verdict` / `reasons` | PASS / FAIL and why (gate misses, too little drum material, ...) |
| `grid.winner`, `winner_reason`, `candidates[]` | all of 0.5x-a, 0.5x-b, 1x, 2x with bpm, score, f1, prior, precision, recall, match, mean_abs_ms, drift_ms |
| `grid.match`, `match_strong`, `mean_abs_ms`, `drift_ms` | gate metrics. `match` = drum-active beats with any drum event within 35 ms; `match_strong` = with a kick/snare event; `mean_abs_ms` = mean distance to the nearest strong event; `drift_ms` = range of the median residual over the four quarters of the track (catches a wrong tempo and tempo ramps) |
| `grid.first_beat_on_attack`, `first_attack_beat`, `beats_total`, `beats_scored`, `active_fraction`, `downbeat_*`, `gates` | supporting numbers |
| `impacts[]` | every detected hit `{t, s, k}`; `s` 0..1 relative to the track's 99.5th percentile of that band, `k` kick / snare / hihat. A candidate pool, not a trigger list: most kicks must not drive picture impacts. |
| `energy_per_bar[]`, `drum_hits_per_beat_per_bar[]` | per bar, from `t0` |
| `sections[]` | `{kind: intro\|build\|full\|breakdown\|outro, from_bar, to_bar}`, `to_bar` exclusive |
| `top_hits[]` | up to 3 strongest kick/snare hits on a grid beat, >= 16 beats apart: `{t, bar, beat, beat_index, s, k}`. Ranking = hit strength x (0.5 + 0.5 x loudness jump after vs before), so entrances after a break beat identical mid-groove kicks. Pin the 2-3 full-frame impacts of a film here. |
| `safe_cuts[]` | bar numbers (multiples of `safe_cut_phrase_bars`) that begin on a strong drum attack and are either a section boundary or have energy within 0.12 of the previous bar: places for a clean internal edit / loop / shortening |
| `thresholds` | every constant used by the heuristics |

Section heuristic: a bar is *full* if energy >= 0.70 and >= 0.5 strong drum events per beat; 1-bar blips are merged;
non-full bars before the first full run are *intro*, after the last *outro*, between *breakdown*; the rising tail
(>= 2 bars, <= 8, rise >= 0.15) of an intro/breakdown that leads into a full run is *build*.

## Limitations

- Section labels, downbeat phase and safe cuts are heuristics from energy and drum density; confirm by ear (click preview)
  before cutting. Downbeat confidence is low on four-on-the-floor tracks with no accents.
- The gates are stricter than the grid quality a human needs: a track can sit 1-2 % under the 98 % match gate because of a
  few swung or dropped hits and still be a perfectly good constant-tempo grid; read `reasons` and `match_strong`.
- Dense off-beat hats/claps (house) make 2x look as plausible as 1x; the tempo prior and the beat tracker decide.
  Check `candidates[]` if a BPM looks doubled or halved.
- Free-tempo, rubato, or DJ-mix tracks fail (by design). Piecewise grids are not implemented.
- Detected hit times carry a small early bias (< 4 ms on synthetic drums) from the zero-phase filters; irrelevant at 30 fps.
- No drum stem separation (Demucs) - only an optional HPSS flag. Vocal-heavy mixes may need it.
