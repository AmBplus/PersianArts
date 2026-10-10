// RTL twin of _fixtures FakeDashboard (variant A only). The original has no text, but its layout carries
// reading order: sidebar on the left, search/avatar order, card grid filling left->right.
// Mirrored by direction:rtl (sidebar goes to the right edge, card #1 at top-right) and marginLeft -> marginInlineStart.
import React from 'react';
import { G, Card } from '../../_fixtures/Fixtures';

export const RtlDashboard: React.FC = () => (
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
