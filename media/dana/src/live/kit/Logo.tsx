// Logo components. Assets are in src/public/logo/ (copied from work/dana/assets). The logo has NO background: never put a plate behind it.
import React from "react";
import {staticFile} from "remotion";
import {E, clamp} from "./easing";
import {palette} from "./tokens";

export type LogoVariant = "color" | "white";
export const LOGO = {
  full: {w: 442, h: 625},          // cap + hexagon + wordmark
  mark: {w: 430, h: 471},          // cap + hexagon only
  wordmark: {w: 333, h: 166},      // calligraphic text only
  // tassel tip and cord-top, normalised in logo-full (x right, y down) — measured on the contact sheet
  tassel: {tip: {x: 0.085, y: 0.455}, top: {x: 0.092, y: 0.2}},
  hexCenter: {x: 0.52, y: 0.43},   // centre of the hexagon in logo-full
  markShare: 0.73,                 // height of cap+hexagon as a share of logo-full height
} as const;

const file = (kind: "full" | "mark" | "wordmark", v: LogoVariant) =>
  staticFile(v === "white" ? `logo/logo-${kind}-holes-white.png` : kind === "wordmark" ? "logo/logo-wordmark.png" : `logo/logo-${kind}@2x.png`);

/** Absolute position of the logo-full box given centre and height. */
export const logoBox = (cx: number, cy: number, height: number, kind: "full" | "mark" | "wordmark" = "full") => {
  const a = LOGO[kind].w / LOGO[kind].h;
  return {left: cx - (height * a) / 2, top: cy - height / 2, width: height * a, height};
};
/** Screen position of the tassel tip for a logo-full drawn with centre (cx,cy) and height. */
export const tasselPoint = (cx: number, cy: number, height: number) => {
  const b = logoBox(cx, cy, height);
  return {x: b.left + LOGO.tassel.tip.x * b.width, y: b.top + LOGO.tassel.tip.y * b.height};
};
export const hexPoint = (cx: number, cy: number, height: number) => {
  const b = logoBox(cx, cy, height);
  return {x: b.left + LOGO.hexCenter.x * b.width, y: b.top + LOGO.hexCenter.y * b.height};
};

export const Logo: React.FC<{cx: number; cy: number; height: number; variant?: LogoVariant; kind?: "full" | "mark" | "wordmark"; opacity?: number; scale?: number; glow?: number; style?: React.CSSProperties}> = ({cx, cy, height, variant = "color", kind = "full", opacity = 1, scale = 1, glow = 0, style}) => {
  const b = logoBox(cx, cy, height, kind);
  return (
    <img src={file(kind, variant)} style={{position: "absolute", ...b, opacity, transform: `scale(${scale})`, filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${palette.blueMid})` : undefined, ...style}} />
  );
};

// ---- assembly: the cap(+tassel) and the hexagon are two clipped copies of the same image that fly in and snap together.
const CAP_POINTS = "-2% 0%, 102% 0%, 102% 21%, 73% 27%, 50% 22%, 30% 27%, 15% 24%, 15% 47%, 3% 47%, 3% 21%, -2% 21%";
const CAP_CLIP = `polygon(${CAP_POINTS})`;
const REST_CLIP = `polygon(evenodd, -5% -5%, 105% -5%, 105% 105%, -5% 105%, -5% -5%, ${CAP_POINTS})`;

/** Builds the full logo (without wordmark when `withWordmark`=false uses the mark image). p: 0..1 assembly progress. */
export const LogoAssemble: React.FC<{cx: number; cy: number; height: number; p: number; variant?: LogoVariant; kind?: "full" | "mark"; opacity?: number}> = ({cx, cy, height, p, variant = "color", kind = "full", opacity = 1}) => {
  const b = logoBox(cx, cy, height, kind);
  const pc = E.outExpo(clamp(p / 0.78));                      // cap
  const ph = E.outExpo(clamp((p - 0.12) / 0.78));             // hexagon, slightly later
  const src = file(kind, variant);
  const capStyle: React.CSSProperties = {position: "absolute", ...b, clipPath: CAP_CLIP, opacity: opacity * clamp(pc * 3), transform: `translate(${(1 - pc) * -300}px, ${(1 - pc) * -240}px) rotate(${(1 - pc) * -16}deg) scale(${0.9 + 0.1 * pc})`};
  const hexStyle: React.CSSProperties = {position: "absolute", ...b, clipPath: REST_CLIP, opacity: opacity * clamp(ph * 3), transform: `translate(${(1 - ph) * 240}px, ${(1 - ph) * 190}px) rotate(${(1 - ph) * 12}deg) scale(${0.9 + 0.1 * ph})`};
  const settle = clamp((p - 0.78) / 0.22);
  return (
    <>
      <img src={src} style={{...hexStyle, filter: `blur(${(1 - ph) * 6}px)`}} />
      <img src={src} style={{...capStyle, filter: `blur(${(1 - pc) * 6}px)`}} />
      {settle > 0 && settle < 1 && (
        <img src={src} style={{position: "absolute", ...b, opacity: (1 - settle) * 0.55, filter: `blur(18px) brightness(1.4)`}} />
      )}
    </>
  );
};

/** Calligraphic wordmark revealed right-to-left with a soft pen-edge and a glowing nib. p: 0..1. */
export const Wordmark: React.FC<{cx: number; cy: number; height: number; p: number; variant?: LogoVariant; opacity?: number; nib?: boolean}> = ({cx, cy, height, p, variant = "color", opacity = 1, nib = true}) => {
  const b = logoBox(cx, cy, height, "wordmark");
  const edge = clamp(p) * 118 - 18;                          // percent from the RIGHT
  const mask = `linear-gradient(to left, #000 ${Math.max(0, edge)}%, transparent ${Math.max(0, edge) + 14}%)`;
  const nibX = b.left + b.width * (1 - clamp(p));
  const nibY = b.top + b.height * (0.62 + 0.12 * Math.sin(p * 21));
  return (
    <>
      <img src={file("wordmark", variant)} style={{position: "absolute", ...b, opacity, WebkitMaskImage: mask, maskImage: mask}} />
      {nib && p > 0.01 && p < 0.985 && (
        <div style={{position: "absolute", left: nibX - 10, top: nibY - 10, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: `0 0 26px 8px ${palette.blueSky}`, opacity: 0.95}} />
      )}
    </>
  );
};

/** Small white logo + university name in the top-right corner (all dark scenes). */
export const Watermark: React.FC<{opacity?: number; tone?: "night" | "light"}> = ({opacity = 1, tone = "night"}) => {
  const night = tone === "night";
  return (
    <div style={{position: "absolute", right: 70, top: 46, display: "flex", alignItems: "center", gap: 18, opacity: 0.8 * opacity, direction: "rtl"}}>
      <img src={file("mark", night ? "white" : "color")} style={{height: 90, width: "auto"}} />
      <div style={{fontFamily: '"Estedad", system-ui', fontSize: 30, fontWeight: 500, color: night ? palette.ice : palette.ink, direction: "rtl", letterSpacing: 0, lineHeight: 1.7}}>
        دانشگاه آزاد اسلامی واحد مشهد
      </div>
    </div>
  );
};
