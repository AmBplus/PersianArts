// MarkerUnderline — ported MOTION from shotcraft card
// `typography/marker-underline-title/MarkerUnderlineTitle.tsx` (8f draw). Kept from the card: the
// hand-drawn marker stroke geometry (seeded mulberry32(77), 40 samples; mid-line with a gentle
// slope + slow sine wobble + low-freq skew; width profile thin start → fat middle → tapered tip
// with high-frequency roughness) and the DRAW: clip rect that grows from the READING-START (right)
// edge leftwards with ease (1 - (1-p)^2.2) — identical to the card's mirrored reveal, so the pen
// follows Persian writing direction. The stroke path itself is mirrored (scaleX(-1)) like the card.
// Primitive changes: fully PROGRESS-driven; colour from tokens — 'gold' #F2B84B (spec allows it
// here) or 'blueMid' #2F7BFF. Usage: wrap the target phrase in a relative inline-block span and
// drop <MarkerUnderline/> inside it; it positions itself under the box (card offset right:-6
// bottom:-12). Thickness scales with `width` so it fits other font sizes.
import React, {useId} from "react";
import {clamp} from "../easing";
import {palette} from "../tokens";

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** marker stroke: slightly skewed mid-path + variable-width outline polygon (card geometry) */
const buildStroke = (len: number, seed: number, k: number) => {
  const rand = mulberry32(seed);
  const N = 40;
  const top: string[] = [];
  const bot: string[] = [];
  const wob = Array.from({length: N + 1}, () => rand() - 0.5);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = t * len;
    // mid-line: gentle rise along the draw + slow wave + low-freq skew (card)
    const mid = (19 - t * 9 + Math.sin(t * Math.PI * 1.6 + 0.4) * 2.6 + wob[i] * 1.6) * k;
    // width: thin lead-in → fat middle → tapered tail, with high-freq roughness (card)
    const wBase = (14 + Math.sin(t * Math.PI) * 6 - Math.max(0, t - 0.86) * 46) * k;
    const w = Math.max(2.2 * k, wBase + wob[i] * 3 * k);
    top.push(`${x.toFixed(1)},${(mid - w / 2).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(mid + w / 2).toFixed(1)}`);
  }
  return `M${top.join("L")}L${bot.reverse().join("L")}Z`;
};

export const MarkerUnderline: React.FC<{
  /** 0..1 draw progress (parent derives it from the frame) */
  progress: number;
  color?: "gold" | "blueMid";
  /** stroke length in px (card: 276 under a 130px word); thickness scales with it */
  width?: number;
}> = ({progress, color = "gold", width = 276}) => {
  const p = clamp(progress);
  const drawE = 1 - Math.pow(1 - p, 2.2); // card draw ease
  // per-instance clip id (useId's ":" is illegal in url(), strip it)
  const revealId = `mu-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const k = width / 276;
  const LEN = width;
  const H = Math.round(44 * k) + 8;
  const ink = color === "gold" ? palette.gold : palette.blueMid;
  const path = buildStroke(LEN, 77, k);

  return (
    <svg
      width={LEN}
      height={H}
      viewBox={`0 0 ${LEN} ${H}`}
      style={{position: "absolute", right: -6 * k, bottom: -12 * k, overflow: "visible", pointerEvents: "none"}}
      aria-hidden
    >
      <defs>
        <clipPath id={revealId}>
          {/* rect grows from x=LEN leftwards: reveal follows the writing direction (right → left) */}
          <rect x={0} y={-20} width={drawE * (LEN + 6)} height={60 * k + 20} transform={`translate(${LEN} 0) scale(-1 1)`} />
        </clipPath>
      </defs>
      {p > 0 && (
        <g clipPath={`url(#${revealId})`}>
          <path d={path} fill={ink} transform={`translate(${LEN} 0) scale(-1 1)`} />
        </g>
      )}
    </svg>
  );
};

export default MarkerUnderline;
