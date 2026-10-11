// HeroWord — ported MOTION from shotcraft card `typography/title-demote-to-label/TitleDemoteToLabel.tsx`
// (92f variant A). Kept from the card: 12f blur+opacity reveal (out-cubic) on the word, then HOLD,
// then the DEMOTE tween position+scale to a small label slot in one continuous move (card: 20f to the
// top corner at scale 0.3; spec restates the demote ease as OUT_QUINT), transformOrigin on the
// reading-start edge, whiteSpace nowrap, rtl.
// Primitive changes (per spec table): the word now LANDS at `to` coming from `from`
// (OUT_EXPO + a small settle dip at touchdown), holds `holdFrames` while the variable font pulses
// its weight 700↔800 (sin of frame — frame-deterministic), then demotes. Demote target defaults to
// the top-right label slot (reading-start corner, like the card) at scale to.scale*0.3; override
// with `demoteTo`. Estedad variable (100..900) supplies both weights.
import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {palette} from "../tokens";
import {E} from "../easing";

export type XYScale = {x: number; y: number; scale: number};

export const HeroWord: React.FC<{
  text: string;
  from: XYScale;
  to: XYScale;
  /** frames for the landing flight from `from` to `to` */
  landFrame: number;
  /** frames the word holds at `to` (weight pulse 700↔800) before demoting */
  holdFrames: number;
  /** frames for the demote tween to the label slot (OUT_QUINT) */
  demoteDurFrames: number;
  color?: string;
  size?: number;
  /** demote destination; default = top-right label slot at to.scale*0.3 (card behaviour) */
  demoteTo?: XYScale;
}> = ({text, from, to, landFrame, holdFrames, demoteDurFrames, color = palette.ice, size = 120, demoteTo}) => {
  const frame = useCurrentFrame();
  const target: XYScale = demoteTo ?? {x: 1650, y: 130, scale: to.scale * 0.3};

  // 12f reveal: blur 12→0 + fade (card)
  const rev = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // landing: OUT_EXPO flight (spec), position+scale in one tween
  const lp = interpolate(frame, [0, landFrame], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const e = E.outExpo(lp);

  // small settle at touchdown: scale dips ~3% and recovers over 12f (spec: "settle کوچک")
  const settle = interpolate(frame, [landFrame - 2, landFrame + 3, landFrame + 7, landFrame + 12], [1, 0.968, 1.004, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // hold: variable-weight pulse 700↔800, ~1.6s sine of the frame (frame-deterministic)
  const holdStart = landFrame;
  const holdEnd = landFrame + holdFrames;
  const inHold = frame >= holdStart && frame < holdEnd;
  const weight = inHold ? 750 + 50 * Math.sin(((frame - holdStart) / 48) * Math.PI * 2) : 800;

  // demote: OUT_QUINT to the label slot (spec ease; card did the same move in 20f inOut-cubic)
  const demStart = holdEnd;
  const d = interpolate(frame, [demStart, demStart + demoteDurFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const de = E.outQuint(d);

  // demote should not fight the landing while d==0 and lp==1 → x,y,scale pick the right source
  const x = d > 0 ? to.x + (target.x - to.x) * de : from.x + (to.x - from.x) * e;
  const y = d > 0 ? to.y + (target.y - to.y) * de : from.y + (to.y - from.y) * e;
  const baseScale = d > 0 ? to.scale + (target.scale - to.scale) * de : from.scale + (to.scale - from.scale) * e;
  const scale = baseScale * (d > 0 ? 1 : settle);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
        opacity: rev,
        filter: rev < 0.999 ? `blur(${(1 - rev) * 12}px)` : undefined,
        fontFamily: '"Estedad", system-ui, sans-serif',
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.5,
        letterSpacing: 0,
        color,
        direction: "rtl",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export default HeroWord;
