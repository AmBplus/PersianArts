# Pacing report: film-B html v2, 9:16, 19.7 s
Advisory (scores inform, never block). Numbers: `pa pacing`, profile = docs/motion/knowledge/ref-pacing-summary.json (38 references). Labels neutral.

## Top 5 findings and ranked fixes
1. Cut rate 4.07 per 10 s vs story references 2.1-3.4 (median shot 2.1 s is ok but scenes 1-4 are 0.6-1.5 s). Fix: merge the opening flashes; target 3 cuts/10 s.
2. Cuts are beat-locked (62% vs 22% chance, ref 34%) but only 12% land on bar downbeats. Fix: move the 3 structural cuts to downbeats (build_sound already knows the bar grid; align the payoff cut to the final settle bar).
3. Sparse scenes: 2.3 elements per scene (ref 3.0-4.7) and build 0.58 s: scenes show one idea only; either add one supporting element or accept as a deliberate minimalist choice.
4. Hold 0.62 s vs ref 0.24-0.45: longer than references (readable, good); no action.
5. Music 112 BPM against reference 114-136: slightly slow for a 4 cuts/10 s edit; a 118-122 BPM track would lift the energy (`pa music-pick --mood playful --bpm 110-124`).

## Full report
```
PACING film-B html v2  (1080x1920, 19.7 s, ratio 9x16, profile story=story-reels, n_ref=14)  [advisory]
metric                       ours      ref p25..p75     verdict
median shot length (s)       2.12      1.45..4.24       ok
cuts per 10 s                4.07      2.12..3.44       too fast
cuts in first 3 s            2         >= 1 typical     ok
elements per scene           2.33      3.02..4.71       sparse
build time median (s)        0.58      0.6..3.31        build too quick
hold time median (s)         0.62      0.23..0.44       hold long
energy intro/mid/outro       1.23/0.95/0.82 1.01/1.06/0.78   ok (arc present)
tempo (bpm, from mix)        112.30    113.6..136.0     slow music
cuts on beat (60 ms)         62%       chance 22%, ref 34% locked
cuts on bar downbeat         12%       chance 6%        near/below chance: cuts not bar-locked
loudness LUFS / RMS arc dB   -14.1     -16.0/-17.8/-17.0
scenes (start-end, len, elements, build, hold):
   1  0.00- 0.58 len 0.58 el  1 build 0.42 hold 0.17
   2  0.58- 2.25 len 1.67 el  1 build 0.12 hold 1.54
   3  2.25- 4.38 len 2.12 el  3 build 1.50 hold 0.62
   4  4.38- 7.67 len 3.29 el  6 build 2.71 hold 0.58
   5  7.67-10.92 len 3.25 el  1 build 0.12 hold 3.12
   6 10.92-14.79 len 3.88 el  1 build 0.17 hold 3.71
   7 14.79-15.62 len 0.83 el  2 build 0.62 hold 0.21
   8 15.62-18.17 len 2.54 el  4 build 2.46 hold 0.08
   9 18.17-19.67 len 1.50 el  2 build 0.58 hold 0.92
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```

## Recalibrated (T004, 2026-10-13): real cuts / track grid instead of detection
Cause of the old 0% on bar: (1) the detector saw 9 content changes, none inside 120 ms of the 4 real structural cuts (8-frame wipe: detection fires 0.1-0.3 s off); (2) the bar phase was guessed from audio onsets. With the film's own cut list and the track grid the same cuts are exact.
```
PACING film-B html v2  (1080x1920, 19.7 s, ratio 9x16, profile story=story-reels, n_ref=14)  [advisory]
cuts: 6 given, 8 detected; detected cuts matching a real cut within 120 ms: 5
beat/bar grid source: track grid tr-lnplus-597024 bpm 110.00 t0 0.027
median shot length (s)       3.27      1.45..4.24       ok
cuts per 10 s                2.54      2.12..3.44       ok
cuts in first 3 s            1         >= 1 typical     ok
build time median (s)        0.98      0.6..3.31        ok
hold time median (s)         1.35      0.23..0.44       hold long
cuts on beat (60 ms)         100%      chance 22%, ref 34% locked
cuts on bar downbeat         60%       chance 5%        locked
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```
