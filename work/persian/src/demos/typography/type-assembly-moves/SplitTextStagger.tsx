// SplitTextStagger — Persian/RTL localization (split-text-stagger: per-unit masked rise, 10% overshoot, growing baseline).
//
// TEXT
//  - Hero "MOTION SYSTEM" -> «سامانه حرکت» (a product/design-system voice, not word-for-word; the ezafe hamza is left out, as in Persian UI wording).
//  - Label "SPLIT TEXT STAGGER" -> «خیزش پلکانی حروف».
// SHAPING
//  - The original splits into single characters. Persian letters join, so the animated unit is a JOINED GROUP
//    (joinedGroups(): «سا ما نه ␣ حر کت»); groups only end where a letter does not join forward, so every cut is shaping-safe.
//  - letterSpacing 0 (was 2), no uppercase. Mask box is taller and lineHeight is FA_LH because Persian dots/descenders
//    (ر ک ه) sit far below the baseline: the clipping line (box bottom) is moved under the descenders.
// TIMING (beats kept)
//  - Original: 13 units, delay i*2f, so the last unit starts at f12+24 = f36 and settles at f56. Here 6 units (5 groups + the
//    word gap, which is a unit like in the original), so delay = i*(24/5) = 4.8f: the first jump (f12), the last jump (f36),
//    the settle (f56), RISE 14 f, SETTLE 6 f, the overshoot (-10%) and the easing curves are identical.
// DIRECTION (RTL)
//  - Unit order: the first unit is the RIGHT-most (flex row inside direction:rtl) -> the cascade runs right-to-left (reading order). MIRRORED.
//  - Baseline: grows from the START edge (right) to the left (was left -> right). MIRRORED (justifyContent flex-start inside rtl).
//  - Rise from below the cut line (translateY 115% -> -10% -> 0): vertical, gravity/up-down. KEPT.
//  - Label: top-left -> top-right (right:120). MIRRORED.
//  - Baseline width follows the real text width (inline-flex column) instead of the fixed 920 px, because Persian width differs.
// FONT: Vazirmatn 800 - the card is "rational, crisp, general default"; a neutral variable sans with real heavy weight keeps the
//  Helvetica-800 voice. Persian digits are not present. Raster assets: none.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH, joinedGroups } from '../../_fa';
import { FaTitle } from './FaCommon';

const TEXT = 'سامانه حرکت';
const UNITS = joinedGroups(TEXT);
const START = 12; // 首字起跳帧
const RISE = 14; // 升起时长
const SETTLE = 6; // 过冲回落时长
const OVERSHOOT = -10; // 过冲到 -10%
const FONT = fs(120);
const STEP = 24 / (UNITS.length - 1); // original: 12 steps of 2f = 24f cascade

const charY = (f: number, idx: number): number => {
  const t0 = START + idx * STEP;
  if (f < t0 + RISE) {
    return interpolate(f, [t0, t0 + RISE], [115, OVERSHOOT], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  }
  return interpolate(f, [t0 + RISE, t0 + RISE + SETTLE], [OVERSHOOT, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
};

export const SplitTextStagger: React.FC = () => {
  const frame = useCurrentFrame();
  const lineW = interpolate(frame, [START, START + 26], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <FaRoot family="Vazirmatn" style={{ background: G.bg, overflow: 'hidden' }}>
      <FaTitle text="خیزش پلکانی حروف" family="Vazirmatn" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex' }}>
            {UNITS.map((c, i) => (
              <div
                key={i}
                style={{
                  // 遮罩盒：底边即裁切线（位于波斯语下伸笔画之下），上方留空间容纳过冲
                  overflow: 'hidden',
                  height: FONT * FA_LH,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontWeight: 800,
                    fontSize: FONT,
                    lineHeight: FA_LH,
                    color: G.ink,
                    letterSpacing: 0,
                    whiteSpace: 'pre',
                    transform: `translateY(${charY(frame, i)}%)`,
                  }}
                >
                  {c === ' ' ? ' ' : c}
                </span>
              </div>
            ))}
          </div>
          {/* 基线细线：从起始边(右)向左生长 */}
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ height: 2, width: `${lineW}%`, background: G.bar }} />
          </div>
        </div>
      </div>
    </FaRoot>
  );
};
