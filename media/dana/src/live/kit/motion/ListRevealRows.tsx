// T2 primitive — ListRevealRows. Motion ported from shotcraft card
// ui-entrance/list-reveal/ListReveal.tsx (Persian version).
// Kept from the card (all six stagger windows' shape, frame-deterministic):
//  - per-row entrance: outBack (k = 1.7) over 0.24s, staggered every 0.09s from 0.06s
//    (converted to frames: dur 7f, per-row 2.7f, start 1.8f — kept as fractions of the
//    card's timings via props);
//  - opacity = min(1, p*2.2), scale = 0.78 + p*0.22, translateY 14 -> 0;
//  - container drift: +16px -> -16px over the whole clip (lerp on absolute time);
//  - compact row cards with a small color swatch leading each row.
// Changed for the film kit: multi-hue swatches -> blue-token gradients, row palette ->
// navy tokens, size scaled to 1920x1080 film coordinates, RTL kept (marker on the right,
// labels read right-to-left).
import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {E, lerp, clamp} from "../easing";
import {faStyle} from "../fa";

// Card seconds @30fps -> frames.
const START_F = 1.8;
const PER_F = 2.7;
const DUR_F = 7.2;

export const ListRevealRows: React.FC<{
  rows: string[];
  x?: number;
  y?: number;
  w?: number;
  rowH?: number;
  gap?: number;
  size?: number;
  startFrame?: number;
  perRowFrames?: number;
}> = ({rows, x = 960, y = 540, w = 560, rowH = 48, gap = 10, size = 26, startFrame = START_F, perRowFrames = PER_F}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const totalH = rows.length * rowH + (rows.length - 1) * gap;
  const top = y - totalH / 2;

  // Container drift (card: translateY lerp(t, 16, -16) over the full clip).
  const drift = lerp(clamp(durationInFrames > 0 ? frame / durationInFrames : 0), 16, -16);

  // Blue-token swatch gradients (card: per-row hue swatches).
  const swatches = [
    `linear-gradient(140deg, #6AB8FF, #2F7BFF)`,
    `linear-gradient(140deg, #2F7BFF, #0B3AA8)`,
    `linear-gradient(140deg, #EAF2FF, #6AB8FF)`,
    `linear-gradient(140deg, #6AB8FF, #0B3AA8)`,
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top,
        width: w,
        display: "flex",
        flexDirection: "column",
        gap,
        transform: `translateY(${drift}px)`,
        direction: "rtl",
      }}
    >
      {rows.map((label, i) => {
        const p = E.outBack(1.7)(clamp((frame - startFrame - i * perRowFrames) / DUR_F));
        const pe = Math.max(0, p);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: `6px 18px`,
              borderRadius: 10,
              background: "rgba(6,16,48,0.85)",
              border: "1px solid rgba(11,31,92,0.95)",
              height: rowH,
              boxSizing: "border-box",
              opacity: Math.min(1, p * 2.2),
              transform: `scale(${0.78 + pe * 0.22}) translateY(${14 * (1 - pe)}px)`,
            }}
          >
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 5,
                flex: "none",
                background: swatches[i % swatches.length],
              }}
            />
            <div style={{...faStyle(size, {fontWeight: 600, color: "rgba(234,242,255,0.92)", lineHeight: 1.25}), whiteSpace: "nowrap"}}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
