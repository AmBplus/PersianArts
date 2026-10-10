// PERSIAN (RTL) localization of shotcraft "sheen-sweep-retry" (light-play-moves) — frames 40-68, inOut(cubic), 45deg band untouched.
// Text: "PRO" -> «پرو» (Persian spelling of the tier name); the two grey placeholder bars carry no text.
// Direction decisions:
//  - Sweep is a reading-direction wipe: it now travels right -> left. Band anchored with right:0 and translateX(dir(x)),
//    so it starts fully outside the right edge and exits past the left edge (same distance/easing/frames).
//  - Gradient 115deg -> 245deg (mirror of the angle about the vertical axis): the band keeps its 45deg lean, mirrored.
//  - Card content: direction:rtl, so the title and the two bars align to the START (right) edge; padding is symmetric (72px).
//  - Card is centred on the canvas; boxShadow offset is vertical only, radius symmetric -> KEPT (light physics).
// Font: Estedad 800 (neutral strong variable UI face = Helvetica 800 role); letterSpacing 2 removed (breaks joining).
// Raster assets: none.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FaRoot, dir, faText } from '../../_fa';

const CARD_W = 760;
const CARD_H = 420;
const SHEEN_W = CARD_W * 1.6; // 1216

export const SheenSweepRetry: React.FC = () => {
  const frame = useCurrentFrame();

  const sweepActive = frame >= 40 && frame <= 68;
  const x = interpolate(frame, [40, 68], [-SHEEN_W, CARD_W], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <FaRoot family="Estedad" style={{ background: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          background: G.side,
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          boxSizing: 'border-box',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        <div
          style={{
            ...faText(120),
            fontWeight: 800,
            color: '#f5f5f3',
            lineHeight: 1.4,
          }}
        >
          پرو
        </div>
        <div style={{ height: 16, width: 380, background: G.sideBar, borderRadius: 8 }} />
        <div style={{ height: 16, width: 260, background: G.sideBar, borderRadius: 8 }} />

        {/* sheen band: mounted only while sweeping */}
        {sweepActive && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: SHEEN_W,
              height: CARD_H,
              transform: `translateX(${dir(x)}px)`,
              background:
                'linear-gradient(245deg, transparent 42%, rgba(255,255,255,0.32) 50%, transparent 58%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </FaRoot>
  );
};
