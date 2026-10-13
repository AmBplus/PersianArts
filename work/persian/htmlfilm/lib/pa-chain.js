/* pa-chain.js: follow-through / secondary motion helpers (load AFTER pa-motion.js). Pure functions of time.
   PA.chain(headAt, n, delay, rest)   headAt(t)->{x,y}; returns t -> n points; point k = head at (t - (k+1)*delay) + rest(k, t): a lagging chain (tail, rope, hair)
   PA.integrate(f, dt)                cumulative integral table of f(t); returns g(t) (e.g. wind speed -> wind phase, so clouds never jump when the wind changes)
   PA.selfTest2()                     tiny assertions (also run by lib/pa-selftest.mjs) */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const chain = (headAt, n, delay, rest = () => ({ x: 0, y: 0 })) => t => {
    const pts = [];
    for (let k = 0; k < n; k++) { const h = headAt(Math.max(0, t - (k + 1) * delay)), r = rest(k, t); pts.push({ x: h.x + r.x, y: h.y + r.y }); }
    return pts;
  };
  const integrate = (f, dt = 1 / 30, tmax = 60) => {
    const tab = [0]; for (let i = 1; i <= Math.ceil(tmax / dt); i++) tab.push(tab[i - 1] + f((i - 0.5) * dt) * dt);
    return t => { const x = Math.max(0, t) / dt, i = Math.min(tab.length - 2, Math.floor(x)), k = x - i; return tab[i] + (tab[i + 1] - tab[i]) * k; };
  };
  const selfTest2 = () => {
    const eq = (a, b, m) => { if (Math.abs(a - b) > 1e-3) throw new Error("selfTest2 " + m + ": " + a + " != " + b); };
    const c = chain(t => ({ x: t * 10, y: 0 }), 3, 0.5, k => ({ x: 0, y: k * 5 }))(2); eq(c[0].x, 15, "lag0"); eq(c[2].x, 5, "lag2"); eq(c[2].y, 10, "rest");
    eq(integrate(() => 2, 0.1, 5)(3), 6, "integral");
    return true;
  };
  G.PA = Object.assign(G.PA || {}, { chain, integrate, selfTest2 });
})();
