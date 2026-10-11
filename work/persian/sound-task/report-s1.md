Report s1 — Picture analysis (docs/PERSIAN-SOUND-SPEC.md §1)

Did:
- Created scripts/persian-sound/analysis.py: decode_frames(path, fps=30) decodes via ffmpeg
  rawvideo pipe (grayscale, 96x54, fps filter), returns 3-frame-box-smoothed motion energy
  m[f]=mean(|f-fprev|), m[0]=0. detect_cues(energy, fps) computes onset o[f]=max(0,m[f]-median(m[f-6:f])),
  threshold 0.6*median(top-5 o)*0.5, local maxima >=5 frames apart, max 16 cues strongest-first,
  classifies impact (s>=0.70, sharp), whoosh (rises >=5 frames), tick (>=4 small cues, CV<0.35),
  pop (else), plus intro (first cue >0.25 s) and outro (last 12 % static).
- Created scripts/persian-sound/test_analysis.py: unittest, synthetic lavfi clip (3 s black with
  three 2-frame white flashes at 0.5/1.5/2.5 s via geq) + static-clip negative test + field test.
- Python 3.14 + numpy 2.5.2 + ffmpeg 7.1 only. No other dirs touched; no git commands.

Acceptance 1: `python scripts/persian-sound/test_analysis.py` -> 4 tests OK:
  test_cue_fields ... ok / test_detects_three_flashes ... ok / test_motion_energy_length_and_range ... ok /
  test_static_video_has_no_cues ... ok — Ran 4 tests in 0.440s — OK

Acceptance 2: `python scripts/persian-sound/analysis.py work/persian/out/radial-wave/RadialWave.fa.mp4` printed:
  frame 0,   time 0.000, kind intro,  strength 0.0
  frame 75,  time 2.500, kind whoosh, strength 0.686
  frame 86,  time 2.867, kind whoosh, strength 1.0

Doubts:
- The clip appears to end around frame 90 (short render?), so its last 12 % (11 frames) is not fully
  static relative to the rest and no outro cue fired — consistent with the spec's static-tail rule.
- Cue at 2.5 s classified whoosh (energy ramps over 5 frames pre-peak), the strongest at 2.867 s also
  whoosh; no impact because the pre-peak energy stays >= 25 % of the peak (soft ramps, not cuts).
- Windows Git Bash quirk: relative paths failed while a session cwd was inside scripts/persian-sound;
  all file writes used absolute /d/P/... paths. Also the sandbox rejects heredocs containing "{..."
  dict literals, so the code uses dict() constructors — cosmetic only.
