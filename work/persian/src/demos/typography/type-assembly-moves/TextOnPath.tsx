// TextOnPath — Persian/RTL localization (text-on-path: characters flow along a rising Bezier, tangent-rotated, then straighten into the title).
//
// TEXT
//  - Hero "GROWTH ALL THE WAY" -> «رشد تا آخرین قله» ("growth up to the last peak": the curve ends at a summit, idiomatic for a growth line).
//  - Label "TEXT ON PATH" -> «متن روی مسیر».
// SHAPING
//  - Rotating single characters would cut every join. The unit that rides the curve is a JOINED GROUP (joinedGroups():
//    «ر شد تا آ خر ین قله», 7 pieces + 3 word gaps that are not drawn). Each piece is a small connected cursive stroke so it can
//    rotate along the tangent without losing a join. The original used a fixed CHAR_W=46 grid for the final row; Persian pieces have
//    very different widths, so the final centres are MEASURED from a hidden, real, RTL flex row (useFontLoaded + getBoundingClientRect):
//    the straightened title is exactly the natural Persian line, centred at x=960.
//  - letterSpacing none, no uppercase.
// TIMING (beats kept)
//  - Original: 18 slots (i*2 f start, 45 f travel, tEnd = .12 + .82*i/(N-1), stop 8 f, 12 f straighten, curve evolve 0-82).
//    Each piece gets s = (index of the centre of its characters)/(chars-1) in 0..1 and then start = s*34 f (= 17 slots * 2 f of the
//    original), tEnd = .12 + .82*s: first piece starts at f0 and reaches the curve start, the last starts at f34, reaches t=.94 and
//    settles at f99, exactly the original envelope. 45 f travel, 8 f hold, 12 f straighten, curve evolve are untouched.
// DIRECTION (RTL)
//  - The growth line is mirrored: it climbs from LOWER-RIGHT to UPPER-LEFT (x -> 1920-x), as charts/timelines read right-to-left for a
//    Persian audience. The first piece (right-most in the final title, first read) takes the shortest trip and the last piece
//    (left-most) goes farthest up the curve. MIRRORED.
//  - Tangent rotation: the text now reads leftwards, so its upright orientation is the original angle negated (rotate = -theta):
//    pieces climb with the line and stay readable (rotate(-theta) rather than rotate(+theta), which would turn them upside down). MIRRORED.
//  - Label top-left -> top-right. MIRRORED. Final title row y=300 and centring on x=960: symmetrical, KEPT.
// FONT: Estedad 800 - the "semantic, data-story" demo: a modern geometric variable sans with real heavy weight, close to the
//  chart-label voice; clean enough that rotated pieces on the curve stay legible. Raster assets: none (the curve is an SVG path).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH, joinedGroups } from '../../_fa';
import { FaTitle, useFontLoaded } from './FaCommon';

const W = 1920;
// 上升贝塞尔 (original, left-bottom -> right-top). Mirrored when drawn: x -> W - x.
const P0 = { x: 200, y: 820 };
const P1 = { x: 760, y: 810 };
const P2 = { x: 1240, y: 660 };
const P3 = { x: 1500, y: 320 };

const bez = (t: number) => {
  const u = 1 - t;
  return {
    x: W - (u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x),
    y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  };
};
// 切线角（度），原曲线；镜像后文字朝左阅读，直立角为 -θ
const tangent = (t: number) => {
  const u = 1 - t;
  const dx = 3 * u * u * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x);
  const dy = 3 * u * u * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y);
  return -(Math.atan2(dy, dx) * 180) / Math.PI;
};

const TEXT = 'رشد تا آخرین قله';
const UNITS = joinedGroups(TEXT);
// s of each piece: position of the centre of its characters inside the phrase (spaces count, as in the original), 0..1
const S: number[] = [];
{
  let pos = 0;
  for (const u of UNITS) { const n = [...u].length; S.push((pos + (n - 1) / 2) / ([...TEXT].length - 1)); pos += n; }
}
const FINAL_Y = 300; // 水平基线（标题最终落位）
const FONT = fs(64);
const FAMILY = 'Estedad';
const LINE_STYLE: React.CSSProperties = { fontWeight: 800, fontSize: FONT, lineHeight: FA_LH, letterSpacing: 0, whiteSpace: 'pre' };

export const TextOnPath: React.FC = () => {
  const frame = useCurrentFrame();
  const ready = useFontLoaded(FAMILY);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [centers, setCenters] = React.useState<number[] | null>(null);
  React.useLayoutEffect(() => {
    if (!ready || !rowRef.current) return;
    const kids = Array.from(rowRef.current.children) as HTMLElement[];
    setCenters(kids.map((el) => { const r = el.getBoundingClientRect(); return r.left + r.width / 2; }));
  }, [ready]);

  const evolve = interpolate(frame, [0, 82], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const curve = `M ${W - P0.x} ${P0.y} C ${W - P1.x} ${P1.y}, ${W - P2.x} ${P2.y}, ${W - P3.x} ${P3.y}`;

  return (
    <FaRoot family={FAMILY} style={{ background: G.bg, overflow: 'hidden' }}>
      <FaTitle text="متن روی مسیر" family={FAMILY} />
      <svg width={W} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <path d={curve} fill="none" stroke={G.bar} strokeWidth={3}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - evolve} />
      </svg>
      {/* hidden measuring row: the natural RTL line the pieces straighten into */}
      <div ref={rowRef} style={{ position: 'absolute', left: 0, width: W, top: FINAL_Y, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', visibility: 'hidden', ...LINE_STYLE }}>
        {UNITS.map((u, i) => <span key={i}>{u}</span>)}
      </div>
      {centers && UNITS.map((u, i) => {
        if (u === ' ') return null;
        const tEnd = 0.12 + 0.82 * S[i]; // 各字符沿线终点
        const start = S[i] * 34;
        const t = interpolate(frame, [start, start + 45], [0, tEnd], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const pOnCurve = bez(t);
        const angOnCurve = tangent(t);
        const settle = interpolate(frame, [start + 53, start + 65], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
        const x = pOnCurve.x + (centers[i] - pOnCurve.x) * settle;
        const y = pOnCurve.y + (FINAL_Y - pOnCurve.y) * settle;
        const ang = angOnCurve * (1 - settle);
        const op = interpolate(frame, [start, start + 8], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: y, opacity: op,
            transform: `translate(-50%, -50%) rotate(${ang}deg)`,
            color: G.ink, ...LINE_STYLE,
          }}>
            {u}
          </div>
        );
      })}
    </FaRoot>
  );
};
