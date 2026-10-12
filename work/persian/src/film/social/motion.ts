// Easing formulas and timing grid. Every value in the film is a pure function of the frame number.
export const FPS = 30;
export const BPM = 120; // one beat = 0.5 s = 15 frames, one bar (4 beats) = 2 s
export const BEAT = (60 / BPM) * FPS;

/** Scene cut times in seconds, all on the 120 BPM grid (multiples of 0.5 s). Last value = film end. */
export const CUT_TIMES_S = [0, 2, 4, 7, 10, 13.5, 17] as const;
export const CUT_FRAMES = CUT_TIMES_S.map((s) => Math.round(s * FPS));
export const DURATION_FRAMES = CUT_FRAMES[CUT_FRAMES.length - 1];

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

/** Damped shake after an impact at frame `at` (deterministic). */
export const shake = (f: number, at: number, amp: number, len = 10) => {
  if (f < at || f > at + len) return 0;
  const k = (f - at) / len;
  return amp * (1 - k) * Math.sin((f - at) * 2.4);
};
