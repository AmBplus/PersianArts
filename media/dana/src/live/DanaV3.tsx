// DanaV3 — «نمایشگاه زندهٔ کارت‌ها». هر ایستگاه = یک کارت فارسیِ واقعی (فرک با متن دانا)
// تمام‌قد در ۱۹۲۰×۱۰۸۰؛ برش‌ها روی ضربه‌های اندازه‌گیری‌شدهٔ موسیقی. فیلمنامه: script/v3/.
import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, Easing} from "remotion";
import cue from "../script/v3/cue-sheet-v3.json";
import {BrandInkOpen} from "./cards/BrandInkOpen";
import {PaperTitleCard} from "./cards/PaperTitleCard";
import {MarkerUnderlineTitle} from "./cards/MarkerUnderlineTitle";
import {MarkerUnderlineTitle as MarkerUnderlineTitleB} from "./cards/MarkerUnderlineTitle2";
import {BlurSlide} from "./cards/BlurSlide";
import {LeadWordZoomAssemble} from "./cards/LeadWordZoomAssemble";
import {SegmentedThumbHero} from "./cards/SegmentedThumbHero";
import {ListReveal} from "./cards/ListReveal";
import {VoiceWaveformLive} from "./cards/VoiceWaveformLive";
import {OdometerDigitRoll} from "./cards/OdometerDigitRoll";
import {SplitFlapFlip} from "./cards/SplitFlapFlip";
import {SpectrumMorphUi} from "./cards/SpectrumMorphUi";
import {CelFlashStomp} from "./cards/CelFlashStomp";
import {GradientWordSweep} from "./cards/GradientWordSweep";
import {TextColumnConverge} from "./cards/TextColumnConverge";
import {CountdownArcScatter} from "./cards/CountdownArcScatter";
import {OutlineWordFill} from "./cards/OutlineWordFill";
import {RadialWave} from "./cards/RadialWave";
import {IntegrationHubMap} from "./cards/IntegrationHubMap";
import {ValueStaggerGradient} from "./cards/ValueStaggerGradient";
import {LogoLockupFa} from "./LogoLockupFa";

type Stop = (typeof cue.stops)[number];

const BY_CARD: Record<string, React.FC> = {
  BrandInkOpen,
  PaperTitleCard,
  MarkerUnderlineTitle,
  MarkerUnderlineTitle2: MarkerUnderlineTitleB,
  BlurSlide,
  LeadWordZoomAssemble,
  SegmentedThumbHero,
  ListReveal,
  VoiceWaveformLive,
  OdometerDigitRoll,
  SplitFlapFlip,
  SpectrumMorphUi,
  CelFlashStomp,
  GradientWordSweep,
  TextColumnConverge,
  CountdownArcScatter,
  OutlineWordFill,
  RadialWave,
  IntegrationHubMap,
  ValueStaggerGradient,
  LogoLockupFa,
};

// تنها روکشِ فیلم: خط نفسِ وقفه (روی RadialWave بدون متن) و محوی پایانی.
const BreathCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [30, 52, 105, 121], [0, 0.92, 0.92, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 96}}>
      <div
        style={{
          fontFamily: '"Vazirmatn", sans-serif',
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.4,
          letterSpacing: 0,
          color: "#EAF2FF",
          direction: "rtl",
          textShadow: "0 2px 24px rgba(4,10,34,0.6)",
          opacity: op,
        }}
      >
        یک سامانه، همهٔ دانشگاه
      </div>
    </AbsoluteFill>
  );
};

export const DanaV3: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [2050, 2118], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{backgroundColor: "#030509"}}>
      {(cue.stops as Stop[]).filter((s) => s.card !== "LogoLockupHold").map((stop: Stop) => {
        const Card = BY_CARD[stop.card];
        if (!Card) throw new Error(`DanaV3: no component for ${stop.card}`);
        // پایان‌بندی تا انتهای فیلم می‌نشیند (C6a+C6b)؛ بقیه در پنجرهٔ خودشان.
        const dur = stop.id === "C6a" ? 2118 - stop.from : stop.dur;
        return (
          <Sequence key={stop.id} from={stop.from} durationInFrames={dur} name={`${stop.id} ${stop.card}`}>
            <Card/>
          </Sequence>
        );
      })}
      <Sequence from={1456} durationInFrames={121} name="C4-caption">
        <BreathCaption/>
      </Sequence>
      <AbsoluteFill style={{backgroundColor: "#030509", opacity: fadeOut}}/>
    </AbsoluteFill>
  );
};
