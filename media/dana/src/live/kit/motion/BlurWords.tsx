// BlurWords — ported MOTION from shotcraft card `typography/blur-slide/BlurSlide.tsx` (114f).
// Kept from the card: word-by-word cascade where opacity / translateY / blur share ONE eased
// progress per word (out-cubic), a short per-word stagger, whole words as animation units
// (never letters), rtl flex row with 0.32em gaps, vertical y-rise (not directional).
// Primitive changes (spec numbers, 1920x1080 coords): blur 14→0, y +36→0, opacity 0→1;
// stagger/hold expressed in FRAMES (perWordFrames, durFrames) instead of the card's normalised
// line windows. dir prop accepted, only 'rtl' is valid for Persian.
import React from "react";
import {useCurrentFrame} from "remotion";
import {palette} from "../tokens";
import {clamp, E} from "../easing";

export const BlurWords: React.FC<{
  text: string;
  startFrame: number;
  perWordFrames?: number;
  dir?: "rtl";
  color?: string;
  size?: number;
  /** frames each word takes to fully arrive (card: ~0.32 of the line window) */
  durFrames?: number;
  weight?: number;
}> = ({text, startFrame, perWordFrames = 5, dir = "rtl", color = palette.ice, size = 64, durFrames = 16, weight = 700}) => {
  const frame = useCurrentFrame();
  const ws = text.split(" ").filter((s) => s.trim());

  return (
    <div
      style={{
        display: "flex",
        direction: dir,
        gap: size * 0.32,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: '"Estedad", system-ui, sans-serif',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.5,
        letterSpacing: 0,
        color,
        unicodeBidi: "plaintext",
      }}
    >
      {ws.map((w, i) => {
        // one eased progress drives opacity + y + blur together (the card's signature)
        const p = E.outCubic(clamp((frame - startFrame - i * perWordFrames) / durFrames));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              letterSpacing: 0,
              opacity: p,
              transform: `translateY(${(1 - p) * 36}px)`,
              filter: `blur(${(1 - p) * 14}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export default BlurWords;
