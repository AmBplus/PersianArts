// Persian title block for the chart-live-moves card (replaces the upstream TitleBlock: Helvetica 800 + letterSpacing:-1,
// both of which break Persian). Same size/weight/colour/position, Vazirmatn 800, no tracking, line-height for Persian.
import React from 'react';
import {fs, FA_LH} from '../../_fa';
import {G} from '../../_fixtures/Fixtures';

export const FaTitle: React.FC<{text: string; size?: number}> = ({text, size = 72}) => (
  <div style={{fontWeight: 800, fontSize: fs(size * 0.9), lineHeight: FA_LH, color: G.ink, letterSpacing: 0, textTransform: 'none', direction: 'rtl'}}>{text}</div>
);
