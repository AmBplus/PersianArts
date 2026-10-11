// PERSIAN (RTL) localization of shotcraft "spectrum-morph-ui" — timing, easing, seed and bar maths are untouched.
// Text: "LAUNCH WEEK" -> «یک سامانه، همهٔ دانشگاه» (product-launch voice; two words, about the same visual mass as the Latin headline).
//  letterSpacing -1 and the heavy Helvetica caps are dropped (they break joining); the weight is carried by the font instead.
// Font: Lalezar — a poster/impact display face (single weight, so no fake bold) = the role of Helvetica 800. Size fs(150)=165 (larger than fs(120): Persian two-word headline is narrower than the Latin caps),
//  wordSpacing .15em because Lalezar's word gap is tight at display size, lineHeight 1.3 (its glyph box is tall).
// Direction decisions:
//  - MIRRORED: the spectrum frequency axis. The bars are a left->right category axis (bass at the left, treble at the right);
//    for a Persian reader the axis starts at the right, so bar i sits at the right end for i=0 (tallest bass bar on the right,
//    envelope falls toward the left). The wobble/jitter/env maths per index are untouched, only the x slot is (N-1-i).
//  - KEPT: the underline is centred and symmetric (600..1320 of 1920), so the collapse back into a line is pixel-identical
//    regardless of direction; bars grow upward from the line (gravity/physical), title is centred (textAlign center is neutral).
//  - KEPT: gap/width interpolation, collapse timing, conditional mount of the solid line (pixel-still ending).
//  - No raster assets in this demo.
// Original: spectrum-morph-ui —— 频谱化 UI
// 标题 "LAUNCH WEEK" 下方 8px ink 下划线（720px）。25f 起裂成 28 根竖条
// （20px 宽、6px 间隙），条高按伪 FFT 跳动 64f（低频端高、高频端矮的包络），
// 条底对齐原线、向上生长。两小节后 12f 收拢回 8px 直线，收线后真静止 ≥35f。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../../persian/src/demos/_fixtures/Fixtures';
import { FaRoot, fs, faText } from '../../../persian/src/demos/_fa';

// 库内标准 seed hash（帧确定，无 Math.random）
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const LINE_W = 720;
const LINE_H = 8;
const LINE_X = (1920 - LINE_W) / 2; // 600
const LINE_BOTTOM = 620; // 下划线底边 y（条从这里向上长）

const N_BARS = 28;
const GAP_MAX = 6;

const SPLIT = 25; // 裂开起点
const SPLIT_DUR = 8; // 裂开 & 幅度爬升
const DANCE = 64; // 跳动两小节
const COLLAPSE_START = SPLIT + DANCE; // 89
const COLLAPSE_DUR = 12;
const COLLAPSE_END = COLLAPSE_START + COLLAPSE_DUR; // 101 → 之后真静止 39f

const AMP = 92; // 理论峰值 8 + 92 = 100px；wobble×jitter×env 很少同时取满，实测峰值 ~80px

// 低频端高、高频端矮的包络
const env = (i: number) => 0.4 + 0.6 * Math.pow(1 - i / (N_BARS - 1), 1.1);

export const SpectrumMorphUi: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 幅度爬升（扩散 → out-cubic）与收拢（12f 归零）
  const rampIn = interpolate(frame, [SPLIT, SPLIT + SPLIT_DUR], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rampOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_END], [1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const amp = rampIn * rampOut;

  // 间隙：裂开时 0→6，收拢时 6→0（收拢结束恰好合成整线）
  const gapIn = interpolate(frame, [SPLIT, SPLIT + SPLIT_DUR], [0, GAP_MAX], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gapOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_END], [GAP_MAX, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const gap = Math.min(gapIn, gapOut);
  const barW = (LINE_W - (N_BARS - 1) * gap) / N_BARS; // gap=6 时 ≈20px

  // 条形阶段以外条件挂载整线（摘罩=条件挂载，保证收尾像素级静止）
  const barsActive = frame >= SPLIT && frame < COLLAPSE_END;

  return (
    <FaRoot family="Lalezar" style={{ background: G.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 310,
          width: '100%',
          textAlign: 'center',
          opacity: titleOp,
          ...faText(150, { lineHeight: 1.3, wordSpacing: '0.15em', fontWeight: 400 }),
          color: G.ink,
        }}
      >
        یک سامانه، همهٔ دانشگاه
      </div>

      {!barsActive && (
        <div
          style={{
            position: 'absolute',
            left: LINE_X,
            top: LINE_BOTTOM - LINE_H,
            width: LINE_W,
            height: LINE_H,
            background: G.ink,
            borderRadius: 4,
          }}
        />
      )}

      {barsActive &&
        Array.from({ length: N_BARS }).map((_, i) => {
          // 伪 FFT：|sin| 摆动 × 每 4 帧换挡的 seed 随机 × 频段包络 × 幅度包络
          const wobble = Math.abs(Math.sin(i * 0.7 + frame * 0.31));
          const jitter = 0.4 + 0.6 * h(i * 13 + Math.floor(frame / 4));
          const barH = LINE_H + AMP * wobble * jitter * env(i) * amp;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: LINE_X + (N_BARS - 1 - i) * (barW + gap), // frequency axis mirrored: bass bar i=0 at the right
                top: LINE_BOTTOM - barH, // 底边对齐原线，向上长
                width: barW + (gap < 1 ? 0.5 : 0), // gap 收到 0 时补 0.5px 防细缝
                height: barH,
                background: G.ink,
                borderRadius: 3,
              }}
            />
          );
        })}
    </FaRoot>
  );
};
