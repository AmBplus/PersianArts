// Single safe-area / size table keyed by aspect ratio. ALL pixel geometry of the film lives here.
// Scene slots are fractions [x, y, w, h] of the SAFE box (not of the frame), so a new ratio only needs a new row.
// 9:16 rule: nothing important in the top 12 % or bottom 20 % of the frame (Reels/Shorts UI), sides ~8 %.
export type Aspect = "9:16" | "1:1" | "4:5" | "16:9";
export type Frac = readonly [number, number, number, number];

export interface LayoutRow {
  W: number;
  H: number;
  safe: {top: number; bottom: number; side: number};
  type: {hero: number; h1: number; h2: number; body: number; label: number; digit: number};
  penScale: number;
  slots: {
    hookText: Frac; hookArt: Frac;
    countText: Frac; countArt: Frac;
    penText: Frac; penArt: Frac;
    slowText: Frac; slowArt: Frac;
    listTitle: Frac; listRows: Frac;
    ctaText: Frac; ctaArt: Frac;
  };
}

const portraitSlots = {
  hookText: [0, 0, 1, 0.5], hookArt: [0, 0.52, 1, 0.48],
  countText: [0, 0.02, 1, 0.62], countArt: [0, 0.66, 1, 0.34],
  penText: [0, 0, 1, 0.3], penArt: [0, 0.3, 1, 0.7],
  slowText: [0, 0.08, 1, 0.34], slowArt: [0, 0.48, 1, 0.5],
  listTitle: [0, 0, 1, 0.16], listRows: [0, 0.19, 1, 0.81],
  ctaText: [0, 0.5, 1, 0.42], ctaArt: [0, 0, 1, 0.46],
} as const;

export const LAYOUT: Record<Aspect, LayoutRow> = {
  "9:16": {
    W: 1080, H: 1920,
    safe: {top: 250, bottom: 400, side: 90},
    type: {hero: 230, h1: 132, h2: 92, body: 64, label: 60, digit: 520},
    penScale: 1.25,
    slots: portraitSlots,
  },
  "4:5": {
    W: 1080, H: 1350,
    safe: {top: 110, bottom: 150, side: 90},
    type: {hero: 170, h1: 104, h2: 74, body: 52, label: 50, digit: 360},
    penScale: 0.95,
    slots: {
      ...portraitSlots,
      hookText: [0, 0, 1, 0.55], hookArt: [0, 0.56, 1, 0.44],
      listTitle: [0, 0, 1, 0.18], listRows: [0, 0.2, 1, 0.8],
    },
  },
  "1:1": {
    W: 1080, H: 1080,
    safe: {top: 90, bottom: 110, side: 90},
    type: {hero: 150, h1: 90, h2: 64, body: 46, label: 44, digit: 300},
    penScale: 0.92,
    slots: {
      hookText: [0.46, 0, 0.54, 1], hookArt: [0, 0.04, 0.46, 0.92],
      countText: [0.4, 0, 0.6, 1], countArt: [0, 0.04, 0.42, 0.92],
      penText: [0.5, 0.1, 0.5, 0.8], penArt: [0, 0, 0.5, 1],
      slowText: [0, 0, 1, 0.4], slowArt: [0, 0.45, 1, 0.55],
      listTitle: [0, 0, 1, 0.18], listRows: [0, 0.2, 1, 0.8],
      ctaText: [0.46, 0.1, 0.54, 0.8], ctaArt: [0, 0, 0.46, 1],
    },
  },
  "16:9": {
    W: 1920, H: 1080,
    safe: {top: 90, bottom: 110, side: 160},
    type: {hero: 170, h1: 96, h2: 70, body: 48, label: 46, digit: 360},
    penScale: 1.0,
    slots: {
      hookText: [0.5, 0, 0.5, 1], hookArt: [0, 0.04, 0.5, 0.92],
      countText: [0.45, 0, 0.55, 1], countArt: [0, 0.04, 0.45, 0.92],
      penText: [0.5, 0.15, 0.5, 0.7], penArt: [0, 0, 0.5, 1],
      slowText: [0, 0, 1, 0.42], slowArt: [0, 0.46, 1, 0.54],
      listTitle: [0.57, 0.3, 0.43, 0.4], listRows: [0, 0, 0.55, 1],
      ctaText: [0.5, 0.1, 0.5, 0.8], ctaArt: [0, 0, 0.5, 1],
    },
  },
};

export interface Box {x: number; y: number; w: number; h: number}

/** Pixel box of a slot inside the safe area of the given layout row. */
export const slot = (L: LayoutRow, name: keyof LayoutRow["slots"]): Box => {
  const sx = L.safe.side, sy = L.safe.top;
  const sw = L.W - 2 * L.safe.side, sh = L.H - L.safe.top - L.safe.bottom;
  const [fx, fy, fw, fh] = L.slots[name];
  return {x: sx + fx * sw, y: sy + fy * sh, w: fw * sw, h: fh * sh};
};
