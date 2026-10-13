// Single safe-area / size table keyed by aspect ratio, same pattern as film/social/layout.ts.
// Scene slots are fractions [x, y, w, h] of the SAFE box (not of the frame).
// Safe zones from the brief: 9:16 top 250 / bottom 400 / side 90; 4:5 top 110 / bottom 150 / side 90;
// 1:1 top 90 / bottom 110 / side 90; 16:9 side 160 (top 90 / bottom 110).
// 1:1 rule from the brief: the text column is a centred STACKED column at most 80 % of W wide
// (the social film's 1:1 hook slot was only 8 % wide — that is why this table exists).
export type Aspect = "9:16" | "1:1" | "4:5" | "16:9";
export type Frac = readonly [number, number, number, number];

export const SCENES = ["hook", "breadth", "scale", "research", "excellence", "support", "place", "gate"] as const;
export type SceneName = (typeof SCENES)[number];
export type SlotName = `${SceneName}Text` | `${SceneName}Art`;
export type Slots = Record<SlotName, Frac>;

export interface LayoutRow {
  W: number;
  H: number;
  safe: {top: number; bottom: number; side: number};
  type: {hero: number; h1: number; h2: number; body: number; label: number; digit: number};
  penScale: number;
  slots: Slots;
}

/** Stacked layout: text column on top, art below. */
const stacked = (split: number, insetX = 0): Slots =>
  Object.fromEntries(
    SCENES.flatMap((n): [SlotName, Frac][] => [
      [`${n}Text`, [insetX, 0, 1 - 2 * insetX, split]],
      [`${n}Art`, [insetX, split, 1 - 2 * insetX, 1 - split]],
    ]),
  ) as Slots;

/** Wide layout: text left, art right (16:9). */
const wide = (): Slots =>
  Object.fromEntries(
    SCENES.flatMap((n): [SlotName, Frac][] => [
      [`${n}Text`, [0, 0.04, 0.52, 0.92]],
      [`${n}Art`, [0.55, 0.04, 0.45, 0.92]],
    ]),
  ) as Slots;

/** Square layout: centred stacked column, text width at most 80 % of W.
 *  Safe box is 900 px wide at 1080 W, so 0.94 of the safe box = 846 px < 864 px (0.8 * W). */
const square = (): Slots =>
  Object.fromEntries(
    SCENES.flatMap((n): [SlotName, Frac][] => [
      [`${n}Text`, [0.03, 0.02, 0.94, 0.52]],
      [`${n}Art`, [0.06, 0.58, 0.88, 0.4]],
    ]),
  ) as Slots;

export const LAYOUT: Record<Aspect, LayoutRow> = {
  "9:16": {
    W: 1080, H: 1920,
    safe: {top: 250, bottom: 400, side: 90},
    type: {hero: 230, h1: 132, h2: 92, body: 64, label: 60, digit: 520},
    penScale: 1.25,
    slots: stacked(0.45),
  },
  "4:5": {
    W: 1080, H: 1350,
    safe: {top: 110, bottom: 150, side: 90},
    type: {hero: 170, h1: 104, h2: 74, body: 52, label: 50, digit: 360},
    penScale: 0.95,
    slots: stacked(0.5),
  },
  "1:1": {
    W: 1080, H: 1080,
    safe: {top: 90, bottom: 110, side: 90},
    type: {hero: 150, h1: 90, h2: 64, body: 46, label: 44, digit: 300},
    penScale: 0.92,
    slots: square(),
  },
  "16:9": {
    W: 1920, H: 1080,
    safe: {top: 90, bottom: 110, side: 160},
    type: {hero: 170, h1: 96, h2: 70, body: 48, label: 46, digit: 360},
    penScale: 1.0,
    slots: wide(),
  },
};

export interface Box {x: number; y: number; w: number; h: number}

/** Pixel box of a slot inside the safe area of the given layout row. */
export const slot = (L: LayoutRow, name: SlotName): Box => {
  const sx = L.safe.side, sy = L.safe.top;
  const sw = L.W - 2 * L.safe.side, sh = L.H - L.safe.top - L.safe.bottom;
  const [fx, fy, fw, fh] = L.slots[name];
  return {x: sx + fx * sw, y: sy + fy * sh, w: fw * sw, h: fh * sh};
};
