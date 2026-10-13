// P2 scenes for the uni-admissions teaser (concept (c), 24 s social). One component per beat-grid
// cut (motion.ts CUT_BEATS). Local frame 0 = the scene's cut. Persian copy comes only from COPY
// tokens (gitignored copy map); Persian digits only, letter-spacing always 0.
//
// PAYOFF FRAME TABLE (global frames @ 30 fps, 120 BPM; scene start = CUT_FRAMES) — for the P5 cue sheet.
// Rule: every build-up lands on a visible hit; sound intent sits on the contact frame.
//   frame  scene       event                                          intended sound
//   ------ ----------- ---------------------------------------------- --------------------------------
//    50    hook        underline curl ends, question dot + ring       soft ding (hit), -18 dB
//    75    breadth     notebook row 1 tick + ring                     tap + soft ding, -12/-18 dB
//    93    breadth     notebook row 2 tick + ring                     tap + soft ding
//   111    breadth     notebook row 3 tick + ring                     tap + soft ding
//   135    breadth     hero ۱۲۰ stamp-in (squash + shake + ring)      stamp-thud + sub boom, tail 1.2 s
//   192    scale       counter lands on ۴۸۰۰۰ (squash)                soft ding
//   198    scale       sub-row B3b tick + ring                        tap + soft ding
//   210    scale       sub-row B3c tick (ACCENT, double ring)         bell, +6 dB over ticks
//   255    research    node 1 pulses                                  tick
//   267    research    node 2 pulses                                  tick
//   279    research    node 3 pulses                                  tick
//   285    research    hero ۱۵۰ stamp-in (squash + shake + ring)      stamp-thud + sub boom, tail 1.2 s
//   360    excellence  seal stamps (shake-ring, scene accent)         bell + transient, ring-out 1.2 s
//   382    excellence  ۲۵ roll lands                                  soft ding
//   390    excellence  B5b line in                                    soft ding
//   435    support     tile 1 tick + ring                             tap + soft ding
//   450    support     tile 2 tick + ring                             tap + soft ding
//   480    support     tile 3 tick (ACCENT, double ring)              bell, -8 dB
//   510    place       scene cut                                      swoosh (starts f505 = cut-5)
//   555    place       hero line lands (stamp + ring)                 stinger; sparkle +150 ms
//   570    place       B7b line in                                    soft ding
//   645    gate        arch outline completes                         scribble ends
//   660    gate        QR fully settled (entrance starts 652)         silent; scan time before final hold
//   660    gate        emblem wings burst open (book)                 stinger + chime (hit)
//   675    gate        URL pill pops                                  soft ding
//   685    gate        shield drops in and settles                    soft stamp
//   700    gate        white pen element lands on the ink dot + ring  soft ding (pencil-dot)
//   705    gate        final logo stamp + flash (FINAL ACCENT)        stamp + chime; ring-out tail to ~735
//   706-719 gate       calm hold (rings done by 119; flash gone)      tail fades under the end
//
// B5a is on HOLD (malformed rank string, owner to confirm) and is deliberately not rendered.
import React from "react";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";
import {THEME} from "./theme";
import {Box, LayoutRow, SceneName, slot} from "./layout";
import {COPY, CopyToken} from "./copy";
import {inOutSine, lerp, outBack, outCubic, outExpo, prog, shake, useSceneFrame} from "./motion";
import {Emblem} from "./Logo";
import {inkPoints, nib, partial, Ribbon} from "../social/Pen";

const C = THEME.colors;
export const LayoutCtx = React.createContext<LayoutRow | null>(null);

type TxtProps = {box: Box; size: number; weight: number; color: string; family?: string; style?: React.CSSProperties; children: React.ReactNode};
/** A whole Persian line/word block. letter-spacing is always 0 and text is never split per character. */
const Txt: React.FC<TxtProps> = ({box, size, weight, color, family = THEME.fonts.head, style, children}) => (
  <div style={{position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center", direction: "rtl", textAlign: "center", fontFamily: `"${family}"`, fontSize: size,
    fontWeight: weight, color, letterSpacing: 0, lineHeight: 1.45, ...style}}>
    {children}
  </div>
);

const Frame: React.FC<{svg?: React.ReactNode; children?: React.ReactNode; bg: string}> = ({svg, children, bg}) => {
  const L = React.useContext(LayoutCtx)!;
  return (
    <div style={{position: "absolute", inset: 0, background: bg, overflow: "hidden"}}>
      <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>{svg}</svg>
      {children}
    </div>
  );
};

/** Largest font size <= base at which `text` wraps inside `box` (estimate: 0.6 em per Persian char in
 *  a heavy weight, 1.55 line-height, conservative). Prevents overflow on every ratio. */
const fit = (text: string, box: Box, base: number, min: number) => {
  const cpl = (s: number) => Math.max(1, Math.floor(box.w / (s * 0.6)));
  let s = base;
  while (s > min && Math.ceil(text.length / cpl(s)) * s * 1.55 > box.h) s -= 2;
  return s;
};

const FA = "۰۱۲۳۴۵۶۷۸۹";
/** Persian digits only — every counter renders through this. */
const faNum = (n: number) => String(Math.max(0, Math.round(n))).replace(/\d/g, (d) => FA[Number(d)]);

/** stamp-in payoff (payoff-brief recipe): the block hovers lifted (scale `from` -> 1 over the 8 frames
 *  before the hit, opacity in 2), lands ON the hit frame with a squash (scaleY 0.9) + 1.04 overshoot. */
const stampIn = (f: number, at: number, from = 1.9) => {
  const pre = Math.pow(prog(f, at - 8, 8), 3);
  const settle = outBack(prog(f, at, 4));
  const s = lerp(from, 1, pre);
  return {transform: `scale(${s * (1 + 0.04 * (1 - settle))}, ${s * (1 - 0.1 * (1 - settle))})`, opacity: prog(f, at - 8, 2)};
};

/** ring-pulse payoff: a stroke ring expands r0 -> r1 (outExpo, 14 frames) while fading 0.5 -> 0.
 *  `accent` adds a second, slightly larger ring 4 frames later (the "bigger, more final" version). */
const RingPulse: React.FC<{f: number; at: number; cx: number; cy: number; r0: number; r1: number; color: string; accent?: boolean}> =
({f, at, cx, cy, r0, r1, color, accent}) => {
  const ring = (at2: number, rr: number) => {
    const t = prog(f, at2, 14);
    if (t <= 0 || t >= 1) return null;
    return <circle cx={cx} cy={cy} r={lerp(r0, rr, outExpo(t))} stroke={color} strokeWidth={Math.max(2.5, r0 * 0.14)} fill="none" opacity={0.5 * (1 - t)} />;
  };
  return <>{ring(at, r1)}{accent ? ring(at + 4, r1 * 1.15) : null}</>;
};

/** stroke-draw helper: pair with pathLength={1000} so any path draws by dash offset. */
const draw = (p: number) => ({strokeDasharray: 1000, strokeDashoffset: 1000 * (1 - Math.min(1, Math.max(0, p)))});

/** The pencil character (uni palette: sand body, navy cap, blue band). Tip sits exactly at (x, y). */
const Pencil: React.FC<{x: number; y: number; angle?: number; scale: number; opacity?: number}> = ({x, y, angle = 18, scale, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
    <g stroke={C.ink} strokeWidth={5} strokeLinejoin="round">
      <rect x={-13} y={-150} width={26} height={116} rx={4} fill={C.penBody} />
      <rect x={-13} y={-150} width={26} height={24} fill={C.penCap} stroke="none" />
      <rect x={-13} y={-126} width={26} height={10} fill={C.penBand} stroke="none" />
      <path d="M -13 -34 L 13 -34 L 0 0 Z" fill={C.penBody} />
    </g>
    <path d="M -4.5 -12.5 L 4.5 -12.5 L 0 0 Z" fill={C.penTip} />
  </g>
);

/** Piecewise-linear path with inOutSine easing between keys [frame, x, y]: where the pencil tip is. */
const tipAt = (keys: [number, number, number][], f: number): [number, number] => {
  if (f <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, x0, y0] = keys[i], [t1, x1, y1] = keys[i + 1];
    if (f <= t1) {
      const p = inOutSine((f - t0) / Math.max(1, t1 - t0));
      return [lerp(x0, x1, p), lerp(y0, y1, p)];
    }
  }
  const k = keys[keys.length - 1];
  return [k[1], k[2]];
};

/** A checked circle (the tick). `s` is the outBack-scaled check progress. */
const Tick: React.FC<{x: number; y: number; r: number; s: number; bg: string; fg: string; sw: number}> = ({x, y, r, s, bg, fg, sw}) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, s)})`}>
    <circle r={r} fill={bg} />
    <path d={`M ${-r * 0.42} 0 L ${-r * 0.12} ${r * 0.32} L ${r * 0.5} ${-r * 0.36}`} stroke={fg} strokeWidth={sw} fill="none"
      strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

// ---------- 1. HOOK (frames 0-59): the pencil writes the question.
// Underline written right-to-left 12-46 with a curling loop at its end; the dot + ring land at H = 50.
export const SceneHook: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "hookText");
  const H = 50;
  const y = t.y + t.h * 0.84;
  const pts = inkPoints({x0: t.x + t.w * 0.94, x1: t.x + t.w * 0.08, y, amp: t.h * 0.012, waves: 1.6, jag: t.h * 0.008, seed: 1.2, decay: 1.1, loop: t.h * 0.04}, 150);
  const end = pts[pts.length - 1];
  const line = partial(pts, outCubic(prog(f, 12, 34)));
  const tip = line[line.length - 1] ?? pts[0];
  const words = COPY.Q.split(" ").filter(Boolean);
  const dot = outBack(prog(f, H, 6));
  const size = fit(COPY.Q, t, L.type.h1, L.type.h2);
  return (
    <Frame bg={C.paper} svg={<>
      <Ribbon pts={line} total={pts.length - 1} width={nib(THEME.stroke.inkThin * 0.45, THEME.stroke.ink * 0.5, 35)} fill={C.ink} />
      <circle cx={end[0]} cy={end[1] - t.h * 0.05} r={Math.max(5, size * 0.06) * dot} fill={C.blue} />
      <RingPulse f={f} at={H} cx={end[0]} cy={end[1] - t.h * 0.05} r0={size * 0.08} r1={size * 0.6} color={C.blue} />
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.55} />
    </>}>
      {/* write-on reveal: PER WORD, in RTL reading order (rightmost word first). No clip, no
          per-character split — joined glyphs inside a word are never cut mid-word. */}
      <Txt box={t} size={size} weight={THEME.weights.head} color={C.ink}>
        <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline",
          direction: "rtl", columnGap: "0.28em", rowGap: "0.12em"}}>
          {words.map((w, i) => {
            const p = outExpo(prog(f, 14 + (i * 24) / Math.max(1, words.length), 8));
            return <span key={i} style={{display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 0.18}em)`}}>{w}</span>;
          })}
        </div>
      </Txt>
    </Frame>
  );
};

// ---------- 2. BREADTH (local 0-89): notebook ticks; hero digits roll to ۱۲۰, stamp at 75.
export const SceneBreadth: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "breadthText"), a = slot(L, "breadthArt");
  const H = 75; // global 135
  const b2aBox = {x: t.x, y: t.y, w: t.w, h: t.h * 0.3};
  const heroBox = {x: t.x, y: t.y + t.h * 0.34, w: t.w, h: t.h * 0.44};
  const b2bBox = {x: t.x, y: t.y + t.h * 0.78, w: t.w, h: t.h * 0.22};
  const n = Math.round(lerp(0, 120, outExpo(prog(f, 55, 18))));
  const heroSize = Math.min(L.type.digit * 0.72, heroBox.w / 2.3, heroBox.h / 1.2);
  const sh = shake(f, H, heroSize * 0.05, 8);
  const rowH = a.h / 4.4;
  const rows = [0, 1, 2].map((i) => ({T: [15, 33, 51][i], y: a.y + rowH * (i + 1.15)}));
  const tip = tipAt([
    [0, a.x + a.w * 0.92, a.y + rowH * 0.2],
    [15, a.x + a.w - rowH * 0.55, rows[0].y], [24, a.x + a.w - rowH * 0.55, rows[0].y],
    [33, a.x + a.w - rowH * 0.55, rows[1].y], [42, a.x + a.w - rowH * 0.55, rows[1].y],
    [51, a.x + a.w - rowH * 0.55, rows[2].y], [62, a.x + a.w - rowH * 0.55, rows[2].y],
    [82, a.x + a.w * 1.25, a.y + a.h * 1.2],
  ], f);
  return (
    <Frame bg={C.paper} svg={<>
      {rows.map((r, i) => (
        <g key={i} opacity={outExpo(prog(f, r.T - 9, 8))}>
          <line x1={a.x + rowH * 0.2} x2={a.x + a.w - rowH * 1.15} y1={r.y} y2={r.y} stroke={C.grey} strokeWidth={Math.max(2, rowH * 0.025)} />
          <RingPulse f={f} at={r.T} cx={a.x + a.w - rowH * 0.55} cy={r.y} r0={rowH * 0.28} r1={rowH * 0.85} color={C.blue} />
          <Tick x={a.x + a.w - rowH * 0.55} y={r.y} r={rowH * 0.3} s={outBack(prog(f, r.T - 2, 8))} bg={C.blue} fg={C.paper} sw={Math.max(4, rowH * 0.07)} />
        </g>
      ))}
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.5} />
    </>}>
      <Txt box={b2aBox} size={fit(COPY.B2a, b2aBox, L.type.h2, L.type.body)} weight={THEME.weights.head} color={C.ink}
        style={{opacity: outExpo(prog(f, 4, 8)), transform: `translateY(${(1 - outExpo(prog(f, 4, 8))) * 40}px)`}}>
        {COPY.B2a}
      </Txt>
      <Txt box={heroBox} size={heroSize} weight={THEME.weights.hero} color={C.blue}
        style={{opacity: stampIn(f, H).opacity, transform: `${stampIn(f, H).transform} translate(${sh}px, ${sh * 0.4}px)`}}>
        {faNum(n)}
      </Txt>
      <Txt box={b2bBox} size={fit(COPY.B2b, b2bBox, L.type.body, L.type.label)} weight={THEME.weights.body} color={C.ink}
        style={{opacity: outExpo(prog(f, 10, 8))}}>
        {COPY.B2b}
      </Txt>
    </Frame>
  );
};

// ---------- 3. SCALE (local 0-89): counter rolls to ۴۸۰۰۰; two sub-rows tick (accent on the last, 60).
export const SceneScale: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "scaleText"), a = slot(L, "scaleArt");
  const parts = COPY.B3a.split(" ");
  const word = parts.slice(1).join(" ");
  const v = lerp(0, 48000, outExpo(prog(f, 2, 43))); // lands f45 (global 192)
  const settle = outBack(prog(f, 45, 5));
  const heroSize = Math.min(L.type.digit * 0.6, (t.w * 0.94) / 3.6);
  const sh = shake(f, 45, heroSize * 0.04, 8);
  const cardH = a.h * 0.36;
  const card = (i: number): Box => ({x: a.x, y: a.y + a.h * (0.07 + i * 0.52), w: a.w, h: cardH});
  const rows: {box: Box; T: number; token: CopyToken; accent: boolean}[] = [
    {box: card(0), T: 48, token: "B3b", accent: false},
    {box: card(1), T: 60, token: "B3c", accent: true},
  ];
  const checkAt = (c: Box) => [c.x + c.h * 0.62, c.y + c.h / 2] as const;
  const k0 = checkAt(rows[0].box), k1 = checkAt(rows[1].box);
  const tip = tipAt([
    [0, a.x + a.w * 0.9, a.y + a.h * 1.05], [44, k0[0], k0[1]], [53, k0[0], k0[1]],
    [58, k1[0], k1[1]], [72, k1[0], k1[1]], [86, a.x + a.w * 1.25, a.y + a.h * 1.1],
  ], f);
  return (
    <Frame bg={C.paper} svg={<>
      {rows.map((r, i) => (
        <g key={i} opacity={outExpo(prog(f, r.T - 12, 8))}>
          <rect x={r.box.x} y={r.box.y} width={r.box.w} height={r.box.h} rx={r.box.h * 0.18}
            fill="rgba(36,52,77,0.05)" stroke={C.grey} strokeWidth={Math.max(2, r.box.h * 0.02)} />
          <RingPulse f={f} at={r.T} cx={checkAt(r.box)[0]} cy={checkAt(r.box)[1]} r0={r.box.h * 0.24}
            r1={r.box.h * (r.accent ? 0.85 : 0.62)} color={C.blue} accent={r.accent} />
          <Tick x={checkAt(r.box)[0]} y={checkAt(r.box)[1]} r={r.box.h * 0.26} s={outBack(prog(f, r.T - 2, 8)) * (r.accent ? 1.25 : 1)}
            bg={C.blue} fg={C.paper} sw={Math.max(4, r.box.h * 0.055)} />
        </g>
      ))}
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.5} />
    </>}>
      <Txt box={{x: t.x, y: t.y + t.h * 0.02, w: t.w, h: t.h * 0.6}} size={heroSize} weight={THEME.weights.hero} color={C.blue}
        style={{transform: `scale(${1 + 0.05 * (1 - settle)}, ${1 - 0.08 * (1 - settle)}) translate(${sh}px, 0)`}}>
        {faNum(v)}
      </Txt>
      <Txt box={{x: t.x, y: t.y + t.h * 0.6, w: t.w, h: t.h * 0.2}} size={L.type.h2} weight={THEME.weights.head} color={C.ink}
        style={{opacity: outExpo(prog(f, 12, 8)), transform: `translateY(${(1 - outExpo(prog(f, 12, 8))) * 40}px)`}}>
        {word}
      </Txt>
      {rows.map((r, i) => (
        <div key={i} style={{position: "absolute", left: r.box.x + r.box.h * 1.25, top: r.box.y, width: r.box.w - r.box.h * 1.5, height: r.box.h,
          display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", textAlign: "center", letterSpacing: 0,
          fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.label,
          fontSize: fit(COPY[r.token], r.box, L.type.h2 * 0.72, L.type.label),
          color: C.ink, opacity: outExpo(prog(f, r.T - 12, 8))}}>
          {COPY[r.token]}
        </div>
      ))}
    </Frame>
  );
};

// ---------- 4. RESEARCH (local 0-89): three nodes pulse in turn; hero ۱۵۰ stamps at 45.
export const SceneResearch: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "researchText"), a = slot(L, "researchArt");
  const H = 45; // global 285
  const topBox = {x: t.x, y: t.y, w: t.w, h: t.h * 0.36};
  const heroBox = {x: t.x, y: t.y + t.h * 0.38, w: t.w, h: t.h * 0.38};
  const subBox = {x: t.x, y: t.y + t.h * 0.78, w: t.w, h: t.h * 0.22};
  const heroSize = Math.min(L.type.digit * 0.55, heroBox.w / 2.2, heroBox.h / 1.2);
  const sh = shake(f, H, heroSize * 0.05, 8);
  const cx = a.x + a.w / 2, cy = a.y + a.h * 0.5;
  const R = Math.min(a.w, a.h) * 0.36;
  const node = (i: number) => {
    const ang = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6][i];
    return [cx + R * Math.cos(ang), cy + R * Math.sin(ang)] as const;
  };
  const ts = [15, 27, 39];
  const dotR = Math.max(10, R * 0.14);
  return (
    <Frame bg={C.paper} svg={<>
      {[0, 1, 2].map((i) => {
        const p = node(i), T = ts[i];
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={R * 0.3} fill="none" stroke={C.blue} strokeWidth={Math.max(3, R * 0.035)}
              pathLength={1000} {...draw(prog(f, T - 10, 10))} transform={`rotate(-90 ${p[0]} ${p[1]})`} />
            <circle cx={p[0]} cy={p[1]} r={dotR * outBack(prog(f, T - 2, 7))} fill={C.blue} />
            <RingPulse f={f} at={T} cx={p[0]} cy={p[1]} r0={dotR} r1={R * 0.55} color={C.blue} />
          </g>
        );
      })}
      {/* connecting lines, drawn node-to-node once both endpoints exist */}
      {[0, 1, 2].map((i) => {
        const p0 = node(i), p1 = node((i + 1) % 3);
        return <line key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={C.sand} strokeWidth={Math.max(3, R * 0.03)}
          strokeLinecap="round" pathLength={1000} {...draw(prog(f, 30 + i * 8, 8))} />;
      })}
    </>}>
      <Txt box={topBox} size={fit(`${COPY.B4a} — ${COPY.B4b}`, topBox, L.type.h2 * 0.7, L.type.label)} weight={THEME.weights.sub} color={C.ink} style={{opacity: outExpo(prog(f, 4, 8))}}>
        {COPY.B4a} — {COPY.B4b}
      </Txt>
      <Txt box={heroBox} size={heroSize} weight={THEME.weights.hero} color={C.blue}
        style={{opacity: stampIn(f, H).opacity, transform: `${stampIn(f, H).transform} translate(${sh}px, ${sh * 0.4}px)`}}>
        ۱۵۰
      </Txt>
      <Txt box={subBox} size={fit(COPY.B4c, subBox, L.type.body, L.type.label)} weight={THEME.weights.body} color={C.ink}
        style={{opacity: outExpo(prog(f, 52, 8))}}>
        {COPY.B4c}
      </Txt>
    </Frame>
  );
};

// ---------- 5. EXCELLENCE (local 0-89): a seal is drawn and STAMPED at 30 (shake-ring); ۲۵ rolls under it.
// B5a is on HOLD (malformed rank string) and is NOT rendered — the scene carries B5c + B5b only.
export const SceneExcellence: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "excellenceText"), a = slot(L, "excellenceArt");
  const H = 30; // global 360
  const heroBox = {x: t.x, y: t.y + t.h * 0.05, w: t.w, h: t.h * 0.56};
  const subBox = {x: t.x, y: t.y + t.h * 0.66, w: t.w, h: t.h * 0.28};
  const cParts = COPY.B5c.split(" ");
  const rest = cParts.slice(1).join(" ");
  const v = lerp(0, 25, outExpo(prog(f, 36, 16))); // lands f52 (global 382)
  const cx = a.x + a.w / 2, cy = a.y + a.h * 0.5;
  const R = Math.min(a.w, a.h) * 0.37;
  const sh = shake(f, H, R * 0.05, 8);
  const sealDrop = 1 - Math.pow(1 - prog(f, H - 6, 6), 3);
  return (
    <Frame bg={C.paper} svg={<>
      <g transform={`translate(${cx + sh} ${cy + sh * 0.4}) scale(${lerp(1.3, 1, sealDrop)})`}>
        <circle r={R} fill="none" stroke={C.ink} strokeWidth={Math.max(4, R * 0.045)} pathLength={1000} {...draw(prog(f, 4, 14))} />
        <circle r={R * 0.78} fill="none" stroke={C.blue} strokeWidth={Math.max(3, R * 0.03)} pathLength={1000} {...draw(prog(f, 12, 10))} />
        {Array.from({length: 12}, (_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          return <line key={i}
            x1={R * 0.84 * Math.cos(ang)} y1={R * 0.84 * Math.sin(ang)} x2={R * 0.96 * Math.cos(ang)} y2={R * 0.96 * Math.sin(ang)}
            stroke={C.blue} strokeWidth={Math.max(3, R * 0.03)} strokeLinecap="round" opacity={prog(f, 18 + i * 0.6, 4)} />;
        })}
        <circle r={R * 0.1 * outBack(prog(f, 24, 6))} fill={C.blue} />
      </g>
      {/* the stamp: shake-ring payoff at H (bell in the cue sheet), double ring */}
      <RingPulse f={f} at={H} cx={cx} cy={cy} r0={R * 0.5} r1={R * 1.35} color={C.blue} accent />
    </>}>
      <Txt box={heroBox} size={fit(COPY.B5c, heroBox, L.type.hero * 0.8, L.type.h2)} weight={THEME.weights.hero} color={C.ink}>
        <div>
          <span style={{color: C.blue, fontSize: "1.25em", fontWeight: THEME.weights.hero}}>{faNum(v)}</span>
          <span style={{opacity: outExpo(prog(f, 40, 8))}}> {rest}</span>
        </div>
      </Txt>
      <Txt box={subBox} size={fit(COPY.B5b, subBox, L.type.h2, L.type.label)} weight={THEME.weights.head} color={C.ink}
        style={{opacity: outExpo(prog(f, 58, 8)), transform: `translateY(${(1 - outExpo(prog(f, 58, 8))) * 40}px)`}}>
        {COPY.B5b}
      </Txt>
    </Frame>
  );
};

// ---------- 6. SUPPORT (local 0-89): three tiles ticked by the pencil; the last is the ACCENT (60).
export const SceneSupport: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "supportText"), a = slot(L, "supportArt");
  const tokens: CopyToken[] = ["B6a", "B6b", "B6c"];
  const ts = [15, 30, 60];
  const rowH = t.h / 3;
  const tiles = [0, 1, 2].map((i) => ({
    T: ts[i], accent: i === 2,
    x: a.x + a.w * (0.04 + i * 0.32), y: a.y + a.h * 0.22, w: a.w * 0.28, h: a.h * 0.56,
    rowY: t.y + rowH * (i + 0.5),
  }));
  // tick contact point (matches the Tick position) and a parking spot just above/right of each tile
  const contact = (r: {x: number; y: number; w: number; h: number}): [number, number] => [r.x + r.w / 2, r.y + r.h * 0.42];
  const park = (i: number): [number, number] => [tiles[i].x + tiles[i].w * 1.12, tiles[i].y - a.h * 0.06];
  const c0 = contact(tiles[0]), c1 = contact(tiles[1]), c2 = contact(tiles[2]);
  // P3 fix: the pencil touches each tick at its contact frame, then steps aside immediately —
  // it is well clear of the ACCENT tick (tile 3) by local 60 = global 480. Payoff frames unchanged.
  const tip = tipAt([
    [0, a.x + a.w * 0.95, a.y + a.h * 0.05],
    [15, c0[0], c0[1]], [18, park(0)[0], park(0)[1]],
    [30, c1[0], c1[1]], [33, park(1)[0], park(1)[1]],
    [55, c2[0], c2[1]], [58, c2[0], c2[1]],
    [62, a.x + a.w * 1.22, a.y + a.h * 0.85],
    [88, a.x + a.w * 1.42, a.y + a.h * 1.05],
  ], f);
  return (
    <Frame bg={C.paper} svg={<>
      {tiles.map((r, i) => {
        const pop = outBack(prog(f, r.T - 6, 10));
        return (
          <g key={i}>
            <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${Math.max(0.001, pop)}) translate(${-(r.x + r.w / 2)} ${-(r.y + r.h / 2)})`}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.w * 0.14} fill="rgba(36,52,77,0.05)"
                stroke={r.accent ? C.blue : C.grey} strokeWidth={Math.max(2.5, r.w * 0.025)} />
              <Tick x={r.x + r.w / 2} y={r.y + r.h * 0.42} r={r.w * 0.22} s={outBack(prog(f, r.T - 2, 8)) * (r.accent ? 1.3 : 1)}
                bg={C.blue} fg={C.paper} sw={Math.max(4, r.w * 0.045)} />
            </g>
            <RingPulse f={f} at={r.T} cx={r.x + r.w / 2} cy={r.y + r.h * 0.42} r0={r.w * 0.18} r1={r.w * (r.accent ? 0.75 : 0.55)}
              color={C.blue} accent={r.accent} />
          </g>
        );
      })}
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.5} />
    </>}>
      {tiles.map((r, i) => (
        <div key={i} style={{position: "absolute", left: t.x, top: r.rowY - rowH / 2, width: t.w, height: rowH, display: "flex",
          alignItems: "center", justifyContent: "center", direction: "rtl", textAlign: "center", letterSpacing: 0,
          fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.label,
          fontSize: fit(COPY[tokens[i]], {x: t.x, y: r.rowY - rowH / 2, w: t.w, h: rowH}, L.type.body, L.type.label),
          color: C.ink, opacity: outExpo(prog(f, r.T - 8, 8))}}>
          {COPY[tokens[i]]}
        </div>
      ))}
    </Frame>
  );
};

// ---------- 7. PLACE (local 0-89): the pencil travels to the east edge; the hero line lands at 45.
// P3 A/B: the generated arch image (git-ignored uni-local) can replace the procedural swoosh as the
// hero; USE_ARCH flips back to the procedural version if the image reads worse.
const USE_ARCH = true;
export const ScenePlace: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "placeText"), a = slot(L, "placeArt");
  const H = 45; // global 555
  const heroBox = {x: t.x, y: t.y, w: t.w, h: t.h * 0.55};
  const subBox = {x: t.x, y: t.y + t.h * 0.62, w: t.w, h: t.h * 0.34};
  const pts = inkPoints({x0: a.x + a.w * 0.82, x1: a.x + a.w * 0.16, y: a.y + a.h * 0.5, amp: a.h * 0.05, waves: 1.2, jag: a.h * 0.01, seed: 2.4}, 120);
  const endP = pts[pts.length - 1];
  const line = partial(pts, outCubic(prog(f, 5, 33)));
  const tip = line[line.length - 1] ?? pts[0];
  const endAng = Math.atan2(pts[11][1] - pts[8][1], pts[11][0] - pts[8][0]);
  const head = outBack(prog(f, 38, 6));
  const heroSize = fit(COPY.B7a, heroBox, L.type.h1, L.type.h2);
  const sh = shake(f, H, heroSize * 0.05, 8);
  const pulse = f > 40 ? 1 + 0.14 * Math.exp(-(((f - 40) % 15) / 4)) * (1 - prog(f, 70, 8)) : 0;
  // arch hero: soft rise + feathered-edge mask (alpha cleanup for the generated PNG's edge specks:
  // a radial fade eats the rim on every side so the fringing dissolves into the paper)
  const archSrc = useArchDataUrl();
  const archIn = outExpo(prog(f, 4, 30));
  // the PNG's content occupies only ~63 % of its canvas height, so oversize the box to make the
  // arch itself fill the art slot (box ratio = PNG canvas ratio 1080:1449)
  const archH = a.h * 1.56, archW = archH * (1080 / 1449);
  const bx = a.x + (a.w - archW) / 2, by = a.y + (a.h - archH) / 2;
  return (
    <Frame bg={C.paper} svg={<>
      {USE_ARCH && archSrc ? (
        <g>
          <defs>
            <radialGradient id="uniArchFade">
              <stop offset="72%" stopColor="#fff" />
              <stop offset="86%" stopColor="#fff" stopOpacity="0.6" />
              <stop offset="97%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id="uniArchMask" maskUnits="userSpaceOnUse" x={bx} y={by} width={archW} height={archH}>
              <rect x={bx} y={by} width={archW} height={archH} fill="url(#uniArchFade)" />
            </mask>
          </defs>
          <g mask="url(#uniArchMask)" opacity={archIn * (1 - prog(f, 82, 7))}>
            <image href={archSrc} x={bx} y={by + (1 - archIn) * a.h * 0.05} width={archW} height={archH}
              preserveAspectRatio="xMidYMid meet" style={{filter: "saturate(0.88) contrast(1.02)"}} />
          </g>
        </g>
      ) : (<>
        <Ribbon pts={line} total={pts.length - 1} width={nib(THEME.stroke.inkThin * 0.45, THEME.stroke.ink * 0.5, 35)} fill={C.blue} />
        <g transform={`translate(${endP[0]} ${endP[1]}) rotate(${(endAng * 180) / Math.PI}) scale(${Math.max(0.001, head)})`}
          opacity={prog(f, 38, 2)}>
          <path d={`M 0 0 L ${-a.h * 0.09} ${-a.h * 0.05} M 0 0 L ${-a.h * 0.09} ${a.h * 0.05}`} stroke={C.blue}
            strokeWidth={Math.max(5, a.h * 0.016)} strokeLinecap="round" fill="none" />
        </g>
        <circle cx={endP[0]} cy={endP[1]} r={Math.max(6, a.h * 0.018) * (0.6 + pulse)} fill={C.blue} opacity={prog(f, 40, 2)} />
        <RingPulse f={f} at={42} cx={endP[0]} cy={endP[1]} r0={a.h * 0.02} r1={a.h * 0.14} color={C.blue} />
      </>)}
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.5} opacity={(USE_ARCH ? 1 - prog(f, 12, 5) : 1 - prog(f, 42, 6))} />
    </>}>
      <Txt box={heroBox} size={heroSize} weight={THEME.weights.head} color={C.ink}
        style={{opacity: stampIn(f, H, 1.6).opacity, transform: `${stampIn(f, H, 1.6).transform} translate(${sh}px, ${sh * 0.4}px)`}}>
        {COPY.B7a}
      </Txt>
      <Txt box={subBox} size={fit(COPY.B7b, subBox, L.type.body, L.type.label)} weight={THEME.weights.body} color={C.blue}
        style={{opacity: outExpo(prog(f, 58, 8)), transform: `translateY(${(1 - outExpo(prog(f, 58, 8))) * 40}px)`}}>
        {COPY.B7b}
      </Txt>
    </Frame>
  );
};

/** QR matrix for the CTA. qr.json is generated at build time by the git-ignored
 *  workbench/public/uni-local script from the copy-map token B8 (the URL is never in tracked code). */
type QrData = {n: number; rows: number[][]};
const useQr = (): QrData | null => {
  const [handle] = React.useState(() => delayRender("uni-qr"));
  const [data, setData] = React.useState<QrData | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch(staticFile("uni-local/qr.json")).then((r) => r.json() as Promise<QrData>).then(
      (d) => {
        if (alive) setData(d);
        continueRender(handle);
      },
      (err) => cancelRender(err),
    );
    return () => {
      alive = false;
    };
  }, [handle]);
  return data;
};

/** Preloads the arch PNG (render-blocking) and resolves it to a data URL so the SVG <image>
 *  draws straight from memory (an HTML <img> cannot live inside the Frame's <svg>). */
const useArchDataUrl = (): string | null => {
  const [handle] = React.useState(() => delayRender("uni-arch-img"));
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetch(staticFile("uni-local/arch-gateway-flat.png"))
      .then((r) => r.blob())
      .then((b) => new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = () => rej(new Error("arch read failed"));
        fr.readAsDataURL(b);
      }))
      .then((d) => {
        if (alive) setSrc(d);
        continueRender(handle);
      }, (e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [handle]);
  return src;
};

/** High-contrast QR plate: navy modules on cream, quiet zone >= 4 modules on every side. */
const QrPlate: React.FC<{size: number}> = ({size}) => {
  const qr = useQr();
  if (!qr) return null;
  const qz = 4;
  const total = qr.n + qz * 2;
  const d = qr.rows.map((row, r) => row.map((v, c) => (v ? `M${c + qz} ${r + qz}h1v1h-1z` : "")).join("")).join("");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} style={{display: "block", shapeRendering: "crispEdges"}}>
      <rect width={total} height={total} fill={C.paper} />
      <path d={d} fill={C.ink} />
    </svg>
  );
};

// ---------- 8. GATE + CTA (local 0-119): the pencil draws the arch, the arch closes into the emblem;
// wings open like a book from both sides (hit 60), the shield drops in (85), the white pen element
// lands last on its ink dot (100), URL at 75, final logo stamp + flash at 105, then a calm hold.
export const SceneGate: React.FC = () => {
  const f = useSceneFrame();
  const L = React.useContext(LayoutCtx)!;
  const t = slot(L, "gateText"), a = slot(L, "gateArt");
  const cx = a.x + a.w / 2, cy = a.y + a.h * 0.48;
  const d = Math.min(a.w * 0.84, a.h * 0.92); // emblem plate height
  // arch outline, drawn by the pencil 5-45, contracting into the seal 48-58
  const archPts = (() => {
    const pts: [number, number][] = [];
    const w = Math.min(a.w * 0.6, a.h * 0.95), base = a.y + a.h * 0.88, top = a.y + a.h * 0.14;
    const r = w / 2, spring = base - (base - top) * 0.5;
    for (let i = 0; i <= 18; i++) pts.push([cx + r, lerp(base, spring, i / 18)]);
    for (let i = 1; i < 40; i++) {
      const th = (i / 40) * Math.PI;
      pts.push([cx + r * Math.cos(th), spring - (spring - top) * Math.sin(th)]);
    }
    for (let i = 0; i <= 18; i++) pts.push([cx - r, lerp(spring, base, i / 18)]);
    return pts;
  })();
  const line = partial(archPts, outCubic(prog(f, 5, 40)));
  const tip = line[line.length - 1] ?? archPts[0];
  const contract = outExpo(prog(f, 48, 10));
  // the emblem hero
  const pop = outBack(prog(f, 52, 10));
  const wingOpen = outBack(prog(f, 55, 16)); // burst open, settled 71 — hit at 60
  const shieldIn = outBack(prog(f, 72, 13)); // lands/settles 85
  const penDot = outBack(prog(f, 86, 8));
  const penIn = outBack(prog(f, 90, 10)); // lands 100 — the "pencil dot"
  const urlIn = outBack(prog(f, 75, 8));
  // QR settles at local 60 (global 660): 45 frames / 1.5 s before the final hold at 705.
  // Size >= 224 px at 1080 width, scaled per ratio; remains visible through frame 719.
  const qrSize = Math.max(224, Math.round(Math.min(L.W, L.H) * 0.21));
  const qrIn = outBack(prog(f, 52, 8));
  const H = 105; // final logo stamp (global 705)
  const stampS = lerp(1.06, 1, 1 - Math.pow(1 - prog(f, H, 5), 3));
  const sh = shake(f, H, d * 0.012, 8);
  const flash = 0.22 * outExpo(prog(f, H, 3)) * (1 - prog(f, 112, 6));
  const emH = d * Math.max(0.001, pop) * stampS, emW = emH * (700 / 940);
  const penScr = {x: cx - emW / 2 + ((500 - 150) / 700) * emW, y: cy - emH / 2 + ((375.7 - 30) / 940) * emH};
  const ringOut = (delay: number) => {
    const p = prog(f, H + delay, 10); // done by 119: the hold after the tail is completely still
    if (p <= 0 || p >= 1) return null;
    return <circle cx={cx} cy={cy} r={lerp(d * 0.5, d * 1.15, outExpo(p))} stroke={C.sand}
      strokeWidth={Math.max(3, d * 0.02) * (1 - p * 0.6)} fill="none" opacity={0.55 * (1 - p)} />;
  };
  return (
    <Frame bg={C.paper} svg={<>
      {/* the arch, contracting into the emblem */}
      <g transform={`translate(${cx} ${cy}) scale(${1 - 0.72 * contract}) translate(${-cx} ${-cy})`} opacity={1 - contract}>
        <Ribbon pts={line} total={archPts.length - 1} width={nib(THEME.stroke.inkThin * 0.45, THEME.stroke.ink * 0.5, 35)} fill={C.ink} />
      </g>
      <Pencil x={tip[0]} y={tip[1]} scale={L.penScale * 0.5} opacity={1 - prog(f, 44, 5)} />
      {ringOut(0)}
      {ringOut(2)}
      {ringOut(4)}
      {/* pen-element landing ring (the pencil dot) */}
      <RingPulse f={f} at={100} cx={penScr.x} cy={penScr.y} r0={d * 0.05} r1={d * 0.3} color={C.blue} />
    </>}>
      <Emblem x={cx + sh} y={cy} h={emH} wingOpen={wingOpen} shieldIn={shieldIn} penDot={penDot} penIn={penIn}
        plate={C.paper} rim={C.sand} dot={C.ink} />
      <div style={{position: "absolute", left: t.x, top: t.y + t.h * 0.06, width: t.w, height: t.h * 0.94, display: "flex",
        flexDirection: "column", justifyContent: "center", alignItems: "center", gap: t.h * 0.055}}>
        <div style={{background: C.blue, color: C.paper, borderRadius: 999, direction: "ltr", letterSpacing: 0,
          fontFamily: `"${THEME.fonts.head}"`, fontWeight: THEME.weights.head, fontSize: L.type.h2,
          padding: `${L.type.h2 * 0.22}px ${L.type.h2 * 0.9}px`, transform: `scale(${Math.max(0.001, urlIn)})`,
          opacity: prog(f, 75, 2), lineHeight: 1.3}}>
          {COPY.B8}
        </div>
        <div style={{background: C.paper, borderRadius: qrSize * 0.055, border: `2px solid ${C.sand}`,
          padding: qrSize * 0.03, transform: `scale(${Math.max(0.001, qrIn)})`, opacity: prog(f, 52, 3), lineHeight: 0}}>
          <QrPlate size={qrSize} />
        </div>
      </div>
      {/* full-frame flash on the final stamp, faded back out by 118; then a completely still hold */}
      {flash > 0 && <div style={{position: "absolute", inset: 0, background: C.paper, opacity: flash, pointerEvents: "none"}} />}
    </Frame>
  );
};

export const UNI_SCENES: {Component: React.FC; name: SceneName}[] = [
  {Component: SceneHook, name: "hook"},
  {Component: SceneBreadth, name: "breadth"},
  {Component: SceneScale, name: "scale"},
  {Component: SceneResearch, name: "research"},
  {Component: SceneExcellence, name: "excellence"},
  {Component: SceneSupport, name: "support"},
  {Component: ScenePlace, name: "place"},
  {Component: SceneGate, name: "gate"},
];



