// Persian/RTL localization of barn-door-split. Motion, timing, easing identical to the original.
// TEXT: title "BARN DOOR SPLIT" -> «دو لنگهٔ در» (barn door = double-leaf door); the dashboards are text-free grey placeholders.
// FONT: Vazirmatn 800 (neutral product-UI voice, variable so a real bold exists), no letter-spacing, size fs(54).
// DIRECTION decisions:
//  - The split is symmetric (centre crack, both leaves leave outward at equal speed): KEPT; mirroring would be a no-op.
//    Leaf inner-edge lines/shadows stay on each leaf's inner edge (physical, tied to the crack). Crack flash: symmetric, KEPT.
//  - Dashboard content: MIRRORED via FaDashboard (sidebar right, grid/list start right, header search to the left) = layout order.
//  - Title block: MIRRORED to the right side and moved clear of the dark sidebar (right:340, top 96->88): the sidebar is 220px wide at x 1700-1920, so right:120 put dark ink over dark bars (illegible); at right:340 the title sits fully on the light main area (x<1700).
//  - B base-layer scale 1.06->1 about the centre: KEPT (symmetric).
// RASTER: none (pure CSS placeholders, no baked text).
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FaDashboard as FakeDashboard, FaTitle } from './FaFixtures';

export const BarnDoorSplit: React.FC = () => {
  const frame = useCurrentFrame();

  // 两半外滑位移：30–50f，0 → 980px，加速离场
  const slide = interpolate(frame, [30, 50], [0, 980], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  // 底层 B：30–55f 从 1.06 轻推到 1.0 迎上来
  const bScale = interpolate(frame, [30, 55], [1.06, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // 裂前预告：中缝细线两次闪现（帧确定的开关，无随机）
  const crackFlash =
    (frame >= 18 && frame < 22) || (frame >= 25 && frame < 29);
  // 裂开后内边缘亮线 + 阴影常驻（随门一起滑出画外）
  const tornEdge = frame >= 30;

  const edgeLine = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    [side]: 0,
    width: 3,
    height: 1080,
    background: G.ink,
    boxShadow:
      side === 'right'
        ? '-8px 0 14px rgba(0,0,0,0.4)'
        : '8px 0 14px rgba(0,0,0,0.4)',
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: G.bg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 底层 FakeDashboard B：scale 1.06 → 1.0 迎上来 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transform: `scale(${bScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <FakeDashboard variant="B" />
      </div>

      {/* 左门：960×1080 视口，装完整 A 的左半 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 960,
          height: 1080,
          overflow: 'hidden',
          transform: `translateX(${-slide}px)`,
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }}>
          <FakeDashboard variant="A" />
        </div>
        {tornEdge && <div style={edgeLine('right')} />}
      </div>

      {/* 右门：960×1080 视口，内层 translateX(-960) 对位拼合 */}
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 0,
          width: 960,
          height: 1080,
          overflow: 'hidden',
          transform: `translateX(${slide}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transform: 'translateX(-960px)',
          }}
        >
          <FakeDashboard variant="A" />
        </div>
        {tornEdge && <div style={edgeLine('left')} />}
      </div>

      {/* 裂点预告：中缝 2px 细线闪现两次 */}
      {crackFlash && (
        <div
          style={{
            position: 'absolute',
            left: 959,
            top: 0,
            width: 2,
            height: 1080,
            background: G.ink,
          }}
        />
      )}

      <div style={{ position: 'absolute', right: 340, top: 88 }}>
        <FaTitle text="دو لنگهٔ در" size={54} />
      </div>
    </div>
  );
};
