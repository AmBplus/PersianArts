/* pa-camera.js: generic camera / path / actor helpers for html-films (load AFTER pa-motion.js). Pure functions of time.
   PA.keys(list, ease)        keyframe track: list [[t,v],...] -> f(t) (ease between keys, clamped outside)
   PA.pathFollow(points)      polyline by arc length: {len, at(s) -> {x,y,angle(rad tangent)}, cum}
   PA.camera(opts)            camera track from zoom keys + a follow function; world->screen transform string for an SVG <g>
   PA.hop(p)                  hop curve for p in 0..1: {y (0..1 height), sx, sy} squash and stretch (stretch on take-off, squash on landing)
   PA.actor(timeline)         persistent actor: {spawn,retire,poses:[[t,pose],...]} -> state(t) {alive, pose(interpolated numbers)}
   PA.selfTest()              tiny assertions (run: node work/persian/htmlfilm/lib/pa-selftest.mjs) */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const P = G.PA || {};
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const keys = (list, ease = inOutSine) => t => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) if (t <= list[i][0]) { const [t0, v0] = list[i - 1], [t1, v1] = list[i]; return lerp(v0, v1, ease(clamp((t - t0) / (t1 - t0)))); }
    return list[list.length - 1][1];
  };
  const pathFollow = pts => {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1];
    const at = s => {
      s = clamp(s, 0, len); let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const seg = cum[i] - cum[i - 1] || 1, k = (s - cum[i - 1]) / seg, a = pts[i - 1], b = pts[i];
      return { x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    };
    return { len, at, cum };
  };
  // camera: zoom keys [[t,z],...], follow(t)->{x,y} world point to centre on (apply your own lag), screen size W,H, optional world clamp {x0,y0,x1,y1}
  const camera = o => {
    const zoom = keys(o.zoom, o.ease || inOutSine);
    return t => {
      const z = zoom(t), f = o.follow(t); let cx = f.x, cy = f.y;
      if (o.clamp) { const hw = o.W / 2 / z, hh = o.H / 2 / z; cx = clamp(cx, o.clamp.x0 + hw, Math.max(o.clamp.x0 + hw, o.clamp.x1 - hw)); cy = clamp(cy, o.clamp.y0 + hh, Math.max(o.clamp.y0 + hh, o.clamp.y1 - hh)); }
      return { z, cx, cy, transform: `translate(${(o.W / 2 - cx * z).toFixed(2)} ${(o.H / 2 - cy * z).toFixed(2)}) scale(${z.toFixed(4)})`, toScreen: (x, y) => [o.W / 2 + (x - cx) * z, o.H / 2 + (y - cy) * z] };
    };
  };
  const hop = p => { p = clamp(p); const y = 4 * p * (1 - p); const up = p < 0.5 ? 1 - p * 2 : 0;  // up: stretch while rising
    const land = p > 0.86 ? (p - 0.86) / 0.14 : p < 0.08 ? 1 - p / 0.08 : 0;                          // squash around contact
    return { y, sx: 1 - 0.12 * up * 0.6 + 0.22 * land, sy: 1 + 0.2 * up * (y > 0.05 ? 1 : 0) - 0.24 * land }; };
  const actor = tl => t => {
    const alive = t >= tl.spawn && t < tl.retire, poses = tl.poses, pose = {};
    for (const k of Object.keys(poses[0][1])) pose[k] = keys(poses.map(([tt, ps]) => [tt, ps[k]]))(t);
    return { alive, pose };
  };
  const selfTest = () => {
    const eq = (a, b, m) => { if (Math.abs(a - b) > 1e-6) throw new Error("selfTest " + m + ": " + a + " != " + b); };
    const pf = pathFollow([[0, 0], [10, 0], [10, 10]]); eq(pf.len, 20, "len"); eq(pf.at(15).y, 5, "at"); eq(pf.at(5).angle, 0, "tan0"); eq(pf.at(15).angle, Math.PI / 2, "tan1");
    eq(keys([[0, 0], [2, 10]], t => t)(1), 5, "keys");
    const c = camera({ zoom: [[0, 1], [1, 2]], follow: () => ({ x: 50, y: 50 }), W: 100, H: 100, ease: t => t })(1); eq(c.z, 2, "zoom"); eq(c.toScreen(50, 50)[0], 50, "centre");
    const h = hop(0.5); eq(h.y, 1, "hop"); const a = actor({ spawn: 1, retire: 3, poses: [[1, { r: 0 }], [3, { r: 10 }]] }); eq(a(2).pose.r, 5, "actor"); eq(a(0).alive ? 1 : 0, 0, "alive");
    return true;
  };
  G.PA = Object.assign(P, { keys, pathFollow, camera, hop, actor, selfTest });
})();
