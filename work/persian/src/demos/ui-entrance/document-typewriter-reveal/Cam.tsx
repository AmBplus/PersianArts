// Minimal 2D page camera (copy of PageCam2D without the baked screenshot): the Persian page is a real DOM tree.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';

export type CamKey = { frame: number; cx: number; cy: number; zoom: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const Cam: React.FC<{ pageH: number; keys: CamKey[]; bg: string; children?: React.ReactNode }> = ({ pageH, keys, bg, children }) => {
  const frame = useCurrentFrame();
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame >= keys[i].frame && frame <= keys[i + 1].frame) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const t = a.frame === b.frame ? 1 : interpolate(frame, [a.frame, b.frame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.15, 1) });
  const cx = lerp(a.cx, b.cx, t), cy = lerp(a.cy, b.cy, t), zoom = lerp(a.zoom, b.zoom, t);
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
      <div style={{ position: 'absolute', width: 1920, height: pageH, transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
