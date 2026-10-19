// v2 film-fix patch script (s10 + s11). Literal/regex replacements with assertions.
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
  if (n !== 1) { fails.push(`[${tag}] ${n} occurrences`); console.log(`FAIL ${tag}: ${n}`); return; }
  f.text = f.text.replace(from, to);
  console.log(`ok   ${tag}`);
}
function repRe(p, re, to, tag) {
  const f = load(p);
  const m = f.text.match(new RegExp(re.source, "g"));
  if (!m || m.length !== 1) { fails.push(`[${tag}] ${m ? m.length : 0} regex matches`); console.log(`FAIL ${tag}: ${m ? m.length : 0}`); return; }
  f.text = f.text.replace(re, to);
  console.log(`ok   ${tag}`);
}
function save() {
  for (const [p, f] of files) {
    if (f.text !== f.orig) { fs.writeFileSync(p, f.bom ? "\uFEFF" + f.text : f.text, "utf8"); console.log(`wrote ${p}`); }
  }
}

const S10 = "work/persian/htmlfilm/s10-factory-parsa/film.html";
const S11 = "work/persian/htmlfilm/s11-sabadak-app/film.html";
const ZWNJ = "\u200c";
// Persian fragments written as escapes so no invisible char can be mistyped
const F = {
  mm: "\u0645\u06cc\u0644\u06cc" + ZWNJ + "\u0645\u062a\u0631",
  cut: "\u0628\u0631\u0634 \u0634\u0645\u0634",
  cutsub: "\u062a\u06cc\u063a\u0647\u0654 \u0628\u0631\u0634 \u2014 \u0628\u0631\u0634 \u0627\u0648\u0644",
  partners: "\u0646\u0645\u0648\u0646\u0647\u0654 \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0635\u0646\u0639\u062a\u06cc",
  tol: "\u0631\u0648\u0627\u062f\u0627\u0631\u06cc",
  helper: "\u062a\u0628\u062f\u06cc\u0644 \u062a\u0633\u062a",
  pms: "\u067e\u06cc\u0627\u0645 \u062a\u0633\u062a"
};
const PM = "\u00b1" + "\u06f0" + "\u066b" + "\u06f0\u06f2";

/* ==================== s10 ==================== */
rep(S10, `Silent v1: zero audio. CUT-BASED (hard cuts on the bar/beat grid), not one-take.
==========================================================================`,
`Silent v2: zero audio. CUT-BASED (hard cuts on the bar/beat grid), not one-take.
==========================================================================
FIX LOG v2  (fix-round-1; v1 source and v1 outputs are untouched; this file renders v2)
  F1 number token   the tolerance number was ONE rtl canvas run holding a Latin unit and a neutral +/-,
                    so bidi reordered it and it delivered scrambled ("mm | +/- | 0.02" instead of the
                    intended "0.02" followed by the unit). It is now drawn inside an explicit LTR
                    isolate (U+2066...U+2069) with ctx.direction="ltr", and the unit is the Persian
                    ${F.mm}, so the token reads ${PM} ${F.mm} in BOTH ratios (D9 + D10).
  F2 number exit    numA = prog(n, CUTS[3]+26, 10) had no fade-out: the number sat on screen f206..f599
                    = 66% of the film, which is also the mechanical cause of the duplicate-template
                    FAIL. It now enters f206-216 and leaves f258-270 (52 frames on screen) (D2).
  F3 partner row    prog(n, CUTS[8]+58, 18) started the fade at f598 of 600, so the rule-12 partner
                    stand-ins never rendered at all. It now starts at CUTS[8]+22 over 12 frames, i.e.
                    fully visible f574-599, with its ${F.partners} stand-in label (D1). The 9:16
                    partner baseline was also moved OUT of the hazard band (D11).
  F4 empty band     the floor rows carried no edge above the 28-level deviation threshold (the old
                    perspective lines sat at 13% alpha), so the lower ~60% of the 9:16 frame was one
                    dead band. The floor now carries a slab-joint grid, a hazard walkway, a drainage
                    channel and two foreground pillars; the finale gained hall truss + work lights and a
                    pallet of parts in the 16:9 left half (D3 / D17).
  F5 events.json    that file was written with 24 frames per beat (CUT_BEATS x 24) while the code runs
                    FPB = 30*60/120 = 15, so three of its cuts (672/816/864) fell outside a 600-frame
                    film and every time-based gate measured the wrong edit. events.json was the wrong
                    side; it now carries the real cuts [0,60,120,180,240,330,420,510,540] (D6).
  F6 scene variety  the CUT scene now carries copy of its own, so no scene is wordless and the scene
                    midpoints no longer collide (D5 / D13).
  NOT fixed (out of scope this round, reported only): the logo-colour gate false-FAILs on another
  client's blue rgb(105,131,208) although this film's own inline orange mark renders in every finale
  frame; with --no-logo it prints the untrue "skipped (no brand asset)"; with --only logo-colour it
  prints no row at all and exits 0. number-lint scans 0 files and PASSes vacuously (D7 / D8).
==========================================================================`, "s10-header");

repRe(S10, /COPY      [^\n]*\n {10}[^\n]*\(f504\)/,
`COPY      "شمش خام" (f0) / "${F.cut}" (f60) / "به اندازهٔ مو، دقیق." (f124) / "${F.tol} ${PM} ${F.mm}"
          (lands f206, leaves f258) / "سوراخ‌کاری و پخ‌زنی" (f244) / "بازرسی کیفی" (f334) / "بارگیری" (f424)
          / "خط تولید، یک شیفت کامل" (f516) / "از شمش تا اطمینان." (f564) / CTA "درخواست استعلام قیمت" (f584)
          / partner stand-ins fully visible f574-599`, "s10-copy");

rep(S10, `          on a beat; the tolerance number lands on beat 20 (the exact midpoint of the film).`,
`          on a beat; the tolerance number lands 26 frames into MEASURE (f206) and leaves at f258.`, "s10-music");

repRe(S10, /SCENES \(120 BPM, beat 0\.5 s, bar 2\.0 s\)[\s\S]*?\| cta 42 \| mark settle 44/,
`SCENES (120 BPM, FPB = 30*60/120 = 15 frames per beat, bar 2.0 s)
  1 GATE     beat   0  (0.00 s) f0    cold gate light, the raw billet, copy 1
  2 CUT      beat   4  (2.00 s) f60   the saw bites, a bright cut face, chips fly
  3 MACHINE  beat   8  (4.00 s) f120  machining: the rough blob is squared into a machined blank
  4 MEASURE  beat  12  (6.00 s) f180  the caliper closes; the tolerance number lands at f206, leaves f258
  5 BORE     beat  16  (8.00 s) f240  the drill plunges, the hole opens, the chamfer turns orange
  6 INSPECT  beat  22  (11.00 s) f330 quality stamp, measured table drawn on the part
  7 PALLET   beat  28  (14.00 s) f420 the same part on the pallet, three parts, sling takes the weight
  8 SHIP     beat  34  (17.00 s) f510 the hall pulls back, the gate opens, a part enters the mark
  9 MARK     beat  36  (18.00 s) f540 ONE-WORLD finale: same world, mark + name + CTA + partner stand-ins
EVENTS (frames) gate 0 | cut 60 | chip 68 | machine 120 | backplate strike 150 | measure 180 | number lands 206
  | number leaves 258 | drill 240 | bore 255 | chamfer 285 | inspect 330 | stamp 352 | pallet 420 | sling 465
  | ship 510 | mark 540 | partner row 562 | cta 584 | mark settle 600`, "s10-scenes");

rep(S10, `FPB = FPS * 60 / BPM; // 24 frames per beat`, `FPB = FPS * 60 / BPM; // 15 frames per beat`, "s10-fpb");

rep(S10, `    mark: {x: 540, y: 1330, r: 108},
    wm:   {x: 540, y: 1490, size: 50},
    tag:  {x: 540, y: 1534, size: 23},
    finaleCopy: {x: 540, y: 1150, size: 52},
    cta: {x: 540, y: 1610, size: 32},
    partner: {y: 1712, x0: 540, gap: 288, size: 25},
    band: 30`,
`    mark: {x: 540, y: 1290, r: 100},
    wm:   {x: 540, y: 1444, size: 48},
    tag:  {x: 540, y: 1488, size: 22},
    finaleCopy: {x: 540, y: 1128, size: 50},
    cta: {x: 540, y: 1560, size: 30},
    partner: {y: 1640, x0: 540, gap: 288, size: 24},   // v2 F3: above the hazard band, not inside it
    band: 30`, "s10-layout916");

rep(S10, `  // floor: perspective lines + hazard stripe
  ctx.fillStyle = "#1b2127"; ctx.fillRect(0, L.floorY, W, H - L.floorY);
  ctx.strokeStyle = "rgba(201,210,219,.13)"; ctx.lineWidth = 2;
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, L.floorY); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
  ctx.fillStyle = "rgba(201,210,219,.07)";
  for (let k = 0; k < 4; k++) ctx.fillRect(0, L.floorY + 22 + k * 34, W, 3);`,
`  // floor (v2 F4): the shop floor has to carry structure of its own, otherwise the whole lower band of
  // the frame is one dead field and empty-band flags it. Slab joints in both directions, a hazard
  // walkway, a drainage channel and two foreground pillars -- all above the 28-level deviation that
  // empty-band needs, and all part of the same hall, not noise.
  ctx.fillStyle = "#1b2127"; ctx.fillRect(0, L.floorY, W, H - L.floorY);
  const flH = H - L.floorY;
  ctx.strokeStyle = "rgba(201,210,219,.34)"; ctx.lineWidth = 3.6;
  for (let i = -9; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 52, L.floorY); ctx.lineTo(W / 2 + i * 420, H); ctx.stroke(); }
  for (let k = 1; k <= 7; k++) {
    const u = k / 8, y = L.floorY + flH * (u * u * 0.92 + u * 0.08);
    ctx.strokeStyle = "rgba(201,210,219," + (0.34 - 0.10 * u).toFixed(3) + ")"; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.save();
  ctx.beginPath(); ctx.moveTo(W * 0.60, L.floorY); ctx.lineTo(W * 0.88, L.floorY); ctx.lineTo(W * 1.16, H); ctx.lineTo(W * 0.52, H); ctx.closePath();
  ctx.fillStyle = "rgba(255,122,26,.18)"; ctx.fill(); ctx.clip();
  ctx.fillStyle = "rgba(255,122,26,.46)";
  for (let s = -3; s < 26; s++) { const x = s * 46; ctx.save(); ctx.translate(x, L.floorY); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 0); ctx.lineTo(0, flH); ctx.lineTo(-20, flH); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.fillStyle = "#0e1114"; ctx.fillRect(0, H - 86, W, 26);
  ctx.fillStyle = "rgba(201,210,219,.30)"; ctx.fillRect(0, H - 88, W, 3); ctx.fillRect(0, H - 61, W, 3);
  for (let x = 0; x < W; x += 26) { ctx.fillStyle = "rgba(201,210,219,.22)"; ctx.fillRect(x, H - 80, 9, 14); }
  [[W * 0.085, W * 0.075], [W * 0.915, W * 0.075]].forEach(([px, pw]) => {
    ctx.fillStyle = "#171c21"; ctx.fillRect(px - pw / 2, L.horizon * 0.34, pw, H - L.horizon * 0.34);
    ctx.fillStyle = "rgba(201,210,219,.26)"; ctx.fillRect(px - pw / 2, L.horizon * 0.34, 5, H - L.horizon * 0.34);
    ctx.fillStyle = "rgba(255,122,26,.34)"; ctx.fillRect(px - pw / 2, L.floorY - 8, pw, 8);
  });`, "s10-floor");

rep(S10, `  const numA = prog(n, CUTS[3] + 26, 10);
  if (numA > 0.01) {
    ctx.save(); ctx.globalAlpha = numA;
    const shake = n < CUTS[3] + 32 ? Math.sin((n - CUTS[3] - 26) * 2.4) * 3 * (1 - prog(n, CUTS[3] + 26, 6)) : 0;
    fa("${F.tol}", L.num.x, L.num.y - L.num.size * 0.86, L.num.size * 0.34, C.light, 700);
    fa("\\u00b1" + faDigits("0") + "\\u066B" + faDigits("02") + " mm", L.num.x + shake, L.num.y, L.num.size, C.white, 900);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 5;`
  .replace("\\u00b1", "\u00b1"),
`  // v2 F2: the tolerance number is now a ONE-BEAT payoff -- in f206-216, out f258-270. v1 left it on
  // screen for 394 of 600 frames with no exit, which flattened six scenes into one template.
  const numA = prog(n, CUTS[3] + 26, 10) * (1 - prog(n, CUTS[4] + 18, 12));
  if (numA > 0.01) {
    ctx.save(); ctx.globalAlpha = numA;
    const shake = n < CUTS[3] + 32 ? Math.sin((n - CUTS[3] - 26) * 2.4) * 3 * (1 - prog(n, CUTS[3] + 26, 6)) : 0;
    fa("${F.tol}", L.num.x, L.num.y - L.num.size * 0.86, L.num.size * 0.34, C.light, 700);
    // v2 F1: the number + sign + unit is a MATH TOKEN, not rtl prose. One rtl run let bidi reorder the
    // Latin unit to the far left and park the sign between unit and digits. Forcing LTR (both the
    // paragraph direction and an explicit U+2066...U+2069 isolate) and using the Persian unit keeps the
    // sign, the decimal separator and the unit in one readable order in both ratios.
    ctx.save();
    ctx.direction = "ltr"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = "900 " + L.num.size + "px PAHead"; ctx.fillStyle = C.white;
    const tok = "\\u2066" + "\\u00b1" + faDigits("0") + "\\u066B" + faDigits("02") + " " + "${F.mm}" + "\\u2069";
    ctx.fillText(tok, L.num.x + shake, L.num.y);
    ctx.restore();
    ctx.strokeStyle = C.orange; ctx.lineWidth = 5;`, "s10-number");

repRe(S10, / {2}copyLine\("[^\n]*AISI 4140[^\n]*\n/,
`  copyLine("فولاد AISI 4140 — قطعهٔ ریخته‌گری", L.sub.x, L.sub.y, L.sub.size, C.dim, 700, prog(n, 14, 14) * (1 - prog(n, CUTS[1] - 4, 4)));
  // 2 CUT (v2 F6: the one beat that explains "a billet is cut" now carries words of its own)
  copyLine("${F.cut}", L.copy.x, L.copy.y, L.copy.size, C.white, 900, prog(n, CUTS[1] + 4, 14) * (1 - prog(n, CUTS[2] - 8, 8)));
  copyLine("${F.cutsub}", L.sub.x, L.sub.y, L.sub.size, C.dim, 700, prog(n, CUTS[1] + 18, 14) * (1 - prog(n, CUTS[2] - 6, 6)));
`, "s10-cutcopy");

rep(S10, `  ctx.fillStyle = "#1b2127"; ctx.fillRect(0, L.floorY, W, H - L.floorY);
  ctx.strokeStyle = "rgba(201,210,219,.10)"; ctx.lineWidth = 2;
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 60, L.floorY); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke(); }
  const bandY = WIDE ? L.partner.y + 78 : L.cta.y + 92;`,
`  // v2 F4: the finale is the same hall, so it gets the same floor language -- transverse slab joints
  // and a walkway -- instead of a bare gradient. Together with the truss row below, no band of the
  // finale frame is left without content.
  ctx.fillStyle = "#1b2127"; ctx.fillRect(0, L.floorY, W, H - L.floorY);
  for (let k = 1; k <= 8; k++) {
    const u = k / 9, y = L.floorY + (H - L.floorY) * (u * u * 0.92 + u * 0.08);
    ctx.strokeStyle = "rgba(201,210,219," + (0.36 - 0.10 * u).toFixed(3) + ")"; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(201,210,219,.26)"; ctx.lineWidth = 3.6;
  for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 90, L.floorY); ctx.lineTo(W / 2 + i * 380, H); ctx.stroke(); }
  ctx.save();
  ctx.beginPath(); ctx.moveTo(W * 0.26, L.floorY); ctx.lineTo(W * 0.54, L.floorY); ctx.lineTo(W * 0.40, H); ctx.lineTo(W * 0.02, H); ctx.closePath();
  ctx.fillStyle = "rgba(255,122,26,.16)"; ctx.fill(); ctx.clip();
  ctx.fillStyle = "rgba(255,122,26,.46)";
  for (let s = -3; s < 26; s++) { const x = s * 52; ctx.save(); ctx.translate(x, L.floorY); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 0); ctx.lineTo(0, H - L.floorY); ctx.lineTo(-22, H - L.floorY); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  const bandY = WIDE ? L.partner.y + 78 : L.partner.y + 44;   // v2 F3: the 9:16 band no longer sits on the partner baseline`, "s10-finaleFloor");

rep(S10, `  for (let i = 0; i < 5; i++) { const w = W / 5; ctx.fillRect(i * w + 20, 0, w - 40, H * 0.30); }`,
`  for (let i = 0; i < 5; i++) { const w = W / 5; ctx.fillRect(i * w + 20, 0, w - 40, H * 0.30); }
  // v2 F4: the same hall truss and the same work lights the shop scenes hang (one world, and the top
  // band of the finale is no longer bare). The vertical hangers join the full-width truss, so the
  // edge-touch gate still reads that whole component as scenery rather than as clipped content.
  ctx.strokeStyle = "rgba(201,210,219,.30)"; ctx.lineWidth = 3.6;
  for (let i = 0; i <= 8; i++) { const x = i * W / 8; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.13); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, H * 0.13); ctx.lineTo(W, H * 0.13); ctx.stroke();
  ctx.strokeStyle = "rgba(201,210,219,.22)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H * 0.30); ctx.lineTo(W, H * 0.30); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const x = W * (0.10 + i * 0.20), y = H * 0.13;
    ctx.fillStyle = "rgba(255,244,220,.60)"; ctx.fillRect(x - 24, y - 5, 48, 10);
    const gl2 = ctx.createRadialGradient(x, y, 2, x, y, 220);
    gl2.addColorStop(0, "rgba(255,225,180,.22)"); gl2.addColorStop(1, "rgba(255,225,180,0)");
    ctx.fillStyle = gl2; ctx.fillRect(x - 220, y, 440, 440);
  }`, "s10-finaleTruss");

rep(S10, `  mark(L.mark.x, L.mark.y, L.mark.r); ctx.restore();`,
`  mark(L.mark.x, L.mark.y, L.mark.r); ctx.restore();
  // v2 F4: the pallet of parts the film has been building, carried into the finale frame. In 16:9 it is
  // what fills the left half v1 left empty; in 9:16 it sits above the mark block.
  const palA = prog(n, CUTS[8] + 8, 18);
  if (palA > 0.01) {
    const px = WIDE ? 340 : 250, py = WIDE ? L.floorY + 46 : 1020;
    ctx.save(); ctx.globalAlpha = 0.9 * palA;
    ctx.fillStyle = "#3a2c1c"; ctx.fillRect(px - 240, py - 6, 480, 28);
    ctx.fillStyle = "rgba(201,210,219,.32)"; ctx.fillRect(px - 240, py - 10, 480, 4);
    for (let i = 0; i < 3; i++) billet(n, px - 155 + i * 155, py - 60, 138, 76, {m: 4});
    ctx.restore();
  }`, "s10-finalePallet");

rep(S10, `  const pa = prog(n, CUTS[8] + 58, 18);`,
`  const pa = prog(n, CUTS[8] + 22, 12);   // v2 F3: v1 started this at f598 of 600, so the row never rendered`, "s10-partner");

save();
console.log(fails.length ? "FAILURES: " + fails.join(" | ") : "ALL OK");
