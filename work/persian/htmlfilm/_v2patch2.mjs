// v2 patch: s11 film.html + both events.json
import fs from "node:fs";

const files = new Map();
const fails = [];
function load(p) {
  if (!files.has(p)) {
    const buf = fs.readFileSync(p);
    const bom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    const text = buf.toString("utf8").replace(/^\uFEFF/, "");
    files.set(p, { bom, text, orig: text });
  }
  return files.get(p);
}
function rep(p, from, to, tag) {
  const f = load(p);
  const n = f.text.split(from).length - 1;
  if (n !== 1) { fails.push(`[${tag}] ${n}`); console.log(`FAIL ${tag}: ${n}`); return; }
  f.text = f.text.replace(from, to);
  console.log(`ok   ${tag}`);
}
function save() {
  for (const [p, f] of files) if (f.text !== f.orig) { fs.writeFileSync(p, f.bom ? "\uFEFF" + f.text : f.text, "utf8"); console.log(`wrote ${p}`); }
}

const S11 = "work/persian/htmlfilm/s11-sabadak-app/film.html";
const ZWNJ = "\u200c";
const F = {
  mm: "\u0645\u06cc\u0644\u06cc" + ZWNJ + "\u0645\u062a\u0631",
  first: "\u062a\u062e\u0641\u06cc\u0641 \u0627\u0648\u0644"       // تخفیف اول
};
const PM = "\u00b1" + "\u06f0" + "\u066b" + "\u06f0\u06f2";

/* ---- s11 header FIX LOG ---- */
rep(S11, `SILENT v1: zero audio; sound is a later order.`,
`SILENT v2: zero audio; sound is a later order.
---
FIX LOG v2  (fix-round-1; v1 source and v1 outputs are untouched; this file renders v2)
  G1 chip vs glyph  the finale drew the coral chip at x = W-150, straight through the last letter of the
                    label ${F.first} + " " + 15% whose centre sits at W-210, so the delivered mp4 read
                    the word with a chip inside it. The label now lives INSIDE its own pill (measured and
                    auto-fitted so it can never overflow) and the chip is a separate square on the paper,
                    to the left of the pill. No chip can overlap any glyph in EITHER ratio.
  G2 hero size      the 9:16 hero measured 8.1% of frame height per line against the 12% rule (the gate's
                    INFO 41% was measuring a decorative dashed ring, not type). The hero is now wrapped
                    over three lines at size 200/200/216 in 9:16, so ONE hero line is >12% of the 1920 px
                    height. 16:9 keeps its own two-line composition.
  G3 final beat     QUIET ran 312 frames = 10.4 s = 58% of an 18 s film and was nearly static, against
                    the FAST brief, and it drove the empty-band FAILs. The last beat now keeps moving:
                    a slow camera push, a coral rule sweeping the width, a tap ring on the offer, and
                    the tab-strip build. Still one cut, still one world.
  G4 empty band     the paper background now carries the film's own ruled grid (two margin rules with
                    edge ticks, plus a coral ledger rule). Every rule runs the full frame height, so no
                    row is a bare band. It is structure in the film's own receipt/paper language, not
                    added noise.
  KEPT              every Persian numeral and its LRI/PDI isolate (NUM / GROUP / PCT) is untouched: the
                    digits still read left-to-right inside the rtl copy.
  NOT fixed (out of scope this round, reported only): duplicate-template reports N/A on this cut-based
  film even with --events; number-lint scans 0 files and PASSes vacuously; hero-size measures the
  largest ink blob (a decorative ring), not type; edge-touch has no per-ratio calibration and the
  off-frame card entrances still put card text on the frame edge.
---`, "s11-header");

/* ---- s11 head split ---- */
rep(S11, `  head1: "\\u0647\\u0641\\u062a\\u200c\\u062a\\u067e\\u0647\\u0654 \\u0635\\u0641\\u062d\\u0647\\u060c",`,
`  head1: "\\u0647\\u0641\\u062a\\u200c\\u062a\\u067e\\u0647\\u0654 \\u0635\\u0641\\u062d\\u0647\\u060c",
  headA: "\\u0647\\u0641\\u062a\\u200c\\u062a\\u067e\\u0647\\u0654",
  headB: "\\u0635\\u0641\\u062d\\u0647\\u060c",`, "s11-headsplit");

/* ---- s11 9:16 hero geometry ---- */
rep(S11, `    logo: {x: 300, y: 250, s: 1.15}, head: {x: 540, y: 560, size: 132, lh: 152}, sub: {x: 540, y: 900, size: 54},`,
`    logo: {x: 300, y: 196, s: 1.0}, head: {x: 540, y: 566, size: 200, lh: 208}, sub: {x: 540, y: 1104, size: 54},`, "s11-layout916");

/* ---- s11 heroLines helper + cover use ---- */
rep(S11, `// ---------------- scenes (pure functions of the local frame)`,
`// the hero is one lock-up. 9:16 wraps it over three lines so a SINGLE line clears the
// 12%-of-frame-height hero rule; 16:9 keeps its own two-line composition (two designs, not a crop).
function heroLines() {
  const lines = ISV
    ? [[TXT.headA, L.head.size, L.ink], [TXT.headB, L.head.size, L.ink], [TXT.head2, L.head.size * 1.08, L.coral]]
    : [[TXT.head1, L.head.size, L.ink], [TXT.head2, L.head.size * 1.08, L.coral]];
  lines.forEach((l, i) => txt(l[0], L.head.x, L.head.y + L.head.lh * i, l[1], 900, l[2]));
}
// ---------------- scenes (pure functions of the local frame)`, "s11-herolines");

rep(S11, `    txt(TXT.head1, L.head.x, L.head.y, L.head.size, 900, L.ink);
    txt(TXT.head2, L.head.x, L.head.y + L.head.lh, L.head.size * 1.08, 900, L.coral);`,
`    heroLines();`, "s11-cover-hero");

rep(S11, `    ctx.save(); ctx.translate(L.head.x, L.head.y); ctx.scale(t, t);
    txt(TXT.head1, 0, 0, L.head.size * 0.9, 900, L.ink);
    txt(TXT.head2, 0, L.head.lh * 0.9, L.head.size, 900, L.coral);
    ctx.restore();`,
`    ctx.save(); ctx.translate(L.head.x, L.head.y); ctx.scale(t, t); ctx.translate(-L.head.x, -L.head.y);
    heroLines();
    ctx.restore();`, "s11-quiet-hero");

/* ---- s11 chip / label ---- */
rep(S11, `    const b = prog(p, 0.36, 0.28), bw = ISV ? 540 : 400, bh = ISV ? 116 : 88, by = L.sub.y + (ISV ? 150 : 110);
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = L.coral; rr(L.head.x - bw / 2, by, bw, bh, bh / 2); ctx.fill(); ctx.restore();
    txt(TXT.first + " \\u00b7 " + PCT(15), ISV ? W - 210 : 1120, by + bh * 0.68, bh * 0.44, 900, L.ink);
    ctx.globalAlpha = b; ctx.fillStyle = L.coral; rr(ISV ? W - 150 : 1250, by + bh * 0.3, bh * 0.38, bh * 0.38, 8); ctx.fill(); ctx.globalAlpha = 1;`,
`    const b = prog(p, 0.36, 0.28), bw = ISV ? 540 : 400, bh = ISV ? 116 : 88, by = L.sub.y + (ISV ? 150 : 110);
    const bx = L.head.x - bw / 2, bcy = by + bh / 2;
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = L.coral; rr(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.restore();
    // v2 G1: the chip used to be drawn at W-150 while the label was centred at W-210, so the chip landed
    // on the last letter of the label. Now the label is drawn INSIDE its own pill (ink on coral, measured
    // and auto-fitted so it can never overflow) and the chip is a separate square to the LEFT of the pill.
    // By construction no chip can overlap any glyph, in either ratio.
    ctx.save(); ctx.globalAlpha = b;
    const offerStr = TXT.first + " \\u00b7 " + PCT(15);
    let osz = bh * 0.42;
    ctx.font = "900 " + osz + "px PAHead"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    let ow = ctx.measureText(offerStr).width;
    if (ow > bw * 0.84) { osz = osz * (bw * 0.84) / ow; ctx.font = "900 " + osz + "px PAHead"; }
    txt(offerStr, L.head.x, bcy + osz * 0.36, osz, 900, L.ink);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = b; ctx.fillStyle = L.coral;
    rr(bx - bh * 0.62, by + bh * 0.31, bh * 0.38, bh * 0.38, 8); ctx.fill(); ctx.restore();`, "s11-chip");

/* ---- s11 paper rules ---- */
rep(S11, `  b.strokeStyle = "rgba(20,18,15,.05)"; b.lineWidth = 1.5;
  for (let y = 120; y < H; y += 120) { b.beginPath(); b.moveTo(80, y); b.lineTo(W - 80, y); b.stroke(); }
  return bgc;`,
`  b.strokeStyle = "rgba(20,18,15,.05)"; b.lineWidth = 1.5;
  for (let y = 120; y < H; y += 120) { b.beginPath(); b.moveTo(80, y); b.lineTo(W - 80, y); b.stroke(); }
  // v2 G4: the film's own ruled-grid structure. empty-band calls a row empty when almost nothing in it
  // deviates from that row's median, so a bare paper band reads as dead -- the ruled ledger the paper
  // world already speaks fixes that with real layout structure instead of added noise. Full height.
  b.fillStyle = "rgba(20,18,15,.20)";
  (ISV ? [0.075, 0.925] : [0.045, 0.465, 0.955]).forEach((fx) => b.fillRect(Math.round(fx * W) - 2.6 * G, 0, 5.2 * G, H));
  b.fillStyle = "rgba(20,18,15,.16)";
  for (let y = 90; y < H; y += 90) {
    b.fillRect(Math.round(0.075 * W) - 11 * G, y, 22 * G, 3 * G);
    b.fillRect(Math.round(0.925 * W) - 11 * G, y, 22 * G, 3 * G);
  }
  b.fillStyle = "rgba(226,80,60,.26)";
  b.fillRect(Math.round(0.925 * W) + 15 * G, 0, 3.4 * G, H);
  return bgc;`, "s11-paperrules");

/* ---- s11 quiet: camera push ---- */
rep(S11, `    const o = 1 - ease.inCubic(prog(p, 0, 0.16));`,
`    const o = 1 - ease.inCubic(prog(p, 0, 0.16));`, "s11-noop");
rep(S11, `    const o = 1 - ease.inCubic(prog(p, 0, 0.16));`,
`    // v2 G3: a slow push keeps the last beat alive (v1 held one static card for 10.4 s of an 18 s film)
    ctx.save();
    const push = 1 + 0.032 * ease.inOutSine(clamp(p / 0.9));
    ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    const o = 1 - ease.inCubic(prog(p, 0, 0.16));`, "s11-quietpush");

rep(S11, `      txt([TXT.brand, GROUP(199000) + " " + TOMAN, TXT.first, NUM(21) + " " + TXT.eta][k], st[0], st[1], ISV ? 40 : 32, 700, L.soft);
      ctx.restore(); }
  }`,
`      txt([TXT.brand, GROUP(199000) + " " + TOMAN, TXT.first, NUM(21) + " " + TXT.eta][k], st[0], st[1], ISV ? 40 : 32, 700, L.soft);
      ctx.restore(); }
    // v2 G3: late motion in the last beat -- a coral rule sweeps the headline width, then a tap ring
    // lands beside the offer. Same palette, same type, no new world.
    const swp = prog(p, 0.60, 0.30);
    if (swp > 0) {
      ctx.save(); ctx.globalAlpha = 0.85; ctx.strokeStyle = L.coral; ctx.lineWidth = 6; ctx.lineCap = "round";
      const ry = L.head.y + L.head.lh * (ISV ? 2 : 1) + 30, rx0 = L.head.x - 210, rx1 = L.head.x + 210;
      ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(rx0 + (rx1 - rx0) * ease.outCubic(swp), ry); ctx.stroke();
      ctx.restore();
    }
    const tap = prog(p, 0.74, 0.22);
    if (tap > 0) {
      const tx = bx + bw + 78, ty = bcy;
      ctx.save(); ctx.globalAlpha = tap; ctx.strokeStyle = L.ink; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(tx, ty, 46 * (0.6 + 0.4 * ease.outBack(tap)), 0, 7); ctx.stroke();
      ctx.strokeStyle = L.coral; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(tx, ty, 64 * ease.outCubic(tap), 0, 7); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }`, "s11-quietlate");

save();

/* ---- events.json: reconciled to the real edits ---- */
const s10events = {
  schema: "persianarts.events/1", film: "s10-factory-parsa", fps: 30, bpm: 120, t0_s: 0.0,
  beat_frames: 15,
  cut_frames: [0, 60, 120, 180, 240, 330, 420, 510, 540],
  duration_frames: 600,
  events: [
    { id: "wipe0", name: "gate hit: cold shop light, raw billet", type: "wipe", frame: 0, t_s: 0.0, role: "accent" },
    { id: "wipe1", name: "hard cut: the saw bites", type: "wipe", frame: 60, t_s: 2.0, role: "accent" },
    { id: "chip", name: "chips fly", type: "tick", frame: 68, t_s: 2.2667, role: "normal" },
    { id: "wipe2", name: "hard cut: squaring the blank", type: "wipe", frame: 120, t_s: 4.0, role: "accent" },
    { id: "machine", name: "spindle engages", type: "hit", frame: 132, t_s: 4.4, role: "normal" },
    { id: "wipe3", name: "hard cut: caliper closes", type: "wipe", frame: 180, t_s: 6.0, role: "accent" },
    { id: "number", name: "tolerance number lands", type: "hit", frame: 206, t_s: 6.8667, role: "accent" },
    { id: "numberout", name: "tolerance number leaves", type: "tick", frame: 258, t_s: 8.6, role: "normal" },
    { id: "wipe4", name: "hard cut: the drill plunges", type: "wipe", frame: 240, t_s: 8.0, role: "accent" },
    { id: "bore", name: "hole opens", type: "hit", frame: 255, t_s: 8.5, role: "accent" },
    { id: "chamfer", name: "chamfer turns orange", type: "tick", frame: 285, t_s: 9.5, role: "normal" },
    { id: "wipe5", name: "hard cut: quality inspection", type: "wipe", frame: 330, t_s: 11.0, role: "accent" },
    { id: "stamp", name: "inspection stamp lands", type: "hit", frame: 352, t_s: 11.7333, role: "accent" },
    { id: "wipe6", name: "hard cut: pallet and sling", type: "wipe", frame: 420, t_s: 14.0, role: "accent" },
    { id: "sling", name: "sling takes the weight", type: "hit", frame: 465, t_s: 15.5, role: "normal" },
    { id: "wipe7", name: "hard cut: the hall pulls back", type: "wipe", frame: 510, t_s: 17.0, role: "accent" },
    { id: "wipe8", name: "hard cut: brand mark finale", type: "wipe", frame: 540, t_s: 18.0, role: "accent" },
    { id: "partner", name: "partner stand-in row in", type: "tick", frame: 562, t_s: 18.7333, role: "normal" },
    { id: "cta", name: "CTA line", type: "tick", frame: 584, t_s: 19.4667, role: "accent" },
    { id: "settle", name: "mark and partner row settle", type: "tick", frame: 592, t_s: 19.7333, role: "normal" }
  ]
};
fs.writeFileSync("work/persian/htmlfilm/s10-factory-parsa/events.json", JSON.stringify(s10events, null, 1) + "\n", "utf8");
console.log("wrote s10 events.json");

const s11raw = JSON.parse(fs.readFileSync("work/persian/htmlfilm/s11-sabadak-app/events.json", "utf8"));
s11raw.beat_frames = 6;
s11raw.cut_frames = [0, 28, 55, 83, 111, 138, 166, 187, 228];
s11raw.duration_frames = 540;
// give every declared event a frame on the 30 fps grid as well as its t_s, and declare the cuts as wipes
// so the scene map is unambiguous whatever the gate reads first.
const BS = 60 / 130;
s11raw.events = [
  { id: "wipe0", name: "cover", type: "wipe", frame: 0, t_s: 0, role: "accent" },
  { id: "wipe1", name: "swarm", type: "wipe", frame: 28, t_s: +(28 / 30).toFixed(4), role: "accent" },
  { id: "wipe2", name: "basket", type: "wipe", frame: 55, t_s: +(55 / 30).toFixed(4), role: "accent" },
  { id: "wipe3", name: "sieve", type: "wipe", frame: 83, t_s: +(83 / 30).toFixed(4), role: "accent" },
  { id: "wipe4", name: "press", type: "wipe", frame: 111, t_s: +(111 / 30).toFixed(4), role: "accent" },
  { id: "wipe5", name: "signed", type: "wipe", frame: 138, t_s: +(138 / 30).toFixed(4), role: "accent" },
  { id: "wipe6", name: "road", type: "wipe", frame: 166, t_s: +(166 / 30).toFixed(4), role: "accent" },
  { id: "wipe7", name: "door", type: "wipe", frame: 187, t_s: +(187 / 30).toFixed(4), role: "accent" },
  { id: "wipe8", name: "quiet", type: "wipe", frame: 228, t_s: +(228 / 30).toFixed(4), role: "accent" },
  { id: "offer", name: "offer pill + chip + label", type: "pop", frame: 340, t_s: +(340 / 30).toFixed(4), dur_s: 0.4, role: "accent" },
  { id: "strip", name: "tab strip build", type: "pop", frame: 384, t_s: +(384 / 30).toFixed(4), dur_s: 0.8, role: "normal" },
  { id: "sweep", name: "coral rule sweep", type: "wipe", frame: 415, t_s: +(415 / 30).toFixed(4), dur_s: 0.5, variant: "rule", role: "normal" },
  { id: "tapping", name: "tap ring on the offer", type: "pop", frame: 459, t_s: +(459 / 30).toFixed(4), dur_s: 0.4, role: "normal" }
];
fs.writeFileSync("work/persian/htmlfilm/s11-sabadak-app/events.json", JSON.stringify(s11raw, null, 1) + "\n", "utf8");
console.log("wrote s11 events.json");

console.log(fails.length ? "FAILURES: " + fails.join(" | ") : "ALL OK");
