// Shared Persian/RTL kit for the localized shotcraft demos (PersianArts).
// Rules this kit encodes (learned from the Persian script's joining + RTL layout):
//  1. Never put letter-spacing, per-letter transforms or text-transform on Persian text: letters join, spacing/uppercase break shaping.
//  2. Per-unit motion works on JOINED GROUPS (joinedGroups) or words, never on single code points.
//  3. Typewriter = prefix slice of the string (shaping re-flows the last letter: this is how real typing looks in Persian).
//  4. Layout mirrors: use direction:rtl + logical props (marginInlineStart, insetInlineStart, paddingInlineEnd ...),
//     and flip every physical left/right motion that carries meaning (reveals, slides, sweeps) with `dir()`.
//  5. Latin numerals in UI become Persian digits (faDigits); Persian x-height is smaller, so sizes get FA_SIZE and line-height FA_LH.
import React from "react";
import {continueRender, delayRender, staticFile} from "remotion";

export const FONT_FILES = {
  Vazirmatn: "Vazirmatn-Variable.ttf",
  Estedad: "Estedad-Variable.ttf",
  Sahel: "Sahel-Variable.ttf",
  Shabnam: "Shabnam-Regular.ttf",
  Samim: "Samim-Regular.ttf",
  Gandom: "Gandom-Regular.ttf",
  Tanha: "Tanha-Regular.ttf",
  Parastoo: "Parastoo-Regular.ttf",
  Nahid: "Nahid-Regular.ttf",
  "Vazir Code": "Vazir-Code-Regular.ttf",
  Lalezar: "Lalezar-Regular.ttf",
  Amiri: "Amiri-Regular.ttf",
  "Aref Ruqaa": "ArefRuqaa-Regular.ttf",
  Katibeh: "Katibeh-Regular.ttf",
  "Markazi Text": "MarkaziText-Variable.ttf",
  Lemonada: "Lemonada-Variable.ttf",
  "Noto Kufi Arabic": "NotoKufiArabic-Variable.ttf",
  "Noto Naskh Arabic": "NotoNaskhArabic-Variable.ttf",
  "Baloo Bhaijaan 2": "BalooBhaijaan2-Variable.ttf",
  "Reem Kufi": "ReemKufi-Variable.ttf",
  "Scheherazade New": "ScheherazadeNew-Regular.ttf",
  Lateef: "Lateef-Regular.ttf",
  Gulzar: "Gulzar-Regular.ttf",
  "Noto Nastaliq Urdu": "NotoNastaliqUrdu-Variable.ttf",
} as const;
export type FaFamily = keyof typeof FONT_FILES;

const loaded = new Map<string, Promise<void>>();
const ensureFont = (family: FaFamily): Promise<void> => {
  if (!loaded.has(family)) {
    const ff = new FontFace(family, `url(${staticFile(`fonts/${FONT_FILES[family]}`)})`, {weight: "100 900"});
    loaded.set(family, ff.load().then((f) => { document.fonts.add(f); }));
  }
  return loaded.get(family)!;
};

/** Blocks the frame until the families are ready (so every rendered frame uses the real font, never a fallback). */
export const FaFonts: React.FC<{families: FaFamily[]; children?: React.ReactNode}> = ({families, children}) => {
  const [handle] = React.useState(() => delayRender(`fa-fonts:${families.join(",")}`));
  React.useEffect(() => {
    Promise.all(families.map(ensureFont)).then(() => continueRender(handle), () => continueRender(handle));
  }, [families, handle]);
  return <>{children}</>;
};

/** Persian root: sets RTL + font for the whole demo. Children inherit direction and font-family. */
export const FaRoot: React.FC<{family?: FaFamily; style?: React.CSSProperties; children?: React.ReactNode}> = ({family = "Vazirmatn", style, children}) => (
  <FaFonts families={[family]}>
    <div style={{position: "absolute", inset: 0, direction: "rtl", fontFamily: `"${family}", "Vazirmatn", sans-serif`, fontKerning: "normal", fontFeatureSettings: '"kern","liga","calt"', ...style}}>{children}</div>
  </FaFonts>
);

// ---- sizing: Persian glyphs read smaller than Latin at the same px; compensate once, in one place
export const FA_SIZE = 1.1;
export const FA_LH = 1.5;
export const fs = (px: number) => Math.round(px * FA_SIZE);

/** Persian text style: no letter-spacing/uppercase (they break joining), RTL, slightly larger. */
export const faText = (px: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontSize: fs(px),
  letterSpacing: 0,
  textTransform: "none",
  direction: "rtl",
  unicodeBidi: "plaintext",
  ...extra,
});

// ---- direction helper: +1 means "toward the reading direction". In RTL the reading direction is leftwards (-x).
export const dir = (dx: number) => -dx; // flip a physical x offset
/** CSS clip-path inset that reveals from the START (right) edge. progress 0..1 */
export const revealFromStart = (progress: number) => `inset(0 0 0 ${(100 * (1 - progress)).toFixed(3)}%)`;

// ---- digits
const FA = "۰۱۲۳۴۵۶۷۸۹";
export const faDigits = (v: string | number): string => String(v).replace(/\d/g, (d) => FA[Number(d)]);

// ---- Persian joining: letters that never join forward end a group
const NON_JOINERS = "اآأإدذرزژو";
const DIGITS = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩0123456789";
/** Connected letter groups (+ " " separators). Animate these, never single code points. */
export const joinedGroups = (text: string): string[] => {
  const out: string[] = [];
  let cur = "";
  for (const ch of String(text)) {
    if (ch === " ") { if (cur) { out.push(cur); cur = ""; } out.push(" "); continue; }
    if (ch === "\u200c") { if (cur) { out.push(cur); cur = ""; } continue; }
    cur += ch;
    if (NON_JOINERS.includes(ch) || DIGITS.includes(ch)) { out.push(cur); cur = ""; }
  }
  if (cur) out.push(cur);
  return out;
};
export const words = (text: string): string[] => String(text).split(/(\s+)/).filter(Boolean);

/** Typewriter: prefix of `text` at progress p (0..1). Prefix slicing keeps correct Persian shaping. */
export const typeOn = (text: string, p: number): string => {
  const chars = [...text];
  return chars.slice(0, Math.floor(Math.max(0, Math.min(1, p)) * chars.length + 1e-6)).join("");
};

