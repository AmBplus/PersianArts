// ============================================================================================================
// S5 «شکوه اعداد» (v2) — 45.0–60.0 s (local 0–15), night → gold, energy 5. THE scene.
// DROP at local 0 (hero word «مقیاس سامانه» lands on it). Counters stop on the bar downbeats
// 2.5 / 3.75 / 5.0 with confetti. Gold riser 7.5–8.75; Mashhad gold focus 8.75; medal 10.0.
// Exit 14.3–15.0: the gold collapses into the gold point (1080,520) = Mashhad node of S6.
// ============================================================================================================
import React from "react";
import {AbsoluteFill} from "remotion";
import {sceneBySceneId} from "../timing";
import {
  BlurSlideWords, CounterRoll, E, FaText, NodeDot, Sparkle, Thread, clamp, palette, pulse, seg, useT,
} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord} from "../kit/motion/HeroWord";
import {HalationGlow} from "../kit/motion/HalationGlow";
import {ConfettiBurst} from "../kit/motion/ConfettiBurst";

const spec = sceneBySceneId("s5");
export const S5_FRAMES: number = spec.frames;

const GOLD = palette.gold;
const COUNTERS = [
  {id: "a", value: 90000, x: 1500, label: "دانشجوی تحت پوشش", start: 1.25, lock: 2.2, hit: 2.5, tag: "حدود"},
  {id: "b", value: 115931, x: 960, label: "آزمون برگزشده", start: 2.5, lock: 3.45, hit: 3.75, tag: ""},
  {id: "c", value: 14641, x: 420, label: "کد آزمونی", start: 3.75, lock: 4.7, hit: 5.0, tag: ""},
];
const SIZE = 150;
const Y = 520;

const Medal: React.FC<{p: number; x: number; y: number}> = ({p, x, y}) => {
  const e = E.outBack(2.2)(clamp(p));
  if (p <= 0) return null;
  return (
    <svg width={220} height={260} viewBox="-110 -110 220 260" style={{position: "absolute", left: x - 110, top: y - 110, transform: `scale(${e})`, transformOrigin: "50% 40%", opacity: clamp(p * 5), overflow: "visible", filter: `drop-shadow(0 0 26px ${GOLD}99)`}}>
      <path d="M-34 30 L-58 128 L-8 100 Z" fill="#C8902A" />
      <path d="M34 30 L58 128 L8 100 Z" fill="#C8902A" />
      <circle r={70} fill={GOLD} />
      <circle r={58} fill="none" stroke="#FFF3CC" strokeWidth={4} opacity={0.9} />
      <path d="M0 -34 L10 -10 L36 -8 L16 9 L22 35 L0 21 L-22 35 L-16 9 L-36 -8 L-10 -10 Z" fill="#FFF8E1" />
    </svg>
  );
};

export const S5: React.FC = () => {
  const {t} = useT();
  const focus = seg(t, 7.5, 8.75, E.inOutCubic);               // counters recede, gold takes over
  const exit = seg(t, 14.3, 15.0, E.outQuint);
  const dim = 1 - 0.88 * focus;
  const arcP = seg(t, 0.0, 0.7, E.outQuart);
  const beat = pulse(t, 0.0, 0.22) + pulse(t, 2.5, 0.2) + pulse(t, 3.75, 0.2) + pulse(t, 5.0, 0.2) + pulse(t, 10.0, 0.3);

  // gold block
  const g1 = seg(t, 8.75, 9.5, E.linear);
  const g2 = seg(t, 10.5, 11.0, E.linear);
  const medalP = seg(t, 10.0, 10.7, E.linear);
  const rankIn = seg(t, 10.15, 10.8, E.outCubic);
  const microSilence = 1 - seg(t, 14.85, 15.0);

  return (
    <AbsoluteFill style={{opacity: microSilence}}>
      <NightBase t={t} dur={15} origin={{x: 960, y: 470}} dropAt={0}>
        {/* canopy arcs from S4's exit point */}
        <Thread d="M960 540 C 1240 190 1560 190 1700 260" from={0} to={arcP} width={5} opacity={0.55 * dim * (1 - exit)} pulse={beat} />
        <Thread d="M960 540 C 680 190 360 190 220 260" from={0} to={arcP} width={5} opacity={0.55 * dim * (1 - exit)} pulse={beat} />

        {/* hero word lands ON the drop, then demotes to the scene label (top-right) */}
        <HeroWord
          text="مقیاس سامانه"
          from={{x: 960, y: 640, scale: 1.3}}
          to={{x: 960, y: 470, scale: 1}}
          landFrame={12}
          holdFrames={12}
          demoteDurFrames={15}
          size={108}
          demoteTo={{x: 1620, y: 170, scale: 0.42}}
        />

        <div style={{position: "absolute", inset: 0, opacity: 1 - exit}}>
          {/* three counters — recede when Mashhad takes the stage */}
          <div style={{position: "absolute", inset: 0, opacity: dim, transform: `scale(${1 - 0.18 * focus}) translateY(${-50 * focus}px)`, transformOrigin: "960px 520px", filter: `blur(${focus * 10}px)`}}>
            {COUNTERS.map((c) => {
              const p = clamp((t - c.start) / (c.lock - c.start));
              const settle = t >= c.hit ? t - c.hit : -1;
              const labelP = seg(t, c.start + 0.3, c.start + 1.0, E.outCubic);
              return (
                <React.Fragment key={c.id}>
                  <NodeDot x={c.x} y={Y - 175} p={seg(t, c.start - 0.2, c.start + 0.1)} ringT={settle} r={9} />
                  <CounterRoll value={c.value} p={p} x={c.x} y={Y} size={SIZE} settle={settle} weight={700} />
                  <FaText x={c.x} y={Y + 132} w={640} size={36} text={c.label} weight={500} color={palette.ice} family="body" opacity={labelP * 0.92} dy={(1 - labelP) * 14} />
                  {c.tag && <FaText x={c.x} y={Y - 122} w={300} size={30} text={c.tag} weight={500} color={palette.blueSky} family="body" opacity={labelP * 0.85} />}
                  {settle >= 0 && settle < 0.7 && <Sparkle x={c.x + 130} y={Y - 62} p={settle / 0.7} size={70} />}
                  <ConfettiBurst origin={{x: c.x, y: Y}} t0={Math.round(c.hit * 30)} />
                </React.Fragment>
              );
            })}
          </div>

          {/* progress blade under the numbers (fills with the landings) */}
          <Thread d="M320 800 L1600 800" from={0} to={clamp(Math.max(seg(t, 2.5, 3.0), seg(t, 3.75, 4.25) * 0.66 + 0.33, seg(t, 5.0, 5.5))) * (1 - focus)} width={4} opacity={0.6 * (1 - focus)} pulse={beat} />

          {/* gold riser wash 7.5-8.75 */}
          {focus > 0.01 && focus < 1 && (
            <AbsoluteFill style={{background: `radial-gradient(60% 50% at 50% 45%, ${GOLD}26 0%, transparent 70%)`, opacity: focus}} />
          )}

          {/* ---- Mashhad: gold focus ---- */}
          {focus > 0.01 && (
            <div style={{position: "absolute", inset: 0}}>
              <HalationGlow x={960} y={590} size={1000} color={GOLD} intensity={t < 8.75 ? -1 : Math.min(1, (t - 8.75) / 1.5)} opacity={0.55} />
              <CounterRoll value={65339} p={g1} x={960} y={560} size={190} weight={800} color={GOLD} glow={GOLD} settle={t >= 9.5 ? t - 9.5 : -1} opacity={focus} />
              <BlurSlideWords text="حضور در آزمون — واحد مشهد" t={t} start={9.0} per={0.1} dur={0.5} x={960} y={700} w={1100} size={44} weight={600} family="body" />
              <Medal p={medalP} x={640} y={800} />
              <FaText x={1020} y={800} w={800} size={48} text="رتبهٔ نخست استان" weight={700} color={GOLD} family="headline" opacity={rankIn} dy={(1 - rankIn) * 20} style={{textShadow: `0 0 32px ${GOLD}55`}} />
              <CounterRoll value={7619} p={g2} x={960} y={912} size={100} weight={700} color={palette.ice} glow={GOLD} settle={t >= 11.0 ? t - 11.0 : -1} opacity={focus} />
              <FaText x={1300} y={916} w={400} size={36} text="کد آزمونی" weight={500} color={palette.ice} family="body" opacity={seg(t, 10.9, 11.4, E.outCubic)} />
              {t >= 10.0 && t < 10.8 && <Sparkle x={1290} y={520} p={(t - 10.0) / 0.8} size={100} color={GOLD} />}
            </div>
          )}
        </div>

        {/* exit: everything folds into the gold point; ring pulse out (S6 Mashhad node) */}
        {exit > 0 && (
          <>
            <div style={{position: "absolute", inset: 0, background: `radial-gradient(circle at 1080px 520px, transparent ${exit * 400}px, transparent)`, opacity: 1 - exit}} />
            <NodeDot x={1080} y={520} p={1} r={14 + exit * 8} color={GOLD} opacity={seg(t, 14.5, 14.9)} ringT={(t - 14.6) * 1.1} />
            <div style={{position: "absolute", left: 1080 - 420 * exit, top: 520 - 420 * exit, width: 840 * exit, height: 840 * exit, borderRadius: "50%", border: `3px solid ${GOLD}`, opacity: (1 - exit) * 0.9}} />
          </>
        )}
      </NightBase>
    </AbsoluteFill>
  );
};
