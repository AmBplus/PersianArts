/* pa-layout.js: per-ratio layout table helper (load AFTER pa-motion.js). A film defines ONE table {ratio: {W,H,...anything}} and asks for the entry of the
   current ratio; values may be numbers, arrays or keyframe lists. This makes the 16:9 version a real re-composition (own positions, camera keys, text boxes), not a crop.
   PA.layout(table, ratio)        -> entry for ratio (throws when missing)
   PA.ratioSize(ratio)            -> {W,H} for "16x9" | "9x16" | "1x1" | "4x5"
   PA.fitText(ctx, text, maxW, size) -> font size that fits maxW (canvas measureText)
   PA.selfTest4()                 tiny assertions (run by lib/pa-selftest.mjs) */
(function () {
  const G = typeof window !== "undefined" ? window : globalThis;
  const SIZES = { "16x9": { W: 1920, H: 1080 }, "9x16": { W: 1080, H: 1920 }, "1x1": { W: 1080, H: 1080 }, "4x5": { W: 1080, H: 1350 } };
  const ratioSize = r => { if (!SIZES[r]) throw new Error("unknown ratio " + r); return SIZES[r]; };
  const layout = (table, ratio) => { if (!table[ratio]) throw new Error("layout table has no entry for " + ratio); return Object.assign({}, ratioSize(ratio), table[ratio]); };
  const fitText = (ctx, text, maxW, size) => { ctx.font = ctx.font.replace(/\d+px/, size + "px"); const w = ctx.measureText(text).width; return w <= maxW ? size : Math.floor(size * maxW / w); };
  const selfTest4 = () => {
    const t = { "16x9": { a: 1 }, "9x16": { a: 2 } };
    if (layout(t, "16x9").W !== 1920 || layout(t, "9x16").a !== 2 || layout(t, "9x16").H !== 1920) throw new Error("selfTest4 layout");
    let threw = false; try { layout(t, "1x1"); } catch (e) { threw = true; } if (!threw) throw new Error("selfTest4 missing entry must throw");
    return true;
  };
  G.PA = Object.assign(G.PA || {}, { layout, ratioSize, fitText, selfTest4 });
})();
