// blur-slide — Persian/RTL localization (faithful: same timing, easing, blur/y/opacity single-p, seeds untouched).
// TEXT: headline 4 words "تیتر شما اینجا می‌نشیند" (keeps 4-word stagger), subtitle 5 words
//   "زیرعنوان کوتاه برای متن نمونه" (keeps 5 words) -> original beats (gap 0.055 / 0.04) unchanged.
//   Units are whole words (split on space); "می‌نشیند" keeps its ZWNJ inside one span, never split into letters.
// SHAPING: letterSpacing -0.5px removed (breaks joining); no uppercase; line-height raised (1.15->FA_LH-based 1.5 /
//   1.4->1.7) because Persian dots/descenders are taller; font size via fs() (x1.1).
// DIRECTION: FaRoot gives direction:rtl, so the flex word row lays out first word at the RIGHT = mirrored stagger
//   order (reading order). Vertical y-rise (gravity/up-down) is KEPT: it is not reading-direction. Centered column
//   stays centered (symmetric). No physical left/right values exist in the original.
// FONT: Vazirmatn (variable, 800 for headline / 400 subtitle) - neutral product-UI voice, true weights exist for the
//   34px/800 vs 14px/400 hierarchy.
// RASTER: none. Blur filter is non-directional and kept.
// blur-slide — Blur Slide 逐词入场（motion-lab 定稿转原生 Remotion）
// 标题逐词入场：y 40→0 + blur 10→0 + opacity 0→1，词间 stagger 极短（1 帧量级），
// easeOutCubic——y/blur/opacity 三通道同缓动同步收敛的"专业文字 reveal"；副标题随后同法跟进。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React from 'react';
import { FaRoot, fs, FA_LH } from '../../../persian/src/demos/_fa';
import { DesignStage, E, lerp, seg, useT } from '../../../persian/src/demos/_fixtures/Motion';

export const BLUR_SLIDE_DURATION = 114; // 3800ms @30fps

// 占位文案：词数与字长贴近原稿，替换时保持 4 词 / 5 词以维持 stagger 节奏
const H1_WORDS = 'آموزشِ امروز، دانشگاهِ فردا'.split(' ');
const H2_WORDS = 'سامانهٔ جامع آموزش دانشگاه آزاد اسلامی واحد مشهد'.split(' ');

// 单行逐词渲染：tLine 是该行的归一化进度，gap 为词间 stagger，dy 为入场位移
const Line: React.FC<{
  words: string[];
  tLine: number;
  gap: number;
  dy: number;
  style: React.CSSProperties;
}> = ({ words, tLine, gap, dy, style }) => (
  <div style={{ display: 'flex', direction: 'rtl', gap: '0.32em', ...style }}>
    {words.map((w, i) => {
      const p = seg(tLine, i * gap, i * gap + 0.32, E.outCubic);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            letterSpacing: 0,
            opacity: p,
            transform: `translateY(${lerp(p, dy, 0)}px)`,
            filter: `blur(${(1 - p) * 10}px)`,
          }}
        >
          {w}
        </span>
      );
    })}
  </div>
);

export const BlurSlide: React.FC = () => {
  const t = useT();
  return (
    <DesignStage bg="#0a0b10">
      <FaRoot family="Vazirmatn">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {/* 主标题先入场，副标题时间窗错后跟进 */}
        <Line
          words={H1_WORDS}
          tLine={seg(t, 0.06, 0.62)}
          gap={0.055}
          dy={40}
          style={{
            fontWeight: 800,
            fontSize: fs(34),
            lineHeight: FA_LH,
            color: '#eef1fa',
            letterSpacing: 0,
          }}
        />
        <Line
          words={H2_WORDS}
          tLine={seg(t, 0.34, 0.9)}
          gap={0.04}
          dy={26}
          style={{
            fontWeight: 400,
            fontSize: fs(14),
            lineHeight: FA_LH + 0.1,
            color: '#7d86a3',
          }}
        />
      </div>
      </FaRoot>
    </DesignStage>
  );
};
