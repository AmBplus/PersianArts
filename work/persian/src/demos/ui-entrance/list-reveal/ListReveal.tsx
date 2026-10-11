// PERSIAN (RTL) localization of shotcraft "list-reveal" — timing, easing, scale, opacity and vertical motion are unchanged.
// Text: Dashboard/Projects/Analytics/Messages/Settings/Sign out become natural Persian navigation labels.
// RTL decisions: this is a navigation list, so the marker moves from the physical left to the right by placing the list in
// direction:rtl; the label follows it toward the left, preserving Persian reading order. Vertical entrance and the independent
// upward 32px container drift are physical/universal here, so both remain unchanged. The colour swatches, their hue order,
// gradient angle and centred composition are non-reading-direction decoration and remain unchanged.
// Font: Vazirmatn (500), a compact neutral product-UI face that fills Inter's role while retaining clear joined Persian glyphs.
// Vertical padding is 8px (source 9px) to compensate for the enlarged Persian font and 1.25 line box, keeping row heights
// close to the source. No raster assets. Labels retain all six original stagger windows and the full hold.
import React from 'react';
import { DesignStage, E, lerp, seg, useT } from '../../_fixtures/Motion';
import { FaRoot, faText } from '../../_fa';

export const LIST_REVEAL_DURATION = 108; // 3600ms @30fps

const LABELS = ['پیش‌خوان', 'پروژه‌ها', 'تحلیل‌ها', 'پیام‌ها', 'تنظیمات', 'خروج از حساب'];
const HUES = [225, 250, 275, 300, 210, 340];

export const ListReveal: React.FC = () => {
  const t = useT();
  return (
    <DesignStage bg="#0a0b10">
      <FaRoot family="Vazirmatn">
        <div style={{position: 'absolute', inset: 0, background: '#0a0b10', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{position: 'relative', width: 240, display: 'flex', flexDirection: 'column', gap: 9, transform: `translateY(${lerp(t, 16, -16) - 0.5}px)`}}>
          {LABELS.map((s, i) => {
            // 逐项入场：outBack 轻微过冲找位
            const p = seg(t, 0.06 + i * 0.09, 0.06 + i * 0.09 + 0.24, E.outBack);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '8px 13px',
                  borderRadius: 10,
                  background: '#161a26',
                  border: '1px solid #262c40',
                  opacity: Math.min(1, p * 2.2),
                  transform: `scale(${0.78 + Math.max(0, p) * 0.22}) translateY(${lerp(Math.max(0, p), 14, 0)}px)`,
                }}
              >
                <div
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 5,
                    flex: 'none',
                    background: `linear-gradient(140deg,hsl(${HUES[i]},75%,64%),hsl(${HUES[i]},70%,46%))`,
                  }}
                />
                <div
                  style={{
                    ...faText(13, {fontWeight: 500, lineHeight: 1.25, color: '#c6cde2'}),
                  }}
                >
                  {s}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </FaRoot>
    </DesignStage>
  );
};
