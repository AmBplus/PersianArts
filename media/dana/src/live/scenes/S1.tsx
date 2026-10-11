import React from "react";
import {sceneBySceneId} from "../timing";
import {
  BlurSlideWords, E, FaText, Logo, NodeDot, Sparkle, Thread, clamp, faStyle, palette, pulse, seg, useT,
} from "../kit";
import {NightBase} from "../kit/motion/Stage";
import {HeroWord, SplitFlapWord} from "../kit/motion";

// ============================================================================================================
// S1 — ریشه‌ها «تختهٔ برچسب‌چرخان» (7.5–17.5 s in film time; local 0–10 s, night)  Script: work/dana/script/v2/dana-script-v2.md
// The hero year ۱۳۹۸ lands on the downbeat and demotes INTO the first cell of an airport split-flap
// board (1260x240 @ (960,340)); each flap is a beat: 2.5 «توسعه»+card 1, 5.0 «۱۴۰۴»+card 2, 6.5 card 3
// + white mark pops beside it. The Blue Thread axis (1620,540→300,540) doubles as the milestone
// timeline: ticks at x 1560/960/500 when each card lands. Producer line 7.9.
// Exit 9.5–10.0: cards compress to dots on their axis tick; the board stretches into S2's class-window
// outline (1080x640 centred (960,560), stroke only) that holds ~0.2 s into S2.
// ============================================================================================================
const spec = sceneBySceneId("s1");
export const S1_FRAMES: number = spec.frames;

const AXIS = "M1620 540 L300 540";
// split-flap board card + the flap row it carries (joined-group cells, per the SplitFlapWord primitive)
const BOARD = {x: 960, y: 340, w: 1260, h: 240};
const FLAP = {w: 1212, h: 176, cellW: 176};
// the hero year demotes to the board's first (right-most, rtl) cell ≈ (1560,340)
const HERO_DEMOTE_TO = {x: 1560, y: 340, scale: 0.32};
// milestone cards: 760x130 ink cards; each lands on its own axis tick
const CARD_W = 760, CARD_H = 130;
const CARDS = [
  {y: 520, at: 2.5, tickX: 1560},
  {y: 690, at: 5.0, tickX: 960},
  {y: 860, at: 6.5, tickX: 500},
];
// S2's class window (1080x640 centred (960,560)) — the exit outline the board morphs into
const WIN_OUTLINE =
  "M960 240 L1460 240 Q1500 240 1500 280 L1500 840 Q1500 880 1460 880 " +
  "L460 880 Q420 880 420 840 L420 280 Q420 240 460 240 Z";

// Ink milestone card: navy-ink panel pops in at `at`; the wrapper owns the EXIT (9.5–10) compress to a
// dot on the card's axis tick (scale→0.1 toward (tickX,540), fade). Children are scene-coordinate text.
const MilestoneCard: React.FC<{
  y: number; at: number; t: number; tickX: number; exitK: number; fade: number; children?: React.ReactNode;
}> = ({y, at, t, tickX, exitK, fade, children}) => {
  const p = E.outCubic(clamp((t - at) / 0.5));
  return (
    <div style={{position: "absolute", inset: 0, transformOrigin: "960px 540px", opacity: fade,
      transform: `translate(${(tickX - 960) * exitK}px, ${(540 - y) * exitK}px) scale(${1 - 0.9 * exitK})`}}>
      <div style={{position: "absolute", left: 960 - CARD_W / 2, top: y - CARD_H / 2, width: CARD_W, height: CARD_H, borderRadius: 18,
        background: "rgba(10,26,74,0.88)", border: "1px solid rgba(111,167,255,0.28)", boxShadow: "0 18px 44px rgba(0,0,0,0.35)",
        opacity: p, transform: `translateY(${(1 - p) * 26}px) scale(${0.96 + 0.04 * p})`}} />
      {children}
    </div>
  );
};

// Word cascade with BlurSlideWords' exact math, but over explicit tokens so the year range can sit in
// an isolated LTR span (Persian digits, left-to-right order) without editing the kit primitive.
const CascadeTokens: React.FC<{
  tokens: Array<{text: string; ltr?: boolean}>; t: number; start: number; y: number; w?: number; size: number;
}> = ({tokens, t, start, y, w = 700, size}) => (
  <div style={{position: "absolute", left: 960 - w / 2, top: y, width: w, transform: "translateY(-50%)",
    display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.28,
    ...faStyle(size, {family: "body", fontWeight: 600, color: palette.ice})}}>
    {tokens.map((tok, i) => {
      const e = 1 - Math.pow(1 - clamp((t - start - i * 0.09) / 0.55), 3);
      return (
        <span key={i} style={{display: "inline-block", opacity: e, transform: `translateX(${(1 - e) * 28}px)`, filter: `blur(${(1 - e) * 10}px)`,
          ...(tok.ltr ? {direction: "ltr", unicodeBidi: "isolate"} : undefined)}}>
          {tok.text}
        </span>
      );
    })}
  </div>
);

export const S1: React.FC = () => {
  const {t} = useT();

  // ---- timeline (seconds, local; 30 fps) ----
  const axisP = seg(t, 0.0, 1.6, E.outQuart);            // thread draws 1620→300, head on
  const boardP = seg(t, 1.9, 2.25, E.outQuart);          // the board assembles 1.95–2.0
  const heroOut = 1 - seg(t, 1.9, 2.0);                  // hero year becomes the first flap value (crossfade)
  const beat = Math.min(1, pulse(t, 2.5, 0.2) + pulse(t, 5.0, 0.2) + pulse(t, 6.5, 0.25));
  const nodeP = clamp((t - 2.5) / 0.4);                  // N1a pops below the board
  const logoP = E.outBack(1.8)(clamp((t - 6.5) / 0.5));  // white mark pops OUT_BACK beside card 3
  const sparkleP = seg(t, 6.5, 7.4);
  const creditP = seg(t, 7.9, 8.5, E.outCubic);
  // exit 9.5–10.0
  const exitK = seg(t, 9.5, 9.9, E.inOutCubic);          // cards compress to dots on their tick
  const fade = 1 - seg(t, 9.5, 9.8);
  const boardFade = 1 - seg(t, 9.5, 9.75);
  const axisFade = 1 - seg(t, 9.55, 9.85);
  const winP = seg(t, 9.5, 9.82, E.outCubic);            // board → S2 class-window outline, holds to 10.0

  return (
    <NightBase t={t} dur={10} origin={{x: 1620, y: 540}}>

      {/* the Blue Thread: axis first (0–1.6), then the timeline under the cards, pulsing on each beat */}
      <Thread d={AXIS} from={0} to={axisP} opacity={axisFade} pulse={beat} head={axisP > 0.01 && axisP < 0.99} />

      {/* axis ticks — one per milestone, popping when its card lands */}
      {CARDS.map((c, i) => {
        const p = E.outBack(2)(clamp((t - c.at) / 0.35));
        return (
          <div key={i} style={{position: "absolute", left: c.tickX - 1, top: 540 - 5, width: 2, height: 10,
            background: palette.ice, boxShadow: `0 0 8px ${palette.blueSky}`, opacity: clamp(p * 2) * fade,
            transform: `scaleY(${Math.max(0.001, p)})`}} />
        );
      })}

      {/* N1a — node below the board's first cell */}
      <NodeDot x={1560} y={490} p={nodeP} ringT={t - 2.5} r={9} opacity={fade} />

      {/* the split-flap board (navy card, no backdrop blur); flap row inside; active cell brightens
          with #2F7BFF (the primitive frames the flipping cell) */}
      <div style={{position: "absolute", left: BOARD.x - BOARD.w / 2, top: BOARD.y - BOARD.h / 2, width: BOARD.w, height: BOARD.h,
        borderRadius: 20, background: "rgba(10,31,74,0.82)", border: "1px solid rgba(111,167,255,0.28)",
        boxShadow: "0 24px 70px rgba(0,0,0,0.4)", opacity: boardP * boardFade,
        transform: `translateY(${(1 - boardP) * -18}px) scale(${(0.93 + 0.07 * boardP) * (1 + 0.06 * exitK)})`}}>
        <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <SplitFlapWord words={["۱۳۹۸", "توسعه", "۱۴۰۴"]} flipAtFrame={[57, 75, 150]} w={FLAP.w} h={FLAP.h} cellW={FLAP.cellW} />
        </div>
      </div>

      {/* hero year: lands on the downbeat, holds with the weight pulse, demotes into cell 1,
          then crossfades into the flap value as the board assembles */}
      <div style={{position: "absolute", inset: 0, opacity: heroOut}}>
        <HeroWord text="۱۳۹۸" from={{x: 960, y: 640, scale: 1.25}} to={{x: 960, y: 460, scale: 1}}
          landFrame={12} holdFrames={12} demoteDurFrames={15} demoteTo={HERO_DEMOTE_TO} size={180} color={palette.ice} />
      </div>

      {/* card 1 — flip 1 «توسعه» */}
      <MilestoneCard {...CARDS[0]} t={t} exitK={exitK} fade={fade}>
        <BlurSlideWords text="راه‌اندازی سامانهٔ امتحانات مجازی (LMS)" t={t} start={2.6} x={960} y={CARDS[0].y} w={700} size={36} weight={600} />
      </MilestoneCard>

      {/* card 2 — flip 2 «۱۴۰۴» */}
      <MilestoneCard {...CARDS[1]} t={t} exitK={exitK} fade={fade}>
        <BlurSlideWords text="توسعهٔ زیرساخت، بهبود عملکرد، ماژول‌های جدید" t={t} start={5.1} x={960} y={CARDS[1].y} w={700} size={36} weight={600} />
      </MilestoneCard>

      {/* card 3 — year range isolated LTR (Persian digits) */}
      <MilestoneCard {...CARDS[2]} t={t} exitK={exitK} fade={fade}>
        <CascadeTokens y={CARDS[2].y} t={t} start={6.6} size={36}
          tokens={[{text: "بهره‌برداری"}, {text: "استانی"}, {text: "از"}, {text: "ترم"}, {text: "دوم"}, {text: "۱۴۰۴–۱۴۰۵", ltr: true}]} />
      </MilestoneCard>

      {/* white mark pops OUT_BACK beside card 3 + sparkle */}
      <div style={{position: "absolute", inset: 0, opacity: fade}}>
        <Logo cx={400} cy={860} height={150} kind="mark" variant="white" scale={Math.max(0.001, logoP)}
          opacity={clamp(logoP * 3)} glow={14 + 20 * beat} />
        <Sparkle x={400} y={860} p={sparkleP} size={140} />
      </div>

      {/* producer line, bottom-right */}
      <FaText x={1560} y={960} w={800} size={32} weight={500} color={palette.ice} family="org" align="center"
        text="محصول اداره کل فناوری اطلاعات دانشگاه آزاد اسلامی مشهد" opacity={0.8 * creditP * fade} />

      {/* exit: the board morphs into S2's class-window outline (stroke only), holds into S2 */}
      {winP > 0 && <Thread d={WIN_OUTLINE} from={0} to={winP} width={4} glow={0.9} head={winP < 0.99} />}

    </NightBase>
  );
};
