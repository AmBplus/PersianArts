/* pa-motion.js: generic helpers for html-films (no film-specific code). Load with <script src="../lib/pa-motion.js">.
   Exposes window.PA = {clamp, lerp, prog, ease, rng, faDigits, ltr, beats, sched, loopBlend}. */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (T, s, d) => clamp((T - s) / d);
  const C1 = 1.70158, C3 = C1 + 1;
  const ease = {
    outCubic: t => 1 - Math.pow(1 - t, 3), inCubic: t => t * t * t, inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: t => 1 + C3 * Math.pow(t - 1, 3) + C1 * Math.pow(t - 1, 2), outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    // damped spring step response (overshoots 1); k stiffness, d damping ratio 0..1
    spring: (t, k = 120, d = 0.45) => { const w = Math.sqrt(k), s = Math.sqrt(1 - d * d); return 1 - Math.exp(-d * w * t) * (Math.cos(w * s * t) + (d / s) * Math.sin(w * s * t)); }
  };
  // seeded RNG (mulberry32): same seed, same sequence, in every capture
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // Persian digits: faDigits(10) -> "۱۰"; ltr() wraps in an LTR isolate (number-lint clean)
  const faDigits = n => String(n).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const ltr = s => `<span dir="ltr" style="unicode-bidi:isolate">⁦${s}⁩</span>`;
  // beat clock: beats(bpm) -> {bs, sec(b), beat(t)}
  const beats = bpm => ({ bs: 60 / bpm, sec: b => b * 60 / bpm, beat: t => t * bpm / 60 });
  // tick schedule from an explicit beat list (tempo curve = changing gaps): index(b) of last tick <= b, phase(b) 0..1 to the next
  const sched = list => {
    const index = b => { let i = -1; for (let k = 0; k < list.length; k++) if (list[k] <= b + 1e-9) i = k; return i; };
    return { index, phase: b => { const i = index(b); if (i < 0 || i >= list.length - 1) return 0; return clamp((b - list[i]) / (list[i + 1] - list[i])); } };
  };
  // loop seam: weight 0..1 that blends the ending state into the opening state over [b0,b1] (beats); lerp every style value with it
  const loopBlend = (b, b0, b1) => ease.inOutSine(clamp((b - b0) / (b1 - b0)));
  window.PA = { clamp, lerp, prog, ease, rng, faDigits, ltr, beats, sched, loopBlend };
})();
