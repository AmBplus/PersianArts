// PERSIAN (RTL) localization of shotcraft "picker-carousel-feature-cycle".
// Text: the seven product-feature labels become concise Persian UI labels; the AI token remains Latin as a
// universally recognised technical mark. Vazirmatn is loaded through FaRoot: its variable weights retain the
// compact, neutral product-UI role of Helvetica while its Persian glyphs remain legible in the 34px rows.
// Direction decisions: this is a vertical physical picker, so vertical travel, item order, fixed centre pill,
// opacity/size falloff, gradient, and the outQuint/hold/breath timings stay exactly as source. The icon moves to
// the RTL start (right) of each feature label. The fixed AI badge mirrors from the source's left exterior to the
// reading-side right exterior; its fade is unchanged. There are no raster assets. Persian text has no tracking,
// uppercase, or per-character splitting; sizes use fs() and the one-line leading remains deliberately compact.
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faText, fs } from '../../_fa';

export const PICKER_CAROUSEL_FEATURE_CYCLE_DURATION = 108; // 3600ms @30fps

const PAPER = '#F3F3F1';
const INK = '#111113';
const MID = '#8A8A8F';
const ROW_H = 34; // 单行高度
const ITEMS = [
  'پاک‌سازی داده‌ها',
  'پیام مستقیم',
  'بخش‌بندی هوشمند',
  'اقدام‌های گروهی',
  'برنامهٔ پاداش',
  'گردش‌کارهای خودکار',
  'آزمون نسخه‌ها',
];
const ICONS = ['◎', '✉', '◧', '◈', '★', '↺', '⚑'];
const STEPS = 5; // 五次吸附推进
const HOLD = 5 / 14; // 每步末段静止占比（≈4–5 帧不动）

export const PickerCarouselFeatureCycle: React.FC = () => {
  const t = useT();

  // 主时间轴：t∈[0.05,0.95] 均分 5 步；步内前 (1-HOLD) 用 outQuint 吸附，末段静止
  const g = seg(t, 0.05, 0.95) * STEPS;
  const step = Math.min(STEPS - 1, Math.floor(g));
  const local = Math.min(1, g - step);
  const mv = E.outQuint(Math.min(1, local / (1 - HOLD)));
  const pos = step + mv;

  // 落定呼吸：吸附完成进入 HOLD 后，药丸 scaleY 1→1.06→1 极轻脉冲
  const land = Math.max(0, (local - (1 - HOLD)) / HOLD);
  const breath = land > 0 ? Math.sin(Math.min(1, land / 0.6) * Math.PI) * 0.06 : 0;

  return (
    <DesignStage bg={PAPER}>
      {/* 纸面底 —— 与原采集页 paper() 容器一致 */}
      <FaRoot family="Vazirmatn">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: PAPER,
        }}
      >
        {/* 选择器视口：300×(34×5) 居中，整体在开头 5% 内淡入 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 300,
            height: ROW_H * 5,
            transform: 'translate(-50%,-50%)',
            overflow: 'hidden',
            opacity: seg(t, 0, 0.05),
          }}
        >
          {/* 焦点药丸：位置不动，仅落定时 scaleY 呼吸。
              原采集页是 content-box，带 1px 边框需显式声明，否则高度差 2px */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: ROW_H * 2,
              height: ROW_H,
              boxSizing: 'content-box',
              borderRadius: 999,
              background: '#fff',
              border: '1px solid #E3E3E6',
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              transform: `scaleY(${1 + breath})`,
            }}
          />
          {/* 内容列：整列 translateY 穿过焦点药丸 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              transform: `translateY(${ROW_H * 2 - pos * ROW_H}px)`,
            }}
          >
            {ITEMS.map((txt, i) => {
              // 按到中心距离分层：透明度两段线性、字号 17→14、颜色三档灰度
              const d = Math.abs(i - pos);
              const k2 = Math.min(2, d);
              const o = k2 <= 1 ? lerp(k2, 1, 0.55) : lerp(k2 - 1, 0.55, 0.18);
              return (
                <div
                  key={i}
                  style={{
                    height: ROW_H,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 600,
                    ...faText(lerp(Math.min(1, d / 2), 17, 14), {lineHeight: 1.2}),
                    color: d < 0.5 ? INK : d < 1.5 ? MID : '#B9B9BE',
                    opacity: o,
                  }}
                >
                  {/* 图标仅在贴近焦点时浮现（d<0.625 内可见） */}
                    <span style={{ fontSize: fs(14), opacity: Math.max(0, 1 - d * 1.6), flexShrink: 0 }}>
                    {ICONS[i]}
                  </span>
                  <span>{txt}</span>
                </div>
              );
            })}
          </div>
          {/* 上下渐隐罩：纸色→透明→纸色，盖在列表之上 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `linear-gradient(180deg,${PAPER} 0%,rgba(243,243,241,0) 26%,rgba(243,243,241,0) 74%,${PAPER} 100%)`,
            }}
          />
        </div>
        {/* RTL reading-side fixed AI badge: black rounded square, slightly delayed fade-in. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            margin: '-11px 0 0 160px',
            width: 26,
            height: 22,
            borderRadius: 6,
            background: INK,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 10,
            lineHeight: 1,
            letterSpacing: 0.5,
            opacity: seg(t, 0.02, 0.09),
          }}
        >
          <bdi dir="ltr">AI</bdi>
        </div>
      </div>
      </FaRoot>
    </DesignStage>
  );
};
