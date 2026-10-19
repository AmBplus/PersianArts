// dev-only: measure the per-ratio empty-band distribution over the five v1 masters (2 ratios each),
// so the gate's per-ratio baseline table is a measured number, not a guess.
import { streamVideo } from '../lib.mjs';
import * as empty from '../empty-band.mjs';
const films = ['s08-damnoosh-steam', 's09-university-sun', 's10-factory-parsa', 's11-sabadak-app', 's12-pikavar-route'];
const out = {};
for (const f of films) for (const r of ['9x16', '16x9']) {
  const file = `media/film-versions/${f}/v1/silent-${r}.mp4`;
  const shares = [];
  await streamVideo(file, 320, (n, img) => { if (n % 6 === 0) shares.push(empty.checkFrame(img).share); });
  shares.sort((a, b) => a - b);
  const q = (p) => shares[Math.min(shares.length - 1, Math.floor(p * shares.length))];
  const ratio = r === '9x16' ? '9:16' : '16:9';
  (out[ratio] ||= []).push({ film: f, n: shares.length, median: +q(0.5).toFixed(3), p90: +q(0.9).toFixed(3), max: +shares[shares.length - 1].toFixed(3) });
  console.log(ratio, f, 'n=' + shares.length, 'median', q(0.5).toFixed(3), 'p90', q(0.9).toFixed(3), 'max', shares[shares.length - 1].toFixed(3));
}
for (const ratio of Object.keys(out)) {
  const rows = out[ratio];
  const med = rows.map((r) => r.median).sort((a, b) => a - b);
  const p90 = rows.map((r) => r.p90).sort((a, b) => a - b);
  console.log('SUMMARY', ratio, 'films=' + rows.length, 'median-of-medians', med[med.length >> 1], 'median-of-p90', p90[p90.length >> 1], 'max', Math.max(...rows.map((r) => r.max)));
}
