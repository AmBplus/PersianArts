// Card-local live replacement for the baked detail-page image. All on-screen copy is
// Persian: brand/nav, project overview, metadata, tabs, controls, headings and five rows.
// RTL decisions: text starts at the right; nav/tabs/filters follow right-to-left reading
// order; the title column is rightmost and dates are leftmost; the expand action is left.
// Centered page width and row x/y slots stay fixed because they are symmetric geometry.
// Date digits use faDigits; no Latin/Chinese raster remains. Font: Vazirmatn via FaRoot
// in RowEmbed, chosen for a restrained product UI and genuine variable weights.
import React from 'react';
import {faDigits, faText} from '../../_fa';
import layout from '../../_textures/live-layout.json';

const paper = '#faf7f2';
const ink = '#211f1c';
const muted = '#77736d';
const rule = '#e8e3db';
const accent = '#98502c';

const rowData = [
  'آیا چرخهٔ عامل، برنامهٔ یادگیری بهتری پیدا می‌کند؟',
  'پیگیری ۱: یافتن برنامهٔ یادگیری بهتر با چرخهٔ عامل',
  'پیگیری ۲: یافتن برنامهٔ یادگیری بهتر با چرخهٔ عامل',
  'پیگیری ۳: یافتن برنامهٔ یادگیری بهتر با چرخهٔ عامل',
  'پیگیری ۴: یافتن برنامهٔ یادگیری بهتر با چرخهٔ عامل',
];
const description = 'بازسازی چرخهٔ پژوهش خودکار برای پیشنهاد، اجرا و جمع‌بندی آزمایش‌های آموزش مدل زبانی.';

/** Exactly the same live component is used on the page and on its flying copy. */
export const DetailRow: React.FC<{index: number; flying?: boolean}> = ({index, flying = false}) => (
  <div style={{
    width: layout.detail.rows[index].w, height: layout.detail.rows[index].h,
    boxSizing: 'border-box', display: 'grid', direction: 'rtl',
    gridTemplateColumns: '640px 90px 95px 85px 170px', alignItems: 'start',
    padding: '14px 12px 0', background: flying ? '#fff' : paper,
    borderBottom: `1px solid ${rule}`, overflow: 'hidden',
  }}>
    <div style={{paddingInlineStart: 0, paddingInlineEnd: 20, minWidth: 0}}>
      <div style={faText(15, {fontWeight: 600, color: ink, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'})}>{rowData[index]}</div>
      <div style={faText(12, {color: muted, lineHeight: 1.55, maxWidth: 610, marginTop: 2})}>{description}</div>
    </div>
    <div><span style={faText(12, {display: 'inline-block', color: accent, background: '#f6e7df', borderRadius: 20, padding: '3px 9px', lineHeight: 1.3})}>در حال بررسی</span></div>
    <div style={faText(12, {color: ink, lineHeight: 1.6})}>آزمایشی</div>
    <div style={faText(12, {color: ink, lineHeight: 1.6})}>مارکو</div>
    <div style={faText(11, {color: muted, lineHeight: 1.6, whiteSpace: 'nowrap'})}>{faDigits('2026/06/22 22:00')}</div>
  </div>
);

const heading = (text: string, y: number) => <div style={{position: 'absolute', top: y, right: 408, left: 408, ...faText(12, {color: muted})}}>{text}</div>;

export const PersianPage: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, width: 1920, height: layout.detail.pageH, background: paper, color: ink, direction: 'rtl'}}>
    <div style={{height: 61, background: '#fffdfa', borderBottom: `1px solid ${rule}`}}>
      <div style={{position: 'absolute', top: 0, right: 408, width: 1104, height: 61, display: 'flex', alignItems: 'center', gap: 22}}>
        <span style={faText(20, {fontWeight: 800, color: '#1d1b18', whiteSpace: 'nowrap'})}>آزمایشگاه بنیاد هوش مصنوعی</span>
        <span style={faText(12, {color: muted})}>هفته‌نامه</span>
        <span style={faText(12, {color: muted})}>مقاله‌ها</span>
      </div>
    </div>
    {heading('پروژه', 91)}
    <div style={{position: 'absolute', top: 120, right: 408, width: 1104, ...faText(30, {fontWeight: 800, color: '#141311', lineHeight: 1.4})}}>نانوآزمایشگاه: چرخهٔ پژوهش خودکار</div>
    <div style={{position: 'absolute', top: 173, right: 408, display: 'flex', gap: 8}}>
      {['عامل‌های هوشمند', 'یادگیری خودکار'].map((tag) => <span key={tag} style={faText(11, {padding: '3px 10px', borderRadius: 20, background: '#f1eee8', color: muted, lineHeight: 1.5})}>{tag}</span>)}
    </div>
    <div style={{position: 'absolute', top: 215, right: 408, width: 1104, ...faText(15, {color: '#34312d', lineHeight: 1.5})}}>بازسازی چرخه‌ای خودکار که آزمایش‌های آموزش مدل زبانی را پیشنهاد، اجرا و خلاصه می‌کند.</div>
    <div style={{position: 'absolute', top: 287, right: 408, width: 1104, height: 45, borderBottom: `1px solid ${rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
      <span style={faText(12, {color: muted})}>ویرایش فراداده</span><span style={faText(12, {color: accent, fontWeight: 700})}>گسترش ویرایش</span>
    </div>
    {heading('اطلاعات پروژه', 376)}
    <div style={{position: 'absolute', top: 402, right: 408, width: 1104, borderTop: `1px solid ${rule}`}} />
    {([
      ['مسئول', 'مارکو'], ['حوزه', 'زیرساخت پژوهش'], ['وضعیت', 'در حال انجام'],
    ] as const).map(([label, value], i) => <div key={label} style={{position: 'absolute', top: 414 + i * 32, right: 408, width: 1104, display: 'flex', ...faText(13, {lineHeight: 1.5})}}><span style={{width: 170, color: muted}}>{label}</span><span>{value}</span></div>)}
    <div style={{position: 'absolute', top: 531, right: 408, width: 1104, height: 36, borderBottom: `1px solid ${rule}`, display: 'flex', gap: 30, alignItems: 'flex-start'}}>
      <span style={faText(13, {height: 36, color: accent, fontWeight: 700, borderBottom: `1px solid ${accent}`, padding: '0 12px'})}>پرسش‌های پژوهشی ({faDigits(5)})</span>
      <span style={faText(13, {color: '#5e5a55'})}>آزمایش‌ها ({faDigits(112)})</span>
      <span style={faText(13, {color: '#5e5a55'})}>دارایی‌ها ({faDigits(0)})</span>
    </div>
    <div style={{position: 'absolute', top: 583, right: 408, width: 1104, display: 'flex', gap: 12, alignItems: 'center', ...faText(12, {color: muted})}}>
      <span>فیلتر:</span><span style={{border: `1px solid ${rule}`, borderRadius: 5, padding: '4px 13px', background: '#fff'}}>همهٔ وضعیت‌ها⌄</span>
      <span style={{marginInlineStart: 5}}>مرتب‌سازی:</span><span style={{border: `1px solid ${rule}`, borderRadius: 5, padding: '4px 13px', background: '#fff'}}>آخرین به‌روزرسانی⌄</span>
    </div>
    <div style={{position: 'absolute', top: 632, right: 408, width: 1104, height: 34, background: '#f0ede7', display: 'grid', direction: 'rtl', gridTemplateColumns: '640px 90px 95px 85px 170px', alignItems: 'center', padding: '0 12px', boxSizing: 'border-box', ...faText(11, {color: muted})}}>
      <span>پرسش</span><span>وضعیت</span><span>نوع</span><span>مسئول</span><span>به‌روزرسانی</span>
    </div>
    {layout.detail.rows.map((r, index) => <div key={index} style={{position: 'absolute', left: r.x, top: r.y}}><DetailRow index={index} /></div>)}
  </div>
);
