// RTL mirror of the shared FakeDashboard (variant A) — the shared fixture is LTR-only (sidebar left, search right via marginLeft:auto)
// and must not be edited, so the Persian card carries its own copy. Layout uses direction:rtl, so the flex row puts the sidebar on the
// RIGHT, the header search box on the LEFT and the 3x2 card grid reads right-to-left. No text lives in it (placeholder bars only).
import React from 'react';
import { Card, G } from '../../_fixtures/Fixtures';

export const MirroredDashboard: React.FC = () => (
  <div style={{ width: 1920, height: 1080, background: G.bg, display: 'flex', direction: 'rtl' }}>
    <div style={{ width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#777775' }} />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ height: 12, width: `${60 + ((i * 29) % 35)}%`, background: G.sideBar, borderRadius: 6 }} />
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: 180, background: G.bar, borderRadius: 9 }} />
        <div style={{ marginInlineStart: 'auto', height: 36, width: 320, background: '#fff', border: `2px solid ${G.line}`, borderRadius: 18, boxSizing: 'border-box' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: G.mid }} />
      </div>
      <div style={{ flex: 1, padding: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 28, boxSizing: 'border-box' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} w={0} h={0} seed={i + 1} style={{ width: '100%', height: '100%' }} />
        ))}
      </div>
    </div>
  </div>
);
