// Persian text helpers (rules from docs/PERSIAN-LOCALIZATION-LESSONS.md): no letterSpacing, RTL, prefix-slicing typewriter, Persian digits.
import React from "react";
import {fonts, palette} from "./tokens";
import {clamp} from "./easing";

const FA = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (v: string | number): string => String(v).replace(/\d/g, (d) => FA[Number(d)]);
/** 90000 -> ۹۰٬۰۰۰ */
export const faNumber = (n: number): string => faDigits(Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));

/** Typewriter prefix: slicing a prefix keeps correct Persian shaping at every step. */
export const typeOn = (text: string, p: number): string => {
  const chars = [...text];
  return chars.slice(0, Math.floor(clamp(p) * chars.length + 1e-6)).join("");
};
export const words = (text: string): string[] => String(text).split(/(\s+)/).filter(Boolean);

// ---- Persian joining (copied from work/persian/src/demos/_fa/index.tsx): letters that never join
// forward end a group. Per-unit motion (flap cells etc.) works on these CONNECTED GROUPS, never on
// single code points. Spaces are returned as " " separators; ZWNJ splits without being kept.
const NON_JOINERS = "اآأإدذرزژو";
const FA_GROUP_DIGITS = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩0123456789";
export const joinedGroups = (text: string): string[] => {
  const out: string[] = [];
  let cur = "";
  for (const ch of String(text)) {
    if (ch === " ") {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      out.push(" ");
      continue;
    }
    if (ch === "\u200c") {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      continue;
    }
    cur += ch;
    if (NON_JOINERS.includes(ch) || FA_GROUP_DIGITS.includes(ch)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
};

export const faStyle = (
  px: number,
  o: React.CSSProperties & {family?: keyof typeof fonts} = {},
): React.CSSProperties => {
  const {family = "body", ...rest} = o;
  return {
    fontFamily: `"${fonts[family]}", "Estedad", system-ui, sans-serif`,
    fontSize: px,
    letterSpacing: 0,
    textTransform: "none",
    direction: "rtl",
    unicodeBidi: "plaintext",
    lineHeight: family === "display" ? 2.5 : 1.8,
    color: palette.ice,
    fontWeight: 500,
    ...rest,
  };
};

/** Absolutely positioned Persian text box. `x`,`y` = centre of the box (px on the 1920x1080 grid). */
export const FaText: React.FC<{
  x: number; y: number; w?: number; size: number; text: React.ReactNode; weight?: number; color?: string;
  family?: keyof typeof fonts; opacity?: number; align?: "right" | "center" | "left"; dy?: number; dx?: number; scale?: number;
  blur?: number; style?: React.CSSProperties;
}> = ({x, y, w = 1400, size, text, weight = 600, color = palette.ice, family = "headline", opacity = 1, align = "center", dy = 0, dx = 0, scale = 1, blur = 0, style}) => (
  <div
    style={{
      position: "absolute", left: x - w / 2 + dx, top: y + dy, width: w, transform: `translateY(-50%) scale(${scale})`,
      textAlign: align, opacity, filter: blur > 0.05 ? `blur(${blur}px)` : undefined, whiteSpace: "pre-wrap",
      ...faStyle(size, {family, fontWeight: weight, color}), ...style,
    }}
  >
    {text}
  </div>
);

/** Word-by-word blur-slide reveal (words animate as whole connected words — never letters). */
export const BlurSlideWords: React.FC<{
  text: string; t: number; start: number; per?: number; dur?: number; x: number; y: number; w?: number; size: number;
  weight?: number; color?: string; family?: keyof typeof fonts; slide?: number; align?: "right" | "center" | "left";
}> = ({text, t, start, per = 0.09, dur = 0.55, x, y, w = 1400, size, weight = 600, color = palette.ice, family = "headline", slide = 28, align = "center"}) => {
  const ws = words(text).filter((s) => s.trim());
  return (
    <div style={{position: "absolute", left: x - w / 2, top: y, width: w, transform: "translateY(-50%)", display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : align === "right" ? "flex-start" : "flex-end", columnGap: size * 0.28, ...faStyle(size, {family, fontWeight: weight, color})}}>
      {ws.map((wd, i) => {
        const p = clamp((t - start - i * per) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        return <span key={i} style={{display: "inline-block", opacity: e, transform: `translateX(${(1 - e) * slide}px)`, filter: `blur(${(1 - e) * 10}px)`}}>{wd}</span>;
      })}
    </div>
  );
};
