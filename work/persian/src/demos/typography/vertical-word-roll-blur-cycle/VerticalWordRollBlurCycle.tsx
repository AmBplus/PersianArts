// vertical-word-roll-blur-cycle — Persian/RTL localization (Word Roll 竖向词条滚轮).
// TEXT: "Built for" -> «ساخته‌شده برای» ; Apps/Teams/Data/Everyone -> برنامه‌ها / تیم‌ها / داده‌ها / همه
//   (idiomatic product-tagline voice; ZWNJ plurals; the last word stays the short, conclusive one).
// DIRECTION: FaRoot sets direction:rtl, so the flex row reads right-to-left: the stem sits on the RIGHT
//   and the wheel on its LEFT (mirrored, reading order). The wheel column is start-aligned (right edge, next to
//   the stem) via insetInlineStart/width:100% instead of left:0. The group stays centred.
//   KEPT: the reel scrolls UP (translateY) - physical page-flip metaphor, not reading direction;
//   blur stays vertical-feel isotropic filter; no horizontal motion exists in this demo.
// SHAPING: letterSpacing -0.5 removed (0), no uppercase, line-height = ROW (44) with flex centring so the taller
//   Persian ascenders/dots stay inside the row; size fs(30)=33.
// FONT: Vazirmatn (variable, weight 800) - neutral clean product-UI voice matching the light brand film;
//   stem and wheel use the same family/size/weight as the design demands.
// TIMING/EASING/SEEDS: untouched (STEPS, outQuint/outBack mix, blur/opacity/colour ramps, fade-out).
// WIDTH: mask 190 -> 124 design px, re-measured for the Persian word list (longest word «برنامه‌ها» ≈107px) so the
//   group is not left-heavy/empty (source prompt: re-measure width when the word list changes).
// RASTER: none.
// 标语后半词用竖向滚轮循环 Apps→Teams→Data→Everyone：中心词清晰上色，相邻行浅灰带
// 垂直 blur（滚轮景深），每步 outQuint 前快后慢带轻微过冲，落定瞬间中心词从灰染成强调色。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React from 'react';
import { DesignStage, E, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, fs } from '../../_fa';

export const VERTICAL_WORD_ROLL_BLUR_CYCLE_DURATION = 150; // 5000ms @30fps

const ROW = 44;
const WORDS = ['برنامه‌ها', 'تیم‌ها', 'داده‌ها', 'همه'];
// 3 次换词，每次 0.11（≈0.55s）
const STEPS = [0.16, 0.36, 0.56];

const ACCENT = '#4B4BF5';
const ACCENT_DIM = '#B9B9BE';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
// 十六进制颜色按 k 混合（与原 effect.js 的 mixHex 等价）
const mixHex = (a: string, b: string, k: number) => {
  k = clamp01(k);
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export const VerticalWordRollBlurCycle: React.FC = () => {
  const t = useT();

  // 滚轮进度 p：每步 0.7·outQuint + 0.3·outBack（前快后极慢 + 轻微过冲回落）
  let p = 0;
  for (const s of STEPS) {
    const u = seg(t, s, s + 0.11);
    p += 0.7 * E.outQuint(u) + 0.3 * E.outBack(u);
  }

  return (
    <DesignStage bg="#F7F7FA">
      <FaRoot
        family="Vazirmatn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            // 结束整组淡出
            opacity: 1 - seg(t, 0.9, 0.985) * 0.999,
          }}
        >
          <div
            style={{
              fontSize: fs(30),
              fontWeight: 800,
              color: '#0B0B0C',
              letterSpacing: 0,
              lineHeight: `${ROW}px`,
            }}
          >
            ساخته‌شده برای
          </div>
          {/* 三行高的遮罩窗口，滚轮列在其中滑动，中心行 = 第二行 */}
          <div style={{ position: 'relative', height: ROW * 3, width: 124, overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                insetInlineStart: 0,
                width: '100%',
                top: 0,
                transform: `translateY(${ROW - p * ROW}px)`,
              }}
            >
              {WORDS.map((w, i) => {
                const d = Math.abs(i - p);
                // 相邻行方向 blur：距中心 1 行内线性 0→3px，更远 3→5px
                const blur = d < 1 ? 3 * d : 3 + 2 * Math.min(d - 1, 1);
                const op = d < 1 ? 1 - 0.65 * d : Math.max(0.1, 0.35 - 0.23 * (d - 1));
                return (
                  <div
                    key={w}
                    style={{
                      height: ROW,
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: fs(30),
                      fontWeight: 800,
                      letterSpacing: 0,
                      lineHeight: `${ROW}px`,
                      filter: `blur(${blur.toFixed(2)}px)`,
                      opacity: op,
                      // 落定染色：中心词灰→强调色（d 越小越彩）
                      color: mixHex(ACCENT_DIM, ACCENT, clamp01(1 - d * 2.4)),
                    }}
                  >
                    {w}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FaRoot>
    </DesignStage>
  );
};
