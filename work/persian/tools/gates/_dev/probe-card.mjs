// scratch: components of the s09 end card region (hollow glyph outlines?)
import { readStill, components } from '../lib.mjs';
import { inkMask } from '../craft-common.mjs';
const img = readStill('media/briefs-local/storylab-craft/_frames/s09-16x9/s09_24.80s.png', 960);
const { w, h } = img;
for (const polarity of ['dark', 'light']) {
  const { mask } = inkMask(img, polarity, { thr: { dark: 20, light: 13 } });
  const { comps } = components(mask, w, h, 10);
  const sel = comps.filter((c) => c.y0 > 90 && c.y1 < 230).map((c) => {
    const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
    return { box: [c.x0, c.y0, c.x1, c.y1], bh, fill: +(c.n / (bw * bh)).toFixed(2) };
  }).sort((a, b) => b.fill - a.fill);
  console.log(`${polarity} comps in y90..230: ${sel.length}`);
  for (const s of sel.slice(0, 12)) console.log('   ' + JSON.stringify(s));
}
