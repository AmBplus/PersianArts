// Tokens only (no client text). Palette sampled from the brand banners: bright blue, deep navy, cyan, pale sky.
export const CT = {
  deep: "#04112e", navy: "#071a45", ink: "#0b2a6b", blue: "#0a4fd0", mid: "#0a3a9a", cyan: "#27b6ff",
  sky1: "#f2f9ff", sky2: "#c6e3ff", amber: "#ffb020", white: "#ffffff",
} as const;
export const FONT_HEAD = "Vazirmatn", FONT_BODY = "Estedad";
export type Ratio = "16:9" | "9:16" | "1:1" | "4:5";
export const SIZES: Record<Ratio, {W: number; H: number; id: string}> = {
  "16:9": {W: 1920, H: 1080, id: "ConfL16x9"}, "9:16": {W: 1080, H: 1920, id: "ConfL9x16"},
  "1:1": {W: 1080, H: 1080, id: "ConfL1x1"}, "4:5": {W: 1080, H: 1350, id: "ConfL4x5"},
};
