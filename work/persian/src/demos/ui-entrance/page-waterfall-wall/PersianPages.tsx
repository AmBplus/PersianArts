import React from 'react';
import {faDigits, faText} from '../../_fa';

// Live Persian recreations of the twelve source texture slices. Their aspect ratios
// exactly match the upstream PNGs so VerticalTicker's measured periods do not move.
type Project = {
  title: string;
  description: string;
  owner: string;
  field: string;
  age: string;
  counts: [number, number, number];
  tags: [string, string];
  ratio: number;
  done?: boolean;
};

const projects: Record<string, Project> = {
  'card1.png': {title: 'مسیریاب خودترمیمِ خطاهای ساخت', description: 'بررسی خطاهای ناپایدار ساخت را بر پایهٔ نوع شکست میان دستیارها تقسیم می‌کند.', owner: 'یوکی', field: 'ابزارهای هوشمند', age: '۱ ماه پیش', counts: [1, 1, 0], tags: ['دستیار', 'ساخت نرم‌افزار'], ratio: 714 / 576},
  'card2.png': {title: 'دستیارهای بازیابی مبتنی بر تصویر', description: 'بازیابی اطلاعات از کد و تصویر صفحه برای رفع اشکال دقیق‌تر.', owner: 'پریا', field: 'ابزارهای هوشمند', age: '۱ ماه پیش', counts: [1, 1, 0], tags: ['چندرسانه‌ای', 'بازیابی'], ratio: 716 / 576},
  'card3.png': {title: 'تنظیم پیوسته روی دستگاه', description: 'یادگیری مدل سبک بینایی و زبان از اصلاح‌های کاربر، بدون فراموشی.', owner: 'لین', field: 'مدل‌های کارآمد', age: '۳ روز پیش', counts: [2, 15, 0], tags: ['یادگیری پیوسته', 'پردازش محلی'], ratio: 714 / 624},
  'card4.png': {title: 'زنجیرهٔ مدل‌ها بر پایهٔ اطمینان', description: 'مدل‌های کوچک می‌آموزند چه زمانی کار را به مدل بزرگ‌تر بسپارند.', owner: 'یوکی', field: 'مدل‌های کارآمد', age: '۱ ماه پیش', counts: [7, 2, 0], tags: ['تنظیم', 'مسیریابی'], ratio: 716 / 624},
  'card5.png': {title: 'کاوش مدل‌های داده‌ای', description: 'بررسی توان مدل‌های پایه در فهم جدول‌ها و داده‌های ساخت‌یافته.', owner: 'مارکو', field: 'مدل‌های کارآمد', age: '۲ ماه پیش', counts: [1, 2, 0], tags: ['داده', 'سازگاری'], ratio: 714 / 624, done: true},
  'card6.png': {title: 'هشدار زودهنگام حسگرها', description: 'پیش‌بینی تغییر رفتار حسگرها پیش از آن‌که کیفیت داده افت کند.', owner: 'لین', field: 'بینایی و حسگرها', age: '۲ روز پیش', counts: [3, 14, 0], tags: ['سری زمانی', 'پیش‌بینی'], ratio: 714 / 624},
  'card7.png': {title: 'بازشناسی گفتار چندلهجه‌ای', description: 'مقایسهٔ مدل‌های گفتار در لهجه‌ها و شرایط صوتی گوناگون.', owner: 'مارکو', field: 'بینایی و حسگرها', age: '۴ روز پیش', counts: [2, 13, 0], tags: ['گفتار', 'ارزیابی'], ratio: 716 / 624},
  'card8.png': {title: 'بازشناسی پایدار افراد در انبار', description: 'آزمون مدل‌های بازشناسی با تغییر نور فصل و جابه‌جایی دوربین.', owner: 'یوکی', field: 'بینایی و حسگرها', age: '۱ ماه پیش', counts: [2, 3, 0], tags: ['بازشناسی', 'پایداری'], ratio: 714 / 624},
  'card9.png': {title: 'آزمایشگاه پژوهش خودکار', description: 'چرخه‌ای پیوسته برای طرح فرضیه، اجرای آزمایش و جمع‌بندی نتیجه‌ها.', owner: 'مارکو', field: 'زیرساخت پژوهش', age: '۱۴ روز پیش', counts: [5, 112, 0], tags: ['پژوهش', 'خودکارسازی'], ratio: 714 / 624},
  'card10.png': {title: 'محیط سنجش کدنویسی', description: 'ارزیابی دستیارهای برنامه‌نویسی روی کارهای واقعی و بلندمدت.', owner: 'پریا', field: 'زیرساخت پژوهش', age: '۱ ماه پیش', counts: [1, 7, 0], tags: ['برنامه‌نویسی', 'ارزیابی'], ratio: 716 / 624},
};

const ui = {color: '#272724', background: '#faf8f5', border: '1px solid #e8e4df'} as const;

const Card: React.FC<{project: Project}> = ({project}) => (
  <div style={{...ui, aspectRatio: String(project.ratio), boxSizing: 'border-box', padding: '25px 32px 19px', direction: 'rtl', textAlign: 'right', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 28, color: '#77736e', ...faText(10)}}>
      {project.done ? <span style={{background: '#e1f3e9', color: '#48866b', borderRadius: 12, padding: '2px 8px'}}>تکمیل‌شده</span> : <span />}
      <span>{project.age}</span>
    </div>
    <div style={{...faText(19, {lineHeight: 1.35, fontWeight: 700}), marginTop: 18}}>{project.title}</div>
    <div style={{...faText(14, {lineHeight: 1.55}), color: '#77736e', marginTop: 12, minHeight: 88}}>{project.description}</div>
    <div style={{display: 'grid', gridTemplateColumns: '65px 1fr', rowGap: 3, ...faText(12, {lineHeight: 1.45}), marginTop: 16}}>
      <span style={{color: '#9a958e'}}>مسئول</span><span>{project.owner}</span>
      <span style={{color: '#9a958e'}}>مشتری</span><span>ثبت‌نشده</span>
      <span style={{color: '#9a958e'}}>حوزه</span><span>{project.field}</span>
    </div>
    <div style={{...faText(11), display: 'flex', gap: 14, marginTop: 29, color: '#77736e', whiteSpace: 'nowrap'}}>
      <span>پرسش <b style={{color: '#2d2b28'}}>{faDigits(project.counts[0])}</b></span>
      <span>آزمایش <b style={{color: '#2d2b28'}}>{faDigits(project.counts[1])}</b></span>
      <span>مقاله <b style={{color: '#2d2b28'}}>{faDigits(project.counts[2])}</b></span>
    </div>
    <div style={{display: 'flex', gap: 7, marginTop: 16, flexWrap: 'wrap'}}>
      {project.tags.map(tag => <span key={tag} style={{...faText(10, {lineHeight: 1.3}), border: '1px solid #e3dfda', color: '#827d76', borderRadius: 12, padding: '3px 9px'}}>{tag}</span>)}
    </div>
  </div>
);

const SearchIcon: React.FC = () => <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{flexShrink: 0}}><circle cx="8.3" cy="8.3" r="5.6" stroke="currentColor" strokeWidth="2"/><path d="m12.6 12.6 4.8 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;

const SearchSlice: React.FC = () => (
  <div style={{...ui, aspectRatio: String(2032 / 88), boxSizing: 'border-box', direction: 'rtl', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: '#88837e'}}>
    <SearchIcon/><span style={{...faText(10), whiteSpace: 'nowrap'}}>جست‌وجو در پروژه‌ها، مشتریان و برچسب‌ها</span>
  </div>
);

const ProjectIndex: React.FC = () => (
  <div style={{...ui, aspectRatio: String(3840 / 3492), boxSizing: 'border-box', direction: 'rtl', overflow: 'hidden', ...faText(9, {lineHeight: 1.4})}}>
    <div style={{height: 35, borderBottom: '1px solid #e9e4dd', display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px'}}>
      <b style={{fontSize: 12}}>آزمایشگاه هوش</b><span style={{color: '#88837e'}}>گزارش‌ها</span><span style={{color: '#88837e'}}>پژوهش‌ها</span>
    </div>
    <div style={{margin: '20px 50px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#77736e'}}><span>همهٔ پروژه‌ها</span><span>نمایش {faDigits(10)} از {faDigits(10)}</span></div>
      <div style={{border: '1px solid #e5e0da', borderRadius: 5, height: 28, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginTop: 8, color: '#9b9690'}}><SearchIcon/>جست‌وجوی نام، توضیح یا برچسب</div>
      {[['ابزارهای هوشمند', 2], ['مدل‌های کارآمد', 3], ['بینایی و حسگرها', 3], ['زیرساخت پژوهش', 2]].map(([label, count], i) => (
        <div key={String(label)} style={{marginTop: i === 0 ? 20 : 94, borderBottom: '1px solid #e8e4df', paddingBottom: 6, display: 'flex', justifyContent: 'space-between', color: '#77736e'}}><b>{label}</b><span>{faDigits(Number(count))} پروژه</span></div>
      ))}
    </div>
  </div>
);

export const PersianPage: React.FC<{file: string}> = ({file}) => {
  if (file === 'projects-empty.png') return <ProjectIndex/>;
  if (file === 'float-search.png') return <SearchSlice/>;
  return <Card project={projects[file]}/>;
};
