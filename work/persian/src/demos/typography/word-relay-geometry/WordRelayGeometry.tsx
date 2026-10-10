// PERSIAN (RTL) localization of shotcraft "word-relay-geometry" — motion, timing, easing, seeds and design coordinates untouched.
// Text: Faster/Better/Stronger -> «سریع‌تر / بهتر / قوی‌تر» (same grammar: three comparatives, as the source prompt demands;
//   ZWNJ kept inside «سریع‌تر»/«قوی‌تر»). Font Estedad 800 (geometric, confident headline voice close to the Helvetica 800 original; variable font so the real 800
//   weight exists, and its heavy joins keep the outline readable; Vazirmatn was tried and looked thinner/fussier in outline). Size 56 -> fs(56)=62 (Persian x-height); no letterSpacing/uppercase were used.
// Direction decisions:
//  - MIRRORED fill reveal: outline->fill clip-path wipe starts at the RIGHT (reading start) edge: inset(-20% 0 -20% X%).
//  - MIRRORED Stronger sheen: highlight sweeps right->left (background-position 0%->100% with the 100deg band mirrored to 260deg,
//    so the light band keeps its slant relative to travel).
//  - KEPT: dashed circle spin (-90 + t*30 deg, clockwise = a spinner/clock-like physical rotation), upward dust drift (gravity /
//    up-down), dust x positions (random, symmetric), centred word block and scale-out 0.86, colours, glow.
//  - Outline layer: every Persian font draws internal overlap seams at letter joins when stroked with a transparent fill. Fix:
//    stroke 2px with paint-order:stroke fill and an opaque #07080c fill, so the inner half of the stroke and the seams are covered
//    and only the outer ~1px outline (the original's visible thickness) remains. Side effect: dust/circle lines no longer show
//    through the glyph interior of the outline layer (tiny, low-opacity elements).
//  - GEOMETRY KEPT AS RENDERED: the original's rotate(-90) on the solid circles also rotates their cx, so the 'Better' circles
//    actually stack vertically (first = bottom, last = top) and the chain is cropped by the frame; this is up/down (physical), so it is
//    left exactly as the original renders. Trim starts at the top, clockwise, unchanged.
// Raster: none (pure vector/DOM).
import React from 'react';
import { DesignStage, E, lerp, rand, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, fs, FA_LH } from '../../_fa';

export const WORD_RELAY_GEOMETRY_DURATION = 180; // 6000ms @30fps

const CIRC_R = 78;
const FONT = 'Estedad';

// 微尘粒子（20 个，种子与原 effect.js 完全一致）
const PARTS = Array.from({ length: 20 }, (_, i) => ({
  size: 1 + rand(i * 3) * 1.4,
  x: rand(i) * 100,
  ph: rand(i + 40),
  sp: 0.5 + rand(i + 80) * 0.8,
}));

// 每个词一段 slot：几何配置 + 时段（in 0.07 + hold + out 0.05）
type Geom = { x: number; r: number; dash?: boolean; d?: number };
const SLOTS: { label: string; geom: Geom[]; t0: number; t1: number }[] = [
  { label: 'سریع‌تر', geom: [{ x: 0, r: CIRC_R + 22, dash: true }], t0: 0.0, t1: 0.36 },
  {
    label: 'بهتر',
    geom: [
      { x: -110, r: 62, d: 0 },
      { x: 0, r: 62, d: 0.06 },
      { x: 110, r: 62, d: 0.12 },
    ],
    t0: 0.32,
    t1: 0.68,
  },
  { label: 'قوی‌تر', geom: [], t0: 0.64, t1: 1.0 },
];

export const WordRelayGeometry: React.FC = () => {
  const t = useT();
  return (
    <DesignStage bg="#07080c">
      <FaRoot family={FONT} style={{ inset: 0 }}>
      {/* 微尘粒子：缓慢上浮 loop + 呼吸闪烁 */}
      {PARTS.map((p, i) => {
        const y = (1 - ((t * p.sp + p.ph) % 1)) * 110 - 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: '#fff',
              left: `${p.x}%`,
              top: `${y}%`,
              opacity: 0.12 + 0.18 * Math.sin((t * 3 + p.ph) * Math.PI * 2) ** 2,
            }}
          />
        );
      })}

      {SLOTS.map(({ label, geom, t0, t1 }, i) => {
        const isLast = i === SLOTS.length - 1;
        const tin = seg(t, t0, t0 + 0.07, E.outCubic);
        const tout = isLast ? 0 : seg(t, t1 - 0.05, t1, E.inQuad);
        const alive = tin > 0 && tout < 1;

        // Faster/Better：outline→fill 左起 clip 揭示
        const fillp = seg(t, t0 + 0.06, t0 + 0.18, E.inOutCubic);
        // Stronger：描边→sheen 扫光→收纯白
        const sh = seg(t, t0 + 0.05, t0 + 0.2, E.outQuad); // 出现（描边→sheen）
        const sweep = seg(t, t0 + 0.08, t0 + 0.26, E.inOutCubic); // 扫光位置
        const white = seg(t, t0 + 0.27, t0 + 0.34, E.outQuad); // 收为纯白

        return (
          <div key={label} style={{ position: 'absolute', inset: 0, opacity: alive ? tin * (1 - tout) : 0 }}>
            <svg
              viewBox="-240 -135 480 270"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              {geom.map((g, k) => {
                if (g.dash) {
                  // 虚线大圆：整体从 0.4 生长到 1 并持续慢转
                  const grow = seg(t, t0 + 0.01, t0 + 0.14, E.outCubic);
                  return (
                    <circle
                      key={k}
                      cx={g.x}
                      cy={0}
                      r={g.r}
                      fill="none"
                      stroke="#565e78"
                      strokeWidth={1.1}
                      strokeDasharray="5 7"
                      opacity={grow * (1 - tout)}
                      transform={`rotate(${-90 + t * 30}) scale(${lerp(grow, 0.4, 1)})`}
                    />
                  );
                }
                // 实线圆：pathLength 归一化 trim 生长 / 出场反向消隐
                const trim =
                  seg(t, t0 + 0.02 + (g.d || 0), t0 + 0.14 + (g.d || 0), E.outCubic) -
                  seg(t, t1 - 0.06, t1, E.inQuad) * (isLast ? 0 : 1);
                return (
                  <circle
                    key={k}
                    cx={g.x}
                    cy={0}
                    r={g.r}
                    fill="none"
                    stroke="#565e78"
                    strokeWidth={1.1}
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - Math.max(0, trim)}
                    transform="rotate(-90)"
                  />
                );
              })}
            </svg>
            {/* 词组：outline 打底，fill/sheen 绝对层叠 */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%,-52%) scale(${lerp(tout, 1, 0.86)})`,
                fontSize: fs(56),
                fontWeight: 800,
                lineHeight: FA_LH,
                whiteSpace: 'nowrap',
                letterSpacing: 0,
              }}
            >
              <div
                style={{
                  color: '#07080c',
                  WebkitTextStroke: '2px #6a7186',
                  paintOrder: 'stroke fill',
                  opacity: isLast ? 1 - sh : 1 - fillp * 0.75,
                }}
              >
                {label}
              </div>
              {isLast ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      color: '#fff',
                      opacity: white,
                      textShadow: `0 0 ${white * 18}px rgba(255,255,255,.3)`,
                    }}
                  >
                    {label}
                  </div>
                  {/* 金属 sheen：渐变 background-clip 文字，背景位从右扫到左 */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      color: 'transparent',
                      backgroundImage:
                        'linear-gradient(260deg,#585f72 0%,#8d95aa 38%,#ffffff 50%,#8d95aa 62%,#585f72 100%)',
                      backgroundSize: '280% 100%',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      opacity: sh * (1 - white),
                      backgroundPosition: `${lerp(sweep, 0, 100)}% 0`,
                    }}
                  >
                    {label}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: '#fff',
                    clipPath: `inset(-20% 0 -20% ${(1 - fillp) * 100}%)`,
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          </div>
        );
      })}
      </FaRoot>
    </DesignStage>
  );
};
