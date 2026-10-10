// PERSIAN (RTL) localization of "axis-rescale-shock-v2" - timing, easing, 220px overshoot, 8px kick, 4->8 grid all untouched.
// TEXT: title/card header/ticks/month axis/value tag translated. Chart is "درآمد ماهانه" in میلیارد تومان, fiscal year 1405,
//   months are the 12 Jalali months (Farvardin..Esfand) so the shock point is Esfand (year-end), same story as Jan..Dec. Ticks are plain
//   Persian numerals (unit moved to the subtitle), tag "۳۴۰ میلیارد". Digits via faDigits; no tracking/uppercase anywhere.
// DIRECTION (decided per item):
//  - Time axis MIRRORED: Farvardin is at the right, the line draws right->left, the shock point lands at the far left (xOf flipped).
//  - Value axis MIRRORED to the right edge of the plot (start side in RTL); its numbers are left-aligned so they hug the gridlines
//    like the original's right-aligned labels hugged them. Magnitude logic (0 at bottom, growth up) KEPT: it is physical/numeric.
//  - Card header (title+subtitle) anchored right (text start). Value tag pops to the right of the end point (was left of it),
//    transform-origin flipped to left center so the pop grows away from the point... same as the original relation.
//  - Vertical motion (old ticks fly down, new slide in from above, shock overshoot upward, card kick translateY) KEPT: gravity/physical.
//  - Frame offsets, amber colour, line widths KEPT. Gridlines are symmetric: no change.
// FONT: Vazirmatn (neutral product-chart UI, variable 100-900 so the 700/800 weights are real). Sizes via fs() (x1.1).
// RASTER: none in this demo. Baseline: no Latin/Chinese text remains.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, faDigits, FA_LH } from '../../_fa';
import { FaTitle } from './_FaTitle';

const AMBER = '#b45309';

const CARD_W = 1060;
const CARD_H = 600;
const CX = (1920 - CARD_W) / 2;
const CY = (1080 - CARD_H) / 2 + 40;
const PAD = 52;
const AXIS_W = 96; // 刻度位（RTL：移到绘图区右侧）
const PLOT_W = CARD_W - PAD * 2 - AXIS_W;
const PLOT_H = 360;
const PLOT_X = PAD; // RTL: plot hugs the left padding, axis column sits at its right
const PLOT_Y = 130;

// 历史数据（$k，0–100 量程内温和爬升），最后一点爆表 340
const DATA = [22, 30, 26, 38, 35, 47, 44, 58, 55, 66, 72, 340];
const N = DATA.length;
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

const HOLD = 12;
const DRAW_END = HOLD + 34; // f46：历史段画完
const SHOCK_END = DRAW_END + 16; // f62：爆表点冲顶
const BEAT = SHOCK_END + 16; // f78：停半拍（悬在标题区）
const RESCALE_END = BEAT + 12; // f90：重标完成
const MARK_END = RESCALE_END + 8; // f98：端点标记弹出
const VAL_END = MARK_END + 10; // f108：真值标签弹出

const easeDraw = Easing.inOut(Easing.cubic);

export const AxisRescaleShockV2: React.FC = () => {
  const frame = useCurrentFrame();

  // 量程：0–100 → 0–400，重标 12f out-cubic
  const range = interpolate(frame, [BEAT, RESCALE_END], [100, 400], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yOf = (v: number): number => PLOT_H - (v / range) * PLOT_H;

  const drawT = interpolate(frame, [HOLD, DRAW_END], [0, N - 2], {
    easing: easeDraw,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shockT = interpolate(frame, [DRAW_END + 2, SHOCK_END], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 冲顶停位：卡片上沿之上 220px（PLOT_Y=130 → 相对绘图区顶 -350），真冲进标题字区
  const SHOCK_Y = -(PLOT_Y + 220);
  const rescaleP = interpolate(frame, [BEAT, RESCALE_END], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const xOf = (i: number): number => PLOT_W - (i / (N - 1)) * PLOT_W; // RTL: first month at the right

  // 历史段点集
  const basePts: string[] = [];
  const upto = Math.min(drawT, N - 2);
  for (let i = 0; i <= Math.floor(upto); i++) basePts.push(`${xOf(i).toFixed(2)},${yOf(DATA[i]).toFixed(2)}`);
  if (upto < N - 2 && upto > Math.floor(upto)) {
    const i = Math.floor(upto);
    const f = upto - i;
    const x = xOf(i) + (xOf(i + 1) - xOf(i)) * f;
    const y = yOf(DATA[i]) + (yOf(DATA[i + 1]) - yOf(DATA[i])) * f;
    basePts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  // 爆表段单独一根（琥珀 + 10px 加粗），起点 = 历史最后一点
  let headX = basePts.length ? Number(basePts[basePts.length - 1].split(',')[0]) : 0;
  let headY = basePts.length ? Number(basePts[basePts.length - 1].split(',')[1]) : 0;
  let shockSeg: string[] = [];
  if (shockT > 0) {
    const x0 = xOf(N - 2);
    const y0 = yOf(DATA[N - 2]);
    const x = x0 + (xOf(N - 1) - x0) * shockT;
    const yEnd = SHOCK_Y + (yOf(DATA[N - 1]) - SHOCK_Y) * rescaleP;
    const y = y0 + (yEnd - y0) * shockT;
    shockSeg = [`${x0.toFixed(2)},${y0.toFixed(2)}`, `${x.toFixed(2)},${y.toFixed(2)}`];
    headX = x;
    headY = y;
  }

  // 重标"哗"：旧刻度向下飞出淡出、新刻度从上滑入
  const swap = interpolate(frame, [BEAT, BEAT + 10], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const OLD_TICKS = ['۲۵', '۵۰', '۷۵', '۱۰۰'];
  const NEW_TICKS = ['۱۰۰', '۲۰۰', '۳۰۰', '۴۰۰'];

  // 网格密度 4→8：新增的 4 根细网格随 swap 浮现
  const denseOp = swap;

  const markS = interpolate(frame, [RESCALE_END, MARK_END], [0, 1], {
    easing: Easing.out(Easing.back(2.2)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const valS = interpolate(frame, [MARK_END, VAL_END], [0, 1], {
    easing: Easing.out(Easing.back(1.8)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 爆表瞬间卡片震（±8px，8f 内衰减归零）
  const kick =
    frame >= SHOCK_END && frame < SHOCK_END + 8
      ? 8 * (1 - (frame - SHOCK_END) / 8) * Math.sin((frame - SHOCK_END) * 2.6)
      : 0;

  const shockOn = frame >= DRAW_END; // 爆表段样式生效期

  return (
    <FaRoot family="Vazirmatn" style={{ background: G.bg, overflow: 'hidden' }}>
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 100, width: '100%', textAlign: 'center' }}>
        <FaTitle text="بازمقیاس‌گذاری ناگهانی محور · نسخهٔ ۲" size={72} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CARD_W,
          height: CARD_H,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 14,
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transform: `translateY(${kick.toFixed(2)}px)`,
          overflow: 'visible', // 让爆表段真的越出卡片
        }}
      >
        {/* 真卡头 */}
        <div style={{ position: 'absolute', right: PAD, top: 26, textAlign: 'right' }}>
          <div style={{ fontSize: fs(30), lineHeight: FA_LH, fontWeight: 700, color: G.ink }}>درآمد ماهانه</div>
          <div style={{ fontSize: fs(19), lineHeight: FA_LH, fontWeight: 500, color: G.mid, marginTop: 0 }}>{`سال مالی ${faDigits(1405)} · همهٔ محصولات · میلیارد تومان`}</div>
        </div>

        <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
          {/* 基础网格 4 根 + 重标同帧加密出的 4 根 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={`g${i}`} style={{ position: 'absolute', left: 0, right: 0, top: (PLOT_H / 4) * i, height: 2, background: G.line }} />
          ))}
          {[1, 3, 5, 7].map((i) => (
            <div key={`gd${i}`} style={{ position: 'absolute', left: 0, right: 0, top: (PLOT_H / 8) * i, height: 1.5, background: G.line, opacity: 0.8 * denseOp }} />
          ))}

          {/* 刻度：同一格位，旧值下飞淡出 / 新值上方滑入 */}
          {OLD_TICKS.map((v, i) => {
            const y = (PLOT_H / 4) * (3 - i);
            return (
              <div key={`t${i}`} style={{ position: 'absolute', left: PLOT_W + 14, top: y - 15, width: AXIS_W - 14, height: 30, textAlign: 'left' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontWeight: 700,
                    fontSize: fs(21),
                    lineHeight: '30px',
                    color: G.mid,
                    textAlign: 'left',
                    opacity: 1 - swap,
                    transform: `translateY(${(swap * 30).toFixed(2)}px)`,
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontWeight: 700,
                    fontSize: fs(21),
                    lineHeight: '30px',
                    color: G.ink,
                    textAlign: 'left',
                    opacity: swap,
                    transform: `translateY(${((swap - 1) * 30).toFixed(2)}px)`,
                  }}
                >
                  {NEW_TICKS[i]}
                </div>
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: PLOT_W + 14, top: PLOT_H - 15, width: AXIS_W - 14, lineHeight: '30px', fontWeight: 700, fontSize: fs(21), color: G.mid, textAlign: 'left' }}>۰</div>

          {/* 图表上沿强调线 */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 3, background: G.bar }} />

          <svg width={PLOT_W} height={PLOT_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {/* 历史段 */}
            <polyline points={basePts.join(' ')} fill="none" stroke={G.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            {/* 爆表段：琥珀 + 10px，重标落回后收敛回常规 */}
            {shockSeg.length > 0 && (
              <polyline
                points={shockSeg.join(' ')}
                fill="none"
                stroke={AMBER}
                strokeWidth={shockOn && frame < RESCALE_END ? 10 : 6}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {/* 端点标记 */}
            {markS > 0 && (
              <>
                <circle cx={headX} cy={headY} r={13 * markS} fill={AMBER} />
                <circle cx={headX} cy={headY} r={22 * markS} fill="none" stroke={AMBER} strokeWidth={3} opacity={0.55} />
              </>
            )}
          </svg>

          {/* 真值标签 "$340k"（端点旁弹出） */}
          {valS > 0 && (
            <div
              style={{
                position: 'absolute',
                left: headX + 28,
                top: headY - 27,
                width: 190,
                height: 54,
                background: AMBER,
                borderRadius: 10,
                color: '#fff',
                fontWeight: 800,
                fontSize: fs(26),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${valS.toFixed(4)})`,
                transformOrigin: 'left center',
              }}
            >
              ۳۴۰ میلیارد
            </div>
          )}

          {/* x 轴真月份 */}
          {MONTHS.map((m, i) => (
            <div
              key={`m${i}`}
              style={{
                position: 'absolute',
                left: xOf(i) - 39,
                top: PLOT_H + 14,
                width: 78,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                fontSize: fs(15),
                lineHeight: FA_LH,
                fontWeight: 600,
                color: i === N - 1 ? AMBER : G.mid,
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    </div>
    </FaRoot>
  );
};
