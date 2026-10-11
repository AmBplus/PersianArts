// value-stagger-gradient — گرادیان مقدار با stagger (بومی‌سازی فارسی/RTL از نسخهٔ motion-lab)
//
// PERSIAN LOCALIZATION NOTES (all decisions, with reasons):
// TEXT:
//  - The only on-screen string in the original is the bottom caption: two anime.js API
//    call strings ('scale: stagger([1, 0.35])  hue: ...' / "pulse: stagger([.06,.42],...)").
//    The source prompt itself notes these are technique annotations, not content, and in
//    real footage must become a semantic title (or be dropped). Leaving raw English code
//    would also violate the "no unintended foreign text" rule, so each string is replaced
//    by an idiomatic PERSIAN semantic caption that says exactly what each beat does
//    (beat 1: staggered entry with value gradients; beat 2: pulse staggered from center).
//    The beats are untouched: same fade-in window seg(t,0.04,0.12), same HARD CUT at
//    t=0.52 between the two captions.
//  - No Latin survives (no code/URL islands needed); Persian digits are not needed since
//    the captions carry no numbers.
// DIRECTION:
//  - Beat-1 cascade origin MIRRORED: in the original the "first" bar (i=0: blue hue 200,
//    tallest, first to move, longest travel/blur) sits at the LEFT edge and the ramp
//    reads left->right. Stagger order is reading-order semantics (checklist: "first item =
//    right-most"), so bar i is anchored with right: 8+i*5.4% — the blue/tall/first bar is
//    now at the RIGHT and the hue/height/travel ramp reads right->left for Persian readers.
//    The decorative dots mirror with the same +1.2% inward centering offset.
//  - Beat-2 center pulse KEPT: distC = |i-7.5|/7.5 is physically symmetric about the
//    center axis; "from:'center'" has no reading direction. Delays (distC*0.13), amplitude
//    gradient, brightness pulse: unchanged.
//  - Caption stays centered (left:50% + translateX(-50%) is direction-neutral); vertical
//    position, color and opacity ramp unchanged.
// TIMING/EASING: every seg()/d()/amp/hue/height value, N=16 and the easing curves are
//  identical to upstream. VALUE_STAGGER_GRADIENT_DURATION = 150 kept.
// FONT: Vazirmatn — neutral product-UI voice for tiny technical chrome text; variable
//  weight, full Persian digit/punctuation/ZWNJ coverage. Caption uses faText/fs (x1.1,
//  letterSpacing forced to 0 — the original's 1.5px tracking on Latin mono must not
//  survive on joined Persian script).
// RASTER: none in this demo (pure divs); nothing to sanitize.
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../../persian/src/demos/_fixtures/Motion';
import { FaRoot, faText } from '../../../persian/src/demos/_fa';

export const VALUE_STAGGER_GRADIENT_DURATION = 150; // 5000ms @30fps

// 数值梯度 util（等价 stagger([a,b]) 的 value 模式）
const staggerVal = (i: number, n: number, a: number, b: number, ease?: (x: number) => number) => {
  let k = n <= 1 ? 0 : i / (n - 1);
  if (ease) k = ease(k);
  return lerp(k, a, b);
};

const N = 16;
const C = (N - 1) / 2;
const BARS = Array.from({ length: N }, (_, i) => ({
  i,
  hue: staggerVal(i, N, 200, 320), // 数值梯度：色相铺开
  hMax: staggerVal(i, N, 92, 32), // 数值梯度：高度 1→0.35
  distC: Math.abs(i - C) / C,
}));

export const ValueStaggerGradient: React.FC = () => {
  const t = useT();
  return (
    <FaRoot family="Vazirmatn">
      <DesignStage bg="#0a0b10">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0b10',
            overflow: 'hidden',
          }}
        >
          {BARS.map(({ i, hue, hMax, distC }) => {
            // 拍一：时间 stagger × 数值梯度（y/blur 同时铺开）— RTL: "first" bar anchors RIGHT
            const d = i * 0.02;
            const e = seg(t, 0.06 + d, 0.28 + d, E.outCubic);
            const y0 = staggerVal(i, N, 46, 14); // 位移量本身也是梯度
            const b0 = staggerVal(i, N, 8, 2); // 模糊量梯度
            // 拍二：from:'center' —— 波与幅度都以中心为原点铺开（对称，无需镜像）
            const w = seg(t, 0.56 + distC * 0.13, 0.74 + distC * 0.13);
            const pulse = Math.sin(w * Math.PI);
            const amp = lerp(1 - distC, 0.06, 0.42); // 幅度梯度：中心最大
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '22%',
                    right: `${8 + i * 5.4}%`,
                    width: '3.4%',
                    height: hMax,
                    borderRadius: 5,
                    transformOrigin: '50% 100%',
                    background: `linear-gradient(180deg,hsl(${hue},85%,66%),hsl(${hue},70%,42%))`,
                    boxShadow: `0 0 12px hsla(${hue},85%,58%,.25)`,
                    opacity: e,
                    filter: `blur(${(1 - e) * b0}px) brightness(${1 + pulse * 0.55})`,
                    transform: `translateY(${(1 - e) * y0}px) scaleY(${e * (1 + pulse * amp)})`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '17%',
                    right: `${8 + i * 5.4 + 1.2}%`,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: `hsl(${hue},70%,55%)`,
                    opacity: 0.35,
                  }}
                />
              </React.Fragment>
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '9%',
              transform: 'translateX(-50%)',
              color: '#5b6480',
              whiteSpace: 'nowrap',
              opacity: 0.5 + 0.5 * seg(t, 0.04, 0.12),
              ...faText(10, { textAlign: 'center' }),
            }}
          >
            {t < 0.52
              ? '۱۱۵٬۹۳۱ آزمون برگزارشده در سال'
              : 'در ۱۴٬۶۴۱ کد آزمونی — واحد مشهد'}
          </div>
        </div>
      </DesignStage>
    </FaRoot>
  );
};
