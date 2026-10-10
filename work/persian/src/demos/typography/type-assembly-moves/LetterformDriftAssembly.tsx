// LetterformDriftAssembly — Persian/RTL localization (letterform-drift-assembly: seeded drift-in with blur, lock pulse, word breath).
//
// TEXT
//  - Hero "ASSEMBLE" -> «گردهم‌آیی» (the gathering / "coming together" a brand reveal means; idiomatic, not «جمع کن»).
//  - Label "LETTERFORM DRIFT ASSEMBLY" -> «گردآمدن شناور حروف».
// SHAPING
//  - The original drifts 8 single characters. Persian letters join, so the drifting unit is a JOINED GROUP
//    (joinedGroups(): «گر د هم آ یی»; the ZWNJ of «هم‌آ» becomes a real gap between two non-joined pieces).
//    Each cut sits where the script does not connect, so no drifting piece ever loses a join.
//  - letterSpacing 8 -> 0 (tracking separates joined letters); no uppercase.
// TIMING (beats kept)
//  - Original: 8 units, STAG 3 f, TRAVEL 45 f, last lock at f66, breath f80-104. With 5 units the stagger is
//    STAG = 21/(5-1) = 5.25 f so the last lock is still f66 and the breath/rest beats are untouched. Seeds h(i+1), h(i+101),
//    magnitudes (260-360 px), blur 8, opacity .35, lock pulse (8 f, #2f -> #000, stroke 0 -> 3 px) are unchanged.
// DIRECTION (RTL)
//  - Unit order / lock sequence: the first unit is the RIGHT-most (flex row in direction:rtl), locking proceeds right to left. MIRRORED.
//  - The drift vectors are seeded random directions (no reading meaning) and the word breath is symmetrical: KEPT as designed.
//  - Label top-left -> top-right. MIRRORED.
// FONT: Lalezar (single weight, so no fake bold: the depth comes from the 3 px black stroke pulse) - a ceremonial brand-title
//  reveal wants a poster/impact face, and its heavy strokes make the darkening pulse read on the light plate.
//  Raster assets: none.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, joinedGroups } from '../../_fa';
import { FaTitle } from './FaCommon';

const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const UNITS = joinedGroups('گردهم‌آیی');
const TRAVEL = 45; // 每字漂入行程帧数
const STAG = 21 / (UNITS.length - 1); // original: 7 steps x 3 f = 21 f

export const LetterformDriftAssembly: React.FC = () => {
  const frame = useCurrentFrame();

  const breath =
    frame < 92
      ? interpolate(frame, [80, 92], [1, 1.04], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        })
      : interpolate(frame, [92, 104], [1.04, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

  return (
    <FaRoot family="Lalezar" style={{ background: G.bg, overflow: 'hidden' }}>
      <FaTitle text="گردآمدن شناور حروف" family="Lalezar" weight={400} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${breath})`,
        }}
      >
        {UNITS.map((c, i) => {
          const start = i * STAG;
          const lock = start + TRAVEL;
          const p = interpolate(frame, [start, lock], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });
          const ang = h(i + 1) * Math.PI * 2;
          const mag = 260 + h(i + 101) * 100;
          const dx = Math.cos(ang) * mag * (1 - p);
          const dy = Math.sin(ang) * mag * (1 - p);
          const blur = 8 * (1 - p);
          const op = interpolate(p, [0, 1], [0.35, 1]);
          const pulse =
            frame <= lock || frame >= lock + 8
              ? 0
              : frame < lock + 4
                ? (frame - lock) / 4
                : (lock + 8 - frame) / 4;
          const shade = Math.round(47 * (1 - pulse));
          const color = `rgb(${shade},${shade},${shade})`;
          const strokeW = 3 * pulse;
          return (
            <span
              key={i}
              style={{
                fontWeight: 400,
                fontSize: fs(140),
                lineHeight: 1.5,
                letterSpacing: 0,
                color,
                display: 'inline-block',
                whiteSpace: 'pre',
                transform: `translate(${dx}px, ${dy}px)`,
                opacity: op,
                filter: blur > 0.01 ? `blur(${blur}px)` : undefined,
                WebkitTextStroke: strokeW > 0.01 ? `${strokeW}px #000` : undefined,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
    </FaRoot>
  );
};
