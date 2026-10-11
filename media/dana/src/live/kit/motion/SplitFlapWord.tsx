// SplitFlapWord — ported MOTION from shotcraft card `typography/split-flap-title/SplitFlapFlip.tsx`
// (airport split-flap board, 140f). Kept from the card: flap physics (rotateX top-leaf 0→-90 then
// bottom-leaf 90→0, transformOrigin center hinge), gravity easing (in-quad, faster as it falls),
// brightness dip 1→0.55 during the flip, 3 intermediate garble states + target per flip,
// click-settle translateY (0→6→-1.5→0) after the cell stops, 4f stagger cascade in READING order
// (rtl row: first cell = right-most, cascade sweeps right→left), seeded sine garble hash (no
// Math.random), hinge bar + perspective 420.
// Primitive changes: one BOARD whose whole VALUE flips from words[k-1] to words[k] at each
// flipAtFrame[k] (a value = a row of cells, one cell per JOINED GROUP of the value — never a single
// code point; values may have different group counts, missing cells land blank). Idle state before
// the first flip shows static garble (card's build section). Colors are Dana tokens:
// body rgba(10,31,74,0.82) [ink], flaps navy2/blueDeep, text ice, active cell frame blueMid.
import React from "react";
import {Easing, interpolate, useCurrentFrame} from "remotion";
import {palette} from "../tokens";
import {joinedGroups} from "../fa";

const STAGGER = 4; // card: cascade delay between cells (reading order)
const FLIP = 5; // card: duration of one leaf flip
const NFLIP = 3; // card: 3 flips per settle (2 garbles + land on target)

// seeded sine hash — identical formula to the card
const rnd = (a: number) => {
  const x = Math.sin(a * 127.3) * 43758.5453;
  return x - Math.floor(x);
};
const CHARSET = [..."بصمکهقعنتحژسدوفگچ۰۱۲۳۴۵۶۷۸۹٪؟#"];
const garble = (i: number, k: number) => CHARSET[Math.floor(rnd(i * 7.13 + k * 3.71 + 1) * CHARSET.length)];

type Half = "top" | "bottom";

const Half: React.FC<{ch: string; part: Half; cellW: number; cellH: number; size: number; bg: string}> = ({
  ch,
  part,
  cellW,
  cellH,
  size,
  bg,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: part === "top" ? 0 : cellH / 2,
      width: cellW,
      height: cellH / 2,
      overflow: "hidden",
      background: bg,
      borderRadius: part === "top" ? "10px 10px 0 0" : "0 0 10px 10px",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: part === "top" ? 0 : -cellH / 2,
        width: cellW,
        height: cellH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Estedad", system-ui, sans-serif',
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: 0,
        direction: "rtl",
        color: palette.ice,
      }}
    >
      {ch}
    </div>
  </div>
);

const FlapCell: React.FC<{
  target: string; // "" = blank cell
  i: number;
  frame: number;
  start: number; // frame this cell's cascade starts (event frame + i * STAGGER)
  cellW: number;
  cellH: number;
  size: number;
}> = ({target, i, frame, start, cellW, cellH, size}) => {
  const blank = target === "";
  const seq = [garble(i, 0), garble(i, 1), garble(i, 2), target];
  const local = frame - start;
  const done = local >= NFLIP * FLIP;

  // card's click-settle: the whole cell dips 6px and rebounds once it stops
  const clickY = done
    ? interpolate(local, [15, 17, 19, 22], [0, 6, -1.5, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 0;

  let topCh = seq[0];
  let bottomCh = seq[0];
  let flap: React.ReactNode = null;

  if (done) {
    topCh = target;
    bottomCh = target;
  } else if (local > 0) {
    const k = Math.min(NFLIP - 1, Math.floor(local / FLIP));
    const from = seq[k];
    const to = seq[k + 1];
    const p = Easing.in(Easing.quad)((local - k * FLIP) / FLIP); // gravity: falls faster towards the end
    topCh = blank ? "" : to;
    bottomCh = blank ? "" : from;
    if (p < 0.5) {
      // first half: old char's top leaf rotates 0→-90 down over the hinge
      const deg = p * 2 * 90;
      flap = (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotateX(${-deg}deg)`,
            transformOrigin: `center ${cellH / 2}px`,
            backfaceVisibility: "hidden",
            filter: `brightness(${1 - p * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={from} part="top" cellW={cellW} cellH={cellH} size={size} bg={palette.navy2} />
        </div>
      );
    } else {
      // second half: new char's bottom leaf slaps 90→0 over the old bottom
      const deg = 90 - (p - 0.5) * 2 * 90;
      flap = (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotateX(${deg}deg)`,
            transformOrigin: `center ${cellH / 2}px`,
            backfaceVisibility: "hidden",
            filter: `brightness(${0.55 + (p - 0.5) * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={to} part="bottom" cellW={cellW} cellH={cellH} size={size} bg={palette.blueDeep} />
        </div>
      );
    }
  }

  const active = local > 0 && !done;

  return (
    <div
      style={{
        position: "relative",
        width: cellW,
        height: cellH,
        transform: `translateY(${clickY}px)`,
        perspective: 420,
        borderRadius: 10,
        boxShadow: active
          ? `0 0 0 3px ${palette.blueMid}, 0 6px 18px rgba(0,0,0,0.3)` // active cell frame (token blueMid)
          : "0 6px 18px rgba(0,0,0,0.3)",
      }}
    >
      <Half ch={topCh} part="top" cellW={cellW} cellH={cellH} size={size} bg={palette.navy2} />
      <Half ch={bottomCh} part="bottom" cellW={cellW} cellH={cellH} size={size} bg={palette.blueDeep} />
      {flap}
      {/* hinge line across the middle seam */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: cellH / 2 - 2,
          width: cellW,
          height: 4,
          background: "rgba(4,10,34,0.95)",
          zIndex: 3,
        }}
      />
    </div>
  );
};

export const SplitFlapWord: React.FC<{
  /** sequence of whole values the board flips through, e.g. ["۱۳۹۸","توسعه","۱۴۰۴"] */
  words: string[];
  /** frame at which the board starts flipping to words[k] (words[0] lands at flipAtFrame[0]) */
  flipAtFrame: number[];
  /** reserved board width on the 1920x1080 grid (used for centring); height of a cell; cell width */
  w?: number;
  h?: number;
  cellW?: number;
}> = ({words, flipAtFrame, w = 900, h = 170, cellW = 144}) => {
  const frame = useCurrentFrame();
  const size = Math.round(h * 0.52);

  // groups of each value (spaces become gaps)
  const rows = words.map((v) => joinedGroups(v));
  const gapW = Math.round(cellW * 0.36); // card: 52px gap at cellW 144

  // which flip event are we in (k = index of the value currently shown / landing)
  let k = -1;
  for (let e = 0; e < flipAtFrame.length && e < words.length; e++) {
    if (frame >= flipAtFrame[e]) k = e;
  }

  // event start frame + event index for the garble seed offset
  const evStart = k >= 0 ? flipAtFrame[k] : Number.MAX_SAFE_INTEGER;
  const evIdx = Math.max(0, k);

  const cells: React.ReactNode[] = [];
  if (k < 0) {
    // idle build state: a static garble board (card frames 0..21)
    for (let i = 0; i < 6; i++) {
      cells.push(
        <FlapCell key={`i${i}`} target={""} i={i} frame={frame} start={evStart} cellW={cellW} cellH={h} size={size} />,
      );
    }
  } else {
    let ci = 0;
    rows[k].forEach((g, idx) => {
      if (g === " ") {
        cells.push(<div key={`g${idx}`} style={{width: gapW}} />);
        return;
      }
      cells.push(
        <FlapCell
          key={`c${ci}`}
          target={g}
          i={ci + evIdx * 31}
          frame={frame}
          start={evStart}
          cellW={cellW}
          cellH={h}
          size={size}
        />,
      );
      ci++;
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        display: "flex",
        direction: "rtl",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {cells}
    </div>
  );
};

export default SplitFlapWord;
