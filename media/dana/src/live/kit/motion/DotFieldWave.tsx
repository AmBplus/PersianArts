// T2 primitive — DotFieldWave. Motion ported from shotcraft card
// ui-entrance/radial-wave/RadialWave.tsx (Persian version).
// Kept from the card (exact formulas, frame-deterministic, no clocks):
//  - distance-staggered wave 1 (outgoing): w1 = outCubic ramp of width 0.18 after d*0.35;
//  - wave 2 (outer-in pulse): sin(pi*w2) with the 0.62 + (1-d)*0.25 schedule;
//  - scale s = w1*(1 + 0.5*sin(pi*w1)) + pulse2*0.8 (mid-pass overshoot);
//  - brightness wave: base + w1*0.5 + pulse2*0.25; highlight color + glow on pulse2 > 0.3.
// Changed for the film kit: 17x9 design-stage field -> full-bleed 64x36 dot grid over
// 1920x1080 with 2.2px dots resting at alpha 0.10 (spec), center origin -> parametrized
// origin in px, looped k (loopable backdrop, wave restarts after the outer-in pulse),
// card colors (#6c8cff/#b9f2ff/#7fd8ff) -> blue tokens (blueSky / ice).
import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {E, clamp} from "../easing";
import {palette} from "../tokens";

const COLS = 64;
const ROWS = 36;
const W = 1920;
const H = 1080;
const BASE_ALPHA = 0.1;

// Dot centers in px (module-level, static).
const DOTS = Array.from({length: ROWS * COLS}, (_, i) => ({
  x: ((i % COLS) + 0.5) / COLS * W,
  y: (Math.floor(i / COLS) + 0.5) / ROWS * H,
}));

export const DotFieldWave: React.FC<{
  origin?: {x: number; y: number};
  t0?: number;
  /** wave speed multiplier: 1 reproduces the card's schedule, >1 = faster */
  speed?: number;
  /** max wave radius in px (defaults to the farthest corner from origin) */
  maxR?: number;
  /** overall layer opacity */
  opacity?: number;
  dotColor?: string;
  /** loop length in wave-phase units (k); the outgoing wave restarts after each pass */
  loopK?: number;
}> = ({origin = {x: 960, y: 540}, t0 = 0, speed = 1, maxR, opacity = 1, dotColor = palette.blueSky, loopK = 1.05}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const rMax = maxR ?? Math.hypot(Math.max(origin.x, W - origin.x), Math.max(origin.y, H - origin.y));
  const kRaw = ((frame - t0) / fps) * speed;
  const k = frame < t0 ? -1 : loopK > 0 ? kRaw % loopK : kRaw;

  return (
    <AbsoluteFill style={{opacity}}>
      {DOTS.map(({x, y}, i) => {
        const d = Math.hypot(x - origin.x, y - origin.y) / rMax; // 0..1, farther dots light later
        // wave 1: outgoing light-up; wave 2: outer-in pulse (card schedule)
        const w1 = E.outCubic(clamp((k - d * 0.35) / 0.18));
        const w2 = clamp((k - (0.62 + (1 - d) * 0.25)) / 0.15);
        const pulse2 = Math.sin(w2 * Math.PI);
        const s = w1 * (1 + 0.5 * Math.sin(w1 * Math.PI)) + pulse2 * 0.8;
        const hi = pulse2 > 0.3;
        const alpha = Math.min(1, BASE_ALPHA + w1 * 0.5 + pulse2 * 0.25);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 2.2,
              height: 2.2,
              margin: -1.1,
              borderRadius: "50%",
              background: hi ? palette.ice : dotColor,
              opacity: alpha,
              transform: `scale(${Math.max(0.001, s)})`,
              boxShadow: hi ? `0 0 8px ${palette.blueSky}` : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
