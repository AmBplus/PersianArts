// KitV2Showcase-A — demonstrates all 7 typography primitives (order T1) with the real film texts
// from script/v2/kit-mapping-v2.md. 300f @ 30fps, 1920x1080. Estedad only, token colours, RTL.
// This is a verification composition, not a film scene; scenes consume the primitives directly.
import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {palette} from "../tokens";
import {clamp} from "../easing";
import {SplitFlapWord} from "./SplitFlapWord";
import {HeroWord} from "./HeroWord";
import {BlurWords} from "./BlurWords";
import {PillCycle} from "./PillCycle";
import {WeightPulse} from "./WeightPulse";
import {GradientSweep} from "./GradientSweep";
import {MarkerUnderline} from "./MarkerUnderline";

const zone: React.CSSProperties = {position: "absolute", display: "flex", justifyContent: "center"};

const Caption: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: y,
      width: 1920,
      textAlign: "center",
      fontFamily: '"Estedad", system-ui, sans-serif',
      fontSize: 26,
      letterSpacing: 0,
      color: "rgba(234,242,255,0.42)",
      direction: "rtl",
    }}
  >
    {children}
  </div>
);

export const KitV2ShowcaseA: React.FC = () => {
  const frame = useCurrentFrame();

  // GradientSweep / MarkerUnderline progress come from the frame (no internal clocks);
  // the draw/fill easing lives inside each primitive
  const sweepP = clamp((frame - 170) / 35);
  const markerP = clamp((frame - 120) / 16);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${palette.navy0} 0%, ${palette.navy1} 100%)`}}>
      {/* 1 — HeroWord «مقیاس سامانه»: land, hold with weight pulse, demote to the label slot */}
      <HeroWord
        text="مقیاس سامانه"
        from={{x: 960, y: 620, scale: 1.45}}
        to={{x: 960, y: 235, scale: 1}}
        landFrame={26}
        holdFrames={78}
        demoteDurFrames={26}
        size={128}
      />

      {/* 2 — SplitFlapWord [۱۳۹۸ → توسعه → ۱۴۰۴] */}
      <div style={{...zone, left: 550, top: 395, width: 820}}>
        <SplitFlapWord words={["۱۳۹۸", "توسعه", "۱۴۰۴"]} flipAtFrame={[36, 130, 224]} w={820} h={156} cellW={132} />
      </div>

      {/* 3 — BlurWords «دانشگاه آزاد اسلامی واحد مشهد» */}
      <div style={{...zone, left: 260, top: 636, width: 1400}}>
        <BlurWords text="دانشگاه آزاد اسلامی واحد مشهد" startFrame={150} perWordFrames={5} size={62} />
      </div>

      {/* 4 — PillCycle [کلاس زنده → در حال ضبط → آرشیو و بازپخش] */}
      <div style={{...zone, left: 560, top: 758, width: 800}}>
        <PillCycle values={["کلاس زنده", "در حال ضبط", "آرشیو و بازپخش"]} valueAtFrame={[50, 140, 230]} size={50} />
      </div>

      {/* bottom row, reading order right → left */}
      {/* 5 — GradientSweep on «سامانه دانا» */}
      <div style={{...zone, left: 1120, top: 905, width: 720}}>
        <div style={{position: "relative"}}>
          <div
            style={{
              position: "absolute",
              left: -140,
              top: 10,
              width: 420,
              height: 190,
              borderRadius: "50%",
              background: `radial-gradient(closest-side, ${palette.blueDeep}66, ${palette.blueMid}22 55%, transparent 78%)`,
              filter: "blur(38px)",
              opacity: interpolate(sweepP, [0, 1], [0, 0.55]),
            }}
          />
          <GradientSweep progress={sweepP} size={72}>
            سامانه دانا
          </GradientSweep>
        </div>
      </div>

      {/* 6 — MarkerUnderline under «زیرساختی یکپارچه» */}
      <div style={{...zone, left: 460, top: 905, width: 1000}}>
        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontFamily: '"Estedad", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 62,
            lineHeight: 1.5,
            letterSpacing: 0,
            color: palette.ice,
            direction: "rtl",
            whiteSpace: "nowrap",
          }}
        >
          زیرساختی یکپارچه
          <MarkerUnderline progress={markerP} color="gold" width={330} />
        </span>
      </div>

      {/* 7 — WeightPulse on «کلاس‌های تعاملی» */}
      <div style={{...zone, left: 60, top: 912, width: 400}}>
        <WeightPulse text="کلاس‌های تعاملی" beats={[40, 62, 84, 106, 128, 160, 200, 240]} weights={[700, 800]} size={56} />
      </div>

      {/* zone captions (demo furniture, not film text) */}
      <Caption y={300}>فرود قهرمان و تنزل به برچسب</Caption>
      <Caption y={572}>واژش پره‌پره</Caption>
      <Caption y={712}>ورود ابری واژه‌به‌واژه</Caption>
      <Caption y={878}>چرخهٔ قرص اسلات‌ماشین</Caption>
      <Caption y={1020}>جارب گرادیانی — زیرخط ماژیکی — پمپ وزن قلم</Caption>
    </AbsoluteFill>
  );
};

export default KitV2ShowcaseA;
