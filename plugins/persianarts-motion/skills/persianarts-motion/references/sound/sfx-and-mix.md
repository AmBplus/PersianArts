# SFX and mix

## Placement

- SFX attach to **ingredient events** (`land`, `settle`, `swap`, `tick`…) via each ingredient's `sfx` map and the
  theme's SFX family, plus explicit `hits[]` in `film.json`. Picture and sound read the same file, so they cannot drift.
- Short hits (pop, click, impact, tick): the attack lands on the visual hit, or 10–20 ms before it. Swells
  (whoosh, riser): align the sound's *peak* with the moment of greatest visual change (usually the cut), so the file
  starts roughly 150–400 ms earlier.
- Restraint: when the music's drums are dense, SFX only mark actions the music doesn't (a stamp, a counter tick, a
  paper slap). Silence before the climax makes it land. Average ≤ 1 SFX per beat.
- One dominant SFX family per film (paper, glass, mech, soft UI…), matching the theme's material.

| Type | Use | Length | Level (dBFS peak of the SFX before master) |
|---|---|---|---|
| whoosh / swish | transitions, camera whips | 300–500 ms | −18…−12 dB |
| pop / pluck | text or item appears | < 200 ms | −15…−12 dB |
| click / tap | UI interactions | < 100 ms | −20…−15 dB |
| riser | build into a reveal | 1–3 s | −18…−12 dB |
| impact / hit | key reveal, big number (2–3 per film) | < 300 ms | −12…−6 dB |
| tick | counters, step lists | < 80 ms | −22…−16 dB |

## Mix

- Music bed alone: around −16…−14 LUFS short-term at its loudest section.
- Under voice-over: duck music 12–20 dB (≈ 18–20 dB below voice for dense educational content); cut 2–4 kHz on the
  music bed for speech clarity.
- Master: −14 LUFS integrated, true peak ≤ −1.5 dBTP, 48 kHz.
- Deliver a version without music when the brief has music (SFX + voice only), same edit.

## Verify

`pa check-sync out/final.mp4` reports, per cut and hit, the offset from its intended beat (report audio-truth error and
render offset separately). Target ≤ 2 frames, fail > 3.
