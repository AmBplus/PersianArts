/*
 * Persian/RTL localization of riso-misregistration-hit (frames, easing, amplitudes, tau/omega unchanged).
 * TEXT: "IMPACT" -> «ضربه» (short punchy word that carries the "hit" meaning). No other text exists in the demo.
 * FONT: Lalezar (single-weight heavy poster face) replaces Helvetica 800; no bold requested; loaded via FaRoot.
 *   Size fs(200) x1.2 extra because Lalezar is compact and the word is short.
 * SHAPING: letterSpacing -1 -> 0 (tracking breaks joining); no uppercase; one whole-word unit, never split.
 * DIRECTION decisions:
 *  - Slide-in origin: the title came from off-screen right (the END side in LTR) and slammed to centre.
 *    MIRRORED with dir(): it now enters from off-screen left (-1400 -> 0), same Easing.in(cubic) over 8f.
 *  - Plate x offsets reversed with dir() so the first excursion is mirrored; damped cosine symmetric, y unchanged. MIRRORED (cosmetic).
 *  - Bottom rule (left 510, width 900) is centred: symmetric, KEPT. Vertical y split, scale pulse (centre origin), multiply blend: KEPT.
 * RASTER: none. Timeline 0-19 hold / 20-28 slam / 28-71 shake / 72 snap pulse / 76+ rest unchanged.
 */
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, faText, dir } from '../../_fa';

const HIT = 28; // 撞停命中帧
const SNAP = 72; // 套准合一帧
const AX = 16; // 单版 x 错位振幅
const AY = 7; // 单版 y 错位振幅
const OMEGA = (2 * Math.PI) / 18; // 震荡周期 18f
const TAU = 60; // 缓衰减
const TITLE = 'ضربه';
const TITLE_PX = Math.round(fs(200) * 1.2);

const TitleText: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={faText(TITLE_PX, {
      fontWeight: 400,
      color,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      unicodeBidi: 'isolate',
    })}
  >
    {TITLE}
  </div>
);

// Tintable single-colour copy for the misregistered plates
const Plate: React.FC<{ color: string; dx: number; dy: number }> = ({ color, dx, dy }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translate(${dx}px, ${dy}px)`,
      mixBlendMode: 'multiply',
    }}
  >
    <TitleText color={color} />
  </div>
);

export const RisoMisregistrationHit: React.FC = () => {
  const frame = useCurrentFrame();

  const entering = frame >= 20 && frame < HIT;
  const split = frame >= HIT && frame < SNAP;
  const showSingle = frame < HIT || frame >= SNAP;

  // slam-in: off-screen LEFT (mirrored) -> 0, 8f Easing.in(cubic)
  const slideX = interpolate(frame, [20, HIT], [dir(1400), 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const t = frame - HIT;
  const m = split ? Math.cos(OMEGA * t) * Math.exp(-t / TAU) : 0;
  const dx = dir(AX * m);
  const dy = AY * m;

  const pulse =
    frame >= SNAP && frame < SNAP + 4 ? 1 + 0.03 * (1 - (frame - SNAP) / 4) : 1;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <FaRoot family="Lalezar">
        <div
          style={{
            position: 'absolute',
            left: 510,
            top: 740,
            width: 900,
            height: 6,
            borderRadius: 3,
            background: G.bar,
          }}
        />

        {showSingle && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateX(${entering || frame < 20 ? slideX : 0}px) scale(${pulse})`,
              transformOrigin: 'center center',
            }}
          >
            <TitleText color={G.ink} />
          </div>
        )}

        {split && (
          <>
            <Plate color={G.mid} dx={-dx} dy={dy} />
            <Plate color={G.ink} dx={dx} dy={-dy} />
          </>
        )}
      </FaRoot>
    </div>
  );
};
