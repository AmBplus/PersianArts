// Persian localization analysis — radial-wave / RadialWave
// On-screen text: none. The source is a text-free, symmetric 17×9 dot field, so there is no copy or font to localize.
// Direction decisions: keep all dot coordinates and both radial waves unchanged. Their center-out / outer-in paths are
// geometric effects around a centered source, not reading-order motion; mirroring would not change meaning or improve RTL.
// Preserve the exact 114-frame duration, Euclidean distance staggering, scale overshoot, colors, opacity, and pulse timing.
// Raster handling: none; the composition draws its dots as DOM circles and contains no image/video textures.
// Render status: frame inspection is blocked in this environment (harness bundle failed; see report.json).
// دایره‌های ۱۷×۹، موج نخست از مرکز به بیرون و موج دوم از محیط به مرکز؛ زمان‌بندی و مختصات همان نسخهٔ اصلی است.
import React from 'react';
import { DesignStage, E, seg, useT } from '../../_fixtures/Motion';

export const RADIAL_WAVE_DURATION = 114; // 3800ms @30fps

const COLS = 17;
const ROWS = 9;
const CX = (COLS - 1) / 2;
const CY = (ROWS - 1) / 2;
const MAX_D = Math.hypot(CX, CY);

const DOTS = Array.from({ length: ROWS * COLS }, (_, i) => {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  return {
    left: `${((c + 0.5) / COLS) * 100}%`,
    top: `${((r + 0.5) / ROWS) * 100}%`,
    dist: Math.hypot(c - CX, r - CY) / MAX_D,
  };
});

export const RadialWave: React.FC = () => {
  const t = useT();
  return (
    <DesignStage bg="#0a0b10">
      {DOTS.map(({ left, top, dist }, i) => {
        // 第一道波：扩散点亮；第二道波：反向脉冲
        const w1 = seg(t, dist * 0.35, dist * 0.35 + 0.18, E.outCubic);
        const w2 = seg(t, 0.62 + (1 - dist) * 0.25, 0.62 + (1 - dist) * 0.25 + 0.15);
        const pulse2 = Math.sin(w2 * Math.PI);
        const s = w1 * (1 + 0.5 * Math.sin(w1 * Math.PI)) + pulse2 * 0.8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              borderRadius: '50%',
              left,
              top,
              margin: -5,
              background: pulse2 > 0.3 ? '#b9f2ff' : '#6c8cff',
              transform: `scale(${s})`,
              opacity: 0.25 + w1 * 0.5 + pulse2 * 0.25,
              boxShadow: pulse2 > 0.3 ? '0 0 12px #7fd8ff' : 'none',
            }}
          />
        );
      })}
    </DesignStage>
  );
};
