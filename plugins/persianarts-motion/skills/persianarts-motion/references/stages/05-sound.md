# Stage 5 — Sound

Read `../sound/sfx-and-mix.md`.

1. Generate the SFX track from events (`pa mix --sfx`): each ingredient event with an `sfx` mapping plus every
   `hits[]` entry. Use the theme's SFX family; one family dominant, at most two.
2. Prune: not every event deserves a sound. Keep the ones that land on beats and carry meaning; aim for ≤ 1 SFX
   per beat on average, silence before the climax.
3. Mix: music bed, SFX, voice-over (if any) with ducking; master to −14 LUFS integrated, true peak ≤ −1.5 dBTP.
4. Verify by measurement: `pa check-sync` — cuts and hits within 3 frames of their beats (target ≤ 2).
