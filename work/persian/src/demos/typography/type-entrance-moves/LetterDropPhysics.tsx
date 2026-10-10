// PERSIAN (RTL) localization of shotcraft "type-entrance-moves / letter-drop-physics" — motion, timing, seeds untouched.
// TEXT: "GRAVITY" (7 letters) -> «سقوط آزاد» ("free fall"). Idiomatic for the physical-comedy tone, and it splits into joined
//   groups ["سقو","ط","آ","ز","ا","د"] — the only safe falling units: every group boundary sits after a non-joining letter, so
//   when the groups land side by side with zero gap the word reads as ordinary correctly-shaped Persian. Splitting at any other
//   point (single code points) would show isolated letter forms mid-fall and break the word at rest.
//   Six droppers instead of seven letters: the stagger keeps its 5f step (starts 10..35 instead of 10..40); the SNAP beat at
//   frame 110, the 24f fall, the 30%/9% bounces and the +-6deg seed tilts are unchanged.
// DIRECTION: the row is direction:rtl, so the first group («سقو») is the right-most and the first to fall — the stagger runs
//   right->left, the Persian reading order (MIRRORED). Gravity, floor line, bounce arcs, transform-origin 50% 100% (bottom centre,
//   symmetric) and the seed tilt hash are physical/symmetric: KEPT. The tilt hash is indexed by group so each unit keeps a
//   deterministic angle (not flipped: it is random, not directional).
// COMPOSITION: absolute per-letter slots (left = LEFT + i*SLOT_W) are replaced by a centred rtl flex row of natural-width groups;
//   a fixed 150px slot would split the joined group «سقو» from its neighbour. The floor line is centred and sized to the word.
// FONT: Lalezar (single weight, heavy poster display face = Helvetica 800 impact for a slam/bounce title). No letterSpacing,
//   no fake bold; Latin-only heavy weights are not needed. Persian word gap in Lalezar is tight, so the space is an explicit
//   0.3em spacer element.
// No raster assets. Digits: none on screen.
// 字符坠落堆积（letter-drop-physics）——FallingLetterAnimation。
// "GRAVITY" 7 字符各自绝对定位，第 i 字符从帧 10+i*5 起下落：
// ① 重力加速 y = D*(t/24)^2 掉 720px 到基线（地板线可见）；
// ② 落地后 2 次衰减弹跳（高度 30% / 9%，抛物线 4u(1-u) 拼段），
//    落地瞬间 rotate 到 seed hash ±6° 小歪角并保持；
// ③ 帧 110 一拍：6f ease-out 全体齐整回正（rotate→0、偏移→0、scale 1.06→1），
//    帧 116–150 真静止（≥25f）收尾。
import React from 'react';
import { useCurrentFrame, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, joinedGroups } from '../../_fa';

// 确定性伪随机
const h = (n: number) => {
  const s = Math.sin(n * 127.3) * 43758.5453;
  return s - Math.floor(s);
};

const WORD = 'سقوط آزاد';
const UNITS = joinedGroups(WORD); // ["سقو","ط"," ","آ","ز","ا","د"]
const FONT = fs(250); // Lalezar display size; Persian word is narrower than 7 Latin slots, so the type is larger
const BOX_H = Math.round(FONT * 1.3); // line box of one falling unit
const WORD_W = 1040; // floor-line span reference (word is centred; floor = word + 120px like the original)
const LEFT = (1920 - WORD_W) / 2;
const REST_TOP = 330; // top of a resting unit's box
const FLOOR_Y = REST_TOP + 305; // visual baseline of the Persian word (measured on the settled frame)

const DROP = 720; // 下落距离
const T_FALL = 24; // 落到基线用时
const T_B1 = 16; // 第一次弹跳时长（高 30%）
const T_B2 = 8; // 第二次弹跳时长（高 9%）
const SNAP = 110; // 齐整回正的一拍
const SNAP_DUR = 6;

const easeOutCubic = Easing.out(Easing.cubic);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// 单字符纵向位移（相对基线，负 = 在上方）
const dropY = (t: number): number => {
  if (t <= 0) return -DROP;
  if (t < T_FALL) return -DROP + DROP * (t / T_FALL) ** 2; // 重力加速
  if (t < T_FALL + T_B1) {
    const u = (t - T_FALL) / T_B1;
    return -DROP * 0.3 * 4 * u * (1 - u); // 弹跳 1：30%
  }
  if (t < T_FALL + T_B1 + T_B2) {
    const u = (t - T_FALL - T_B1) / T_B2;
    return -DROP * 0.09 * 4 * u * (1 - u); // 弹跳 2：9%
  }
  return 0;
};

export const LetterDropPhysics: React.FC = () => {
  const frame = useCurrentFrame();
  // 帧 110 起的齐整回正进度
  const snap = easeOutCubic(clamp01((frame - SNAP) / SNAP_DUR));

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, overflow: 'hidden', position: 'relative' }}>
      {/* 地板线：字符落点的视觉基线 */}
      <div style={{ position: 'absolute', left: LEFT - 60, top: FLOOR_Y, width: WORD_W + 120, height: 6, background: G.bar, borderRadius: 3 }} />

      <FaRoot family="Lalezar">
        <div style={{ position: 'absolute', left: 0, right: 0, top: REST_TOP, height: BOX_H, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          {(() => {
            let dropIdx = -1; // stagger index counts only falling units (the space is a spacer)
            return UNITS.map((ch, k) => {
              if (ch === ' ') return <div key={k} style={{ width: Math.round(FONT * 0.3), flexShrink: 0 }} />;
              dropIdx += 1;
              const i = dropIdx;
              const start = 10 + i * 5;
              const t = frame - start;
              const y = dropY(t);
              // 落地瞬间歪到 seed 小角度（±6°），落地前为 0
              const tiltTarget = (h(i + 1) - 0.5) * 12;
              const landP = clamp01((t - T_FALL) / 6);
              const restJitter = (h(i + 11) - 0.5) * 10; // 落定后的 ±5px 竖向错位
              // snap 一拍：歪角与错位齐整归零，scale 1.06→1 脉冲
              const rot = tiltTarget * landP * (1 - snap);
              const jitter = restJitter * landP * (1 - snap);
              const scale = frame < SNAP ? 1 : 1 + 0.06 * (1 - snap);
              return (
                <div
                  key={k}
                  style={{
                    height: BOX_H,
                    flexShrink: 0,
                    transform: `translateY(${y + jitter}px) rotate(${rot}deg) scale(${scale})`,
                    transformOrigin: '50% 100%',
                    fontSize: FONT,
                    lineHeight: `${BOX_H}px`,
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    color: G.ink,
                  }}
                >
                  {ch}
                </div>
              );
            });
          })()}
        </div>
      </FaRoot>
    </div>
  );
};
