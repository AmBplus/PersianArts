// letterspace-materialize — Persian / RTL localization (faithful to upstream motion: START 16, DUR 52, easeInOut,
// all strokes begin on the same frame and finish on the same frame, pathLength-normalised dash growth, glow on completion).
//
// TEXT: the only "text" is the SVG skeleton wordmark SUPERHUMAN (10 hand-drawn Latin glyphs). Localized to the Persian
//   wordmark «ابرانسان» (idiomatic equivalent of "superhuman"), re-drawn as monoline skeleton strokes in a geometric
//   Kufic-like construction, same stroke weight/round caps/glow as the original. It is drawn, not typed, so no font runs.
// SHAPING: Persian letters join, so tracking (letter-spacing) is NOT applied. The "large letter-space" identity is kept
//   the Persian way: the word is split at its natural joining breaks into 5 connected groups  ا | بر | ا | نسا | ن
//   (exactly what joinedGroups() would give) and the groups are set apart with wide, even gaps; inside each group the
//   letters stay connected on the baseline. Dots (ب below, ن above) are short strokes drawn in the same parallel pass.
//   Each group is ONE continuous path => continuity ("written, never masked") and sync (same p for every path) preserved.
// DIRECTION:
//   - Baseline/bowl strokes run right -> left (Persian pen direction);
//     alif verticals are drawn bottom->top like the original verticals (physical pen gesture, kept).
//   - Word order: first letter (ا) is right-most; because all groups draw in parallel there is no stagger to mirror.
//   - Dusk afterglow ellipse: was pinned right:130 -> now left:130 (asymmetric light accent mirrors with the layout, so the
//     glow sits on the end side of the reading line as before relative to the word start). Horizon band is full-width
//     symmetric: kept. Background gradient is vertical (178deg): physical sky, kept.
//   - Glow/shadow is omnidirectional (0 offset): kept.
// FONT: none rendered (vector wordmark). Mood reference if it ever becomes live type: Noto Kufi Arabic (geometric, calm).
// RASTER: none in this demo. LEFTOVERS: no Latin/Chinese text on screen; no letterSpacing/uppercase in code.
// NOTE: the registry duration for this card is 15 f but the design is ~100 f (15 rest + 52 draw + >=30 hold);
//   inspect later beats with render-card.mjs --duration, no frame offsets are edited here.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

// Skeleton strokes, viewBox "300 60 760 220", baseline y=190, alif height 100. Groups listed in reading order (right first).
const STROKES: string[] = [
  // ا
  'M 1030 190 L 1030 90',
  // بر : tooth + baseline + descending ر tail
  'M 950 148 L 950 190 L 830 190 C 812 190, 810 225, 795 245 C 790 252, 780 252, 775 248',
  // dot of ب (below)
  'M 884 224 L 896 232',
  // ا
  'M 715 190 L 715 90',
  // نسا : ن tooth, three sharp س teeth, joined final alif
  'M 640 156 L 640 190 L 620 190 L 612 168 L 600 190 L 584 190 L 576 168 L 564 190 L 548 190 L 540 168 L 528 190 L 505 190 L 505 90',
  // dot of ن (above tooth)
  'M 634 122 L 646 130',
  // ن (isolated): bowl
  'M 435 176 A 55 66 0 0 1 325 176',
  // dot of ن (above bowl)
  'M 374 124 L 386 132',
];
const DOTS = new Set([2, 5, 7]);

const START = 16;   // all strokes start on the same frame (no stagger)
const DUR = 52;     // all strokes finish on the same frame

export const LetterspaceMaterialize: React.FC = () => {
  const frame = useCurrentFrame();

  const p = interpolate(frame, [START, START + DUR], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const doneGlow = interpolate(frame, [START + DUR, START + DUR + 8], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const glowAmt = p >= 1 ? doneGlow : p > 0.7 ? (p - 0.7) / 0.3 : 0;

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(178deg, #2c2a55 0%, #3d3465 30%, #241f40 58%, #0e0c1e 100%)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* dusk horizon band (symmetric, kept) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 470, height: 170,
        background: 'linear-gradient(180deg, rgba(232,150,170,0) 0%, rgba(226,140,165,0.20) 45%, rgba(120,100,170,0.12) 75%, rgba(0,0,0,0) 100%)',
        filter: 'blur(20px)',
      }} />
      {/* afterglow accent: mirrored from right:130 to left:130 */}
      <div style={{
        position: 'absolute', left: 130, top: 330, width: 560, height: 200,
        background: 'radial-gradient(ellipse at center, rgba(216,120,160,0.16) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(26px)',
      }} />
      <svg width={1100} height={304} viewBox="300 60 760 220" style={{ overflow: 'visible', display: 'block' }}>
        {p > 0 && (
          <g
            fill="none"
            stroke="#f4f2f8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 ${6 + glowAmt * 10}px rgba(240,235,255,${0.35 + glowAmt * 0.35}))`,
            }}
          >
            {STROKES.map((d, i) => (
              <path
                key={i}
                d={d}
                strokeWidth={DOTS.has(i) ? 9 : 6.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - e}
              />
            ))}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
