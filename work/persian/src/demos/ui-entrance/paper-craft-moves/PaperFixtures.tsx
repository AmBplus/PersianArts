// Card-local RTL copy of the upstream paper placeholders. Their bars are abstract UI,
// so their lengths and seeds stay fixed while their start edge follows Persian reading order.
import React from 'react';

export const G = {
  bg: '#ececea', panel: '#f7f7f6', line: '#dcdcda', bar: '#c2c2c0',
  ink: '#2f2f2f', mid: '#8f8f8d', card: '#ffffff', border: '#d8d8d6',
  side: '#3a3a3a', sideBar: '#5a5a58',
};

export const Card: React.FC<{w: number; h: number; seed?: number; style?: React.CSSProperties}> = ({w, h, seed = 0, style}) => {
  const titleW = 45 + ((seed * 37) % 40);
  const lines = 2 + (seed % 3);
  return (
    <div style={{
      width: w, height: h, background: G.card, border: `2px solid ${G.border}`,
      borderRadius: 14, padding: 18, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 10,
      direction: 'rtl', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', ...style,
    }}>
      <div style={{height: 16, width: `${titleW}%`, background: G.bar, borderRadius: 8}} />
      {Array.from({length: lines}).map((_, i) => (
        <div key={i} style={{height: 10, width: `${88 - i * 14 - (seed % 5) * 3}%`, background: G.line, borderRadius: 5}} />
      ))}
      <div style={{marginTop: 'auto', display: 'flex', gap: 8, alignItems: 'center'}}>
        <div style={{width: 26, height: 26, borderRadius: 13, background: G.mid, flexShrink: 0}} />
        <div style={{height: 10, width: 64, background: G.line, borderRadius: 5}} />
      </div>
    </div>
  );
};
