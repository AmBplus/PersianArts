// Persian RTL localization of palette-theme-ripple (⌘K command palette → dark-mode ripple).
// Per-element decisions and reasons:
// - Query text: the Latin query "dark" becomes «تیره», typed RIGHT-TO-LEFT on the SAME four cue
//   frames (38/46/54/62). The visible text is a single prefix-sliced run (typeOn-style), so
//   Persian shaping re-flows correctly at every frame. The whole run pops with the original
//   back(2.2) overshoot scale on each cue, so every beat still reads as a "hit" — per-letter
//   transform boxes would need inline-block and would break letter joining (kit rule).
// - Cursor: the input text cell is shrink-wrapped (NO fixed minWidth), so the blinking caret
//   sits directly LEFT of the last typed letter — the RTL typing end, mirroring the original's
//   caret-after-last-block in LTR. Blink cadence (every 8f) unchanged.
// - ⌘K badge: kept as an isolated LTR keyboard token (keyboard notation is universal); in the
//   RTL flex row it now sits at the RIGHT edge, i.e. the reading start.
// - Dashboards (light + dark): both layers are mirrored with scaleX(-1) so the sidebar rail and
//   card reading order sit on the RTL side. The skeleton is textless gray geometry (no glyphs),
//   so a mirror is visually identical to relaying it out RTL and keeps the light/dark layers
//   pixel-aligned — the sweep reads as "the same UI re-skinned". The light layer is dimmed +
//   blurred and conditionally unmounted once the ripple completes (true rest).
// - Ripple origin (960,470), white flash dot, circular clip and bright ring: kept pinned and
//   UNCHANGED — the panel is horizontally centered, so the shrink point = ripple origin stays
//   exact, and a circle/ring is radial and symmetric (no reading direction to mirror).
// Font: Vazirmatn (variable 100–900) — neutral product-UI sans with reliable Persian shaping,
//   Persian digits and ZWNJ coverage; fits the ⌘K command-palette product world.
// Raster handling: none; dashboards and panel are pure CSS geometry with no baked text.
// Beat map (identical to upstream): 0–15 light idle → 15–22 dim+blur → 22–30 panel drop-in
//   (back 1.9) → 38/46/54/62 type «ت / دی / دیر... / تیره» (one letter per cue, pop on run)
//   → 68 Enter → 68–73 panel shrinks to the flash point → 73–95 circular ripple + bright
//   ring → 95–170 true rest on dark UI. Constraint: RIPPLE=73 must equal the shrink-complete
//   frame and the origin must be the shrink point, or the causal chain breaks.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FakeDashboard } from '../../_fixtures/Fixtures';
import {FaFonts} from '../../_fa';

const DIM_START = 15;
const PANEL_IN = 22;
const TYPE_FRAMES = [38, 46, 54, 62]; // d a r k
const ENTER = 68;
const RIPPLE = 73; // shrink-complete frame = ripple start frame (composition-critical)
const RIPPLE_END = 95;
const ORIGIN = { x: 960, y: 470 }; // panel center = shrink point = ripple circle center
const MAX_R = 1250;

// Dark version of the G palette (hand-inverted mapping)
const D = {
  bg: '#1a1a1c', panel: '#232325', line: '#3a3a38', bar: '#6f6f6d',
  ink: '#e8e8e6', mid: '#7a7a78', card: '#262628', border: '#454543',
  side: '#0e0e10', sideBar: '#555553',
};

const DarkCard: React.FC<{ seed: number }> = ({ seed }) => {
  const titleW = 45 + ((seed * 37) % 40);
  const lines = 2 + (seed % 3);
  return (
    <div style={{ width: '100%', height: '100%', background: D.card, border: `2px solid ${D.border}`, borderRadius: 14, padding: 18, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: 16, width: `${titleW}%`, background: D.bar, borderRadius: 8 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 10, width: `${88 - i * 14 - (seed % 5) * 3}%`, background: D.line, borderRadius: 5 }} />
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: D.mid }} />
        <div style={{ height: 10, width: 64, background: D.line, borderRadius: 5 }} />
      </div>
    </div>
  );
};

// Dark dashboard pixel-identical in layout to FakeDashboard variant A — the sweep reads as "same UI, re-skinned"
const DarkDashboard: React.FC = () => (
  <div style={{ width: 1920, height: 1080, background: D.bg, display: 'flex', direction: 'ltr' }}>
    <div style={{ width: 220, background: D.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#8a8a88' }} />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ height: 12, width: `${60 + ((i * 29) % 35)}%`, background: D.sideBar, borderRadius: 6 }} />
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: D.panel, borderBottom: `2px solid ${D.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: 180, background: D.bar, borderRadius: 9 }} />
        <div style={{ marginLeft: 'auto', height: 36, width: 320, background: D.card, border: `2px solid ${D.line}`, borderRadius: 18, boxSizing: 'border-box' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: D.mid }} />
      </div>
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <DarkCard key={i} seed={i + 1} />
        ))}
      </div>
    </div>
  </div>
);

export const PaletteThemeRipple: React.FC = () => {
  const f = useCurrentFrame();

  // Dim + blur during the panel phase; the light layer is unmounted after the ripple completes
  const dim = interpolate(f, [DIM_START, DIM_START + 7], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Panel drop-in (back-out overshoot)
  const panelT = interpolate(f, [PANEL_IN, PANEL_IN + 8], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.9)),
  });
  // After Enter the panel shrinks to a point in 5f (ease-in, accelerating)
  const shrink = interpolate(f, [ENTER, RIPPLE], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const panelMounted = f >= PANEL_IN && f < RIPPLE;
  const panelScale = f < ENTER ? panelT : shrink;
  const panelDropY = f < ENTER ? interpolate(panelT, [0, 1], [-120, 0]) : 0;

// Typing beat: one Persian letter lands per cue frame (38/46/54/62). The visible text is ONE
  // shaped prefix run; the whole run pops with the original back(2.2) overshoot so each cue
  // reads as a hit (per-letter transforms would need inline-block and would break joining).
  const runPop = (cue: number) =>
    interpolate(f, [cue, cue + 4], [1.16, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(2.2)),
    });
  const typedCount = TYPE_FRAMES.filter((t) => f >= t).length;
  let lastCue = -1;
  for (const t of TYPE_FRAMES) if (f >= t) lastCue = t;
  const pop = typedCount > 0 ? runPop(lastCue) : 1;

  // Ripple: circle expands from the shrink point (ease-out, fast then slow), bright edge ring
  const r = interpolate(f, [RIPPLE, RIPPLE_END], [12, MAX_R], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const rippling = f >= RIPPLE && f < RIPPLE_END;
  const done = f >= RIPPLE_END;
  const ringOpacity = interpolate(f, [RIPPLE, RIPPLE_END], [0.95, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // Flash dot: highlight core ~3f around shrink completion (shows the ripple starts exactly at the shrink point)
  const dotOn = f >= ENTER + 2 && f < RIPPLE + 3;

  return (
    <FaFonts families={["Vazirmatn"]}><div style={{ width: 1920, height: 1080, background: D.bg, position: 'relative', overflow: 'hidden', direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
      {/* Light layer: conditionally unmounted after the ripple completes (true rest) */}
      {!done && (
        <div style={{ position: 'absolute', inset: 0, filter: dim > 0 ? `brightness(${1 - dim * 0.45}) blur(${dim * 6}px)` : 'none' }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)', direction: 'ltr' }}><FakeDashboard variant="A" /></div>
        </div>
      )}

      {/* Dark layer: revealed by a circular clip growing from the shrink point; full-bleed with no clip when done */}
      {(rippling || done) && (
        <div style={{ position: 'absolute', inset: 0, clipPath: done ? 'none' : `circle(${r}px at ${ORIGIN.x}px ${ORIGIN.y}px)` }}>
          <div style={{ position: 'absolute', inset: 0, transform: 'scaleX(-1)', direction: 'ltr' }}><DarkDashboard /></div>
        </div>
      )}

      {/* Ripple bright edge ring (radial + symmetric: unchanged by RTL) */}
      {rippling && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - r,
            top: ORIGIN.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,0.9)',
            opacity: ringOpacity,
            boxShadow: '0 0 40px rgba(255,255,255,0.5), inset 0 0 30px rgba(255,255,255,0.35)',
          }}
        />
      )}

      {/* White flash dot pinning the shrink point = ripple origin */}
      {dotOn && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - 11,
            top: ORIGIN.y - 11,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: '#ffffff',
            boxShadow: '0 0 46px 14px rgba(255,255,255,0.85)',
          }}
        />
      )}

      {panelMounted && (
        <div
          style={{
            position: 'absolute',
            left: ORIGIN.x - 340,
            top: ORIGIN.y - 130 + panelDropY,
            width: 680,
            height: 260,
            transform: `scale(${Math.max(panelScale, 0.001)})`,
            transformOrigin: 'center center',
            background: G.card,
            border: `2px solid ${G.border}`,
            borderRadius: 18,
            boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            padding: 24,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Input row: ⌘K badge (right = reading start) + typed Persian prefix + caret hugging the RTL typing end */}
          <div style={{ height: 62, border: `2px solid ${G.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box', direction: 'rtl' }}>
            <div style={{ padding: '6px 12px', borderRadius: 8, background: G.side, color: '#fff', fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 22, direction: 'ltr', unicodeBidi: 'isolate', flexShrink: 0 }}>⌘K</div>
            {/* Shrink-wrapped text cell: NO fixed width, so the caret sits directly left of the last typed letter */}
            <div style={{ color: G.ink, fontFamily: 'Vazirmatn, sans-serif', fontWeight: 600, fontSize: 38, lineHeight: 1, whiteSpace: 'nowrap', transform: `scale(${pop})`, transformOrigin: 'right center' }}>
              {'تیره'.slice(0, typedCount)}
            </div>
            {/* Caret: frame-determined blink (flips every 8f); RTL flex puts it LEFT of the text = typing end */}
            <div style={{ width: 4, height: 40, background: G.ink, opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0, flexShrink: 0 }} />
          </div>
          {/* 结果行：输入完成后首行加深表示选中 */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: i === 0 && typedCount === 4 ? G.line : G.panel, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', boxSizing: 'border-box' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: G.mid }} />
              <div style={{ height: 12, width: `${34 + i * 16}%`, background: G.bar, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}
    </div></FaFonts>
  );
};
