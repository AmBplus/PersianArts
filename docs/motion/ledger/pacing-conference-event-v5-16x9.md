# Pacing report: film-A teaser v5, 16:9, 28.5 s
Advisory (scores inform, never block). Numbers: `pa pacing`, profile = docs/motion/knowledge/ref-pacing-summary.json (38 references). Labels neutral.

## Top 5 findings and ranked fixes
1. Cuts not on the music grid: 11% of cuts within 60 ms of a beat (chance 23%), 0% on a bar downbeat. Fix: place every cut on the bar grid of the chosen track (`pa music-pick` prints the bar times; ~2.03 s bars at 118 BPM) before the build; expected 80-100% on bar, the single biggest "feels like another film" lever.
2. Too many, too short shots: 3.16 cuts/10 s and 2.5 s median vs reference teaser 1.56-2.77 and 3.2-5.2 s. Scenes 3, 7 and 9 last 1.0, 0.75 and 0.8 s. Fix: merge 7+8 and 9 into their neighbours, target 8-9 scenes of >= 1 bar; expected cuts/10 s about 2.5.
3. No cut or state change in the first 3 s: the opening scene holds 3.8 s (11 elements build until 3.7 s). Fix: hook change at bar 1 (<= 2 s); expected stronger first-3-s retention.
4. Static tail: last scene 5.8 s with only 0.5 s of build (hold 5.4 s) = 19% of the film still. Fix: shorten to 1-2 bars (about 4 s) or keep the persistent element moving; reference hold p75 is 1.3 s.
5. Energy arc intro/mid/outro 1.21/1.43/0.35: strong build then a very quiet last third; references stay near 1.0 at the end (outro 0.97 teasers). Fix: let the payoff scene carry motion (light sweep, logo settle) so the outro is >= 0.6.

## Full report
```
PACING film-A 16x9 v5 (teaser)  (1920x1080, 28.5 s, ratio 16x9, profile teaser=promo-teaser, n_ref=15)  [advisory]
metric                       ours      ref p25..p75     verdict
median shot length (s)       2.54      3.15..5.24       too fast
cuts per 10 s                3.16      1.56..2.77       too fast
cuts in first 3 s            0         >= 1 typical     no early cut/hook change
elements per scene           3.80      3.79..5.14       ok
build time median (s)        1.85      1.23..3.14       ok
hold time median (s)         0.23      0.21..1.3        ok
energy intro/mid/outro       1.21/1.43/0.35 1.03/1.02/0.97   ok (arc present)
tempo (bpm, from mix)        117.50    101.4..123.0     ok
cuts on beat (60 ms)         11%       chance 23%, ref 22% near chance: cuts not beat-locked
cuts on bar downbeat         0%        chance 6%        near/below chance: cuts not bar-locked
loudness LUFS / RMS arc dB   -15.5     -18.2/-19.3/-16.7
scenes (start-end, len, elements, build, hold):
   1  0.00- 3.79 len 3.79 el 11 build 3.71 hold 0.08
   2  3.79- 5.83 len 2.04 el  5 build 1.79 hold 0.25
   3  5.83- 6.88 len 1.04 el  3 build 0.92 hold 0.12
   4  6.88- 9.88 len 3.00 el  2 build 2.71 hold 0.29
   5  9.88-16.00 len 6.12 el  6 build 4.04 hold 2.08
   6 16.00-18.08 len 2.08 el  4 build 1.92 hold 0.17
   7 18.08-18.83 len 0.75 el  0 build 0.00 hold 0.75
   8 18.83-21.83 len 3.00 el  3 build 2.92 hold 0.08
   9 21.83-22.62 len 0.79 el  2 build 0.58 hold 0.21
  10 22.62-28.47 len 5.84 el  2 build 0.46 hold 5.39
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```

## Recalibrated (T004, 2026-10-13): real cuts / track grid instead of detection
Cause of the old 0% on bar: (1) the detector saw 9 content changes, none inside 120 ms of the 4 real structural cuts (8-frame wipe: detection fires 0.1-0.3 s off); (2) the bar phase was guessed from audio onsets. With the film's own cut list and the track grid the same cuts are exact.
```
PACING film-A 16x9 v5  (1920x1080, 28.5 s, ratio 16x9, profile teaser=promo-teaser, n_ref=15)  [advisory]
cuts: 4 given, 9 detected; detected cuts matching a real cut within 120 ms: 0
beat/bar grid source: track grid tr-lnplus-597024 bpm 118.00 t0 0.000
median shot length (s)       6.10      3.15..5.24       too slow
cuts per 10 s                1.40      1.56..2.77       too slow
cuts in first 3 s            0         >= 1 typical     no early cut/hook change
build time median (s)        5.82      1.23..3.14       build too slow
hold time median (s)         0.25      0.21..1.3        ok
cuts on beat (60 ms)         100%      chance 24%, ref 22% locked
cuts on bar downbeat         100%      chance 6%        locked
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```
