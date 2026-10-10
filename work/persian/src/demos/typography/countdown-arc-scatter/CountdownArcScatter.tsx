// PERSIAN/RTL LOCALIZATION of countdown-arc-scatter (original comments below kept; motion, timing, easing untouched).
// TEXT: title "5 min to install" -> "۵ دقیقه تا نصب" (idiomatic: "5 minutes to install"); dial numbers -> Persian digits (faDigits).
//   Words animate as whole words (3 words: دقیقه / تا / نصب), same windows/order as min/to/install. Last word نصب turns accent blue as install did.
// SHAPING: letterSpacing -0.5px -> 0; no uppercase; line-height FA_LH only matters for the single-line title (set 1.5, vertically centred via translateY(-50%)).
// DIRECTION decisions:
//  - Dial sweep MIRRORED: the countdown now runs along the reading order (largest number on the right, 45 -> 3 reads right-to-left),
//    sweep comes in from the right and decelerates to rest. Implemented as x = -sin, self-rotation sign flipped, tick rotation sign flipped.
//  - Tick mark rotation sign flipped to stay in sync with the dial (symmetric mark, so geometry itself is unchanged).
//  - "5" landing target x: 148 -> +148 (becomes the first = right-most glyph of the RTL title).
//  - Title anchor: left:-124 -> right:-124 with direction:rtl, so the title grows leftwards from the "5"; word gap uses marginInlineStart-equivalent (marginLeft on an RTL flow).
//  - Word reveal order min->to->install kept in DOM order which flows right-to-left (first word right-most), the accent last word ends left-most.
//  - Blur/opacity fades are non-directional: kept. Arc radius, gravity-like "top of arc" (vertical): kept. Rotation magnitude 96deg kept.
// FONT: Vazirmatn (variable, weight 600): neutral geometric UI sans matching the original system-sans headline; has Persian digits and weights.
// RASTER: none (pure text/CSS).
// countdown-arc-scatter — Countdown Arc 表盘数字扫过（motion-lab 定稿转原生 Remotion）
// 白底表盘：等大深色数字沿同一大弧切向排布，整盘扫过 ~96° 减速急停（数字随位置角在
// 弧两端淡入/淡出），短刻度线同步回正；"5" 停上弧顶后落位成标题首字符，
// "min / to / install" 逐词模糊淡入，结尾整词转强调色（末双字母收尾的染色手法保留）。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React from 'react';
import { FaRoot, fs, faDigits, FA_LH } from '../../_fa';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';

export const COUNTDOWN_ARC_SCATTER_DURATION = 33; // 1100ms @30fps

const INK = '#17181c';
const ACCENT_RGB = [59, 130, 246]; // #3b82f6
const R0 = 150; // 弧半径
const SP = 24; // 相邻数字角距
// i=6 是 "5"，落位时角度归零停在弧顶
const NUMS = [45, 35, 28, 22, 17, 10, 5, 4, 3];
// "5" 落位的目标点（相对 pivot）
const TARGET = { x: 148, y: -30 };

// 数字/标题共用的字形
const NUM_FONT: React.CSSProperties = {
  color: INK,
  fontWeight: 600,
  fontSize: fs(40),
  letterSpacing: 0,
  lineHeight: FA_LH,
  whiteSpace: 'nowrap',
};

// 逐词模糊淡入的时间窗：min → to → install
const WORDS: { text: string; mr: number; win: [number, number] }[] = [
  { text: 'دقیقه', mr: 11, win: [0.54, 0.68] },
  { text: 'تا', mr: 11, win: [0.62, 0.78] },
  { text: 'نصب', mr: 0, win: [0.7, 0.9] },
];

const mix = (k: number, a: number, b: number) => Math.round(lerp(k, a, b));

export const CountdownArcScatter: React.FC = () => {
  const t = useT();
  // 整盘扫过：+96° → 0°，outCubic 减速急停
  const rot = lerp(seg(t, 0, 0.52, E.outCubic), 96, 0);
  const hand = seg(t, 0.52, 0.7, E.inOutCubic); // "5" 落位平移
  const out = seg(t, 0.5, 0.7, E.inQuad); // 其余数字原地淡出
  // 结尾整词（末双字母收尾）转强调色 #17181c → ACCENT
  const bl = seg(t, 0.84, 0.98);
  return (
    <FaRoot family="Vazirmatn"><DesignStage bg="#fff">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#fff',
          overflow: 'hidden',
          fontFamily: '"Vazirmatn", sans-serif',
          direction: 'rtl',
        }}
      >
        {/* pivot：所有元素都以它为原点定位 */}
        <div style={{ position: 'absolute', left: '50%', top: '58%', width: 0, height: 0 }}>
          {NUMS.map((n, i) => {
            const is5 = n === 5;
            const pa = (i - 6) * SP + rot; // 当前位置角
            const rad = (pa * Math.PI) / 180;
            let x = -Math.sin(rad) * R0; // mirrored
            let y = -Math.cos(rad) * R0;
            let rSelf = -pa; // mirrored // 切向排布：随位置角自转
            let op = Math.max(0, Math.min(1, (70 - Math.abs(pa)) / 22)); // 弧两端淡入淡出
            if (is5) {
              x = lerp(hand, x, TARGET.x);
              y = lerp(hand, y, TARGET.y);
              rSelf *= 1 - hand;
            } else {
              op *= 1 - out;
            }
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  ...NUM_FONT,
                  opacity: op,
                  transform: `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rSelf}deg)`,
                  // "5" 不模糊；其余数字随淡出同步糊化
                  filter: is5 ? undefined : `blur(${out * 3}px)`,
                }}
              >
                {faDigits(n)}
              </div>
            );
          })}
          {/* 短刻度指针（深色细线，随盘转动回正） */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              transform: `rotate(${-rot * 0.35}deg)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -1.5,
                top: -101,
                width: 3,
                height: 26,
                borderRadius: 2,
                background: INK,
                opacity: 1 - out,
              }}
            />
          </div>
          {/* 标题（相对 pivot 定位，中性占位文案），"5" 落到其左端 */}
          <div
            style={{
              position: 'absolute',
              right: -124,
              direction: 'rtl',
              whiteSpace: 'nowrap',
              top: -30,
              transform: 'translateY(-50%)',
              ...NUM_FONT,
            }}
          >
            {WORDS.map(({ text, mr, win }, k) => {
              const p = seg(t, win[0], win[1], E.outCubic);
              const isLast = k === WORDS.length - 1;
              return (
                <span
                  key={k}
                  style={{
                    display: 'inline-block',
                    marginRight: undefined,
                    marginLeft: undefined,
                    marginInlineEnd: mr || undefined,
                    opacity: p,
                    filter: `blur(${(1 - p) * 6}px)`,
                    color: isLast
                      ? `rgb(${mix(bl, 23, ACCENT_RGB[0])},${mix(bl, 24, ACCENT_RGB[1])},${mix(bl, 28, ACCENT_RGB[2])})`
                      : undefined,
                  }}
                >
                  {text}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </DesignStage></FaRoot>
  );
};
