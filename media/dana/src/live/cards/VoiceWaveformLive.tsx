// PERSIAN (RTL) localization of shotcraft "voice-waveform-live" — motion/timing untouched, direction adapted.
// Source-prompt intent: a FUNCTIONAL live voice waveform ("it really is listening"): 64 thin bars driven by
// frame-deterministic value noise; talk 15-57f -> pause 80-124f -> talk -> submit-collapse at 126f. No terminal value,
// no UI copy — the liveness itself carries the shot.
//
// TEXT: the original has ZERO on-screen strings (a mic emoji, an up-arrow SVG icon, and bars). Nothing needed
// translating and nothing was invented — adding a Persian label would change the composition and break faithfulness.
// Frames were checked: no Latin/Chinese text remains visible (there never was any rendered text).
//
// RTL decisions (each with a reason):
//  1. MIRROR the capsule row order via direction:rtl (FaRoot): mic -> waveform -> submit becomes mic at the RIGHT edge
//     (reading start) and submit at the LEFT edge (reading end) — the Persian analogue of mic-left/submit-right, same
//     reasoning as the mirrored ai-stream-response header. Both 96px buttons keep flexShrink:0.
//  2. KEEP the waveform time direction (lessons list "music/waveform time direction" as physical/universal, and the
//     source prompt names the right->left scroll as a core trait — it also coincides with Persian reading direction):
//     the newest sample stays at the RIGHT end of the bar strip, history flows leftward. The bars container is an
//     explicit direction:'ltr' island inside the mirrored capsule so the per-bar sample math
//     (sampleT = f - (N-1-i)*1.6) and every bar height stay bit-identical to the original.
//  3. KEEP the up-arrow submit glyph (universal "send/commit", no reading-direction meaning), the mic emoji
//     (script-neutral placeholder; grayscale filter kept as designed), the vertical border gradient (180deg) and the
//     background light drift translate(+x,+y) (physical light, no reading semantics).
//
// FONT: Vazirmatn (variable, neutral product-UI sans) declared through FaRoot — the right register for a raycast-style
// voice-input capsule. No glyph is actually drawn in this comp, so nothing can silently fall back.
//
// RASTER ASSETS: none in the original (pure DOM/SVG/emoji) — nothing to blur, replace or mirror.
// No letterSpacing / textTransform / per-codepoint splits exist or were introduced. fps, size, seeds, easing and every
// frame timing are unchanged.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FaRoot } from '../../../persian/src/demos/_fa';

const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 值噪声：整数采样点取种子随机值，采样点之间平滑插值
const noiseAt = (x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = mulberry32(i * 7919 + 13)();
  const b = mulberry32((i + 1) * 7919 + 13)();
  const s = fr * fr * (3 - 2 * fr); // smoothstep
  return a + (b - a) * s;
};

// 说话包络（按"声音发生时刻"计）：说→停→说
const envelope = (t: number) => {
  const seg = (a: number, b: number, rise = 5, fall = 7) =>
    interpolate(t, [a, a + rise, b - fall, b], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  // 两段说话内部再叠音节起伏
  const talk = Math.max(seg(15, 57), seg(80, 124));
  const syllable = 0.55 + 0.45 * noiseAt(t / 4.5 + 200);
  return talk * syllable;
};

const N_BARS = 64;

export const VoiceWaveformLive: React.FC = () => {
  const f = useCurrentFrame();

  // 提交动作
  const submitAt = 126;
  const submitted = f >= submitAt;
  const btnPress = interpolate(f, [submitAt, submitAt + 3, submitAt + 9], [1, 0.82, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });
  // 提交后波形整体塌缩 + 胶囊微缩离场感
  const collapse = interpolate(f, [submitAt, submitAt + 12], [1, 0.06], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.in(Easing.ease),
  });
  const capsuleScale = interpolate(f, [submitAt, submitAt + 20], [1, 0.96], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });

  // 胶囊入场
  const inOp = interpolate(f, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.ease),
  });
  const inScale = interpolate(f, [0, 14], [1.04, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const SCROLL = 1.6; // 帧→采样时间比：滚动速度

  const bars = Array.from({ length: N_BARS }).map((_, i) => {
    // 从右往左滚动：最右条是"现在"，越靠左越旧
    const sampleT = f - (N_BARS - 1 - i) * SCROLL;
    const env = sampleT < 0 ? 0 : envelope(sampleT);
    // 空间权重：中部高耸
    const center = Math.pow(Math.sin((i / (N_BARS - 1)) * Math.PI), 0.8);
    const jitter = 0.35 + 0.65 * noiseAt(sampleT * 1.7 + i * 0.13);
    const hRaw = env * center * jitter;
    const h = Math.max(5, hRaw * 235 * collapse); // 静默=5px 点线
    return h;
  });

  const nowEnv = envelope(f);
  const micGlow = submitted ? 0 : nowEnv;

  return (
    <FaRoot family="Vazirmatn">
    <AbsoluteFill style={{ background: '#08080a', overflow: 'hidden' }}>
      {/* 暗场绸缎底光 */}
      <div style={{
        position: 'absolute', left: -300, top: -200, width: 2600, height: 1700,
        background: 'radial-gradient(closest-side, rgba(130,131,140,0.16), rgba(0,0,0,0) 70%)',
        transform: `translate(${f * 0.6}px, ${f * 0.25}px)`,
      }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 1320, height: 300, borderRadius: 150,
            opacity: inOp,
            transform: `scale(${inScale * capsuleScale})`,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.3))',
            padding: 2.5, boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%', height: '100%', borderRadius: 148,
              background: 'rgba(24,25,29,0.72)',
              backdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 40px 100px rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', gap: 36,
              padding: '0 44px', boxSizing: 'border-box',
            }}
          >
            {/* 麦克风圆钮：说话时发亮 */}
            <div
              style={{
                width: 96, height: 96, borderRadius: 48, flexShrink: 0,
                background: `rgba(255,255,255,${0.08 + micGlow * 0.14})`,
                border: '2.5px solid rgba(255,255,255,0.28)',
                boxShadow: `0 0 ${28 * micGlow}px rgba(235,235,245,${micGlow * 0.5})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 46, filter: 'grayscale(1)', boxSizing: 'border-box',
              }}
            >
              🎙️
            </div>

            {/* 声纹条区 — direction:'ltr' island: the waveform time axis is physical/universal (lessons doc),
                and the source prompt fixes the scroll as right->left with the newest bar at the right end.
                Keeping this row LTR inside the mirrored capsule preserves every bar height bit-exactly. */}
            <div style={{
              flex: 1, height: 244, display: 'flex', alignItems: 'center',
              gap: 6, overflow: 'hidden', direction: 'ltr',
            }}>
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: h, borderRadius: 4,
                    background: `rgba(240,240,248,${0.4 + (h / 235) * 0.6})`,
                  }}
                />
              ))}
            </div>

            {/* 提交钮：白圆 + 上箭头 */}
            <div
              style={{
                width: 96, height: 96, borderRadius: 48, flexShrink: 0,
                background: submitted ? '#ffffff' : 'rgba(255,255,255,0.92)',
                transform: `scale(${btnPress})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: submitted
                  ? '0 0 60px rgba(255,255,255,0.55)'
                  : '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24">
                <path
                  d="M12 20V5M12 5l-6.5 6.5M12 5l6.5 6.5"
                  stroke="#111114" strokeWidth="3" strokeLinecap="round"
                  strokeLinejoin="round" fill="none"
                />
              </svg>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
    </FaRoot>
  );
};
