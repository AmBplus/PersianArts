// title-demote-to-label — Persian / RTL localization (motion, timing, easing unchanged).
// TEXT: "اجرای زیرعامل‌ها" -> «اجرای زیرعامل‌ها» (section-title voice, 2 words);
//       "پاسخ را انتخاب کنید" -> «پاسخ را انتخاب کنید» (UI imperative, polite form).
// FONT: Vazirmatn 800 (variable) — neutral product-UI/headline sans matching Helvetica 800; weight exists.
//       fs() scales 128px -> 141px; letterSpacing -2 -> 0 (tracking breaks joining); single-line title (no line-height issue)
//       with padding 10px 18px kept (selection block spans the glyph box).
// DIRECTION decisions:
//  - title lands top-RIGHT (label slot follows reading start): left/x tween -> right anchor, transformOrigin
//    'left center' -> 'right center', centering correction translate(-50%) -> translate(+50%) so it still zeroes at the end.
//  - skeleton content column anchored at right:150 (was left:150); bars start at the right edge and grow toward
//    the left (width tween with right anchored), i.e. growth follows the reading direction.
//  - selection highlight: sweeps in from the RIGHT (start edge) and retreats by uncovering from the right
//    (left/right css swapped) — text selection in RTL begins at the right.
//  - KEPT: translateY rise of skeleton blocks (vertical), blur reveal, white flash, scale 0.3, all frame beats.
// RASTER: none. Numbers: none. Duration constant: SPLIT=92 unchanged (registry shows 92f; full design is 196f).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs } from '../../_fa';

const FONT = '"Vazirmatn", sans-serif';
const SEL = 'rgba(58, 128, 236, 0.35)';

// 内容骨架块：随 t 依次生长
const Skeleton: React.FC<{ t: number }> = ({ t }) => {
  const blocks = [
    { w: 1500, h: 26 },
    { w: 1280, h: 26 },
    { w: 1420, h: 26 },
    { w: 760, h: 26 },
    { w: 1500, h: 300, card: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
      {blocks.map((b, i) => {
        const bt = interpolate(t, [i * 0.16, i * 0.16 + 0.3], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={i}
            style={{
              width: b.w * (0.35 + 0.65 * bt),
              height: b.h,
              background: b.card ? G.card : G.line,
              border: b.card ? `2px solid ${G.border}` : 'none',
              borderRadius: b.card ? 16 : 13,
              opacity: bt,
              transform: `translateY(${(1 - bt) * 28}px)`,
              boxSizing: 'border-box',
            }}
          />
        );
      })}
    </div>
  );
};

// 一个完整的"显影→(可选高亮)→降格→内容生长"小节
const DemoteScene: React.FC<{
  frame: number;
  title: string;
  withSelection: boolean;
}> = ({ frame, title, withSelection }) => {
  // 时间轴（局部帧）
  const REVEAL = 0; // 0–12 显影
  const SEL_ON = 14; // 高亮扫入 14–24
  const SEL_OFF = 32; // 高亮撤掉 32–40
  const DEMOTE = withSelection ? 44 : 32; // 降格开始
  const DEMOTE_END = DEMOTE + 20;
  const GROW = DEMOTE + 12;

  // 显影：blur + 淡入
  const rev = interpolate(frame, [REVEAL, REVEAL + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 降格补间：scale 1 -> 0.3，中心 -> 左上
  const dem = interpolate(frame, [DEMOTE, DEMOTE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = interpolate(dem, [0, 1], [1, 0.3]);
  // 用 left/top 补间：起点居中（由外层 flex 定位换算），终点左上角
  const x = interpolate(dem, [0, 1], [960, 150]);
  const y = interpolate(dem, [0, 1], [480, 110]);

  // 高亮块：从左扫入盖住文字，再从左撤掉
  let selRight = 0;
  let selWidth = 0;
  if (withSelection) {
    const on = interpolate(frame, [SEL_ON, SEL_ON + 10], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    });
    const off = interpolate(frame, [SEL_OFF, SEL_OFF + 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    });
    selRight = off * 100;
    selWidth = Math.max(0, on * 100 - selRight);
  }

  const growT = interpolate(frame, [GROW, GROW + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: G.bg }}>
      {/* 内容骨架区 */}
      <div style={{ position: 'absolute', right: 150, top: 210 }}>
        <Skeleton t={growT} />
      </div>
      {/* 标题：transform-origin 左中，位置补间 */}
      <div
        style={{
          position: 'absolute',
          right: x,
          top: y,
          transform: `translate(${(1 - dem) * 50}%, -50%) scale(${scale})`,
          transformOrigin: 'right center',
          opacity: rev,
          filter: `blur(${(1 - rev) * 12}px)`,
        }}
      >
        <div
          style={{
            position: 'relative',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: fs(128),
            color: G.ink,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
            direction: 'rtl',
            padding: '10px 18px',
          }}
        >
          {withSelection && selWidth > 0 && (
            <div
              style={{
                position: 'absolute',
                right: `${selRight}%`,
                top: 8,
                width: `${selWidth}%`,
                height: 'calc(100% - 16px)',
                background: SEL,
                borderRadius: 6,
              }}
            />
          )}
          <span style={{ position: 'relative' }}>{title}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TitleDemoteToLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const SPLIT = 92; // 变体 A 时长

  if (frame < SPLIT) {
    return <FaRoot family="Vazirmatn"><DemoteScene frame={frame} title="اجرای زیرعامل‌ها" withSelection={false} /></FaRoot>;
  }
  // 变体 B：文本选中态高亮登场
  const f = frame - SPLIT;
  // 白闪转场 3f
  const flash = interpolate(f, [0, 4], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <FaRoot family="Vazirmatn">
      <DemoteScene frame={f} title="پاسخ را انتخاب کنید" withSelection={true} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
    </FaRoot>
  );
};
