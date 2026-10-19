/* pa-effects.js — the attractive-effect kit (canvas 2D, deterministic).
 *
 * Why this file exists: the JS ecosystem has almost no "film grain / light leak / chroma" packages
 * (npm `film-grain`, `light-leak`, `chromatic-aberration`, `halftone` are 404 or unrelated), and the
 * serious ones (postprocessing, gl-transitions) are three.js/WebGL-only. So the effects that make a
 * frame look made instead of drawn are written here, in canvas 2D, on top of the PF kit.
 *
 * Rules for every effect in this file:
 *  - deterministic: seeded PRNG, frame index only. No Date.now(), no Math.random(), no rAF.
 *  - cheap: patterns and sprites are baked once (memoised) and blitted; nothing re-fills the whole
 *    canvas with a per-frame pattern (that tripled render time in clip-01).
 *  - optional: an effect that is not asked for must cost nothing.
 *
 * Usage in a film:
 *   const fx = PF.fx;              // or window.PFX
 *   fx.leak(ctx, W, H, t, {alpha: 0.22});
 *   fx.chroma(ctx, W, H, t, {px: 5});
 *   fx.halftone(ctx, W, H, t, {cell: 16});
 *   fx.dust(ctx, W, H, t);
 *   fx.scan(ctx, W, H, {spacing: 6});
 *   fx.vhs(ctx, W, H, t, {amount: 0.6});
 *   fx.grade(ctx, W, H, {warm: 0.12, cool: 0.05, contrast: 0.06});
 *
 * Order matters: grade → light → scene → chroma/leak → grain → vignette → type (never grain over the
 * type, never vignette before the type: both eat legibility).
 */
(function () {
  const PA = window.PA;
  if (!PA) throw new Error("pa-effects.js needs pa-motion.js (window.PA) first");

  const cache = new Map();
  function memo(key, make) {
    let v = cache.get(key);
    if (!v) { v = make(); cache.set(key, v); }
    return v;
  }
  function mk(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  // ------------------------------------------------------------------ chromatic aberration
  // Two tinted copies of the frame, offset sideways, screened back over the original.
  // This is the real "lens dispersion" look: red on one side, cyan on the other.
  function chroma(ctx, W, H, t, { px = 6, alpha = 0.30, jitter = 0 } = {}) {
    if (alpha <= 0.002) return;
    const j = jitter ? Math.sin(t * 12.9898) * jitter : 0;
    const dx = px + j, dy = px * 0.32;
    const buf = memo(`chroma:${W}:${H}`, () => mk(W, H));
    const o = buf.getContext("2d");
    o.globalCompositeOperation = "source-over";
    o.clearRect(0, 0, W, H);
    o.drawImage(ctx.canvas, -dx, -dy);
    o.globalCompositeOperation = "multiply";
    o.fillStyle = "#ff2a2a";
    o.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
    o.globalCompositeOperation = "source-over";
    o.clearRect(0, 0, W, H);
    o.drawImage(ctx.canvas, dx, dy);
    o.globalCompositeOperation = "multiply";
    o.fillStyle = "#2affd8";
    o.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }

  // ------------------------------------------------------------------ light leak
  // A warm (or cold) soft blob of light that drifts across the frame. The oldest trick in the book
  // and still the fastest way to make a flat render look photographed.
  function leak(ctx, W, H, t, {
    color = "#ff9a5a", alpha = 0.26, speed = 0.05, radius = 0.9, angle = 0.0, seed = 3, mode = "screen",
  } = {}) {
    if (alpha <= 0.002) return;
    const u = (t * speed) % 1;
    const x = W * (-0.1 + 1.2 * u);
    const y = H * (0.25 + 0.35 * Math.sin(u * Math.PI * 2 + seed));
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * radius);
    g.addColorStop(0, hexA(color, alpha));
    g.addColorStop(0.45, hexA(color, alpha * 0.38));
    g.addColorStop(1, hexA(color, 0));
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ------------------------------------------------------------------ halftone / dot screen
  // A rotated dot screen baked once into a tile, multiplied over the picture: print/newsprint feel.
  function halftoneTile(cell, dot) {
    const c = mk(cell, cell), g = c.getContext("2d");
    const r = cell * dot;
    const grd = g.createRadialGradient(cell / 2, cell / 2, 0, cell / 2, cell / 2, r);
    grd.addColorStop(0, "rgba(0,0,0,0.95)");
    grd.addColorStop(0.55, "rgba(0,0,0,0.55)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cell / 2, cell / 2, r, 0, Math.PI * 2);
    g.fill();
    return c;
  }
  function halftone(ctx, W, H, t, { cell = 16, dot = 0.42, angle = 0.45, alpha = 0.30 } = {}) {
    if (alpha <= 0.002) return;
    const tile = memo(`halftone:${cell}:${dot}`, () => halftoneTile(cell, dot));
    const pat = ctx.createPattern(tile, "repeat");
    if (!pat) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "multiply";
    ctx.translate(W / 2, H / 2);
    ctx.rotate(angle);
    ctx.fillStyle = pat;
    ctx.fillRect(-W, -H, W * 2, H * 2);
    ctx.restore();
  }

  // ------------------------------------------------------------------ dust and scratches
  // Old-film specks. Baked once; the layer drifts a little per frame so it never looks like a
  // static overlay, and a second sparse layer twinkles (deterministically) with the frame index.
  function dustLayer(W, H, count, seed, sizeMin, sizeMax) {
    const c = mk(W, H), g = c.getContext("2d");
    const R = PA.rng(seed);
    g.fillStyle = "rgba(255,246,230,0.9)";
    for (let i = 0; i < count; i++) {
      const x = R() * W, y = R() * H;
      const s = sizeMin + R() * (sizeMax - sizeMin);
      const a = 0.15 + R() * 0.55;
      g.globalAlpha = a;
      g.beginPath();
      g.ellipse(x, y, s, s * (0.6 + R() * 0.8), R() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }
  function dust(ctx, W, H, t, { count = 160, alpha = 0.35, seed = 11, drift = 14 } = {}) {
    if (alpha <= 0.002) return;
    const layer = memo(`dust:${W}:${H}:${count}:${seed}`, () => dustLayer(W, H, count, seed, 1, 3.4));
    const f = Math.floor(t * 30);
    const ox = (f * 7) % drift, oy = (f * 13) % drift;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(layer, ox - drift, oy - drift);
    ctx.restore();
    // the sparkle layer: one speck set per few frames, deterministic on the frame index
    const tw = memo(`dust2:${W}:${H}:${seed}`, () => dustLayer(W, H, Math.round(count / 5), seed + 7, 1, 2.2));
    const phase = (f % 9) / 9;
    ctx.save();
    ctx.globalAlpha = alpha * (0.25 + 0.5 * Math.abs(Math.sin(phase * Math.PI)));
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(tw, -ox, -oy);
    ctx.restore();
  }

  // ------------------------------------------------------------------ scanlines / CRT
  function scan(ctx, W, H, { spacing = 6, alpha = 0.16, color = "#000000" } = {}) {
    if (alpha <= 0.002) return;
    const layer = memo(`scan:${W}:${H}:${spacing}:${color}`, () => {
      const c = mk(W, H), g = c.getContext("2d");
      g.fillStyle = color;
      for (let y = 0; y < H; y += spacing) g.fillRect(0, y, W, Math.max(1, spacing * 0.42));
      return c;
    });
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  // ------------------------------------------------------------------ VHS / analogue
  // Chromatic echo + scanlines + a rolling bright band. Cheap, and instantly reads as "analogue".
  function vhs(ctx, W, H, t, { amount = 0.6, band = 0.22, spacing = 5 } = {}) {
    if (amount <= 0.002) return;
    chroma(ctx, W, H, t, { px: 3 + amount * 3, alpha: 0.18 * amount });
    scan(ctx, W, H, { spacing, alpha: 0.14 * amount });
    const y = ((t * 0.34) % 1) * (H + 260) - 130;
    const g = ctx.createLinearGradient(0, y - 90, 0, y + 90);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${0.16 * amount})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ------------------------------------------------------------------ colour grade
  // A fast film grade: warm lift, cool shadow, contrast through an overlay pass.
  function grade(ctx, W, H, { warm = 0.10, cool = 0.06, contrast = 0.08, sat = 0 } = {}) {
    if (warm > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = warm;
      ctx.fillStyle = "#ffb066";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (cool > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = cool;
      ctx.fillStyle = "#4a7bff";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (contrast > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = contrast;
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (sat > 0.002) {
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.globalAlpha = Math.min(1, sat);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ bloom-ish glow
  // A cheap glow: draw the frame blurred and screened back. One extra canvas + one filter pass.
  function glow(ctx, W, H, t, { amount = 0.22, blur = 18, threshold = 0.55 } = {}) {
    if (amount <= 0.002) return;
    const buf = memo(`glow:${W}:${H}`, () => mk(W, H));
    const o = buf.getContext("2d");
    o.clearRect(0, 0, W, H);
    o.filter = `blur(${blur}px) brightness(${(1 + threshold).toFixed(2)}) contrast(1.4)`;
    o.drawImage(ctx.canvas, 0, 0);
    o.filter = "none";
    ctx.save();
    ctx.globalAlpha = amount;
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  }

  const PFX = {chroma, leak, halftone, dust, scan, vhs, grade, glow, mk, hexA};
  window.PFX = PFX;
  if (window.PF) window.PF.fx = PFX;
})();
