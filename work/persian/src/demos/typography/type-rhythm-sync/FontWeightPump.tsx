// PERSIAN (RTL) localization of shotcraft "font-weight-pump" — beats, envelope, stroke/weight jumps untouched.
//  - Text: "PUMP IT UP" -> «حالشو ببر بالا» (colloquial, club/DJ voice; 3 words like the original).
//  - Font: Estedad (variable 100-900, heavy poster-like Persian sans). The effect NEEDS a real weight jump 400<->900 on top of
//    the stroke, so single-weight display fonts (Lalezar...) are excluded. Loaded through FaRoot.
//  - letterSpacing 6 -> 0 and no uppercase (break joining). fontSize 150 -> fs(150); explicit lineHeight FA_LH.
//  - The title is centered and the accent scaleX pivots on its center: symmetric, nothing to mirror.
//  - Beat dots: container gets direction:rtl through FaRoot, so the first beat (frame 30) is the RIGHT-most dot and the
//    row fills along the reading direction (decision: MIRROR order; dots are centered so balance is unchanged).
//  - Mild extra: WebkitTextStroke paints over joined strokes in the same ink colour, so no seams appear.
//  - Raster: none. Digits: none on screen.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';

const BEATS = [30, 50, 70, 90, 110];
const ACCENTS = new Set([2, 4]); // 第 3、5 拍重音
const DECAY = 10; // 衰减帧数

// 命中后 10f 幂衰减包络：t=0 → 1，t>=10 → 精确 0（保证结尾真静止）
const envAt = (frame: number, beat: number) => {
  const t = frame - beat;
  if (t < 0 || t >= DECAY) return 0;
  return Math.pow(1 - t / DECAY, 0.8);
};

export const FontWeightPump: React.FC = () => {
  const frame = useCurrentFrame();

  // 只可能有一个活跃拍（拍距 20f > 衰减 10f），取最大包络及其拍序号
  let env = 0;
  let activeBeat = -1;
  BEATS.forEach((b, i) => {
    const e = envAt(frame, b);
    if (e > env) {
      env = e;
      activeBeat = i;
    }
  });

  const strokeW = 10 * env; // 笔画粗细连续衰减
  const weight = env > 0.15 ? 900 : 400; // 命中窗口离散跳字重
  const accent = activeBeat >= 0 && ACCENTS.has(activeBeat);
  const scaleX = accent ? 1 + 0.08 * env : 1; // 重音拍变宽一挡

  return (
    <FaRoot
      family="Estedad"
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        overflow: 'hidden',
      }}
    >
      {/* 定宽居中容器，transform 缩放不改排版 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: fs(150),
            fontWeight: weight,
            color: G.ink,
            letterSpacing: 0,
            lineHeight: FA_LH,
            whiteSpace: 'nowrap',
            WebkitTextStroke: `${strokeW}px ${G.ink}`,
            transform: `scaleX(${scaleX})`,
            transformOrigin: 'center center',
          }}
        >
          حالشو ببر بالا
        </div>
      </div>

      {/* 底部节拍点：5 个，命中哪拍哪个点闪 ink 并放大 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 130,
          width: 1920,
          display: 'flex',
          justifyContent: 'center',
          gap: 56,
        }}
      >
        {BEATS.map((b, i) => {
          const e = envAt(frame, b);
          const dotOpacity = e > 0.02 ? Math.min(1, 0.3 + e * 1.2) : 0;
          const dotScale = 1 + 0.8 * e;
          return (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                background: G.line,
                position: 'relative',
                transform: `scale(${dotScale})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 13,
                  background: G.ink,
                  opacity: dotOpacity,
                }}
              />
            </div>
          );
        })}
      </div>
    </FaRoot>
  );
};
