// PERSIAN (RTL) localization of shotcraft "spotlight-sweep-reveal" (light-play-moves) — period 55f, amplitude, masks, fades untouched.
// Text: "SPOTLIGHT\nON" -> «در کانون\nتوجه» (idiom "in the spotlight"; two lines kept, no per-letter splitting; the dim/bright/final
//   layers all render the same string so the mask reveals real joined Persian).
// Direction decisions:
//  - Spotlight swing starts toward the READING side: the sin offset is flipped with dir(), so the first pass goes right -> left
//    and the beam still ends centred after two round trips.
//  - Cone (symmetric trapezoid from the top centre), radial spot/mask, vertical gradient: radially symmetric -> KEPT; they follow x.
//  - Title is centred, symmetric composition -> centring KEPT; text is direction:rtl.
//  - letterSpacing .04em removed (breaks joining), no uppercase. line-height 1.15 -> 1.5 so dots/ascenders are not cut by the mask.
// Font: Lalezar (single-weight poster display = heavy Helvetica Neue 800 role, no fake bold), wordSpacing .15em.
// Raster assets: none.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { FaFonts, faText, dir } from '../../_fa';

const BG = '#2a2a28';
const INKW = '#f5f5f3';

const CX = 960;
const CY = 540;
const AMP = 560; // swing amplitude
const PERIOD = 55; // frames per round trip
const SWEEP_END = 110; // two round trips done
const REVEAL_END = 125; // brighten complete, then fully still

const textStyle: React.CSSProperties = {
  ...faText(140, { fontFamily: '"Lalezar", "Vazirmatn", sans-serif', wordSpacing: '0.15em' }),
  lineHeight: 1.5,
  color: INKW,
  textAlign: 'center',
  whiteSpace: 'pre',
};

const TitleText: React.FC = () => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
    <div style={textStyle}>{'در کانون\nتوجه'}</div>
  </AbsoluteFill>
);

export const SpotlightSweepReveal: React.FC = () => {
  const f = useCurrentFrame();

  const sweepF = Math.min(f, SWEEP_END);
  const x = CX + dir(AMP * Math.sin((2 * Math.PI * sweepF) / PERIOD));

  const brighten = interpolate(f, [SWEEP_END, REVEAL_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(f, [SWEEP_END, REVEAL_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sweepAlive = f < REVEAL_END; // conditional unmount keeps the tail truly still

  const maskGrad = `radial-gradient(circle 380px at ${x}px ${CY}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0) 100%)`;

  return (
    <FaFonts families={['Lalezar', 'Vazirmatn']}>
      <AbsoluteFill style={{ backgroundColor: BG, direction: 'rtl' }}>
        {/* dim text, always present */}
        <AbsoluteFill style={{ opacity: 0.07 }}>
          <TitleText />
        </AbsoluteFill>

        {sweepAlive && (
          <>
            {/* light cone: narrows from the top to the spot */}
            <AbsoluteFill
              style={{
                opacity: fadeOut,
                clipPath: `polygon(${CX - 70}px -40px, ${CX + 70}px -40px, ${x + 420}px ${CY + 230}px, ${x - 420}px ${CY + 230}px)`,
                background:
                  'linear-gradient(to bottom, rgba(245,245,243,0.16), rgba(245,245,243,0.03) 85%, rgba(245,245,243,0) 100%)',
              }}
            />
            {/* soft spot on the dark wall */}
            <AbsoluteFill
              style={{
                opacity: fadeOut,
                background: `radial-gradient(circle 460px at ${x}px ${CY}px, rgba(245,245,243,0.22) 0%, rgba(245,245,243,0.08) 55%, rgba(245,245,243,0) 100%)`,
              }}
            />
            {/* bright text, moving radial mask */}
            <AbsoluteFill
              style={{
                opacity: fadeOut === 1 ? 1 : Math.max(fadeOut, 0),
                WebkitMaskImage: maskGrad,
                maskImage: maskGrad,
              }}
            >
              <TitleText />
            </AbsoluteFill>
          </>
        )}

        {/* full-bright settle layer */}
        <AbsoluteFill style={{ opacity: brighten }}>
          <TitleText />
        </AbsoluteFill>
      </AbsoluteFill>
    </FaFonts>
  );
};
