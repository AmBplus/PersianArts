import React from 'react';
import {faDigits, faText} from '../../_fa';

const ink = '#25231f';
const muted = '#716d67';
const line = '#dfdbd3';

type Project = {title: string; summary: string; area: string; tags: [string, string]; owner: string; days: number; studies: number; trials: number};

const projects: Project[] = [
  {title: 'مسیریاب خودترمیمِ خطاهای CI', summary: 'بررسی ساخت‌های ناپایدار را با سیاست‌های آگاه از خطا میان عامل‌ها تقسیم می‌کند.', area: 'عامل‌ها و ابزار توسعه', tags: ['عامل‌ها', 'CI'], owner: 'یوکی', days: 30, studies: 1, trials: 1},
  {title: 'بازیابی با تکیه بر تصویر صفحه', summary: 'برای دستیار رفع اشکال، کد و تصویر صفحه را کنار هم بازیابی می‌کند.', area: 'عامل‌ها و ابزار توسعه', tags: ['چندوجهی', 'بازیابی'], owner: 'پریا', days: 30, studies: 1, trials: 1},
  {title: 'یادگیری پیوسته روی دستگاه', summary: 'امکان یادگیری مدل بینایی و زبان از اصلاح کاربر را، بدون فراموشی، می‌سنجد.', area: 'مدل‌های بهینه', tags: ['روی دستگاه', 'یادگیری'], owner: 'لین', days: 3, studies: 2, trials: 15},
  {title: 'آبشار مدل با سنجش اطمینان', summary: 'درخواست را با حفظ دقت، از مدل کوچک به مدل بزرگ ارجاع می‌دهد.', area: 'مدل‌های بهینه', tags: ['اطمینان', 'مسیریابی'], owner: 'یوکی', days: 30, studies: 7, trials: 2},
  {title: 'کاوش مدل پایهٔ جدولی', summary: 'می‌سنجد مدل جدولی از نام ستون‌ها چه چیزی واقعاً یاد می‌گیرد.', area: 'مدل‌های بهینه', tags: ['دادهٔ جدولی', 'تفسیرپذیری'], owner: 'مارکو', days: 60, studies: 1, trials: 2},
  {title: 'هشدار زودهنگام رانش حسگر', summary: 'رانش کالیبراسیون حسگرهای صنعتی را با مدل‌های زمانی سبک پیش‌بینی می‌کند.', area: 'ادراک و حسگری', tags: ['سری زمانی', 'پیش‌بینی'], owner: 'لین', days: 2, studies: 3, trials: 14},
  {title: 'بازشناسی گفتار در گویش‌های گوناگون', summary: 'مدل گفتار را روی گویش‌های کم‌داده می‌سنجد و سازگاری آن را اندازه می‌گیرد.', area: 'ادراک و حسگری', tags: ['گفتار', 'ارزیابی'], owner: 'مارکو', days: 4, studies: 1, trials: 13},
  {title: 'بازشناسی پایدار در انبار', summary: 'بازشناسی افراد را هنگام تغییر پوشش فصلی و جابه‌جایی دوربین می‌آزماید.', area: 'ادراک و حسگری', tags: ['بازشناسی', 'پایداری'], owner: 'یوکی', days: 30, studies: 2, trials: 3},
  {title: 'آزمایشگاه پژوهش خودکار', summary: 'چرخه‌ای خودکار برای پیشنهاد، اجرای آزمایش و جمع‌بندی پژوهش بازسازی می‌کند.', area: 'زیرساخت پژوهش', tags: ['عامل‌ها', 'پژوهش'], owner: 'مارکو', days: 14, studies: 5, trials: 112},
  {title: 'میدان کدنویسی بلندمدت', summary: 'عامل‌های کدنویسی را روی کارهای یک‌هفته‌ای با توان پردازشی زنده می‌سنجد.', area: 'زیرساخت پژوهش', tags: ['عامل‌ها', 'بنچمارک'], owner: 'پریا', days: 30, studies: 5, trials: 7},
];

export const PersianCard: React.FC<{index: number; height: number}> = ({index, height}) => {
  const p = projects[index % projects.length];
  return <div style={{width: '100%', height: '100%', boxSizing: 'border-box', background: '#fffdfb', border: `1px solid ${line}`, borderRadius: 16, direction: 'rtl', fontFamily: 'Vazirmatn', color: ink, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden'}}>
    <div style={{...faText(11), color: '#89542f', lineHeight: 1.2, textAlign: 'right'}}>{p.days >= 30 ? `${faDigits(Math.round(p.days / 30))} ماه پیش` : `${faDigits(p.days)} روز پیش`}</div>
    <div style={{...faText(15), fontWeight: 700, lineHeight: 1.4, marginTop: 17, maxHeight: 42, overflow: 'hidden'}}>{p.title}</div>
    <div style={{...faText(12), color: muted, lineHeight: 1.55, marginTop: 5, height: 40, overflow: 'hidden'}}>{p.summary}</div>
    <div style={{display: 'grid', gridTemplateColumns: '60px 1fr', rowGap: 2, marginTop: 7, ...faText(10), lineHeight: 1.45}}>
      <span style={{color: muted}}>مسئول</span><span>{p.owner}</span>
      <span style={{color: muted}}>مشتری</span><span>ثبت نشده</span>
      <span style={{color: muted}}>حوزه</span><span>{p.area}</span>
    </div>
    <div style={{...faText(10), color: muted, marginTop: 10, whiteSpace: 'nowrap'}}>پرسش پژوهشی <strong style={{color: ink}}>{faDigits(p.studies)}</strong><span style={{marginInlineStart: 12}}>آزمایش <strong style={{color: ink}}>{faDigits(p.trials)}</strong></span><span style={{marginInlineStart: 12}}>مقاله <strong style={{color: ink}}>۰</strong></span></div>
    <div style={{position: 'absolute', insetInlineStart: 20, bottom: height === 288 ? 17 : 19, display: 'flex', gap: 6}}>{p.tags.map((tag) => <span key={tag} style={{...faText(10), border: `1px solid ${line}`, color: muted, borderRadius: 20, padding: '1px 8px', whiteSpace: 'nowrap'}}>{tag}</span>)}</div>
  </div>;
};

const section = (top: number, title: string, count: number) => <div key={top} style={{position: 'absolute', top, right: 408, width: 1104, height: 25, borderBottom: '1px solid #e6e1d9', display: 'flex', justifyContent: 'space-between', color: '#77736e', ...faText(12), lineHeight: 1.3}}><span>{title}</span><span>{faDigits(count)} پروژه</span></div>;

export const PersianPage: React.FC = () => <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1746, background: '#f9f6f1', direction: 'rtl', fontFamily: 'Vazirmatn', color: ink}}>
  <div style={{height: 61, borderBottom: '1px solid #e7e2db', display: 'flex', alignItems: 'center', padding: '0 408px', boxSizing: 'border-box', gap: 18, whiteSpace: 'nowrap'}}><span style={{fontSize: 17, fontWeight: 700}}>آزمایشگاه هوش مصنوعی</span><span style={{...faText(12), color: muted}}>هفته‌نامه</span><span style={{...faText(12), color: muted}}>مقاله‌ها</span></div>
  <div style={{position: 'absolute', top: 91, right: 408, width: 1104, display: 'flex', justifyContent: 'space-between', ...faText(12), color: muted}}><span>همهٔ پروژه‌ها</span><span>نمایش {faDigits(10)} / {faDigits(10)}</span></div>
  <div style={{position: 'absolute', top: 130, right: 408, width: 1016, height: 44, border: `1px solid ${line}`, borderRadius: 6, background: '#fffdfb', boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 15px', gap: 10, ...faText(12), color: '#a39e98'}}><span style={{fontSize: 19}}>⌕</span>جست‌وجوی نام، معرفی، مشتری یا برچسب پروژه</div>
  <div style={{position: 'absolute', top: 130, left: 408, width: 76, height: 44, border: `1px solid ${line}`, borderRadius: 6, background: '#fffdfb', boxSizing: 'border-box', display: 'grid', placeItems: 'center', ...faText(12)}}>فیلتر</div>
  {section(206, 'عامل‌ها و ابزار توسعه', 2)}
  {section(575, 'مدل‌های بهینه', 3)}
  {section(968, 'ادراک و حسگری', 3)}
  {section(1361, 'زیرساخت پژوهش', 2)}
</div>;
