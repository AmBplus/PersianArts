// Standalone Remotion entry for the social film. One composition per aspect ratio ; duration follows the last beat-grid cut in motion.ts.
import React from "react";
import {Composition, registerRoot} from "remotion";
import {SocialFilm} from "./SocialFilm";
import {Aspect, LAYOUT} from "./layout";
import {DURATION_FRAMES, FPS} from "./motion";

const IDS: Record<Aspect, string> = {"9:16": "Social9x16", "1:1": "Social1x1", "4:5": "Social4x5", "16:9": "Social16x9"};

const Root: React.FC = () => (
  <>
    {(Object.keys(IDS) as Aspect[]).map((a) => (
      <Composition key={a} id={IDS[a]} component={SocialFilm} defaultProps={{aspect: a}}
        durationInFrames={DURATION_FRAMES} fps={FPS} width={LAYOUT[a].W} height={LAYOUT[a].H} />
    ))}
  </>
);
registerRoot(Root);
