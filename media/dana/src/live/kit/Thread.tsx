// The Blue Thread: the film's narrative anchor. A glowing path drawn between normalised progress `from`..`to` (0..1 of the path length).
// Tip: build paths in the 1920x1080 grid; morph between scenes by cross-fading two paths that share the anchor point.
import React from "react";
import {palette} from "./tokens";
import {clamp} from "./easing";

export interface ThreadProps {
  d: string;                 // SVG path in 1920x1080 coordinates
  from?: number;             // visible window start (0..1)
  to?: number;               // visible window end (0..1)  -> the "head"
  width?: number;            // core width px (default 6)
  color?: string;
  glow?: number;             // glow strength multiplier (default 1)
  opacity?: number;
  pulse?: number;            // 0..1 beat pulse (brightens the thread)
  head?: boolean;            // draw a bright dot at the head
  headSize?: number;
  dash?: string;             // optional dash pattern in px for the faint guide (e.g. "2 14")
}

export const Thread: React.FC<ThreadProps> = ({d, from = 0, to = 1, width = 6, color = palette.blueSky, glow = 1, opacity = 1, pulse = 0, head = false, headSize = 16}) => {
  const a = clamp(from), b = clamp(to);
  const len = Math.max(1e-4, b - a);
  const ref = React.useRef<SVGPathElement>(null);
  const [pt, setPt] = React.useState<{x: number; y: number} | null>(null);
  React.useLayoutEffect(() => {
    if (!head || !ref.current) return;
    const L = ref.current.getTotalLength();
    const p = ref.current.getPointAtLength(L * b);
    setPt({x: p.x, y: p.y});
  }, [d, b, head]);
  const dash = `${len} 2`;
  const off = -a;
  const boost = 1 + pulse * 0.7;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity}}>
      <path ref={ref} d={d} fill="none" stroke="none" />
      <g style={{filter: `blur(${12 * glow}px)`}} opacity={0.5 * boost}>
        <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width * 5} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      </g>
      <g style={{filter: `blur(${3 * glow}px)`}} opacity={0.9}>
        <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width * 1.8} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      </g>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      <path d={d} pathLength={1} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={Math.max(1.5, width * 0.4)} strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      {head && pt && b > 0.002 && b < 0.998 && (
        <g>
          <circle cx={pt.x} cy={pt.y} r={headSize * 1.8 * boost} fill={color} opacity={0.35} style={{filter: "blur(8px)"}} />
          <circle cx={pt.x} cy={pt.y} r={headSize * 0.5} fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
};

/** Helper to build a polyline/cubic path string from points. */
export const pathFromPoints = (pts: Array<[number, number]>) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
/** Smooth path through points (Catmull-Rom to cubic Bézier). */
export const smoothPath = (pts: Array<[number, number]>, tension = 0.5) => {
  if (pts.length < 3) return pathFromPoints(pts);
  let dStr = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    dStr += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return dStr;
};
