// C7 light-model (static + pixel).
//
// (a) STATIC, the hard half: ART-DIRECTION-STANDARD.md §3.1 requires the film HEADER to declare the light
//     (KEY: direction + colour + softness, FILL, RIM, AMBIENT). A film with no key-light declaration FAILs: "no light
//     model" was audit D1, and a declaration is the thing that was never written down. The gate looks for a
//     `KEY`/`keyLight` block in the film's own source and requires a direction, a colour and a softness inside it.
// (b) PIXEL, the WARN-only half: a large object must show a VALUE RAMP across its surface, not one constant value.
//     Method: the biggest foreground component (vs the dominant field colour) is the subject; its own luma sd must not
//     be near zero. WHAT IT CANNOT SEE, and why it can only WARN: it cannot tell whether the ramp's direction agrees
//     with the declared key light; a hard two-plane lit/unlit split gives a high sd without being lit; a photographic
//     texture gives a high sd without having a light; and a deliberately flat 2D graphic mark (allowed for pure
//     graphic marks by §3.2) is legitimately constant. So the pixel half never lowers a film's verdict to PASS either:
//     a FAIL here comes only from the missing declaration.
import { scanSources } from './craft-src.mjs';
import { components, fgMask, dominant } from './lib.mjs';
export const name = 'light-model';

export const threshold = { objMinShare: 0.03, flatSd: 6, fgThr: 45 };
const DIRECTION = /\b(top[\s-]?left|top[\s-]?right|topleft|upper[\s-]?left|top|side|back|left|right|front)\b/i;
const SOFTNESS = /\b(very\s+soft|soft|hard)\b/i;
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/;
const KEYTOK = /\bKEY\b|\bkeyLight\b|\bkey_light\b|\bkey-light\b/i;

// (a) find the declared light in the film's own source. Returns the fields it could prove.
export function declaredLight(srcDir) {
  const scanned = scanSources(srcDir);
  if (scanned.error) return { error: scanned.error };
  const found = [];
  for (const f of scanned.files) {
    const txt = f.text;
    for (const m of txt.matchAll(new RegExp(KEYTOK.source, 'gi'))) {
      const win = txt.slice(m.index, m.index + 420);
      const line = txt.slice(0, m.index).split(/\r?\n/).length;
      const dir = DIRECTION.exec(win), col = COLOUR.exec(win), soft = SOFTNESS.exec(win);
      if (dir || col || soft) found.push({ file: f.file, line, dir: dir ? dir[1] : null, colour: col ? col[0] : null, softness: soft ? soft[1] : null, text: win.split(/\r?\n/).slice(0, 3).join(' ').trim().slice(0, 120) });
    }
  }
  const complete = found.filter((x) => x.dir && x.colour && x.softness);
  const fill = /(FILL|fill\s*[:=])\s*[:\-]?\s*\d{1,3}\s*%/i.test(scanned.files.map((f) => f.text).join('\n'));
  const rim = /\bRIM\b|\brim\s*[:=]/i.test(scanned.files.map((f) => f.text).join('\n'));
  const ambient = /\bAMBIENT\b|\bambient\s*[:=]/i.test(scanned.files.map((f) => f.text).join('\n'));
  return { filesScanned: scanned.files.length, candidates: found, complete, fill, rim, ambient };
}

// (b) value ramp on the largest object.
export function checkFrame(img, opt = {}) {
  const th = { ...threshold, ...opt };
  const { w, h } = img;
  const bg = dominant(img).rgb;
  const mask = fgMask(img, bg, th.fgThr);
  const { comps } = components(mask, w, h, Math.round(0.004 * w * h));
  let best = null;
  for (const c of comps) {
    const share = c.n / (w * h);
    if (share < th.objMinShare) continue;
    if (!best || share > best.share) best = { ...c, share };
  }
  if (!best) return { object: null, reason: 'no foreground object >= 3% of the frame' };
  let n = 0, s = 0, s2 = 0;
  for (let y = best.y0; y <= best.y1; y++) for (let x = best.x0; x <= best.x1; x++) {
    const i = y * w + x; if (!mask[i]) continue;
    const l = 0.299 * img.data[i * 3] + 0.587 * img.data[i * 3 + 1] + 0.114 * img.data[i * 3 + 2];
    n++; s += l; s2 += l * l;
  }
  const mean = s / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { object: { share: +best.share.toFixed(3), box: [best.x0, best.y0, best.x1, best.y1], lumaMean: Math.round(mean), lumaSd: +sd.toFixed(1) }, flat: sd < th.flatSd && (best.y1 - best.y0 + 1) / h >= 0.10, reason: null };
}

export function analyse(frames, sorted, opt = {}) {
  const per = [];
  for (const n of sorted) { const r = checkFrame(frames.get(n), opt); per.push({ n, ...r }); }
  const withObj = per.filter((p) => p.object);
  const flat = withObj.filter((p) => p.flat);
  return { per, withObj, flat };
}

export function verdict(declared, pix, opt = {}) {
  if (!declared || declared.error) return { status: 'N/A', reason: `--src: ${declared ? declared.error : 'no source dir'} (half (a) is static)` };
  if (!declared.filesScanned) return { status: 'N/A', reason: '--src contains no authoring file to scan for a light declaration' };
  const pixel = pix && pix.withObj.length
    ? `; pixel half (WARN-only): ${pix.flat.length}/${pix.withObj.length} sampled frames hold a large object with luma sd < ${opt.flatSd ?? threshold.flatSd}` +
      (pix.flat.length ? ` e.g. f${pix.flat[0].n} sd ${pix.flat[0].object.lumaSd} box ${pix.flat[0].object.box}` : '')
    : '; pixel half: no frame held a foreground object >= 3% of the frame (N/A)';
  const extras = `FILL ${declared.fill ? 'yes' : 'no'}, RIM ${declared.rim ? 'yes' : 'no'}, AMBIENT ${declared.ambient ? 'yes' : 'no'}`;
  if (!declared.complete.length) {
    const near = declared.candidates[0];
    return { status: 'FAIL', reason: `no key-light declaration in the film header (needs direction + colour + softness); ${declared.candidates.length} KEY mention(s)${near ? `, nearest ${near.file.split('/').pop()}:${near.line} dir=${near.dir ?? '-'} colour=${near.colour ?? '-'} softness=${near.softness ?? '-'}` : ''}; ${extras}${pixel}` };
  }
  const L = declared.complete[0];
  const warn = pix && pix.flat.length > 0;
  return {
    status: warn ? 'WARN' : 'PASS',
    reason: `key light declared ${L.file.split('/').pop()}:${L.line} dir=${L.dir} colour=${L.colour} softness=${L.softness}; ${extras}${pixel}`,
  };
}
