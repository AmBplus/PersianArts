// KitV2Showcase-B — demo composition for the T2 motion primitives (order B).
// Real film texts from script/v2/dana-script-v2.md test set. Estedad only.
// Layout: dot-field backdrop; segmented control top; bento 2x2 left; report list
// bottom-left; gold halation stat right; confetti burst centre at frame 100.
import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {DanaFonts} from "../fonts";
import {faNumber, faStyle} from "../fa";
import {palette} from "../tokens";
import {SegmentedThree} from "./SegmentedThree";
import {BentoLightUp} from "./BentoLightUp";
import {DotFieldWave} from "./DotFieldWave";
import {HalationGlow} from "./HalationGlow";
import {ListRevealRows} from "./ListRevealRows";
import {ConfettiBurst} from "./ConfettiBurst";

const BentoText: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...faStyle(30, {fontWeight: 700, color: palette.ice}),
    }}
  >
    {text}
  </div>
);

const ShowcaseB: React.FC = () => {
  const frame = useCurrentFrame();

  // Segmented: linear 8-frame ramps at 50 and 160; SegmentedThree applies OUT_EXPO itself.
  const activeIndex = interpolate(frame, [50, 58, 160, 168], [0, 1, 1, 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Halation: full pop+fall+settle life over 41 frames from frame 24.
  const glowP = (frame - 24) / 41;
  const numOp = interpolate(frame, [10, 20], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${palette.navy0}, ${palette.navy1})`}}>
      {/* full-bleed dot field behind everything */}
      <DotFieldWave origin={{x: 960, y: 540}} t0={0} speed={1.2} opacity={0.9} />

      {/* bento 2x2 — RTL light order: right-top first */}
      <BentoLightUp
        x={500}
        y={400}
        w={340}
        h={190}
        gap={24}
        cols={2}
        tiles={[
          {id: "bar", content: <BentoText text="نمودار میله‌ای" />, lightFrame: 20},
          {id: "ring", content: <BentoText text="حلقهٔ درصد" />, lightFrame: 32},
          {id: "rows", content: <BentoText text="ردیف‌های گزارش" />, lightFrame: 44},
          {id: "trend", content: <BentoText text="خط روند" />, lightFrame: 56},
        ]}
      />

      {/* report list */}
      <ListRevealRows
        x={500}
        y={812}
        w={560}
        rows={["گزارش آزمون‌ها", "گزارش حضور", "گزارش عملکرد", "گزارش واحدها"]}
        startFrame={30}
      />

      {/* segmented control */}
      <SegmentedThree options={["تستی", "تشریحی", "ترکیبی"]} activeIndex={activeIndex} x={960} y={150} w={840} h={96} />

      {/* gold halation behind the film stat (film use of gold) */}
      <HalationGlow x={1400} y={480} size={560} color={palette.gold} intensity={glowP} />
      <div
        style={{
          position: "absolute",
          left: 1400 - 400,
          top: 480 - 90,
          width: 800,
          textAlign: "center",
          opacity: numOp,
          ...faStyle(150, {fontWeight: 800, color: palette.gold, fontVariantNumeric: "tabular-nums", lineHeight: 1.2}),
        }}
      >
        {faNumber(65339)}
      </div>

      {/* confetti burst from screen centre */}
      <ConfettiBurst origin={{x: 960, y: 540}} t0={100} count={18} />
    </AbsoluteFill>
  );
};

export const KitV2ShowcaseB: React.FC = () => (
  <DanaFonts>
    <ShowcaseB />
  </DanaFonts>
);
