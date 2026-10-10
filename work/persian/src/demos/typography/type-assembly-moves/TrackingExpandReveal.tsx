// TrackingExpandReveal — Persian/RTL localization (tracking-expand-reveal: letters squeezed together breathe open, blur 10 -> 0).
//
// TEXT
//  - Hero "BREATHE" -> «نفس بکش» (imperative, the "breathe in" of a lyrical title).
//  - Subtitle "A CINEMATIC TITLE ENTRANCE" -> «ورود سینمایی تیتر». Label "TRACKING EXPAND REVEAL" -> «باز شدن کشیدهٔ حروف».
// SHAPING - the big adaptation
//  - Letter-spacing (the effect itself) is forbidden on Persian: it cuts the joins. The native Persian analogue of tracking is
//    KASHIDA (tatweel ـ), the connection stroke elongated between joined letters. So "expand" is
//      (a) the number of tatweels at every joint of each word grows 0 -> KASHIDA in integer steps following p (same out-poly(5) curve),
//          so the stretching happens in the first ~12 f, under the blur, and later steps are tiny;
//      (b) the two words start as an overlapped pile at the centre (original: letters piled at -0.42em) and travel out to their places,
//          translateX = (1-p) * PILE toward the centre: the same "everything pulled to the centre" idea, depends only on p;
//      (c) scaleX .92 -> 1, blur 10 -> 0, opacity .6 -> 1, all on the original p curve; filters removed at f50 (settled).
//  - The subtitle's letterSpacing .32em and uppercase are removed (0 / none).
// TIMING: identical beats (0-50 expand, subtitle fade 35-58, rest from 58).
// DIRECTION (RTL)
//  - «نفس» is the first word and sits on the RIGHT, «بکش» on the left; each word slides from the centre outward to its own side.
//    MIRRORED (reading order); the compression is symmetrical around the centre so no side is favoured.
//  - Label top-left -> top-right. MIRRORED. Centred subtitle: KEPT.
// FONT: Markazi Text 700 - the quietest, most lyrical demo of the card; a calligraphic-naskh serif voice with elegant tatweel joints
//  (kashida). Noto Naskh Arabic was tried first and read far too light next to the Helvetica-800 original, Markazi 700 keeps weight.
//  Subtitle in the same family (500). Size: fs(180) instead of fs(150) because the kashida-stretched pair is narrower than the spaced
//  Latin word. Raster assets: none.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';
import { FaTitle } from './FaCommon';

const WORDS = ['نفس', 'بکش'];
const FS = fs(180); // 主词字号
const KASHIDA = 2; // tatweels per joint in the final, expanded state
const PILE = 200; // px each word starts away from its final place (toward the centre)

// Insert k tatweels after every letter that joins forward (all but the last letter of these words).
const stretch = (w: string, k: number) =>
  [...w].map((ch, i, a) => (i < a.length - 1 ? ch + 'ـ'.repeat(k) : ch)).join('');

export const TrackingExpandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.poly(5)),
  });
  const blur = 10 * (1 - p);
  const op = interpolate(p, [0, 1], [0.6, 1]);
  const sx = interpolate(p, [0, 1], [0.92, 1]);
  const subOp = interpolate(frame, [35, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const k = Math.round(KASHIDA * p);
  const settled = frame >= 50;

  return (
    <FaRoot family="Markazi Text" style={{ background: G.bg, overflow: 'hidden' }}>
      <FaTitle text="باز شدن کشیدهٔ حروف" family="Markazi Text" weight={700} />

      <div
        style={{
          position: 'absolute',
          top: 380,
          left: 0,
          width: 1920,
          display: 'flex',
          justifyContent: 'center',
          transform: settled ? undefined : `scaleX(${sx})`,
          filter: settled ? undefined : `blur(${blur}px)`,
          opacity: settled ? 1 : op,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: FS,
            lineHeight: FA_LH,
            color: G.ink,
            letterSpacing: 0,
            whiteSpace: 'pre',
            display: 'flex',
            gap: FS * 0.3,
          }}
        >
          {WORDS.map((w, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                // first word (right) travels left out of the pile, second (left) travels right
                transform: settled ? undefined : `translateX(${(i === 0 ? -1 : 1) * (1 - p) * PILE}px)`,
              }}
            >
              {stretch(w, k)}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 665,
          left: 0,
          width: 1920,
          textAlign: 'center',
          fontWeight: 500,
          fontSize: fs(34),
          lineHeight: FA_LH,
          color: G.mid,
          letterSpacing: 0,
          opacity: frame >= 58 ? 1 : subOp,
        }}
      >
        ورود سینمایی تیتر
      </div>
    </FaRoot>
  );
};
