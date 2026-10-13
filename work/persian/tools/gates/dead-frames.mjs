// (c) dead-frames: near-uniform frames (>= 98.5% of pixels within 10 of the dominant colour) at scene starts.
export const name = 'dead-frames';
export function uniformShare(img) {
  const { w, h, data } = img; const hist = new Map();
  let n = 0;
  for (let i = 0; i < w * h; i += 3) { const k = ((data[i * 3] >> 4) << 8) | ((data[i * 3 + 1] >> 4) << 4) | (data[i * 3 + 2] >> 4); hist.set(k, (hist.get(k) || 0) + 1); n++; }
  let best = 0, bk = 0; for (const [k, v] of hist) if (v > best) { best = v; bk = k; }
  // include the 26 neighbouring bins so smooth gradients of one colour count as uniform
  let tot = 0; const r = bk >> 8, g = (bk >> 4) & 15, b = bk & 15;
  for (const [k, v] of hist) if (Math.abs((k >> 8) - r) <= 1 && Math.abs(((k >> 4) & 15) - g) <= 1 && Math.abs((k & 15) - b) <= 1) tot += v;
  return tot / n;
}
// uniform: Map frame->share. starts: scene start frames. Returns runs >= minRun consecutive uniform frames starting within [s-2, s+10].
export function analyse(uniform, starts, minRun = 3, thr = 0.985) {
  const out = [];
  for (const s of starts.filter((v) => v > 0)) {
    let run = [];
    for (let f = Math.max(0, s - 2); f <= s + 10; f++) {
      if ((uniform.get(f) ?? 0) >= thr) run.push(f); else { if (run.length >= minRun) out.push({ scene_start: s, frames: `${run[0]}-${run[run.length - 1]}`, len: run.length }); run = []; }
    }
    if (run.length >= minRun) out.push({ scene_start: s, frames: `${run[0]}-${run[run.length - 1]}`, len: run.length });
  }
  return out;
}
