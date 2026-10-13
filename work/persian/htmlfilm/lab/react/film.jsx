/*
 * HOOK scene micro-pilot (React). Source of film.react.html. Same math as pencil/film.v2.html sceneHook.
 * Contract: window.film = {duration, fps:30, frame, ready, seek(t)}; every frame = pure <Film n={n}/>.
 */
import { createRoot, flushSync } from "rt";

const W = 1080, H = 1920, FPS = 30, BPM = 110, TEMPO = BPM / 120, DURATION = 240;
const C = { ink: "#16141f", coral: "#ff5a4e", paper: "#f6efe2", yellow: "#ffcf3a" };
const HERO = 230, PEN_SCALE = 1.25, SAFE = { top: 250, bottom: 400, side: 90 };
const slot = (fx, fy, fw, fh) => { const sw = W - 2 * SAFE.side, sh = H - SAFE.top - SAFE.bottom;
  return { x: SAFE.side + fx * sw, y: SAFE.top + fy * sh, w: fw * sw, h: fh * sh }; };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (f, s, d) => clamp((f - s) / d);
const lerp = (a, b, t) => a + (b - a) * t;
const C1 = 1.70158, C3 = C1 + 1;
const outExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const outBack = t => 1 + C3 * Math.pow(t - 1, 3) + C1 * Math.pow(t - 1, 2);
const outCubic = t => 1 - Math.pow(1 - t, 3);
const inCubic = t => t * t * t;
const shake = (f, at, amp, len = 10) => { if (f < at || f > at + len) return 0; const k = (f - at) / len; return amp * (1 - k) * Math.sin((f - at) * 2.4); };
const stampIn = (f, at, from = 1.9) => { const pre = inCubic(prog(f, at - 8, 8)), settle = outBack(prog(f, at, 4)), s = lerp(from, 1, pre);
  return { sx: s * (1 + 0.04 * (1 - settle)), sy: s * (1 - 0.1 * (1 - settle)), o: prog(f, at - 8, 2) }; };
function inkPts(x0, x1, y, amp, waves, jag, seed, n = 140) { const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t;
    pts.push([x, y + amp * Math.sin(t * waves * Math.PI * 2 + seed) + jag * Math.sin(t * 41 + seed * 3) * Math.cos(t * 7 + seed)]); }
  return pts; }
const tipAt = (pts, p) => pts[Math.round(clamp(p) * (pts.length - 1))];
const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const vnoise = (x, seed) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 17.3), hash(i + 1 + seed * 17.3), u); };
const fx = v => v.toFixed(1);

// ribbon geometry as data (same algorithm as drawOn)
function ribbon(pts, p, width, bad, seed) {
  p = clamp(p); if (p <= 0) return null;
  const n = pts.length - 1, cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[n] || 1, m = p * n, i1 = Math.floor(m), fr = m - i1;
  const P = []; for (let i = 0; i <= Math.min(i1, n); i++) P.push({ x: pts[i][0], y: pts[i][1], s: cum[i] / L, i });
  if (i1 < n && fr > 0) P.push({ x: lerp(pts[i1][0], pts[i1 + 1][0], fr), y: lerp(pts[i1][1], pts[i1 + 1][1], fr), s: lerp(cum[i1], cum[i1 + 1], fr) / L, i: i1 + fr });
  if (P.length < 2) return null;
  const wAt = s => { if (bad) { const spike = vnoise(s * L / 22, seed + 5) > 0.82 ? 1.0 : 0; return width * (0.28 + 1.25 * vnoise(s * L / 34, seed) + 0.5 * spike); }
    const taper = Math.max(0.1, Math.min(1, Math.sqrt(Math.min(s / 0.07, (1 - s) / 0.12)))); return width * (0.55 + 0.45 * Math.sin(s * L / 120 + seed)) * taper * 1.1; };
  const Lp = [], Rp = [];
  for (let k = 0; k < P.length; k++) { const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, w = wAt(P[k].s) / 2, jit = bad ? width * 0.32 * (vnoise(P[k].i * 0.9, seed + 11) - 0.5) : 0;
    const cx = P[k].x + nx * jit, cy = P[k].y + ny * jit; Lp.push([cx + nx * w, cy + ny * w]); Rp.push([cx - nx * w, cy - ny * w]); }
  const last = P[P.length - 1];
  const poly = "M " + Lp.map(q => fx(q[0]) + " " + fx(q[1])).join(" L ") + " L " + Rp.reverse().map(q => fx(q[0]) + " " + fx(q[1])).join(" L ") + " Z";
  return { poly, cx: last.x, cy: last.y, r: Math.max(1.5, wAt(last.s) / 2) };
}

// ---- components (reusable across scenes)
const Ribbon = ({ pts, p, width, color, bad = false, seed = 1, o = 1 }) => {
  const g = ribbon(pts, p, width, bad, seed); if (!g) return null;
  return <g opacity={o} fill={color}><path d={g.poly} stroke={color} strokeWidth="1" strokeLinejoin="round" /><circle cx={fx(g.cx)} cy={fx(g.cy)} r={fx(g.r)} /></g>;
};
const Pen = ({ x, y, scale = PEN_SCALE, angle = 0, squash = 1, mood = "good" }) => {
  const sx = 1 + (1 - squash) * 0.5, sy = squash, k = { stroke: C.ink, strokeLinecap: "round", fill: "none" };
  return <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${angle.toFixed(2)}) scale(${(scale * sx).toFixed(4)} ${(scale * sy).toFixed(4)})`}>
    <ellipse cx="6" cy="10" rx="62" ry="12" fill={C.ink} opacity="0.18" />
    <path d="M0 0 L-24 -58 L24 -58 Z" fill={C.ink} />
    <rect x="-30" y="-300" width="60" height="242" rx="12" fill={C.yellow} stroke={C.ink} strokeWidth="6" />
    <rect x="-30" y="-258" width="60" height="12" fill={C.ink} />
    <rect x="-34" y="-360" width="68" height="60" rx="12" fill={C.coral} stroke={C.ink} strokeWidth="6" />
    <circle cx="-9" cy="-196" r="5" fill={C.ink} /><circle cx="9" cy="-196" r="5" fill={C.ink} />
    {mood === "bad" ? <><path d="M-19 -206 L-4 -214" strokeWidth="6" {...k} /><path d="M19 -206 L4 -214" strokeWidth="6" {...k} /><path d="M-11 -176 Q0 -188 11 -176" strokeWidth="5" {...k} /></>
      : <><path d="M-18 -212 Q-10 -220 -3 -212" strokeWidth="5" {...k} /><path d="M18 -212 Q10 -220 3 -212" strokeWidth="5" {...k} /><path d="M-12 -182 Q0 -168 12 -182" strokeWidth="5" {...k} /></>}
    {mood === "good" && <><circle cx="-22" cy="-184" r="7" fill="#ff9a8f" opacity="0.7" /><circle cx="22" cy="-184" r="7" fill="#ff9a8f" opacity="0.7" /></>}
  </g>;
};
const Splat = ({ f, at, cx, cy, rMax }) => {
  const grow = outExpo(prog(f, at, 8)), fade = 1 - prog(f, at + 7, 18); if (grow <= 0 || fade <= 0) return null;
  return <>{Array.from({ length: 7 }, (_, i) => { const ang = (i / 7) * Math.PI * 2 + 0.6, rr = rMax * (0.4 + 0.6 * (((i * 37) % 10) / 9)) * grow;
    return <ellipse key={i} cx={fx(cx + Math.cos(ang) * rr * 1.5)} cy={fx(cy + Math.sin(ang) * rr)} rx={fx(rr * 0.45 + 4)} ry={fx(rr * 0.3 + 3)} fill={C.ink} opacity={(0.8 * fade).toFixed(3)} />; })}</>;
};
const Stamp = ({ s, children, style }) => <div style={{ transform: `scale(${s.sx},${s.sy})`, opacity: s.o, lineHeight: 1.3, ...style }}>{children}</div>;
const Svg = ({ children }) => <svg className="layer" width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>{children}</svg>;
const Txt = ({ box, size, children }) => <div className="txt" style={{ left: box.x, top: box.y, width: box.w, height: box.h, justifyContent: "center", alignItems: "center", fontFamily: "'PAHead'", fontSize: size, fontWeight: 900, color: C.ink }}>{children}</div>;

function Hook({ f }) {
  const t = slot(0, 0, 1, 0.5), a = slot(0, 0.52, 1, 0.48), H1f = 3, H2f = 15;
  const sh = shake(f, H1f, HERO * 0.035, 8) + shake(f, H2f, HERO * 0.043, 8), size = HERO * 0.8;
  const pts = inkPts(a.x + a.w * 0.92, a.x + a.w * 0.2, a.y + a.h * 0.72, a.h * 0.08, 3.3, a.h * 0.07, 1.3);
  const p = outCubic(prog(f, 0, 40)), tip = tipAt(pts, p), cross = outBack(prog(f, 40, 8)), cx = a.x + a.w * 0.5, cy = a.y + a.h * 0.72;
  const s1 = stampIn(f, H1f), s2 = stampIn(f, H2f);
  return <>
    <div className="layer" style={{ background: C.coral }} />
    <Svg>
      <Ribbon pts={pts} p={p} width={30} color={C.ink} bad seed={2} />
      <g transform={`translate(${cx} ${cy}) scale(${cross})`} opacity={prog(f, 40, 2)}><line x1={-a.w * 0.32} y1={-a.h * 0.22} x2={a.w * 0.32} y2={a.h * 0.22} stroke={C.paper} strokeWidth="22" strokeLinecap="round" /></g>
      <Pen x={tip[0] + 3.5 * Math.sin(f * 2.3) * (1 - prog(f, 40, 6))} y={tip[1] + 2.5 * Math.sin(f * 3.1)} scale={PEN_SCALE * 0.85} angle={-19} mood="bad" />
    </Svg>
    <Txt box={t} size={size}><div style={{ transform: `translate(${sh.toFixed(2)}px,${(sh * 0.4).toFixed(2)}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Stamp s={s1}>دست‌خطت</Stamp>
      <Stamp s={s2} style={{ background: C.ink, color: C.coral, padding: `0 ${size * 0.25}px`, borderRadius: size * 0.12, rotate: "-3deg" }}>زشته؟</Stamp>
    </div></Txt>
    <Svg><Splat f={f} at={H1f} cx={t.x + t.w * 0.5} cy={t.y + t.h * 0.32} rMax={HERO * 0.16} /><Splat f={f} at={H2f} cx={t.x + t.w * 0.5} cy={t.y + t.h * 0.66} rMax={HERO * 0.25} /></Svg>
  </>;
}
const Film = ({ n }) => <Hook f={Math.min(n, 65) * TEMPO} />;   // pilot: single scene, frozen after its end (65)

const stage = document.getElementById("stage");
const root = createRoot(stage);
const render = n => { n = Math.max(0, Math.min(DURATION - 1, Math.round(n))); flushSync(() => root.render(<Film n={n} />)); window.film.frame = n; };
window.film = { duration: DURATION / FPS, fps: FPS, bpm: BPM, frame: 0, ready: false, seek(t) { render(Math.round(t * FPS)); return this.frame; } };
const params = new URLSearchParams(location.search);
if (params.get("capture") === "1") document.body.classList.add("capture");
const fit = () => { const sc = params.get("capture") === "1" ? 1 : Math.min(innerWidth / W, (innerHeight - 56) / H); stage.style.transform = `scale(${sc})`; };
addEventListener("resize", fit); fit();
document.fonts.load("900 40px PAHead").then(() => document.fonts.ready).then(() => { render(0); window.film.ready = true; });
