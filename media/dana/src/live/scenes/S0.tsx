// ============================================================================================================
// S0 «سپیدآغاز» (v2) — 0.0–7.5 s, paper-white → night.   Script: work/dana/script/v2/dana-script-v2.md
// Thread falls to the tassel, draws the hexagon, the mark assembles, the wordmark is pen-written,
// then a light band SWEEPS across it (gradient-sweep motif, 4.6). University name + gold rule + dept
// + slogan (v2 type scale). Exit: logo shrinks to the watermark slot, iris to night, thread to axis.
// ============================================================================================================
import React from "react";
import {AbsoluteFill, staticFile} from "remotion";
import {sceneBySceneId} from "../timing";
import {
  BlurSlideWords, E, FaText, IrisBackground, Logo, LogoAssemble, NodeDot, Sparkle, Thread, Wordmark,
  logoBox, palette, pulse, seg, tasselPoint, useT,
} from "../kit";
import {Drift} from "../kit/motion/Stage";

const spec = sceneBySceneId("s0");
export const S0_FRAMES: number = spec.frames;

const LOGO_CX = 960, LOGO_H = 520, LOGO_CY = 380;
const MARK = {cx: 959, cy: 316, h: 392};
const TASSEL = tasselPoint(LOGO_CX, LOGO_CY, LOGO_H);
const HEX = "M955 215 L1085 292 L1085 422 L955 500 L851 422 L851 265 Z";
const FALL = `M960 -40 C 960 140 ${TASSEL.x + 70} 300 ${TASSEL.x} ${TASSEL.y}`;
const WM = {cx: 953, cy: 568, h: 160};
const WMBOX = logoBox(WM.cx, WM.cy, WM.h, "wordmark");
const WATERMARK = {x: 1809, y: 91, h: 90};
const EXIT_PATH = `M1775 100 C 1775 260 1710 540 1620 540`;

export const S0: React.FC = () => {
  const {t} = useT();
  // timeline (seconds) — v2 cue sheet
  const fall = seg(t, 0.0, 0.9, E.outQuart);
  const hexDraw = seg(t, 0.85, 1.7, E.inOutCubic);
  const hexFade = 1 - seg(t, 1.7, 2.1, E.outCubic);
  const assemble = seg(t, 0.95, 2.1, E.linear);
  const wordP = seg(t, 2.4, 4.6, E.inOutSine);
  const sweep = seg(t, 4.6, 5.0, E.inOutCubic);            // light band over the wordmark
  const lineP = seg(t, 6.0, 6.6, E.outExpo);
  const glint = seg(t, 6.25, 6.9, E.linear);
  const deptP = seg(t, 6.3, 7.0, E.outCubic);
  const tagP = seg(t, 6.6, 7.2, E.outCubic);
  // exit (7.0–7.5)
  const ex = seg(t, 7.0, 7.5, E.inOutCubic);
  const textOut = 1 - seg(t, 7.0, 7.25, E.outCubic);
  const toWhite = seg(t, 7.2, 7.5, E.linear);
  const sc = 1 + (WATERMARK.h / MARK.h - 1) * ex;
  const dx = (WATERMARK.x - MARK.cx) * ex, dy = (WATERMARK.y - MARK.cy) * ex;
  const exitThread = seg(t, 7.1, 7.5, E.outQuart);
  const beat = pulse(t, 1.2, 0.2) + pulse(t, 2.6, 0.25) * 0.5 + pulse(t, 5.0, 0.25) * 0.6;
  // sweep window (right edge travels across, 34% band)
  const rEdge = 140 - sweep * 176;
  const lEdge = Math.max(-20, rEdge - 34);
  const sweepClip = `inset(-8% ${Math.max(0, 100 - rEdge)}% -8% ${Math.max(0, lEdge)}%)`;

  return (
    <AbsoluteFill>
      <IrisBackground from="paper" to="night" p={ex} cx={WATERMARK.x} cy={WATERMARK.y} t={t} />

      <Drift t={t} dur={7.5} amt={0.015} oy={-8}>
        {/* falling thread → tassel, then the hexagon outline */}
        <Thread d={FALL} from={0} to={fall} head={fall < 0.999} glow={1} opacity={1 - seg(t, 0.9, 1.3)} pulse={beat} />
        <Thread d={HEX} from={0} to={hexDraw} width={4} opacity={hexFade} glow={0.8} head={hexDraw > 0.01 && hexDraw < 0.99} />
        <NodeDot x={TASSEL.x} y={TASSEL.y} p={seg(t, 0.8, 1.1)} ringT={t - 0.85} opacity={1 - seg(t, 1.6, 2.0)} />

        {/* logo group (shrinks to the watermark slot at the end) */}
        <div style={{position: "absolute", inset: 0, transformOrigin: `${MARK.cx}px ${MARK.cy}px`, transform: `translate(${dx}px, ${dy}px) scale(${sc})`}}>
          <div style={{opacity: 1 - toWhite}}>
            <LogoAssemble cx={MARK.cx} cy={MARK.cy} height={MARK.h} p={assemble} kind="mark" variant="color" />
          </div>
          {toWhite > 0 && <Logo cx={MARK.cx} cy={MARK.cy} height={MARK.h} kind="mark" variant="white" opacity={toWhite} />}
        </div>

        {/* wordmark + texts (fade out before the shrink completes) */}
        <div style={{position: "absolute", inset: 0, opacity: textOut}}>
          <Wordmark cx={WM.cx} cy={WM.cy} height={WM.h} p={wordP} variant="color" />
          {sweep > 0.001 && sweep < 0.999 && (
            <img
              src={staticFile("logo/logo-wordmark.png")}
              style={{position: "absolute", ...WMBOX, clipPath: sweepClip, WebkitClipPath: sweepClip, filter: "brightness(1.8) saturate(1.4) drop-shadow(0 0 20px rgba(106,184,255,0.85))"}}
            />
          )}

          {/* university name — special emphasis (v2: 62px, word cascade from 5.0) */}
          <BlurSlideWords text="دانشگاه آزاد اسلامی واحد مشهد" t={t} start={5.0} per={0.12} dur={0.6} x={960} y={726} w={1500} size={62} weight={700} color={palette.ink} family="org" slide={34} />
          <div style={{position: "absolute", left: 960 - 310, top: 770, width: 620, height: 4, borderRadius: 4, background: palette.gold, boxShadow: `0 0 18px ${palette.gold}`, transformOrigin: "50% 50%", transform: `scaleX(${lineP})`, opacity: lineP > 0 ? 1 : 0}} />
          <Sparkle x={960 - 356} y={772} p={glint} size={72} color={palette.gold} />
          <FaText x={960} y={834} w={1400} size={36} text="اداره کل فناوری ارتباطات و اطلاعات" weight={500} color={palette.blueDeep} family="org" opacity={deptP} dy={(1 - deptP) * 16} />
          <FaText x={960} y={944} w={1400} size={34} text="زیرساخت یکپارچه آموزش و ارزیابی مجازی" weight={500} color={palette.ink} family="body" opacity={0.85 * tagP} dy={(1 - tagP) * 14} />
        </div>

        {/* exit thread: tassel (now at the watermark) → timeline axis start for S1 */}
        {exitThread > 0 && <Thread d={EXIT_PATH} from={0} to={exitThread} head={exitThread < 0.99} />}
      </Drift>
    </AbsoluteFill>
  );
};
