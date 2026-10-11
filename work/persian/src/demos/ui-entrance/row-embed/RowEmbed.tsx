// Persian RTL localization of row-embed. The baked English/Chinese screenshot is replaced
// by live Persian UI: brand/nav, project title/tags/description, metadata, tabs, filters,
// five column headers, and five research rows with status, type, owner and Persian date.
// Layout follows reading order: brand and nav start at right; title, tabs, filters and
// row titles start at right; table columns run title -> status -> type -> owner -> date
// from right to left; the expand action ends at the left. The centered 1104px page area
// and five row slot coordinates are symmetric, so their physical x positions stay put.
// Gravity, rotateX, camera pan and center-out amber seam express physical embedding and
// retain upstream directions, frame cues, easing and duration. One DetailRow component
// paints both a flying row and its landing site so the text and geometry match exactly.
// Font: variable Vazirmatn, loaded by FaRoot, for the source's restrained product UI.
// Raster handling: detail-full.png is removed; no baked foreign text is rendered.
import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { PageCam2D, CamKey2D } from './PageCam2D';
import layout from '../../_textures/live-layout.json';
import {FaRoot} from '../../_fa';
import {DetailRow, PersianPage} from './PersianPage';

export const ROW_EMBED_DURATION = 68;

const DETAIL_H = layout.detail.pageH;
const rows = layout.detail.rows;

const DETAIL_CAM: CamKey2D[] = [
  { frame: 0, cx: 960, cy: 300, zoom: 1.1 },
  { frame: 68, cx: 960, cy: 760, zoom: 1.0 },
];

const FLY_EASE = Easing.bezier(0.3, 0, 0.25, 1);

export const RowEmbed: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <FaRoot family="Vazirmatn">
    <PageCam2D page={<PersianPage />} pageH={DETAIL_H} keys={DETAIL_CAM}>
      {rows.map((r, i) => {
        const cue = 12 + i * 9;
        const land = cue + 12;

        // empty-slot paper patch (under the flying row), gone 2f after landing
        const patchOpacity = interpolate(frame, [land, land + 2], [1, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        });

        // flying row: same live component as the row in the page
        let flyer: React.ReactNode = null;
        if (frame >= cue && frame < cue + 16) {
          const p = interpolate(frame, [cue, cue + 12], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE,
          });
          const appear = interpolate(frame, [cue, cue + 3], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const scale =
            frame < land
              ? 1.06 - 0.065 * p
              : interpolate(frame, [land, land + 4], [0.995, 1], {
                  extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),
                });
          const air = 1 - p;
          flyer = (
            <div
              key={`row-${i}`}
              style={{
                position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h,
                borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden',
                opacity: appear,
                transform: `perspective(900px) translateY(${-120 * air}px) rotateX(${16 * air}deg) scale(${scale})`,
                boxShadow: `0 ${30 * air}px ${60 * air}px rgba(30,25,18,${0.22 * air}), 0 ${8 * air}px ${16 * air}px rgba(30,25,18,${0.12 * air})`,
                zIndex: 3, pointerEvents: 'none',
              }}
            ><DetailRow index={i} flying /></div>
          );
        }

        // embed flash: 2px amber seam at the row's bottom edge, expanding from
        // the center on touchdown, then fading out
        let seam: React.ReactNode = null;
        if (frame >= land && frame < land + 8) {
          const spread = interpolate(frame, [land, land + 5], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
          });
          const seamOpacity = interpolate(frame, [land, land + 2, land + 8], [1, 1, 0], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          const seamW = r.w * spread;
          seam = (
            <div
              key={`seam-${i}`}
              style={{
                position: 'absolute',
                left: r.x + (r.w - seamW) / 2,
                top: r.y + r.h - 2,
                width: seamW, height: 2,
                background: 'oklch(58% 0.13 65)',
                boxShadow: '0 0 6px rgba(180,120,50,0.35)',
                opacity: seamOpacity, zIndex: 4, pointerEvents: 'none',
              }}
            />
          );
        }

        return (
          <React.Fragment key={i}>
            {patchOpacity > 0 ? (
              <div
                key={`patch-${i}`}
                style={{
                  position: 'absolute', left: r.x, top: r.y,
                  width: r.w, height: r.h, background: '#faf7f2',
                  opacity: patchOpacity, zIndex: 1, pointerEvents: 'none',
                }}
              />
            ) : null}
            {flyer}
            {seam}
          </React.Fragment>
        );
      })}
    </PageCam2D>
    </FaRoot>
  );
};
