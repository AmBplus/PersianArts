// scratch: bright flat fields found on the two reference frames
import { readStill } from '../lib.mjs';
import { flatRegions } from '../craft-common.mjs';
for (const f of ['s09-16x9/s09_24.80s.png', 's11-9x16/s11_15.48s.png', 's10-16x9/s10_19.80s.png']) {
  const img = readStill('media/briefs-local/storylab-craft/_frames/' + f, 960);
  const fl = flatRegions(img, { minShare: 0.005 }).filter((x) => (0.299 * x.rgb[0] + 0.587 * x.rgb[1] + 0.114 * x.rgb[2]) >= 190 && x.lumaSd <= 14 && x.share <= 0.6);
  console.log(`### ${f} ${img.w}x${img.h} brightFields=${fl.length}`);
  for (const x of fl.slice(0, 8)) console.log(`   box=[${x.x0},${x.y0},${x.x1},${x.y1}] share=${(x.share * 100).toFixed(1)}% luma=${Math.round(0.299 * x.rgb[0] + 0.587 * x.rgb[1] + 0.114 * x.rgb[2])} sd=${x.lumaSd.toFixed(1)}`);
}
