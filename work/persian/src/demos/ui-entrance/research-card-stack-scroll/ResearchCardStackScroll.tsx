// Persian localization of research-card-stack-scroll.
// Text: all 13 paper titles and author/preprint metadata are natural Persian UI copy; the synthetic preprint IDs remain
// synthetic but use Persian digits. There are no raster assets or baked-in text.
// RTL decisions: card reading order is right aligned; the orange accent rail moves from the left edge to the right edge.
// The stack's slight horizontal drift is mirrored (rightward source drift becomes leftward), while the vertical drift,
// grid motion, 12-frame cadence, 6-frame entry, squash, blur, brightness, opacity, deterministic skeleton widths and all
// timing constants remain unchanged. Stack is centered, so the mirrored x-axis keeps its balance.
// Font: Vazirmatn variable, a neutral research/product UI sans with reliable Persian shaping and weights.
import React from 'react';
import { DesignStage, E, lerp, rand, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faDigits, faText } from '../../_fa';

export const RESEARCH_CARD_STACK_SCROLL_DURATION = 144; // 4800ms @30fps

const ORANGE = '#FF6A1F';
const ORANGE_SOFT = '#FF8A44';
const INK = '#1A1A1A';
const FONT = 'Vazirmatn, sans-serif';
const W = 480;
const H = 270;
const F = 144;
const PER = 12;
const GAP = 30;
const XOFF = 9;
const LW = 420;
const LH = 250;
const S = Math.min(W / LW, H / LH);

const TITLES = [
  'سازوکارهای توجه کم‌تراکم برای استدلال با متن‌های بلند',
  'انحراف بازیابی در زنجیره‌های چندمرحله‌ای عامل‌ها',
  'ذخیره‌سازی نهفته، تأخیر فراخوانی ابزار را ۴۱٪ کم می‌کند',
  'دربارهٔ کالیبراسیون مدل‌های پاداش ترجیحی',
  'پیش‌فرض‌های حرکتی هم‌تراز با گرید برای پویانمایی رابط',
  'راستی‌آزماهای ارزان از نمونه‌گیرهای پرهزینه بهترند',
  'رمزگشایی ساختاریافته بدون از دست‌رفتن دستور زبان',
  'ترکیب لایه‌ها بر پایهٔ عمق برای رابط‌های زنده',
  'مسیردهی بودجهٔ توکن میان گروهی از عامل‌ها',
  'چیدمان‌های تقابلی برای درک سند',
  'بازرتبه‌بندی سریع و تقریبی هنگام جست‌وجو',
  'انتقال سیگنال در عامل‌های باقیماندهٔ عمیق',
  'یادداشتی دربارهٔ بازپخش قطعی حرکت',
];
const CW = 296;
const CH = 96;

export const ResearchCardStackScroll: React.FC = () => {
  const t = useT();
  const f = t * F;
  const focus = Math.floor(f / PER);
  return (
    <FaRoot family="Vazirmatn">
      <DesignStage bg="#FAFAFA">
        <div style={{ position: 'absolute', inset: -40, backgroundImage: 'linear-gradient(rgba(0,0,0,.055) 1px,transparent 1px)', backgroundSize: '100% 24px', transform: `translateY(${((f / PER) * GAP * S) % 24}px)` }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformOrigin: '0 0', transform: `scale(${S})` }}>
          {TITLES.map((tt, i) => {
            const e = f - i * PER;
            const p = seg(Math.max(0, Math.min(1, (e + 6) / 6)), 0, 1, E.outCubic);
            const drift = (Math.max(0, e) / PER) * GAP;
            const squash = e >= 0 && e < 1.6 ? 0.97 : 1;
            const y = lerp(p, -40, 0) + drift;
            const x = (Math.max(0, e) / PER) * XOFF;
            const depth = Math.min(1, drift / (GAP * 3));
            const opacity = e < -6 ? 0 : Math.min(1, (e + 6) / 2) * (1 - Math.max(0, (drift - GAP * 3.2) / (GAP * 1.6)));
            return (
              <div key={i} style={{ position: 'absolute', left: -CW / 2, top: -CH / 2 - 14, width: CW, height: CH, background: INK, borderRadius: 11, overflow: 'hidden', fontFamily: FONT, direction: 'rtl', zIndex: i, opacity, boxShadow: '0 14px 34px rgba(0,0,0,.22)', border: '1px solid #2A2A2A', boxSizing: 'border-box', transform: `translate(${-x}px,${y}px) scale(${lerp(p, 0.94, 1)},${lerp(p, 0.94, 1) * squash})`, filter: `blur(${(depth * 4).toFixed(2)}px) brightness(${(1 - depth * 0.25).toFixed(3)})` }}>
                <div style={{ position: 'absolute', right: 0, top: 0, width: 3, height: '100%', background: i % 4 === 1 ? ORANGE : '#2E2E2E' }} />
                <div style={{ position: 'absolute', right: 14, top: 8, width: 264, ...faText(9.5, { fontWeight: 650, lineHeight: 1.35, color: '#F0F0F0' }) }}>{tt}</div>
                <div style={{ position: 'absolute', right: 14, top: 43, width: 266, opacity: i === focus ? 1 : 0 }}>
                  <div style={{ ...faText(8, { fontWeight: 500, lineHeight: 1.2, color: ORANGE_SOFT, whiteSpace: 'nowrap' }) }}>
                    {`الف. نویسنده، ب. پژوهشگر، ج. خواننده · پیش‌چاپ: ${faDigits(`24${10 + i}.0${i % 9}${i % 7}`)}`}
                  </div>
                  {[0, 1, 2, 3].map((k) => <div key={k} style={{ marginTop: k ? 5 : 9, marginRight: 0, marginLeft: 'auto', width: `${100 - k * 11 - rand(i * 5 + k) * 12}%`, height: 4, borderRadius: 2, background: '#3A3A3A' }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </DesignStage>
    </FaRoot>
  );
};
