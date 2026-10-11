// WeightPulse — ported MOTION from shotcraft card `typography/type-rhythm-sync/FontWeightPump.tsx` (10f).
// Kept from the card: a beat envelope that decays over 10 frames as (1 - t/10)^0.8 (exactly 0 at the
// end), a DISCRETE weight jump while the envelope is hot (>0.15) — idle weight vs hit weight — and a
// CONTINUOUS stroke thickening on the same envelope (WebkitTextStroke, same ink as the text so
// joined strokes show no seams). No size change at any point (spec).
// Primitive changes: weights come from props ([700,800] per spec instead of the card's 400↔900),
// the card's accent scaleX is dropped (spec: بدون تغییر اندازه) and the demo's beat dots are not
// part of the primitive. Estedad variable makes both weights real.
import React from "react";
import {useCurrentFrame} from "remotion";
import {palette} from "../tokens";

const DECAY = 10; // card: envelope decays to exactly 0 over 10 frames

const envAt = (frame: number, beat: number) => {
  const t = frame - beat;
  if (t < 0 || t >= DECAY) return 0;
  return Math.pow(1 - t / DECAY, 0.8);
};

export const WeightPulse: React.FC<{
  text: string;
  /** frames on which the beat hits */
  beats: number[];
  /** [idleWeight, hitWeight] */
  weights?: [number, number];
  color?: string;
  size?: number;
}> = ({text, beats, weights = [700, 800], color = palette.ice, size = 64}) => {
  const frame = useCurrentFrame();

  let env = 0;
  beats.forEach((b) => {
    env = Math.max(env, envAt(frame, b));
  });

  const weight = env > 0.15 ? weights[1] : weights[0];
  const strokeW = 10 * env; // continuous thickening on the same envelope (card)

  return (
    <div
      style={{
        fontFamily: '"Estedad", system-ui, sans-serif',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.5,
        letterSpacing: 0,
        color,
        direction: "rtl",
        whiteSpace: "nowrap",
        WebkitTextStroke: `${strokeW.toFixed(2)}px ${color}`,
      }}
    >
      {text}
    </div>
  );
};

export default WeightPulse;
