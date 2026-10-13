// Animated client emblem for the gate scene. CONFIDENTIALITY: no logo path data lives in this
// (tracked) file — the layered SVG and its layer metadata are fetched at render time from the
// gitignored public/uni-local/ directory (copied from media/briefs-local/university-admissions/logo/).
// The four layer groups (left-wing, right-wing, shield, pen-element) are inlined as React nodes and
// animated around the transform origins published in layers.json. Colours are the emblem's own
// (never recoloured); the pen element is white, so it lands on a dark ink dot for contrast.
import React from "react";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";

type LayerMeta = {bbox_vb?: number[]; centre_vb?: number[]; transform_origin_vb: [number, number]};
type EmblemMeta = {layers: Record<string, LayerMeta>};
export type EmblemData = {groups: Record<string, string>; meta: EmblemMeta};

const IDS = ["left-wing", "right-wing", "shield", "pen-element"] as const;

let cache: Promise<EmblemData> | null = null;
const load = (): Promise<EmblemData> =>
  (cache ??= Promise.all([
    fetch(staticFile("uni-local/emblem-layers.svg")).then((r) => r.text()),
    fetch(staticFile("uni-local/layers.json")).then((r) => r.json() as Promise<EmblemMeta>),
  ]).then(([svg, meta]) => {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const groups: Record<string, string> = {};
    for (const id of IDS) {
      const g = doc.getElementById(id);
      if (!g) return cancelRender(new Error(`emblem layer missing: ${id}`));
      groups[id] = g.innerHTML;
    }
    return {groups, meta};
  }));

/** Loads (once) and exposes the emblem layer groups; suspends the render until resolved. */
const useEmblem = (): EmblemData | null => {
  const [handle] = React.useState(() => delayRender("uni-emblem"));
  const [data, setData] = React.useState<EmblemData | null>(null);
  React.useEffect(() => {
    let alive = true;
    load().then(
      (d) => {
        if (alive) setData(d);
        continueRender(handle);
      },
      (err) => cancelRender(err),
    );
    return () => {
      alive = false;
    };
  }, [handle]);
  return data;
};

export interface EmblemProps {
  x: number; // centre x (px, frame coordinates)
  y: number; // centre y
  h: number; // rendered height of the emblem plate
  wingOpen: number; // 0 = wings folded shut over the spine, 1 = fully open (already eased)
  shieldIn: number; // 0..1 drop-and-settle progress (already eased, may overshoot slightly)
  penDot: number; // 0..1 ink-dot pop under the pen element
  penIn: number; // 0..1 pen-element landing progress (already eased)
  plate: string; // plate fill (paper)
  rim: string; // plate rim ring (sand)
  dot: string; // ink dot under the pen element (ink)
}

/** The emblem drawn on a round plate. Content viewBox 150 30 700 940 (art spans x 221-779, y 70-930).
 *  Wings rotate about the spine origin from layers.json, like a book opening from both sides.
 *  Overflow is visible so the folded wings may extend past the plate mid-flight. */
export const Emblem: React.FC<EmblemProps> = ({x, y, h, wingOpen, shieldIn, penDot, penIn, plate, rim, dot}) => {
  const em = useEmblem();
  if (!em) return null;
  const W = 700, H = 940, w = h * (W / H);
  const pen = em.meta.layers["pen-element"];
  const penCx = pen.centre_vb?.[0] ?? 500, penCy = pen.centre_vb?.[1] ?? 375.7;
  const dotR = pen.bbox_vb ? (pen.bbox_vb[2] - pen.bbox_vb[0]) / 2 + 12 : 48;
  const wing = (id: (typeof IDS)[number], dir: 1 | -1) => {
    const o = em.meta.layers[id].transform_origin_vb;
    const a = (dir * 74 * (1 - wingOpen)).toFixed(2);
    return (
      <g key={id} transform={`rotate(${a} ${o[0]} ${o[1]})`} opacity={Math.min(1, wingOpen * 4)}
        dangerouslySetInnerHTML={{__html: em.groups[id]}} />
    );
  };
  return (
    <svg width={w} height={h} viewBox={`150 30 ${W} ${H}`}
      style={{position: "absolute", left: x - w / 2, top: y - h / 2, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={500} cy={500} r={462} fill={plate} stroke={rim} strokeWidth={16} />
      {wing("left-wing", 1)}
      {wing("right-wing", -1)}
      <g transform={`translate(0 ${(-380 * (1 - shieldIn)).toFixed(1)})`} opacity={Math.min(1, shieldIn * 5)}
        dangerouslySetInnerHTML={{__html: em.groups.shield}} />
      <circle cx={penCx} cy={penCy} r={dotR * Math.max(0.001, penDot)} fill={dot} opacity={penDot} />
      <g transform={`translate(0 ${(-170 * (1 - penIn)).toFixed(1)})`} opacity={Math.min(1, penIn * 4)}
        dangerouslySetInnerHTML={{__html: em.groups["pen-element"]}} />
    </svg>
  );
};
