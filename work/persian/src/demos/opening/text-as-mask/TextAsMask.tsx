// متن به‌عنوان ماسک (text-as-mask) — Persian / RTL localization of the "kinetic typography" opening.
// Design (unchanged): 0–20f hold · 20–100f dashboard drifts at constant speed inside the glyphs (scale 1.15, ±110px) ·
// 100–130f single bezier(0.4,0,0.2,1): mask layer scale 1→26, content layer 1/S counter-scale, un-masked cover layer fades in
// (endT 0.25–0.9), dashboard 1.15→1.0 · 130–150f still. Timing, easing, scale 26, ±110 drift amplitude are untouched.
//
// TEXT
//  - Hero word "SCALE" -> «مقیاس» (the Persian word for scale/measure; 5 letters like the original). It is one joined word: no per-letter
//    motion exists in this demo, only a whole-word mask, so shaping is never split.
//  - Caption "TEXT AS MASK" -> «متن به‌عنوان ماسک» (ZWNJ in به‌عنوان). Tracking (letterSpacing 10) and uppercase removed: they break
//    Persian joining. Hierarchy is kept by size (fs(30)), weight 700 and the mid-grey colour.
// MASK TEXT AS PATHS (raster/vector handling)
//  - An SVG data-URI used as mask-image is an isolated document: it can NOT use page web fonts, so «مقیاس» would fall back to a system
//    face. The word is therefore shaped once with HarfBuzz from Lalezar and embedded as glyph outline paths (maskGlyphs.ts). The mask
//    stays vector-crisp at 26x, like the original SVG text.
// FONT
//  - Lalezar (single weight, poster/impact display face): the card's idea is "the stroke is the viewport" (source prompt: very heavy
//    strokes, weight 900). Lalezar is the heaviest Persian display family in the kit. No fake bold (weight is built in).
//    Caption: Vazirmatn 700 (neutral product UI voice, variable weight). Both families are loaded through FaFonts.
// DIRECTION DECISIONS
//  - Word position: centred (symmetric) - kept. Mask scale origin ORIGIN re-derived for the new word so it sits in a solid stroke
//    (source prompt: a hand-picked origin always breaks when the word changes).
//  - Dashboard drift: translateX +110 -> -110 becomes -110 -> +110 (dir()), the window pans with the reading direction;
//    after 100f the same mirrored path eases to 0, as in the original.
//  - FakeDashboard is LTR (sidebar left, search right): MirroredDashboard (sidebar right, search left, grid reads RTL).
//  - Mask wrapper and take-over layer share the same mirrored dashMotion, as designed.
//  - Caption: centred, direction rtl, so no further left/right decision.
// KEPT: scale 1→26 (physics of a zoom), vertical positions, colours, bezier, all frame numbers.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaFonts, FaRoot, faText, dir } from '../../_fa';
import { MirroredDashboard } from './MirroredDashboard';
import { MASK_UPEM, MASK_ADVANCE, MASK_GLYPHS } from './maskGlyphs';

const WORD_SIZE = 500; // px per em: the glyph run is MASK_ADVANCE/MASK_UPEM em wide
const BASELINE = 640;
const k = WORD_SIZE / MASK_UPEM;
const tx = (1920 - MASK_ADVANCE * k) / 2;
const MASK_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><g fill="white">` +
  MASK_GLYPHS.map((g) => `<path transform="translate(${(tx + g.x * k).toFixed(2)} ${(BASELINE - g.y * k).toFixed(2)}) scale(${k} ${-k})" d="${g.d}"/>`).join('') +
  `</g></svg>`;
const MASK_URL = `url("data:image/svg+xml,${encodeURIComponent(MASK_SVG)}")`;
// mask scale origin: must sit inside a solid stroke, re-derived for the Persian word
const ORIGIN = '47.8% 46%';

export const TextAsMask: React.FC = () => {
  const f = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

  const endT = interpolate(f, [100, 130], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // dashboard drift mirrored: dir() flips the physical x offsets (reading direction is leftwards)
  const driftX = interpolate(f, [20, 100], [dir(110), dir(-110)], clamp);
  const dx = f < 100 ? driftX : interpolate(endT, [0, 1], [dir(-110), 0]);
  const dashS = interpolate(endT, [0, 1], [1.15, 1]);

  const maskS = interpolate(endT, [0, 1], [1, 26]);
  const cover = interpolate(endT, [0.25, 0.9], [0, 1], clamp);
  const caption = interpolate(f, [100, 114], [1, 0], clamp);

  const dashMotion: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translateX(${dx}px) scale(${dashS})`,
    transformOrigin: '50% 50%',
  };

  return (
    <FaFonts families={['Lalezar', 'Vazirmatn']}>
      <div style={{ width: 1920, height: 1080, background: G.ink, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${maskS})`,
            transformOrigin: ORIGIN,
            WebkitMaskImage: MASK_URL,
            maskImage: MASK_URL,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: '1920px 1080px',
            maskSize: '1920px 1080px',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 / maskS})`, transformOrigin: ORIGIN }}>
            <div style={dashMotion}>
              <MirroredDashboard />
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', inset: 0, opacity: cover }}>
          <div style={dashMotion}>
            <MirroredDashboard />
          </div>
        </div>

        <FaRoot
          family="Vazirmatn"
          style={{
            top: 'auto',
            bottom: 70,
            height: 'auto',
            textAlign: 'center',
            ...faText(30, { fontWeight: 700, color: G.mid, opacity: caption, unicodeBidi: 'isolate' }),
          }}
        >
          متن به‌عنوان ماسک
        </FaRoot>
      </div>
    </FaFonts>
  );
};
