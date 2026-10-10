// paper-title-card (Persian / RTL localization)
// Original: one sentence stamped word-by-word onto paper (letterpress: scale 1.28->1 + blur 7->0 + opacity), one accent
// word, amber underline scaleX 0->1, mono sub-line with an odometer digit, whole card fades out in the last 8 frames.
//
// TEXT: "All your team's research, one place to go." -> «تمام پژوهش‌های تیم شما، همه در یک جا.» (idiomatic value-prop voice,
//   8 words like the original so the 4f stagger / 9f entrance beats are untouched). Sub-line "5 of 31 fetched today" ->
//   «۵ از ۳۱ مورد امروز دریافت شد»; the odometer digit rolls through Persian digits (۰..۹, same 22f bezier, same delay).
// SHAPING: no letterSpacing (was -0.012em / 0.12em), no uppercase. Per-unit motion is per WORD (never per letter). ZWNJ
//   inside «پژوهش‌های» is kept in the string. Line-height raised to ~1.6 (Persian dots/ascenders), sizes via fs().
// ACCENT: Persian has no italic (a slanted Arabic-script font breaks joining and looks wrong), so the emphasis word «یک»
//   keeps the amber colour and gets a thicker ink stroke (3.5px vs 2.5px) instead of italic.
// DIRECTION: flex row under direction:rtl -> first word is the right-most, the stagger cascades right->left (mirrored,
//   reading order). Underline grows from the START edge (transform-origin right) like the reading direction. Digit
//   column order inside the number is irrelevant (single digit); odometer rolling stays vertical (physical, kept). The
//   centred composition and radial paper glow are symmetric: kept. Sub-line flex row: digit first (right), label after it.
// FONT: Amiri (high-contrast Naskh = the editorial serif voice that replaces ui-serif/Georgia 600). Single weight: the
//   original semi-bold is rebuilt with a 2.5px WebkitTextStroke (no synthesized bold). Markazi Text was tried first and
//   rendered monoline/sans-like (same finding as brand-ink-open). Vazirmatn for the small sub-line (neutral UI text; replaces monospace, whose
//   Persian fallback (Vazir Code) looks stretched). Both loaded via FaFonts.
// RASTER: none. TIMING: all delays, durations, easings and PAPER_TITLE_CARD_DURATION unchanged.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FaFonts, faText, fs, FA_LH } from '../../_fa';

export const PAPER_TITLE_CARD_DURATION = 55; // ≈1.8s @30fps

const SERIF = '"Amiri", "Vazirmatn", serif';
const SANS = '"Vazirmatn", sans-serif';

// 每句恰好一个 accent：功能名/收益词（C2）
const WORDS: { text: string; accent?: boolean }[] = [
  { text: 'تمام' },
  { text: 'پژوهش‌های' },
  { text: 'تیم' },
  { text: 'شما،' },
  { text: 'همه' },
  { text: 'در' },
  { text: 'یک', accent: true },
  { text: 'جا.' },
];
const SUB = 'از ۳۱ مورد امروز دریافت شد';
const SUB_DIGITS = '۵';

// 数字滚动列（odometer 风格，复制自 template DigitRoll，数字带双份拼接保证
// 任何目标位都有滚感；tabular-nums 防横向抖）
const DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const DigitColumn: React.FC<{ ch: string; delay: number; lineH: number; color: string }> = ({ ch, delay, lineH, color }) => {
  const frame = useCurrentFrame();
  const target = DIGITS.indexOf(ch);
  if (target < 0) {
    return <span style={{ fontSize: fs(26), lineHeight: `${lineH}px`, color }}>{ch}</span>;
  }
  const t = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.8, 0.25, 1),
  });
  const offset = (10 + target) * t * lineH;
  return (
    <span style={{ display: 'inline-block', height: lineH }}>
      <span style={{ display: 'block', transform: `translateY(${-offset}px)` }}>
        {(DIGITS + DIGITS).split('').map((d, j) => (
          <span
            key={j}
            style={{
              display: 'block',
              fontSize: fs(26),
              lineHeight: `${lineH}px`,
              color,
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

const DigitRoll: React.FC<{ value: string; delay: number; color: string }> = ({ value, delay, color }) => {
  const lineH = fs(26) * 1.3;
  return (
    <span style={{ display: 'inline-flex', overflow: 'hidden', height: lineH, verticalAlign: 'bottom' }}>
      {value.split('').map((c, i) => (
        <DigitColumn key={i} ch={c} delay={delay + i * 4} lineH={lineH} color={color} />
      ))}
    </span>
  );
};

export const PaperTitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = PAPER_TITLE_CARD_DURATION;
  const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const underline = interpolate(frame, [16, 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const subT = interpolate(frame, [10, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <FaFonts families={['Amiri', 'Vazirmatn']}>
    <AbsoluteFill
      style={{
        direction: 'rtl',
        backgroundColor: 'oklch(97.5% 0.008 82)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
        backgroundImage:
          'radial-gradient(1100px 750px at 50% 42%, oklch(99.3% 0.014 88 / 0.85), transparent 65%)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 1150 }}>
        <div
          style={{
            fontFamily: SERIF,
            ...faText(116),
            WebkitTextStroke: '2.5px currentColor',
            lineHeight: FA_LH * 1.06,
            color: 'oklch(18% 0.006 82)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            columnGap: '0.32em',
          }}
        >
          {WORDS.map((w, i) => {
            const delay = 4 + i * 4;
            const t = interpolate(frame, [delay, delay + 9], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.2, 0.75, 0.3, 1),
            });
            return (
              <span
                key={i}
                style={{
                  opacity: t,
                  transform: `scale(${1.28 - 0.28 * t})`,
                  filter: `blur(${(1 - t) * 7}px)`,
                  display: 'inline-block',
                  WebkitTextStroke: w.accent ? '3.5px currentColor' : undefined,
                  color: w.accent ? 'oklch(52% 0.115 65)' : undefined,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
        <div
          style={{
            height: 6,
            width: 220,
            margin: '38px auto 0',
            borderRadius: 3,
            background: 'oklch(52% 0.115 65)',
            transformOrigin: 'right center',
            transform: `scaleX(${underline})`,
          }}
        />
        <div
          style={{
            ...faText(26),
            fontFamily: SANS,
            color: 'oklch(50% 0.006 82)',
            marginTop: 34,
            opacity: subT,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '0.5em',
          }}
        >
          <DigitRoll value={SUB_DIGITS} delay={12} color="oklch(52% 0.115 65)" />
          <span>{SUB}</span>
        </div>
      </div>
    </AbsoluteFill>
    </FaFonts>
  );
};
