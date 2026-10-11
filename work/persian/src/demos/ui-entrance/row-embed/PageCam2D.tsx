// Card-local camera. Its transform math and easing match the upstream fixture:
// vertical pan is physical, centered x and zoom stay fixed; there is no reading-direction
// motion to mirror here. The page is live Persian DOM, not a baked screenshot. All copy,
// RTL layout and Vazirmatn font loading are handled by PersianPage and RowEmbed.
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';

export type CamKey2D = {
  frame: number;
  cx: number;
  cy: number;
  zoom: number;
  rotX?: number; // deg
  rotY?: number; // deg（正 = 右缘后缩，即左机位）
  rotZ?: number; // deg
  persp?: number; // px
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PageCam2D: React.FC<{
  page: React.ReactNode;
  pageH: number;
  keys: CamKey2D[];
  children?: React.ReactNode;
  bg?: string;
  blur?: number; // px, 应用到整页（背景页 blur 化景深）
  ease?: (t: number) => number;
}> = ({ page, pageH, keys, children, bg = '#faf7f2', blur = 0, ease = Easing.bezier(0.33, 0, 0.15, 1) }) => {
  const frame = useCurrentFrame();
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (frame >= keys[i].frame && frame <= keys[i + 1].frame) {
      a = keys[i];
      b = keys[i + 1];
      break;
    }
  }
  const t =
    a.frame === b.frame
      ? 1
      : interpolate(frame, [a.frame, b.frame], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: ease,
        });
  const cx = lerp(a.cx, b.cx, t);
  const cy = lerp(a.cy, b.cy, t);
  const zoom = lerp(a.zoom, b.zoom, t);
  const rotX = lerp(a.rotX ?? 0, b.rotX ?? 0, t);
  const rotY = lerp(a.rotY ?? 0, b.rotY ?? 0, t);
  const rotZ = lerp(a.rotZ ?? 0, b.rotZ ?? 0, t);
  const persp = lerp(a.persp ?? 1400, b.persp ?? 1400, t);
  const has3D = keys.some(
    (k) => k.rotX !== undefined || k.rotY !== undefined || k.rotZ !== undefined || k.persp !== undefined,
  );

  if (!has3D) {
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: pageH,
            transform: `translate(${960 - cx * zoom}px, ${540 - cy * zoom}px) scale(${zoom})`,
            transformOrigin: '0 0',
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          {page}
          {children}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: bg }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          perspective: `${persp * zoom}px`,
          perspectiveOrigin: '960px 540px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 1920,
            height: pageH,
            zoom,
            transform: `translate(${960 / zoom - cx}px, ${540 / zoom - cy}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transformStyle: 'preserve-3d',
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
          }}
        >
          {page}
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
