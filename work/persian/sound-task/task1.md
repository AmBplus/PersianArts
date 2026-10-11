You are implementing a tool in the repository D:\P\project\persianArts (run all commands from that root). No human is present: do not ask questions, decide and finish. Never run git.

Read docs/PERSIAN-SOUND-SPEC.md completely (it is the binding spec written by the lead; follow its algorithms, numbers, file names and CLI). Then implement it:

1. scripts/persian-sound/make_sound.py  (picture analysis -> cue list -> deterministic synthesis of music + SFX -> loudnorm -> mux; writes <out>.mp4, sound/<Stem>.json, sound/<Stem>.wav, sound/<Stem>.spec.png when --debug-dir is given)
2. scripts/persian-sound/profiles.json (the eight profiles of section 2 as data: bpm range, scale in cents or semitones, layer gains, swing, motif rules, mapping from category/tags to profile)
3. scripts/persian-sound/batch.py (all approved/fixed cards from work/persian/progress.json; category/tags from work/upstream/src/gallery/api/library.json; outputs next to the inputs as <Stem>.fa.sound.mp4; skip existing unless --force; print a one-line summary per clip)
4. scripts/persian-sound/verify_sound.py (the objective gates of section 4; exit code 1 on failure, JSON verdict on stdout)
5. scripts/persian-sound/test_sound.py (unittest: determinism, cue detection on a synthetic video made with ffmpeg lavfi, loudness gate, duration match)
6. scripts/persian-sound/README.md

Hard constraints: Python 3 + numpy + ffmpeg/ffprobe only (no pip installs); deterministic (seeded RNG); never modify files outside scripts/persian-sound/ (you may READ everything; write generated samples only under work/persian/sound-task/samples/). Keep the code readable, modular (analysis.py, synth.py, mix.py, io_utils.py are fine as extra modules in the same folder).

Procedure: build step by step and run it. First test on a synthetic video (ffmpeg lavfi testsrc2 with a few flashes), then on three real clips: work/persian/out/radial-wave/RadialWave.fa.mp4, work/persian/out/list-reveal/ListReveal.fa.mp4 and work/persian/out/svg-shape-morph/SvgShapeMorph.fa.mp4 (outputs into work/persian/sound-task/samples/). Run verify_sound.py on each output and fix the code until all gates pass, and run the unit tests. Finally write work/persian/sound-task/report1.md with: files created, test output, the three verify JSON verdicts (paste them), the detected cue lists, the profile each clip got and any spec deviations or doubts. If something in the spec is impossible, choose the closest sound option and say so in the report.
