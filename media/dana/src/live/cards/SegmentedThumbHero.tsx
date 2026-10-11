// Persian RTL localization of segmented-thumb-hero. The original two-beat interaction is intact:
// the pill floats in, the cursor enters, presses with a 12f ripple, the thumb crosses in exactly 8f,
// and the destination icon springs in as the source icon collapses. Copy: Ask → «پرسش», Computer →
// «رایانه». Reading-order layout is reversed: source «پرسش» starts at the right; destination «رایانه»
// sits left. Thumb, cursor path, and ripple target mirror horizontally because they encode the mode
// sequence; cursor arrow artwork, smile/laptop and question icons retain their physical geometry.
// Font: Vazirmatn, a clear variable-weight product UI sans that fits this restrained control and
// supports Persian shaping. No raster assets or baked-in text are used.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from 'remotion';
import { G } from '../../../persian/src/demos/_fixtures/Fixtures';
import { FaRoot, faText, fs } from '../../../persian/src/demos/_fa';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Large outlined pointer. Its silhouette is a physical cursor and stays unmirrored.
const ArrowCursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={130} height={150} viewBox="0 0 26 30" style={{
    position: 'absolute', left: x, top: y,
    transform: `scale(${1 - press * 0.14})`, transformOrigin: '15% 10%',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
  }}>
    <path d="M4 2 L4 24 L9.5 18.5 L13 27 L16.8 25.4 L13.3 17 L21 17 Z" fill="#fff" stroke={G.ink} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);

const SmileLaptop: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <rect x={7} y={7} width={26} height={19} rx={3} fill="none" stroke={G.ink} strokeWidth={3} />
    <circle cx={15.5} cy={14.5} r={1.9} fill={G.ink} /><circle cx={24.5} cy={14.5} r={1.9} fill={G.ink} />
    <path d="M14.5 19 Q20 23.5 25.5 19" stroke={G.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    <path d="M4 31 L36 31" stroke={G.ink} strokeWidth={3.4} strokeLinecap="round" />
  </svg>
);

const AskIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx={20} cy={20} r={13} fill="none" stroke={G.ink} strokeWidth={3} />
    <path d="M16 17 q0-5 4.5-5 q4.5 0 4.5 4.2 q0 3-3.4 4.4 q-1.6 0.7-1.6 2.6" stroke={G.ink} strokeWidth={2.8} fill="none" strokeLinecap="round" />
    <circle cx={20} cy={28} r={1.8} fill={G.ink} />
  </svg>
);

export const SegmentedThumbHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const FLOAT_IN = 0;
  const CURSOR_IN = 20;
  const CLICK = 48;
  const SLIDE = 52;
  const SLIDE_END = 60;

  const floatT = spring({ frame: frame - FLOAT_IN, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const ctrlY = interpolate(floatT, [0, 1], [200, 0]);
  const CW = 1080;
  const CH = 220;
  const PAD = 16;
  const SEGW = (CW - PAD * 2) / 2;

  // Mirror the cursor's entry and destination: it comes from the left to the left-hand destination segment.
  const curT = interpolate(frame, [CURSOR_IN, CURSOR_IN + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const curX = interpolate(curT, [0, 1], [10, 580]);
  const curY = interpolate(curT, [0, 1], [1020, 620]);
  const press = interpolate(frame, [CLICK, CLICK + 3, CLICK + 7], [0, 1, 0], clamp);

  // Source thumb begins at the right, then moves left for the 8f RTL reading-order transition.
  const thumbT = interpolate(frame, [SLIDE, SLIDE_END], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const thumbRight = PAD + thumbT * SEGW;
  const iconIn = spring({ frame: frame - SLIDE_END, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  const laptopScale = frame >= SLIDE_END ? iconIn : 0;
  const askScale = interpolate(frame, [SLIDE, SLIDE + 6], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  const rippleT = interpolate(frame, [CLICK, CLICK + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  const labelStyle = (active: boolean): React.CSSProperties => ({
    ...faText(72, { fontWeight: 700, whiteSpace: 'nowrap' }),
    color: active ? G.ink : G.mid,
    transition: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22,
    width: SEGW, height: CH - PAD * 2, position: 'relative', zIndex: 2,
  });
  const askActive = thumbT < 0.5;

  return (
    <AbsoluteFill style={{ background: G.bg, alignItems: 'center', justifyContent: 'center' }}>
      <FaRoot family="Vazirmatn">
        <div style={{ width: CW, height: CH, borderRadius: CH / 2, background: '#e4e4e2', border: `3px solid ${G.border}`,
          boxShadow: `0 ${24 - floatT * 12}px ${70 - floatT * 20}px rgba(0,0,0,0.22)`, transform: `translateY(${ctrlY}px)`,
          opacity: Math.min(1, floatT * 1.5), position: 'absolute', left: '50%', top: '50%', marginLeft: -CW / 2, marginTop: -CH / 2,
          display: 'flex', alignItems: 'center', padding: PAD, boxSizing: 'border-box', direction: 'rtl' }}>
          <div style={{ position: 'absolute', right: thumbRight, top: PAD, width: SEGW, height: CH - PAD * 2,
            borderRadius: (CH - PAD * 2) / 2, background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.18)', zIndex: 1 }} />
          {rippleT > 0 && rippleT < 1 && <div style={{ position: 'absolute', right: PAD + SEGW + SEGW / 2 - 130 * rippleT,
            top: CH / 2 - PAD - 130 * rippleT, width: 260 * rippleT, height: 260 * rippleT, borderRadius: '50%',
            border: `4px solid ${G.mid}`, opacity: 1 - rippleT, zIndex: 3 }} />}
          <div style={labelStyle(askActive)}>
            <span style={{ display: 'inline-flex', transform: `scale(${askScale})`, width: askScale < 0.05 ? 0 : 78, overflow: 'visible', flexShrink: 0 }}><AskIcon size={78} /></span>
            <span>حضوری</span>
          </div>
          <div style={labelStyle(!askActive)}>
            <span style={{ display: 'inline-flex', transform: `scale(${laptopScale})`, width: laptopScale < 0.05 ? 0 : 78, overflow: 'visible', flexShrink: 0 }}><SmileLaptop size={78} /></span>
            <span style={{ fontSize: fs(72) }}>مجازی</span>
          </div>
        </div>
        <ArrowCursor x={curX} y={curY} press={press} />
      </FaRoot>
    </AbsoluteFill>
  );
};
