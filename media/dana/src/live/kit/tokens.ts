// Design tokens for the Dana film. Values are hard-coded copies of script/cue-sheet.json
// ("palette" and "fonts"). If the cue sheet changes, update this file by hand.
export const palette = {
  navy0: "#040A22",
  navy1: "#061030",
  navy2: "#0B1F5C",
  blueDeep: "#0B3AA8",
  blueMid: "#2F7BFF",
  blueSky: "#6AB8FF",
  ice: "#EAF2FF",
  paper: "#F7FAFF",
  ink: "#0A1A4A",
  gold: "#F2B84B",
} as const;

export const fonts = {
  display: "Noto Nastaliq Urdu",
  headline: "Estedad",
  body: "Estedad",
  numerals: "Estedad",
  org: "Estedad",
} as const;

export type PaletteKey = keyof typeof palette;
export type FontKey = keyof typeof fonts;
