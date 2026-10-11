// TEMPORARY render entry for order T1 verification only (work/dana/orders/report-T1.md).
// The main entry src/index.ts currently fails at module load while the v2 scene migration is
// in flight (src/scenes/S8.tsx asks timing.ts for scene "s8", which the v2 cue sheet no longer
// defines). This file registers ONLY the T1 showcase so its stills can be rendered without
// touching any scene file. Delete when the main entry is healthy again.
import React from "react";
import {Composition, registerRoot} from "remotion";
import {KitV2ShowcaseA} from "./KitV2ShowcaseA";
import {DanaFonts} from "../fonts";

const Root: React.FC = () => (
  <>
    <Composition
      id="KitV2Showcase-A"
      component={() => (
        <DanaFonts>
          <KitV2ShowcaseA />
        </DanaFonts>
      )}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);

registerRoot(Root);
