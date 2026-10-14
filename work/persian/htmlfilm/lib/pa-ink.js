/* pa-ink.js: hand-drawn ink helpers for canvas html-films (load AFTER pa-motion.js). Pure and seeded.
   PA.wobble(points, seed, amp, step)   hand-drawn polyline: subdivides every `step` px and jitters each vertex by +-amp (seeded, deterministic)
   PA.polyLen(points)                   total length
   PA.polyAt(points, frac)              point at a length fraction (the pen tip), {x,y}
   PA.drawOn(ctx, points, frac)         strokes the first `frac` of the polyline on a 2D canvas context (ink draw-on)
   PA.strokePx(zoom, minPx, maxPx, z0, z1)  scale-aware stroke width in WORLD units so the line keeps a readable SCREEN width while zooming out
   PA.logKeys(list)                     zoom track interpolated in log space (constant perceived zoom speed): list [[t, z],...] -> f(t)
   PA.selfTest3()                       tiny assertions (run by lib/pa-selftest.mjs) */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const P = G.PA || {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const polyLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const wobble = (pts, seed = 1, amp = 3, step = 40) => {
    const r = P.rng(seed), out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 2 * amp * (k ? 1 : 0.3), a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 2 * amp * (k ? 1 : 0.3)]); }
    }
    out.push(pts[pts.length - 1].slice()); return out;
  };
  const polyAt = (pts, frac) => {
    const L = polyLen(pts); let s = clamp(frac) * L;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s <= d || i === pts.length - 1) { const k = d ? Math.min(1, s / d) : 1; return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k }; } s -= d; }
    return { x: pts[0][0], y: pts[0][1] };
  };
  const drawOn = (ctx, pts, frac) => {
    if (frac <= 0) return; const L = polyLen(pts); let s = clamp(frac) * L;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s >= d) { ctx.lineTo(pts[i][0], pts[i][1]); s -= d; } else { const k = d ? s / d : 0; ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; } }
    ctx.stroke();
  };
  const strokePx = (zoom, minPx = 3, maxPx = 9, z0 = 0.4, z1 = 3) => (minPx + (maxPx - minPx) * clamp((zoom - z0) / (z1 - z0))) / zoom;
  const logKeys = list => t => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) if (t <= list[i][0]) { const [t0, z0] = list[i - 1], [t1, z1] = list[i], k = (t - t0) / (t1 - t0); return Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * k); }
    return list[list.length - 1][1];
  };
  const selfTest3 = () => {
    const eq = (a, b, m) => { if (Math.abs(a - b) > 1e-6) throw new Error("selfTest3 " + m + ": " + a + " != " + b); };
    eq(polyLen([[0, 0], [3, 4]]), 5, "len"); eq(polyAt([[0, 0], [10, 0]], 0.5).x, 5, "at");
    const a = wobble([[0, 0], [100, 0]], 5, 3), b = wobble([[0, 0], [100, 0]], 5, 3); eq(JSON.stringify(a) === JSON.stringify(b) ? 1 : 0, 1, "seeded");
    eq(logKeys([[0, 1], [2, 4]])(1), 2, "log"); eq(strokePx(1, 3, 9, 0.4, 3) > strokePx(3, 3, 9, 0.4, 3) ? 1 : 0, 1, "world width shrinks when zoomed in");
    return true;
  };
  G.PA = Object.assign(P, { wobble, polyLen, polyAt, drawOn, strokePx, logKeys, selfTest3 });
})();
