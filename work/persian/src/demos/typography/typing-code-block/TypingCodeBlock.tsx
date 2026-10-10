// PERSIAN (RTL) localization of shotcraft "typing-code-block" -- motion, timing, easing and token palette untouched.
// TEXT
//  - Panel labels "LINE FADE-IN" / "CHAR TYPING" -> «ظهور خط‌به‌خط» / «تایپ حرف‌به‌حرف» (describe the technique, product-demo voice).
//    The 8px / letterSpacing:2 kicker style is dropped (tracking breaks Persian joining); same colour, set at fs-scaled 9px.
//  - Code (const app = createApp(); app.use(router); app.mount('#root');) is code syntax: kept Latin, LTR.
//  - The only human-language token is the comment "// ready" -> "// آماده" (same 8 characters, so the typing window keeps
//    the original 59-character pace and ends on the same frame; no beat shifts).
// DIRECTION DECISIONS
//  - MIRRORED: panel order. The "reveal whole line" panel is the first in reading order, so it moves from the left to the
//    right half (right:3.5%) and the typing panel to the left half (right:51.5%): x' = 100 - x - 45. Both panels share the same spec.
//  - MIRRORED: panel label sits on the start (right) edge of each panel (direction:rtl on the panel), like an RTL UI header.
//  - KEPT: code lines stay LTR islands (direction:ltr, textAlign:left): code syntax, brackets and operators do not mirror, and
//    the typing cursor advances left-to-right through Latin code, so the typewriter order is the reading order of the code itself.
//  - KEPT: translateY(8px) rise (vertical, gravity-like) and the line stagger order (top to bottom).
//  - Persian comment typing: the not-yet-typed remainder keeps its width as hidden text (like the original opacity:0 chars),
//    and a ZWNJ separates the visible prefix from the hidden rest so the last typed letter shows its final form (no ghost joining
//    to an invisible letter). The block cursor sits on the last typed letter.
// FONT: Vazir Code for the Latin code (mono chrome), Vazirmatn for the neutral UI labels and for the Persian comment letters
//  (Vazir Code is monospace, so its Persian shows unjoined, spaced letters: Persian runs switch to Vazirmatn at 13px).
// RASTER: none in this card.
// ORIGINAL HEADER: typing-code-block — Code Block Reveal 代码块揭示（motion-lab 定稿转原生 Remotion）
// 同一段语法高亮代码的两种 reveal 对照：左侧逐行淡入上浮（行级 stagger），
// 右侧逐字符打字但保持 token 着色，当前字符位以方块底色块提示光标。
// 设计坐标 480×270（DesignStage 等比放大），参数表数值以此坐标系标定。
import React from 'react';
import { DesignStage, E, seg, useT } from '../../_fixtures/Motion';
import { FaFonts, faText } from '../../_fa';

export const TYPING_CODE_BLOCK_DURATION = 138; // 4600ms @30fps

// token 配色：关键字/标识符/函数/字符串/标点/注释
const K = '#c792ea';
const ID = '#e8eaf0';
const FN = '#82aaff';
const ST = '#c3e88d';
const PU = '#89ddff';
const CM = '#546e7a';
// 每行是 [text, color] token 序列
const LINES: [string, string][][] = [
  [['const ', K], ['app', ID], [' = ', PU], ['createApp', FN], ['();', ID]],
  [['app', ID], ['.', PU], ['use', FN], ['(', ID], ['router', ID], [');', ID]],
  [['app', ID], ['.', PU], ['mount', FN], ['(', ID], ["'#root'", ST], [');', ID]],
  [['// ', CM], ['آماده', CM]],
];
// 右侧打字用的逐字符扁平序列（保留 token 颜色 + 行号）
const FLAT: { ch: string; color: string; row: number }[] = [];
LINES.forEach((line, row) => {
  for (const [txt, color] of line) for (const ch of txt) FLAT.push({ ch, color, row });
});

// 代码面板容器：左右两块共用的外框 + 顶部小标签（RTL：面板用 right 定位，标签靠起始侧即右侧）
const Panel: React.FC<{ x: number; label: string; children: React.ReactNode }> = ({
  x,
  label,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      right: `${x}%`,
      top: '14%',
      width: '45%',
      height: '72%',
      background: '#10121a',
      border: '1px solid #1c2030',
      borderRadius: 8,
      padding: '10px 12px',
      boxSizing: 'border-box',
      direction: 'rtl',
      fontFamily: '"Vazir Code","Vazirmatn",monospace',
      fontSize: 12,
      lineHeight: 1.9,
    }}
  >
    <div style={{ ...faText(8), color: '#4a5270', marginBottom: 6, fontFamily: '"Vazirmatn",sans-serif', lineHeight: 1.5 }}>
      {label}
    </div>
    {/* code is an LTR island */}
    <div style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}>{children}</div>
  </div>
);

const isFa = (ch: string | undefined) => !!ch && /[؀-ۿ]/.test(ch);
// Persian letters in the comment use the joined-script UI font (a monospace face would show them unjoined)
const FA_CODE_FONT = { fontFamily: '"Vazirmatn",sans-serif', fontSize: 13 } as const;

// 右侧一行：已打字符（含方块光标位）+ 未打字符以隐藏文本占位（宽度不变，同原版 opacity:0）
const TypedRow: React.FC<{ row: number; visible: number; cursor: number }> = ({ row, visible, cursor }) => {
  const entries = FLAT.map((c, i) => ({ ...c, i })).filter((c) => c.row === row);
  const spans: { text: string; color: string; shown: boolean; cur: boolean; fa: boolean }[] = [];
  for (const c of entries) {
    const shown = c.i < visible;
    const cur = c.i === cursor;
    const fa = isFa(c.ch);
    const last = spans[spans.length - 1];
    if (last && last.color === c.color && last.shown === shown && last.cur === cur && last.fa === fa) last.text += c.ch;
    else spans.push({ text: c.ch, color: c.color, shown, cur, fa });
  }
  return (
    <div style={{ minHeight: '1.9em' }}>
      {spans.map((s, k) => {
        const next = spans[k + 1];
        const zwnj = s.shown && next && !next.shown && isFa(s.text.slice(-1)) && isFa(next.text[0]) ? '‌' : '';
        return (
          <span
            key={k}
            style={{
              color: s.color,
              ...(s.fa ? FA_CODE_FONT : null),
              opacity: s.shown ? 1 : 0,
              background: s.cur ? '#3a4468' : 'transparent',
            }}
          >
            {s.text + zwnj}
          </span>
        );
      })}
    </div>
  );
};

export const TypingCodeBlock: React.FC = () => {
  const t = useT();
  // 右侧打字进度：t∈[0.08,0.9] 线性推进到全部字符
  const typed = Math.floor(seg(t, 0.08, 0.9) * FLAT.length);
  return (
    <FaFonts families={['Vazir Code', 'Vazirmatn']}>
    <DesignStage bg="#0a0b10">
      {/* 左：逐行淡入上浮（行级 stagger） */}
      <Panel x={3.5} label="ظهور خط‌به‌خط">
        {LINES.map((line, i) => {
          const k = seg(t, 0.08 + i * 0.14, 0.08 + i * 0.14 + 0.3, E.outCubic);
          return (
            <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>
              {line.map(([txt, color], j) => (
                <span key={j} style={{ color, ...(isFa(txt[0]) ? FA_CODE_FONT : null) }}>
                  {txt}
                </span>
              ))}
            </div>
          );
        })}
      </Panel>
      {/* 右：逐字符打字（保色），当前字符位带方块光标底色 */}
      <Panel x={51.5} label="تایپ حرف‌به‌حرف">
        {LINES.map((_, row) => (
          <TypedRow
            key={row}
            row={row}
            visible={Math.min(typed + 1, FLAT.length)}
            cursor={typed < FLAT.length ? typed : -1}
          />
        ))}
      </Panel>
    </DesignStage>
    </FaFonts>
  );
};
