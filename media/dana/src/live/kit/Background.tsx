// Backgrounds: 'paper' (light, opening/closing) and 'night' (deep blue, middle scenes) with deterministic drifting dust,
// plus an iris that grows from a point to change theme (matched cut from the logo / thread).
import React from "react";
import {AbsoluteFill} from "remotion";
import {palette} from "./tokens";
import {rnd} from "./easing";

export type BgTheme = "paper" | "night";

const bgStyle = (theme: BgTheme): React.CSSProperties =>
  theme === "night"
    ? {background: `radial-gradient(120% 95% at 72% 18%, ${palette.navy2} 0%, ${palette.navy1} 52%, ${palette.navy0} 100%)`}
    : {background: `radial-gradient(110% 90% at 50% 38%, #FFFFFF 0%, ${palette.paper} 55%, ${palette.ice} 100%)`};

export const Dust: React.FC<{t: number; theme: BgTheme; count?: number; speed?: number; opacity?: number}> = ({t, theme, count = 70, speed = 1, opacity = 1}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {Array.from({length: count}).map((_, i) => {
      const r1 = rnd(i * 7 + 1), r2 = rnd(i * 7 + 2), r3 = rnd(i * 7 + 3), r4 = rnd(i * 7 + 4);
      const depth = 0.3 + r3 * 0.9;                                    // parallax depth
      const size = 2 + r4 * 5 * depth;
      const x = ((r1 * 2200 - t * 16 * depth * speed) % 2200 + 2200) % 2200 - 140;
      const y = (r2 * 1200 + Math.sin(t * 0.5 + i) * 14 * depth) - 60;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (0.8 + r4 * 1.5) + i * 3));
      const col = theme === "night" ? palette.blueSky : palette.blueMid;
      return <div key={i} style={{position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: col, opacity: (theme === "night" ? 0.55 : 0.22) * tw * depth * opacity, filter: `blur(${size > 4 ? 1.2 : 0}px)`}} />;
    })}
  </AbsoluteFill>
);

export const Background: React.FC<{theme: BgTheme; t?: number; dust?: boolean; children?: React.ReactNode}> = ({theme, t = 0, dust = true, children}) => (
  <AbsoluteFill style={bgStyle(theme)}>
    {dust && <Dust t={t} theme={theme} />}
    {children}
  </AbsoluteFill>
);

/** Theme change: draws `from` full-frame, then `to` through a growing circle (origin px, p 0..1). */
export const IrisBackground: React.FC<{from: BgTheme; to: BgTheme; p: number; cx: number; cy: number; t?: number}> = ({from, to, p, cx, cy, t = 0}) => {
  const r = p * 2500;
  return (
    <>
      <Background theme={from} t={t} />
      {p > 0.001 && (
        <AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>
          <Background theme={to} t={t} />
        </AbsoluteFill>
      )}
    </>
  );
};
