// Standalone Remotion entry for the uni-admissions teaser. One composition per aspect ratio;
// duration follows the last beat-grid cut in motion.ts (48 beats = 24 s at 120 BPM).
import React from "react";
import {Composition, registerRoot} from "remotion";
import {UniFilm} from "./UniFilm";
import {Aspect, LAYOUT} from "./layout";
import {DURATION_FRAMES, FPS} from "./motion";

const IDS: Record<Aspect, string> = {"9:16": "Uni9x16", "1:1": "Uni1x1", "4:5": "Uni4x5", "16:9": "Uni16x9"};

const Root: React.FC = () => (
  <>
    {(Object.keys(IDS) as Aspect[]).map((a) => (
      <Composition key={a} id={IDS[a]} component={UniFilm} defaultProps={{aspect: a}}
        durationInFrames={DURATION_FRAMES} fps={FPS} width={LAYOUT[a].W} height={LAYOUT[a].H} />
    ))}
  </>
);
registerRoot(Root);
