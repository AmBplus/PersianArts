# Pacing report: film-A teaser v5, 9:16, 28.5 s
Advisory (scores inform, never block). Numbers: `pa pacing`, profile = docs/motion/knowledge/ref-pacing-summary.json (38 references). Labels neutral.

## Top 5 findings and ranked fixes
1. Same grid problem as the 16:9 cut: 10% on beat, 0% on bar. Fix: bar-lock all cuts (shared timeline for both ratios).
2. 3.51 cuts/10 s and 2.0 s median shot vs 9:16 story references 2.1-3.4 and 1.5-4.2 s: 11 scenes in 28 s; slightly fast, scene 8 is 1.1 s. Merge two short scenes.
3. Sparse and quick builds: 3.3 elements per scene (ref 3.0-4.7 ok-low) but build 0.96 s median and hold 0.12 s: text arrives and leaves almost at once. Fix: Persian text hold >= 0.6 s + 0.045 s per character; give key lines a full bar.
4. No cut in the first 3 s (first scene 3.8 s). Fix: hook change at bar 1.
5. Outro energy 0.58 (middle 1.41): the last scene carries little motion; add a settle or sweep on the final bar.

## Full report
```
PACING film-A 9x16 v5 (teaser)  (1080x1920, 28.5 s, ratio 9x16, profile teaser=promo-teaser, n_ref=15)  [advisory]
metric                       ours      ref p25..p75     verdict
median shot length (s)       2.00      3.15..5.24       too fast
cuts per 10 s                3.51      1.56..2.77       too fast
cuts in first 3 s            0         >= 1 typical     no early cut/hook change
elements per scene           3.27      3.79..5.14       sparse
build time median (s)        0.96      1.23..3.14       build too quick
hold time median (s)         0.12      0.21..1.3        hold too short
energy intro/mid/outro       1.01/1.41/0.58 1.03/1.02/0.97   ok (arc present)
tempo (bpm, from mix)        117.50    101.4..123.0     ok
cuts on beat (60 ms)         10%       chance 23%, ref 22% near chance: cuts not beat-locked
cuts on bar downbeat         0%        chance 6%        near/below chance: cuts not bar-locked
loudness LUFS / RMS arc dB   -15.5     -18.2/-19.3/-16.7
scenes (start-end, len, elements, build, hold):
   1  0.00- 3.79 len 3.79 el  8 build 3.67 hold 0.12
   2  3.79- 4.83 len 1.04 el  3 build 0.96 hold 0.08
   3  4.83- 5.83 len 1.00 el  3 build 0.92 hold 0.08
   4  5.83- 6.88 len 1.04 el  3 build 0.92 hold 0.12
   5  6.88- 9.88 len 3.00 el  3 build 2.71 hold 0.29
   6  9.88-16.00 len 6.12 el  6 build 4.04 hold 2.08
   7 16.00-18.00 len 2.00 el  3 build 1.92 hold 0.08
   8 18.00-19.12 len 1.12 el  0 build 0.00 hold 1.12
   9 19.12-21.88 len 2.75 el  3 build 2.62 hold 0.12
  10 21.88-22.62 len 0.75 el  2 build 0.38 hold 0.38
  11 22.62-28.47 len 5.84 el  2 build 0.46 hold 5.39
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```

## Recalibrated (T004, 2026-10-13): real cuts / track grid instead of detection
Cause of the old 0% on bar: (1) the detector saw 9 content changes, none inside 120 ms of the 4 real structural cuts (8-frame wipe: detection fires 0.1-0.3 s off); (2) the bar phase was guessed from audio onsets. With the film's own cut list and the track grid the same cuts are exact.
```
PACING film-A 9x16 v5  (1080x1920, 28.5 s, ratio 9x16, profile story=story-reels, n_ref=14)  [advisory]
cuts: 4 given, 10 detected; detected cuts matching a real cut within 120 ms: 0
beat/bar grid source: track grid tr-lnplus-597024 bpm 118.00 t0 0.000
median shot length (s)       6.10      1.45..4.24       too slow
cuts per 10 s                1.40      2.12..3.44       too slow
cuts in first 3 s            0         >= 1 typical     no early cut/hook change
build time median (s)        5.82      0.6..3.31        build too slow
hold time median (s)         0.25      0.23..0.44       ok
cuts on beat (60 ms)         100%      chance 24%, ref 34% locked
cuts on bar downbeat         100%      chance 6%        locked
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```
