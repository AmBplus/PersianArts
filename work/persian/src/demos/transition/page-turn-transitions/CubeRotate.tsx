// Persian/RTL localization of cube-rotate. Timing 30-68f, inOut cubic, perspective, brightness and blur identical.
// TEXT: title "CUBE ROTATE" -> «چرخش مکعبی». FONT: Vazirmatn 800 (neutral UI voice), letter-spacing 0, size fs(54).
// DIRECTION decisions:
//  - Page turn direction: MIRRORED. In Persian the next page lies to the LEFT (spine on the right), so the old face A now leaves
//    toward the right and B arrives from the left: theta 0 -> +90 (was -90), B face rotateY -90 (was +90).
//  - Seam shadows: A's shared edge is now its LEFT edge, B's its RIGHT edge (seamSide swapped); the gradient already darkens
//    toward seamSide.
//  - Brightness cross (A dims, B lights), blur, perspective, sin(p*pi) seam depth: KEPT (physical / symmetric).
//  - Dashboard content: MIRRORED via FaDashboard (sidebar right, grid from right). Title: left:120 -> right:120.
// Title top 60->4: the Persian title (taller line box) sits in the empty margin above the face so it never lands on the dark sidebar.
// RASTER: none.
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G, FaDashboard as FakeDashboard, FaTitle } from './FaFixtures';

const S = 0.82;
const W = 1920 * S; // 面宽 = 立方体棱长
const H = 1080 * S;

// 单个立方体面：W×H 视口内放缩放 0.82 的整幅 dashboard
const Face: React.FC<{
  variant: 'A' | 'B';
  rot: number; // 面自身的 rotateY（A=0，B=90）
  brightness: number;
  seam: number; // 接缝阴影不透明度 0–1
  seamSide: 'right' | 'left'; // 阴影贴在哪条竖边（即共享棱一侧）
}> = ({ variant, rot, brightness, seam, seamSide }) => (
  <div
    style={{
      position: 'absolute',
      width: W,
      height: H,
      overflow: 'hidden',
      backfaceVisibility: 'hidden',
      transform: `rotateY(${rot}deg) translateZ(${W / 2}px)`,
      filter: `brightness(${brightness})`,
      background: G.bg,
    }}
  >
    <div style={{ transform: `scale(${S})`, transformOrigin: '0 0' }}>
      <FakeDashboard variant={variant} />
    </div>
    {seam > 0.01 && (
      <div
        style={{
          position: 'absolute',
          top: 0,
          [seamSide]: 0,
          width: 150,
          height: H,
          opacity: seam,
          background:
            seamSide === 'right'
              ? 'linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.55))'
              : 'linear-gradient(to left, rgba(0,0,0,0), rgba(0,0,0,0.55))',
        }}
      />
    )}
  </div>
);

export const CubeRotate: React.FC = () => {
  const frame = useCurrentFrame();
  // 翻转进度：30–68f，inOut cubic；两端 clamp 保证 hold 段逐帧恒定
  const p = interpolate(frame, [30, 68], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const theta = 90 * p; // mirrored (was -90)
  const brightA = 1 - 0.45 * p; // 旧面转出压暗 1→0.55
  const brightB = 0.55 + 0.45 * p; // 新面转入亮起 0.55→1
  const mid = Math.sin(p * Math.PI); // 0→1→0，45° 时最深
  const seam = mid * 0.9;
  const blur = mid * 1.5;

  return (
    <div style={{ width: 1920, height: 1080, background: G.bg, position: 'relative', overflow: 'hidden' }}>
      {/* blur 外包一层：>0.02 才挂 filter，落定后收尾帧完全相同 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          filter: blur > 0.02 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: (1920 - W) / 2,
            top: (1080 - H) / 2,
            width: W,
            height: H,
            perspective: 1400,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${-W / 2}px) rotateY(${theta}deg)`,
            }}
          >
            {/* Face A: starts frontal, leaves toward the right; shared edge on its left */}
            <Face variant="A" rot={0} brightness={brightA} seam={seam} seamSide="left" />
            {/* Face B: arrives from the left (-90 side); shared edge on its right */}
            <Face variant="B" rot={-90} brightness={brightB} seam={seam} seamSide="right" />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 120, top: 4 }}>
        <FaTitle text="چرخش مکعبی" size={54} />
      </div>
    </div>
  );
};
