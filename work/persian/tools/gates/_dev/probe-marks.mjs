// scratch: why are the s09 headline glyphs not detected as a light text line?
import { readStill, components } from '../lib.mjs';
import { inkMask, groundUnder } from '../craft-common.mjs';
const FRAMES = [
  'media/briefs-local/storylab-craft/_frames/s09-16x9/s09_24.80s.png',
  'media/briefs-local/storylab-craft/_frames/s10-16x9/s10_19.80s.png',
];
const only = process.env.FR ? [process.env.FR] : FRAMES;
for (const f of only) {
  const img = readStill(f, 960);
  const { w, h } = img;
  console.log(`\n### ${f.split('_frames/')[1]}`);
  for (const polarity of ['dark', 'light']) {
    const { mask, L } = inkMask(img, polarity, {});
    const g = groundUnder(img, mask, L, {});
    const { comps } = components(mask, w, h, Math.max(6, Math.round(0.00004 * w * h)));
    let tot = 0; for (let i = 0; i < mask.length; i++) tot += mask[i];
    const rows = comps.map((c) => ({ bw: c.x1 - c.x0 + 1, bh: c.y1 - c.y0 + 1, fill: +(c.n / ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1))).toFixed(2), n: c.n, box: [c.x0, c.y0, c.x1, c.y1] }));
    rows.sort((a, b) => b.n - a.n);
    console.log(`${polarity}: inkPx=${tot} comps=${comps.length}`);
    for (const r of rows.slice(0, 10)) console.log(`   ${JSON.stringify(r)} rej=${r.bw > 0.16 * w ? 'tooWide' : r.bh > 0.10 * h ? 'tooTall' : r.bh < 0.006 * h ? 'tooShort' : r.fill < 0.16 ? 'sparse' : r.bw / r.bh > 4 ? 'flat' : ''}`);
  }
}
