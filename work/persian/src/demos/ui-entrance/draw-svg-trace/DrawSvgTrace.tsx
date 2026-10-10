// PERSIAN (RTL) localization of shotcraft "draw-svg-trace". Motion, timing, easing, pen length, flash, hand-off: untouched.
// (Original Chinese design comment: ink stroke runs one lap around a 560x380 card, pen-tip dash leads, closing flash to black,
//  content fades in 8f, stroke hands over to the card border, then a short underline draw. Keyframes 8-48 trace, 48-56 flash,
//  54-64 hand-off, 68-86 underline, 90-140 still. Those numbers are unchanged.)
// TEXT: the only on-screen string is the headline "DRAW SVG TRACE" -> «ترسیم مسیر SVG» (idiomatic title; the technical token SVG
//  stays Latin and is isolated with <bdi> so it does not jump in the bidi run). The card body is grey placeholder bars (no text).
// FONT: Vazirmatn 800 - the original is Helvetica ExtraBold neutral headline; Vazirmatn is the neutral variable UI sans and
//  has a real 800 weight. letterSpacing -1 dropped (breaks joining), size 54 -> fs(54)=59, line-height FA_LH.
// DIRECTION decisions:
//  - Headline block: left:120 -> right:120 (title anchors at the reading start = right edge).  MIRRORED, reading order.
//  - Card (560x380, centred), its shadow (0 2px, symmetric), radius 14 (symmetric): KEPT, symmetric composition.
//  - Trace: the rect path starts top-left and runs clockwise. For a Persian reader the pen should start at the top-RIGHT
//    and run along the top toward the left (counter-clockwise). The svg is flipped with scaleX(-1) (rect is symmetric, so
//    only the start point and winding change). MIRRORED, reading/drawing direction. Pen tip, flash, linecap: unchanged.
//  - Card content: direction:rtl on a column flex, so the title bar, text lines and the avatar row sit at the right edge and
//    the avatar row order is avatar(right) + name bar (left of it). Bar widths (340, 86% ...) unchanged. MIRRORED, layout.
//  - Underline: left: CX+32 -> right: CX+32 (under the right-aligned title bar) and drawn from x=UW to x=0 so it grows
//    right-to-left like handwriting in Persian. MIRRORED.
//  - Vertical order, easing curves, transform-origin (none), clip-paths (none): nothing else carries direction.
// RASTER: none in this demo. Frame offset constant is 0 (debug only).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, FA_LH, fs } from '../../_fa';

const CW = 560;
const CH = 380;
const CX = (1920 - CW) / 2; // 680
const CY = (1080 - CH) / 2; // 350
const FRAME_OFFSET = 0; // debug only
const PEN = 0.045; // 笔头 dash 长度（占整圈比例）

export const DrawSvgTrace: React.FC = () => {
  const frame = useCurrentFrame() + FRAME_OFFSET;

  // 轮廓描边进度：8–48，40f，inOut cubic
  const p = interpolate(frame, [8, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // 闭合闪烁：48–50 冲到峰值，50–56 回落。峰值 = 纯黑 + 4→8px 加粗
  const flashUp = interpolate(frame, [48, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashDown = interpolate(frame, [50, 56], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const flash = frame < 50 ? flashUp : flashDown;
  const strokeW = 4 + flash * 4;
  const strokeColor = flash > 0.5 ? '#000000' : G.ink;

  // 内容淡入：48–56（8f）
  const contentOp = interpolate(frame, [48, 56], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // 描边淡出 / 卡片自身 border 淡入：54–64
  const traceOp = interpolate(frame, [54, 64], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderOp = 1 - traceOp;

  // 笔头：短 dash 覆盖 [p-PEN, p]，只在描边期可见
  const penOp = p > 0.02 && p < 0.985 ? 1 : 0;

  // 第二用法：标题下划线短版生长 68–86（18f，out cubic）
  const up = interpolate(frame, [68, 86], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const upenOp = up > 0.03 && up < 0.97 ? 1 : 0;
  const UW = 300; // 下划线长度

  return (
    <FaRoot family="Vazirmatn" style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: 120, top: 96 }}>
        <div style={{ fontWeight: 800, fontSize: fs(54), lineHeight: FA_LH, color: G.ink, letterSpacing: 0 }}>
          ترسیم مسیر <bdi style={{ unicodeBidi: 'isolate' }}>SVG</bdi>
        </div>
      </div>

      {/* 卡片内容（手写灰阶块：标题条/下划线位/文字行/头像行），闭合后 8f 淡入 */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CW,
          height: CH,
          direction: 'rtl',
          borderRadius: 14,
          background: G.card,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 32,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          opacity: contentOp,
        }}
      >
        <div style={{ height: 24, width: 340, background: G.bar, borderRadius: 10 }} />
        {/* 下划线占位：由下方 SVG 画出，这里留 6px 空隙 */}
        <div style={{ height: 6 }} />
        <div style={{ height: 13, width: '86%', background: G.line, borderRadius: 6 }} />
        <div style={{ height: 13, width: '72%', background: G.line, borderRadius: 6 }} />
        <div style={{ height: 13, width: '60%', background: G.line, borderRadius: 6 }} />
        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: G.mid }} />
          <div style={{ height: 12, width: 96, background: G.line, borderRadius: 6 }} />
        </div>
      </div>

      {/* 卡片自身 border：描边淡出时接棒 */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CW,
          height: CH,
          borderRadius: 14,
          border: `2px solid ${G.border}`,
          boxSizing: 'border-box',
          opacity: borderOp,
        }}
      />

      {/* 描边生长层：主线 4px + 笔头 6px 短 dash */}
      {traceOp > 0.001 && (
        <svg
          width={CW}
          height={CH}
          style={{ position: 'absolute', left: CX, top: CY, overflow: 'visible', opacity: traceOp, transform: 'scaleX(-1)' }}
        >
          <rect
            x={1}
            y={1}
            width={CW - 2}
            height={CH - 2}
            rx={14}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - p}
            strokeLinecap="round"
          />
          {penOp > 0 && (
            <rect
              x={1}
              y={1}
              width={CW - 2}
              height={CH - 2}
              rx={14}
              fill="none"
              stroke={G.ink}
              strokeWidth={7}
              pathLength={1}
              strokeDasharray={`${PEN} ${1 - PEN}`}
              strokeDashoffset={PEN - p}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}

      {/* 第二用法：标题下划线短版描边生长（画完常驻） */}
      {up > 0.001 && (
        <svg
          width={UW}
          height={8}
          style={{ position: 'absolute', right: CX + 32, top: CY + 32 + 24 + 10, overflow: 'visible' }}
        >
          <line
            x1={UW}
            y1={4}
            x2={0}
            y2={4}
            stroke={G.ink}
            strokeWidth={4}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - up}
            strokeLinecap="round"
          />
          {upenOp > 0 && (
            <line
              x1={UW}
              y1={4}
              x2={0}
              y2={4}
              stroke={G.ink}
              strokeWidth={7}
              pathLength={1}
              strokeDasharray={`${PEN * 2} ${1 - PEN * 2}`}
              strokeDashoffset={PEN * 2 - up}
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
    </FaRoot>
  );
};
