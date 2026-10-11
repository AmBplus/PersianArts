// T2 primitive — SegmentedThree. Motion ported from shotcraft card
// interaction/segmented-thumb-hero/SegmentedThumbHero.tsx (Persian version).
// Kept from the card: float-in spring (damping 14, stiffness 120, mass 0.9) with its
// translateY+shadow+opacity treatment, the pill thumb crossing in exactly 8 frames,
// RTL layout (index 0 = rightmost segment), labels above the thumb.
// Changed for the film kit: 2 options -> 3 (spec), OUT_EXPO thumb crossing (spec B table;
// card used out-cubic), light-theme control -> navy tokens, icons dropped (content = text),
// cursor/ripple interaction removed (the film has no cursor; the parent drives activeIndex).
// Contract: `activeIndex` is progress-driven and may be fractional. The parent ramps it
// LINEARLY across the 8-frame crossing window; this component applies OUT_EXPO to the
// fraction, so the thumb always lands with the card's snappy settle.
import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {E, clamp} from "../easing";
import {palette} from "../tokens";
import {faStyle} from "../fa";

export const SegmentedThree: React.FC<{
  options: string[];
  /** 0..2, may be fractional during a crossing (linear ramp over 8 frames). */
  activeIndex: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  size?: number;
}> = ({options, activeIndex, x = 960, y = 540, w = 840, h = 96, size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Float-in (card: FLOAT_IN spring, ctrlY 200->0, shadow relaxes, opacity 1.5x faster).
  const floatT = spring({frame, fps, config: {damping: 14, stiffness: 120, mass: 0.9}});
  const enterY = 200 * (1 - floatT);

  const PAD = 8;
  const segW = (w - PAD * 2) / 3;

  // Thumb position: integer part selects the pair, fraction gets OUT_EXPO (8f crossing
  // shaped here; the parent supplies the linear 8-frame ramp).
  const i0 = Math.max(0, Math.min(options.length - 2, Math.floor(activeIndex)));
  const frac = clamp(activeIndex - i0);
  const pos = i0 + E.outExpo(frac);
  const thumbRight = PAD + pos * segW;
  const thumbH = h - PAD * 2;

  // Label highlight follows the thumb's nearest segment (card: askActive = thumbT < 0.5).
  const activeNearest = Math.round(pos);

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: h / 2,
        background: "rgba(11,31,92,0.55)",
        border: "2px solid rgba(47,123,255,0.35)",
        boxShadow: `0 ${24 - floatT * 12}px ${70 - floatT * 20}px rgba(0,0,0,0.35)`,
        transform: `translateY(${enterY}px)`,
        opacity: Math.min(1, floatT * 1.5),
        display: "flex",
        alignItems: "center",
        padding: PAD,
        boxSizing: "border-box",
        direction: "rtl",
      }}
    >
      {/* pill thumb (active fill rgba(47,123,255,0.16), per spec) */}
      <div
        style={{
          position: "absolute",
          right: thumbRight,
          top: PAD,
          width: segW,
          height: thumbH,
          borderRadius: thumbH / 2,
          background: "rgba(47,123,255,0.16)",
          border: `1.5px solid rgba(47,123,255,0.8)`,
          boxShadow: "0 0 24px rgba(47,123,255,0.35), 0 6px 20px rgba(0,0,0,0.25)",
          zIndex: 1,
        }}
      />
      {options.slice(0, 3).map((opt, i) => {
        const active = i === activeNearest;
        return (
          <div
            key={i}
            style={{
              ...faStyle(size ?? h * 0.34, {fontWeight: 700, color: active ? palette.ice : "rgba(234,242,255,0.6)"}),
              width: segW,
              height: thumbH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              position: "relative",
              zIndex: 2,
              transition: "none",
            }}
          >
            {opt}
          </div>
        );
      })}
    </div>
  );
};
