# progress — s10 + s11 film-fix v2 (fix-round-1)

one line per finished step, rewritten at every step.

- step 00: read both QC reviews (s10 review-1.md, s11 review-1.md) and both film.html sources; treated their findings + the parent's additional defects A–F as the work order.
- step 01: read the gate sources read-only (empty-band, edge-touch, duplicate-template, hero-size, dead-frames, run-gates, lib.sceneStartsInfo) to know the exact thresholds and how scene starts are resolved.
- step 02: s10 film.html patched in place — F1 LTR-isolated Persian tolerance token, F2 number exit f258-270, F3 partner row at CUTS[8]+22, F4 floor structure + finale truss/pallet, F5 header frame table corrected, F6 CUT scene copy. FIX LOG block added to the top comment.
- step 03: s10 events.json reconciled to FPB=15 (cut_frames [0,60,120,180,240,330,420,510,540], all event frames rewritten).
- step 04: s11 film.html patched in place — G1 label moved inside its pill + chip moved clear of all glyphs, G2 9:16 hero re-wrapped to three lines at size 200/200/216, G3 finale camera push + coral rule sweep + tap ring, G4 ruled paper grid. FIX LOG block added.
- step 05: s11 events.json reconciled (quiet cut at 228 not 222, every declared event given a frame, cut list declared as wipes).
- step 06: syntax check of both patched films (node --check on the extracted script) → SYNTAX OK for both; sceneStarts now resolves 9 cuts for s10 and 9 for s11 (was 6/1).
- step 07: v2 output dirs created; four captures launched sequentially (one at a time) into media/film-versions/<label>/v2/.
