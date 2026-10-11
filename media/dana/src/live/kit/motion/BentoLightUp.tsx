// T2 primitive — BentoLightUp. Motion ported from shotcraft card
// ui-entrance/wall-reveal-moves/BentoLightUp.tsx (Persian version).
// Kept from the card (timings in frames, all frame-deterministic):
//  - border light sweep: SVG rect, pathLength=100 dashoffset, 8f out-cubic, mirrored
//    with scaleX(-1) so the sweep starts top-RIGHT (RTL), then stroke fades 1 -> 0.4
//    over frames start+12..start+26 (out-quad);
//  - content: lit out-cubic on start+6..start+14, rise with bezier(0.3, 1.4, 0.5, 1)
//    (slight back-out overshoot), opacity 0.18 -> 1, translateY 20 -> 0;
//  - one-wave halo: glow = lit*(1-lit)*4 * (14 + jitter*6) px, brightest mid-lighting;
//  - camera push: whole grid scale 1 -> 1.04 over 25f, bezier(0.33, 0, 0.2, 1), starting
//    after the last tile settles (card: 96..121 for 6 tiles at gap 12).
// Changed for the film kit: amber -> blue-mid token (spec), grey cards -> navy tokens,
// fixed 3x2 -> parametrized grid (tiles + per-tile lightFrame), cell scale 0.96 -> 1
// added (spec B table), Card skeletons -> children content, fixed FIRST/GAP -> props.
import React from "react";
import {interpolate, Easing, useCurrentFrame} from "remotion";
import {rnd} from "../easing";
import {palette} from "../tokens";

export interface BentoTile {
  id: string;
  content: React.ReactNode;
  /** local frame at which this tile starts to light up */
  lightFrame: number;
}

const Tile: React.FC<{tile: BentoTile; i: number; frame: number; x: number; y: number; w: number; h: number; gap: number}> = ({tile, i, frame, x, y, w, h}) => {
  const start = tile.lightFrame;
  const draw = interpolate(frame, [start, start + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const strokeFade = interpolate(frame, [start + 12, start + 26], [1, 0.4], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad),
  });
  const lit = interpolate(frame, [start + 6, start + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const rise = interpolate(frame, [start + 6, start + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.3, 1.4, 0.5, 1),
  });
  const grow = interpolate(frame, [start, start + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  const jitter = rnd(i + 1); // deterministic per-tile micro-difference (card: |sin(i*127.3)*43758 % 1|)
  const glow = lit * (1 - lit) * 4 * (14 + jitter * 6);
  const opacity = 0.18 + 0.82 * lit;
  const ty = 20 * (1 - rise);
  const scale = 0.96 + 0.04 * grow;

  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          background: "linear-gradient(180deg, rgba(11,31,92,0.45), rgba(6,16,48,0.9))",
          border: "1px solid rgba(47,123,255,0.22)",
          boxShadow: `0 0 ${glow}px rgba(47,123,255,${(0.35 * lit * (1 - lit) * 4).toFixed(3)})`,
          opacity,
          transform: `translateY(${ty}px) scale(${scale})`,
          overflow: "hidden",
        }}
      >
        {tile.content}
      </div>
      {draw > 0 && (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{position: "absolute", left: 0, top: ty, overflow: "visible", transform: "scaleX(-1)", pointerEvents: "none"}}
        >
          <rect
            x={2}
            y={2}
            width={w - 4}
            height={h - 4}
            rx={14}
            fill="none"
            stroke={palette.blueMid}
            strokeWidth={4}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 * (1 - draw)}
            opacity={strokeFade}
            style={{filter: `drop-shadow(0 0 ${6 + jitter * 4}px ${palette.blueMid})`}}
          />
        </svg>
      )}
    </div>
  );
};

export const BentoLightUp: React.FC<{
  tiles: BentoTile[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  gap?: number;
  cols?: number;
}> = ({tiles, x = 960, y = 540, w = 340, h = 190, gap = 24, cols = 3}) => {
  const frame = useCurrentFrame();
  const rows = Math.ceil(tiles.length / cols);
  const totalW = cols * w + (cols - 1) * gap;
  const totalH = rows * h + (rows - 1) * gap;
  const left = x - totalW / 2;
  const top = y - totalH / 2;
  const lastStart = tiles.reduce((m, t) => Math.max(m, t.lightFrame), 0);

  // Camera push once everything has settled (card: 96 -> 121f, 1 -> 1.04).
  const push = interpolate(frame, [lastStart + 26, lastStart + 51], [1, 1.04], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.2, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: totalW,
        height: totalH,
        transform: `scale(${push})`,
        transformOrigin: "center",
      }}
    >
      {tiles.map((tile, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // RTL: tile 0 sits top-right; each row fills right-to-left (card: x = LEFT + (2-col)*...).
        return (
          <Tile
            key={tile.id}
            tile={tile}
            i={i}
            frame={frame}
            x={(cols - 1 - col) * (w + gap)}
            y={row * (h + gap)}
            w={w}
            h={h}
            gap={gap}
          />
        );
      })}
    </div>
  );
};
