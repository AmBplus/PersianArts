// Persian/RTL localization of odometer-digit-roll (original design notes below are kept: timing, easing, seeds unchanged).
// TEXT: title "ODOMETER DIGIT ROLL" -> «رول ارقام کیلومترشمار» (odometer = کیلومترشمار, idiomatic); metric "99.98%" -> «٪۹۹٫۹۸»
//   with Persian digits, decimal separator «٫» and percent «٪». No Latin/Chinese text remains. letterSpacing 0 (was -1 on title).
// FONT: Vazirmatn (variable, weights up to 900): neutral product/metric voice, real Persian digit glyphs, fw800 exists. Loaded via FaRoot.
// DIRECTION decisions:
//  - Title block: top-left -> top-right (insetInlineStart under RTL): it is a header, header anchoring follows reading order. MIRRORED.
//  - Number: digits keep their visual order (۹۹٫۹۸, most significant at the left; numeral order inside a number is never reversed)
//    -> KEPT, so the left-to-right lock stagger (20/27/34/41) also KEPT: it follows the digit significance, and the source says
//    right-to-left reads as counting backwards. The static percent sign follows Persian typography (٪ before the number), which in
//    the RTL flex row puts it at the number's left end: MIRRORED by flex row order (direction:rtl on the row with the number as an LTR island).
//    (wording fix: logically the percent sign follows the number; visually it ends up at the left of it.)
//  - Title top 96 -> 80: Persian line-height 1.5 / fs(54) makes the line box taller, so the offset was reduced to keep the same optical top margin.
//  - Digit cell widened 126 -> 150 (Persian digit glyphs at fs(190) are wider than the original cell); decimal separator drawn at 0.5x scale on the baseline (width kept 70).
//  - Vertical roll, overshoot, ghost copies, pulse scale (symmetric, origin at centre): physical/vertical -> KEPT.
//  - Label bars under the number: centred, symmetric -> KEPT.
// Digit strip uses faDigits() glyphs; each digit is a single glyph in a fixed cell, so no joining problem. fs() scales 1.1x.
// 里程表数字滚动大字报（odometer-digit-roll）——声画钩子 / Vercel Ship 指标段。
// 全屏巨号 "99.98%"（190px fw800 tabular-nums），四个数位各是一条 0–9 纵向
// strip（overflow:hidden 数位盒），高速滚动后逐位停稳：位 i 在 20+i*7f 开始
// 减速（Easing.out(cubic)），过冲半格再 6f 弹回锁定。滚动期每位叠 2 个错帧
// 残影副本（translateY ±行高*0.5，opacity 0.25/0.12），按帧速度门控，停稳即摘。
// 小数点与 % 不滚动，一直驻场。
// 关键帧：0–20 四位全速滚（0.85 行/帧）→ 20/27/34/41 逐位开始减速（各 16f
// 减速 + 6f 回弹，锁定于 42/49/56/63）→ 63–71 整体加深脉冲（ink→#000→ink，
// 附 1.035 微缩放加码）→ 66–84 下方标签条淡入 → 84–150 全静止（66f ≥45f）。
import React from 'react';
import { useCurrentFrame, interpolate, interpolateColors, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, faDigits } from '../../_fa';

const ROW = 210; // 数位行高（overflow 盒高）
const DW = 150; // 数位盒宽 (widened from 126: Persian digit glyphs at fs(190) are wider than the original cell and were clipped)
const FS = fs(190); // 字号 (Persian-scaled)
const DOT_DY = 52; // decimal separator is drawn at 0.5x and pushed down to sit on the digit baseline
const SPIN = 0.85; // 高速滚动速度：行/帧
const DIGITS = [9, 9, 9, 8]; // 目标数位（"99.98" 中可滚的四位）

// 位 i 的 strip 位置（单位：行，连续值）。纯帧函数，天然确定性。
const posAt = (f: number, i: number): number => {
  const d = DIGITS[i];
  const s = 20 + i * 7; // 开始减速帧
  const p0 = SPIN * s;
  // 最小再走 6 行后，落在个位 = d 的最近整数位置
  const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
  if (f < s) return SPIN * Math.max(f, 0);
  if (f < s + 16)
    return interpolate(f, [s, s + 16], [p0, T + 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  if (f < s + 22)
    return interpolate(f, [s + 16, s + 22], [T + 0.5, T], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  return T;
};

// 一条 0–9 纵列 strip（两轮 20 格，容过冲跨界）
const Strip: React.FC<{ pos: number; color: string; opacity?: number; dy?: number }> = ({
  pos,
  color,
  opacity = 1,
  dy = 0,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: DW,
      transform: `translateY(${-(pos % 10) * ROW + dy}px)`,
      opacity,
    }}
  >
    {Array.from({ length: 20 }).map((_, k) => (
      <div
        key={k}
        style={{
          width: DW,
          height: ROW,
          lineHeight: `${ROW}px`,
          textAlign: 'center',
          fontSize: FS,
          fontWeight: 800,
          letterSpacing: 0,
          color,
        }}
      >
        {faDigits(k % 10)}
      </div>
    ))}
  </div>
);

// 单个数位盒：本体 strip + 滚动期 2 个错帧残影（速度门控，停稳即摘）
const DigitReel: React.FC<{ frame: number; i: number; color: string }> = ({ frame, i, color }) => {
  const pos = posAt(frame, i);
  const speed = Math.abs(pos - posAt(frame - 1, i));
  const gate = interpolate(speed, [0.06, 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ position: 'relative', width: DW, height: ROW, overflow: 'hidden' }}>
      {gate > 0.001 && (
        <>
          <Strip pos={pos} color={color} opacity={0.25 * gate} dy={ROW * 0.5} />
          <Strip pos={pos} color={color} opacity={0.12 * gate} dy={-ROW * 0.5} />
        </>
      )}
      <Strip pos={pos} color={color} />
    </div>
  );
};

// 不滚动的静态字符（小数点 / %），一直驻场
const StaticGlyph: React.FC<{ ch: string; color: string; w?: number; scale?: number; dy?: number }> = ({ ch, color, w, scale = 1, dy = 0 }) => (
  <div
    style={{
      width: w,
      height: ROW,
      lineHeight: `${ROW}px`,
      textAlign: 'center',
      fontSize: FS * scale,
      fontWeight: 800,
      letterSpacing: 0,
      color,
      transform: dy ? `translateY(${dy}px)` : undefined,
    }}
  >
    {ch}
  </div>
);

export const OdometerDigitRoll: React.FC = () => {
  const frame = useCurrentFrame();
  // 全位锁定于 63f：整体加深脉冲 ink→#000→ink（8f），附微缩放加码可感性
  const inkNow = interpolateColors(frame, [63, 67, 71], [G.ink, '#000000', G.ink]);
  const pulseScale = interpolate(frame, [63, 67, 71], [1, 1.035, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const labelOp = interpolate(frame, [66, 84], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
     <FaRoot family="Vazirmatn">
      <div style={{ position: 'absolute', right: 120, top: 80, fontWeight: 800, fontSize: fs(54), lineHeight: 1.5, color: G.ink, letterSpacing: 0 }}>
        رول ارقام کیلومترشمار
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 400,
          width: 1920,
          display: 'flex',
          justifyContent: 'center',
          direction: 'rtl',
          transform: `scale(${pulseScale})`,
          transformOrigin: '960px 105px',
        }}
      >
        <div style={{ display: 'flex', direction: 'ltr' }}>
          <DigitReel frame={frame} i={0} color={inkNow} />
          <DigitReel frame={frame} i={1} color={inkNow} />
          <div style={{ width: 70, height: ROW, position: 'relative' }}>
            {/* drawn Persian decimal separator (comma shape) on the digit baseline: the font glyph renders as a huge slash at this size */}
            <div style={{ position: 'absolute', left: 22, top: 138, width: 26, height: 26, borderRadius: 13, background: inkNow }} />
            <div style={{ position: 'absolute', left: 33, top: 154, width: 12, height: 26, background: inkNow, borderRadius: 6, transform: 'rotate(22deg)' }} />
          </div>
          <DigitReel frame={frame} i={2} color={inkNow} />
          <DigitReel frame={frame} i={3} color={inkNow} />
        </div>
        <StaticGlyph ch="٪" color={inkNow} />
      </div>
      {/* 下方标签条：全部锁定后淡入 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 680,
          width: 1920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: labelOp,
        }}
      >
        <div style={{ width: 520, height: 22, background: G.bar, borderRadius: 11 }} />
        <div style={{ width: 320, height: 14, background: G.line, borderRadius: 7 }} />
      </div>
     </FaRoot>
    </div>
  );
};
