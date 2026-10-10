// pill-slot-cycle (Persian / RTL) -- sentence stem + slot-machine pill cycle.
// TEXT: "یک ابزار هوشمند برای [pill...] انجام همه‌چیز." -> «یک ابزار هوشمند برای» [pill...] «انجام همه‌چیز.»
//   Pills (idiomatic verbal nouns that follow «برای»): پرسیدن سؤال / جست‌وجو در Drive / جست‌وجو در Slack / خلاصه‌سازی /
//   بهبود نوشته / نوشتن دستور جلسه. Drive and Slack stay Latin (product names) inside <bdi>. Icon glyphs are symbols; "?" -> "؟".
//   Same 6 beats, BEAT=21, INTRO=12, SWAP=8, all easings/blur/distances unchanged.
// DIRECTION: the stem is anchored to the RIGHT edge (insetInlineStart:150, was left:300; Persian is wider so the margin shrinks) with direction:rtl, so the slot sits to the
//   LEFT of the stem (reading order) and pills grow leftwards while the stem stays pinned (the card's core rule: stem never moves).
//   Pill: icon chip on the start (right) side, padding 24 start / 36 end (mirror of 24 left / 36 right). Slot children use
//   insetInlineStart:0 so outgoing/incoming stack on the stem-side edge. Vertical slot motion (up/down) is a physical
//   page-flip metaphor: KEPT. Finale text anchored to the same edge.
// SHAPING: letterSpacing -1 removed (0); weights 800/700 from variable Vazirmatn (neutral product/headline voice, 100-900 weights).
//   Sizes via fs(); no per-letter splitting; no raster assets.
// pill-slot-cycle —— 句中词槽轮换：固定句干 + 句尾 pill 老虎机式滚一格
// 源：notion-ai 4.5–8.5s。旧 pill 上飞淡出、新 pill 从下带运动模糊滑入，
// 连换 6 次后 pill 消失、句子落成 "یک ابزار هوشمند برای انجام همه‌چیز." 收束。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';

const FONT = '"Vazirmatn", sans-serif';
const Latin: React.FC<{ children: string }> = ({ children }) => <bdi style={{ direction: 'ltr' }}>{children}</bdi>;

const PILLS: { label: React.ReactNode; icon: string }[] = [
  { label: 'پرسیدن سؤال', icon: '؟' },
  { label: <>جست‌وجو در <Latin>Drive</Latin></>, icon: '▲' },
  { label: <>جست‌وجو در <Latin>Slack</Latin></>, icon: '#' },
  { label: 'خلاصه‌سازی', icon: '≡' },
  { label: 'بهبود نوشته', icon: '✎' },
  { label: 'نوشتن دستور جلسه', icon: '☰' },
];

const BEAT = 21; // ~0.7s @30fps
const INTRO = 12; // 句干入场
const CYCLES = PILLS.length;

const Pill: React.FC<{ label: React.ReactNode; icon: string; style?: React.CSSProperties }> = ({
  label,
  icon,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16,
      padding: '6px 0',
      paddingInlineStart: 24,
      paddingInlineEnd: 36,
      lineHeight: FA_LH,
      borderRadius: 999,
      background: '#fff',
      border: `3px solid ${G.border}`,
      boxShadow: '0 6px 18px rgba(0,0,0,0.10)',
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: fs(64),
      color: G.ink,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span
      style={{
        width: 58,
        height: 58,
        borderRadius: 14,
        background: G.bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
        color: G.mid,
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
    {label}
  </div>
);

export const PillSlotCycle: React.FC = () => {
  const frame = useCurrentFrame();

  // 句干入场：ease-out 上浮淡入
  const stemT = interpolate(frame, [0, INTRO], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const cycleStart = INTRO;
  const cycleEnd = cycleStart + CYCLES * BEAT;

  // 当前处于第几个 pill 拍
  const rel = frame - cycleStart;
  const idx = Math.min(Math.floor(rel / BEAT), CYCLES - 1);
  const beatFrame = rel - idx * BEAT;

  const SWAP = 8; // 每拍前 8f 完成换位

  // 收束段：pill 上飞消失，"انجام همه‌چیز." 从下滑入落位
  const isFinale = frame >= cycleEnd;
  const finT = interpolate(frame, [cycleEnd, cycleEnd + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.4)),
  });

  // 槽内容渲染
  let slot: React.ReactNode = null;
  if (!isFinale && rel >= 0) {
    const incoming = PILLS[idx];
    const outgoing = idx > 0 ? PILLS[idx - 1] : null;

    // 新 pill：从下 +120px 带 blur 滑入，ease-out
    const inT = interpolate(beatFrame, [0, SWAP], [0, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    const inY = interpolate(inT, [0, 1], [120, 0]);
    const inBlur = interpolate(inT, [0, 0.7, 1], [14, 4, 0]);

    // 旧 pill：向上 -120px 加速飞出淡掉
    const outT = interpolate(beatFrame, [0, SWAP - 1], [0, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });
    const outY = interpolate(outT, [0, 1], [0, -130]);

    slot = (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* 撑起槽宽度的隐形占位（当前 pill） */}
        <Pill label={incoming.label} icon={incoming.icon} style={{ visibility: 'hidden' }} />
        {outgoing && outT < 1 && (
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              top: 0,
              transform: `translateY(${outY}px)`,
              opacity: 1 - outT,
              filter: `blur(${outT * 10}px)`,
            }}
          >
            <Pill label={outgoing.label} icon={outgoing.icon} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            top: 0,
            transform: `translateY(${inY}px)`,
            opacity: idx === 0 ? inT : Math.min(1, inT * 1.6),
            filter: `blur(${inBlur}px)`,
          }}
        >
          <Pill label={incoming.label} icon={incoming.icon} />
        </div>
      </div>
    );
  } else if (isFinale) {
    // 最后一个 pill 上飞离场（前 8f），然后 "انجام همه‌چیز." 落位
    const lastOutT = interpolate(frame, [cycleEnd, cycleEnd + 7], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });
    slot = (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: fs(96),
            color: G.ink,
            letterSpacing: 0,
            display: 'inline-block',
            opacity: finT,
            transform: `translateY(${(1 - finT) * 90}px)`,
            filter: `blur(${(1 - finT) * 8}px)`,
            whiteSpace: 'nowrap',
          }}
        >
          انجام همه‌چیز.
        </span>
        {lastOutT < 1 && (
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              top: -8,
              transform: `translateY(${-130 * lastOutT}px)`,
              opacity: 1 - lastOutT,
              filter: `blur(${lastOutT * 10}px)`,
            }}
          >
            <Pill label={PILLS[CYCLES - 1].label} icon={PILLS[CYCLES - 1].icon} />
          </div>
        )}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: G.bg }}>
     <FaRoot family="Vazirmatn">
      {/* 句干固定不动：整行左端锚死，不随 pill 宽度居中重排 */}
      <div
        style={{
          position: 'absolute',
          insetInlineStart: 150,
          top: 540,
          transform: `translateY(calc(-50% + ${(1 - stemT) * 50}px))`,
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          opacity: stemT,
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: fs(96),
            color: G.ink,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
          }}
        >
          یک ابزار هوشمند برای
        </span>
        {slot}
      </div>
     </FaRoot>
    </AbsoluteFill>
  );
};
