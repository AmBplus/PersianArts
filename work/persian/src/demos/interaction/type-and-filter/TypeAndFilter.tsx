// Persian RTL reconstruction of the type-and-filter shot.
// Text: the baked English/Chinese page and card rasters are covered by an opaque paper layer;
// every visible header, section, control, card title, description and metadata is rebuilt in Persian.
// Direction: the search icon and caret, filter button, header/nav, section labels/counts and card
// positions follow RTL reading order. Mirroring each card's x already makes source index order
// right-to-left within a row, so the 0.4f departure rank stays in source order. The target slides
// to the mirrored real first-row slot; click point and camera destination mirror with it.
// Vertical sinking/lift, scale, shadow, concentric ripples, zoom, easing and frame cues stay physical.
// Font: Vazirmatn is a legible neutral product face matching the source UI; FaRoot loads it.
// Typing uses a shaped prefix each step. The invisible ZWNJ is inserted with «ل» so each beat
// adds a visible letter. Six visible letters span frames 10–31, preserving the pause to frame 42.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {PageCam2D, CamKey2D} from '../../_fixtures/PageCam2D';
import layout from '../../_textures/live-layout.json';
import {FaRoot, faText, faDigits, typeOn} from '../../_fa';

export const TYPE_AND_FILTER_DURATION = 73;
const cards = layout.projects.cards;
const PAPER = '#f9f6f1';
const FIELD = '#fefcf9';
const AMBER = 'oklch(58% 0.13 65)';
const QUERY = 'نانو‌لب';
const TYPE_START = 10;
const TYPE_END = 31;
const FILTER_START = 42;
const mirrorX = (x: number, width: number) => 1920 - x - width;
const CARD_W = cards[0].w;
const SEARCH = {x: mirrorX(408, 1016), y: 130, w: 1016, h: 44};
const nanoIdx = cards.findIndex((c) => c.title.includes('nano-lab'));
const nano = cards[nanoIdx];
const NANO_TO = {x: mirrorX(408, nano.w), y: 247};
const CLICK_C = {x: mirrorX(586, 0), y: 391};
const CAM_KEYS: CamKey2D[] = [
  {frame: 0, cx: 960, cy: 380, zoom: 0.9},
  {frame: 56, cx: 960, cy: 380, zoom: 0.9},
  {frame: 72, cx: CLICK_C.x, cy: CLICK_C.y, zoom: 2.2},
];

const content = [
  {title: 'مسیریاب هوشمند خطاهای ساخت', desc: 'بررسی خطاهای ساخت و ارجاع خودکار هر مورد به عامل مناسب.', area: 'عامل‌ها و ابزار توسعه', tags: ['عامل‌ها', 'یکپارچه‌سازی'], age: '۱ ماه پیش'},
  {title: 'بازیابی مبتنی بر تصویر صفحه', desc: 'یافتن راه‌حل با کنار هم گذاشتن کد و تصویر خطا.', area: 'عامل‌ها و ابزار توسعه', tags: ['چندرسانه‌ای', 'بازیابی'], age: '۱ ماه پیش'},
  {title: 'یادگیری پیوسته روی دستگاه', desc: 'سنجش توان مدل کوچک برای یادگیری از اصلاح‌های کاربر.', area: 'مدل‌های بهینه', tags: ['لبه', 'یادگیری'], age: '۳ روز پیش'},
  {title: 'آبشار مدل با سنجش اطمینان', desc: 'سپردن پرسش‌ها به مدل مناسب بر پایهٔ میزان اطمینان.', area: 'مدل‌های بهینه', tags: ['کالیبراسیون', 'مسیریابی'], age: '۱ ماه پیش'},
  {title: 'کاوش مدل‌های پایهٔ جدولی', desc: 'بررسی یادگیری بی‌نمونه از سرستون‌های داده.', area: 'مدل‌های بهینه', tags: ['دادهٔ جدولی', 'تفسیرپذیری'], age: '۲ ماه پیش'},
  {title: 'هشدار زودهنگام رانش حسگر', desc: 'شناسایی تغییر الگوی حسگر پیش از افت عملکرد.', area: 'ادراک و حسگری', tags: ['حسگر', 'پایش'], age: '۲ هفته پیش'},
  {title: 'بازشناسی گفتار در گویش‌ها', desc: 'افزایش دقت گفتار فارسی در گویش‌های گوناگون.', area: 'ادراک و حسگری', tags: ['گفتار', 'گویش'], age: '۳ هفته پیش'},
  {title: 'بازشناسایی پایدار در انبار', desc: 'ردیابی اشیا در تصویرهای دشوار محیط انبار.', area: 'ادراک و حسگری', tags: ['بینایی', 'ردیابی'], age: '۱ ماه پیش'},
  {title: 'نانو‌لب: چرخهٔ پژوهش خودکار', desc: 'چرخه‌ای خودکار که آزمایش‌های آموزش مدل را پیشنهاد می‌کند، اجرا می‌کند و نتیجه را جمع‌بندی می‌کند.', area: 'زیرساخت پژوهش', tags: ['عامل‌ها', 'یادگیری ماشین'], age: '۱۴ روز پیش'},
  {title: 'محیط سنجش کدنویسی بلندمدت', desc: 'ارزیابی عامل‌های کدنویسی در کارهای چندمرحله‌ای.', area: 'زیرساخت پژوهش', tags: ['کدنویسی', 'ارزیابی'], age: '۱ ماه پیش'},
] as const;

const sectionNames = ['عامل‌ها و ابزار توسعه', 'مدل‌های بهینه', 'ادراک و حسگری', 'زیرساخت پژوهش'];
const sectionCounts = [2, 3, 3, 2];
const firstRank = (i: number) => i > nanoIdx ? i - 1 : i;

const ProjectCard: React.FC<{index: number}> = ({index}) => {
  const item = content[index];
  const h = cards[index].h;
  return <div style={{width: '100%', height: '100%', boxSizing: 'border-box', border: '1px solid #e8e3dc', borderRadius: 16,
    background: FIELD, padding: '20px 21px', color: '#262521', overflow: 'hidden', direction: 'rtl'}}>
    <div style={{...faText(11), textAlign: 'left', color: '#a8835e', height: 24}}>{item.age}</div>
    <div style={{...faText(17), fontWeight: 700, lineHeight: 1.35, height: 33, overflow: 'hidden'}}>{item.title}</div>
    <div style={{...faText(13), lineHeight: 1.55, color: '#77736e', height: h > 290 ? 65 : 53, overflow: 'hidden'}}>{item.desc}</div>
    <div style={{display: 'grid', gridTemplateColumns: '54px 1fr', columnGap: 14, rowGap: 2, marginTop: 8, ...faText(11), lineHeight: 1.35}}>
      <span style={{color: '#9a958f'}}>مسئول</span><span>مارکو</span>
      <span style={{color: '#9a958f'}}>مشتری</span><span>ثبت نشده</span>
      <span style={{color: '#9a958f'}}>حوزه</span><span>{item.area}</span>
    </div>
    <div style={{...faText(11), color: '#756f68', marginTop: 11}}>پرسش {faDigits(index === nanoIdx ? 5 : 2)}　 آزمایش {faDigits(index === nanoIdx ? 112 : 1)}　 مقاله ۰</div>
    <div style={{display: 'flex', gap: 6, marginTop: 10}}>{item.tags.map((tag) => <span key={tag} style={{...faText(10), color: '#858079', border: '1px solid #e6e0d8', borderRadius: 12, padding: '1px 7px', whiteSpace: 'nowrap'}}>{tag}</span>)}</div>
  </div>;
};

export const TypeAndFilter: React.FC = () => {
  const frame = useCurrentFrame();
  const visibleCount = frame < TYPE_START ? 0 : Math.min(6, 1 + Math.floor((frame - TYPE_START) * 5 / (TYPE_END - TYPE_START)));
  const typedCount = visibleCount + (visibleCount >= 5 ? 1 : 0); // ZWNJ has no visual beat
  const typed = typeOn(QUERY, typedCount / [...QUERY].length);
  const caretOn = frame >= TYPE_START - 2 && frame <= 67 &&
    (frame <= TYPE_END + 3 || Math.floor((frame - (TYPE_END + 3)) / 8) % 2 === 0);

  return <AbsoluteFill style={{backgroundColor: PAPER}}><FaRoot family="Vazirmatn">
    <PageCam2D src="textures/live/projects-empty.png" pageH={layout.projects.pageH} keys={CAM_KEYS}>
      {/* Opaque local page hides all baked foreign text while retaining the source camera geometry. */}
      <div style={{position: 'absolute', inset: 0, background: PAPER}} />
      <div style={{position: 'absolute', top: 0, left: 0, width: 1920, height: 61, background: '#fdfbf8', borderBottom: '1px solid #e6e0d8'}}>
        <div style={{position: 'absolute', right: 408, top: 13, display: 'flex', alignItems: 'baseline', gap: 18}}>
          <span style={{...faText(21), fontWeight: 750, color: '#272521'}}>آزمایشگاه هوش مصنوعی</span>
          <span style={{...faText(13), color: '#5f5b56'}}>گزارش‌ها</span><span style={{...faText(13), color: '#5f5b56'}}>مقاله‌ها</span>
        </div>
      </div>
      <div style={{position: 'absolute', right: 408, top: 93, ...faText(13), color: '#58534e'}}>همهٔ پروژه‌ها</div>
      <div style={{position: 'absolute', left: 408, top: 93, ...faText(12), color: '#88817a'}}>نمایش {faDigits(10)} / {faDigits(10)}</div>
      <div style={{position: 'absolute', left: 408, top: 117, width: 1104, borderTop: '1px solid #e2dcd4'}} />
      <div style={{position: 'absolute', left: SEARCH.x, top: SEARCH.y, width: SEARCH.w, height: SEARCH.h, border: '1px solid #ded8d0', borderRadius: 6, background: FIELD, boxSizing: 'border-box', display: 'flex', alignItems: 'center', paddingInline: 14, gap: 12, direction: 'rtl'}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink: 0, color: '#746d65'}}><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7"/><path d="m15 15 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
        <span style={{...faText(15), color: '#302d29', whiteSpace: 'nowrap'}}>{typed}</span>
        {caretOn && <span style={{width: 2, height: 20, background: AMBER, marginInlineStart: -9, flexShrink: 0}} />}
      </div>
      <div style={{position: 'absolute', left: 408, top: 130, width: 76, height: 44, background: FIELD, border: '1px solid #e4ddd5', borderRadius: 6, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, ...faText(12), color: '#5f5a54'}}><span>☷</span> فیلتر</div>
      {layout.projects.sections.slice(1).map((section, j) => <React.Fragment key={section.text}>
        <div style={{position: 'absolute', right: 408, top: section.y, ...faText(12), color: '#57534d'}}>{sectionNames[j]}</div>
        <div style={{position: 'absolute', left: 408, top: section.y, ...faText(11), color: '#89827b'}}>{faDigits(sectionCounts[j])} پروژه</div>
        <div style={{position: 'absolute', left: 408, top: section.y + 20, width: 1104, borderTop: '1px solid #e6e0d8'}} />
      </React.Fragment>)}
      {cards.map((c, i) => {
        if (i === nanoIdx) return null;
        const outCue = FILTER_START + firstRank(i) * 0.4;
        if (frame >= outCue + 5) return null;
        const outT = interpolate(frame, [outCue, outCue + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
        return <div key={i} style={{position: 'absolute', left: mirrorX(c.x, c.w), top: c.y, width: c.w, height: c.h,
          transform: `translate3d(0px, ${8 * outT}px, 0px)`, opacity: 1 - outT, borderRadius: 16,
          boxShadow: '0 2px 6px rgba(60,45,30,.08)'}}><ProjectCard index={i}/></div>;
      })}
      {(() => {
        const slideT = interpolate(frame, [FILTER_START, FILTER_START + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0.2, 1)});
        const float = Math.sin(slideT * Math.PI);
        return <div style={{position: 'absolute', left: mirrorX(nano.x, nano.w), top: nano.y, width: nano.w, height: nano.h,
          transform: `translate3d(${(NANO_TO.x - mirrorX(nano.x, nano.w)) * slideT}px, ${(NANO_TO.y - nano.y) * slideT}px, ${18 * float}px) scale(${1 + 0.02 * float})`,
          transformOrigin: 'center center', boxShadow: `0 ${2 + 14 * float}px ${6 + 26 * float}px rgba(60,45,30,${0.08 + 0.1 * float})`, borderRadius: 16, zIndex: 2}}><ProjectCard index={nanoIdx}/></div>;
      })()}
      {[0, 1].map((r) => {
        const start = 58 + r * 3;
        if (frame < start || frame > start + 10) return null;
        const t = interpolate(frame, [start, start + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        const rad = interpolate(t, [0, 1], [14, r === 0 ? 54 : 78]);
        return <div key={r} style={{position: 'absolute', left: CLICK_C.x - rad, top: CLICK_C.y - rad, width: rad * 2, height: rad * 2,
          borderRadius: '50%', border: `2px solid ${AMBER}`, opacity: 1 - t, pointerEvents: 'none', zIndex: 5}} />;
      })}
      {frame >= 60 && <div style={{position: 'absolute', left: NANO_TO.x - 6, top: NANO_TO.y - 6, width: CARD_W + 12, height: nano.h + 12,
        borderRadius: 16, border: `3px solid ${AMBER}`, boxShadow: '0 0 40px rgba(180,120,50,0.5)',
        opacity: interpolate(frame, [60, 63], [0.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), pointerEvents: 'none', zIndex: 4}} />}
    </PageCam2D>
  </FaRoot></AbsoluteFill>;
};
