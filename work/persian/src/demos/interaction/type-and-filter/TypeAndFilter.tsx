// PERSIAN (RTL) localization of shotcraft "type-and-filter".
// Text/raster: the editable search query is «نانو-لب». The reference page and every project
// card are baked raster UI with English/Chinese copy, so their textures are blurred (rather
// than leaving foreign text visible); the search field is rebuilt above that plate.
// Direction: the project grid's reading order is mirrored, so every card position, the result
// slot, departure stagger, click point and final camera target mirror horizontally. The vertical
// sink, lift, scale, shadows, ripple growth and camera zoom are physical/universal and remain.
// Font: Vazirmatn is the neutral, variable-weight product-UI counterpart to the source sans;
// FaRoot explicitly loads it. Persian type uses typeOn() prefix slicing—never separate glyph boxes.
// Timing: the Persian query has a different character count, but its prefix progression spans the
// original 24-frame typing window and still ends before FILTER_START, preserving the human pause.
import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from '../../_fixtures/PageCam2D';
import layout from '../../_textures/live-layout.json';
import { FaRoot, faText, typeOn } from '../../_fa';

export const TYPE_AND_FILTER_DURATION = 73;

const PAGE_H = layout.projects.pageH;
const cards = layout.projects.cards;
const PAPER = '#f9f6f1';
const FIELD = '#fefcf9';
const AMBER = 'oklch(58% 0.13 65)';
const QUERY = 'نانو-لب';
const TYPE_START = 10;
const TYPE_END = 31;
const FILTER_START = 42;
const SEARCH = { x: 408, y: 130, w: 1016, h: 44 };
const mirrorX = (x: number, width: number) => 1920 - x - width;

const NANO_TITLE = 'nano-lab';
const nanoIdx = cards.findIndex((c) => c.title.includes(NANO_TITLE));
const nano = cards[nanoIdx];
const NANO_FROM = { x: mirrorX(nano.x, nano.w), y: nano.y };
const NANO_TO = { x: mirrorX(408, nano.w), y: 247 };
const CLICK_C = { x: mirrorX(586, 0), y: 391 };

// In RTL the first card/read is at the right, so the visible disappearance cascade reverses.
const leaveRank = new Map<number, number>();
cards.forEach((_, i) => {
  if (i !== nanoIdx) leaveRank.set(i, cards.length - 1 - i - (i > nanoIdx ? 0 : 1));
});

const CAM_KEYS: CamKey2D[] = [
  { frame: 0, cx: 960, cy: 380, zoom: 0.9 },
  { frame: 56, cx: 960, cy: 380, zoom: 0.9 },
  { frame: 72, cx: CLICK_C.x, cy: CLICK_C.y, zoom: 2.2 },
];

export const TypeAndFilter: React.FC = () => {
  const frame = useCurrentFrame();
  const typing = interpolate(frame, [TYPE_START, TYPE_END], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const typed = frame < TYPE_START ? '' : typeOn(QUERY, typing);
  const caretOn = frame >= TYPE_START - 2 && frame <= 67 &&
    (frame <= TYPE_END || Math.floor((frame - TYPE_END) / 8) % 2 === 0);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <FaRoot family="Vazirmatn">
        <PageCam2D src="textures/live/projects-empty.png" pageH={PAGE_H} keys={CAM_KEYS}>
          {/* The plate is blurred before crisp, localized interaction layers are composed. */}
          <div style={{position: 'absolute', inset: 0, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', pointerEvents: 'none'}} />
          {cards.map((c, i) => {
            if (i === nanoIdx) return null;
            const outCue = FILTER_START + leaveRank.get(i)! * 0.4;
            if (frame >= outCue + 5) return null;
            const outT = interpolate(frame, [outCue, outCue + 5], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
            });
            return (
              <div key={`${c.file}-${i}`} style={{
                position: 'absolute', left: mirrorX(c.x, c.w), top: c.y, width: c.w, height: c.h,
                transform: `translate3d(0px, ${8 * outT}px, 0px)`, opacity: 1 - outT,
                borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 6px rgba(60,45,30,.08)',
              }}>
                <Img src={staticFile(`textures/live/${c.file}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', filter: 'blur(8px)'}} />
              </div>
            );
          })}

          {(() => {
            const slideT = interpolate(frame, [FILTER_START, FILTER_START + 10], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0.2, 1),
            });
            const float = Math.sin(slideT * Math.PI);
            return (
              <div style={{
                position: 'absolute', left: NANO_FROM.x, top: NANO_FROM.y, width: nano.w, height: nano.h,
                transform: `translate3d(${(NANO_TO.x - NANO_FROM.x) * slideT}px, ${(NANO_TO.y - NANO_FROM.y) * slideT}px, ${18 * float}px) scale(${1 + 0.02 * float})`,
                transformOrigin: 'center center', boxShadow: `0 ${2 + 14 * float}px ${6 + 26 * float}px rgba(60,45,30,${0.08 + 0.1 * float})`,
                borderRadius: 16, overflow: 'hidden', zIndex: 2,
              }}>
                <Img src={staticFile(`textures/live/${nano.file}`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', filter: 'blur(8px)'}} />
              </div>
            );
          })()}

          {/* Rebuilt RTL field covers the baked LTR placeholder and preserves a right-side search icon. */}
          <div style={{position: 'absolute', left: SEARCH.x, top: SEARCH.y + 4, width: SEARCH.w, height: SEARCH.h - 8, background: FIELD, pointerEvents: 'none'}} />
          <div style={{position: 'absolute', right: 448, top: SEARCH.y, height: SEARCH.h, display: 'flex', alignItems: 'center', color: 'oklch(25% 0.006 82)', pointerEvents: 'none', direction: 'rtl'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{marginInlineEnd: 10, flex: '0 0 auto'}}><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7"/><path d="m15 15 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            <span style={{...faText(15), fontWeight: 450, unicodeBidi: 'plaintext'}}>{typed}</span>
            {caretOn ? <span style={{display: 'inline-block', width: 2, height: 20, marginInlineStart: 2, background: AMBER}} /> : null}
          </div>

          {[0, 1].map((r) => {
            const start = 58 + r * 3;
            if (frame < start || frame > start + 10) return null;
            const t = interpolate(frame, [start, start + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
            const rad = interpolate(t, [0, 1], [14, r === 0 ? 54 : 78]);
            return <div key={`ripple-${r}`} style={{position: 'absolute', left: CLICK_C.x - rad, top: CLICK_C.y - rad, width: rad * 2, height: rad * 2, borderRadius: '50%', border: `2px solid ${AMBER}`, opacity: 1 - t, pointerEvents: 'none', zIndex: 5}} />;
          })}

          {frame >= 60 ? <div style={{position: 'absolute', left: NANO_TO.x - 6, top: NANO_TO.y - 6, width: nano.w + 12, height: nano.h + 12, borderRadius: 16, border: `3px solid ${AMBER}`, boxShadow: '0 0 40px rgba(180,120,50,0.5)', opacity: interpolate(frame, [60, 63], [0.5, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), pointerEvents: 'none', zIndex: 4}} /> : null}
        </PageCam2D>
      </FaRoot>
    </AbsoluteFill>
  );
};
