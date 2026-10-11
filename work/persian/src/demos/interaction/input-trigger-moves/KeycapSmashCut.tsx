// RTL analysis: the keycap bears universal keyboard symbols (⌘⏎), retained in
// a LTR symbol island; no foreign-language words occur. Vazirmatn is loaded for
// the RTL dashboard, matching its neutral product-UI mood. The local fixture
// mirrors sidebar, header, grid, and placeholders. The final miniature keycap
// mirrors from x464 to x1412 so it stays in the equivalent header gap.
// Fly x paths and tilt signs mirror for RTL screen traversal; their seeds,
// timing, easing, scale and blur remain exact. Center keycap, gravity, light,
// ring and physical camera roll are unchanged. No raster assets or text.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, Card, FakeDashboard } from './Fixtures';
import { FaRoot } from '../../_fa';

const T = {
  press: 25,      // 按下起始（呼吸周期 25f，此帧位移恰好归零）
  pressEnd: 28,   // 3f 压到底，同帧引爆轰鸣段
  ringGrowEnd: 46, // 亮环扩散结束（out-cubic）
  ringFadeEnd: 52, // 亮环消散结束（线性，帧时间与扩散解耦）
  cut: 58,        // 猛切帧：>=58 全静止
  total: 140,     // 死寂 82f
};

// —— 键帽（复用 keycap 规格：多层 box-shadow 造厚度）——
const Keycap: React.FC<{ size: number; thick: number; bright: number; label?: string }> = ({
  size, thick, bright, label = '⌘⏎',
}) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.117,
    background: 'linear-gradient(165deg, #ffffff 0%, #f2f2f0 45%, #e2e2e0 100%)',
    border: `2px solid ${G.border}`, boxSizing: 'border-box',
    boxShadow: [
      `0 ${thick}px 0 #6e6e6c`,
      `0 ${thick + 4}px 2px #565654`,
      `0 ${thick * 2 + 10}px ${thick * 2 + 14}px rgba(0,0,0,0.28)`,
      'inset 0 3px 0 rgba(255,255,255,0.9)',
      'inset 0 -6px 10px rgba(0,0,0,0.07)',
    ].join(', '),
    filter: `brightness(${bright})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      fontSize: size * 0.3, fontWeight: 700, color: G.ink,
      fontFamily: 'Arial, sans-serif', direction: 'ltr', unicodeBidi: 'isolate',
    }}>
      {label}
    </div>
  </div>
);

// —— 轰鸣段飞入物：5 张卡 + 1 面板，四面八方冲镜 ——
type Fly = {
  from: [number, number];
  to: [number, number];
  rot: [number, number];
  seed: number;
  w: number;
  h: number;
  panel?: boolean;
};

const FLIES: Fly[] = [
  { from: [-1400, -140], to: [1400, 80], rot: [-6, 5], seed: 1, w: 440, h: 290 },
  { from: [1400, 200], to: [-1400, -120], rot: [7, -4], seed: 2, w: 400, h: 260 },
  { from: [-260, -900], to: [180, 900], rot: [-3, 8], seed: 3, w: 460, h: 300 },
  { from: [-1300, 820], to: [1300, -760], rot: [5, -7], seed: 4, w: 420, h: 280 },
  { from: [1350, -800], to: [-1350, 840], rot: [-8, 4], seed: 5, w: 480, h: 310 },
  // 第 6 位：面板（更大更重，斜穿）
  { from: [1500, 700], to: [-1500, -600], rot: [4, -6], seed: 6, w: 700, h: 430, panel: true },
];

// 卡 i 的第 k 轮：start = 28 + i*3 + k*16，时长 15 / 11（第二轮更快=整体加速）。
// i=3 k=1 的 53–64f 在切点 58f 被硬切截断——绝不减速迎接切点。
const passWindow = (i: number, k: number): [number, number] => {
  const start = T.pressEnd + i * 3 + k * 16;
  const dur = k === 0 ? 15 : 11;
  return [start, start + dur];
};

// 假面板飞入物：命令面板式灰阶块
const FlyPanel: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{
    width: w, height: h, background: G.card, border: `2px solid ${G.border}`,
    borderRadius: 20, padding: 26, boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 16px 44px rgba(0,0,0,0.28)',
  }}>
    <div style={{ height: 52, border: `2px solid ${G.line}`, borderRadius: 12, background: G.panel }} />
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: G.mid }} />
        <div style={{ height: 12, width: `${50 + ((i * 27) % 30)}%`, background: G.line, borderRadius: 6 }} />
      </div>
    ))}
  </div>
);

const FlyItem: React.FC<{ fly: Fly; i: number; frame: number }> = ({ fly, i, frame }) => {
  let active: [number, number] | null = null;
  for (let k = 0; k < 2; k++) {
    const [s, e] = passWindow(i, k);
    if (frame >= s && frame < e) { active = [s, e]; break; }
  }
  if (!active) return null;
  const [s, e] = active;
  // ease-in：全程加速，越近终点越快
  const p = interpolate(frame, [s, e], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const x = -(fly.from[0] + (fly.to[0] - fly.from[0]) * p);
  const y = fly.from[1] + (fly.to[1] - fly.from[1]) * p;
  const rot = -(fly.rot[0] + (fly.rot[1] - fly.rot[0]) * p);
  const scale = 1.5 + 1.5 * p; // 冲脸
  const blur = 1 + 4 * p;      // 速度门控方向糊感（ease-in 下速度 ∝ p）
  return (
    <div style={{
      position: 'absolute', left: 960 - fly.w / 2, top: 540 - fly.h / 2,
      transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
      filter: `blur(${blur}px)`,
    }}>
      {fly.panel
        ? <FlyPanel w={fly.w} h={fly.h} />
        : <Card w={fly.w} h={fly.h} seed={fly.seed}
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }} />}
    </div>
  );
};

export const KeycapSmashCut: React.FC = () => {
  const frame = useCurrentFrame();

  // —— 死寂段：58f 起 variant A 整齐静止全景 + 键帽小元素嵌顶栏角落，
  //    无任何随帧变化的属性 ——
  if (frame >= T.cut) {
    return (
      <FaRoot family="Vazirmatn" style={{ width: 1920, height: 1080 }}>
        <FakeDashboard variant="A" />
        {/* Keycap lands in the mirrored header gap and holds still */}
        <div style={{ position: 'absolute', left: 1412, top: 12 }}>
          <Keycap size={44} thick={4} bright={1} />
        </div>
      </FaRoot>
    );
  }

  // —— 引信段键帽运动 ——
  // 呼吸：0–25f 一个完整正弦周期（±5px），f25 位移归零接按下
  const breathY = frame < T.press ? -5 * Math.sin((2 * Math.PI * frame) / T.press) : 0;
  // 按下：3f 下沉 14px，之后保持压死
  const pressY = interpolate(frame, [T.press, T.pressEnd], [0, 14], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // 底座厚度 12→3px 压扁（灵魂），轰鸣段保持压扁
  const thick = interpolate(frame, [T.press, T.pressEnd], [12, 3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const bright = interpolate(frame, [T.press, T.pressEnd], [1, 0.9], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // —— 亮环：扩散 out-cubic 90→640px，消散线性，帧时间解耦，摘罩=条件挂载 ——
  const ringOn = frame >= T.press && frame < T.ringFadeEnd;
  const ringD = interpolate(frame, [T.press, T.ringGrowEnd], [90, 640], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const ringA = interpolate(frame, [T.press, T.ringFadeEnd], [0.9, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ringBorder = interpolate(frame, [T.press, T.ringGrowEnd], [14, 3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // —— 轰鸣段背景动势：整体 ease-in 推近 + 滚动，切点前仍在加速 ——
  const bgScale = interpolate(frame, [T.pressEnd, T.cut], [1, 1.3], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });
  const bgRot = interpolate(frame, [T.pressEnd, T.cut], [0, 1.5], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.quad),
  });

  return (
    <FaRoot family="Vazirmatn" style={{
      width: 1920, height: 1080, background: G.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* 背景层（浅底 + 键帽 + 亮环），轰鸣段整体加速推近 */}
      <div style={{
        width: 1920, height: 1080, position: 'absolute',
        transform: `scale(${bgScale}) rotate(${bgRot}deg)`,
        transformOrigin: '50% 50%', background: G.bg,
      }}>
        {ringOn && (
          <div style={{
            position: 'absolute', left: 960 - ringD / 2, top: 540 + 120 + pressY - ringD / 2,
            width: ringD, height: ringD, borderRadius: '50%',
            border: `${ringBorder}px solid #4a4a48`, opacity: ringA,
            boxSizing: 'border-box',
          }} />
        )}
        <div style={{
          position: 'absolute', left: 960 - 120, top: 540 - 120,
          transform: `translateY(${breathY + pressY}px)`,
        }}>
          <Keycap size={240} thick={thick} bright={bright} />
        </div>
      </div>

      {/* 轰鸣段飞入物 */}
      {frame >= T.pressEnd && FLIES.map((fly, i) => (
        <FlyItem key={i} fly={fly} i={i} frame={frame} />
      ))}
    </FaRoot>
  );
};
