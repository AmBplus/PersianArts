// ============================================================================================================
// S7 «دانا» (v2) — 72.5–85.0 s (local 0–12.5), paper-white, energy 3→1. The finale.
// Nastaliq «دانا» lands on bar 30; sentence types on; second half arrives with HAND-DRAWN marker
// underlines (kit MarkerUnderline) on «زیرساختی یکپارچه» (3.1) and «استان خراسان رضوی» (4.7);
// sentence collapses to the tassel point; logo re-assembles with the JOIN exactly on the FINAL HIT
// (local 7.5 = 80.0 abs); university name + gold rule + dept + slogan; last thread pulse; paper hold.
// ============================================================================================================
import React from "react";
import {AbsoluteFill} from "remotion";
import {sceneBySceneId} from "../timing";
import {
  Background, BlurSlideWords, E, FaText, LogoAssemble, NodeDot, Sparkle, Thread, Wordmark,
  clamp, faStyle, palette, pulse, seg, typeOn, useT,
} from "../kit";
import {Drift} from "../kit/motion/Stage";
import {MarkerUnderline} from "../kit/motion/MarkerUnderline";

const spec = sceneBySceneId("s7");
export const S7_FRAMES: number = spec.frames;
const GOLD = palette.gold;

const MARK = {cx: 959, cy: 316, h: 392};
const WM = {cx: 953, cy: 568, h: 160};
const HEX = "M955 215 L1085 292 L1085 422 L955 500 L851 422 L851 265 Z";

export const S7: React.FC = () => {
  const {t} = useT();
  // sentence
  const l1 = seg(t, 0.0, 0.9, E.outBack(1.3));                   // nastaliq «دانا»
  const rest1 = seg(t, 0.7, 2.7, E.inOutSine);                   // typewriter of half 1
  const l2 = seg(t, 2.5, 3.9, E.outCubic);
  const l3 = seg(t, 3.1, 4.5, E.outCubic);
  const mk1 = seg(t, 3.1, 3.7, E.inOutQuad);                     // marker 1 (75.6 abs)
  const mk2 = seg(t, 4.7, 5.3, E.inOutQuad);                     // marker 2 (77.2 abs)
  const collapse = seg(t, 6.3, 7.0, E.inCubic);
  const sentenceOpacity = 1 - seg(t, 6.7, 7.05, E.outCubic);
  // logo — the JOIN (assemble p = 1) lands exactly on 7.5 local = 80.0 abs (FINAL HIT)
  const assemble = seg(t, 7.0, 7.5, E.linear);
  const wordP = seg(t, 7.55, 8.6, E.inOutSine);
  const joinFlash = pulse(t, 7.5, 0.35);
  const lineP = seg(t, 8.7, 9.3, E.outExpo);
  const glint = seg(t, 8.95, 9.7, E.linear);
  const deptP = seg(t, 9.7, 10.5, E.outCubic);
  const tagP = seg(t, 10.3, 11.1, E.outCubic);
  const pulseHex = seg(t, 11.3, 12.0, E.inOutCubic);
  const fadeThread = 1 - seg(t, 11.9, 12.4);
  const beat = pulse(t, 7.5, 0.35) + pulse(t, 0.0, 0.3) * 0.5;

  const typed = typeOn("فقط یک سامانهٔ برگزاری آزمون نیست؛", rest1);

  return (
    <AbsoluteFill>
      <Background theme="paper" t={t} />
      <Drift t={t} dur={12.5} amt={0.012} oy={-6}>
        {/* entry: the tassel thread from S6 falls in and seeds the first word */}
        <Thread d="M960 200 L960 430" from={0} to={1} width={5} opacity={1 - seg(t, 0.15, 0.55)} head={false} />
        <NodeDot x={960} y={430} p={1} r={9} color={palette.blueMid} opacity={(1 - seg(t, 0.35, 0.75)) * (t < 0.8 ? 1 : 0)} />

        {/* the closing sentence */}
        <div style={{position: "absolute", inset: 0, opacity: sentenceOpacity, transformOrigin: "960px 316px", transform: `scale(${1 - 0.9 * collapse})`, filter: `blur(${collapse * 8}px)`}}>
          <div style={{position: "absolute", left: 160, top: 430, width: 1600, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "baseline", gap: 26, direction: "rtl", ...faStyle(64, {fontWeight: 700, color: palette.ink})}}>
            <span style={{display: "inline-block", fontFamily: '"Noto Nastaliq Urdu", "Estedad", serif', fontSize: 150, lineHeight: 2.2, color: palette.blueDeep, fontWeight: 500, opacity: clamp(l1 * 2), transform: `scale(${0.7 + 0.3 * l1})`, filter: `blur(${(1 - clamp(l1)) * 8}px)`}}>دانا</span>
            <span style={{display: "inline-block", opacity: clamp(rest1 * 3), whiteSpace: "nowrap"}}>{typed}</span>
          </div>
          <div style={{position: "absolute", left: 160, top: 640, width: 1600, textAlign: "center", opacity: l2, transform: `translateY(${(1 - l2) * 26}px)`, filter: `blur(${(1 - l2) * 8}px)`, ...faStyle(60, {fontWeight: 600, color: palette.blueDeep, family: "headline"})}}>
            بلکه{" "}
            <span style={{position: "relative", display: "inline-block"}}>
              زیرساختی یکپارچه
              <MarkerUnderline progress={mk1} color="blueMid" width={470} />
            </span>{" "}
            برای آموزش و ارزیابی
          </div>
          <div style={{position: "absolute", left: 160, top: 760, width: 1600, textAlign: "center", opacity: l3, transform: `translateY(${(1 - l3) * 26}px)`, filter: `blur(${(1 - l3) * 8}px)`, ...faStyle(60, {fontWeight: 600, color: palette.blueDeep, family: "headline"})}}>
            در{" "}
            <span style={{position: "relative", display: "inline-block"}}>
              استان خراسان رضوی
              <MarkerUnderline progress={mk2} color="blueMid" width={480} />
            </span>
          </div>
        </div>
        {collapse > 0 && collapse < 1 && <Thread d="M960 640 L960 316" from={0} to={collapse} width={6} head />}

        {/* logo: assembles so the JOIN lands exactly on the FINAL HIT (7.5 local = 80.0 abs) */}
        <LogoAssemble cx={MARK.cx} cy={MARK.cy} height={MARK.h} p={assemble} kind="mark" variant="color" />
        <Wordmark cx={WM.cx} cy={WM.cy} height={WM.h} p={wordP} variant="color" />
        {joinFlash > 0.01 && <Sparkle x={1060} y={300} p={joinFlash} size={110} />}

        {/* university name — SPECIAL emphasis, as in the opening */}
        <BlurSlideWords text="دانشگاه آزاد اسلامی واحد مشهد" t={t} start={7.7} per={0.13} dur={0.7} x={960} y={725} w={1500} size={62} weight={700} color={palette.ink} family="org" slide={34} />
        <div style={{position: "absolute", left: 960 - 310, top: 770, width: 620, height: 4, borderRadius: 4, background: GOLD, boxShadow: `0 0 20px ${GOLD}`, transformOrigin: "50% 50%", transform: `scaleX(${lineP})`, opacity: lineP > 0 ? 1 : 0}} />
        <Sparkle x={960 - 356} y={772} p={glint} size={74} color={GOLD} />
        <FaText x={960} y={834} w={1400} size={36} text="اداره کل فناوری ارتباطات و اطلاعات" weight={500} color={palette.blueDeep} family="org" opacity={deptP} dy={(1 - deptP) * 16} />
        <FaText x={960} y={944} w={1400} size={34} text="زیرساخت یکپارچه آموزش و ارزیابی مجازی" weight={500} color={palette.ink} family="body" opacity={0.85 * tagP} dy={(1 - tagP) * 14} />

        {/* last pulse of the thread around the hexagon, then it dissolves */}
        <Thread d={HEX} from={0} to={pulseHex} width={4} opacity={fadeThread * 0.9} pulse={beat} glow={1} />
      </Drift>
    </AbsoluteFill>
  );
};
