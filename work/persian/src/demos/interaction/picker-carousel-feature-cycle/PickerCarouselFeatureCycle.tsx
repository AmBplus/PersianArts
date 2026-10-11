// PERSIAN (RTL) localization of shotcraft "picker-carousel-feature-cycle".
// Text: the seven product-feature labels become concise Persian UI labels; the AI token remains Latin as a
// universally recognised technical mark. Vazirmatn is loaded through FaRoot: its variable weights retain the
// compact, neutral product-UI role of Helvetica while its Persian glyphs remain legible in the 34px rows.
// Direction decisions: this is a vertical physical picker, so vertical travel, item order, fixed centre pill,
// opacity/size falloff, gradient, and the outQuint/hold/breath timings stay exactly as source. The icon moves to
// the RTL start (right) of each feature label. The fixed AI badge retains the equivalent right-side position in
// this symmetric centered composition; its fade is unchanged. The Latin mark is bidi-isolated; the refresh
// symbol is an inline SVG because the render environment's font fallback distorted U+21BA into a hook.
// Other icons retain their source glyphs. There are no raster assets. Persian text has no tracking,
// uppercase, or per-character splitting; sizes use fs() and the one-line leading remains deliberately compact.
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faText, fs } from '../../_fa';

export const PICKER_CAROUSEL_FEATURE_CYCLE_DURATION = 108; // 3600ms @30fps

const PAPER = '#F3F3F1';
const INK = '#111113';
const MID = '#8A8A8F';
const ROW_H = 34; // Fixed single-row height.
const ITEMS = [
  'پاک‌سازی داده‌ها',
  'پیام مستقیم',
  'بخش‌بندی هوشمند',
  'اقدام‌های گروهی',
  'برنامهٔ پاداش',
  'گردش‌کارهای خودکار',
  'آزمون نسخه‌ها',
];
const ICONS = ['◎', '✉', '◧', '◈', '★', null, '⚑'];
const STEPS = 5; // Five snap advances.
const HOLD = 5 / 14; // Still tail of each step (about 4–5 frames).

export const PickerCarouselFeatureCycle: React.FC = () => {
  const t = useT();

  // Main timeline: t∈[0.05,0.95] split into five steps; outQuint snap then a still hold.
  const g = seg(t, 0.05, 0.95) * STEPS;
  const step = Math.min(STEPS - 1, Math.floor(g));
  const local = Math.min(1, g - step);
  const mv = E.outQuint(Math.min(1, local / (1 - HOLD)));
  const pos = step + mv;

  // Pill breath begins only after the content snaps into the HOLD phase.
  const land = Math.max(0, (local - (1 - HOLD)) / HOLD);
  const breath = land > 0 ? Math.sin(Math.min(1, land / 0.6) * Math.PI) * 0.06 : 0;

  return (
    <DesignStage bg={PAPER}>
      {/* Paper background and picker stage. */}
      <FaRoot family="Vazirmatn">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            background: PAPER,
          }}
        >
          {/* Centered 300×170 picker viewport; fades in during the opening beat. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 300,
              height: ROW_H * 5,
              transform: 'translate(-50%,-50%)',
              overflow: 'hidden',
              opacity: seg(t, 0, 0.05),
            }}
          >
            {/* Fixed focus pill; only its landing breath scales. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: ROW_H * 2,
                height: ROW_H,
                boxSizing: 'content-box',
                borderRadius: 999,
                background: '#fff',
                border: '1px solid #E3E3E6',
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                transform: `scaleY(${1 + breath})`,
              }}
            />
            {/* The full content column travels through the stationary pill. */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                transform: `translateY(${ROW_H * 2 - pos * ROW_H}px)`,
              }}
            >
              {ITEMS.map((txt, i) => {
                // Layer opacity, 17→14px type size, and three gray levels by distance from center.
                const d = Math.abs(i - pos);
                const k2 = Math.min(2, d);
                const o = k2 <= 1 ? lerp(k2, 1, 0.55) : lerp(k2 - 1, 0.55, 0.18);
                return (
                  <div
                    key={i}
                    style={{
                      height: ROW_H,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 600,
                      ...faText(lerp(Math.min(1, d / 2), 17, 14), {lineHeight: 1.2}),
                      color: d < 0.5 ? INK : d < 1.5 ? MID : '#B9B9BE',
                      opacity: o,
                    }}
                  >
                    {/* The row icon appears only near the focus position. */}
                    <span style={{
                      fontSize: fs(14),
                      opacity: Math.max(0, 1 - d * 1.6),
                      flexShrink: 0,
                      fontFamily: "-apple-system, 'Helvetica Neue', 'Segoe UI Symbol', sans-serif",
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i === 5 ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M2.5 7.25a5.5 5.5 0 1 1 1.7 4.4M2.5 7.25v-3.5m0 3.5H6"
                            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : ICONS[i]}
                    </span>
                    <span>{txt}</span>
                  </div>
                );
              })}
            </div>
            {/* Paper-to-transparent fades mask items entering and leaving the viewport. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(180deg,${PAPER} 0%,rgba(243,243,241,0) 26%,rgba(243,243,241,0) 74%,${PAPER} 100%)`,
              }}
            />
          </div>
          {/* RTL reading-side fixed AI badge: black rounded square, slightly delayed fade-in. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              margin: '-11px 0 0 160px',
              width: 26,
              height: 22,
              borderRadius: 6,
              background: INK,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 10,
              lineHeight: 1,
              fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif",
              letterSpacing: 0.5,
              opacity: seg(t, 0.02, 0.09),
            }}
          >
            <bdi dir="ltr">AI</bdi>
          </div>
        </div>
      </FaRoot>
    </DesignStage>
  );
};
