// PERSIAN (RTL) localization of the page-waterfall-wall card.
//
// TEXT / RASTER: all 12 source PNG slices contain baked English/Chinese UI. Each is
// rebuilt as live Persian page content in PersianPages.tsx, with its exact source aspect
// ratio. The source PNGs are reference only; no blur or foreign text appears in output.
// DIRECTION: page contents use RTL. The source's top-right age stamp moves to top-left;
// titles, description, metadata and counters start at the right; search icons and
// category headers follow the RTL reading edge. The three-column wall keeps its
// centered physical order: it is a parallax tableau, not a horizontal reading list.
// Vertical flow (outer columns up, middle down) and top/bottom fades stay physical.
// FONT: Vazirmatn variable supports the product UI's many weights, Persian digits,
// punctuation and ZWNJ; FaRoot loads it before rendering the live page text.
// MOTION: 12/9/14s loops, 20deg rotateX, perspective 1000, scale 1.2, gap 30,
// and the outer 1.0->1.06 camera push are unchanged from upstream.
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VerticalTicker, TickerColumn } from './VerticalTicker';
import { FaRoot } from '../../_fa';
import {PersianPage} from './PersianPages';

const BG = '#101014';

const shot = (file: string) => (
  <div
    style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      background: '#fff',
    }}
  >
    <PersianPage file={file}/>
  </div>
);

// 3 列差速反向（配方卡参数：loop 12/9/14s，中列反向）
export const buildColumns = (loops: [number, number, number]): TickerColumn[] => [
  {
    items: ['card1.png', 'card2.png', 'card3.png', 'card10.png'].map(shot),
    durationInSeconds: loops[0],
    direction: -1,
  },
  {
    items: ['card4.png', 'card5.png', 'card6.png', 'projects-empty.png'].map(shot),
    durationInSeconds: loops[1],
    direction: 1,
  },
  {
    items: ['card7.png', 'card8.png', 'card9.png', 'float-search.png'].map(shot),
    durationInSeconds: loops[2],
    direction: -1,
  },
];

export const PageWaterfallWall: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // 镜头缓推寄生在外层，墙自身循环、镜头单向
  const push = interpolate(frame, [0, durationInFrames], [1, 1.06]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <FaRoot family="Vazirmatn">
        <AbsoluteFill style={{ transform: `scale(${push})` }}>
          <VerticalTicker
            columns={buildColumns([12, 9, 14])}
            backgroundColor={BG}
            columnWidth={560}
            gap={30}
          />
        </AbsoluteFill>
      </FaRoot>
    </AbsoluteFill>
  );
};

// 接缝自检用：短 loop（3s=90f）、无镜头推，f0 与 f90 应逐像素一致
export const SeamTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <FaRoot family="Vazirmatn">
      <VerticalTicker
        columns={buildColumns([3, 3, 3])}
        backgroundColor={BG}
        columnWidth={560}
        gap={30}
      />
    </FaRoot>
  </AbsoluteFill>
);
