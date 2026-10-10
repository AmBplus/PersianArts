// PERSIAN (RTL) localization of "cel-flash-stomp" — timing, easing, flash colours and beat structure are untouched.
// TEXT: "SHIP / FASTER / TODAY" -> «منتشر کن / سریع‌تر / امروز» (a natural three-beat slogan: release, faster, today; same
//   one-word-per-beat rhythm, the first is two short words but stomps as one unit). Title "CEL FLASH STOMP" -> «کوبش فلاش».
//   Words are stamped as WHOLE units (scale+rotate on the whole line), never split into letters, so joining is intact.
// SHAPING: letterSpacing -4 / -1 removed (0), no uppercase, fontWeight 800 dropped (Lalezar is a single heavy weight, no fake bold),
//   line-height FA_LH-safe (single line, lineHeight 1.5 so dots/ascenders are not clipped), sizes via fs() (x1.1).
// FONT: Lalezar — a poster/impact Persian display face, the closest role to Helvetica Black stamps for anime "finisher" cards.
//   Title uses the same family (one family for the whole piece).
// DIRECTION decisions:
//  - Title block pinned top-left -> top-right (left:120 -> right:120): it is the reading-start corner in RTL.
//  - Bottom label bar: direction rtl flex, so the square icon + long bar sit at the right (start) and the short bar is pushed
//    to the left via marginInlineStart:auto (was marginLeft:auto). Padding 0 120 is symmetric, kept.
//  - Stamp tilt: rotate signs mirrored (SHIP +2.5 -> -2.5, FASTER -2.5 -> +2.5, last 0 stays 0). Rotation sign is a
//    reading-direction angle (baseline dips toward the line end), so the alternation order is kept but mirrored.
//  - Word block centred (justify center): symmetric, kept. Scale/stomp is radial: kept. Flash is full-bleed: nothing to mirror.
//  - Background flash colours, easing, frames: kept (physical/universal, and the "flash only the air" rule).
// RASTER: none in this demo.
// 底色闪砸字（cel-flash-stomp）——stomp-typography 逐词节拍砸字 ×
// background-cel-flash 纯色底闪的组合变异。三个大词逐拍硬切占满屏，
// 每词像图章一样歪着砸落（scale 1.18→0.98→1 弹落 + 交替 ±2.5° rotate）；
// 词落定帧起背景层每 2f 在 G.bg 与加深灰之间闪切——文字层独立在上纹丝
// 不动，只闪背景是本组合命门（动漫必杀技字卡感）。第三词闪加倍且对比拉大。
// 关键帧：0 "SHIP" 硬切入(rot+2.5°) → 0–6 弹落 → 6–11 背景闪(#cfcfca, 2f 交替×6f)
// → 30 "FASTER" 硬切(rot−2.5°) → 30–36 弹落 → 36–41 背景闪
// → 60 "TODAY" 硬切(rot 0°) → 60–66 弹落 → 66–73 背景闪加倍(8f, #c4c4c0)
// + 66–80 底部标签条淡入 → 80–144 全静止(≥45f, 无逐帧噪声层)。
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, fs, FA_LH } from '../../_fa';

const FONT = 'Lalezar' as const;

type Word = {
  text: string;
  start: number; // 硬切入场帧
  end: number; // 显示到此帧前（下一词硬切）
  rot: number; // 图章歪斜角
  flashLen: number; // 落定后背景闪总帧数
  flashDark: string; // 闪切的加深灰
};

const LAND = 6; // 入场弹落时长：start+6 落定，同帧起闪
const WORDS: Word[] = [
  { text: 'منتشر کن', start: 0, end: 30, rot: -2.5, flashLen: 6, flashDark: '#cfcfca' },
  { text: 'سریع‌تر', start: 30, end: 60, rot: 2.5, flashLen: 6, flashDark: '#cfcfca' },
  { text: 'امروز', start: 60, end: 9999, rot: 0, flashLen: 8, flashDark: '#c4c4c0' },
];

export const CelFlashStomp: React.FC = () => {
  const frame = useCurrentFrame();
  const word = WORDS.find((w) => frame >= w.start && frame < w.end)!;
  const t = frame - word.start;

  // 弹落：scale 1.18 → 0.98(2% 过冲) → 1，6f 内完成，poly(5) 出缓
  const scale =
    t < 4
      ? interpolate(t, [0, 4], [1.18, 0.98], {
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.poly(5)),
        })
      : interpolate(t, [4, LAND], [0.98, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.quad),
        });

  // 背景闪：落定帧(start+LAND)起，每 2f 在加深灰与 G.bg 间交替，共 flashLen 帧
  const ft = t - LAND;
  const flashing = ft >= 0 && ft < word.flashLen;
  const bg = flashing && Math.floor(ft / 2) % 2 === 0 ? word.flashDark : G.bg;

  // 第三词落定同帧起底部标签条淡入（66–80）
  const labelOp = interpolate(frame, [66, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  return (
    <div style={{ width: 1920, height: 1080, background: bg, position: 'relative', overflow: 'hidden' }}>
    <FaRoot family={FONT}>
      <div style={{ position: 'absolute', right: 120, top: 96, fontSize: fs(54), lineHeight: FA_LH, color: G.ink, letterSpacing: 0 }}>
        کوبش فلاش
      </div>
      {/* 文字层独立在背景之上：背景闪切时它纹丝不动 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: fs(210),
            lineHeight: FA_LH,
            whiteSpace: 'nowrap',
            color: G.ink,
            letterSpacing: 0,
            transform: `scale(${scale}) rotate(${word.rot}deg)`,
          }}
        >
          {word.text}
        </div>
      </div>
      {/* 底部标签条：第三词落定同帧淡入 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 96,
          background: G.ink,
          opacity: labelOp,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 120px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 10, background: G.sideBar }} />
        <div style={{ height: 16, width: 320, background: G.mid, borderRadius: 8 }} />
        <div style={{ marginInlineStart: 'auto', height: 16, width: 180, background: G.sideBar, borderRadius: 8 }} />
      </div>
    </FaRoot>
    </div>
  );
};
