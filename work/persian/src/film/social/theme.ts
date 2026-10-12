// ONE theme object: every colour, font and weight the social film uses. Swap THEME for another object of the same shape to re-theme.
export type Theme = typeof THEME;

export const THEME = {
  name: "ink-and-paper",
  fonts: {
    // Headlines: Vazirmatn variable (heavy weights). Body/labels: Estedad variable. Both loaded and verified in fonts.tsx.
    head: "Vazirmatn",
    body: "Estedad",
    files: {Vazirmatn: "fonts/Vazirmatn-Variable.ttf", Estedad: "fonts/Estedad-Variable.ttf"},
  },
  weights: {hero: 900, head: 850, sub: 700, body: 500, label: 600},
  colors: {
    ink: "#16141f",
    paper: "#f6efe2",
    coral: "#ff5a4e",
    blue: "#2547d0",
    yellow: "#ffcf3a",
    mint: "#3ad6a0",
    // per-scene backgrounds (scene order) — the wipe between scenes uses the next one
    bg: ["#ff5a4e", "#16141f", "#f6efe2", "#2547d0", "#ffcf3a", "#16141f"],
    // per-scene main text colour (same order)
    fg: ["#16141f", "#f6efe2", "#16141f", "#f6efe2", "#16141f", "#f6efe2"],
    // character
    penBody: "#ffcf3a",
    penCap: "#ff5a4e",
    penBand: "#16141f",
    penTip: "#16141f",
    penFace: "#16141f",
    inkMessy: "#16141f",
    inkGood: "#f6efe2",
    accent: "#3ad6a0",
  },
  stroke: {ink: 14, inkThin: 9, outline: 6},
} as const;
