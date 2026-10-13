/* pa-maze.js: seeded generative maze (recursive backtracker) + solver + dead-end branch finder. Pure and deterministic (seed -> same maze).
   PA.maze({cols, rows, seed}) -> {cols, rows, open(c,r,dir), walls (list of [x0,y0,x1,y1] in cell units), solve(from,to), branch(path, minLen, maxLen)}
   dir: 0 up, 1 right, 2 down, 3 left. Load AFTER pa-motion.js (uses PA.rng). */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const maze = ({ cols, rows, seed = 1 }) => {
    const rnd = G.PA.rng(seed), o = new Uint8Array(cols * rows);          // bit d = open towards d
    const seen = new Uint8Array(cols * rows), st = [[0, 0]]; seen[0] = 1;
    while (st.length) {
      const [c, r] = st[st.length - 1], nb = [];
      for (let d = 0; d < 4; d++) { const nc = c + DX[d], nr = r + DY[d]; if (nc >= 0 && nr >= 0 && nc < cols && nr < rows && !seen[nr * cols + nc]) nb.push(d); }
      if (!nb.length) { st.pop(); continue; }
      const d = nb[Math.floor(rnd() * nb.length)], nc = c + DX[d], nr = r + DY[d];
      o[r * cols + c] |= 1 << d; o[nr * cols + nc] |= 1 << ((d + 2) % 4); seen[nr * cols + nc] = 1; st.push([nc, nr]);
    }
    const open = (c, r, d) => !!(o[r * cols + c] & (1 << d));
    const walls = [];                                                      // outer frame + inner walls, as unit-cell segments
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!open(c, r, 0)) walls.push([c, r, c + 1, r]);
      if (!open(c, r, 3)) walls.push([c, r, c, r + 1]);
      if (r === rows - 1 && !open(c, r, 2)) walls.push([c, r + 1, c + 1, r + 1]);
      if (c === cols - 1 && !open(c, r, 1)) walls.push([c + 1, r, c + 1, r + 1]);
    }
    const solve = (a, b) => {                                              // BFS path of [c,r] cells
      const prev = new Map(), key = (c, r) => r * cols + c, q = [a]; prev.set(key(...a), null);
      while (q.length) { const [c, r] = q.shift(); if (c === b[0] && r === b[1]) break;
        for (let d = 0; d < 4; d++) if (open(c, r, d)) { const nc = c + DX[d], nr = r + DY[d]; if (!prev.has(key(nc, nr))) { prev.set(key(nc, nr), [c, r]); q.push([nc, nr]); } } }
      const path = []; let cur = b; while (cur) { path.unshift(cur); cur = prev.get(key(...cur)); } return path;
    };
    // dead-end branch hanging off the solution path: returns {at (index in path), cells (branch cells from the junction outward)} with length in [minLen,maxLen]
    const branch = (path, minLen, maxLen) => {
      const onP = new Set(path.map(([c, r]) => r * cols + c)); let best = null;
      for (let i = 1; i < path.length - 1; i++) { const [c, r] = path[i];
        for (let d = 0; d < 4; d++) { if (!open(c, r, d)) continue; let nc = c + DX[d], nr = r + DY[d]; if (onP.has(nr * cols + nc)) continue;
          const cells = [[nc, nr]]; let pc = c, pr = r, cc = nc, cr = nr;
          for (;;) { let nxt = null; for (let e = 0; e < 4; e++) { if (!open(cc, cr, e)) continue; const xc = cc + DX[e], xr = cr + DY[e]; if (xc === pc && xr === pr) continue; nxt = [xc, xr]; break; }
            if (!nxt) break; pc = cc; pr = cr; [cc, cr] = nxt; cells.push([cc, cr]); if (cells.length > maxLen) break; }
          if (cells.length >= minLen && cells.length <= maxLen && (!best || Math.abs(i / path.length - 0.4) < Math.abs(best.at / path.length - 0.4))) best = { at: i, cells };
        } }
      return best;
    };
    return { cols, rows, open, walls, solve, branch };
  };
  G.PA = Object.assign(G.PA || {}, { maze });
})();
