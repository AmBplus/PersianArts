// command-palette-summon (Persian / RTL) -- localization analysis
// TEXT: the demo has no readable strings at all: every "text" is a grey placeholder bar/block (by design, see source prompt),
//   so nothing is translated and no Latin/Chinese text can leak. Bars keep their exact widths/heights.
// SHAPING: no text rendered -> no letterSpacing/uppercase/line-height concerns. FaRoot still sets direction + font for fidelity.
// FONT: Vazirmatn (neutral product UI -- a command palette is pure product chrome; also what real text would use later).
// DIRECTION decisions:
//  - Dashboard backdrop: the shared FakeDashboard is LTR (sidebar left, search + avatar pushed right via marginLeft:auto).
//    MIRRORED via a local copy (FaDashboard) with direction:rtl: sidebar on the right, title bar at the start (right),
//    search/avatar at the left end (marginInlineStart:auto), card grid fills right-to-left, bars anchor at the right.
//  - Palette panel: horizontally centred -> symmetric, position unchanged (PANEL_X is already centred).
//  - Search input row: icon at the start (right), typed char blocks then caret grow toward the left (reading direction);
//    placeholder bar follows the caret -> same DOM order under rtl does this with no coordinate math.
//  - Result rows: icon block at the start (right), title bar anchored right, shortcut badge at the end (left) via marginInlineStart:auto.
//  - Highlight accent stripe: inset box-shadow moved from the left edge (4px) to the start/right edge (-4px).
//  - KEPT: vertical drop-in/overshoot, blur/dim, row-collapse (gravity/vertical), caret blink timing, stagger by row (vertical list order).
// RASTER: none used. MOTION: timings, easing, seeds, constants and DURATION unchanged.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, Card } from '../../_fixtures/Fixtures';
import { FaRoot } from '../../_fa';

// Local RTL copy of FakeDashboard variant A (shared fixture is LTR and must not be edited).
const FaDashboard: React.FC = () => (
  <div style={{ width: 1920, height: 1080, background: G.bg, display: 'flex', direction: 'rtl' }}>
    <div style={{ width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#777775' }} />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ height: 12, width: `${60 + ((i * 29) % 35)}%`, background: G.sideBar, borderRadius: 6 }} />
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: 180, background: G.bar, borderRadius: 9 }} />
        <div style={{ marginInlineStart: 'auto', height: 36, width: 320, background: '#fff', border: `2px solid ${G.line}`, borderRadius: 18, boxSizing: 'border-box' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: G.mid }} />
      </div>
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} w={0} h={0} seed={i + 1} style={{ width: '100%', height: '100%' }} />
        ))}
      </div>
    </div>
  </div>
);

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// 时间轴
const DIM0 = 12; // 压暗开始（前 12f 初始静置）
const DIM1 = 22;
const PANEL_IN = 18; // 面板开始弹落
const ROWS_START = 32; // 候选行开始错峰浮现
const KEY1 = 62; // 第一个字母
const KEY2 = 78; // 第二个字母
const HL = 94; // 高亮首条
const BLINK_END = 104; // 光标停止闪烁（常亮）

const PANEL_W = 780;
const PANEL_X = (1920 - PANEL_W) / 2;
const PANEL_Y = 290;
const ROW_H = 72;
const ROW_GAP = 8;
const EXIT_DUR = 10;

// exitAt: 0=留到最后，1=第一次按键后退出，2=第二次按键后退出
const ROWS = [
  { titleW: 52, exitAt: 0 },
  { titleW: 38, exitAt: 0 },
  { titleW: 61, exitAt: 2 },
  { titleW: 45, exitAt: 1 },
  { titleW: 56, exitAt: 1 },
];

const PaletteRow: React.FC<{ i: number; frame: number }> = ({ i, frame }) => {
  const { titleW, exitAt } = ROWS[i];
  const inStart = ROWS_START + i * 4;
  const exitStart = exitAt === 1 ? KEY1 + 3 : exitAt === 2 ? KEY2 + 3 : null;

  if (exitStart !== null && frame >= exitStart + EXIT_DUR) return null; // 条件卸载，非 opacity 0

  const inOp = interpolate(frame, [inStart, inStart + 8], [0, 1], CL);
  const inY = interpolate(frame, [inStart, inStart + 8], [12, 0], {
    easing: Easing.out(Easing.cubic),
    ...CL,
  });
  const exitT =
    exitStart === null
      ? 1
      : interpolate(frame, [exitStart, exitStart + EXIT_DUR], [1, 0], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        });

  // 高亮首条
  const hl = i === 0 ? interpolate(frame, [HL, HL + 10], [0, 1], CL) : 0;

  return (
    <div
      style={{
        height: (ROW_H + ROW_GAP) * exitT,
        opacity: inOp * exitT,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: ROW_H,
          borderRadius: 12,
          background: hl > 0 ? `rgba(228,228,226,${hl})` : 'transparent',
          boxShadow: hl > 0 ? `inset -4px 0 0 rgba(47,47,47,${hl})` : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 22px',
          boxSizing: 'border-box',
          transform: `translateY(${inY}px)`,
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: G.mid }} />
        <div style={{ height: 14, width: `${titleW}%`, background: G.bar, borderRadius: 7 }} />
        <div style={{ marginInlineStart: 'auto', width: 58, height: 24, borderRadius: 6, background: G.line }} />
      </div>
    </div>
  );
};

export const CommandPaletteSummon: React.FC = () => {
  const frame = useCurrentFrame();

  // 背景压暗 + blur
  const dim = interpolate(frame, [DIM0, DIM1], [0, 0.45], CL);
  const blur = interpolate(frame, [DIM0, DIM1], [0, 10], CL);

  // 面板弹落：上方 20px → 过冲 +8px → 落回 0
  const panelY =
    frame < PANEL_IN + 9
      ? interpolate(frame, [PANEL_IN, PANEL_IN + 9], [-20, 8], {
          easing: Easing.out(Easing.cubic),
          ...CL,
        })
      : interpolate(frame, [PANEL_IN + 9, PANEL_IN + 15], [8, 0], {
          easing: Easing.inOut(Easing.cubic),
          ...CL,
        });
  const panelOp = interpolate(frame, [PANEL_IN, PANEL_IN + 7], [0, 1], CL);

  // 模拟输入：已敲字符数
  const typed = (frame >= KEY1 ? 1 : 0) + (frame >= KEY2 ? 1 : 0);
  // 光标闪烁（周期 16f），BLINK_END 后常亮保证收尾静止
  const cursorOn = frame >= BLINK_END ? true : (frame - PANEL_IN) % 16 < 8;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      <FaRoot family="Vazirmatn">
      <div style={{ filter: frame < DIM0 ? undefined : `blur(${blur}px)` }}>
        <FaDashboard />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(20,20,20,${dim})` }} />

      {frame >= PANEL_IN && (
        <div
          style={{
            position: 'absolute',
            left: PANEL_X,
            top: PANEL_Y,
            width: PANEL_W,
            transform: `translateY(${panelY}px)`,
            opacity: panelOp,
            background: G.card,
            borderRadius: 18,
            border: `2px solid ${G.border}`,
            boxShadow: '0 28px 90px rgba(0,0,0,0.4)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          {/* 输入框 */}
          <div
            style={{
              height: 76,
              borderBottom: `2px solid ${G.line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 10px 14px 10px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: G.bar }} />
            {/* 已敲入的字符灰块 */}
            {Array.from({ length: typed }).map((_, c) => (
              <div key={c} style={{ width: 28, height: 38, borderRadius: 6, background: '#4a4a48' }} />
            ))}
            {/* 光标 */}
            {cursorOn && <div style={{ width: 4, height: 42, background: G.ink, borderRadius: 2 }} />}
            {/* 占位提示条：敲第一个字母时卸载 */}
            {typed === 0 && (
              <div style={{ width: 260, height: 14, borderRadius: 7, background: G.line, opacity: 0.8 }} />
            )}
          </div>
          {/* 候选行 */}
          <div style={{ paddingTop: 14 }}>
            {ROWS.map((_, i) => (
              <PaletteRow key={i} i={i} frame={frame} />
            ))}
          </div>
        </div>
      )}
      </FaRoot>
    </div>
  );
};
