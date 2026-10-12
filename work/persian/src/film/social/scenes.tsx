// Six beats, each with its own motion mechanic. Local frame 0 = the scene's cut (see CUT_TIMES_S).
import React from "react";
import {useCurrentFrame} from "remotion";
import {THEME} from "./theme";
import {Box, LayoutRow, slot} from "./layout";
import {BEAT_REF as BEAT, clamp, inBack, inExpo, inOutSine, lerp, outBack, outCubic, outExpo, prog, shake, useSceneFrame} from "./motion";
import {Pen, Ribbon, inkPoints, nib, partial, toPath} from "./Pen";

const C = THEME.colors;
export const LayoutCtx = React.createContext<LayoutRow | null>(null);
const useL = () => React.useContext(LayoutCtx)!;

type TxtProps = {box: Box; size: number; weight: number; color: string; family?: string; style?: React.CSSProperties; children: React.ReactNode; justify?: string; align?: string};
/** A whole Persian line/word block. letter-spacing is always 0 and text is never split per character. */
const Txt: React.FC<TxtProps> = ({box, size, weight, color, family = THEME.fonts.head, style, children, justify = "center", align = "center"}) => (
  <div style={{position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, display: "flex", flexDirection: "column",
    justifyContent: justify, alignItems: align, direction: "rtl", textAlign: "center", fontFamily: `"${family}"`, fontSize: size, fontWeight: weight,
    color, letterSpacing: 0, lineHeight: 1.45, ...style}}>
    {children}
  </div>
);

const Frame: React.FC<{svg?: React.ReactNode; children?: React.ReactNode; bg: string}> = ({svg, children, bg}) => {
  const L = useL();
  return (
    <div style={{position: "absolute", inset: 0, background: bg, overflow: "hidden"}}>
      <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`} style={{position: "absolute", inset: 0}}>{svg}</svg>
      {children}
    </div>
  );
};

/** Word-block stomp: scale from big to 1 with outExpo, a few frames, then sits. */
const stomp = (f: number, at: number, from = 2.6, len = 7) => ({
  transform: `scale(${lerp(from, 1, outExpo(prog(f, at, len)))})`,
  opacity: prog(f, at, 2),
});

const Badge: React.FC<{n: string; size: number; bg: string; fg: string; s?: number}> = ({n, size, bg, fg, s = 1}) => (
  <span style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: size * 1.25, height: size * 1.25, borderRadius: "50%",
    background: bg, color: fg, fontSize: size * 0.8, fontWeight: THEME.weights.hero, transform: `scale(${s})`, flexShrink: 0, lineHeight: 1}}>{n}</span>
);

// ---------- 1. HOOK  (0–2 s) mechanic: word-block STOMP + shaky scribble. Pen is ashamed.
export const SceneHook: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "hookText"), a = slot(L, "hookArt");
  const sh = shake(f, 3, 22) + shake(f, BEAT, 30);
  const pts = inkPoints({x0: a.x + a.w * 0.95, x1: a.x + a.w * 0.05, y: a.y + a.h * 0.72, amp: a.h * 0.08, waves: 3.3, jag: a.h * 0.07, seed: 1.3});
  const p = outCubic(prog(f, 0, 40));
  const line = partial(pts, p);
  const tip = line[line.length - 1];
  const cross = outBack(prog(f, 40, 8));
  const size = L.type.hero * 0.8;
  return (
    <Frame bg={C.bg[0]} svg={<>
      <Ribbon pts={line} total={pts.length - 1} width={nib(THEME.stroke.ink * 0.5, THEME.stroke.ink * 3.4, 35)} fill={C.inkMessy} />
      <g transform={`translate(${a.x + a.w * 0.5} ${a.y + a.h * 0.72}) scale(${cross})`} opacity={prog(f, 40, 2)}>
        <line x1={-a.w * 0.32} y1={-a.h * 0.22} x2={a.w * 0.32} y2={a.h * 0.22} stroke={C.paper} strokeWidth={22} strokeLinecap="round" />
      </g>
      <Pen x={tip[0]} y={tip[1]} scale={L.penScale * 0.85} frame={f} mood={-0.9} sharp={0} calm={0} tremble={7} />
    </>}>
      <Txt box={t} size={size} weight={THEME.weights.hero} color={C.fg[0]} style={{transform: `translate(${sh}px, ${sh * 0.4}px)`}}>
        <div style={{...stomp(f, 3), lineHeight: 1.3}}>دست‌خطت</div>
        <div style={{...stomp(f, BEAT), lineHeight: 1.3, background: C.ink, color: C.coral, padding: `0 ${size * 0.25}px`, borderRadius: size * 0.12, rotate: "-3deg"}}>زشته؟</div>
      </Txt>
    </Frame>
  );
};

// ---------- 2. PROMISE (2–4 s) mechanic: COUNTER ROLL of the digit + stopwatch ring. Pen looks up.
const DIGITS = ["۰", "۱", "۲", "۳"];
export const SceneCount: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "countText"), a = slot(L, "countArt");
  const D = L.type.digit, cell = D * 1.2;
  const roll = 3 * outExpo(prog(f, 1, 20));
  const word = outExpo(prog(f, 12, 10));
  const sub = outExpo(prog(f, BEAT * 2, 10));
  const ring = prog(f, 4, 56);
  // tall art slot (1:1): stopwatch on top, pen below; otherwise side by side with the pen at the far (left) edge
  const tall = a.h > a.w * 1.2;
  const r = tall ? Math.min(a.w * 0.4, a.h * 0.24) : Math.min(a.w * 0.28, a.h * 0.4);
  const cx = tall ? a.x + a.w * 0.58 : a.x + a.w - r - 20, cy = tall ? a.y + r + 50 : a.y + a.h * 0.5;
  const ang = -Math.PI / 2 - ring * 2 * Math.PI; // counter-clockwise sweep (RTL)
  // The pen hurries in, hops on each tick of the countdown (beats 1 and 2), then crouches into its writing pose: ready.
  const penS = tall ? (a.h * 0.42) / 410 : Math.max(L.penScale * 0.85, Math.min((a.h * 0.55) / 410, 1.2));
  const enter = outBack(prog(f, 0, 12));
  const hop = (at: number) => Math.sin(prog(f, at, 9) * Math.PI);
  const crouch = inOutSine(prog(f, 38, 10));
  const penX = lerp(a.x - 220 * penS, a.x + a.w * (tall ? 0.3 : 0.12), enter);
  const penY = a.y + a.h * (tall ? 0.97 : 0.92) - (hop(BEAT) + hop(BEAT * 2)) * 70 * penS;
  const penAng = lerp(-18, 20, outBack(prog(f, 40, 10)));
  const penSquash = 1 - 0.14 * (Math.sin(prog(f, BEAT - 3, 3) * Math.PI) + Math.sin(prog(f, BEAT * 2 - 3, 3) * Math.PI)) - 0.1 * crouch;
  return (
    <Frame bg={C.bg[1]} svg={<>
      <circle cx={cx} cy={cy} r={r} stroke="rgba(246,239,226,0.18)" strokeWidth={18} fill="none" />
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${ring > 0.5 ? 1 : 0} 0 ${cx + r * Math.cos(ang)} ${cy + r * Math.sin(ang)}`} stroke={C.yellow} strokeWidth={18} fill="none" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r * 0.7 * Math.cos(ang)} y2={cy + r * 0.7 * Math.sin(ang)} stroke={C.paper} strokeWidth={10} strokeLinecap="round" />
      <rect x={cx - 16} y={cy - r - 46} width={32} height={30} rx={6} fill={C.paper} />
      <Pen x={penX} y={penY} angle={penAng} scale={penS} squash={penSquash} frame={f} mood={lerp(-0.6, 0.45, prog(f, 38, 12))} sharp={0} calm={lerp(0, 0.45, prog(f, 40, 10))} tremble={lerp(2.5, 0, prog(f, 30, 16))} />
    </>}>
      <Txt box={t} size={L.type.h1} weight={THEME.weights.head} color={C.fg[1]}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: L.type.h1 * 0.3}}>
          <div style={{height: cell, overflow: "hidden", fontSize: D, fontWeight: THEME.weights.hero, color: C.yellow, lineHeight: `${cell}px`}}>
            <div style={{transform: `translateY(${-roll * cell}px)`}}>
              {DIGITS.map((d) => <div key={d} style={{height: cell}}>{d}</div>)}
            </div>
          </div>
          <div style={{fontSize: L.type.h1 * 1.25, opacity: word, transform: `translateX(${(1 - word) * -L.type.h1}px)`}}>نکته،</div>
        </div>
        <div style={{fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.sub, fontSize: L.type.h2, opacity: sub, transform: `translateY(${(1 - sub) * 40}px)`}}>برای دست‌خط بهتر</div>
      </Txt>
    </Frame>
  );
};

// ---------- 3. TIP 1 (4–7 s) mechanic: SHAPE MORPH of the pen tip (blunt -> fine nib) with inBack anticipation.
export const ScenePen: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "penText"), a = slot(L, "penArt");
  const s = L.penScale * 1.35;
  const thick = inkPoints({x0: a.x + a.w * 0.9, x1: a.x + a.w * 0.45, y: a.y + a.h * 0.86, amp: 10, waves: 1, jag: 6, seed: 2});
  const thin = inkPoints({x0: a.x + a.w * 0.95, x1: a.x + a.w * 0.08, y: a.y + a.h * 0.9, amp: a.h * 0.035, waves: 2.5, jag: 0, seed: 0.3});
  const pThick = outCubic(prog(f, 6, 14));
  const morph = outBack(prog(f, 34, 12));
  const squash = 1 - 0.18 * inBack(prog(f, 22, 12)) * (1 - prog(f, 34, 6)) + 0.08 * Math.sin(prog(f, 34, 16) * Math.PI);
  const pThin = inOutSine(prog(f, 50, 34));
  const lt = partial(thick, pThick), ln = partial(thin, pThin);
  const tip = f < 46 ? lt[lt.length - 1] : ln[ln.length - 1];
  // the pen lifts from the thick line to the start of the thin one between frames 40 and 50
  const hop = prog(f, 40, 10);
  const lift = f >= 40 && f < 50 ? [lerp(lt[lt.length - 1][0], thin[0][0], outCubic(hop)), lerp(lt[lt.length - 1][1], thin[0][1], outCubic(hop)) - Math.sin(hop * Math.PI) * 120] : tip;
  const spark = prog(f, 36, 12);
  const title = outExpo(prog(f, 3, 12));
  return (
    <Frame bg={C.bg[2]} svg={<>
      <path d={toPath(lt)} stroke={C.ink} strokeWidth={34} fill="none" strokeLinecap="round" opacity={1 - 0.6 * prog(f, 50, 10)} />
      <Ribbon pts={ln} total={thin.length - 1} width={nib(3, THEME.stroke.inkThin * 2.2, 40)} fill={C.blue} />
      {spark > 0 && spark < 1 ? Array.from({length: 8}, (_, i) => {
        const ang = (i / 8) * Math.PI * 2;
        const r0 = 30 + 110 * outExpo(spark), r1 = r0 + 50 * (1 - spark);
        return <line key={i} x1={lift[0] + r0 * Math.cos(ang)} y1={lift[1] + r0 * Math.sin(ang)} x2={lift[0] + r1 * Math.cos(ang)} y2={lift[1] + r1 * Math.sin(ang)} stroke={C.coral} strokeWidth={10} strokeLinecap="round" />;
      }) : null}
      <Pen x={lift[0]} y={lift[1]} scale={s} frame={f} squash={squash} mood={lerp(-0.5, 0.6, prog(f, 36, 12))} sharp={clamp(morph, 0, 1.08)} calm={0} tremble={lerp(3, 0.5, prog(f, 34, 10))} />
    </>}>
      <Txt box={t} size={L.type.h1} weight={THEME.weights.head} color={C.fg[2]}>
        <div style={{display: "flex", alignItems: "center", gap: L.type.h1 * 0.25, clipPath: `inset(0 0 ${(1 - title) * 100}% 0)`, transform: `translateY(${(1 - title) * 60}px)`}}>
          <Badge n="۱" size={L.type.h1} bg={C.coral} fg={C.paper} s={outBack(prog(f, 0, 10))} />
          <div style={{lineHeight: 1.3}}>قلم مناسب<br />بردار</div>
        </div>
      </Txt>
    </Frame>
  );
};

// ---------- 4. TIP 2 (7–10 s) mechanic: slow LINE SWEEP right-to-left; text revealed by the same sweep; shake decays.
export const SceneSlow: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "slowText"), a = slot(L, "slowArt");
  const p = inOutSine(prog(f, 6, 72));
  const pts = inkPoints({x0: a.x + a.w * 0.8, x1: a.x + a.w * 0.02, y: a.y + a.h * 0.9, amp: a.h * 0.07, waves: 2, jag: a.h * 0.06, decay: 2.5, seed: 0.7});
  const line = partial(pts, p);
  const tip = line[line.length - 1];
  const reveal = inOutSine(prog(f, 2, 24));
  return (
    <Frame bg={C.bg[3]} svg={<>
      <Ribbon pts={line} total={pts.length - 1} width={nib(THEME.stroke.ink * 0.45, THEME.stroke.ink * 1.9, 40)} fill={C.inkGood} />
      <Pen x={tip[0]} y={tip[1]} scale={L.penScale} frame={f} mood={lerp(0.1, 0.6, p)} sharp={1} calm={lerp(0.3, 0.92, prog(f, 10, 20))} tremble={lerp(4, 0, p)} />
    </>}>
      <Txt box={t} size={L.type.h1 * 1.35} weight={THEME.weights.hero} color={C.fg[3]}>
        <div style={{display: "flex", alignItems: "center", gap: L.type.h1 * 0.25, clipPath: `inset(-10% 0 -10% ${(1 - reveal) * 100}%)`}}>
          <Badge n="۲" size={L.type.h1} bg={C.yellow} fg={C.ink} />
          <div style={{lineHeight: 1.3}}>آرام بنویس</div>
        </div>
        <div style={{fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.body, fontSize: L.type.body, opacity: prog(f, 40, 12), marginTop: L.type.body * 0.3}}>عجله، خط را می‌لرزاند</div>
      </Txt>
    </Frame>
  );
};

// ---------- 5. TIP 3 (10–13.5 s) mechanic: LIST STAGGER of seven days; each day's line is calmer than the last.
const DAYS = ["روز ۱", "روز ۲", "روز ۳", "روز ۴", "روز ۵", "روز ۶", "روز ۷"];
export const SceneDaily: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "listTitle"), r = slot(L, "listRows");
  const rowH = r.h / DAYS.length;
  const labelW = L.type.label * 3.6;
  const step = 7, drawLen = 11;
  const rows = DAYS.map((d, i) => {
    const at = 8 + i * step;
    const y = r.y + rowH * (i + 0.5);
    const pts = inkPoints({x0: r.x + r.w - labelW - L.type.label * 0.8, x1: r.x + rowH * 0.9, y, amp: rowH * 0.12, waves: 2, jag: rowH * 0.16 * (1 - i / 6), seed: i * 1.7});
    return {d, i, at, y, pts, p: outCubic(prog(f, at + 3, drawLen)), enter: outExpo(prog(f, at, 10)), check: outBack(prog(f, at + 3 + drawLen, 8))};
  });
  const active = rows.filter((w) => f >= w.at + 3).pop() ?? rows[0];
  const al = partial(active.pts, active.p);
  const penTip = al[al.length - 1];
  const done = prog(f, 8 + 6 * step + 3 + drawLen, 1);
  const bounce = done > 0 ? -Math.abs(Math.sin(((f - 70) / BEAT) * Math.PI)) * 40 : 0;
  return (
    <Frame bg={C.bg[4]} svg={<>
      {rows.map((w) => (
        <g key={w.d} opacity={w.enter} transform={`translate(${(1 - w.enter) * 200} 0)`}>
          <line x1={r.x} x2={r.x + r.w} y1={w.y + rowH * 0.48} y2={w.y + rowH * 0.48} stroke="rgba(22,20,31,0.15)" strokeWidth={3} />
          <Ribbon pts={partial(w.pts, w.p)} total={w.pts.length - 1} width={nib(3, THEME.stroke.inkThin * 1.8, 40)} fill={C.ink} />
          <g transform={`translate(${r.x + rowH * 0.35} ${w.y}) scale(${w.check})`}>
            <circle r={rowH * 0.3} fill={w.i === 6 ? C.coral : C.mint} />
            <path d={`M ${-rowH * 0.13} 0 L ${-rowH * 0.03} ${rowH * 0.1} L ${rowH * 0.15} ${-rowH * 0.1}`} stroke={C.ink} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      ))}
      <Pen x={penTip[0]} y={penTip[1] + bounce} scale={L.penScale * 0.5} angle={-6} frame={f} mood={lerp(0, 1, prog(f, 8, 60))} sharp={1} calm={0} tremble={0} />
    </>}>
      <Txt box={t} size={L.type.h2} weight={THEME.weights.head} color={C.fg[4]}>
        <div style={{display: "flex", alignItems: "center", gap: L.type.h2 * 0.25, ...stomp(f, 0, 1.8, 6)}}>
          <Badge n="۳" size={L.type.h2} bg={C.ink} fg={C.yellow} />
          <div style={{lineHeight: 1.3}}>هر روز تکرار کن</div>
        </div>
      </Txt>
      {rows.map((w) => (
        <div key={w.d} style={{position: "absolute", left: r.x + r.w - labelW, top: w.y - rowH / 2, width: labelW, height: rowH, display: "flex", alignItems: "center",
          justifyContent: "flex-start", direction: "rtl", fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.label, fontSize: L.type.label, color: C.ink, letterSpacing: 0,
          opacity: w.enter, transform: `translateX(${(1 - w.enter) * 200}px)`}}>{w.d}</div>
      ))}
    </Frame>
  );
};

// ---------- 6. PAYOFF + CTA (13.5–17 s) mechanic: calligraphic LOOP FLOURISH + pill POP that pulses on the beat. Pen is proud.
export const SceneCta: React.FC = () => {
  const f = useSceneFrame();
  const L = useL();
  const t = slot(L, "ctaText"), a = slot(L, "ctaArt");
  const pts = inkPoints({x0: a.x + a.w * 0.92, x1: a.x + a.w * 0.08, y: a.y + a.h * 0.85, amp: 0, waves: 3, jag: 0, seed: 0, loop: a.h * 0.14});
  const p = inOutSine(prog(f, 2, 34));
  const line = partial(pts, p);
  const end = line[line.length - 1];
  const after = prog(f, 36, 14);
  // after the flourish the pen stands up on the end of its line and bounces on every beat
  const px = end[0];
  const bounceOn = f > 50 && f < 50 + BEAT * 1.5;
  const py = end[1] - Math.sin(after * Math.PI) * 80 - (bounceOn ? Math.abs(Math.sin(((f - 50) / BEAT) * Math.PI)) * 30 : 0);
  // closing gesture: the proud pen takes a bow towards the frame centre, eyes closed, then straightens up
  const bowDown = inOutSine(prog(f, 74, 9)), bowUp = outBack(prog(f, 89, 9));
  const bow = bowDown * (1 - bowUp);
  const penAngle = lerp(28, 0, outBack(after)) + 40 * bow;
  const pop = outBack(prog(f, 24, 12));
  const beat = f > 36 ? 1 + 0.045 * Math.exp(-((f - 36) % BEAT) / 4) : 1;
  const sub = outExpo(prog(f, 36, 12));
  return (
    <Frame bg={C.bg[5]} svg={<>
      <Ribbon pts={line} total={pts.length - 1} width={nib(THEME.stroke.ink * 0.4, THEME.stroke.ink * 2.6, 40)} fill={C.mint} />
      <Pen x={px} y={py} scale={L.penScale * 0.8} angle={penAngle} squash={1 - 0.08 * bow} frame={f} mood={1} sharp={1} calm={bow * 0.95} tremble={0} />
    </>}>
      <Txt box={t} size={L.type.h1} weight={THEME.weights.hero} color={C.fg[5]} justify="flex-start">
        <div style={{background: C.coral, color: C.paper, borderRadius: 999, padding: `${L.type.h1 * 0.1}px ${L.type.h1 * 0.55}px`, transform: `scale(${pop * beat})`, lineHeight: 1.45}}>دنبال کن</div>
        <div style={{fontFamily: `"${THEME.fonts.body}"`, fontWeight: THEME.weights.sub, fontSize: L.type.h2 * 0.85, marginTop: L.type.h2 * 0.5, opacity: sub, transform: `translateY(${(1 - sub) * 50}px)`}}>نکتهٔ بعدی را ببین</div>
      </Txt>
    </Frame>
  );
};

/** Colour-block wipe into the next scene: enters from the right (reading start), fully covers exactly at the cut. */
export const Wipe: React.FC<{color: string; len: number}> = ({color, len}) => {
  const f = useCurrentFrame();
  const L = useL();
  const e = inExpo(prog(f, 0, len));
  return <div style={{position: "absolute", top: 0, bottom: 0, width: L.W, left: L.W * (1 - e), background: color}} />;
};
