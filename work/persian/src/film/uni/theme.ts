// ONE theme object for the uni-admissions teaser, same shape as film/social/theme.ts.
// Palette sampled (approximate) from the client poster: navy #24344d ink on cream #f1e7cd paper,
// blue #295a99 accent, sand/gold #dcc9a8, warm grey #bdbcb3, taupe #ab9e84.
// CONTRAST RULE: cream on #3e7cbd is 3.54:1 -> NEVER used for small text; text is navy on cream only.
export type Theme = typeof THEME;

const SCENE_COUNT = 8; // hook, breadth, scale, research, excellence, support, place, gate

export const THEME = {
  name: "uni-navy-cream",
  fonts: {
    // Headlines: Vazirmatn variable (heavy weights). Body/labels: Estedad variable. Both loaded and verified in fonts.tsx.
    head: "Vazirmatn",
    body: "Estedad",
    files: {Vazirmatn: "fonts/Vazirmatn-Variable.ttf", Estedad: "fonts/Estedad-Variable.ttf"},
  },
  weights: {hero: 900, head: 850, sub: 700, body: 500, label: 600},
  colors: {
    ink: "#24344d",
    paper: "#f1e7cd",
    blue: "#295a99",
    sky: "#3e7cbd",
    sand: "#dcc9a8",
    grey: "#bdbcb3",
    taupe: "#ab9e84",
    // per-scene backgrounds (scene order) — the wipe between scenes uses the next one
    bg: Array<string>(SCENE_COUNT).fill("#f1e7cd"),
    // per-scene main text colour (same order): navy on cream, 10.2:1
    fg: Array<string>(SCENE_COUNT).fill("#24344d"),
    // character (pencil), re-coloured to the poster palette
    penBody: "#dcc9a8",
    penCap: "#24344d",
    penBand: "#295a99",
    penTip: "#24344d",
    penFace: "#24344d",
    inkMessy: "#24344d",
    inkGood: "#24344d",
    accent: "#295a99",
  },
  stroke: {ink: 14, inkThin: 9, outline: 6},
} as const;
