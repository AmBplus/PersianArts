// GradientSweep — ported MOTION from shotcraft card `typography/gradient-word-sweep/GradientWordSweep.tsx` (20f fill).
// Kept from the card: the gradient charge sweeps across the word FROM THE READING-START EDGE
// (right) leftwards — clipPath inset revealing from the right, soft-masked glow layers behind the
// sharp body (three blurs: wide / mid / near-core), a bright TRAIL window just behind the wavefront
// that decays after the pass, a white hot-core at the fill head while sweeping, an ambient radial
// glow behind the word rising with the charge. Not yet swept = base colour text.
// Primitive changes: fully PROGRESS-driven (0..1 prop, no internal clock), the card's seeded
// lightning bolts / per-frame flicker noise are dropped (they need a frame clock; the spec asks for
// the band pass only). Colours default to Dana tokens (no gold). Whole word as one mask — never
// per-letter. Text keeps its base colour outside the pass; swept part stays gradient.
import React from "react";
import {clamp} from "../easing";
import {palette} from "../tokens";

export const GradientSweep: React.FC<{
  /** 0..1 sweep progress (parent derives it from the frame) */
  progress: number;
  /** CSS gradient angle in degrees; 268 sweeps from the right (reading start) */
  angle?: number;
  /** sweep colours (tokens); default blueSky → blueMid → ice */
  colors?: string[];
  baseColor?: string;
  size?: number;
  weight?: number;
  /** the word(s) to sweep — render as children */
  children?: React.ReactNode;
}> = ({progress, angle = 268, colors, baseColor = "rgba(234,242,255,0.55)", size = 96, weight = 800, children}) => {
  const cols = colors ?? [palette.blueSky, palette.blueMid, palette.ice];
  const p = clamp(progress);
  const pPct = p * 100;
  const filling = p > 0 && p < 1;
  // trail fade: decays over the last 20% after the head reaches the far edge (card: 10f after FILL_END)
  const trailFade = p >= 1 ? Math.max(0, 1 - (p - 1) / 0.2) : 1;

  const grad = `linear-gradient(${angle}deg, ${cols.join(", ")})`;

  const gradText: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundImage: grad,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    letterSpacing: 0,
  };

  // soft-edged reveal mask for glow layers (card: maskImage gradient with soft shoulder)
  const softMask = (soft: number): string =>
    `linear-gradient(270deg, #000 0%, #000 ${Math.max(0, pPct - soft)}%, transparent ${Math.min(100, pPct + soft * 0.6)}%)`;
  const maskStyle = (soft: number): React.CSSProperties => ({
    WebkitMaskImage: softMask(soft),
    maskImage: softMask(soft),
  });

  // trail boost just behind the wavefront (card: TRAIL = 34% width)
  const TRAIL = 34;
  const trailMask =
    `linear-gradient(270deg, transparent 0%, transparent ${Math.max(0, pPct - TRAIL)}%, ` +
    `rgba(0,0,0,0.9) ${Math.max(0, pPct - 3)}%, rgba(0,0,0,0.9) ${Math.min(100, pPct + 1)}%, ` +
    `transparent ${Math.min(100, pPct + 6)}%)`;

  const base: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    fontFamily: '"Estedad", system-ui, sans-serif',
    fontWeight: weight,
    fontSize: size,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: baseColor,
    direction: "rtl",
    whiteSpace: "nowrap",
  };

  return (
    <span style={base}>
      {children}
      {p > 0.001 && (
        <>
          {/* mid glow layer */}
          <span aria-hidden style={{...gradText, ...maskStyle(10), filter: "blur(18px) saturate(1.4) brightness(1.15)", opacity: 0.62 * p}} />
          {/* near-core glow */}
          <span aria-hidden style={{...gradText, ...maskStyle(7), filter: "blur(6px) brightness(1.25)", opacity: 0.72 * Math.min(1, p + 0.1)}} />
          {/* sharp gradient body, revealed from the right edge (reading start) */}
          <span aria-hidden style={{...gradText, clipPath: `inset(-25% 0 -25% ${100 - pPct}%)`}} />
          {/* trail boost just behind the head, decays after the pass */}
          {trailFade > 0.01 && p < 1 && (
            <span
              aria-hidden
              style={{
                ...gradText,
                WebkitMaskImage: trailMask,
                maskImage: trailMask,
                filter: "blur(9px) saturate(1.7) brightness(1.7)",
                opacity: 0.95 * trailFade,
              }}
            />
          )}
          {/* hot head core at the wavefront while filling */}
          {filling && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                color: "#fff",
                letterSpacing: 0,
                clipPath: `inset(-25% ${Math.max(0, pPct - 10)}% -25% ${Math.max(0, 100 - pPct)}%)`,
                filter: "blur(3px)",
                opacity: 0.9,
                textShadow: `0 0 22px rgba(234,242,255,0.9), 0 0 55px ${palette.blueMid}88`,
              }}
            />
          )}
        </>
      )}
    </span>
  );
};

export default GradientSweep;
