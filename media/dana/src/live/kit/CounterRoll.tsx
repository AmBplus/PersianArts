// Big Persian counter: tabular, fixed-width digit cells (digits never collide), thousands separator '٬', OUT_EXPO count-up.
import React from "react";
import {palette} from "./tokens";
import {E, clamp} from "./easing";
import {faDigits, faNumber} from "./fa";

export const CounterRoll: React.FC<{
  value: number; p: number; x: number; y: number; size?: number; color?: string; weight?: number;
  settle?: number;               // seconds since the count finished (drives a small pop + glow)
  glow?: string; opacity?: number;
}> = ({value, p, x, y, size = 220, color = palette.ice, weight = 700, settle = -1, glow = palette.blueSky, opacity = 1}) => {
  const e = E.outExpo(clamp(p));
  const txt = faNumber(value * e);
  const finalTxt = faNumber(value);
  const pop = settle >= 0 ? 1 + 0.045 * Math.exp(-settle * 7) * Math.cos(settle * 22) : 1;
  const chars = [...txt];
  const finalChars = [...finalTxt];
  // right-align digits inside a box as wide as the final number so the number grows from the right (like reading) with fixed cells
  const cell = size * 0.56;
  const sep = size * 0.26;
  const wFor = (c: string) => (c === "٬" ? sep : cell);
  const totalW = finalChars.reduce((s, c) => s + wFor(c), 0);
  const startPad = totalW - chars.reduce((s, c) => s + wFor(c), 0);
  return (
    <div style={{position: "absolute", left: x - totalW / 2, top: y, width: totalW, height: size * 1.2, transform: `translateY(-50%) scale(${pop})`, opacity, direction: "ltr", display: "flex", justifyContent: "flex-start"}}>
      <div style={{width: startPad}} />
      {chars.map((c, i) => (
        <div key={i} style={{width: wFor(c), textAlign: "center", fontFamily: '"Estedad", system-ui', fontVariantNumeric: "tabular-nums", fontWeight: weight, fontSize: size, lineHeight: 1.2, color, letterSpacing: 0, textShadow: `0 0 ${size * 0.18}px ${glow}${settle >= 0 ? "AA" : "55"}`}}>
          {c}
        </div>
      ))}
    </div>
  );
};
export {faDigits};
