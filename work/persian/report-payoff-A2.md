# Payoff A2 report (Daily ring pulses + day-7 accent, CTA bow settle + ring-out, film +1 s)

**Changed:** `src/film/social/motion.ts` (CUT_BEATS 34→36 + comments) and `src/film/social/scenes.tsx` (SceneDaily, SceneCta only; A1 work untouched).

1. **Daily:** every tick (rows 1-6, local 22/29/36/43/50/57) now emits a mint ring-pulse — radius rowH*0.3→rowH*0.9, outExpo over 14 f, opacity 0.5→0, stroke max(2.5, rowH*0.03), centred on the tick (r.x+rowH*0.35, w.y). **Day 7 (local 64):** two coral rings (2nd +4 f, max rowH*1.3) + check scale 1.35*outBack — pop is 0 at 64, overshoots ~1.49 mid-way, settles at 1.35 by 72. All magnitudes in rowH/L units.
2. **CTA:** bow settle kept at H=98 (down 74-83, up outBack 89-98); at 98 the frame is a clean settled pose. Ring-out: 3 staggered rings (coral/mint/paper, +0/+3/+6 f) expand from the pen base to min(W,H)*0.55, done by ~124; full-frame paper flash 0→0.25 (98-101), eased back to bg over 120-132. Pill beat pulse damped to zero by 98 → **no motion after the ring-out; calm hold to the end**.
3. **Duration:** CUT_BEATS last 34→36 → CTA scene 135 f, film 540 f (18 s); DURATION_FRAMES/entry Composition/SocialFilm sequences all derive from it, so it holds at any BPM/T0_S; the extra second is absorbed by the still hold (motion ends ~124-132).

**Acceptance:** `remotion compositions` → all four (Social9x16/1x1/4x5/16x9) list **540 f / 18.00 s** at default props. 36/36 stills (4 ratios × Daily abs 362/364/366/370 = local 62/64/66/70, CTA abs 501/503/509/525/539 = local 96/98/104/120/134; offsets verified: Daily cut=300, CTA cut=405) in `media/film-versions/pencil-social/_stills-payoff/A2/`, all non-empty. `npx tsc --noEmit -p .` in workbench: clean.

**Observed, not fixed (minor):** (a) at 1:1 the pen nib passes over the day-7 tick spot for ~2 f around local 64 (tick fully visible from 66); (b) day-7 rings by design exceed the row band (rowH*1.3 > rowH/2) and graze row 6 / bottom margin while already at low opacity; (c) f503 and f539 are pixel-identical per ratio (both are full-rest poses — expected); (d) Persian text renders correctly, no clipping or overflow seen.
