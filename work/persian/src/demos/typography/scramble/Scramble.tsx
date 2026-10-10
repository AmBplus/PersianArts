// scramble — PERSIAN (RTL) localization. Motion, timing, seeds, easing, colours and DURATION are the original's.
// Original: 20 monospace Latin chars hop through random glyphs every 2 frames, then lock left->right with a blue-white flash.
//
// TEXT      "TEMPLATE MOTION DEMO" -> «نمونه نمایشی قالب حرکت» (22 chars incl. 3 gaps, 19 scrambled slots vs 18; the
//           source prompt asks for ~20 so lockAt = 0.25 + i/n*0.6 keeps the original 24f..82f window and beat density).
//           A machine-voice demo title, 4 words like the original's 3-4 word advice.
// SHAPING   letterSpacing 2px removed (breaks joining). Each WORD keeps a fixed-size ghost box (the final word,
//           invisible) that owns the width, and the live layer is clipped horizontally to that box so noise can never
//           invade the gaps between words. Inside it, LOCKED characters are plain inline text (the final word shapes
//           and joins exactly like real Persian), while every still-hopping character is an inline-block cell of
//           0.6em with centred glyph: an atomic inline never joins with its neighbours, so noise reads as discrete
//           hopping glyphs like the original monospace grid, not as a fused ligature smear. Spaces are never scrambled.
// DIRECTION Lock order "from left to right" -> logical order = RIGHT to LEFT (reading direction, mirror). It falls out of
//           direction:rtl with the characters in logical order; the noise therefore sits at the word's left end while
//           the locked prefix grows from the right. Glow/flash are radial = symmetric = kept.
// FONT      Noto Kufi Arabic (variable, geometric/techy = the "machine computing" voice that SF Mono gave). Vazir Code
//           looks stretched on Persian prose, so it is not used. Size 34 -> fs(28) = 31: Persian glyphs are wider per char than Mono at 34, so the line is scaled to fit the original 1920 stage with the same side margins.
// NOISE     Pool 47 -> narrow Persian letters (wide joining letters such as سش dropped: they overflow the cell and fuse) + Persian digits + symbols (same size 47, same hash indexing), so the pool reads
//           as Persian noise instead of Latin (each shown in its isolated form inside its own cell); "<>/\" dropped (bidi mirrors them in RTL). Digits come out as Persian digits.
// RASTER    none.
import React from 'react';
import { DesignStage, rand, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, fs, FA_LH } from '../../_fa';

export const SCRAMBLE_DURATION = 96; // 3200ms @30fps

const TEXT = 'نمونه نمایشی قالب حرکت';
const POOL = [...'ادذرزژوهکگلمنی۰۱۲۳۴۵۶۷۸۹#$%&*+='];
const WORDS = TEXT.split(' ');
const CHARS = [...TEXT];

export const Scramble: React.FC = () => {
  const t = useT();
  const frame = Math.floor(t * 96);
  let idx = 0;
  return (
    <DesignStage bg="#07080c">
      <FaRoot
        family="Noto Kufi Arabic"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45em',
          background: '#07080c',
          fontSize: fs(28),
          fontWeight: 500,
          lineHeight: FA_LH,
          letterSpacing: 0,
        }}
      >
        {WORDS.map((word, w) => {
          const live = [...word].map((ch) => {
            const i = idx++;
            let content: string = ch;
            let color = '#3d4560';
            let textShadow = 'none';
            // lock moment: base stagger in reading order + seeded jitter (identical formula to the original)
            const lockAt = 0.25 + (i / CHARS.length) * 0.6 + rand(i * 7) * 0.06;
            if (t < 0.06) {
              content = ''; // opening blank beat
            } else if (t < lockAt) {
              // fast hop: new random glyph every 2 frames
              content = POOL[Math.floor(rand(i * 131 + Math.floor(frame / 2)) * POOL.length)];
            } else {
              // locked: flash then settle
              const flash = 1 - seg(t, lockAt, lockAt + 0.1);
              color = flash > 0.4 ? '#dff3ff' : '#e8eaf0';
              textShadow = `0 0 ${flash * 18}px rgba(120,200,255,${flash})`;
            }
            const hopping = t >= 0.06 && t < lockAt;
            return hopping ? (
              <span key={i} style={{ color, display: 'inline-block', width: '0.6em', textAlign: 'center' }}>
                {content}
              </span>
            ) : (
              <span key={i} style={{ color, textShadow }}>
                {content}
              </span>
            );
          });
          idx++; // the gap char of TEXT keeps its index so seeds line up with the original string positions
          return (
            <span key={w} style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
              <span style={{ visibility: 'hidden' }}>{word}</span>
              <span style={{ position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, top: 0, whiteSpace: 'nowrap', clipPath: 'inset(-1em -0.15em -1em -0.15em)' }}>{live}</span>
            </span>
          );
        })}
      </FaRoot>
    </DesignStage>
  );
};
