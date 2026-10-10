// brand-ink-open (Persian/RTL localization): crosshair ink draw -> wordmark letterpress -> typewriter kicker -> 1s hold -> lift & dissolve.
//
// ANALYSIS
// TEXT: wordmark "AI Foundation Lab" -> «آزمایشگاه هوش مصنوعی» (idiomatic lab title, not word-for-word).
//   Kicker "TEAM RESEARCH CONSOLE" -> «کنسول پژوهشی تیم». No digits and no Latin stay on screen.
// SHAPING: letterSpacing 0 everywhere (was -0.01em / 0.14em), no uppercase. The per-glyph letterpress runs on JOINED GROUPS
//   (joinedGroups) and word spaces, never on single code points, so letters keep joining.
//   Beats preserved: first unit starts at f10 and the delay step is derived so the LAST unit still starts at the original
//   last delay (10+16*3 = 58) and completes at f70 like the original, so the 1s hold (to f97) and exit are unchanged.
//   Kicker typewriter = prefix slice (typeOn); chars/frame is rescaled so it still ends at the original f~43 (28 + 21*0.7).
//   Line-heights raised for Persian ascenders/dots; sizes through fs() (x1.1).
// DIRECTION:
//   - Wordmark row is direction:rtl: first group (earliest delay) is right-most, stamping cascades right->left (MIRRORED, reading order).
//   - Kicker grows from the right edge (rtl line, centered so the block stays centered) and the block cursor sits at the
//     logical END of the text = its left side (MIRRORED: marginInlineStart instead of marginLeft).
//   - Crosshair: symmetric glyph (KEPT). Vertical stroke draws top->bottom (KEPT, physical). Horizontal stroke is MIRRORED:
//     it now starts at the right end (line endpoints swapped) so the pen enters from the reading-start side.
//   - Glint underline centered/symmetric (KEPT). Lift-up/shrink exit is vertical (KEPT). Centered composition (KEPT).
// FONT: wordmark Amiri (high-contrast Naskh = the editorial serif voice of the original Georgia lockup). Review found Markazi Text
//   rendered monoline/sans-like and too light, so it was dropped. Amiri has one weight, so the heavy lockup weight is rebuilt with a
//   2.5px ink WebkitTextStroke (no fake bold synthesis); kicker
//   uses Vazir Code (console-like chrome replacing the monospace stack).
// GLINT: underline bottom moved from -6 (original) to 14 so it sits just under the Persian descender line (lineHeight 1.3
//   makes the box taller than the glyphs; the old value floated it detached).
// RASTER: none (all SVG/text).
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FaFonts, FA_LH, fs, joinedGroups, typeOn } from '../../_fa';

export const BRAND_INK_OPEN_DURATION = 104;

const SERIF = '"Amiri", "Vazirmatn", serif';
const MONO = '"Vazir Code", "Vazirmatn", monospace';
const INK = 'oklch(18% 0.006 82)';
const AMBER = 'oklch(52% 0.115 65)';
const INK2 = 'oklch(50% 0.006 82)';

const WORDMARK = 'آزمایشگاه هوش مصنوعی';
const KICKER = 'کنسول پژوهشی تیم';

export const BrandInkOpen: React.FC = () => {
  const frame = useCurrentFrame();

  // crosshair draw-on (SVG pathLength = 100): vertical 0→9f, horizontal 8→18f, fade 24→34f
  const vDraw = interpolate(frame, [0, 9], [100, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const hDraw = interpolate(frame, [8, 18], [100, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.linear,
  });
  const crossFade = interpolate(frame, [24, 34], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // kicker typewriter: originally 21 chars * 0.7f from f28 (done ~42.7); keep the same window
  const kickStart = 28;
  const kickWindow = 21 * 0.7;
  const kickP = Math.max(0, frame - kickStart) / kickWindow;
  const kickDone = kickStart + kickWindow;
  const cursorOn = (() => {
    if (frame < kickStart) return false;
    if (frame < kickDone) return true;
    if (frame > 95) return false;
    const b = frame - kickDone;
    return Math.floor(b / 2) % 2 === 0;
  })();

  const brandOut = interpolate(frame, [97, 104], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.5, 1),
  });
  const brandOpacity = 1 - brandOut;
  const groupY = -brandOut * 40;
  const groupScale = 1 - brandOut * 0.12;

  const units = joinedGroups(WORDMARK);
  const step = units.length > 1 ? (16 * 3) / (units.length - 1) : 3;

  return (
    <FaFonts families={['Amiri', 'Vazir Code']}>
      <AbsoluteFill style={{ backgroundColor: '#faf7f2', justifyContent: 'center', alignItems: 'center', direction: 'rtl' }}>
        <div style={{ textAlign: 'center', opacity: brandOpacity, transform: `translateY(${groupY}px) scale(${groupScale})` }}>
          {/* crosshair drawn by an invisible amber pen */}
          <svg width={64} height={64} viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto 34px', opacity: crossFade }}>
            <line
              x1={32} y1={2} x2={32} y2={62}
              stroke={AMBER} strokeWidth={5} strokeLinecap="round"
              pathLength={100} strokeDasharray={100} strokeDashoffset={vDraw}
            />
            {/* endpoints swapped: pen starts at the right end (RTL) */}
            <line
              x1={62} y1={32} x2={2} y2={32}
              stroke={AMBER} strokeWidth={5} strokeLinecap="round"
              pathLength={100} strokeDasharray={100} strokeDashoffset={hDraw}
            />
          </svg>

          {/* wordmark: joined-group letterpress with amber under-glint, cascading right -> left */}
          <div
            style={{
              fontFamily: SERIF, fontSize: fs(132), fontWeight: 400, color: INK, WebkitTextStroke: `2.5px ${INK}`, paintOrder: 'stroke fill',
              letterSpacing: 0, lineHeight: 1.3, whiteSpace: 'pre', direction: 'rtl',
              display: 'inline-flex', alignItems: 'flex-end',
            }}
          >
            {units.map((ch, i) => {
              const delay = 10 + i * step;
              const t = interpolate(frame, [delay, delay + 12], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.7, 0.25, 1),
              });
              const glintCenter = delay + 12;
              const glint = ch === ' ' ? 0 : interpolate(frame, [glintCenter - 4, glintCenter, glintCenter + 4], [0, 1, 0], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
              });
              return (
                <span
                  key={i}
                  style={{
                    position: 'relative', display: 'inline-block', opacity: t,
                    transform: `scale(${1.6 - 0.6 * t})`, transformOrigin: 'center bottom',
                    filter: `blur(${(1 - t) * 6}px)`,
                  }}
                >
                  {ch}
                  <span
                    style={{
                      position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
                      width: `${glint * 100}%`, height: 2, background: AMBER, opacity: glint, borderRadius: 2,
                    }}
                  />
                </span>
              );
            })}
          </div>

          {/* console kicker typewriter + amber block cursor (at the logical end = left of the text) */}
          <div
            style={{
              fontFamily: MONO, fontSize: fs(26), letterSpacing: 0, color: INK2,
              marginTop: 30, textTransform: 'none', height: Math.round(26 * FA_LH * 1.1), direction: 'rtl',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
            }}
          >
            <span style={{ whiteSpace: 'pre' }}>{typeOn(KICKER, kickP)}</span>
            <span
              style={{
                display: 'inline-block', width: 14, height: 24, marginInlineStart: 4,
                background: AMBER, opacity: cursorOn ? 0.85 : 0,
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </FaFonts>
  );
};
