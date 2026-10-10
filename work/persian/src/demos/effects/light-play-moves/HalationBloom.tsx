// PERSIAN (RTL) localization of shotcraft "halation-bloom" (light-play-moves) — timeline, easings, blur/brightness untouched.
// Text: "10x" -> «۱۰ برابر» (idiomatic "ten-fold" claim, Persian digits); kicker "HALATION BLOOM" -> «هالهٔ نور».
// Direction decisions:
//  - crash-zoom (scale about the centre), bloom pop/fall and blur halo are radially symmetric -> KEPT (no reading direction).
//  - Text is centred in both layers -> centring KEPT; the headline is direction:rtl so digits+word order reads right-to-left.
//  - Kicker: letterSpacing .35em removed (breaks joining), hierarchy kept by size/colour; no uppercase.
//  - The halo layer is a copy of the same TextBlock, so the Persian glyph shapes bloom exactly as the Latin ones did.
// Font: Lalezar (single-weight poster face = the heavy Helvetica 800 slam role; no fake bold). Kicker: Vazirmatn 600 (neutral label).
// Registry duration is only 17f; the design is 145f (inspect the bloom beats with the harness --duration 145).
// Raster assets: none.
//
// Original design: dark-grey ground, big white text crash-zooms 2.4 -> 1 (7f in-quad + 2f rebound);
// from the impact frame a blurred, brightened copy pops (scale 1 -> 1.3, 6f out-cubic), falls linearly 20f to 0.35,
// then eases 15f to a 0.22 steady glow. Fully still afterwards.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { FaFonts, faDigits, faText } from '../../_fa';

const BG = '#2a2a28';
const WHITE = '#f7f7f5';
const MID = '#8f8f8d';

// timeline (30fps)
const ZOOM_START = 8;
const IMPACT = 15;
const REBOUND_END = 17;
const POP_END = IMPACT + 6;
const FALL_END = POP_END + 20;
const SETTLE_END = FALL_END + 15;

const TextBlock: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      ...faText(230, { fontFamily: '"Lalezar", "Vazirmatn", sans-serif', wordSpacing: '0.15em' }),
      color,
      lineHeight: 1.5,
      whiteSpace: 'nowrap',
    }}
  >
    {faDigits('10')} برابر
  </div>
);

export const HalationBloom: React.FC = () => {
  const frame = useCurrentFrame();

  const zoomIn = interpolate(frame, [ZOOM_START, IMPACT], [2.4, 0.94], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rebound = interpolate(frame, [IMPACT, REBOUND_END], [0.94, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textScale = frame < IMPACT ? zoomIn : rebound;
  const textOpacity = interpolate(frame, [ZOOM_START, ZOOM_START + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bloomScale = interpolate(frame, [IMPACT, POP_END], [1, 1.3], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomFall = interpolate(frame, [POP_END, FALL_END], [1, 0.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomSettle = interpolate(frame, [FALL_END, SETTLE_END], [0.35, 0.22], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomOpacity = frame < FALL_END ? bloomFall : bloomSettle;

  return (
    <FaFonts families={['Lalezar', 'Vazirmatn']}>
      <div
        style={{
          width: 1920,
          height: 1080,
          background: BG,
          position: 'relative',
          overflow: 'hidden',
          direction: 'rtl',
        }}
      >
        {/* static kicker */}
        <div
          style={{
            position: 'absolute',
            top: 110,
            width: '100%',
            textAlign: 'center',
            ...faText(30, { fontFamily: '"Vazirmatn", sans-serif', fontWeight: 600 }),
            color: MID,
          }}
        >
          هالهٔ نور
        </div>

        {/* halo layer: copy of the text, blur + brighten, mounted from the impact frame */}
        {frame >= IMPACT && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${bloomScale})`,
              opacity: bloomOpacity,
              filter: 'blur(22px) brightness(1.8)',
            }}
          >
            <TextBlock color={WHITE} />
          </div>
        )}

        {/* main text: crash-zoom stop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${textScale})`,
            opacity: textOpacity,
          }}
        >
          <TextBlock color={WHITE} />
        </div>
      </div>
    </FaFonts>
  );
};
