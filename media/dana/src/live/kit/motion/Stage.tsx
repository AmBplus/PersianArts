// Shared stage helpers for v2 scenes: slow camera drift (parallax feel, frame-deterministic)
// and the night-scene base (background + ambient dot field + watermark slot).
import React from "react";
import {AbsoluteFill} from "remotion";
import {Background, Watermark} from "../index";
import {E, seg} from "../easing";
import {DotFieldWave} from "./DotFieldWave";

/** Slow camera drift: uniform scale-up + gentle translate across the scene duration. */
export const Drift: React.FC<{
  t: number;
  dur: number;
  amt?: number;
  ox?: number;
  oy?: number;
  children?: React.ReactNode;
}> = ({t, dur, amt = 0.035, ox = 0, oy = -14, children}) => {
  const e = E.inOutSine(seg(t, 0, dur));
  return (
    <AbsoluteFill style={{transform: `scale(${1 + amt * e}) translate(${ox * e}px, ${oy * e}px)`, transformOrigin: "50% 50%"}}>
      {children}
    </AbsoluteFill>
  );
};

/** Night base: deep-navy background + dim ambient dot-field wave from the scene anchor + watermark. */
export const NightBase: React.FC<{
  t: number;
  dur: number;
  origin?: {x: number; y: number};
  dropAt?: number;            // local seconds of a music DROP — fires one strong wave
  watermark?: boolean;
  children?: React.ReactNode;
}> = ({t, dur, origin = {x: 960, y: 540}, dropAt, watermark = true, children}) => (
  <Background theme="night" t={t}>
    <DotFieldWave origin={origin} t0={0} speed={0.3} opacity={0.5} />
    {dropAt !== undefined && dropAt >= 0 && (
      <DotFieldWave origin={origin} t0={Math.round(dropAt * 30)} speed={1.1} opacity={t < dropAt ? 0 : 0.9 * Math.max(0, 1 - (t - dropAt) / 2.2)} />
    )}
    {watermark && <Watermark />}
    <Drift t={t} dur={dur}>{children}</Drift>
  </Background>
);
