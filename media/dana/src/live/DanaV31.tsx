// DanaV31 — نسخهٔ ۳٫۱: کلایمکس زودهنگام (پایان‌بندی همان موسیقی، بالا) + ریمیکس به Risk برای
// فصل ویژگی‌ها + بازگشت پایان‌بندی در خاتمه. لوگوی شفاف از نخستین فریم (واترمارک) و در هر دو
// قفل‌آپ. ساختار از script/v3/cue-sheet-v31.json؛ برش‌ها روی ضربه‌های اندازه‌گیری‌شدهٔ ریمیکس.
import React from "react";
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from "remotion";
import cue from "../script/v3/cue-sheet-v31.json";
import {BrandInkOpen} from "./cards/BrandInkOpen";
import {PaperTitleCard} from "./cards/PaperTitleCard";
import {BlurSlide} from "./cards/BlurSlide";
import {CelFlashStomp} from "./cards/CelFlashStomp";
import {OutlineWordFill} from "./cards/OutlineWordFill";
import {SpectrumMorphUi} from "./cards/SpectrumMorphUi";
import {ListReveal} from "./cards/ListReveal";
import {SegmentedThumbHero} from "./cards/SegmentedThumbHero";
import {SplitFlapFlip} from "./cards/SplitFlapFlip";
import {VoiceWaveformLive} from "./cards/VoiceWaveformLive";
import {IntegrationHubMap} from "./cards/IntegrationHubMap";
import {ValueStaggerGradient} from "./cards/ValueStaggerGradient";
import {RadialWave} from "./cards/RadialWave";
import {FlyingWords} from "./cards/FlyingWords";
import {LogoLockupFa} from "./LogoLockupFa";

type Stop = (typeof cue.stops)[number];

const BY_CARD: Record<string, React.FC> = {
  BrandInkOpen,
  PaperTitleCard,
  BlurSlide,
  CelFlashStomp,
  OutlineWordFill,
  SpectrumMorphUi,
  ListReveal,
  SegmentedThumbHero,
  SplitFlapFlip,
  VoiceWaveformLive,
  IntegrationHubMap,
  ValueStaggerGradient,
  RadialWave,
  FlyingWords,
};

// A0 — نفسِ انتظار: سرمهٔ ساکت + «دانا» تکسِ تنفس‌دار (۷٫۴ ثانیه تا بوم).
const DarkHold: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin((frame / 30) * Math.PI * 0.45) * 0.015;
  const op = interpolate(frame, [0, 20, 200, 222], [0, 0.55, 0.55, 0.75], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <FaFonts families={["Amiri", "Vazirmatn"]}>
      <AbsoluteFill style={{backgroundColor: "#040A22", alignItems: "center", justifyContent: "center"}}>
        <div
          style={{
            fontFamily: '"Amiri", "Vazirmatn", serif',
            fontWeight: 700,
            fontSize: 92,
            lineHeight: 1.6,
            letterSpacing: 0,
            color: "#EAF2FF",
            direction: "rtl",
            opacity: op,
            transform: `scale(${breathe})`,
          }}
        >
          دانا
        </div>
      </AbsoluteFill>
    </FaFonts>
  );
};

// E2 — دو ثانیه تاریکیِ قبل از قفل‌آپ نهایی.
const DarkBeat: React.FC = () => <AbsoluteFill style={{backgroundColor: "#040A22"}}/>;

// واترمارک لوگو (شفاف، سفید): از نخستین فریم تا آستانهٔ کلایمکس، در فصل ویژگی‌ها و در نفسِ پیش از پایان.
const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(
    frame,
    [0, 6, 489, 495, 876, 882, 1458, 1464, 1749, 1755, 1803, 1809],
    [0, 0.85, 0.85, 0, 0, 0.85, 0.85, 0, 0, 0.5, 0.5, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <img
        src={staticFile("assets/logo-mark-white@2x.png")}
        alt=""
        style={{position: "absolute", right: 64, top: 56, height: 96, width: "auto", opacity: op}}
      />
    </AbsoluteFill>
  );
};

// خط نفس روی RadialWave.
const BreathCaption: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [26, 46, 90, 105], [0, 0.92, 0.92, 0], {
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

export const DanaV31: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [2050, 2118], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: "#040A22"}}>
      {(cue.stops as Stop[]).map((stop) => {
        if (stop.card === "DarkHold") {
          return (
            <Sequence key={stop.id} from={stop.from} durationInFrames={stop.dur} name={stop.id}>
              <DarkHold/>
            </Sequence>
          );
        }
        if (stop.card === "DarkBeat") {
          return (
            <Sequence key={stop.id} from={stop.from} durationInFrames={stop.dur} name={stop.id}>
              <DarkBeat/>
            </Sequence>
          );
        }
        if (stop.card === "LogoLockupFast" || stop.card === "LogoLockupFull") {
          return (
            <Sequence key={stop.id} from={stop.from} durationInFrames={stop.dur} name={stop.id}>
              <LogoLockupFa mode={stop.card === "LogoLockupFast" ? "fast" : "full"}/>
            </Sequence>
          );
        }
        const Card = BY_CARD[stop.card];
        if (!Card) throw new Error(`DanaV31: no component for ${stop.card}`);
        return (
          <Sequence key={stop.id} from={stop.from} durationInFrames={stop.dur} name={`${stop.id} ${stop.card}`}>
            <Card/>
          </Sequence>
        );
      })}
      <Sequence from={1464} durationInFrames={105} name="D-caption">
        <BreathCaption/>
      </Sequence>
      <Watermark/>
      <AbsoluteFill style={{backgroundColor: "#030509", opacity: fadeOut}}/>
    </AbsoluteFill>
  );
};
