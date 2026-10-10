/*
 * Persian/RTL localization of riso-beat-pump (beats, amplitudes, windows, seeds unchanged).
 * TEXT: "ON THE BEAT" -> «روی ضرب» (idiomatic rhythm phrase, not word-for-word). No other text exists in the demo.
 * FONT: Lalezar (single-weight heavy poster face): closest Persian voice to Helvetica 800 on a riso poster.
 *   No bold is requested (single weight); wordSpacing .15em because Lalezar's word gap is tight (lessons s.2).
 *   Loaded through FaRoot. Size fs(160) x1.25 extra: Lalezar is compact and the headline must keep its poster weight.
 * SHAPING: letterSpacing was -1 (tracking) -> 0 (it would split joined letters); no uppercase; headline is one whole-line unit.
 * DIRECTION decisions:
 *  - Root direction:rtl via FaRoot.
 *  - Beat tick dots: flex row under RTL, so the FIRST beat is the right-most dot (progress follows reading order). MIRRORED.
 *  - Row of 3 cards: RTL flex puts seed 2 at the right; Card internals (bar and avatar rows) align to the start (right). MIRRORED.
 *  - Misregistration plates: x offset sign reversed so the plates' first excursion is the mirror image; the damped cosine
 *    itself is symmetric and the y split is vertical. MIRRORED (cosmetic).
 *  - Scale pump (centre origin), vertical y split, colours and multiply blend: KEPT (symmetric / physical).
 *  - Centred headline and centred dot row: symmetric composition, no (W-x-w) recompute needed.
 * RASTER: none (all drawn with divs). HITS/AMP/PUMP_WIN/SPLIT_WIN untouched.
 */
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G, Card } from '../../_fixtures/Fixtures';
import { FaRoot, fs, faText } from '../../_fa';

const HITS = [30, 54, 78, 102]; // 节拍命中帧
const AMP = [4, 7, 11, 16]; // 每拍单版初始错位（px），逐拍加码
const PUMP_WIN = 14; // scale 泵窗口：14f 后精确归 1（保证结尾真静止）
const SPLIT_WIN = 12; // 错位窗口：12f 后精确归 0（余量 <0.4px，硬切套准）
const TITLE = 'روی ضرب';
const TITLE_PX = Math.round(fs(160) * 1.25);

const TitleText: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={faText(TITLE_PX, {
      fontWeight: 400,
      color,
      wordSpacing: '0.15em',
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      unicodeBidi: 'isolate',
    })}
  >
    {TITLE}
  </div>
);

// Single-colour plate with the same glyphs (misregistration needs tintable copies)
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

export const RisoBeatPump: React.FC = () => {
  const frame = useCurrentFrame();

  let beatIdx = -1;
  for (let i = 0; i < HITS.length; i++) {
    if (frame >= HITS[i]) beatIdx = i;
  }
  const t = beatIdx >= 0 ? frame - HITS[beatIdx] : Infinity;

  const pump = t < PUMP_WIN ? 1 + 0.08 * Math.exp(-t / 3) : 1;

  const split = t < SPLIT_WIN;
  const m = split ? Math.cos((2 * Math.PI * t) / 6) * Math.exp(-t / 3) : 0;
  const dx = beatIdx >= 0 ? -AMP[beatIdx] * m : 0; // sign flipped for RTL (mirrored plate drift)
  const dy = -dx * 0.45; // y magnitude unchanged (vertical, physical)

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
            inset: 0,
            transform: `scale(${pump})`,
            transformOrigin: 'center center',
          }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 660 }}>
            {!split && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 660,
              display: 'flex',
              justifyContent: 'center',
              gap: 44,
            }}
          >
            <Card w={330} h={200} seed={2} />
            <Card w={330} h={200} seed={5} />
            <Card w={330} h={200} seed={8} />
          </div>

          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 950,
              display: 'flex',
              justifyContent: 'center',
              gap: 60,
            }}
          >
            {HITS.map((hit, i) => {
              const dt = frame - hit;
              const on = dt >= 0;
              const s = on && dt < 8 ? 1 + 0.8 * (1 - dt / 8) : 1;
              return (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: on ? G.ink : G.bar,
                    transform: `scale(${s})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </FaRoot>
    </div>
  );
};
