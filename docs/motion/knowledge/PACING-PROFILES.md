# PACING-PROFILES (measured from 38 reference templates)

Source: work/viditor-reference (38 previews + music), tool `sound/.venv/Scripts/python.exe work/persian/tools/pacing/analyze_refs.py`, data `ref-pacing.json` (per template) and `ref-pacing-summary.json` (p25/median/p75 per style and ratio).
Method: ffmpeg scene detect 0.3 + 24 fps frame-diff spikes + soft-cut detector (change across +-0.25 s); motion energy per 0.25 s; "elements" = frame-diff peaks in the central band; librosa tempo/beats on the m4a; bar phase by onset strength.
Limits: previews are 480x270; hold/build are PROXIES (last element appearance -> next cut); bar detection is approximate; verdicts are advisory.

## Per style (medians; p25..p75 in the json)
| style | n | shot (s) | cuts/10 s | elements/scene | build (s) | hold (s) | cuts on beat | on bar | LUFS | energy intro/mid/outro |
|---|---|---|---|---|---|---|---|---|---|---|
| promo-teaser | 15 | 3.96 | 1.99 | 4.0 | 1.83 | 0.25 | 22% | 0% | -11.2 | 1.03/1.02/0.97 |
| story-reels (9:16) | 14 | 2.59 | 2.92 | 3.8 | 1.54 | 0.27 | 34% | 9% | -11.9 | 1.01/1.06/0.78 |
| typography-motion | 5 | 4.38 | 1.66 | 4.7 | 2.79 | 0.29 | 14% | 0% | -10.0 | 1.09/0.99/0.74 |
| slideshow | 3 | 2.50 | 3.01 | 3.7 | 0.83 | 0.21 | 19% | 0% | -10.4 | 0.74/1.30/0.96 |
| logo-reveal | 1 | 3.04 | 2.58 | - | 2.54 | 0.46 | 67% | 33% | -12.2 | 0.94/1.74/0.32 |

By ratio: 16:9 (25 films) shot 3.96 s, 2.1 cuts/10 s; 9:16 (13 films) shot 2.54 s, 2.7 cuts/10 s, cuts on beat 38%.
Chance level for "within 60 ms of a beat" is about 22-24% at 118 BPM and about 6% for a bar downbeat: the references are mostly NOT beat-locked (median 22-34%), so beat-lock is a quality edge, not a genre rule; 9:16 stories are the most beat-aware.

## Named Tier-A (7000, 6873, 7125 typography; 5925, 7097 9:16 story; 5961 teaser)
- Typography (16:9, 31-43 s): shot 2.6-6.5 s, 1.3-3.0 cuts/10 s, tempo 112-144 BPM, elements 8-37 per scene (rich word-by-word builds), cuts mostly free of the beat.
- 9:16 stories (24-27 s): shot 2.0-3.0 s, 1.7-2.6 cuts/10 s, 112-136 BPM, 29-50% cuts on beat.
- 5961 teaser (42 s, best executed): six near-equal 5.8-6.0 s scenes (1.4 cuts/10 s), 67% of cuts on beat, calm first scene (energy 0.49) then 1.25 twice: slow hook, steady build.

## Defaults for our films (derived)
- 9:16 story/ad: median shot 2.0-3.5 s, 2-3.4 cuts/10 s, build 0.6-3 s, 3-5 elements per scene.
- 16:9 teaser: median shot 3-5 s, 1.6-2.8 cuts/10 s; typography announcement: 1.5-2.4 cuts/10 s, build 2-4 s.
- Energy arc: intro ~1.0, middle 1.0-1.1, outro 0.75-1.0 (never a near-silent last third: ours 0.35-0.58).
- Hold: references hold only ~0.25 s after the last element (they are template previews); for Persian reading use floor 0.6 s + 0.045 s per character.
- Loudness: references master at about -11 LUFS; our -14..-15 (TV/social safe) is deliberate, not a defect.
- Shot length is a range, not a target: 3 of our 4 films cut faster than the reference p75 (3.2-4.6 vs 2.1-3.4 cuts/10 s).

## How our four films compare (docs/motion/ledger/pacing-*.md)
All four cut faster than the profile; three are not beat/bar-locked (only the html v2 build, made with the sound tool, reaches 62% on beat); the conference teaser has a 5.8 s static tail and no cut in the first 3 s.
