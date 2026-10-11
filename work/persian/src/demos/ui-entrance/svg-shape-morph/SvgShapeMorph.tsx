// PERSIAN (RTL) localization of shotcraft "svg-shape-morph" — motion/timing/geometry untouched.
// Analysis (element by element):
//  - The morphing 140-point polar outline, per-point radius lerp, inOutCubic windows (0.08–0.42 / 0.58–0.92),
//    breath scale, ±4° self-rotation, hue drift 185°→305°: all PHYSICAL geometry with no reading-direction meaning
//    (radially symmetric lobes, whole-number rotation cycle returning to 0 at the last frame). KEPT as-is — mirroring
//    a rotationally symmetric organic form carries no Persian semantics; rotation direction of the drift is universal.
//  - Caption `morphTo(shapeB)` / `morphTo(shapeA)`: the source prompt explicitly flags this as a self-describing API
//    placeholder that should become semantic text in the final video. Translated to idiomatic Persian
//    «تبدیل به پیکرهٔ ب» / «تبدیل به پیکرهٔ الف». Shape labels use Persian letters (الف/ب) — natural for a Persian
//    audience; no Latin island remains, so no bidi isolation needed. Text is centered (textAnchor=middle), which is
//    direction-neutral; opacity cue (dimmest mid-morph) kept exactly.
//  - letterSpacing:'2px' (Latin mono tracking) removed — it destroys Persian joining; hierarchy kept via the caption's
//    muted colour/opacity. textTransform: none.
//  - Font: Vazirmatn (variable, neutral product-UI sans) — the caption is a quiet technical label on a dark techy
//    frame; Vazirmatn is the standard Persian UI voice here. Size fs(10)=11px (kit x1.1 compensation). Loaded via
//    FaRoot so it can never silently fall back.
//  - No raster assets in this card. No digits on screen.
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faText } from '../../_fa';

export const SVG_SHAPE_MORPH_DURATION = 156; // 5200ms @30fps

const CX = 240;
const CY = 138;
const N = 140;
const BASE = 76;

// دو پیکره: با همان تعداد نمونه‌نقطه (معادل هم‌ترازی نقاط morphTo)
const rA = (th: number) => BASE * (1 + 0.3 * Math.cos(th * 3) + 0.05 * Math.sin(th * 7 + 0.8));
const rB = (th: number) => BASE * (1 + 0.26 * Math.sin(th * 5 + 1.2) + 0.06 * Math.cos(th * 2));
const RAD_A: number[] = [];
const RAD_B: number[] = [];
for (let i = 0; i < N; i++) {
  const th = (i / N) * Math.PI * 2;
  RAD_A.push(rA(th));
  RAD_B.push(rB(th));
}

// درون‌یابی نقطه‌به‌نقطهٔ دو کانتور بر اساس ضریب m و ساخت path d
const build = (m: number) => {
  let d = '';
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r = lerp(m, RAD_A[i], RAD_B[i]);
    const x = (CX + Math.cos(th) * r).toFixed(1);
    const y = (CY + Math.sin(th) * r).toFixed(1);
    d += (i ? 'L' : 'M') + x + ',' + y;
  }
  return d + 'Z';
};

export const SvgShapeMorph: React.FC = () => {
  const t = useT();
  const m1 = seg(t, 0.08, 0.42, E.inOutCubic); // A → B
  const m2 = seg(t, 0.58, 0.92, E.inOutCubic); // B → A
  const m = m1 - m2; // 0=A 1=B
  const d = build(m);
  const hue = lerp(m, 185, 305);
  // نفس‌کشیدن مقیاس در میانهٔ تبدیل + چرخش آرام
  const breath = 1 + 0.045 * (Math.sin(m1 * Math.PI) + Math.sin(m2 * Math.PI));
  const rot = Math.sin(t * Math.PI * 2) * 4;
  return (
    <FaRoot family="Vazirmatn">
      <DesignStage bg="#0a0b10">
        <svg
          viewBox="0 0 480 270"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#0a0b10' }}
        >
          <g transform={`translate(${CX},${CY}) scale(${breath}) rotate(${rot}) translate(${-CX},${-CY})`}>
            <path d={d} fill={`hsla(${hue},80%,58%,.14)`} />
            <path
              d={d}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              stroke={`hsl(${hue},90%,66%)`}
              style={{ filter: `drop-shadow(0 0 8px hsla(${hue},90%,60%,.4))` }}
            />
          </g>
          <text
            x={CX}
            y={252}
            textAnchor="middle"
            fill="#5b6480"
            opacity={0.4 + 0.6 * Math.abs(m - 0.5) * 2}
            style={{ ...faText(10), fontFamily: 'Vazirmatn, sans-serif' }}
          >
            {m > 0.5 ? 'تبدیل به پیکرهٔ ب' : 'تبدیل به پیکرهٔ الف'}
          </text>
        </svg>
      </DesignStage>
    </FaRoot>
  );
};
