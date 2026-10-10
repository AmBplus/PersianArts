// PERSIAN (RTL) localization of shotcraft "ai-stream-response" — motion/timing untouched, text + direction + font adapted.
// RTL changes (see docs/PERSIAN-RENDER-CONTRACT.md: only on-screen text is replaced, motion keeps fidelity):
//  - Whole panel is direction:rtl: header logo sits at the right, status chip is pushed to the left; every evidence row
//    mirrors (spinner/check at the right edge, count at the left edge).
//  - marginLeft -> marginInlineStart (physical -> logical), so the mirrored header keeps its gaps.
//  - Summary reveal sweeps right->left (reading direction): clipPath inset moved from the right edge to the left edge.
//  - letterSpacing / uppercase removed (they break Persian joining). Font: Vazirmatn (neutral UI sans = Inter's role), sizes x1.1.
//  - The backplate JPG has baked-in English UI text ("Ask Linear…"): blur raised 1px -> 18px so no Latin text stays legible
//    (raster assets with text can't be translated; they are blurred or replaced).
//  - Digits are Persian; the "A" logo glyph becomes the Persian initial "ا".
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import backplate from './agent-stream.jpg';
import {FaRoot, fs, faDigits, faText, revealFromStart, FA_LH} from '../../_fa';

const ROW_CUES = [42, 53, 63, 72, 80, 87, 93];
const ROWS = [
  ['نمایه‌سازی فضای کاری', `${faDigits(128)} فایل`],
  ['نقشه‌برداری از جریان احراز هویت', `${faDigits(12)} ماژول`],
  ['بررسی ردپای خطاهای اخیر', 'بدون مانع'],
  ['تطبیق قراردادهای API با هندلرها', `${faDigits(24)} مسیر`],
  ['تأیید مرزهای دسترسی', `${faDigits(6)} نقش`],
  ['مقایسهٔ یادداشت‌های انتشار', `${faDigits(3)} تغییر`],
  ['تهیهٔ برنامهٔ پیاده‌سازی', 'آماده'],
] as const;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.2, 0.75, 0.25, 1);

const CheckIcon: React.FC<{progress: number}> = ({progress}) => {
  const ringOpacity = interpolate(progress, [0, 0.45, 0.75], [0.36, 1, 0], clamp);
  const checkOpacity = interpolate(progress, [0.62, 1], [0, 1], clamp);
  const checkScale = interpolate(progress, [0.62, 1], [0.72, 1], {...clamp, easing: ease});

  return (
    <div style={{position: 'relative', width: 27, height: 27, flex: '0 0 auto'}}>
      <div
        style={{
          position: 'absolute', inset: 2, borderRadius: 99,
          border: '2px solid rgba(183, 190, 199, .6)',
          borderTopColor: '#d4ff77', opacity: ringOpacity,
          transform: `rotate(${progress * 100}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 1, borderRadius: 99,
          background: '#b8f36a', opacity: checkOpacity,
          transform: `scale(${checkScale})`,
          display: 'grid', placeItems: 'center',
          boxShadow: '0 0 16px rgba(184,243,106,.18)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3.4 8.3 6.6 11l6-6" stroke="#15200d" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

const EvidenceRow: React.FC<{cue: number; title: string; meta: string; index: number}> = ({cue, title, meta, index}) => {
  const frame = useCurrentFrame();
  const body = interpolate(frame, [cue, cue + 12], [0, 1], {...clamp, easing: ease});
  const status = interpolate(frame, [cue + 3, cue + 11], [0, 1], {...clamp, easing: ease});
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: index * 68,
        height: 58, borderRadius: 13,
        border: '1px solid rgba(255,255,255,.065)',
        background: 'rgba(255,255,255,.025)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 15,
        opacity: body,
        transform: `translateY(${18 * (1 - body)}px)`,
        filter: `blur(${6 * (1 - body)}px)`,
      }}
    >
      <CheckIcon progress={status}/>
      <div style={{...faText(21), color: '#e8eaed', flex: 1}}>{title}</div>
      <div style={{...faText(16), color: status > 0.78 ? '#a9c77f' : '#777f89', fontVariantNumeric: 'tabular-nums'}}>{meta}</div>
    </div>
  );
};

export const StreamResponse: React.FC = () => {
  const frame = useCurrentFrame();
  const panelIn = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease});
  const summary = interpolate(frame, [18, 30], [0, 1], {...clamp, easing: ease});
  const camera = interpolate(frame, [0, 100], [1.04, 1], {...clamp, easing: ease});
  const pulse = interpolate(frame, [110, 115, 120], [0.25, 0.55, 0.25], clamp);
  const complete = interpolate(frame, [110, 120], [0, 1], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{background: '#07090a', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${camera})`}}>
        <Img src={backplate} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.58) saturate(.76) blur(18px)', opacity: .7}}/>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 44%, rgba(6,9,10,.08) 10%, rgba(4,6,7,.72) 92%)'}}/>
      </AbsoluteFill>

      <FaRoot family="Vazirmatn">
      <div
        style={{
          position: 'absolute', left: 344, top: 72, width: 1232, height: 936,
          borderRadius: 29, overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(25,29,32,.985), rgba(12,15,17,.99))',
          border: `1px solid rgba(184,243,106,${pulse})`,
          boxShadow: '0 46px 100px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.06)',
          opacity: panelIn,
          transform: `translateY(${12 * (1 - panelIn)}px) scale(${.985 + .015 * panelIn})`,
        }}
      >
        <div style={{height: 76, display: 'flex', alignItems: 'center', padding: '0 34px', borderBottom: '1px solid rgba(255,255,255,.065)'}}>
          <div style={{width: 29, height: 29, borderRadius: 9, background: '#e9edf0', color: '#15191b', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: fs(17)}}>ا</div>
          <div style={{...faText(22), marginInlineStart: 13, fontWeight: 600, color: '#f1f3f4'}}>از اطلس بپرس</div>
          <div style={{...faText(15), marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 9, color: '#7d858e'}}>
            <span style={{width: 7, height: 7, background: '#b8f36a', borderRadius: 99}}/> عامل فضای کاری
          </div>
        </div>

        <div style={{padding: '28px 38px 34px'}}>
          <div style={{...faText(18), height: 48, borderRadius: 12, background: 'rgba(255,255,255,.048)', display: 'flex', alignItems: 'center', padding: '0 18px', color: '#b9bec4'}}>
            این کدبیس را بررسی کن و امن‌ترین مسیر پیاده‌سازی را مشخص کن
          </div>

          <div style={{height: 119, marginTop: 21, borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0, opacity: summary, transform: `translateY(${10 * (1 - summary)}px)`, clipPath: revealFromStart(summary)}}>
              <div style={{...faText(15), color: '#838b94', marginBottom: 10}}>خلاصهٔ نتیجه</div>
              <div style={{...faText(26), color: '#f3f4f5', fontWeight: 520, lineHeight: FA_LH}}>
                کدبیس آمادهٔ یک پیاده‌سازی متمرکز و کم‌ریسک است.
              </div>
            </div>
          </div>

          <div style={{position: 'relative', height: 466, marginTop: 17}}>
            {ROWS.map(([title, meta], index) => <EvidenceRow key={title} cue={ROW_CUES[index]} title={title} meta={meta} index={index}/>)}
          </div>

          <div style={{height: 60, marginTop: 2, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'flex-end'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 11, opacity: complete, transform: `translateY(${5 * (1 - complete)}px)`}}>
              <div style={{width: 24, height: 24, borderRadius: 99, background: '#b8f36a', display: 'grid', placeItems: 'center'}}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.4 8.3 6.6 11l6-6" stroke="#15200d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span style={{...faText(17), color: '#dce7d0', fontWeight: 600}}>تحلیل کامل شد</span>
              <span style={{...faText(15), color: '#69717a'}}>{faDigits(7)} بررسی تمام شد · آمادهٔ ساخت</span>
            </div>
          </div>
        </div>
      </div>
      </FaRoot>
    </AbsoluteFill>
  );
};
