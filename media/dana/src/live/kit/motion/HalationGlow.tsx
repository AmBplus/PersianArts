// T2 primitive — HalationGlow. Motion ported from shotcraft card
// effects/light-play-moves/HalationBloom.tsx (Persian version).
// Kept from the card (its exact bloom timeline, rescaled to a 0..1 progress prop):
//  - pop: scale 1 -> 1.3 over 6f, out-cubic;
//  - fall: opacity 1 -> 0.35 over the next 20f, linear;
//  - settle: opacity 0.35 -> 0.22 over the last 15f, out-quad; steady afterwards.
//  Those are the "two breathing waves" (pop + settle) the spec asks for.
// Changed for the film kit: blurred text copy behind itself -> standalone multi-layer
// (nested blurs) glow disc rendered BEHIND an element (parent overlays the element),
// crash-zoom of the text removed (the element owns its own entrance), progress is a
// prop instead of local frames (parents derive it from their own timeline).
// Pure function of props — fully frame-deterministic.
import React from "react";
import {E, clamp} from "../easing";
import {palette} from "../tokens";

// Card timeline in frames, mapped onto intensity 0..1.
const POP = 6 / 41;
const FALL_END = 26 / 41;

export const HalationGlow: React.FC<{
  x: number;
  y: number;
  /** glow disc diameter in px (roughly the size of the haloed element) */
  size: number;
  color?: string;
  /** progress 0..1 over the bloom life; >=1 = settled steady glow; <0 = hidden */
  intensity: number;
  opacity?: number;
}> = ({x, y, size, color = palette.blueSky, intensity, opacity = 1}) => {
  const p = clamp(intensity);
  if (intensity < 0) return null;

  const scale = 1 + 0.3 * E.outCubic(clamp(p / POP));
  const fall = p < FALL_END ? 1 - (0.65 * p) / FALL_END : 0.35 - 0.13 * E.outQuad(clamp((p - FALL_END) / (1 - FALL_END)));
  const base = Math.max(0, fall);

  // Nested blurs: tight bright core -> wide soft corona.
  const layers = [
    {d: 0.5, blur: size * 0.05, a: 0.85},
    {d: 0.78, blur: size * 0.11, a: 0.45},
    {d: 1.15, blur: size * 0.2, a: 0.28},
  ];
  return (
    <div style={{position: "absolute", left: x, top: y, width: 0, height: 0, opacity, pointerEvents: "none"}}>
      {layers.map((L, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (-size * L.d * scale) / 2,
            top: (-size * L.d * scale) / 2,
            width: size * L.d * scale,
            height: size * L.d * scale,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color} 0%, ${color}00 68%)`,
            filter: `blur(${L.blur}px)`,
            opacity: L.a * base,
          }}
        />
      ))}
    </div>
  );
};
