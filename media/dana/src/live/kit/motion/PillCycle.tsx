// PillCycle — ported MOTION from shotcraft card `typography/pill-slot-cycle/PillSlotCycle.tsx` (12f
// per beat shown; swap window 8f). Kept from the card: slot-machine VALUE SWAP where the incoming
// pill slides up from +120px with motion blur (14→4→0, out-cubic over SWAP frames) while the
// outgoing pill accelerates up to -130px (in-cubic) fading with blur ×10; the pill that owns the
// slot width is the current value (invisible placeholder), swaps stack on the reading-start edge
// (insetInlineStart), nothing re-centres. Frame numbers come from props (valueAtFrame) instead of
// the card's fixed BEAT=21 ladder.
// Primitive changes: slot window is a MASKED box (spec: «غلت عمودی ۱۸۰° با ماسک») — overflow hidden
// clips the flight, so the swap reads as a roll inside a slot. Pill skin uses Dana tokens
// (blue-deep body, blue-mid border, ice text). No icon chip (no icons in the token set).
import React from "react";
import {interpolate, useCurrentFrame, Easing} from "remotion";
import {palette} from "../tokens";

const SWAP = 8; // card: swap completes in the first 8 frames of a beat

const Pill: React.FC<{label: string; size: number; style?: React.CSSProperties}> = ({label, size, style}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: `${Math.round(size * 0.12)}px ${Math.round(size * 0.5)}px`,
      borderRadius: 999,
      background: "rgba(11,58,168,0.38)",
      border: `3px solid ${palette.blueMid}`,
      boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      fontFamily: '"Estedad", system-ui, sans-serif',
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.5,
      letterSpacing: 0,
      color: palette.ice,
      whiteSpace: "nowrap",
      direction: "rtl",
      ...style,
    }}
  >
    {label}
  </div>
);

export const PillCycle: React.FC<{
  /** cycle values, e.g. ["کلاس زنده","در حال ضبط","آرشیو و بازپخش"] */
  values: string[];
  /** frame at which values[k] pops into the slot */
  valueAtFrame: number[];
  size?: number;
}> = ({values, valueAtFrame, size = 54}) => {
  const frame = useCurrentFrame();

  let k = -1;
  for (let i = 0; i < valueAtFrame.length && i < values.length; i++) {
    if (frame >= valueAtFrame[i]) k = i;
  }
  const rel = k >= 0 ? frame - valueAtFrame[k] : 0;
  const incoming = k >= 0 ? values[k] : null;
  const outgoing = k > 0 ? values[k - 1] : null;

  // incoming: +120px below, blur 14→4→0, out-cubic (card)
  const inT = interpolate(rel, [0, SWAP], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const inY = interpolate(inT, [0, 1], [120, 0]);
  const inBlur = interpolate(inT, [0, 0.7, 1], [14, 4, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  // outgoing: accelerate up to -130px, fade, blur ×10, in-cubic (card)
  const outT = interpolate(rel, [0, SWAP - 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic)});
  const outY = interpolate(outT, [0, 1], [0, -130]);

  return (
    <div style={{position: "relative", display: "inline-block", direction: "rtl"}}>
      {/* slot mask: only the resting pill is visible; the flight clips at the window edges */}
      <div style={{overflow: "hidden", padding: `0 ${Math.round(size * 0.1)}px`, borderRadius: 999}}>
        <div style={{position: "relative", display: "inline-block"}}>
          {incoming !== null ? (
            <>
              {/* width owner: the current value, invisible */}
              <Pill label={incoming} size={size} style={{visibility: "hidden"}} />
              {outgoing !== null && outT < 1 && (
                <div
                  style={{
                    position: "absolute",
                    insetInlineStart: 0,
                    top: 0,
                    transform: `translateY(${outY}px)`,
                    opacity: 1 - outT,
                    filter: `blur(${outT * 10}px)`,
                  }}
                >
                  <Pill label={outgoing} size={size} />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  insetInlineStart: 0,
                  top: 0,
                  transform: `translateY(${inY}px)`,
                  opacity: k === 0 ? inT : Math.min(1, inT * 1.6),
                  filter: inBlur > 0.05 ? `blur(${inBlur}px)` : undefined,
                }}
              >
                <Pill label={incoming} size={size} />
              </div>
            </>
          ) : (
            // before the first value: empty slot
            <Pill label={values[0] ?? ""} size={size} style={{visibility: "hidden"}} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PillCycle;
