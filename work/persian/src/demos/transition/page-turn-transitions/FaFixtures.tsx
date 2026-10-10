// Persian (RTL) copy of the grey placeholder dashboard from _fixtures/Fixtures.tsx (that file is shared and must not change).
// Only layout direction changes; dimensions, colours and seeds are identical to the original.
//  - direction:rtl on the root: the dark sidebar moves to the RIGHT (reading-start side), the 3x2 card grid fills from the right,
//    list rows / card footers put the avatar/icon at the right and the trailing meta bar at the left.
//  - header: title bar at the start (right), search pill + avatar flow to the left; `marginLeft:auto` became `marginInlineStart:auto`.
//  - skeleton bars are text-line placeholders: they anchor to the start (right) edge automatically through direction:rtl.
//  - The bar widths, the card seeds and the list-row widths are unchanged (visual weight identical).
import React from 'react';
import {G, Card} from '../../_fixtures/Fixtures';
import {FaFonts, FA_LH, fs} from '../../_fa';

export {G};

export const FaDashboard: React.FC<{variant?: 'A' | 'B'}> = ({variant = 'A'}) => (
  <div style={{width: 1920, height: 1080, background: G.bg, display: 'flex', direction: 'rtl'}}>
    <div style={{width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18}}>
      <div style={{width: 40, height: 40, borderRadius: 10, background: '#777775'}} />
      {Array.from({length: 7}).map((_, i) => (
        <div key={i} style={{height: 12, width: `${60 + ((i * 29) % 35)}%`, background: G.sideBar, borderRadius: 6}} />
      ))}
    </div>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
      <div style={{height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box'}}>
        <div style={{height: 18, width: 180, background: G.bar, borderRadius: 9}} />
        <div style={{marginInlineStart: 'auto', height: 36, width: 320, background: '#fff', border: `2px solid ${G.line}`, borderRadius: 18, boxSizing: 'border-box'}} />
        <div style={{width: 36, height: 36, borderRadius: 18, background: G.mid}} />
      </div>
      {variant === 'A' ? (
        <div style={{flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box'}}>
          {Array.from({length: 6}).map((_, i) => (
            <Card key={i} w={0} h={0} seed={i + 1} style={{width: '100%', height: '100%'}} />
          ))}
        </div>
      ) : (
        <div style={{flex: 1, padding: 36, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box'}}>
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} style={{flex: 1, background: G.card, border: `2px solid ${G.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 24, padding: '0 28px', boxSizing: 'border-box'}}>
              <div style={{width: 44, height: 44, borderRadius: 10, background: G.mid}} />
              <div style={{height: 14, width: `${30 + ((i * 23) % 25)}%`, background: G.bar, borderRadius: 7}} />
              <div style={{marginInlineStart: 'auto', height: 12, width: 120, background: G.line, borderRadius: 6}} />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

/** Persian title: no letter-spacing/uppercase, heavy Vazirmatn; also blocks the frame until the font is loaded. */
export const FaTitle: React.FC<{text: string; size?: number}> = ({text, size = 54}) => (
  <FaFonts families={['Vazirmatn']}>
    <div style={{fontFamily: '"Vazirmatn", sans-serif', fontWeight: 800, fontSize: fs(size), lineHeight: FA_LH, color: G.ink, letterSpacing: 0, textTransform: 'none', direction: 'rtl', whiteSpace: 'nowrap'}}>
      {text}
    </div>
  </FaFonts>
);
