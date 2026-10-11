// ============================================================================================================
// S6 «گستره و سه دستاورد» (v2) — 60.0–72.5 s (local 0–12.5), night.
// Constellation map (hero word «سراسر استان», outline draw, gold Mashhad from S5's exit point,
// chain pings 2.5/3.125/3.75/4.375/5.0) then the MATCHED CUT: the map sinks to a horizon and its
// nodes RISE INTO three achievement pillars (9.0/9.625/10.25). Threads gather to (960,200) and a
// mid-tone iris (11.5–12.5) hands off to the paper finale. Pillar motion + icons: v1 S7, re-timed.
// ============================================================================================================
import React from "react";
import {AbsoluteFill} from "remotion";
import {sceneBySceneId} from "../timing";
import {
  Background, E, FaText, NodeDot, Sparkle, Thread, Watermark, clamp, faDigits, faStyle, palette, pulse, seg, useT,
} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord} from "../kit/motion/HeroWord";

const spec = sceneBySceneId("s6");
export const S6_FRAMES: number = spec.frames;
const GOLD = palette.gold;

// ---- map (v1 geometry, praised by review) ----
const OUTLINE: Array<[number, number]> = [
  [330, 420], [480, 300], [700, 235], [940, 160], [1180, 95], [1390, 140], [1510, 300], [1570, 470], [1490, 640], [1310, 770],
  [1070, 810], [900, 905], [700, 985], [520, 995], [420, 880], [360, 720], [305, 560],
];
const closedSmooth = (pts: Array<[number, number]>, tension = 0.9) => {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
};
const OUTLINE_D = closedSmooth(OUTLINE, 0.9);
const FILL_D = OUTLINE_D + " Z";
const MASHHAD = {name: "مشهد", x: 1060, y: 470};
const CHAIN = [
  {name: "نیشابور", x: 700, y: 350, t: 2.5, rank: 2, ly: -52},
  {name: "قوچان", x: 1090, y: 215, t: 3.125, rank: 3, ly: -52},
  {name: "سبزوار", x: 430, y: 440, t: 3.75, rank: 4, ly: -52},
  {name: "تربت‌حیدریه", x: 640, y: 700, t: 4.375, rank: 5, ly: 56},
  {name: "کاشمر", x: 520, y: 880, t: 5.0, rank: 6, ly: 56},
];
const hop = (a: {x: number; y: number}, b: {x: number; y: number}, bend = 70) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return `M${a.x} ${a.y} Q ${mx - (dy / L) * bend} ${my + (dx / L) * bend} ${b.x} ${b.y}`;
};

// ---- pillars (motion + icons from v1 S7, night-only, re-timed to 9.0/9.625/10.25) ----
const PILLAR_TOP = 280, PILLAR_W = 480, PILLAR_H = 600;
const TOP = {x: 960, y: 200};
const noOrphan = (s: string) => { const i = s.lastIndexOf(" "); return i < 0 ? s : s.slice(0, i) + " " + s.slice(i + 1); };

type IconKind = "control" | "shield" | "coverage";
const Icon: React.FC<{kind: IconKind; color: string; glow: number}> = ({kind, color, glow}) => {
  const common = {fill: "none", stroke: color, strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const};
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{filter: `drop-shadow(0 0 ${4 + glow * 8}px ${palette.blueSky})`, overflow: "visible"}}>
      {kind === "control" && (
        <g>
          <rect x={14} y={14} width={92} height={92} rx={24} {...common} />
          <path d="M36 40 H84 M36 60 H84 M36 80 H84" {...common} strokeWidth={3} />
          <circle cx={50} cy={40} r={6.5} fill={color} />
          <circle cx={74} cy={60} r={6.5} fill={color} />
          <circle cx={44} cy={80} r={6.5} fill={color} />
        </g>
      )}
      {kind === "shield" && (
        <g>
          <path d="M60 14 L98 28 V60 C98 84 80 100 60 108 C40 100 22 84 22 60 V28 Z" {...common} />
          <path d="M44 61 L56 73 L79 48" {...common} />
        </g>
      )}
      {kind === "coverage" && (
        <g>
          {[{x: 40, y: 46, s: 1}, {x: 80, y: 40, s: 0.8}, {x: 62, y: 84, s: 0.62}].map((p, i) => (
            <path key={i} d={`M${p.x - 15 * p.s} ${p.y - 12 * p.s} A${15 * p.s} ${15 * p.s} 0 1 1 ${p.x + 15 * p.s} ${p.y - 12 * p.s} Q${p.x} ${p.y + 22 * p.s} ${p.x - 15 * p.s} ${p.y - 12 * p.s} Z`} {...common} />
          ))}
          <path d="M16 106 H104" {...common} strokeWidth={2.5} />
        </g>
      )}
    </svg>
  );
};

const Pillar: React.FC<{t: number; cx: number; start: number; idx: number; fade: number; kind: IconKind; title: string; line: string}> = ({t, cx, start, idx, fade, kind, title, line}) => {
  const rise = seg(t, start, start + 0.9, E.outExpo);
  const pop = E.outBack(1.4)(seg(t, start + 0.45, start + 0.95));
  const idle = Math.sin(t * 1.3 + idx * 1.7) * 3;
  const sheen = ((t * 0.14 + idx * 0.31) % 1) * 140;
  const op = fade * clamp(rise * 3);
  if (op <= 0.001) return null;
  const glow = pulse(t, start, 0.3);
  return (
    <div style={{position: "absolute", left: cx - PILLAR_W / 2, top: PILLAR_TOP, width: PILLAR_W, height: PILLAR_H, opacity: op, transform: `translateY(${(1 - rise) * 150 + idle}px)`, clipPath: `inset(${(1 - rise) * 100}% -40px -40px -40px)`}}>
      <div style={{position: "absolute", inset: 0, borderRadius: 28, background: "linear-gradient(160deg, rgba(234,242,255,0.14), rgba(234,242,255,0.05))", border: "1px solid rgba(234,242,255,0.24)", boxShadow: "0 30px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)"}} />
      <div style={{position: "absolute", inset: 0, borderRadius: 28, overflow: "hidden", background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.14) 50%, transparent 65%)", backgroundSize: "260% 100%", backgroundPosition: `${sheen}% 0`}} />
      <div style={{position: "absolute", inset: 0, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", direction: "rtl"}}>
        <div style={{height: 120, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * pop})`, opacity: clamp(pop)}}>
          <Icon kind={kind} color={palette.blueSky} glow={glow} />
        </div>
        <div style={{marginTop: 28, width: "100%", textAlign: "center", ...faStyle(48, {family: "headline", fontWeight: 700, color: palette.ice, lineHeight: 1.35}), textWrap: "balance"} as React.CSSProperties}>{title}</div>
        <div style={{marginTop: 22, width: "100%", textAlign: "center", ...faStyle(36, {family: "body", fontWeight: 400, color: palette.ice, lineHeight: 1.7}), textWrap: "balance"} as React.CSSProperties}>{noOrphan(line)}</div>
      </div>
    </div>
  );
};

export const S6: React.FC = () => {
  const {t} = useT();
  // map phase
  const outlineP = seg(t, 0.0, 1.1, E.inOutCubic);
  const fillP = seg(t, 0.3, 1.3, E.outCubic);
  const all = seg(t, 6.25, 7.0, E.linear);
  const sink = seg(t, 7.5, 8.75, E.inOutCubic);                 // map sinks to the horizon
  const chime = pulse(t, 0.8, 0.3);
  // pillars phase
  const pillarsLabel = seg(t, 8.75, 9.4, E.outCubic);
  const pillarsFade = 1 - seg(t, 11.3, 12.0, E.inOutCubic);
  const arcA = seg(t, 10.9, 11.5, E.outQuart);
  const arcB = seg(t, 11.05, 11.6, E.outQuart);
  const gatherA = seg(t, 11.25, 11.95, E.inOutCubic);
  const gatherB = seg(t, 11.35, 12.05, E.inOutCubic);
  // iris to paper (mid-tone band, origin = thread convergence point)
  const IRIS_T0 = 11.5, IRIS_T1 = 12.5, IRIS_MAX = 1500;
  const MID = "#9fb6e6";
  const R = IRIS_MAX * seg(t, IRIS_T0, IRIS_T1, E.outExpo);
  const mapOpacity = (1 - sink) * 1;
  const horizonY = 620 + sink * 120;
  const beat = Math.min(1, pulse(t, 0.0, 0.25) + pulse(t, 2.5, 0.2) + pulse(t, 3.125, 0.2) + pulse(t, 3.75, 0.2) + pulse(t, 4.375, 0.2) + pulse(t, 5.0, 0.2));

  return (
    <AbsoluteFill>
      <Background theme="night" t={t} />
      {t >= IRIS_T1 ? <Background theme="paper" t={t} /> : null}
      {R > 1 && t < IRIS_T1 && (
        <>
          <AbsoluteFill style={{background: `radial-gradient(circle ${R}px at ${TOP.x}px ${TOP.y}px, ${MID} ${R * 0.86}px, rgba(159,182,230,0) ${R}px)`}} />
          <AbsoluteFill style={{clipPath: `circle(${R * 0.72}px at ${TOP.x}px ${TOP.y}px)`}}>
            <Background theme="paper" t={t} />
          </AbsoluteFill>
        </>
      )}
      <Watermark opacity={1 - seg(t, 10.8, 11.3)} />

      {/* hero word lands on the map snap, then demotes to the scene label */}
      <div style={{position: "absolute", inset: 0, opacity: 1 - sink}}>
        <HeroWord
          text="سراسر استان"
          from={{x: 960, y: 620, scale: 1.3}}
          to={{x: 960, y: 460, scale: 1}}
          landFrame={12}
          holdFrames={12}
          demoteDurFrames={15}
          size={108}
          demoteTo={{x: 1620, y: 170, scale: 0.42}}
        />
      </div>

      {/* ---------------- map ---------------- */}
      <div style={{position: "absolute", inset: 0, opacity: mapOpacity, transformOrigin: "960px 540px", transform: `translate(-150px, ${-10 + sink * 260}px) scale(${0.82 - 0.1 * sink})`}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: "absolute", left: 0, top: 0}}>
          <defs>
            <linearGradient id="prov" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={palette.navy2} stopOpacity={0.85} />
              <stop offset="1" stopColor={palette.navy1} stopOpacity={0.35} />
            </linearGradient>
            <pattern id="dots" width="38" height="38" patternUnits="userSpaceOnUse">
              <circle cx="19" cy="19" r="2.2" fill={palette.blueSky} opacity="0.35" />
            </pattern>
            <clipPath id="provClip"><path d={FILL_D} /></clipPath>
          </defs>
          <path d={FILL_D} fill="url(#prov)" opacity={fillP} />
          <g clipPath="url(#provClip)" opacity={fillP}><rect width={1920} height={1080} fill="url(#dots)" /></g>
        </svg>
        <Thread d={OUTLINE_D} from={0} to={outlineP} width={4} opacity={0.9} glow={1.2} head={outlineP < 0.995} pulse={beat} />

        {/* Mashhad: gold node (continues S5's gold point) */}
        <NodeDot x={MASHHAD.x} y={MASHHAD.y} p={seg(t, 0.6, 1.0)} r={18} color={GOLD} ringT={t >= 0.8 ? (t - 0.8) % 1.4 : -1} />
        <FaText x={MASHHAD.x} y={MASHHAD.y - 70} w={460} size={72} text={MASHHAD.name} weight={800} color={GOLD} family="headline" opacity={seg(t, 0.8, 1.4, E.outCubic)} dy={(1 - seg(t, 0.8, 1.4, E.outCubic)) * 16} style={{textShadow: `0 0 30px ${GOLD}77`}} />
        <FaText x={MASHHAD.x + 80} y={MASHHAD.y + 4} w={100} size={38} text={faDigits(1)} weight={700} color={GOLD} family="numerals" opacity={seg(t, 1.0, 1.5)} />
        {chime > 0.02 && t < 2.0 && <Sparkle x={MASHHAD.x + 20} y={MASHHAD.y - 20} p={(t - 0.8) / 0.9} size={80} color={GOLD} />}

        {/* chain: thread hop → node → label plate */}
        {CHAIN.map((c, i) => {
          const prev = i === 0 ? MASHHAD : CHAIN[i - 1];
          const hp = seg(t, c.t - 0.6, c.t, E.inOutCubic);
          const pop = seg(t, c.t, c.t + 0.35);
          const lab = seg(t, c.t, c.t + 0.5, E.outCubic);
          const ring = t >= 6.25 ? t - 6.25 : t >= c.t ? t - c.t : -1;
          return (
            <React.Fragment key={c.name}>
              <Thread d={hop(prev, c)} from={0} to={hp} width={4} opacity={0.9 - 0.4 * all} head={hp > 0.01 && hp < 0.99} pulse={beat} />
              <NodeDot x={c.x} y={c.y} p={pop} r={13} ringT={ring} />
              <div style={{position: "absolute", left: c.x - 150, top: c.y + c.ly - 30, width: 300, display: "flex", justifyContent: "center"}}>
                <div style={{padding: "2px 16px", borderRadius: 12, background: "rgba(4,10,34,0.72)", opacity: lab}}>
                  <div style={{...faStyle(40, {fontWeight: 700, color: palette.ice, family: "headline"}), textAlign: "center"}}>{c.name}</div>
                </div>
              </div>
              <FaText x={c.x + 92} y={c.y + 2} w={80} size={34} text={faDigits(c.rank)} weight={700} color={palette.blueSky} family="numerals" opacity={lab * 0.9} />
            </React.Fragment>
          );
        })}
        {all > 0 && all < 1 && CHAIN.concat([{...MASHHAD, rank: 1, ly: 0}] as any).map((c: any, i) => (
          <div key={i} style={{position: "absolute", left: c.x - 60 * all, top: c.y - 60 * all, width: 120 * all, height: 120 * all, borderRadius: "50%", border: `2px solid ${c.name === "مشهد" ? GOLD : palette.blueSky}`, opacity: (1 - all) * 0.8}} />
        ))}
      </div>

      {/* inclusiveness chip at the all-pulse */}
      <div style={{position: "absolute", inset: 0, opacity: (1 - sink) * seg(t, 6.25, 6.9, E.outCubic)}}>
        <div style={{position: "absolute", left: 0, top: 995, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{padding: "8px 26px", borderRadius: 999, background: "rgba(47,123,255,0.16)", border: "1px solid rgba(111,167,255,0.35)", ...faStyle(34, {fontWeight: 500, color: palette.ice})}}>از واحدهای بزرگ تا کوچک‌تر</div>
        </div>
      </div>

      {/* ---------------- the matched cut: nodes rise into pillars ---------------- */}
      {sink > 0 && (
        <>
          <Thread d={`M0 ${horizonY} L1920 ${horizonY}`} from={0} to={1} width={5} opacity={0.9 * (1 - seg(t, 11.2, 11.8))} pulse={beat} />
          {[1500, 960, 420].map((x, i) => {
            const grow = seg(t, 7.5 + i * 0.12, 8.6 + i * 0.12, E.outExpo);
            return (
              <div key={x} style={{position: "absolute", left: x - 70, top: horizonY - 420 * grow, width: 140, height: 420 * grow, background: `linear-gradient(to top, ${palette.blueSky}55, transparent)`, filter: "blur(10px)", opacity: 0.8 * (1 - seg(t, 8.9 + i * 0.6, 9.4 + i * 0.6))}} />
            );
          })}
        </>
      )}

      <div style={{position: "absolute", inset: 0, opacity: pillarsFade}}>
        <FaText x={960} y={140} w={900} size={44} text="سه دستاورد کلیدی" weight={700} color={palette.ice} family="headline" opacity={pillarsLabel} dy={(1 - pillarsLabel) * 14} />
        <Pillar t={t} cx={1500} start={9.0} idx={0} fade={pillarsFade} kind="control" title="مدیریت هوشمند و متمرکز" line="نظارت لحظه‌ای بر فرایند آزمون در واحدهای تابعه" />
        <Pillar t={t} cx={960} start={9.625} idx={1} fade={pillarsFade} kind="shield" title="پایداری و امنیت" line="پایداری در اوج ترافیک آزمون‌ها" />
        <Pillar t={t} cx={420} start={10.25} idx={2} fade={pillarsFade} kind="coverage" title="پوشش کامل استانی" line="زیرساخت یکپارچه برای همهٔ واحدهای استان" />
        {/* arcs between pillar tops, then the threads gather into the convergence point */}
        {arcA > 0 && <Thread d="M1500 280 Q1230 200 960 280" from={0} to={arcA} width={3} glow={0.7} opacity={pillarsFade} />}
        {arcB > 0 && <Thread d="M960 280 Q690 200 420 280" from={0} to={arcB} width={3} glow={0.7} opacity={pillarsFade} />}
        {gatherA > 0 && <Thread d="M1500 280 Q1290 150 960 200" from={0} to={gatherA} width={4} glow={1} head={gatherA < 0.99} opacity={1 - seg(t, 12.0, 12.4)} />}
        {gatherB > 0 && <Thread d="M420 280 Q630 150 960 200" from={0} to={gatherB} width={4} glow={1} head={gatherB < 0.99} opacity={1 - seg(t, 12.0, 12.4)} />}
      </div>

      {/* convergence glow + node, feeding S7's tassel thread */}
      {t >= 11.5 && (
        <>
          <div style={{position: "absolute", left: TOP.x - 90, top: TOP.y - 90, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, rgba(106,184,255,0.9) 0%, rgba(106,184,255,0) 70%)`, opacity: 0.8 * (1 - seg(t, 12.2, 12.5))}} />
          <NodeDot x={TOP.x} y={TOP.y} p={seg(t, 11.5, 11.9, E.outBack(1.5))} opacity={1 - seg(t, 12.3, 12.5)} />
        </>
      )}
    </AbsoluteFill>
  );
};
