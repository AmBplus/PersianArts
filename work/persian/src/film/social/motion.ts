// Easing formulas and timing grid. Every value in the film is a pure function of the frame number.
//
// HOW TO RETIME TO A MUSIC TRACK
//   All scene cuts are positions on a beat grid (CUT_BEATS), not seconds. A cut lands at
//       T0_S + beats * 60 / BPM   seconds   (the first cut is always 0)
//   so the hook simply grows by T0_S (time of the track's first downbeat) and every later cut follows the tempo.
//   The film's duration is the last cut. Default BPM 120 / T0_S 0 gives cuts 0, 2, 4, 7, 10, 13.5, 18 s.
//   Override without code edits through Remotion input props, e.g.
//       npx remotion render ../film/social/entry.tsx Social9x16 out.mp4 --props='{"BPM":124,"T0_S":0.25}'
//   Scene-internal motion is authored on the 120 BPM reference grid (BEAT_REF = 15 frames) and read through
//   useSceneFrame(), which stretches/compresses the local clock by BPM/120, so every pop, hop and pulse stays on the
//   beat at any tempo. To change WHERE the cuts fall, edit CUT_BEATS (1 bar = 4 beats).
import {getInputProps, useCurrentFrame} from "remotion";

export const FPS = 30;
const props = (() => {
  try {
    return getInputProps() as {BPM?: number | string; T0_S?: number | string};
  } catch {
    return {};
  }
})();
const num = (v: unknown, d: number) => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? d : Number(v));

export const BPM_REF = 120; // tempo the scene-internal animation was authored at
export const BPM = num(props.BPM, 120); // overridable: --props='{"BPM":124}'
export const T0_S = num(props.T0_S, 0); // overridable: seconds before the first downbeat
export const BEAT_S = 60 / BPM;
export const BEAT = BEAT_S * FPS; // real frames per beat at the current tempo
export const BEAT_REF = (60 / BPM_REF) * FPS; // 15 reference frames per beat (use inside scenes)
export const TEMPO = BPM / BPM_REF;

/** Scene cuts in beats from the first downbeat (bars: 0, 1, 2, 3.5, 5, 6.75, 9). Last value = film end.
 *  The last value is 36 (not 34): +1 s so the CTA tail can ring out after the bow settles at local 98. */
export const CUT_BEATS = [0, 4, 8, 14, 20, 27, 36] as const;
export const CUT_TIMES_S = CUT_BEATS.map((b, i) => (i === 0 ? 0 : T0_S + b * BEAT_S));
export const CUT_FRAMES = CUT_TIMES_S.map((s) => Math.round(s * FPS));
export const DURATION_FRAMES = CUT_FRAMES[CUT_FRAMES.length - 1];

/** Scene-local frame on the 120 BPM reference grid (equals useCurrentFrame() at BPM 120). */
export const useSceneFrame = () => useCurrentFrame() * TEMPO;

/** Recorded music/SFX bed to be added later. Undefined = silent render (no synthesized audio, ever). */
export const AUDIO_SRC: string | undefined = undefined;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const prog = (f: number, start: number, dur: number) => clamp((f - start) / dur);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const C1 = 1.70158, C3 = C1 + 1;
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const outBack = (t: number) => 1 + C3 * Math.pow(t - 1, 3) + C1 * Math.pow(t - 1, 2);
export const inBack = (t: number) => C3 * t * t * t - C1 * t * t;
export const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const inCubic = (t: number) => t * t * t;

/** Damped shake after an impact at frame `at` (deterministic). */
export const shake = (f: number, at: number, amp: number, len = 10) => {
  if (f < at || f > at + len) return 0;
  const k = (f - at) / len;
  return amp * (1 - k) * Math.sin((f - at) * 2.4);
};
