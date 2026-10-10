// Static Persian page chrome (replaces the baked wbr-full.png screenshot, which carried Chinese/English UI text).
// Everything is mirrored for RTL: brand/nav at the right, weeks sidebar on the right, comments rail on the left.
import React from 'react';
import { faText, faDigits } from '../../_fa';

export const PAPER = '#fdfcfa';
export const AMBER = 'oklch(52% 0.115 65)';
export const AMBER_WASH = 'oklch(95% 0.05 85)';
export const INK = '#1f2937';
const LINE = 'rgba(31,41,55,0.09)';
const GREEN = '#1f7a4d';

/** Wrap Latin runs in <bdi> so surrounding Persian punctuation does not jump; optionally highlight a phrase. */
export const Bidi: React.FC<{ text: string; hl?: string }> = ({ text, hl }) => {
  const re = /[A-Za-z][A-Za-z0-9\-.\/]*(?: [A-Za-z][A-Za-z0-9\-.\/]*)*/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const pushPlain = (s: string) => {
    if (!hl || !s.includes(hl)) { out.push(s); return; }
    const [a, b] = s.split(hl);
    out.push(a, <span key={`h${k++}`} style={{ borderBottom: `2px solid ${AMBER}`, background: AMBER_WASH, borderRadius: 3, padding: '0 3px' }}>{hl}</span>, b);
  };
  while ((m = re.exec(text))) {
    pushPlain(text.slice(last, m.index));
    out.push(<bdi key={k++} style={{ unicodeBidi: 'isolate' }}>{m[0]}</bdi>);
    last = m.index + m[0].length;
  }
  pushPlain(text.slice(last));
  return <>{out}</>;
};

const Ico: React.FC<{ d: string; flip?: boolean; size?: number }> = ({ d, flip, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d={d} />
  </svg>
);
const Sep = () => <div style={{ width: 1, height: 22, background: LINE, margin: '0 8px' }} />;
const Letter: React.FC<{ c: string; style?: React.CSSProperties }> = ({ c, style }) => (
  <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#4b5563', width: 18, textAlign: 'center', direction: 'ltr', ...style }}>{c}</span>
);

export const Chrome: React.FC = () => (
  <>
    {/* top bar: brand at the start (right), nav follows to its left */}
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 61, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 22, paddingInline: 24, boxSizing: 'border-box' }}>
      <span style={faText(19, { fontWeight: 800, color: INK })}>آزمایشگاه بنیان هوش مصنوعی</span>
      <span style={faText(14, { color: '#4b5563' })}>گزارش هفتگی</span>
      <span style={faText(14, { color: '#4b5563' })}>مقاله‌ها</span>
    </div>

    {/* doc header */}
    <div style={{ position: 'absolute', left: 288, top: 61, width: 1424, height: 41, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 10, paddingInline: 16, boxSizing: 'border-box' }}>
      <span style={faText(14, { fontWeight: 700, color: INK })}>هفتهٔ {faDigits(28)} · {faDigits(2026)}</span>
      <span style={faText(13, { color: '#6b7280' })}>۱۹ تیر</span>
      <span style={faText(12, { color: GREEN, fontWeight: 500 })}>همگام‌شده</span>
      <div style={{ marginInlineStart: 'auto', width: 28, height: 28, borderRadius: 14, background: '#3f6b4e', border: '2px solid #d7a58f', boxSizing: 'border-box', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>V</div>
    </div>

    {/* toolbar (order mirrored: undo/redo first at the right; undo/redo arrows mirrored) */}
    <div style={{ position: 'absolute', left: 288, top: 102, width: 1424, height: 44, borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 16, paddingInline: 17, boxSizing: 'border-box' }}>
      <Ico d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" flip />
      <Ico d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" flip />
      <Sep />
      <span style={faText(13, { color: '#1f2937', display: 'flex', alignItems: 'center', gap: 6 })}>عنوان {faDigits(1)}<Ico d="m6 9 6 6 6-6" size={14} /></span>
      <Sep />
      <Letter c="B" style={{ fontWeight: 700 }} />
      <Letter c="I" style={{ fontStyle: 'italic' }} />
      <Letter c="U" style={{ textDecoration: 'underline' }} />
      <Letter c="S" style={{ textDecoration: 'line-through' }} />
      <Letter c="A" style={{ borderBottom: `3px solid ${INK}`, lineHeight: '16px' }} />
      <Ico d="m8 8-5 4 5 4M16 8l5 4-5 4" />
      <Sep />
      <Ico d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
      <Ico d="M10 6h10M10 12h10M10 18h10M4 5v3M4 11h2l-2 3h2M4 17h2v1H4v1h2" />
      <Sep />
      <Ico d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      <Ico d="M4 5h16v14H4zM4 16l5-5 5 5 3-3 3 3M15 9h.01" />
      <Ico d="M4 5h16v14H4zM4 11h16M4 15h16M10 5v14" />
      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Ico d="M12 4v11m-4-4 4 4 4-4M5 20h14" />
        <Ico d="m6 9 6 6 6-6" size={14} />
      </div>
    </div>

    {/* minimap of comment anchors, mirrored to the left edge of the doc area */}
    <div style={{ position: 'absolute', left: 285, top: 576, width: 44, textAlign: 'center', ...faText(10, { color: GREEN, fontWeight: 600 }) }}>{faDigits('4 / 4')}</div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ position: 'absolute', left: 301, top: 597 + i * 12.5, width: 9, height: 9, borderRadius: 5, background: GREEN }} />
    ))}
  </>
);

/** weeks sidebar (right). */
export const WeeksRail: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderInlineStart: `1px solid ${LINE}`, boxSizing: 'border-box', background: '#fbfaf7' }}>
    <div style={{ height: 50, display: 'flex', alignItems: 'center', paddingInline: 12, justifyContent: 'space-between' }}>
      <span style={faText(12, { color: '#374151', fontWeight: 500 })}>گزارش‌های هفتگی</span>
      <span style={{ color: '#6b7280', fontSize: 16, direction: 'ltr' }}>»</span>
    </div>
    <div style={{ margin: '5px 12px 0', height: 32, borderRadius: 6, background: '#fff', border: `1px solid ${LINE}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, paddingInline: 10 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.2" strokeLinecap="round"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
      <span style={faText(11, { color: '#9ca3af' })}>جست‌وجو در متن گزارش‌ها</span>
    </div>
    <div style={{ marginTop: 8, height: 70, background: '#f3f1ed', borderBottom: `1px solid ${LINE}`, padding: '9px 12px 0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={faText(13, { fontWeight: 600, color: INK })}>هفتهٔ {faDigits(28)} {faDigits(2026)}</span>
        <span style={faText(9, { color: AMBER, fontWeight: 600 })}>این هفته</span>
        <span style={faText(9, { color: '#9ca3af', marginInlineStart: 'auto' })}>۱۹ تیر</span>
      </div>
      <div style={faText(10, { color: '#6b7280', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>هفتهٔ ۲۸ · گزارش هفتگی آزمایشگاه</div>
      <div style={faText(9, { color: '#9ca3af' })}>هم‌اکنون</div>
    </div>
  </div>
);

const Card: React.FC<{ quote: string; body: string; top: number; h: number }> = ({ quote, body, top, h }) => (
  <div style={{ position: 'absolute', left: 12, top, width: 264, height: h, borderRadius: 10, background: '#fff', border: `1px solid ${LINE}`, boxSizing: 'border-box', padding: 10 }}>
    <div style={{ background: '#f3f1ed', borderRadius: 4, padding: '4px 10px', fontSize: 12, color: '#6b7280', direction: 'rtl', textAlign: 'start' }}>«<bdi>{quote}</bdi>»</div>
    <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={faText(11, { fontWeight: 700, color: INK })}>بازدیدکننده</span>
      <span style={faText(9, { color: '#9ca3af' })}>هم‌اکنون</span>
    </div>
    <div style={faText(12, { color: INK, lineHeight: 1.55, marginTop: 2 })}>{body}</div>
    <div style={{ position: 'absolute', insetInline: 10, bottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ flex: 1, height: 24, border: `1px solid ${LINE}`, borderRadius: 4, background: '#fafafa', display: 'flex', alignItems: 'center', paddingInline: 8 }}>
        <span style={faText(9, { color: '#9ca3af' })}>پاسخ…</span>
      </div>
      <span style={faText(9, { color: '#6b7280' })}>پاسخ</span>
    </div>
  </div>
);

/** comments rail (left). */
export const CommentsRail: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderInlineEnd: `1px solid ${LINE}`, boxSizing: 'border-box', background: '#fbfaf7' }}>
    <div style={{ height: 50, display: 'flex', alignItems: 'center', paddingInline: 12, justifyContent: 'space-between' }}>
      <span style={faText(12, { color: '#374151', fontWeight: 500 })}>نظرها · {faDigits(2)}</span>
      <span style={{ color: '#6b7280', fontSize: 16, direction: 'ltr' }}>«</span>
    </div>
    <Card top={61} h={150} quote="۶۲٪ ← ۷۱٪" body="با نتیجهٔ W26 هم‌خوان است؛ می‌شود هر دو را در یک گزارش ادغام کرد." />
    <Card top={219} h={144} quote="۳٫۱× پیش‌دستی" body="این میزان پیش‌دستی برای تصویب کافی است؛ پیشنهاد می‌کنم هفتهٔ بعد نمونه‌های شکست هم به بازبینی بیاید." />
  </div>
);
