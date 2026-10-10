// PERSIAN (RTL) localization of "unit-dot-swarm-regroup-v2" - 320 dots, r=9, springs (stiffness 150, stagger 8f), M1/M2/M3 beats untouched.
// TEXT: title, legend, cluster labels ("رایگان · ۷٬۲۱۰" / "حرفه‌ای · ۴٬۱۰۲" / "سازمانی · ۱٬۵۳۵"), bar axis labels, final caption "کل مشتریان"
//   translated (plan names are the Persian product-tier words). Persian digits and "٬" separators; the upstream letterSpacing:2 on the
//   caption is removed (it would break joining).
// DIRECTION (decided per item):
//  - Group order MIRRORED: first group (Free) is the right-most cluster/bar, Pro stays centre (amber hero), Enterprise is left-most.
//    All cluster / bar / scatter x coordinates are flipped (x -> 1920 - x); the baseline rule is symmetric about 960 so it is unchanged.
//    Staggers, springs and per-dot random seeds are identical (the same dot goes to the mirrored spot).
//  - The legend (was bottom-left) moves to bottom-right (start side); its swatch sits at the right of its text via the RTL flex row.
//  - FINAL NUMBER "12,847": digit ORDER KEPT (numerals read left-to-right, most significant digit leftmost, even in Persian text), so
//    block positions are NOT mirrored. The dot-matrix is rasterized from the real Vazirmatn Persian digit glyphs (۱ ۲ ۸ ۴ ۷) at
//    a common height on a 20px grid (313 cells + 3 comma dots), so the payoff reads unmistakably as ۱۲٬۸۴۷.
//  - Bar fill order inside each bar is mirrored (col = 7 - j%8): the partial top row starts at the right.
//  - Dot colours (mid grey / amber Pro / ink Enterprise) KEPT; vertical stacking (gravity-like bar growth upward) KEPT.
// FONT: Vazirmatn (neutral infographic labels, real 600-700 weights). Sizes via fs().
// RASTER: none. Baseline: no Latin/Chinese text remains.
import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';
import { FaTitle } from './_FaTitle';

const AMBER = '#b45309';
const FPS = 30;
const N = 320;
const DOT_R = 9;

const M1 = 12; // 聚簇
const M2 = 48; // 列队成柱
const M3 = 84; // 收拢成 12,847
const DUR = 20;
const STAG = 8;

// 帧确定伪随机
const rnd = (i: number, salt: number): number => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// —— 阶段 0：散布（星群） ——
const scatter = (i: number): [number, number] => [
  1920 - (300 + rnd(i, 1) * 1320), // RTL: mirrored
  330 + rnd(i, 2) * 620,
];

// —— 分组：Free 180 / Pro 102 / Enterprise 38（每点 ≈ 40 customers） ——
const groupOf = (i: number): number => (i < 180 ? 0 : i < 282 ? 1 : 2);
const idxInGroup = (i: number): number => (i < 180 ? i : i < 282 ? i - 180 : i - 282);
const GROUP_N = [180, 102, 38];
const GROUP_LABEL = ['رایگان · ۷٬۲۱۰', 'حرفه‌ای · ۴٬۱۰۲', 'سازمانی · ۱٬۵۳۵'];

// —— 阶段 1：三簇（圆盘散布，sqrt 半径均匀） ——
const CLUSTER_C: [number, number][] = [
  [1400, 620], // RTL: Free at the right
  [940, 570], // Pro centre
  [520, 640], // Enterprise at the left
];
const CLUSTER_R = GROUP_N.map((n) => 58 + n * 0.46); // 141 / 105 / 75
const cluster = (i: number): [number, number] => {
  const g = groupOf(i);
  const r = Math.sqrt(rnd(i, 3)) * CLUSTER_R[g];
  const a = rnd(i, 4) * Math.PI * 2;
  return [CLUSTER_C[g][0] + r * Math.cos(a), CLUSTER_C[g][1] + r * Math.sin(a)];
};

// —— 阶段 2：三根柱（8 点宽网格自底向上码放，底边对齐） ——
const BAR_BASE = 840;
const BAR_X = [1400, 940, 520]; // RTL: Free right ... Enterprise left
const SPACING = 20;
const bar = (i: number): [number, number] => {
  const g = groupOf(i);
  const j = idxInGroup(i);
  const col = 7 - (j % 8); // RTL: stack fills from the right
  const row = Math.floor(j / 8);
  return [BAR_X[g] + (col - 3.5) * SPACING, BAR_BASE - row * SPACING];
};

// —— 阶段 3：数字 "12,847" 点阵 ——
// Rasterized from the REAL Vazirmatn (weight 450) glyphs ۱ ۲ ۸ ۴ ۷ at one common height (16 rows), sampled on a 20px cell grid
// (cell centre = dot centre, coverage > 50%): 313 glyph cells + 3 comma dots, so the 320 dots fill the number (the 4 surplus dots
// wrap onto the first cells via i % length, as upstream does). Each digit keeps its own natural width.
const ONE = ['0100', '1110', '0110', '0110', '0110', '0110', '0111', '0011', '0011', '0011', '0011', '0011', '0011', '0011', '0011', '0011'];
const TWO = ['01000000011', '11100000011', '01100000011', '01110000011', '01111000111', '00111111110', '00111111100', '00110000000', '00110000000', '00110000000', '00110000000', '00110000000', '00110000000', '00110000000', '00110000000', '00110000000'];
const EIGHT = ['0000011100000', '0000011100000', '0000011100000', '0000011100000', '0000111110000', '0000111110000', '0000110110000', '0001110111000', '0001100011000', '0001100011000', '0011100011100', '0011000001100', '0111000001110', '0110000000110', '1110000000111', '0100000000010'];
const FOUR = ['0100000111100', '1110001111110', '0110011110110', '0111011000000', '0111111000000', '0011111000000', '0011111111111', '0011111111111', '0011000111110', '0011000000000', '0011100000000', '0011100000000', '0011100000000', '0011100000000', '0011100000000', '0011100000000'];
const SEVEN = ['0100000000010', '1110000000111', '0110000000110', '0111000001110', '0011000001100', '0011100011100', '0001100011000', '0001100011000', '0001110111000', '0000110110000', '0000111110000', '0000111110000', '0000011100000', '0000011100000', '0000011100000', '0000011100000'];
const CELL = 20;
const Y0 = 370;
const DIGIT_H = 16 * CELL; // 320
const buildDigit = (bitmap: string[], x0: number): [number, number][] => {
  const out: [number, number][] = [];
  bitmap.forEach((rowStr, r) => {
    rowStr.split('').forEach((c, col) => {
      if (c === '1') out.push([x0 + col * CELL + CELL / 2, Y0 + r * CELL + CELL / 2]);
    });
  });
  return out;
};
// Layout left-to-right (numeral order kept): widths 4,11 | comma 1 | 13,13,13 columns, 2-column gaps; 65 columns = 1300px, centred.
const NX = (1920 - 65 * CELL) / 2;
const DIGIT_PTS: [number, number][] = [
  ...buildDigit(ONE, NX),
  ...buildDigit(TWO, NX + 6 * CELL),
  // comma: small slanted tail at the baseline
  [NX + 19 * CELL + 10, Y0 + 14 * CELL + 10],
  [NX + 19 * CELL + 10, Y0 + 15 * CELL + 10],
  [NX + 19 * CELL + 2, Y0 + 15 * CELL + 24],
  ...buildDigit(EIGHT, NX + 22 * CELL),
  ...buildDigit(FOUR, NX + 37 * CELL),
  ...buildDigit(SEVEN, NX + 52 * CELL),
];
const digit = (i: number): [number, number] => {
  const p = DIGIT_PTS[i % DIGIT_PTS.length];
  const jx = (rnd(i, 5) - 0.5) * 7;
  const jy = (rnd(i, 6) - 0.5) * 7;
  return [p[0] + jx, p[1] + jy];
};

const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const fade = (frame: number, inA: number, inB: number, outA?: number, outB?: number): number => {
  const fi = interpolate(frame, [inA, inB], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (outA === undefined || outB === undefined) return fi;
  const fo = interpolate(frame, [outA, outB], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return Math.min(fi, fo);
};


export const UnitDotSwarmRegroupV2: React.FC = () => {
  const frame = useCurrentFrame();

  const dots = Array.from({ length: N }, (_, i) => {
    const stag = rnd(i, 7) * STAG;
    const mig = (start: number) =>
      spring({
        frame: frame - start - stag,
        fps: FPS,
        config: { damping: 11.5, stiffness: 150, mass: 0.8 },
        durationInFrames: DUR,
        durationRestThreshold: 0.0001,
      });
    let p = scatter(i);
    p = lerp(p, cluster(i), mig(M1));
    p = lerp(p, bar(i), mig(M2));
    p = lerp(p, digit(i), mig(M3));
    return p;
  });

  // 各阶段标签透明度（迁徙完成后浮现，下一次迁徙启动即撤）
  const clusterLabelOp = fade(frame, 38, 46, M2, M2 + 8);
  const barLabelOp = fade(frame, 72, 80, M3, M3 + 8);
  const captionOp = fade(frame, 114, 126);

  return (
    <FaRoot family="Vazirmatn" style={{ background: G.bg, overflow: 'hidden' }}>
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 110, width: '100%', textAlign: 'center' }}>
        <FaTitle text="بازچینش خوشه‌ای نقطه‌ها · نسخهٔ ۲" size={72} />
      </div>

      {/* 图例：每点的含义（全程挂角） */}
      <div
        style={{
          position: 'absolute',
          right: 90, // RTL: start side
          bottom: 70,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          lineHeight: FA_LH,
          fontSize: fs(24),
          fontWeight: 600,
          color: G.mid,
        }}
      >
        <div style={{ width: 18, height: 18, borderRadius: 9, background: G.mid }} />
        هر نقطه ≈ ۴۰ مشتری
      </div>

      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {dots.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={DOT_R} fill={groupOf(i) === 1 ? AMBER : groupOf(i) === 2 ? G.ink : G.mid} />
        ))}
      </svg>

      {/* 阶段 1：簇标签（真人数） */}
      {clusterLabelOp > 0 &&
        CLUSTER_C.map((c, g) => (
          <div
            key={`cl${g}`}
            style={{
              position: 'absolute',
              left: c[0] - 200,
              top: c[1] - CLUSTER_R[g] - (g === 0 ? 86 : 66), // Free: extra clearance from stray dots
              width: 400,
              textAlign: 'center',
              lineHeight: FA_LH,
              fontSize: fs(28),
              fontWeight: 700,
              color: g === 1 ? AMBER : G.ink,
              opacity: clusterLabelOp,
            }}
          >
            {GROUP_LABEL[g]}
          </div>
        ))}

      {/* 阶段 2：柱底基线 + 真轴标 */}
      {barLabelOp > 0 && (
        <>
          <div style={{ position: 'absolute', left: 380, width: 1160, top: BAR_BASE + 16, height: 3, background: G.bar, opacity: barLabelOp }} />
          {BAR_X.map((x, g) => (
            <div
              key={`bl${g}`}
              style={{
                position: 'absolute',
                left: x - 150,
                top: BAR_BASE + 30,
                width: 300,
                textAlign: 'center',
                lineHeight: FA_LH,
                fontSize: fs(26),
                fontWeight: 700,
                color: g === 1 ? AMBER : G.mid,
                opacity: barLabelOp,
              }}
            >
              {['رایگان', 'حرفه‌ای', 'سازمانی'][g]}
            </div>
          ))}
        </>
      )}

      {/* 终幕：数字下方真文案 */}
      {captionOp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: 1920,
            top: Y0 + DIGIT_H + 60,
            textAlign: 'center',
            lineHeight: FA_LH,
            fontSize: fs(34),
            fontWeight: 600,
            color: G.mid,
            opacity: captionOp,
            letterSpacing: 0,
          }}
        >
          کل مشتریان
        </div>
      )}
    </div>
    </FaRoot>
  );
};
