// PERSIAN (RTL) localization of shotcraft "stroke-segment-build" (断笔成字, Alien-title style) — timing, easing, pulse, order logic untouched.
//
// WHAT CHANGED AND WHY
//  - Title word: "SHIP" -> «عرضه» (the Persian product-launch verb for "ship"; 4 letters like the original, and a word the audience
//    recognises, which the card's pitfalls demand). Persian letters are connected curves, so the hand-drawn straight line segments
//    (stroke 44, butt caps) cannot be reused: the real word is typeset ONCE (Vazirmatn 900, 400px) and 16 disjoint rectangular
//    fragments of its ink are revealed by clip-path (inset) in a scrambled order. Cuts leave ~10px gaps (the original's segments were
//    also disjoint, with gaps), so the word is never split into code points: every fragment is a slice of correctly shaped text.
//  - Fragment slide: still 12px along the fragment's own stroke axis (butt-cap slide in the original). Vertical fragments keep the
//    top->bottom travel (physical); horizontal fragments now travel right->left (the original travelled left->right = reading
//    direction in Latin, so it mirrors with the reading direction in Persian).
//  - ORDER keeps the design logic mirrored: first 13 fragments jump across letters (unreadable), the last 3 are "key" fragments
//    (first-letter ع bowl, ر tail, ض dot) so recognition lands on the last beats. Same FIRST/STEP/SEG_IN/LAST_LAND/pulse/transformOrigin.
//  - Composition is symmetric (word centered, caption centered): nothing else to mirror. Word block is centered by flex so RTL does
//    not move it; the pulse origin 50% 55% is symmetric and kept.
//  - Caption «STROKE SEGMENT BUILD» -> «ساخت واژه از پاره‌خط‌ها»: letterSpacing 2 removed and uppercase/Helvetica 800 replaced by
//    Vazirmatn 800 (variable font, real bold), size 44 -> fs(44).
//  - FONT: Vazirmatn (900 for the word: uniform heavy monoline strokes read as the "thick stroke segments" of the original;
//    Lalezar was too blobby, Reem Kufi's ه was illegible when cut). Loaded through FaRoot.
//  - No raster assets, no digits, no Latin text left.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs } from '../../_fa';

// Fragment = rectangle of the typeset word in canvas px (x0,y0,x1,y1) + travel axis of its slide-in.
// Cuts are inset by 5px on every side so neighbours are 10px apart (disjoint "broken strokes").
type Seg = { x0: number; y0: number; x1: number; y1: number; axis: 'h' | 'v' };

const GAP = 5;
const R = (x0: number, y0: number, x1: number, y1: number, axis: 'h' | 'v'): Seg => ({
  x0: x0 + GAP, y0: y0 + GAP, x1: x1 - GAP, y1: y1 - GAP, axis,
});

// ع (rightmost) -> ر -> ض -> ه (leftmost), canvas coordinates of the word at 400px, centered.
const SEGS: Seg[] = [
  R(1250, 420, 1410, 535, 'h'), // 0  ع head (top hook)
  R(1160, 420, 1250, 640, 'v'), // 1  ع left bowl                       [key]
  R(1250, 535, 1330, 640, 'h'), // 2  ع base, inner
  R(1330, 535, 1410, 640, 'h'), // 3  ع base, tail
  R(1085, 480, 1160, 640, 'v'), // 4  ر stem
  R(1010, 640, 1200, 760, 'h'), // 5  ر tail                            [key]
  R(960, 435, 1065, 540, 'v'),  // 6  ض right bowl, top
  R(960, 540, 1065, 645, 'v'),  // 7  ض right bowl, bottom
  R(830, 440, 960, 540, 'h'),   // 8  ض left, top
  R(830, 540, 960, 645, 'h'),   // 9  ض left, bottom
  R(890, 345, 1025, 435, 'v'),  // 10 ض dot                             [key]
  R(725, 410, 830, 645, 'v'),   // 11 ه right stem
  R(620, 410, 725, 545, 'v'),   // 12 ه top
  R(510, 420, 620, 645, 'v'),   // 13 ه loop (left)
  R(620, 545, 725, 645, 'h'),   // 14 ه base, right
  R(725, 575, 830, 645, 'h'),   // 15 ه base, joint to ض
];

// Scrambled lighting order (same logic as the original): 13 jumps across letters, then the 3 key fragments (1 / 5 / 10).
const ORDER = [13, 3, 7, 12, 4, 0, 9, 14, 6, 11, 2, 15, 8, 5, 10, 1];

const FIRST = 14; // first fragment start frame
const STEP = 6; // gap between fragments
const SEG_IN = 6; // entrance duration
const LAST_LAND = FIRST + 15 * STEP + SEG_IN; // = 110, last fragment lands
const PULSE_END = LAST_LAND + 8;

const SLIDE = 12;

const WordBlock: React.FC = () => (
  <div
    style={{
      position: 'absolute', left: 460, top: 330, width: 1000, height: 420,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Vazirmatn", sans-serif', fontWeight: 900, fontSize: 400, lineHeight: 1,
      letterSpacing: 0, color: G.panel,
    }}
  >
    عرضه
  </div>
);

export const StrokeSegmentBuild: React.FC = () => {
  const frame = useCurrentFrame();

  // Last fragment lands: whole-word pulse 1 -> 1.06 -> 1 (8f)
  const pulse = interpolate(
    frame,
    [LAST_LAND, LAST_LAND + 3, PULSE_END],
    [1, 1.06, 1],
    { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <div style={{ width: 1920, height: 1080, background: G.ink, overflow: 'hidden', position: 'relative' }}>
      <FaRoot family="Vazirmatn">
        <div
          style={{
            position: 'absolute',
            top: 100,
            width: '100%',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: fs(44),
            lineHeight: 1.5,
            color: G.mid,
            letterSpacing: 0,
          }}
        >
          ساخت واژه از پاره‌خط‌ها
        </div>
        <div
          style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${pulse})`, transformOrigin: '50% 55%' }}
        >
          {SEGS.map((seg, i) => {
            const rank = ORDER.indexOf(i);
            const start = FIRST + rank * STEP;
            if (frame < start) return null; // not started: not rendered (not opacity 0)
            const t = interpolate(frame, [start, start + SEG_IN], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // Slide 12px along the fragment's stroke axis: vertical = top->bottom (physical), horizontal = right->left (reading dir).
            const slide = SLIDE * (1 - t);
            const tx = seg.axis === 'h' ? slide : 0;
            const ty = seg.axis === 'v' ? -slide : 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: 0, top: 0, width: 1920, height: 1080,
                  clipPath: `inset(${seg.y0}px ${1920 - seg.x1}px ${1080 - seg.y1}px ${seg.x0}px)`,
                  transform: `translate(${tx}px, ${ty}px)`,
                  opacity: t,
                }}
              >
                <WordBlock />
              </div>
            );
          })}
        </div>
      </FaRoot>
    </div>
  );
};
