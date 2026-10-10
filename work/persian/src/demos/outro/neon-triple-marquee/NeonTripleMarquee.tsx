// neon-triple-marquee — Persian/RTL localization (original: clickup-30 61-64.5s, BETTER / FASTER / STRONGER).
// TEXT: BETTER -> «بهتر», FASTER -> «سریع‌تر», STRONGER -> «قوی‌تر» (same comparative-slogan voice; ZWNJ before «تر»).
//   Each marquee copy is a whole word (never split), letterSpacing 0, no uppercase; separator bullet kept (symmetric glyph).
// FONT: Lalezar (poster/impact display, single weight, no fake bold). Its heavy monoline outlines read well as hollow neon
//   stroke; the weight is already 'black' so no weight is requested.
// DIRECTION (decided per item):
//   - Row travel MIRRORED: rows 1 & 3 drove right in the original (reading flow of Latin), now drive LEFT (the Persian
//     reading direction); row 2 drove left, now drives RIGHT. The counter-flow "surround" feel is preserved.
//   - Copies are anchored from the RIGHT edge (insetInlineStart in an RTL root) so the first word sits at the reading start.
//   - Speeds 14/17/14 px/f, linear easing, 45 f pulse period, 15 f phase offset, fades 10/20 f, row order top-to-bottom,
//     colours and glow: KEPT (motion design and physics of light; vertical stacking is not reading-direction dependent).
//   - Row order (blue/pink/amber top-down) kept: vertical order is not mirrored.
// SIZES: 300 -> 330 px (kit's 1.1x Persian compensation, via fs()); the 350 px row pitch is kept.
// OUTLINE: Lalezar glyphs overlap at joins, so -webkit-text-stroke showed inner contours; replaced by an SVG morphology
//   outline (dilate minus erode of the filled text) with the same 5->8 px width; glow/opacity/pulse untouched.
// SLOTS: per-word measured widths (widthEm) replace the Latin 0.92em/char estimate; unitW = width + 1.3em as designed.
// RASTER: none.
// neon-triple-marquee —— clickup-30 61–64.5s
// 三行霓虹描边巨字 BETTER/FASTER/STRONGER 满屏排布，
// 奇偶行反向匀速无限滚动（marquee 允许 linear），
// 三行明暗轮流脉冲（一行亮时其余压暗），结尾整组淡出。
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { FaRoot } from '../../_fa';

const FONT = '"Lalezar", "Vazirmatn", sans-serif';

// 单行 marquee：副本按固定 unitW 等距绝对定位，平移取模 → 回绕无缝。
const MarqueeRow: React.FC<{
  word: string;
  widthEm: number; // measured advance of the Persian word (em)
  color: string;
  dir: 1 | -1;
  speed: number; // px/frame
  frame: number;
  y: number;
  fontSize: number;
  brightness: number; // 0..1 脉冲亮度
}> = ({ word, widthEm, color, dir, speed, frame, y, fontSize, brightness }) => {
  // slot width from the measured Persian word width (the Latin per-character estimate does not apply)
  const est = widthEm * fontSize;
  const unitW = est + fontSize * 1.3; // 词间空隙（含分隔点）
  const copies = Math.ceil(1920 / unitW) + 3;
  const offsetRaw = (frame * speed) % unitW;
  // RTL mirror: the original physical offset is negated and copies are anchored to the right edge.
  const offset = -(dir === 1 ? -unitW * 1.5 + offsetRaw : -unitW * 0.5 - offsetRaw);

  // Lalezar's glyphs overlap at joins, so CSS text-stroke would draw the inner contours. Outline = dilate(alpha) minus
  // erode(alpha) of the filled text: a clean union outline, centred like the original stroke (5 -> 8 px).
  const strokeW = 5 + brightness * 3;
  const r = strokeW / 2;
  const fid = `neon-outline-${word.length}-${Math.round(y)}`;

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        right: 0,
        width: '100%',
        height: fontSize * 1.1,
        overflow: 'visible',
        transform: `translateX(${offset}px)`,
        fontFamily: FONT,
        fontSize,
        letterSpacing: 0,
        direction: 'rtl',
        lineHeight: 1,
        color,
        opacity: 0.35 + brightness * 0.65,
        filter: `url(#${fid}) drop-shadow(0 0 ${8 + brightness * 22}px ${color}) drop-shadow(0 0 ${
          20 + brightness * 50
        }px ${color})`,
      }}
    >
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <filter id={fid} filterUnits="userSpaceOnUse" x={-3000} y={-300} width={8000} height={fontSize * 2} colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="d" />
          <feMorphology in="SourceAlpha" operator="erode" radius={r} result="e" />
          <feComposite in="d" in2="e" operator="out" result="ring" />
          <feFlood floodColor={color} />
          <feComposite in2="ring" operator="in" />
        </filter>
      </svg>
      {Array.from({ length: copies }).map((_, i) => (
        <span
          key={i}
          style={{ position: 'absolute', right: i * unitW, top: 0, whiteSpace: 'nowrap' }}
        >
          {word}
          <span style={{ display: 'inline-block', transform: `translateX(${-fontSize * 0.4}px)` }}>
            {'•'}
          </span>
        </span>
      ))}
    </div>
  );
};

export const NeonTripleMarquee: React.FC = () => {
  const f = useCurrentFrame();

  // 三行轮流脉冲：周期 45 帧，每行占 1/3 相位，余弦软脉冲
  const pulse = (idx: number) => {
    const period = 45;
    const phase = (((f - idx * (period / 3)) % period) + period) % period;
    const t = phase / period;
    if (t < 1 / 3) return 0.5 - 0.5 * Math.cos(t * 3 * Math.PI * 2);
    return 0;
  };

  // 入场淡入 + 结尾整组淡出
  const groupOpacity = interpolate(f, [0, 10, 128, 148], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const rows: { word: string; widthEm: number; color: string; dir: 1 | -1; speed: number }[] = [
    { word: 'بهتر', widthEm: 1.4, color: '#4d9fff', dir: 1, speed: 14 },
    { word: 'سریع‌تر', widthEm: 2.6, color: '#ff4dd2', dir: -1, speed: 17 },
    { word: 'قوی‌تر', widthEm: 2.15, color: '#ffb347', dir: 1, speed: 14 },
  ];

  return (
    <FaRoot family="Lalezar" style={{ background: '#050308', overflow: 'hidden' }}>
      <div style={{ opacity: groupOpacity, position: 'absolute', inset: 0 }}>
        {rows.map((r, i) => (
          <MarqueeRow
            key={r.word}
            word={r.word}
            widthEm={r.widthEm}
            color={r.color}
            dir={r.dir}
            speed={r.speed}
            frame={f}
            y={40 + i * 350}
            fontSize={330}
            brightness={pulse(i)}
          />
        ))}
      </div>
    </FaRoot>
  );
};
