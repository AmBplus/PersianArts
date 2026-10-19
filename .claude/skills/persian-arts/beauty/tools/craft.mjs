// pa craft find "<query>" | list [--domain d] [--kind k] | show <id> | check
// Search/borrow CLI for the persian-arts BEAUTY pack. Mirrors htmlfilm/lib/fx.mjs (pa fx).
// Zero dependencies, plain Node, Windows-safe. Data: .claude/skills/persian-arts/beauty/data/*.csv
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '..', 'data');

const FILES = [
  { key: 'rules',    file: 'beauty-rules.csv',        idCol: 'id', label: 'RULE',    text: 'rule',       num: 'numbers', purity: 'purity',  cost: null,      source: 'provenance', extra: 'antipattern' },
  { key: 'recipes',  file: 'recipes.csv',             idCol: 'id', label: 'RECIPE',  text: 'trigger',    num: 'duration_ms', purity: 'purity', cost: 'cost', source: 'reference', extra: 'code' },
  { key: 'palettes', file: 'palettes.csv',            idCol: 'id', label: 'PALETTE', text: 'name',       num: 'contrast_notes', purity: null,  cost: null,      source: 'use_when', extra: 'avoid_when' },
  { key: 'beats',    file: 'beat-to-treatment.csv',   idCol: 'id', label: 'BEAT',    text: 'beat_kind',  num: 'effect_id', purity: null,  cost: null,      source: 'pitfall', extra: 'recommended_treatment' },
  { key: 'budget',   file: 'frame-budget.csv',        idCol: 'technique', label: 'COST', text: 'technique', num: 'cost_ms_per_frame_1080p', purity: null, cost: null, source: 'basis', extra: 'verdict' },
];

// field weights per file (higher wins). unmatched fields default to 1.
const WEIGHTS = {
  rules:    { id: 6, domain: 4, rule: 3, why: 1, numbers: 2, do: 2, antipattern: 1, evidence: 2, purity: 2, provenance: 1 },
  recipes:  { id: 6, trigger: 4, code: 2, do: 3, dont: 1, purity: 2, cost: 3, reference: 2, easing: 2, duration_ms: 1 },
  palettes: { id: 6, name: 6, world: 6, mood: 3, use_when: 4, avoid_when: 1, contrast_notes: 2, temp: 2, ink: 1, page: 1, surface: 1, muted: 1, accent: 1, signal: 1, shadow1: 1, shadow2: 1, key_light: 1 },
  beats:    { id: 5, beat_kind: 5, emotional_job: 3, recommended_treatment: 4, camera: 2, type_role: 2, transition: 2, effect_id: 3, easing: 2, pitfall: 1 },
  budget:   { technique: 5, basis: 2, verdict: 3, notes: 2, cost_ms_per_frame_1080p: 2 },
};

// ---------------------------------------------------------------- Persian / English aliases
// Bidirectional synonym groups. A query token expands to every member of its group, so
// «پالت دمنوش» hits a tea palette and "tea palette" hits the same row.
const SYN = [
  ['palette', 'palettes', 'colour', 'color', 'palette system', 'پالت', 'رنگ', 'رنگ‌بندی', 'ترکیب رنگ'],
  ['tea', 'tisane', 'herbal', 'دمنوش', 'چای', 'دمنوشی', 'گیاهی'],
  ['coffee', 'cafe', 'قهوه', 'کافه'],
  ['food', 'grocery', 'restaurant', 'غذا', 'خوراک', 'مواد غذایی', 'رستوران', 'سوپرمارکت'],
  ['industrial', 'factory', 'manufacturing', 'steel', 'صنعتی', 'کارخانه', 'تولید', 'فولاد', 'صنعت'],
  ['university', 'education', 'school', 'campus', 'دانشگاه', 'آموزش', 'مدرسه', 'پردیس', 'تحصیل'],
  ['app', 'application', 'marketplace', 'mobile', 'اپ', 'اپلیکیشن', 'برنامه', 'فروشگاه', 'بازار'],
  ['logistics', 'delivery', 'courier', 'shipping', 'لجستیک', 'پیک', 'ارسال', 'تحویل', 'حمل'],
  ['night', 'nocturnal', 'شب', 'شبانه', 'شب‌رنگ'],
  ['premium', 'luxury', 'editorial', 'high-end', 'پرمیوم', 'لوکس', 'تجمل', 'سرمقاله‌ای', 'ادیتوریال', 'فاخر'],
  ['warm', 'warm-toned', 'گرم', 'گرم‌رنگ'],
  ['cool', 'cool-toned', 'cold', 'سرد', 'سردرنگ'],
  ['reveal', 'entrance', 'enter', 'appear', 'appearance', 'curtain', 'mask', 'uncover', 'ظاهر', 'آشکار', 'نمایان', 'ورود', 'پرده', 'ماسک', 'بازشدن'],
  ['text', 'type', 'typography', 'copy', 'headline', 'title', 'متن', 'تایپ', 'تایپوگرافی', 'تیتر', 'عنوان', 'نوشته'],
  ['motion', 'animation', 'move', 'movement', 'حرکت', 'انیمیشن', 'جنبش'],
  ['light', 'lighting', 'key light', 'نور', 'روشنایی', 'نورپردازی'],
  ['shadow', 'contact shadow', 'occlusion', 'سایه', 'سایه تماس', 'سایه‌ی تماس'],
  ['background', 'bg', 'field', 'پس‌زمینه', 'پس زمینه', 'زمینه'],
  ['gradient', 'mesh gradient', 'ramp', 'گرادیان', 'گرادیان مش', 'طیف'],
  ['grain', 'noise', 'film grain', 'texture', 'دانه', 'نویز', 'بافت', 'دانه‌بندی'],
  ['vignette', 'vinette', 'وینیت', 'تیرگی کناره'],
  ['grade', 'grading', 'tonemap', 'tone mapping', 'colour grade', 'گرید', 'تصحیح رنگ', 'تان‌مپ'],
  ['contrast', 'contrast ratio', 'کنتراست', 'تضاد'],
  ['fade', 'dissolve', 'محو', 'محوشدن', 'تلاقی'],
  ['wipe', 'slide', 'curtain wipe', 'پاک‌کردن', 'جاروب', 'کشویی'],
  ['transition', 'cut', 'انتقال', 'برش', 'گذار'],
  ['camera', 'zoom', 'push-in', 'pull-back', 'دوربین', 'زوم', 'بزرگ‌نمایی'],
  ['endcard', 'end card', 'finale', 'cta card', 'کارت پایانی', 'پایان‌بندی', 'کارت آخر'],
  ['numeral', 'number', 'digit', 'figure', 'counter', 'عدد', 'رقم', 'شمارنده', 'اعداد'],
  ['persian', 'farsi', 'fa', 'rtl', 'arabic script', 'فارسی', 'راست‌به‌چپ', 'خط فارسی'],
  ['kashida', 'tatweel', 'کشیده', 'کشیدگی', 'تطویل'],
  ['letter-spacing', 'tracking', 'letterspacing', 'فاصله حروف', 'فاصله‌ی حروف'],
  ['zwnj', 'half space', 'نیم‌فاصله', 'نیم فاصله'],
  ['isolate', 'bidi', 'isolation', 'ltr island', 'ایزوله', 'جداسازی', 'دوجهته'],
  ['weight', 'font weight', 'wght', 'وزن', 'ضخامت'],
  ['hierarchy', 'scale', 'type scale', 'سلسله‌مراتب', 'مقیاس'],
  ['snippet', 'code', 'recipe', 'implementation', 'کد', 'اسنیپت', 'پیاده‌سازی', 'دستور'],
  ['cost', 'budget', 'ms', 'performance', 'frame budget', 'هزینه', 'بودجه', 'کارایی', 'سرعت'],
  ['scene', 'shot', 'صحنه', 'نما', 'شات'],
  ['spring', 'overshoot', 'settle', 'secondary action', 'فنر', 'جهش', 'نشستن', 'حرکت ثانویه'],
  ['easing', 'ease', 'outcubic', 'outexpo', 'outback', 'ایزینگ', 'شیب حرکت'],
  ['paper', 'matte', 'metal', 'glass', 'emissive', 'material', 'کاغذ', 'مات', 'فلز', 'شیشه', 'ماده', 'جنس'],
  ['composition', 'layout', 'grid', 'envelope', 'ترکیب‌بندی', 'چیدمان', 'شبکه', 'حاشیه'],
  ['ratio', 'aspect', '9x16', '16x9', 'landscape', 'portrait', 'نسبت', 'افقی', 'عمودی'],
  ['hero', 'subject', 'scale floor', 'قهرمان', 'سوژه', 'سوژه اصلی'],
  ['glow', 'bloom', 'halation', 'درخشش', 'هاله', 'شکوفایی'],
  ['bokeh', 'blur', 'depth of field', 'بوکه', 'محوی', 'عمق میدان'],
  ['slice', 'band', 'strips', 'برش نواری', 'نوار', 'اسلایس'],
  ['blur', 'motion blur', 'shutter', 'موشن بلور', 'محو حرکتی'],
  ['dust', 'haze', 'atmosphere', 'motes', 'غبار', 'هوا', 'ذرات'],
  ['sound', 'beat', 'bpm', 'ریتم', 'ضرب', 'صدا'],
  ['stat', 'metric', 'measure', 'data', 'آمار', 'معیار', 'داده', 'اندازه'],
  ['price', 'offer', 'discount', 'قیمت', 'تخفیف', 'پیشنهاد'],
  ['logo', 'lockup', 'brand', 'لوگو', 'نشان', 'برند'],
];

const SYN_MAP = new Map();
for (const group of SYN) {
  const flat = [];
  for (const g of group) for (const piece of String(g).split(' ')) flat.push(piece);
  for (const term of flat) {
    const n = norm(term);
    if (!n) continue;
    if (!SYN_MAP.has(n)) SYN_MAP.set(n, new Set());
    for (const t of flat) SYN_MAP.get(n).add(norm(t));
  }
}

function faDigits(s) {
  return s.replace(/[\u06F0-\u06F9]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 48)).replace(/[\u0660-\u0669]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 48));
}

function norm(s) {
  return faDigits(String(s == null ? '' : s).toLowerCase())
    .replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9')   // Arabic yeh/kaf -> Persian
    .replace(/[\u200C\u200D\u0640]/g, ' ')                        // ZWNJ, ZWJ, tatweel
    .replace(/[\u064B-\u0655\u0670]/g, '')                        // harakat
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- CSV
function parseCsv(text) {
  const rows = []; let f = ''; let row = []; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.length > 1 || String(r[0] || '').trim() !== '');
}

function load(spec) {
  const p = path.join(DATA, spec.file);
  if (!fs.existsSync(p)) { console.error(`missing data file: ${p}`); process.exit(2); }
  const rows = parseCsv(fs.readFileSync(p, 'utf8'));
  const cols = rows[0].map((c) => c.trim());
  const out = rows.slice(1).map((r) => { const o = {}; cols.forEach((c, i) => { o[c] = (r[i] == null ? '' : r[i]).trim(); }); o._nfields = r.length; return o; });
  return { spec, cols, rows: out, path: p };
}

function loadAll() { return FILES.map(load); }

// ---------------------------------------------------------------- scoring
function expand(tokens) {
  const out = [];
  for (const t of tokens) {
    const list = [{ v: t, lit: true }];
    if (SYN_MAP.has(t)) for (const s of SYN_MAP.get(t)) if (s && s !== t) list.push({ v: s, lit: false });
    out.push(list);
  }
  return out;
}

const normCache = new WeakMap();
function fieldNorms(row) {
  let m = normCache.get(row);
  if (!m) {
    m = {};
    for (const k of Object.keys(row)) { if (k.startsWith('_')) continue; m[k] = norm(row[k]); }
    m.__all = Object.values(m).join(' ').replace(/\s+/g, ' ').trim();
    normCache.set(row, m);
  }
  return m;
}

function scoreRow(row, variants, weights) {
  const f = fieldNorms(row);
  let score = 0; const why = [];
  for (const list of variants) {
    let best = 0; let bestWhy = '';
    for (const { v, lit } of list) {
      if (!v || v.length < 2) continue;
      for (const [k, nv] of Object.entries(f)) {
        if (k === '__all' || !nv) continue;
        const w = weights[k] == null ? 1 : weights[k];
        let s = 0;
        const whole = v.length <= 4 ? nv.split(' ').includes(v) : nv.includes(v);
        if (k === 'id') s = nv === v ? w * 2 : 0;
        else if (nv === v) s = w * 2;
        else if (whole) s = w;
        else if (v.length > 3 && v.includes(nv) && nv.length > 2) s = w * 0.6;
        if (s) s *= lit ? 1.6 : 1.0;
        if (s > best) { best = s; bestWhy = k === 'id' ? `id ${row.id || row.technique}` : `${k}~${v}${lit ? '' : ' (fa/en synonym)'}`; }
      }
    }
    if (!best) {
      // last resort: whole-query substring in the row's concatenated text
      const all = f.__all || '';
      for (const { v } of list) if (v.length > 3 && all.includes(v)) { best = 1; bestWhy = `text~${v}`; }
    }
    score += best;
    if (bestWhy && why.length < 4) why.push(bestWhy);
  }
  return { score, why: [...new Set(why)] };
}

function snippet(s, n = 150) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

// ---------------------------------------------------------------- commands
const [cmd, ...rest] = process.argv.slice(2);
const all = loadAll();

if (cmd === 'find') {
  const argv = rest.filter((r) => !r.startsWith('--'));
  const q = norm(argv.join(' '));
  const toks = q.split(' ').filter((t) => t.length > 1);
  if (!toks.length) { console.error('usage: pa craft find "<query>"   (Persian or English)'); process.exit(1); }
  const variants = expand(toks);
  const hits = [];
  for (const db of all) {
    const w = WEIGHTS[db.spec.key] || {};
    for (const row of db.rows) {
      const { score, why } = scoreRow(row, variants, w);
      if (score > 0) hits.push({ db, row, score, why });
    }
  }
  if (!hits.length) {
    console.log('no match. try: light, contact shadow, text reveal, palette, tea, industrial, app, night, grade, grain, kashida, easing, cost  |  Persian: نور، سایه، ظاهر شدن متن، پالت، دمنوش، صنعتی، شب، گرید، دانه، کشیدگی');
    process.exit(0);
  }
  hits.sort((a, b) => b.score - a.score);
  // one extra hit per file at most twice, so the answer set stays mixed
  const seenFile = {}; const shown = [];
  for (const h of hits) {
    seenFile[h.db.spec.key] = (seenFile[h.db.spec.key] || 0) + 1;
    if (seenFile[h.db.spec.key] > 2) continue;
    shown.push(h);
    if (shown.length >= 5) break;
  }
  console.log(`query: "${argv.join(' ')}"  -> ${hits.length} hits, top ${shown.length}\n`);
  for (const h of shown) {
    const s = h.db.spec; const r = h.row; const id = r[s.idCol] || r.technique || '?';
    console.log(`${s.label.padEnd(7)} ${id.padEnd(26)} score ${h.score.toFixed(1)}  [${h.why.join(', ')}]`);
    console.log(`  ${snippet(r[s.text], 190)}`);
    if (s.num && r[s.num]) console.log(`  numbers: ${snippet(r[s.num], 170)}`);
    if (s.purity && r[s.purity]) console.log(`  purity: ${r[s.purity]}${s.cost && r[s.cost] ? '   cost: ' + r[s.cost] : ''}`);
    if (s.source && r[s.source]) console.log(`  source: ${snippet(r[s.source], 150)}`);
    if (s.key === 'recipes') {
      if (r.code) console.log(`  code:\n${String(r.code).split('\n').filter(Boolean).map((l) => '    ' + l).join('\n')}`);
      if (r.do) console.log(`  do: ${snippet(r.do, 170)}`);
    } else if (s.key === 'palettes') {
      console.log(`  tokens: page ${r.page}  surface ${r.surface}  ink ${r.ink}  accent ${r.accent}  signal ${r.signal}  temp ${r.temp}`);
      if (r.use_when) console.log(`  use when: ${snippet(r.use_when, 150)}`);
    } else if (s.key === 'budget') {
      console.log(`  verdict: ${r.verdict}`);
    } else if (s.key === 'beats') {
      console.log(`  treatment: ${snippet(r.recommended_treatment, 170)}`);
      if (r.pitfall) console.log(`  pitfall: ${snippet(r.pitfall, 140)}`);
    } else {
      if (r.do) console.log(`  do: ${snippet(r.do, 170)}`);
      if (r.antipattern) console.log(`  antipattern: ${snippet(r.antipattern, 150)}`);
    }
    console.log('');
  }
  console.log('craft show <id> for one full row; craft list [--domain d] for a category.');
} else if (cmd === 'list') {
  const kind = rest.includes('--kind') ? rest[rest.indexOf('--kind') + 1] : 'rules';
  const dom = rest.includes('--domain') ? norm(rest[rest.indexOf('--domain') + 1]) : null;
  const db = all.find((d) => d.spec.key === kind || d.spec.file === kind);
  if (!db) { console.log(`unknown kind "${kind}". kinds: ${FILES.map((f) => f.key).join(', ')}`); process.exit(1); }
  const rows = db.rows.filter((r) => !dom || norm(r.domain || r.world || r.beat_kind || '').includes(dom));
  for (const r of rows) {
    const id = r[db.spec.idCol] || r.technique;
    const head = r.domain ? `${r.domain.padEnd(12)} ` : '';
    console.log(`${head}${String(id).padEnd(26)} ${snippet(r[db.spec.text], 110)}`);
  }
  console.log(`${rows.length} ${kind}${dom ? ` (domain ${dom})` : ''} of ${db.rows.length}`);
} else if (cmd === 'show') {
  const id = norm(rest.filter((r) => !r.startsWith('--')).join(' '));
  if (!id) { console.error('usage: pa craft show <id>'); process.exit(1); }
  let found = null;
  for (const db of all) for (const r of db.rows) if (norm(r[db.spec.idCol] || r.technique) === id) { found = { db, r }; break; }
  if (!found) { console.log(`no row with id "${rest.join(' ')}"`); process.exit(1); }
  const { db, r } = found;
  console.log(`# ${db.spec.label} from ${db.spec.file}\n`);
  for (const c of db.cols) console.log(`${(c + ':').padEnd(24)} ${String(r[c] || '').replace(/\n/g, '\n' + ' '.repeat(24))}`);
} else if (cmd === 'check') {
  let bad = 0; const report = [];
  const ids = new Map();
  for (const db of all) {
    for (const c of db.cols) {
      const empties = db.rows.filter((r) => !String(r[c] || '').trim()).length;
      if (empties) { report.push(`  FAIL ${db.spec.file}: column "${c}" empty in ${empties} row(s)`); bad += empties; }
    }
    for (const r of db.rows) {
      const id = String(r[db.spec.idCol] || r.technique || '').trim();
      if (r._nfields !== db.cols.length) { report.push(`  FAIL ${db.spec.file}: row ${id || '(no id)'} has ${r._nfields} fields, expected ${db.cols.length}`); bad++; }
      if (!id) { report.push(`  FAIL ${db.spec.file}: a row has no id`); bad++; continue; }
      const key = `${db.spec.key}:${id}`;
      if (ids.has(key)) { report.push(`  FAIL duplicate id ${id} in ${db.spec.file}`); bad++; }
      ids.set(key, 1);
    }
    for (const r of db.rows) {
      if (db.spec.key === 'rules' && r.purity && !/^(pure|static|impure|absolute|n\/a)/.test(r.purity)) { report.push(`  WARN ${r.id}: odd purity "${r.purity}"`); }
      if (db.spec.key === 'rules' && (!r.provenance || !r.numbers)) { report.push(`  WARN ${r.id}: missing provenance or numbers`); }
      if (db.spec.key === 'recipes' && r.purity && !/^(pure|static|impure|absolute|n\/a)/.test(r.purity)) { report.push(`  WARN ${r.id}: odd purity "${r.purity}"`); }
    }
    console.log(`${db.spec.file.padEnd(24)} ${String(db.rows.length).padStart(4)} rows  ${db.cols.length} cols  [${db.cols.join(', ')}]`);
  }
  for (const line of report) console.log(line);
  console.log(bad ? `\ncheck: FAIL (${bad} problem(s))` : `\ncheck: PASS — ${all.reduce((n, d) => n + d.rows.length, 0)} rows across ${all.length} CSVs`);
  process.exit(bad ? 1 : 0);
} else {
  console.log('usage: pa craft find "<query>" | list [--domain d] [--kind rules|recipes|palettes|beats|budget] | show <id> | check');
}
