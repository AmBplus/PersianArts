# Payoff A1 report (Hook stamp + Count clock + pen spark)

**Changed:** `work/persian/src/film/social/scenes.tsx` only (+ one helper `inCubic` in `motion.ts`). CUT_BEATS untouched.

1. **Hook 'زشته؟' (cue kept at f15/BEAT):** replaced `stomp` with `stampIn` — pre-hit lift (scale 1.9→1, inCubic, frames H−8…H, opacity in 2 f), contact squash (scaleY 0.9) + 1.04 overshoot settling by H+4; screen shake reduced 30→~10 px (0.043·`L.type.hero`); ink splat = 7 ellipses, max r 0.25·`L.type.hero`, grow outExpo(15,8), fade 22–40, drawn in an overlay SVG above the text so it shows over the ink block; stays inside hookText on all 4 ratios.
2. **Hook 'دست‌خطت' (f3):** same stamp-in, smaller (splat r 0.16·hero, shake 0.035·hero ≈8 px).
3. **Count:** ring `prog(f,4,44)` → FULL at H=48 (was 56 = under the wipe), held to 60; crown rect wrapped in `<g>` with `shake(f,48, min(W,H)·0.0093, 8)` + 2-frame ±3° tilt; all inside wipe-safe (shake ends 56, wipe starts 115 abs). **Bug found & fixed:** at ring=1 the old arc path degenerated (start=end) so the yellow ring vanished exactly at the new hit; ring≥1 now draws a full `<circle>`.
4. **Tick 3 at f45:** no visual/code reference exists at 45 (it lives only in the v4 cue sheet) — nothing to remove here; removal belongs to Order B.
5. **Pen spark:** `prog(f,36,12)` → `prog(f,34,12)` (starts on the morph hit).
6. All new px magnitudes derive from layout (`L.type.hero`, `min(L.W,L.H)`), no hardcoded 1080 values.

**Acceptance:** 32/32 stills in `media/film-versions/pencil-social/_stills-payoff/A1/` (4 ratios × frames 14/16/18/22 Hook-local and 106/108/110/114 abs = Count local 46/48/50/54, offsets verified: Count = cut 60), all non-empty, Persian text renders correctly, no overflow. `npx tsc --noEmit -p .` in workbench: clean; direct strict tsc on film/social files: clean (no errors, old or new).

**Deviations:** (a) splats drawn above the text (brief implies on the edge; the ink block hid them otherwise); (b) full-circle fix in SceneCount required by the retimed ring; (c) shake visibly peaks from f49 since the damped sine is 0 at H exactly — still "starts at the fill frame".
