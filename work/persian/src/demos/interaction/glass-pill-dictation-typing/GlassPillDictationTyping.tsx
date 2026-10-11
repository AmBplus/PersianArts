// PERSIAN (RTL) localization of shotcraft "glass-pill-dictation-typing".
// Text: “Speak or type here” becomes the idiomatic input prompt «صحبت کنید یا بنویسید».
// Direction decisions: this is a text-entry control, so its reading affordances mirror: text starts at the right,
// its prefix typewriter grows leftward with the caret immediately after it, and the voice control moves to the left.
// The internal waiting-light gradient also mirrors (bright at the control end); its timing, opacity, scale, glow and
// waveform physics are unchanged. The vertical waveform itself is physical decoration, so its bars and breathing stay intact.
// Font: Vazirmatn, a neutral variable UI sans with Persian coverage; loaded by FaRoot and measured after it is available.
// Raster handling: none — this composition is entirely procedural.
import React, {useEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {DesignStage, E, lerp, seg, useT} from '../../_fixtures/Motion';
import {FaRoot, faText, fs, typeOn} from '../../_fa';

export const GLASS_PILL_DICTATION_TYPING_DURATION = 50; // 1650ms @30fps

const ACCENT_RGB = '146,126,212';
const PH = 46;
const ICON = 30;
const BASE = [13, 7, 10, 6, 9];
const TEXT = 'صحبت کنید یا بنویسید';

export const GlassPillDictationTyping: React.FC = () => {
  const t = useT();
  const measRef = useRef<HTMLDivElement>(null);
  const [textW, setTextW] = useState(180);
  const [fontHandle] = useState(() => delayRender('measure Vazirmatn input text'));

  useEffect(() => {
    let active = true;
    document.fonts.load(`${fs(21)}px Vazirmatn`, TEXT).then(() => {
      if (active && measRef.current) setTextW(measRef.current.offsetWidth);
      continueRender(fontHandle);
    }, () => continueRender(fontHandle));
    return () => { active = false; };
  }, [fontHandle]);

  const PW = Math.round(textW + 168);
  const s = lerp(seg(t, 0, 0.22, E.outCubic), 1.25, 1);
  const typed = typeOn(TEXT, seg(t, 0.06, 0.73));
  const caretO = seg(t, 0.025, 0.045) * (1 - seg(t, 0.75, 0.8));
  const g = 1 - seg(t, 0.08, 0.76, E.inOutQuad);

  return (
    <DesignStage bg="#000">
      <FaRoot family="Vazirmatn">
        <div style={{position: 'absolute', inset: 0, background: '#000', overflow: 'hidden', filter: 'contrast(1.008)'}}>
          <div
            style={{
              position: 'absolute', left: 0, top: (270 - PH) / 2, height: PH, width: PW,
              borderRadius: PH / 2, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
              padding: '0 16px 0 8px', overflow: 'hidden', background: '#0d0d13',
              willChange: 'transform,opacity', opacity: seg(t, 0, 0.025),
              transform: `translateX(${(480 - PW) / 2}px) scale(${s})`,
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,${0.16 + 0.1 * g}), inset 0 14px 22px rgba(255,255,255,${0.03 + 0.04 * g}), 0 0 ${26 * g}px rgba(${ACCENT_RGB},${0.28 * g})`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: g, background: `linear-gradient(270deg,rgba(${ACCENT_RGB},0) 0%,rgba(${ACCENT_RGB},.35) 42%,rgba(${ACCENT_RGB},.95) 100%)`}} />
            <div style={{position: 'relative', ...faText(21, {color: '#f4f4f5', whiteSpace: 'pre', flex: 'none'})}}>{typed}</div>
            <div style={{position: 'relative', width: 2, height: 23, borderRadius: 1, background: '#eaeaec', marginInlineStart: 2, flex: 'none', opacity: caretO}} />
            <div
              style={{
                position: 'relative', marginInlineStart: 'auto', width: ICON, height: ICON, borderRadius: 9,
                boxSizing: 'border-box', border: '1.5px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 2.2, height: '100%', direction: 'ltr'}}>
                {BASE.map((h, i) => <div key={i} style={{width: 1.5, borderRadius: 1.5, background: '#ececee', height: h + 1.6 * Math.sin(t * 18 + i * 1.7)}} />)}
              </div>
            </div>
          </div>
          <div ref={measRef} style={{position: 'absolute', visibility: 'hidden', whiteSpace: 'pre', ...faText(21), top: -999}}>{TEXT}</div>
        </div>
      </FaRoot>
    </DesignStage>
  );
};
