/* pa-film.js — craft kit for canvas films (persian-arts v3).
   Born from clip-01 review (metrics/clip-01.json):
     C1-02 no overlap between copy lines      -> PF.typeQueue() throws on overlap
     C1-03 hard-edged "light" polygons        -> PF.beam() = cached soft-falloff sprite
     C1-04 no texture / no vignette           -> PF.grain(), PF.vignette()
     C1-06 one easing for everything          -> PF.motion named job table
   Exposes window.PF. Depends on pa-motion.js (window.PA). */
(function () {
  const PA = window.PA;
  const {clamp, lerp, prog, ease} = PA;

  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  // PA.prog(T, s, d) takes a DURATION, not an end time. Passing an end time makes every fade-out
  // finish late (clip-01 shipped overlapping copy lines because of it). PF.win(t, start, end) is the
  // unambiguous form; prefer it for anything expressed as a window.
  const win = (t, a, b) => clamp((t - a) / (b - a));

  const cache = new Map();
  const memo = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };

  // ---------------------------------------------------------------- texture
  // Grain: three full-frame noise layers are baked once, then just blitted with a rotating offset.
  // The first version re-filled the whole canvas with an "overlay" pattern every frame, which cost
  // more than all the drawing in the film put together on a software renderer (~10 min per clip).
  function grainLayer(W, H, seed) {
    return memo(`glayer:${W}:${H}:${seed}`, () => {
      const c = mk(W, H), g = c.getContext("2d");
      const img = g.createImageData(W, H);
      const R = PA.rng(seed);
      for (let i = 0; i < W * H; i++) {
        const v = R();
        const lum = v < 0.5 ? 0 : 255;
        const a = Math.round(26 * (0.3 + 0.7 * Math.abs(v - 0.5) * 2));
        img.data[i * 4] = lum; img.data[i * 4 + 1] = lum; img.data[i * 4 + 2] = lum; img.data[i * 4 + 3] = a;
      }
      g.putImageData(img, 0, 0);
      return c;
    });
  }
  function grain(ctx, W, H, t, {amount = 0.055, seed = 7} = {}) {
    const n = Math.floor(t * 30) % 3;
    const layer = grainLayer(W, H, seed + n);
    ctx.save();
    ctx.globalAlpha = amount * 2.2;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  function vignette(ctx, W, H, {strength = 0.55, inner = 0.42, outer = 0.92} = {}) {
    const g = memo(`vig:${W}:${H}:${strength}:${inner}:${outer}`, () => {
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * inner, W * 0.5, H * 0.5, Math.max(W, H) * outer);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(0.62, `rgba(0,0,0,${strength * 0.35})`);
      grd.addColorStop(1, `rgba(0,0,0,${strength})`);
      return grd;
    });
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // ---------------------------------------------------------------- light
  // A beam is a cached sprite: gradient along its length AND a soft cross-fade on its edges,
  // so there is never a straight polygon boundary (C1-03).
  function beamSprite(len, wide, color) {
    return memo(`beam:${len}:${wide}:${color}`, () => {
      const c = mk(len, wide), g = c.getContext("2d");
      const along = g.createLinearGradient(0, 0, len, 0);
      along.addColorStop(0, color.replace("ALPHA", 0.55));
      along.addColorStop(0.45, color.replace("ALPHA", 0.22));
      along.addColorStop(1, color.replace("ALPHA", 0));
      g.fillStyle = along;
      g.fillRect(0, 0, len, wide);
      // soften the two long edges with a vertical alpha ramp
      const across = g.createLinearGradient(0, 0, 0, wide);
      across.addColorStop(0, "rgba(0,0,0,0)");
      across.addColorStop(0.5, "rgba(0,0,0,1)");
      across.addColorStop(1, "rgba(0,0,0,0)");
      g.globalCompositeOperation = "destination-in";
      g.fillStyle = across;
      g.fillRect(0, 0, len, wide);
      return c;
    });
  }
  // draw one soft beam from (x,y) at angle rad; alpha 0..1; wobble = slow width breathing
  function beam(ctx, x, y, angle, len, wide, color, alpha = 1, wobble = 0) {
    const spr = beamSprite(Math.round(len), Math.round(wide), color);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    const k = 1 + wobble;
    ctx.drawImage(spr, 0, (-wide * k) / 2, len, wide * k);
    ctx.restore();
  }

  // ---------------------------------------------------------------- type
  // One copy line at a time. Throws (loudly, at build time) instead of shipping overlapping text.
  function typeQueue(lines, {gap = 0.4} = {}) {
    const sorted = [...lines].sort((a, b) => a.t0 - b.t0);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      const need = prev.t1 + gap;
      if (cur.t0 < need - 1e-6) {
        throw new Error(`type overlap: "${cur.txt}" starts ${cur.t0.toFixed(2)}s but "${prev.txt}" ends ${prev.t1.toFixed(2)}s (need +${gap}s gap)`);
      }
    }
    return sorted;
  }

  // Fit a single line inside maxW by shrinking the type size (never by letter-spacing or squeezing).
  // Persian must keep its natural joins, so the only legal knob is the font size.
  function fitPx(ctx, text, px, maxW, weight = 700, family = "PAHead") {
    ctx.save();
    ctx.font = `${weight} ${px}px ${family}, Vazirmatn, sans-serif`;
    const w = ctx.measureText(String(text)).width;
    ctx.restore();
    if (w <= maxW || w <= 0) return px;
    return Math.floor(px * (maxW / w) * 0.985);
  }

  // Word-level reveal (never per-character: that breaks Persian joins). Words are drawn right-to-left
  // with a small rise + alpha stagger; within a word the shaping is the browser's.
  function drawLine(ctx, o) {
    const {text, x, y, weight = 700, family = "PAHead", color = "#fff", alpha = 1, t = 0, t0 = 0, stagger = 0.055, dur = 0.42, rise = 0.35, maxW = 0} = o;
    if (alpha <= 0.004) return;
    const px = maxW > 0 ? fitPx(ctx, text, o.px, maxW, weight, family) : o.px;
    ctx.save();
    ctx.font = `${weight} ${px}px ${family}, Vazirmatn, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const words = String(text).split(/\s+/).filter(Boolean);
    const space = ctx.measureText(" ").width;
    const widths = words.map((w) => ctx.measureText(w).width);
    const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
    let cur = x - total / 2; // left edge of the (centered) line
    const order = words.map((w, i) => i).reverse(); // RTL: first word on the right
    for (const i of order) {
      const p = clamp(prog(t, t0 + (words.length - 1 - i) * stagger, dur));
      const e = ease.outCubic(p);
      if (p > 0.001) {
        ctx.globalAlpha = alpha * e;
        ctx.fillStyle = color;
        ctx.fillText(words[i], cur + widths[i] / 2 - widths[i] / 2, y + (1 - e) * px * rise);
      }
      cur += widths[i] + space;
    }
    ctx.restore();
  }

  // Keyframe track: [[t, value, easingForThisSegment?], ...]. One track = one property, one job per
  // segment, which is how a camera move gets a settle without every other move getting it too.
  function keyframes(list) {
    return function (t) {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t <= list[i][0]) {
          const a = list[i - 1], b = list[i];
          const e = (b[2] || ease.inOutSine)(clamp((t - a[0]) / (b[0] - a[0])));
          return lerp(a[1], b[1], e);
        }
      }
      return list[list.length - 1][1];
    };
  }

  // ---------------------------------------------------------------- motion
  // Named jobs, so a film never uses one easing for everything (C1-06).
  const motion = {
    enter: (t) => ease.outCubic(t),      // UI/type entering
    reveal: (t) => ease.outExpo(t),      // a form being uncovered
    settle: (t) => ease.outBack(t),      // object landing / locking
    spring: (t) => ease.spring(t, 140, 0.5),
    ambient: (t) => ease.inOutSine(t),   // slow drift, camera breathing
    exit: (t) => ease.inCubic(t),        // leaving, accelerating away
  };

  // ---------------------------------------------------------------- depth
  // Parallax: each layer moves by cam * depth. depth 0 = locked to camera (sky), 1 = foreground.
  function parallax(ctx, layers, camX, camY) {
    for (const L of layers) {
      ctx.save();
      ctx.translate(-camX * (L.depth || 0), -camY * (L.depth || 0));
      L.draw(ctx);
      ctx.restore();
    }
  }

  window.PF = {win, keyframes, grain, vignette, beam, beamSprite, typeQueue, drawLine, fitPx, motion, parallax, mk};
})();
