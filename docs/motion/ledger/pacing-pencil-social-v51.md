# Pacing report: film-C social v51, 9:16, 19.7 s
Advisory (scores inform, never block). Numbers: `pa pacing`, profile = docs/motion/knowledge/ref-pacing-summary.json (38 references). Labels neutral.

## Top 5 findings and ranked fixes
1. Highest cut rate of the four: 4.58 per 10 s vs 2.1-3.4; scene 10 lasts 0.34 s (a flash, not a shot) and scene 1 0.58 s. Fix: remove or merge sub-0.5 s scenes.
2. Cuts on beat only 22% (chance 22%) although film-B html v2 (same cue-sheet family) reaches 62%: the music/cut alignment of this version was lost. Fix: rebuild with build_sound and the bar grid; expected 60%+ on beat.
3. Only 11% on bar downbeats (chance 6%): same fix as 2.
4. Sparse scenes: 2.4 elements per scene (ref 3.0-4.7).
5. Music 112 BPM, a bit slow for this cut rate; energy arc 1.13/0.95/0.92 is flat (references 1.0/1.06/0.78): let the middle build and the outro relax.

## Full report
```
PACING film-C social v51  (1080x1920, 19.7 s, ratio 9x16, profile story=story-reels, n_ref=14)  [advisory]
metric                       ours      ref p25..p75     verdict
median shot length (s)       1.79      1.45..4.24       ok
cuts per 10 s                4.58      2.12..3.44       too fast
cuts in first 3 s            2         >= 1 typical     ok
elements per scene           2.40      3.02..4.71       sparse
build time median (s)        0.85      0.6..3.31        ok
hold time median (s)         0.25      0.23..0.44       ok
energy intro/mid/outro       1.13/0.95/0.92 1.01/1.06/0.78   ok (arc present)
tempo (bpm, from mix)        112.30    113.6..136.0     slow music
cuts on beat (60 ms)         22%       chance 22%, ref 34% near chance: cuts not beat-locked
cuts on bar downbeat         11%       chance 6%        near/below chance: cuts not bar-locked
loudness LUFS / RMS arc dB   -14.1     -16.0/-17.8/-16.9
scenes (start-end, len, elements, build, hold):
   1  0.00- 0.58 len 0.58 el  1 build 0.42 hold 0.17
   2  0.58- 2.20 len 1.62 el  1 build 0.17 hold 1.45
   3  2.20- 4.17 len 1.97 el  3 build 1.55 hold 0.42
   4  4.17- 7.42 len 3.25 el  8 build 3.08 hold 0.17
   5  7.42-10.67 len 3.25 el  3 build 1.17 hold 2.08
   6 10.67-14.58 len 3.92 el  1 build 0.25 hold 3.67
   7 14.58-15.62 len 1.04 el  2 build 0.75 hold 0.29
   8 15.62-18.29 len 2.67 el  3 build 2.46 hold 0.21
   9 18.29-19.33 len 1.04 el  1 build 0.96 hold 0.08
  10 19.33-19.67 len 0.34 el  1 build 0.17 hold 0.17
note: hold = last element appearance -> next cut (proxy); readability floor uses scene length minus build time.
```
