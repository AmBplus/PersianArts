// The film's character: a pen with a face, plus the ink line it writes.
// State parameters (all driven by scenes as functions of frame):
//   mood  -1 (ashamed frown) .. +1 (proud smile)
//   sharp  0 (blunt marker tip) .. 1 (fine calligraphy nib)   -> shape morph
//   calm   0 (eyes open) .. 1 (eyes closed, focused)
//   tremble amplitude in degrees (shaky hand)
import React from "react";
import {THEME} from "./theme";
import {lerp} from "./motion";

const C = THEME.colors;
const BLUNT = [[-34, 60], [34, 60], [30, 96], [0, 108], [-30, 96]] as const;
const SHARP = [[-34, 60], [34, 60], [13, 128], [0, 168], [-13, 128]] as const;
const tipY = (sharp: number) => lerp(BLUNT[3][1], SHARP[3][1], sharp);

export interface PenState {mood: number; sharp: number; calm: number; tremble: number; angle?: number}

/** Pen whose writing TIP sits exactly at (x, y) in the parent SVG's pixel space. */
export const Pen: React.FC<PenState & {x: number; y: number; scale: number; frame: number; squash?: number}> = ({
  x, y, scale, frame, mood, sharp, calm, tremble, angle = 28, squash = 1,
}) => {
  const a = angle + tremble * Math.sin(frame * 1.9) + tremble * 0.5 * Math.sin(frame * 3.7);
  const rad = (a * Math.PI) / 180;
  const ty = tipY(sharp) * scale;
  const ox = x + ty * Math.sin(rad);
  const oy = y - ty * Math.cos(rad);
  const tip = BLUNT.map((p, i) => [lerp(p[0], SHARP[i][0], sharp), lerp(p[1], SHARP[i][1], sharp)]);
  const mouthY = -96;
  const ctrl = mouthY + 18 * mood;
  const browTilt = -8 * Math.min(0, mood); // sad brows lift in the middle
  const eyeOpen = Math.max(0.08, 1 - calm);
  return (
    <g transform={`translate(${ox} ${oy}) rotate(${a}) scale(${scale} ${scale * squash})`}>
      <ellipse cx={0} cy={-80} rx={44} ry={170} fill="rgba(0,0,0,0.12)" transform="translate(10 12)" />
      <polygon points={tip.map((p) => p.join(",")).join(" ")} fill={C.penTip} />
      <rect x={-36} y={-240} width={72} height={290} rx={30} fill={C.penBody} stroke={C.penBand} strokeWidth={THEME.stroke.outline} />
      <rect x={-36} y={-240} width={72} height={56} rx={26} fill={C.penCap} stroke={C.penBand} strokeWidth={THEME.stroke.outline} />
      <rect x={-37} y={28} width={74} height={32} fill={C.penBand} />
      {/* face */}
      {[-14, 14].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-132} rx={7} ry={9 * eyeOpen} fill={C.penFace} />
          <line x1={ex - 9} x2={ex + 9} y1={-152 + (ex < 0 ? browTilt : -browTilt) * 0.5} y2={-152 - (ex < 0 ? browTilt : -browTilt) * 0.5}
            stroke={C.penFace} strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <path d={`M -15 ${mouthY} Q 0 ${ctrl} 15 ${mouthY}`} stroke={C.penFace} strokeWidth={5} fill="none" strokeLinecap="round" />
      {mood > 0.5 ? (
        <>
          <circle cx={-24} cy={-110} r={6} fill={C.coral} opacity={(mood - 0.5) * 1.6} />
          <circle cx={24} cy={-110} r={6} fill={C.coral} opacity={(mood - 0.5) * 1.6} />
        </>
      ) : null}
    </g>
  );
};

/** Ink-line points, written right-to-left (Persian direction): x from x0 (right) to x1 (left). */
export const inkPoints = (
  // jag: shaky-hand noise; decay > 0 makes the noise fade along the line (the hand calming down);
  // loop > 0 turns the wave into smooth calligraphic loops of that radius.
  o: {x0: number; x1: number; y: number; amp: number; waves: number; jag: number; seed: number; decay?: number; loop?: number},
  n = 160,
) => {
  const pts: [number, number][] = [];
  const loop = o.loop ?? 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ph = 2 * Math.PI * o.waves * t;
    const jag = o.jag * Math.pow(1 - t, o.decay ?? 0) * (Math.sin(t * 97 + o.seed * 3) * 0.6 + Math.sin(t * 231 + o.seed) * 0.4);
    const x = lerp(o.x0, o.x1, t) - loop * Math.sin(ph);
    const y = o.y + (loop ? -loop * 0.7 * (1 - Math.cos(ph)) : o.amp * Math.sin(ph + o.seed)) + jag;
    pts.push([x, y]);
  }
  return pts;
};

/** Prefix of a point list up to `p` (0..1) with the end point interpolated: the written-so-far line. */
export const partial = (pts: [number, number][], p: number) => {
  const n = pts.length - 1;
  const k = Math.max(0, Math.min(n, p * n));
  const i = Math.floor(k);
  const out = pts.slice(0, i + 1);
  if (i < n) {
    const r = k - i;
    out.push([lerp(pts[i][0], pts[i + 1][0], r), lerp(pts[i][1], pts[i + 1][1], r)]);
  }
  return out;
};

export const toPath = (pts: [number, number][]) => (pts.length < 2 ? "" : "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L "));
