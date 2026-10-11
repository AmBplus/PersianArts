// PERSIAN (RTL) localization of shotcraft "split-flap-title" (airport split-flap board). Timing/easing/seed untouched.
// Analysis, element by element:
//  - TEXT: "SHIP FASTER" -> "زودتر ارسال کن" (idiomatic product-launch imperative, same 2-word headline voice).
//  - SHAPING: a flap cell can never hold a single code point of a joined script. Each cell therefore holds one JOINED GROUP
//    (joinedGroups(): ز / و / د / تر | ا / ر / سا / ل | کن), so every cell shows a correctly shaped, self-contained glyph run
//    and the cell borders fall exactly where Persian letters stop connecting (ZWNJ/non-joiners). 9 cells (orig 10).
//    Garble states are drawn from a pool of isolated Persian letters, Persian digits and a few symbols (orig: A-Z 0-9 #$%&),
//    still picked by the same seeded sine hash (no Math.random). No letterSpacing / uppercase anywhere.
//  - DIRECTION: row is direction:rtl, so the first cell (ز) sits at the RIGHT and the stagger cascade (i * 4f) sweeps
//    right -> left = reading order (orig: left -> right). Word gap kept (52px). Flap physics (rotateX, gravity, brightness,
//    click-settle translateY) is vertical/physical -> KEPT. Cell geometry/corners are symmetric -> nothing to mirror.
//  - BACKDROP: FakeDashboard (text-free placeholder) has a left sidebar and a right-aligned search/avatar; it is mirrored
//    with scaleX(-1) (safe: no text, no raster) so the sidebar sits right like in an RTL product.
//  - FONT: Noto Kufi Arabic 800 - geometric, upright, signage-like; fits mechanical display tiles (orig Helvetica 800),
//    variable font so weight 800 is real. Size 100 -> fs-scaled and cells widened (130x170) because Persian glyphs are
//    smaller/ taller (dots, ascenders); vertical centering uses lineHeight 1 + flex centering.
//  - No raster assets in this demo.
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FakeDashboard, G } from '../../../persian/src/demos/_fixtures/Fixtures';
import { FaRoot, joinedGroups } from '../../../persian/src/demos/_fa';

// split-flap-flip：机场翻牌字。每字符一个深底翻牌格（上下两半），
// 逐格翻过 3 个乱码中间态后咔哒停在目标字，左→右 4f 级联成波。
// 节拍：0–21 建立（整排乱码静止）→ 22 起级联翻牌 → 78 全部停定 → 静止到 140。

const TEXT = '۱۴۰۵';
const CHARSET = [...'بصمکهقعنتحژسدوفگچ۰۱۲۳۴۵۶۷۸۹٪؟#'];
const GROUPS = /^[\u06F0-\u06F9\s]+$/.test(TEXT) ? joinedGroups(TEXT).slice().reverse() : joinedGroups(TEXT);
const START = 22; // 级联起始帧
const STAGGER = 4; // 字符间级联延迟
const FLIP = 5; // 单次翻牌时长
const NFLIP = 3; // 每字符翻 3 次（2 个乱码中间态 + 1 次落到目标字）
const CELL_W = 144;
const CELL_H = 170;

// seed 正弦哈希（禁 Math.random）
const rnd = (a: number) => {
  const x = Math.sin(a * 127.3) * 43758.5453;
  return x - Math.floor(x);
};
const garble = (i: number, k: number) =>
  CHARSET[Math.floor(rnd(i * 7.13 + k * 3.71 + 1) * CHARSET.length)];

const FLAP_BG = '#262624';
const FLAP_INK = '#f4f4f2';

// 半格：上/下半各自 overflow hidden，内部整字定位错半格露出对应一半
const Half: React.FC<{ ch: string; part: 'top' | 'bottom' }> = ({ ch, part }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: part === 'top' ? 0 : CELL_H / 2,
      width: CELL_W,
      height: CELL_H / 2,
      overflow: 'hidden',
      background: FLAP_BG,
      borderRadius: part === 'top' ? '10px 10px 0 0' : '0 0 10px 10px',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: part === 'top' ? 0 : -CELL_H / 2,
        width: CELL_W,
        height: CELL_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Noto Kufi Arabic", "Vazirmatn", sans-serif',
        fontWeight: 800,
        fontSize: 88,
        lineHeight: 1,
        letterSpacing: 0,
        direction: 'rtl',
        color: FLAP_INK,
      }}
    >
      {ch}
    </div>
  </div>
);

const FlapCell: React.FC<{ target: string; i: number; frame: number }> = ({
  target,
  i,
  frame,
}) => {
  // 该格的字符序列：2 个乱码 → 1 个乱码 → 目标字（首态也是乱码，建立段可见）
  const seq = [garble(i, 0), garble(i, 1), garble(i, 2), target];
  const local = frame - (START + i * STAGGER);
  const done = local >= NFLIP * FLIP;

  // 停定咔哒：整格下沉回弹（1px 肉眼无感，放大到 6px 才有"咔哒"）
  const clickY = done
    ? interpolate(local, [15, 17, 19, 22], [0, 6, -1.5, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 0;

  let topCh = seq[0];
  let bottomCh = seq[0];
  let flap: React.ReactNode = null;

  if (done) {
    topCh = target;
    bottomCh = target;
  } else if (local > 0) {
    const k = Math.min(NFLIP - 1, Math.floor(local / FLIP));
    const from = seq[k];
    const to = seq[k + 1];
    const p = Easing.in(Easing.quad)((local - k * FLIP) / FLIP); // 重力感：越掉越快
    topCh = to; // 上半静态：翻开后露出下一字符的上半
    bottomCh = from; // 下半静态：保持旧字符直到活动叶盖下来
    if (p < 0.5) {
      // 前半程：旧字符上半叶 0→-90 掉下
      const deg = p * 2 * 90;
      flap = (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${-deg}deg)`,
            transformOrigin: `center ${CELL_H / 2}px`,
            backfaceVisibility: 'hidden',
            filter: `brightness(${1 - p * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={from} part="top" />
        </div>
      );
    } else {
      // 后半程：新字符下半叶 90→0 拍下盖住旧下半
      const deg = 90 - (p - 0.5) * 2 * 90;
      flap = (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `rotateX(${deg}deg)`,
            transformOrigin: `center ${CELL_H / 2}px`,
            backfaceVisibility: 'hidden',
            filter: `brightness(${0.55 + (p - 0.5) * 2 * 0.45})`,
            zIndex: 2,
          }}
        >
          <Half ch={to} part="bottom" />
        </div>
      );
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: CELL_W,
        height: CELL_H,
        transform: `translateY(${clickY}px)`,
        perspective: 420,
        borderRadius: 10,
        boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
      }}
    >
      <Half ch={topCh} part="top" />
      <Half ch={bottomCh} part="bottom" />
      {flap}
      {/* 中缝铰链线 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CELL_H / 2 - 2,
          width: CELL_W,
          height: 4,
          background: '#141412',
          zIndex: 3,
        }}
      />
    </div>
  );
};

export const SplitFlapFlip: React.FC = () => {
  const frame = useCurrentFrame();
  let letterIdx = 0;
  return (
    <AbsoluteFill style={{ background: G.bg, overflow: 'hidden' }}>
    <FaRoot family="Noto Kufi Arabic">
      {/* 背景假页面压暗，突出翻牌板 (mirrored: sidebar on the right) */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3, filter: 'saturate(0.8)', transform: 'scaleX(-1)', direction: 'ltr' }}>
        <FakeDashboard variant="A" />
      </div>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', direction: 'rtl', gap: 12, alignItems: 'center' }}>
          {GROUPS.map((ch, idx) => {
            if (ch === ' ') {
              return <div key={idx} style={{ width: 52 }} />;
            }
            const i = letterIdx++;
            return <FlapCell key={idx} target={ch} i={i} frame={frame} />;
          })}
        </div>
      </AbsoluteFill>
    </FaRoot>
    </AbsoluteFill>
  );
};
