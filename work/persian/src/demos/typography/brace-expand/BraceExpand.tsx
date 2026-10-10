// brace-expand (Persian/RTL) -- analysis
// TEXT: "عنوان شما" -> "عنوان شما" (natural placeholder title, Persian). Width ~190px at sc=1 fits the 262px clip
//   (HALF=148 kept). Beats unchanged: brace on at t=.07, outBack .13-.34, relax .42-.62.
// SHAPING: letterSpacing 1->2.6px "breath" would break Persian joining -> letterSpacing is 0; the breath is carried by
//   wordSpacing 1->2.6px (the same lerp/window, only the single word gap opens) -- joined letters never separate.
// DIRECTION: composition is symmetric about the centre; brace positions (+-x), clip centring and shared scale are KEPT.
//   Reveal grows from the middle both ways = symmetric, nothing reading-directional to mirror. The glyphs stay visually
//   "{ ... }" (opening on the left, closing on the right) -- the pair is rendered in an ltr island so bidi never
//   mirrors/swaps them; the title text itself is rtl. Brace layout stays absolute (no flex), per the source prompt.
// FONT: Vazirmatn 800 (variable, weight available): neutral developer/product headline, braces from the same face so
//   weight matches; Persian line-height 1.5 inside the 60px clip (fs(38)=42px -> 63px line, centred, no clipping seen).
// RASTER: none.
// brace-expand — Brace Expand Reveal 括号拉幕（motion-lab 定稿转原生 Remotion）
// 一对紧贴的花括号先小字号出现在正中，随即带过冲（outBack ~8%）地向左右滑开并放大到
// 标题级，文字像被括号拉开幕布般在中间揭示（clip 宽度严格绑括号间距），落定后字距再细微松弛。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React from 'react';
import { FaRoot, faText, FA_LH } from '../../_fa';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';

export const BRACE_EXPAND_DURATION = 114; // 3800ms @30fps

const FONT = '"Vazirmatn", sans-serif';
const HALF = 148; // 括号最终半距

// 单只花括号：x 为当前水平偏移（左负右正），sc 为同步放大比例
const Brace: React.FC<{ ch: string; x: number; sc: number; on: number }> = ({ ch, x, sc, on }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      fontWeight: 800,
      fontSize: 44,
      direction: 'ltr',
      unicodeBidi: 'isolate',
      lineHeight: 1,
      fontFamily: FONT,
      color: '#fff',
      transform: `translate(-50%,-50%) translateX(${x}px) scale(${sc})`,
      opacity: on,
    }}
  >
    {ch}
  </div>
);

export const BraceExpand: React.FC = () => {
  const t = useT();
  const on = t >= 0.07 ? 1 : 0; // 先单独出现（小字号，约 2 帧后再动）
  const ex = seg(t, 0.13, 0.34, E.outBack); // 弹开：过冲约 8% 再回弹
  const sc = lerp(ex, 0.6, 1); // 字号同步放大到标题级
  const x = HALF * ex * sc;
  // 落定后 letterspacing 细微松弛
  const ls = lerp(seg(t, 0.42, 0.62, E.inOutQuad), 1, 2.6);
  return (
    <DesignStage bg="#0a0b10">
     <FaRoot family="Vazirmatn">
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
        {/* 文字揭示宽度严格绑括号间距（幕布感，而非打字） */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: 'translate(-50%,-50%)',
            overflow: 'hidden',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: Math.max(0, x * 2 - 34),
            opacity: on,
          }}
        >
          <div
            style={{
              ...faText(38),
              unicodeBidi: 'isolate',
              lineHeight: FA_LH,
              fontWeight: 800,
              fontFamily: FONT,
              color: '#fff',
              whiteSpace: 'nowrap',
              wordSpacing: `${ls}px`,
              transform: `scale(${sc})`,
            }}
          >
            عنوان شما
          </div>
        </div>
        <Brace ch="{" x={-x} sc={sc} on={on} />
        <Brace ch="}" x={x} sc={sc} on={on} />
      </div>
     </FaRoot>
    </DesignStage>
  );
};
