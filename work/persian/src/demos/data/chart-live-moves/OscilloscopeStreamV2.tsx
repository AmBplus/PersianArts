// PERSIAN (RTL) localization of "oscilloscope-stream-v2" - SPEED 8px/f, spike envelope, brake f100-112, glow sizes, amber logic untouched.
// FIX (review): readout unit label no longer scales with the pop and the block is raised, so the spike peak keeps clearance.
// TEXT: title, card header, live readout unit, y ticks (Persian digits, "٬" thousands), time ticks ("۶۰ ثانیه پیش" ... "اکنون") translated.
//   "api-gateway" becomes "درگاه API" (API kept as the brand/technical token, isolated in <bdi>). Readout uses faDigits + "٬"; the
//   upstream letterSpacing:-1 on the number is removed (digits of Persian font do not need it).
// DIRECTION (decided per item):
//  - TIME FLOW MIRRORED: in an RTL reader the past is on the right and "now" on the left, so the write head sits at the LEFT edge and
//    the sampled window scrolls to the RIGHT (the original wrote at the right edge and scrolled left). Implemented by mirroring
//    every plot x (px -> PLOT_W - px) while the worldX/spike/brake maths stays identical. The spike therefore is born at the
//    left and is carried to the right, same frame beats.
//  - Time ticks reversed (oldest at right, "اکنون" at left); y-axis labels moved to the right edge (start side), left-aligned
//    against the plot like the originals hugged it.
//  - Card header: title/subtitle anchored right; live readout moved to the left (it sat opposite the title; the scale pop's
//    transform-origin is flipped to "left top" so it grows away from the card edge exactly as before).
//  - Vertical value axis (0 bottom -> 2k top) and the grid are physical/symmetric: KEPT.
// FONT: Vazirmatn (neutral monitoring-dashboard UI; real 600-800 weights, numerals tabular enough). fs() x1.1.
// RASTER: none. Baseline: no Latin/Chinese text remains (only the isolated API token).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, faDigits, FA_LH } from '../../_fa';
import { FaTitle } from './_FaTitle';

const AMBER = '#b45309';

const CARD_W = 1080;
const CARD_H = 560;
const CX = (1920 - CARD_W) / 2;
const CY = (1080 - CARD_H) / 2 + 40;
const PAD = 46;
const AXIS_W = 64; // 左侧 y 轴刻度位
const PLOT_X = PAD; // RTL: plot at the left, y-axis column at its right
const PLOT_W = CARD_W - PAD * 2 - AXIS_W; // 924
const PLOT_H = 300;
const PLOT_Y = 158;

const HOLD = 12;
const FREEZE_START = 100;
const FREEZE_END = 112;
const SPEED = 8; // px/frame（v1 5.5 → 8，~240px/s）
const AMP = 0.72; // 基础振幅占半高比例（给尖峰留出头部空间）

// 突发尖峰：worldX ∈ [288, 448]（写入发生在 f48–68，之后随流向左带走）
const SPIKE_X0 = 288;
const SPIKE_W = 160;
const SPIKE_GAIN = 1.2; // 峰值 = 1 + 1.2 = 2.2×

const env = (x: number): number => {
  if (x <= SPIKE_X0 || x >= SPIKE_X0 + SPIKE_W) return 1;
  const p = (x - SPIKE_X0) / SPIKE_W;
  return 1 + SPIKE_GAIN * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
};

// 有效时间：HOLD 前为 0，之后线性流动，FREEZE 区间 easeOut 刹停为常数
const effTime = (frame: number): number => {
  const t = (f: number) => Math.max(f - HOLD, 0) * SPEED;
  if (frame <= FREEZE_START) return t(frame);
  const brakeDist = (t(FREEZE_END) - t(FREEZE_START)) * 0.45;
  return (
    t(FREEZE_START) +
    interpolate(frame, [FREEZE_START, FREEZE_END], [0, brakeDist], {
      easing: Easing.out(Easing.cubic),
      extrapolateRight: 'clamp',
    })
  );
};

// 波形：四个正弦叠加，x 单位 = 世界像素
const wave = (x: number): number =>
  0.34 * Math.sin(x * 0.021) +
  0.27 * Math.sin(x * 0.052 + 1.7) +
  0.18 * Math.sin(x * 0.013 + 4.2) +
  0.12 * Math.sin(x * 0.087 + 2.3);

const signal = (x: number): number => wave(x) * env(x) * AMP; // ∈ ~[-1.6, 1.6]，常态 [-0.65, 0.65]
const yOf = (x: number): number => PLOT_H / 2 - signal(x) * (PLOT_H / 2);
// 读数映射：绘图区中线 = 1,000 req/s，上下沿 = 2,000 / 0
const valueOf = (x: number): number => Math.round(1000 + signal(x) * 1000);

const fmt = (n: number): string => faDigits(n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));

const Y_TICKS = ['۲٬۰۰۰', '۱٬۵۰۰', '۱٬۰۰۰', '۵۰۰', '۰'];
// RTL: index 0 sits at the RIGHT edge (oldest), last index (now) at the left edge
const X_TICKS = ['۶۰ ثانیه پیش', '۵۰ ثانیه پیش', '۴۰ ثانیه پیش', '۳۰ ثانیه پیش', '۲۰ ثانیه پیش', '۱۰ ثانیه پیش', 'اکنون'];

export const OscilloscopeStreamV2: React.FC = () => {
  const frame = useCurrentFrame();
  const T = effTime(frame);

  const N = 270;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const px = (i / N) * PLOT_W; // distance from the write head (px) in unmirrored maths
    const worldX = T - (PLOT_W - px);
    pts.push(`${(PLOT_W - px).toFixed(2)},${yOf(worldX).toFixed(2)}`);
  }
  const headY = yOf(T);

  const frozen = frame >= FREEZE_END;
  const glowOp = interpolate(frame, [FREEZE_START, FREEZE_END], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 余辉段：头部往回 160px（v1 90 → 160）
  const TAIL = 160;
  const tailPts: string[] = [];
  if (!frozen) {
    for (let i = 0; i <= 40; i++) {
      const px = PLOT_W - TAIL + (i / 40) * TAIL;
      const worldX = T - (PLOT_W - px);
      tailPts.push(`${(PLOT_W - px).toFixed(2)},${yOf(worldX).toFixed(2)}`);
    }
  }

  // 实时读数：尖峰经过写入点时跳大 + 变琥珀
  const spikeK = Math.min(Math.max((env(T) - 1) / SPIKE_GAIN, 0), 1);
  const hot = spikeK > 0.22;
  const readout = fmt(valueOf(T));
  const readScale = 1 + 0.32 * spikeK;
  const dotColor = spikeK > 0.15 ? AMBER : G.ink;

  return (
    <FaRoot family="Vazirmatn" style={{ background: G.bg, overflow: 'hidden' }}>
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 110, width: '100%', textAlign: 'center' }}>
        <FaTitle text="جریان اسیلوسکوپی · نسخهٔ ۲" size={72} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CARD_W,
          height: CARD_H,
          background: G.card,
          border: `2px solid ${G.border}`,
          borderRadius: 14,
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* 真卡头：标题 + 副题 + 实时读数 */}
        <div style={{ position: 'absolute', right: PAD, top: 30, textAlign: 'right' }}>
          <div style={{ fontSize: fs(30), lineHeight: FA_LH, fontWeight: 700, color: G.ink }}>درخواست در ثانیه</div>
          <div style={{ fontSize: fs(20), lineHeight: FA_LH, fontWeight: 500, color: G.mid, marginTop: 0 }}>درگاه <bdi>API</bdi> · محیط عملیاتی · {faDigits(60)} ثانیهٔ اخیر</div>
        </div>
        {/* readout: only the NUMBER pops (scale about its own centre-left); unit label stays still and the block sits higher so the spike peak keeps clearance */}
        <div style={{ position: 'absolute', left: PAD, top: 20, textAlign: 'left' }}>
          <div
            style={{
              fontSize: fs(46),
              lineHeight: 1.15,
              fontWeight: 800,
              color: hot ? AMBER : G.ink,
              direction: 'ltr',
              unicodeBidi: 'isolate',
              transform: `scale(${readScale.toFixed(4)})`,
              transformOrigin: 'left center',
            }}
          >
            {readout}
          </div>
          <div style={{ fontSize: fs(18), lineHeight: FA_LH, fontWeight: 600, color: hot ? AMBER : G.mid, marginTop: 4, textAlign: 'left', direction: 'rtl' }}>درخواست/ثانیه · زنده</div>
        </div>

        {/* y 轴真刻度 */}
        {Y_TICKS.map((t, i) => (
          <div
            key={`yt${i}`}
            style={{
              position: 'absolute',
              left: PLOT_X + PLOT_W + 12,
              top: PLOT_Y + (PLOT_H / 4) * i - 15,
              width: AXIS_W + 20,
              textAlign: 'left',
              lineHeight: '30px',
              fontSize: fs(18),
              fontWeight: 600,
              color: G.mid,
            }}
          >
            {t}
          </div>
        ))}

        <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
          {/* 网格 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: (PLOT_H / 4) * i, height: 2, background: G.line, opacity: 0.7 }} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: (PLOT_W / 6) * i, width: 2, background: G.line, opacity: 0.45 }} />
          ))}

          <svg width={PLOT_W} height={PLOT_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <polyline points={pts.join(' ')} fill="none" stroke={G.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            {!frozen && glowOp > 0 && (
              <polyline
                points={tailPts.join(' ')}
                fill="none"
                stroke="#6a6a68"
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.55 * glowOp}
                style={{ filter: 'blur(2px)' }}
              />
            )}
            {/* 写入点亮点（1.5×） */}
            {!frozen && glowOp > 0 && (
              <>
                <circle cx={0} cy={headY} r={24} fill={spikeK > 0.15 ? AMBER : '#8f8f8d'} opacity={0.35 * glowOp} style={{ filter: 'blur(5px)' }} />
                <circle cx={0} cy={headY} r={10.5} fill={dotColor} opacity={glowOp} />
              </>
            )}
          </svg>
        </div>

        {/* x 轴真时间刻度 */}
        <div style={{ position: 'absolute', left: PLOT_X, top: PLOT_Y + PLOT_H + 14, width: PLOT_W }}>
          {X_TICKS.map((t, i) => (
            <div
              key={`xt${i}`}
              style={{
                position: 'absolute',
                left: PLOT_W - (PLOT_W / 6) * i - 70,
                width: 140,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                lineHeight: FA_LH,
                fontSize: fs(17),
                fontWeight: 600,
                color: G.mid,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
    </FaRoot>
  );
};
