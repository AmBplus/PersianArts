// ===== Persian/RTL localization (PersianArts) =====
// TEXT: "#music" -> "#موسیقی"; pill word -> "موسیقی"; title "My favorite bands" -> "گروه‌های محبوب من";
//   body (3 lines) re-written idiomatically, line breaks kept (3 lines, balanced).
// SHAPING: letterSpacing 0 everywhere; typing = prefix slice (typeOn) so letters re-join as real typing does.
//   Typing has 7 chars vs 6: same mulberry32 seed/4-6f cadence, last char lands ~f38 < MORPH(48): beats unchanged.
// DIRECTION: FaRoot direction:rtl. Typing group: text starts at the right edge of the centered group, red cursor sits at
//   the END of the text = its left side (marginInlineStart) -> MIRRORED. Pill: icon replaces "#" which is the first
//   (right-most) char, so icon on the right, word on the left (paddingInlineStart) -> MIRRORED. Pill glide to the tag slot:
//   slot centre now 1760-PILL_W*END_SCALE/2 so the pill's right edge aligns with the title's right edge (moves toward the right instead of left): MIRRORED because the tag slot follows the title's
//   start side. Reveal page: title/body anchored to the right (right:160/152), RTL text-align start -> MIRRORED.
//   KEPT: the music-note SVG (a glyph, not directional; no mirroring of notation), vertical positions, easing, hard cuts, colors, seeds.
// FONT: Noto Kufi Arabic (variable, 100-900): geometric sans = closest to the original Futura mood; real 500/700 weights.
// PILL WIDTH: 740 -> 900 (documented deviation): the Persian word is ~580px wide at the same size, so icon+word+gap overflowed 740 and
//   the flex icon was squeezed to 0 width; icon is also flexShrink:0 now. Timing, easing, seeds unchanged.
// RASTER: none (all vector).
// hashtag-to-pill-materialize（bear-app 18–21.5s 重做版，按原片密帧逐帧对照）
// 原片实测节奏（25fps 逐帧）：
//  1) 白底居中打字 "#music"：几何无衬线（Futura 气质）、中灰墨色、红色实心光标恒亮不闪、人手节奏
//  2) 实体化 = 1 帧硬切：文字+光标 → 宽大浅灰无描边胶囊 + 灰色双八分音符图标 + "music"（字号不变，#被图标替换）
//  3) 停约 0.6s → 整体平滑缩小（→~0.55x）并左移落到页面标签位（约 0.55s，easeInOut）
//  4) 再 1 帧硬切揭示成品笔记页：奶油底、墨绿大标题 "گروه‌های محبوب من"、胶囊换成鼠尾草绿、正文三行——
//     原片没有"胶囊飞入下方滑入卡片"的段落（批次 8 的飞行段为杜撰，已砍）
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FaRoot, fs, typeOn } from '../../_fa';


const C = {
  bgWhite: '#fcfcfb',
  bgCream: '#f4f1e5',
  ink: '#454543',
  cursor: '#e0453f',
  pillGray: '#e9e9e7',
  pillTextGray: '#4b4b49',
  iconGray: '#7e7e7c',
  pillSage: '#d5e0cf',
  iconSage: '#5c7a63',
  titleGreen: '#2d5c47',
  pillSageText: '#3f5e4c',
  body: '#4c4b43',
};

// ---- mulberry32（仅用于打字节奏的人手抖动，确定性）----
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEXT = '#موسیقی';
const WORD = 'موسیقی';
// 打字起点 & 每字间隔（帧），4–8 帧带抖动，模拟原片真人节奏
const TYPE_START = 8;
const rand = mulberry32(20260717);
const TYPE_AT: number[] = (() => {
  const at: number[] = [];
  let f = TYPE_START;
  for (let i = 0; i < TEXT.length; i++) {
    at.push(f);
    f += 4 + Math.floor(rand() * 3); // 4–6 帧（原片 ~6字/秒）
  }
  return at;
})();

// ---- 时间轴（30fps，共 132 帧，节奏对齐原片 18–21.5s）----
const MORPH = 48;       // 1 帧硬切实体化（打完 hold ~0.5s，原片 0.45s）
const MOVE_START = 66;  // 胶囊开始缩小左移（morph 后 0.6s，原片同）
const MOVE_END = 80;    // 落位（0.47s，原片 ~0.45s）
const REVEAL = 83;      // 1 帧硬切揭示成品页，之后静置收尾

// ---- 几何（1920x1080，等比换算自原片 1280x720 实测像素）----
const FS = 132;                       // 打字/胶囊文字字号（原片 glyph 等高换算）
const HERO = { x: 960, y: 540 };      // 大胶囊中心
const PILL_W = 900, PILL_H = 236;     // 原片实测 493x157 @720p ×1.5
const END_SCALE = 0.554;              // 落位缩放（原片 273/493）
const SLOT = { x: 1760 - (PILL_W * END_SCALE) / 2, y: 473 }; // pill's start (right) edge sits on the title's right edge (x=1760)      // 标签位中心（原片灰胶囊落点 (244.5,317.5)×1.5 与揭示位折中）

// 灰色双八分音符图标（原片是 beamed 双音符，非 ♪）
const NoteIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', flexShrink: 0 }}>
    <ellipse cx="11" cy="39" rx="7.2" ry="5.6" fill={color} transform="rotate(-18 11 39)" />
    <ellipse cx="35" cy="35" rx="7.2" ry="5.6" fill={color} transform="rotate(-18 35 35)" />
    <rect x="15.4" y="12.5" width="3" height="27" fill={color} />
    <rect x="39.4" y="8.5" width="3" height="27" fill={color} />
    <polygon points="15.4,12.5 42.4,8.5 42.4,16.5 15.4,20.5" fill={color} />
  </svg>
);

// 胶囊（大字号绘制，整体 transform 缩放，保证实体化前后文字原位等大）
const Pill: React.FC<{ bg: string; iconColor: string; textColor: string }> = ({ bg, iconColor, textColor }) => (
  <div style={{
    width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2, background: bg,
    display: 'flex', alignItems: 'center', paddingInlineStart: 96, boxSizing: 'border-box', gap: 50,
  }}>
    <NoteIcon size={104} color={iconColor} />
    <span style={{ fontSize: fs(FS), lineHeight: 1.5, fontWeight: 500, color: textColor, letterSpacing: 0, whiteSpace: 'nowrap' }}>{WORD}</span>
  </div>
);

export const HashtagToPillMaterialize: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- 打字 ----
  const typedCount = TYPE_AT.filter((t) => frame >= t).length;
  const typed = typeOn(TEXT, typedCount / TEXT.length);

  // ---- 缩小左移 ----
  const moveT = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.5, 0, 0.25, 1),
  });
  const px = interpolate(moveT, [0, 1], [HERO.x, SLOT.x]);
  const py = interpolate(moveT, [0, 1], [HERO.y, SLOT.y]);
  const ps = interpolate(moveT, [0, 1], [1, END_SCALE]);
  // 实体化瞬间极轻微落定（原片近乎硬切，仅 3 帧 1.03→1，避免死板）
  const settle = interpolate(frame, [MORPH, MORPH + 3], [1.03, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
  });

  const revealed = frame >= REVEAL;

  return (
    <FaRoot family="Noto Kufi Arabic" style={{ background: revealed ? C.bgCream : C.bgWhite }}>
      {/* 成品页（硬切揭示，之后全静） */}
      {revealed && (
        <>
          <div style={{
            position: 'absolute', right: 160, top: 150, lineHeight: 1.5,
            fontSize: fs(104), fontWeight: 700, color: C.titleGreen, letterSpacing: 0,
          }}>
            گروه‌های محبوب من
          </div>
          <div style={{
            position: 'absolute', right: 152, top: 600,
            fontSize: fs(58), fontWeight: 500, color: C.body, lineHeight: 1.5, letterSpacing: 0,
          }}>
            می‌خواهم چند گروه محبوبم را با شما به اشتراک<br />
            بگذارم، با آهنگی که همیشه در راه خانه گوش می‌دهم.<br />
            خوش آمدید. هدفون‌تان را فراموش نکنید.
          </div>
        </>
      )}

      {/* 打字层：文字 + 恒亮红光标（原片光标不闪烁），实体化帧整体消失 */}
      {frame < MORPH && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', direction: 'rtl' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: fs(FS), lineHeight: 1.5, fontWeight: 500, color: C.ink, letterSpacing: 0, whiteSpace: 'pre' }}>
              {typed}
            </span>
            <span style={{
              display: 'inline-block', width: 7, height: 150,
              background: C.cursor, marginInlineStart: 8, borderRadius: 2,
            }} />
          </div>
        </AbsoluteFill>
      )}

      {/* 胶囊层：实体化 1 帧硬切出现 → hold → 缩小左移落位 → 揭示帧换鼠尾草绿 */}
      {frame >= MORPH && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          // origin 必须是 0 0：translate 先把原点送到目标中心，scale 绕该点缩放，
          // 否则默认 50% 50% 会让落位时中心漂移 (1-s)*半宽
          transformOrigin: '0 0',
          transform: `translate(${px}px, ${py}px) scale(${ps * settle})`,
        }}>
          <div style={{ transform: 'translate(-50%, -50%)' }}>
            {revealed
              ? <Pill bg={C.pillSage} iconColor={C.iconSage} textColor={C.pillSageText} />
              : <Pill bg={C.pillGray} iconColor={C.iconGray} textColor={C.pillTextGray} />}
          </div>
        </div>
      )}
    </FaRoot>
  );
};
