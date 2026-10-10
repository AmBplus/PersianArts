// PERSIAN (RTL) localization of "pill-chip-slot-cycle-handled" - timings, easing, seeds and the wheel physics are untouched.
// TEXT: "Your [Sales|Workflow|Admin|Reports] Handled" -> «کارِ [فروش|گردش‌کار|مدیریت|گزارش] شما انجام شد».
//   Idiomatic "work of X is done"; chip words are singular nouns so the sentence stays grammatical for every slot.
//   Word length ratio stays within the source's 2x rule (فروش 4 letters vs گردش‌کار 8).
// DIRECTION: the whole sentence is direction:rtl -> «کارِ» sits at the right, the chip in the middle, «شما انجام شد» at the left.
//   MIRRORED: flex row order, chip padding (paddingLeft -> paddingInlineStart, so emoji + word start at the right edge).
//   KEPT: wheel scrolls upward (vertical, physical/gravity), ghost items above/below and their half-speed parallax,
//   horizontally centred ghosts (symmetric), drop shadow (straight down), chip radius (symmetric), emoji (not directional).
//   The chip width still eases between measured widths, so the neighbours get pushed apart exactly as designed.
// SHAPING: letterSpacing -0.5 removed (breaks joining); no uppercase anywhere. Persian has no tracking effect here.
// FONT: Vazirmatn (variable 100-900: needs 700/800 like the original Inter-style system sans; neutral SaaS product voice).
//   Sizes x1.1 via fs() (30->33, 22->24, 18->20 emoji), because Persian x-height is smaller.
// PADDING FIX (review): the original "+74" slack was tuned to Latin word metrics and left the Persian word cramped at the
//   chip's trailing edge. Now the whole row (emoji + gap + word) is measured and padding 36 is added (12 leading, 24 trailing: the emoji glyph has its own side bearing, so this looks optically equal), so the
//   leading (emoji) and trailing (word) gaps match for all four words.
// MEASURE: widths are measured with offsetWidth; the font is loaded asynchronously, so the measure is repeated after the
//   font is ready under its own delayRender (otherwise the chip would be sized from the fallback font).
// RASTER: none (emoji only).
// pill-chip-slot-cycle-handled — Chip Slot Cycle 胶囊滚轮挤开（motion-lab 定稿转原生 Remotion）
// 白底句式 "Your [chip] Handled"：深色胶囊内词垂直滚轮轮换（Sales→Workflow→Admin→Reports），
// 上下露出灰色幽灵项，胶囊宽度随词长平滑变化，两侧文字被自然挤开收拢。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import { FaRoot, fs, FA_LH } from '../../_fa';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';

export const PILL_CHIP_SLOT_CYCLE_HANDLED_DURATION = 150; // 5000ms @30fps

const WORDS = [
  { w: 'فروش', e: '⚡' },
  { w: 'گردش‌کار', e: '📈' },
  { w: 'مدیریت', e: '⚙️' },
  { w: 'گزارش', e: '📄' },
];
const FONT = `700 ${fs(22)}px "Vazirmatn", sans-serif`;
// 兜底词宽（原 effect.js 未挂载时的估算：字符数×13，再加胶囊内留白 74）；
// 首帧 useLayoutEffect 用 offsetWidth 实测替换，与原渲染逐像素一致
const FALLBACK_WIDTHS = WORDS.map((o) => o.w.length * 13 + 74);

// 两侧静态文字（"Your" / "Handled"）
const SIDE: React.CSSProperties = {
  color: '#15171d',
  fontWeight: 800,
  fontSize: fs(30),
  lineHeight: FA_LH,
  whiteSpace: 'nowrap',
  flex: 'none',
};

export const PillChipSlotCycleHandled: React.FC = () => {
  const t = useT();

  // 量宽：与原 effect.js 相同，用隐藏 span 实测每个词的 offsetWidth（+74 胶囊留白），
  // 只在首次布局量一次；量到前用兜底估算，避免首帧闪动
  const measRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<number[]>(FALLBACK_WIDTHS);
  useLayoutEffect(() => {
    const measure = () => {
      const spans = measRef.current?.children;
      if (!spans) return;
      setWidths(
        WORDS.map((o, i) => ((spans[i] as HTMLElement).offsetWidth || o.w.length * 13 + 30) + 36),
      );
    };
    measure();
    // the Persian font loads asynchronously: measure again once it is ready (held by a delayRender)
    const handle = delayRender('pill-chip-measure');
    document.fonts.load(FONT, 'فروش').then(() => { measure(); continueRender(handle); }, () => continueRender(handle));
  }, []);

  // 三次切换：0.25 / 0.47 / 0.69，每次用 0.12 的 inOutCubic 推进一格
  let pos = 0;
  for (const s0 of [0.25, 0.47, 0.69]) pos += seg(t, s0, s0 + 0.12, E.inOutCubic);
  const ci = Math.min(WORDS.length - 1, Math.floor(pos));
  const frac = pos - ci;
  // 胶囊宽度随当前词→下一词插值，平滑挤开两侧文字
  const chipW = lerp(frac, widths[ci], widths[Math.min(ci + 1, WORDS.length - 1)]);

  // 幽灵项：当前词的前/后邻居，随滚动微移，落定时回到基准透明度
  const near = Math.round(pos);
  const roll = (pos - near) * 48 * 0.5;
  const settle = 1 - Math.min(1, Math.abs(pos - near) * 3);
  const ghost = (top: number): React.CSSProperties => ({
    position: 'absolute',
    left: '50%',
    top,
    font: FONT,
    lineHeight: 1.2,
    color: '#15171d',
    whiteSpace: 'nowrap',
    transform: `translateX(-50%) translateY(${-roll}px)`,
    opacity: 0.13 * (0.4 + settle * 0.6),
  });

  return (
    <DesignStage bg="#fbfbfd">
      <FaRoot
        family="Vazirmatn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 隐藏量宽 span（与原 setup 的 meas 等价，不参与布局显示） */}
        <div ref={measRef} style={{ position: 'absolute', visibility: 'hidden' }}>
          {WORDS.map((o) => (
            <span key={o.w} style={{ whiteSpace: 'nowrap', font: FONT, display: 'inline-flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: fs(18) }}>{o.e}</span>
              <span>{o.w}</span>
            </span>
          ))}
        </div>
        <div style={SIDE}>کارِ</div>
        <div style={{ position: 'relative', flex: 'none' }}>
          {/* 深色胶囊：overflow hidden 里放 4 行词的滚轮列 */}
          <div
            style={{
              position: 'relative',
              height: 48,
              width: chipW,
              margin: '0 14px',
              flex: 'none',
              borderRadius: 99,
              background: '#1a1c24',
              boxShadow: '0 8px 24px rgba(20,22,40,.22)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                transform: `translateY(${-pos * 48}px)`,
              }}
            >
              {WORDS.map(({ w, e }) => (
                <div
                  key={w}
                  style={{
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    paddingInlineStart: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: fs(18) }}>{e}</span>
                  <span style={{ font: FONT, color: '#fff' }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 胶囊外上下的灰色幽灵项 */}
          <div style={ghost(-38)}>{near > 0 ? WORDS[near - 1].w : ''}</div>
          <div style={ghost(58)}>{near < WORDS.length - 1 ? WORDS[near + 1].w : ''}</div>
        </div>
        <div style={SIDE}>شما انجام شد</div>
      </FaRoot>
    </DesignStage>
  );
};
