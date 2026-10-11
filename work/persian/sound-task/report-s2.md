# report-s2 - synth parts of PERSIAN-SOUND-SPEC S1 SFX + S2 Music

## What I did
- scripts/persian-sound/synth.py: numpy-only synthesis - kick, clap, hat, bass
  (saw+sub, LPF 280 Hz), pad (3 detuned saws, 0.25 s attack, LPF 1.2 kHz), pluck
  (Karplus-Strong karplus/setar, additive marimba), sparkle, impact, whoosh
  (time-varying band-pass noise sweep), tick, pop (880->440 Hz in 60 ms), riser,
  small Schroeder reverb (4 combs + 2 allpass, wet param), fnv1a-seeded RNG,
  note parser (incl. cent offsets like E4-50), write_wav, and
  render_phrase(profile, dur, seed) - sting-style attack/groove/resolve with
  profile layers, swing, resolve chord + 0.45 s tail, 60 ms/40 ms fades.
  No mixer/CLI/muxing written.
- scripts/persian-sound/profiles.json: 8 profiles as data - clean-tech,
  cinematic, punchy, editorial, persian-shur (Shur scale with E-50 cents, setar
  ornament, drone D+A, no kick), playful (swing 0.54, marimba, pops),
  transition (riser-forward), default fallback (= clean-tech).
- scripts/persian-sound/test_synth.py (unittest): renders 15 instrument cases
  and all 8 profile 4-second phrases to work/persian/sound-task/samples/*.wav;
  asserts finite, peak <= 0.99, silent first/last samples, byte-identical WAV
  for the same seed (and different output for a different seed).

## Acceptance run
Command: python scripts/persian-sound/test_synth.py
test_all_instruments (...) ... ok
test_note_hz (...) ... ok
test_all_profiles_4s (...) ... ok
test_deterministic_same_seed (...) ... ok
Ran 4 tests in 27.840s
OK
Phrase WAVs (4.45 s each, peaks): cinematic 0.221, clean-tech 0.216,
default 0.204, editorial 0.179, persian-shur 0.241, playful 0.164, punchy 0.122,
transition 0.208 - all far below the 0.99 clip gate.

## Doubts
- Only 7 named profiles exist in the spec table; added an 8th "default" entry
  (fallback = clean-tech) to satisfy "eight profiles".
- Filters are FFT-based approximations (spec's 1-pole LPF / band-pass emulated);
  deterministic and dependency-free, fine for a sting cue.
- Phrase render schedules music layers only; picture-cue locking (beat snapping)
  belongs to the future mixer per spec S2 and is not implemented here.
- Fixed two bugs found by the test run: negative-time placement in place(),
  and a wrong expected value in the note-parser test.
