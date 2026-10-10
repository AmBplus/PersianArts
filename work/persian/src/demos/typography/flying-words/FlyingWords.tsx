/* Persian/RTL localization of flying-words (analysis)
 * TEXT: the 22 placeholder motion-design terms became 22 natural Persian terms of similar length (3-8 letters; the
 *   source prompt asks to keep word count/length magnitude, so phase i/N, density and rhythm are unchanged):
 *   حرکت چیدمان دوربین آبشاری روانی ضرب کلیدفریم محو مقیاس تبدیل چرخش پارالاکس شفافیت عمق میان‌یابی حلقه فنر تأخیر ظهور ترکیب شبکه محور.
 *   Each word is one whole element (no per-letter motion), so joining is never broken. letterSpacing 0 (was 0.5px).
 * FONT: Vazirmatn (variable, weight 800 kept): neutral clean sans with a real heavy weight; the original is a bold system
 *   sans glow-on-dark background layer, Vazirmatn 800 keeps that look. Sizes via fs() (x1.1), lineHeight FA_LH.
 * DIRECTION: scene is a radially symmetric 3D tunnel (camera centre, golden-angle scatter, z depth, drift outward, centre glow):
 *   no reading-direction meaning -> positions, z travel, drift, rotateZ signs, perspective, glow KEPT (mirroring a random
 *   scatter would only change nothing semantically and risk the seeded look). Seeds/curve/CYCLES/blur untouched.
 *   Only layout change: the original centred each word with a hard-coded margin-left:-60px (a left-edge hack that
 *   assumes ~120px Latin words); Persian widths differ, so the word is now centred on its own box (translate -50%,-50%)
 *   in an inner element, direction rtl + unicode-bidi isolate. The wrapper keeps the 3D transform exactly as before.
 * RASTER: none.
 */
// flying-words — Flying Words 词语纵深隧道（motion-lab 定稿转原生 Remotion）
// 占位词语在远处纵深生成，沿 z 轴向相机飞来擦身而过，透明度按 [0,1,0.5,0.2,0]
// 生命周期曲线变化，形成 3D 词语隧道；相机不动、元素动，spawn 完全确定性、首尾无缝。
// 词表可整体替换为项目关键词。设计坐标 480×270（DesignStage 等比放大）。
import React from 'react';
import { FaRoot, fs, FA_LH } from '../../_fa';
import { DesignStage, lerp, rand, useT } from '../../_fixtures/Motion';

export const FLYING_WORDS_DURATION = 180; // 6000ms @30fps

// 占位词表：换成项目自己的关键词即可，词数/字长接近就不影响节奏
const WORDS = ['حرکت', 'چیدمان', 'دوربین', 'آبشاری', 'روانی', 'ضرب', 'کلیدفریم', 'محو',
  'مقیاس', 'تبدیل', 'چرخش', 'پارالاکس', 'شفافیت', 'عمق', 'میان‌یابی', 'حلقه',
  'فنر', 'تأخیر', 'ظهور', 'ترکیب', 'شبکه', 'محور'];
const N = WORDS.length;

// 每个词的静态属性全部由 rand(seed) 确定（种子与原稿一致，跨渲染可复现）
const ITEMS = WORDS.map((w, i) => {
  const hue = 200 + rand(i * 11) * 130;
  // 角度按黄金角铺开 + 半径避开正中，防止近处堆在一起糊成一团
  const a = i * 2.39996 + rand(i * 7 + 1) * 0.8;
  const r = 82 + rand(i * 13 + 2) * 165;
  return {
    text: w,
    fontSize: fs(20 + rand(i + 3) * 16),
    color: `hsl(${hue},${58 + rand(i + 5) * 30}%,${70 + rand(i + 9) * 18}%)`,
    textShadow: `0 0 16px hsla(${hue},90%,66%,.45)`,
    x: Math.cos(a) * r,
    y: Math.sin(a) * r * 0.6,
    rz: (rand(i + 21) - 0.5) * 14,
    ph: i / N,
  };
});

// 生命周期透明曲线：[0,1,0.5,0.2,0] 分段线性
const OP = [0, 1, 0.5, 0.2, 0];
const OT = [0, 0.25, 0.6, 0.85, 1];
const curve = (u: number) => {
  for (let k = 0; k < 4; k++) {
    if (u <= OT[k + 1]) {
      const p = (u - OT[k]) / (OT[k + 1] - OT[k]);
      return OP[k] + (OP[k + 1] - OP[k]) * p;
    }
  }
  return 0;
};

const CYCLES = 2; // 整数圈 → t=0/t=1 画面一致

export const FlyingWords: React.FC = () => {
  const t = useT();
  return (
    // 渐变底全部用百分比 → 放到 DesignStage 外层 bg 上，在合成分辨率下原生栅格化
    // （与原渲染 DPR=4 的平滑度一致；缩放容器内画大渐变会产生 4px 宽的色带）
    <FaRoot family="Vazirmatn">
    <DesignStage bg="radial-gradient(60% 60% at 50% 50%,#131a2c,#05060b 75%)">
      {/* 场景：透视相机（perspective 随 DesignStage 等比放大） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: 1100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
          }}
        >
          {ITEMS.map((it, i) => {
            const u = (t * CYCLES + it.ph) % 1;
            const z = lerp(u, -1750, 800); // 远处生成 → 擦身而过
            const drift = 0.5 + u * 1.35; // 远处收拢、越近越向外散开
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transformOrigin: '50% 50%',
                  whiteSpace: 'nowrap',
                  fontWeight: 800,
                  fontSize: it.fontSize,
                  lineHeight: FA_LH,
                  direction: 'rtl',
                  unicodeBidi: 'isolate',
                  letterSpacing: 0,
                  color: it.color,
                  textShadow: it.textShadow,
                  transform: `translate3d(${it.x * drift}px,${it.y * drift}px,${z}px) rotateZ(${it.rz}deg)`,
                  opacity: curve(u),
                  filter: u > 0.86 ? `blur(${(u - 0.86) * 26}px)` : 'none',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, transform: 'translate(-50%,-50%)' }}>{it.text}</div>
              </div>
            );
          })}
        </div>
        {/* 中心光晕，强化"隧道尽头"（DOM 序在词语之后 → 叠在上层） */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 220,
            height: 220,
            margin: -110,
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(120,150,255,.22),transparent 68%)',
            filter: 'blur(6px)',
            opacity: 0.75 + Math.sin(t * Math.PI * 4) * 0.12,
          }}
        />
      </div>
    </DesignStage>
    </FaRoot>
  );
};
