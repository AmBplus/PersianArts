import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {sceneBySceneId} from "../timing";
import {E, Sparkle, Thread, clamp, faStyle, lerp, palette, pulse, seg, useT} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord} from "../kit/motion/HeroWord";
import {SegmentedThree} from "../kit/motion/SegmentedThree";

// ============================================================================================================
// S3 v2 — «سنجش منعطف» (27.5–37.5 s absolute, night, 300 frames). Script: script/v2/dana-script-v2.md §S3.
// Hero word «سنجش منعطف» lands/demotes to the top-right label slot (1620,170).
// Segmented control (SegmentedThree, enters at 2.0 s inside its own <Sequence> so its spring self-clocks):
// تستی → تشریحی (2.5) → ترکیبی (3.75), thumb crossings are the primitive's built-in 8-frame OUT_EXPO.
// Preview card 760x420 at (960,650): three ink variants crossfading (0.2 s + 12 px y shift) on thumb change.
// 5.5–6.3 recede (scale .7, opacity .35, blur 6) while the score card 1080x560 at (960,500) comes forward.
// Switch 96x48 at (700,480): ON 6.5–7.5 («۱۷٫۲۵ از ۲۰» + three muted «−۰٫۳۳» strike pills), AHA at 7.5:
// knob slides OFF (8 f OUT_BACK) + light ring to 300 px, strike marks fade, decimal odometer rolls
// ۱۷٫۲۵ → ۱۸٫۰۰ (7.5–8.1, wheels geared from the eased value 17.25 + 0.75·OUT_EXPO so digits land exactly),
// settle pop + Sparkle at 8.1, chip swaps to «بدون نمرهٔ منفی». Footnote 8.6.
// Exit 9.5–10.0: the knob leaps up and stretches into S4's first bento bar (x=1320, y 900→240, 90 px wide,
// OUT_EXPO), score card fades, baseline thread M1600,760 L320,760 (from S2) fades out last.
// Rules kept: no letterSpacing, Persian digits + «٫» only, all text ≥30 px, Estedad only, no gold, no red.
// ============================================================================================================
const spec = sceneBySceneId("s3");
export const S3_FRAMES: number = spec.frames;

const DUR = 10;                                     // scene length, seconds (300 frames)
const BASE_Y = 760;

const CTRL = {x: 960, y: 380, w: 900, h: 96};       // segmented control
const PREVIEW = {cx: 960, cy: 650, w: 760, h: 420}; // preview card
const CARD = {cx: 960, cy: 500, w: 1080, h: 560};   // score card
const CARD_L = CARD.cx - CARD.w / 2;                // 420 — card-local origin helper (children use page−420/−220)
const CARD_T = CARD.cy - CARD.h / 2;                // 220
const SWITCH = {cx: 700, cy: 480, w: 96, h: 48, knob: 40};

const CROSS = 8 / 30;                               // 8-frame thumb crossing, seconds
const MUTED = "#8FA3C8";                            // muted strike colour (red is banned)
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const OPTIONS_FA = ["الف", "ب", "ج", "د"];
const WRONG = ["الف", "ب", "د"];                    // ج was the marked (correct) option in the تستی preview

const INK: React.CSSProperties = {
  background: "rgba(10,31,74,0.82)",
  border: "1px solid rgba(111,167,255,0.28)",
  borderRadius: 20,
};
const NUM_GLOW = "0 0 44px rgba(106,184,255,0.5)";

// ---- decimal odometer wheel: fixed-width tabular cell, 0..9 strip rolled to continuous position `pos` ----
const Wheel: React.FC<{pos: number}> = ({pos}) => {
  const p = ((pos % 10) + 10) % 10;
  return (
    <div style={{width: 116, height: 220, overflow: "hidden", flex: "0 0 auto"}}>
      <div style={{transform: `translateY(${-p * 220}px)`}}>
        {Array.from({length: 12}, (_, i) => (
          <div
            key={i}
            style={{
              height: 220, textAlign: "center",
              ...faStyle(200, {family: "numerals", fontWeight: 700, color: palette.ice}),
              lineHeight: "220px", fontVariantNumeric: "tabular-nums", textShadow: NUM_GLOW,
            }}
          >
            {FA_DIGITS[i % 10]}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Static digit/separator cell (tens «۱» and the «٫» separator never move). */
const NumCell: React.FC<{ch: string; w: number}> = ({ch, w}) => (
  <div
    style={{
      width: w, height: 220, textAlign: "center", flex: "0 0 auto",
      ...faStyle(200, {family: "numerals", fontWeight: 700, color: palette.ice}),
      lineHeight: "220px", fontVariantNumeric: "tabular-nums", textShadow: NUM_GLOW,
    }}
  >
    {ch}
  </div>
);

// ---- preview variant 1: تستی — four option pills, «ج» marked with a check (#6AB8FF) ----
const PreviewMcq: React.FC<{t: number; t0: number}> = ({t, t0}) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const p = seg(t, t0 + i * 0.05, t0 + i * 0.05 + 0.22, E.outCubic);
      const marked = i === 2;
      const tick = seg(t, t0 + 0.18, t0 + 0.38, E.outBack(1.6));
      return (
        <div key={i} style={{position: "absolute", left: 44, right: 44, top: 78 + i * 86, height: 62, display: "flex", alignItems: "center", gap: 18, opacity: p, transform: `translateX(${(1 - p) * 18}px)`}}>
          <div style={{flex: "0 0 auto", width: 52, height: 52, borderRadius: "50%", border: `2px solid ${marked ? palette.blueSky : "rgba(111,167,255,0.35)"}`, background: marked ? "rgba(47,123,255,0.30)" : "rgba(4,10,34,0.45)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            {marked && tick > 0.02 ? (
              <svg width={30} height={30} viewBox="0 0 30 30" style={{transform: `scale(${tick})`}}>
                <path d="M7 16 L13 22 L24 9" fill="none" stroke="#6AB8FF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span style={{...faStyle(32, {fontWeight: 700, color: marked ? palette.ice : "rgba(234,242,255,0.75)"}), lineHeight: 1}}>{OPTIONS_FA[i]}</span>
            )}
          </div>
          <div style={{flex: 1, height: 14, borderRadius: 7, background: marked ? "rgba(106,184,255,0.4)" : "rgba(234,242,255,0.22)"}} />
        </div>
      );
    })}
  </>
);

// ---- preview variant 2: تشریحی — five ruled lines, the middle one being typed (dark bar + caret) ----
const PreviewEssay: React.FC<{t: number; t0: number; frame: number}> = ({t, t0, frame}) => {
  const typed = seg(t, t0 + 0.12, t0 + 1.0, E.outCubic);
  const caretOn = frame % 30 < 15 ? 1 : 0.15;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const p = seg(t, t0 + i * 0.07, t0 + i * 0.07 + 0.25, E.outCubic);
        const y = 84 + i * 72;
        if (i === 2) {
          const w = 420 * typed;
          return (
            <div key={i} style={{position: "absolute", left: 44, top: y - 7, width: w, height: 14, borderRadius: 7, background: "rgba(4,10,34,0.92)", border: "1px solid rgba(111,167,255,0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.35)", opacity: p, overflow: "visible"}}>
              <div style={{position: "absolute", left: Math.min(388, w - 6), top: -10, width: 3, height: 34, background: palette.blueSky, boxShadow: `0 0 10px ${palette.blueSky}`, opacity: caretOn}} />
            </div>
          );
        }
        return <div key={i} style={{position: "absolute", left: 44, top: y, width: 584 * p, height: 2, background: "rgba(234,242,255,0.16)"}} />;
      })}
    </>
  );
};

// ---- preview variant 3: ترکیبی — left half option pills (2), right half ruled lines (2) ----
const PreviewMixed: React.FC<{t: number; t0: number}> = ({t, t0}) => (
  <>
    <div style={{position: "absolute", left: 379, top: 60, width: 1, height: 300, background: "rgba(111,167,255,0.18)", opacity: seg(t, t0, t0 + 0.3)}} />
    {[0, 1].map((i) => {
      const p = seg(t, t0 + 0.08 + i * 0.09, t0 + 0.08 + i * 0.09 + 0.25, E.outCubic);
      return (
        <div key={`p${i}`} style={{position: "absolute", left: 40, width: 300, top: 110 + i * 130, height: 58, display: "flex", alignItems: "center", gap: 14, opacity: p, transform: `translateX(${(1 - p) * -18}px)`}}>
          <div style={{flex: "0 0 auto", width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(111,167,255,0.35)", background: "rgba(4,10,34,0.45)", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{...faStyle(32, {fontWeight: 700, color: "rgba(234,242,255,0.75)"}), lineHeight: 1}}>{OPTIONS_FA[i]}</span>
          </div>
          <div style={{flex: 1, height: 12, borderRadius: 6, background: "rgba(234,242,255,0.22)"}} />
        </div>
      );
    })}
    {[0, 1].map((i) => {
      const p = seg(t, t0 + 0.16 + i * 0.09, t0 + 0.16 + i * 0.09 + 0.25, E.outCubic);
      return <div key={`l${i}`} style={{position: "absolute", left: 420, top: 130 + i * 120, width: 300 * p, height: 2, background: "rgba(234,242,255,0.16)"}} />;
    })}
  </>
);

export const S3: React.FC = () => {
  const {t, frame} = useT();

  // ---- hero word + scene label (self-clocking; starts at frame 0) ----
  const heroOut = 1 - seg(t, 9.6, 9.95);

  // ---- segmented control: enters 2.0 s in its own Sequence; crossings at 2.5 / 3.75 (linear 8-frame ramps) ----
  const activeIndex = clamp((t - 2.5) / CROSS) + clamp((t - 3.75) / CROSS);

  // ---- preview card + variants (crossfade 0.2 s + 12 px y shift on each thumb change) ----
  const prevIn = seg(t, 2.2, 2.6, E.outExpo);
  const v0 = {op: seg(t, 2.3, 2.5) * (1 - seg(t, 2.5, 2.7)), dy: (1 - seg(t, 2.3, 2.5)) * 12 - seg(t, 2.5, 2.7) * 12};
  const v1 = {op: seg(t, 2.5, 2.7) * (1 - seg(t, 3.75, 3.95)), dy: (1 - seg(t, 2.5, 2.7)) * 12 - seg(t, 3.75, 3.95) * 12};
  const v2 = {op: seg(t, 3.75, 3.95), dy: (1 - seg(t, 3.75, 3.95)) * 12};

  // ---- 5.5–6.3 transition: control + preview recede, score card comes forward ----
  const recede = seg(t, 5.5, 6.3, E.inOutCubic);
  const recedeOut = 1 - seg(t, 9.5, 9.85);
  const cardIn = seg(t, 5.5, 6.3, E.outExpo);
  const cardOp = cardIn * (1 - seg(t, 9.55, 9.95));
  const titleIn = seg(t, 5.8, 6.2, E.outCubic);

  // ---- switch (ON 6.5–7.5, knob flips OFF at the 7.5 aha; 8 frames OUT_BACK) ----
  const swIn = E.outBack(1.5)(clamp(seg(t, 6.5, 6.9)));
  const swOp = seg(t, 6.5, 6.7);
  const knobOff = E.outBack(1.6)(clamp(seg(t, 7.5, 7.5 + CROSS)));
  const trackOff = seg(t, 7.5, 7.77, E.outCubic);
  const knobCx = lerp(304, 256, knobOff);            // card-local x: ON 304 (right) → OFF 256 (left)

  // ---- strike pills under the number; marks fade at the aha ----
  const marksOp = 1 - seg(t, 7.5, 7.85);
  const pillDim = 1 - 0.6 * seg(t, 7.5, 8.1);

  // ---- score roll ۱۷٫۲۵ → ۱۸٫۰۰ over 0.6 s: value 17.25 + 0.75·OUT_EXPO(seg(t,7.5,8.1)) geared into
  //      wheel positions (ones +1, tenths +8 ≡ 2→0, hundredths +5 ≡ 5→0) so digits land exactly, wheels
  //      roll right-to-left staggered (hundredths first). ----
  const rHund = E.outExpo(seg(t, 7.5, 8.1));
  const rTenths = E.outExpo(seg(t, 7.54, 8.1));
  const rOnes = E.outExpo(seg(t, 7.58, 8.1));
  const numIn = E.outBack(1.2)(clamp(seg(t, 6.35, 6.75)));
  const numOp = seg(t, 6.35, 6.6);
  const settle = t >= 8.1 ? 1 + 0.05 * Math.exp(-(t - 8.1) * 6) * Math.cos((t - 8.1) * 20) : 1;

  // ---- chips under the switch (crossfade at the aha) + footnote ----
  const chipA = seg(t, 6.6, 6.9) * (1 - seg(t, 7.55, 7.85));
  const chipB = seg(t, 7.65, 7.95);
  const footIn = seg(t, 8.6, 8.9);

  // ---- light rings from the switch on each state change ----
  const ringOn = seg(t, 6.5, 6.85);                  // small click-on ring
  const ringAha = seg(t, 7.5, 8.0);                  // aha ring → 300 px

  // ---- exit: knob leaps up and stretches into S4's first bento bar (x=1320, y 900→240) ----
  const leap = E.outExpo(seg(t, 9.5, 9.85));
  const grow = E.outExpo(seg(t, 9.68, 10.0));
  const bw = lerp(40, 90, leap);
  const bh = lerp(40, 660, grow);
  const bcx = lerp(676, 1320, leap);                 // knob rests at OFF centre (676,480) at 9.5
  const bcy = lerp(480, 900 - bh / 2, leap);

  // baseline thread (from S2): breathing + beat boosts at 2.5 / 3.75 / 7.5; fades out last
  const threadPulse = 0.25 + 0.2 * Math.sin(t * 2.4) + 0.55 * (pulse(t, 2.5, 0.2) + pulse(t, 3.75, 0.2) + pulse(t, 7.5, 0.25));

  return (
    <AbsoluteFill>
      <NightBase t={t} dur={DUR} origin={{x: 960, y: 540}} dropAt={7.5}>
        {/* baseline thread from S2 */}
        <Thread d={`M1600 ${BASE_Y} L320 ${BASE_Y}`} from={0} to={1} pulse={threadPulse} opacity={1 - seg(t, 9.7, 10.0)} />

        {/* hero word «سنجش منعطف» → demoted scene label (1620,170) */}
        <div style={{position: "absolute", inset: 0, opacity: heroOut}}>
          <HeroWord
            text="سنجش منعطف"
            size={108}
            from={{x: 960, y: 640, scale: 1.25}}
            to={{x: 960, y: 470, scale: 1}}
            landFrame={12}
            holdFrames={12}
            demoteDurFrames={15}
            demoteTo={{x: 1620, y: 170, scale: 0.42}}
          />
        </div>

        {/* receding layer: segmented control + preview card */}
        <div
          style={{
            position: "absolute", inset: 0, transformOrigin: "960px 540px",
            transform: `scale(${1 - 0.3 * recede})`,
            opacity: (1 - 0.65 * recede) * recedeOut,
            filter: recede > 0.02 ? `blur(${6 * recede}px)` : undefined,
          }}
        >
          <Sequence from={60}>
            <SegmentedThree options={["تستی", "تشریحی", "ترکیبی"]} activeIndex={activeIndex} x={CTRL.x} y={CTRL.y} w={CTRL.w} h={CTRL.h} />
          </Sequence>

          {/* preview card (ink card) with the three crossfading variants */}
          <div style={{position: "absolute", left: PREVIEW.cx - PREVIEW.w / 2, top: PREVIEW.cy - PREVIEW.h / 2, width: PREVIEW.w, height: PREVIEW.h, ...INK, boxShadow: "0 30px 80px rgba(0,0,0,0.35)", opacity: prevIn, transform: `translateY(${(1 - prevIn) * 24}px) scale(${0.97 + 0.03 * prevIn})`}}>
            <div style={{position: "absolute", inset: 0, opacity: v0.op, transform: `translateY(${v0.dy}px)`}}><PreviewMcq t={t} t0={2.25} /></div>
            <div style={{position: "absolute", inset: 0, opacity: v1.op, transform: `translateY(${v1.dy}px)`}}><PreviewEssay t={t} t0={2.5} frame={frame} /></div>
            <div style={{position: "absolute", inset: 0, opacity: v2.op, transform: `translateY(${v2.dy}px)`}}><PreviewMixed t={t} t0={3.75} /></div>
          </div>
        </div>

        {/* score card «دقت در ارزیابی» */}
        <div
          style={{
            position: "absolute", left: CARD_L, top: CARD_T, width: CARD.w, height: CARD.h, ...INK,
            boxShadow: "0 40px 120px rgba(0,0,0,0.5)",
            opacity: cardOp,
            transform: `translateY(${(1 - cardIn) * 46}px) scale(${0.92 + 0.08 * cardIn})`,
          }}
        >
          {/* small title, 40 px ice */}
          <div style={{position: "absolute", left: 340, top: 36, width: 400, textAlign: "center", opacity: titleIn, transform: `translateY(${(1 - titleIn) * 10}px)`, ...faStyle(40, {fontWeight: 700, color: palette.ice})}}>
            دقت در ارزیابی
          </div>

          {/* the big score ۱۷٫۲۵ → ۱۸٫۰۰ (decimal odometer, LTR digit row) */}
          <div style={{position: "absolute", left: 460, top: 110, width: 524, height: 220, direction: "ltr", display: "flex", opacity: numOp, transform: `scale(${numIn * settle})`, transformOrigin: "50% 50%"}}>
            <NumCell ch="۱" w={116} />
            <Wheel pos={7 + rOnes} />
            <NumCell ch="٫" w={60} />
            <Wheel pos={2 + 8 * rTenths} />
            <Wheel pos={5 + 5 * rHund} />
          </div>
          <div style={{position: "absolute", left: 300, top: 210, width: 180, height: 60, textAlign: "center", opacity: numOp, ...faStyle(48, {fontWeight: 600, color: "rgba(234,242,255,0.85)"})}}>
            از ۲۰
          </div>

          {/* three wrong-option pills with muted strike marks «−۰٫۳۳» */}
          {WRONG.map((letter, i) => {
            const p = seg(t, 6.55 + i * 0.12, 6.85 + i * 0.12, E.outCubic);
            const cx = 560 + i * 190;
            return (
              <div key={letter} style={{position: "absolute", left: cx - 95, top: 378, width: 190, height: 64, borderRadius: 999, background: "rgba(4,10,34,0.5)", border: "1px solid rgba(111,167,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: p * pillDim, transform: `translateY(${(1 - p) * 12}px)`}}>
                <div style={{position: "relative", width: 48, height: 48, borderRadius: "50%", border: "1.5px solid rgba(143,163,200,0.5)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <span style={{...faStyle(32, {fontWeight: 700, color: MUTED}), lineHeight: 1}}>{letter}</span>
                  {/* short diagonal strike, 24 px */}
                  <div style={{position: "absolute", left: 12, top: 22, width: 24, height: 3, borderRadius: 2, background: MUTED, transform: "rotate(-52deg)", opacity: marksOp}} />
                </div>
                <span style={{...faStyle(32, {fontWeight: 600, color: MUTED}), lineHeight: 1, opacity: marksOp}}>−۰٫۳۳</span>
              </div>
            );
          })}

          {/* negative-marking switch, 96×48, knob 40 */}
          <div style={{position: "absolute", left: 232, top: 236, width: 96, height: 48, opacity: swOp, transform: `scale(${swIn})`, transformOrigin: "50% 50%"}}>
            <div style={{position: "absolute", inset: 0, borderRadius: 24, background: "rgba(4,10,34,0.5)", border: "1px solid rgba(111,167,255,0.35)", overflow: "hidden"}}>
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(90deg, ${palette.blueDeep}, ${palette.blueMid})`, opacity: 1 - trackOff}} />
              <div style={{position: "absolute", top: 3, left: knobCx - 20, width: 40, height: 40, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,0,0,0.35)", opacity: t < 9.5 ? 1 : 0}} />
            </div>
          </div>

          {/* chip under the switch: «با نمرهٔ منفی» → «بدون نمرهٔ منفی» */}
          <div style={{position: "absolute", left: 130, top: 312, width: 300, height: 56}}>
            <div style={{position: "absolute", inset: 0, borderRadius: 999, background: "rgba(47,123,255,0.16)", border: "1px solid rgba(111,167,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", opacity: chipA, ...faStyle(32, {fontWeight: 600, color: palette.ice})}}>
              با نمرهٔ منفی
            </div>
            <div style={{position: "absolute", inset: 0, borderRadius: 999, background: "rgba(47,123,255,0.16)", border: "1px solid rgba(111,167,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", opacity: chipB, ...faStyle(32, {fontWeight: 600, color: palette.ice})}}>
              بدون نمرهٔ منفی
            </div>
          </div>

          {/* footnote, 30 px @75% */}
          <div style={{position: "absolute", left: 340, top: 505, width: 400, textAlign: "center", opacity: 0.75 * footIn, ...faStyle(30, {fontWeight: 500, color: palette.ice})}}>
            نمونهٔ نمایشی
          </div>
        </div>

        {/* light ring on the click at 6.5 */}
        {ringOn > 0 && ringOn < 1 && (
          <div style={{position: "absolute", left: SWITCH.cx - (20 + 140 * ringOn) / 2, top: SWITCH.cy - (20 + 140 * ringOn) / 2, width: 20 + 140 * ringOn, height: 20 + 140 * ringOn, borderRadius: "50%", border: `1.5px solid ${palette.blueSky}`, opacity: 0.5 * (1 - ringOn), pointerEvents: "none"}} />
        )}
        {/* aha ring at 7.5: 1 px #6AB8FF circle scaling to 300 px over 0.5 s */}
        {ringAha > 0 && ringAha < 1 && (
          <div style={{position: "absolute", left: SWITCH.cx - (1 + 299 * ringAha) / 2, top: SWITCH.cy - (1 + 299 * ringAha) / 2, width: 1 + 299 * ringAha, height: 1 + 299 * ringAha, borderRadius: "50%", border: `1px solid #6AB8FF`, opacity: 0.9 * (1 - ringAha), pointerEvents: "none"}} />
        )}

        {/* settle sparkle at 8.1 */}
        <Sparkle x={1300} y={330} p={seg(t, 8.1, 8.75)} size={100} color="#FFFFFF" />

        {/* exit: the knob leaps up out of the card and becomes S4's first bento bar */}
        {t >= 9.5 && (
          <div
            style={{
              position: "absolute", left: bcx - bw / 2, top: bcy - bh / 2, width: bw, height: bh,
              borderRadius: lerp(20, 45, leap),
              background: `linear-gradient(180deg, ${palette.blueSky}, ${palette.blueMid})`,
              border: "1px solid rgba(111,167,255,0.5)",
              boxShadow: `0 0 ${28 + 44 * grow}px rgba(47,123,255,0.55)`,
            }}
          />
        )}
      </NightBase>
    </AbsoluteFill>
  );
};
