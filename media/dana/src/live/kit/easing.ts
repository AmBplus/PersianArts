// Easing + timing helpers for the Dana film. All times in SECONDS (local to a scene) unless named `frame`.
import {useCurrentFrame, useVideoConfig} from "remotion";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type EaseFn = (t: number) => number;
export const E = {
  linear: ((t) => t) as EaseFn,
  outQuad: ((t) => 1 - (1 - t) * (1 - t)) as EaseFn,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as EaseFn,
  outQuart: ((t) => 1 - Math.pow(1 - t, 4)) as EaseFn,
  outQuint: ((t) => 1 - Math.pow(1 - t, 5)) as EaseFn,
  outExpo: ((t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))) as EaseFn,
  inCubic: ((t) => t * t * t) as EaseFn,
  inExpo: ((t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10))) as EaseFn,
  inOutQuad: ((t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)) as EaseFn,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as EaseFn,
  inOutSine: ((t) => -(Math.cos(Math.PI * t) - 1) / 2) as EaseFn,
  outBack: (k = 1.7): EaseFn => (t) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2),
};

/** Eased 0..1 progress of time `t` inside [a, b] seconds. */
export const seg = (t: number, a: number, b: number, ease: EaseFn = E.linear) => ease(clamp((t - a) / Math.max(1e-6, b - a)));

/** Local scene time in seconds (inside a <Sequence>) and fps. */
export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {t: frame / fps, frame, fps};
};

/** A smooth pulse that peaks at `at` seconds and decays (for beat-synchronised brightness). */
export const pulse = (t: number, at: number, width = 0.18) => {
  const d = (t - at) / width;
  return d < 0 ? 0 : Math.exp(-d * 3);
};

/** Deterministic pseudo-random in [0,1) from an integer seed (stable across frames). */
export const rnd = (seed: number) => {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
