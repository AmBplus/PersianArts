// Persian localization of doc-park-left-pill-deal.
// Text: Quick Start / Bundle Plan / Starter Kit and all three captions are translated idiomatically.
// RTL: source document parks on the left, so it parks on the right and anchors/scales from its right edge;
//     the conclusion cards move to the left, their icon/text order follows Persian reading order.
//     Skeleton document: the three column slots mirror (first column right-most) AND every header/row
//     bar inside a column is right-aligned at its column's right edge — the exact mirror of the
//     source's left-aligned bars; widths and seeds are unchanged.
//     Vertical stacking, scroll speed, deal beats, opacity/spring curves and icon geometry stay unchanged.
// Caption word spacing: the original puts marginRight on every word except the last (gap AFTER each
//     word in LTR). In the RTL flex row the trailing side is the LEFT, so the mirror is
//     marginInlineEnd on every word except the last — marginInlineStart fused the final word pair.
//     The caption box is anchored 4px inside the pill's start (right) edge, mirroring the source's
//     4px inset from the pill's left edge.
// Font: Vazirmatn variable preserves the restrained product UI tone, real 600 weight and Persian glyph coverage.
// Raster handling: none; all shapes are live CSS/SVG, with no embedded foreign-language text.
import React from 'react';
import { DesignStage, E, lerp, rand, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faText } from '../../_fa';

export const DOC_PARK_LEFT_PILL_DEAL_DURATION = 174; // 5800ms @30fps

const SANS = 'Vazirmatn, sans-serif';
const BG = '#F1F1F3';
const INK = '#0B0B0C';
const TXT = '#111111';
const DIM = '#C9C9CE';
const LINE = '#E6E6EA';
const SKEL = '#DEDEE3';
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const h2r = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (p: number, a: string, b: string) => {
  const A = h2r(a), B = h2r(b), q = clamp01(p);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * q)},${Math.round(A[1] + (B[1] - A[1]) * q)},${Math.round(A[2] + (B[2] - A[2]) * q)})`;
};

const Icon: React.FC<{ k: 'leaf' | 'bowl' | 'wrap'; size: number }> = ({ k, size }) => (
  <div style={{ width: size, height: size, flex: '0 0 auto', color: TXT }}>
    <svg width={size} height={size} viewBox="0 0 16 16">
      {k === 'leaf' && <><path d="M3 13c0-6 5-10 10-10 0 6-4 10-10 10Z" fill="none" stroke="#111" strokeWidth={1.3} /><path d="M3 13 13 3" stroke="#111" strokeWidth={1.3} /></>}
      {k === 'bowl' && <><path d="M2 7h12c0 4-2.6 6-6 6S2 11 2 7Z" fill="none" stroke="#111" strokeWidth={1.3} /><path d="M6 4.5V2M9.5 4.5V2" stroke="#111" strokeWidth={1.3} /></>}
      {k === 'wrap' && <><circle cx={8} cy={8} r={5.6} fill="none" stroke="#111" strokeWidth={1.3} /><path d="M4.4 6.2h7.2M4.4 9.8h7.2" stroke="#111" strokeWidth={1.3} /></>}
    </svg>
  </div>
);

const Caption: React.FC<{text: string; right: number; top: number; size: number; showV: number; innP: number; outP: number}> =
({ text, right, top, size, showV, innP, outP }) => {
  const words = text.split(' ');
  const n = words.length;
  const st = 0.78 / n, win = st * 1.5;
  const stw = 0.55 / n;
  const rowOpacity = outP > 0 ? clamp01(1 - (outP - 0.7) / 0.3) : showV;
  return <div style={{ position: 'absolute', display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap', width: 172, right, top, opacity: rowOpacity, direction: 'rtl', lineHeight: 1.5 }}>
    {words.map((w, i) => {
      const q = clamp01((innP - i * st) / win);
      let color = mix(q, DIM, TXT);
      if (outP > 0) color = mix(1 - clamp01((outP - i * stw) / (stw * 1.4)), DIM, TXT);
      return <span key={i} style={{ ...faText(size, { fontFamily: SANS, fontWeight: 600, lineHeight: 1.5, color }), marginInlineEnd: i === n - 1 ? 0 : 4.5 }}>{w}</span>;
    })}
  </div>;
};

const DW = 250, DH = 190, COLS = 3;
const COL_W = (DW - 28 - (COLS - 1) * 10) / COLS;
// r = the column's right-edge inset from the document's right edge (mirror of the source's
// left-edge inset from its left). Bars are right-anchored at this edge, so each column's
// header/row bars stay flush with the column's reading edge exactly as in the source.
const DOC_COLS = Array.from({ length: COLS }, (_, c) => {
  const r = 14 + c * (COL_W + 10);
  return { r, headW: (COL_W * 0.72).toFixed(1), rows: Array.from({ length: 7 }, (_, r2) => (COL_W * (0.55 + rand(c * 13 + r2 * 7) * 0.45)).toFixed(1)) };
});
const ITEMS: { n: string; ic: 'leaf' | 'bowl' | 'wrap'; cap: string }[] = [
  { n: 'شروع سریع', ic: 'leaf', cap: 'هماهنگ با سلیقه' },
  { n: 'طرح پیشنهادی', ic: 'bowl', cap: 'مناسب روزهای کاری' },
  { n: 'بستهٔ آغاز', ic: 'wrap', cap: 'محبوب برای خرید دوباره' },
];
const PX = 54, PY = 54, PH = 34, PG = 14;
const T0 = [0.26, 0.48, 0.70];

export const DocParkLeftPillDeal: React.FC = () => {
  const t = useT();
  const park = seg(t, 0.06, 0.24, E.inOutCubic);
  const scrollY = (-((t * 3) % 1) * 40).toFixed(2);
  return <FaRoot family="Vazirmatn" style={{ overflow: 'hidden' }}>
    <DesignStage bg={BG}>
      <div style={{ position: 'absolute', inset: 0, background: BG, overflow: 'hidden', fontFamily: SANS, WebkitFontSmoothing: 'antialiased' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 440, height: 240, margin: '-120px 0 0 -220px' }}>
          <div style={{ position: 'absolute', right: 34, top: (240 - DH) / 2, width: DW, height: DH, transformOrigin: '100% 50%', transform: `translateX(${lerp(park, 0, 55)}%) scale(${lerp(park, 1, 0.92)})` }}>
            <div style={{ position: 'absolute', inset: 0, width: DW, height: DH, background: '#fff', border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: '0 8px 26px rgba(0,0,0,.06)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', insetInline: 0, top: 0, height: DH + 60, transform: `translateY(${scrollY}px)` }}>
                <div style={{ position: 'absolute', right: 14, top: 12, width: Math.round(DW * 0.34), height: 7, borderRadius: 3, background: INK, opacity: 0.85 }} />
                <div style={{ position: 'absolute', right: 14, top: 25, width: Math.round(DW * 0.2), height: 5, borderRadius: 3, background: SKEL }} />
                {DOC_COLS.map(({ r, headW, rows }, c) => <React.Fragment key={c}>
                  <div style={{ position: 'absolute', right: r, top: 44, width: `${headW}px`, height: 6, borderRadius: 3, background: '#9A9AA2' }} />
                  {rows.map((ww, r2) => <div key={r2} style={{ position: 'absolute', right: r, top: 58 + r2 * 13, width: `${ww}px`, height: 5, borderRadius: 2.5, background: SKEL }} />)}
                </React.Fragment>)}
              </div>
            </div>
          </div>
          {ITEMS.map((it, k) => {
            const f = T0[k], o = seg(t, f, f + 0.035, E.outQuad), b = seg(t, f, f + 0.062, E.outBack);
            const cs = f + 0.05, ce = k < 2 ? T0[k + 1] - 0.03 : 0.98;
            const showV = seg(t, cs, cs + 0.02), innP = seg(t, cs, cs + (ce - cs) * 0.7), outP = seg(t, ce - 0.05, ce, E.outQuad);
            return <React.Fragment key={k}>
              <div style={{ position: 'absolute', left: PX, top: PY + k * (PH + PG), width: 172, height: PH, borderRadius: PH / 2, background: '#fff', border: `1px solid ${LINE}`, boxSizing: 'border-box', boxShadow: '0 4px 14px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', direction: 'rtl', opacity: o, transform: `translateY(${lerp(b, 14, 0).toFixed(2)}px) scale(${lerp(b, 0.94, 1).toFixed(4)})` }}>
                <Icon k={it.ic} size={16} />
                <div style={{ ...faText(12.5, { fontFamily: SANS, fontWeight: 600, color: TXT, whiteSpace: 'nowrap' }), lineHeight: 1 }}>{it.n}</div>
              </div>
              <Caption text={it.cap} right={440 - PX - 172 + 4} top={PY + k * (PH + PG) + PH + 7} size={11} showV={showV} innP={innP} outP={outP} />
            </React.Fragment>;
          })}
        </div>
      </div>
    </DesignStage>
  </FaRoot>;
};
