// Standalone Remotion entry for the conference film: one composition per ratio, 900 frames at 30 fps.
import React from "react";
import {Composition, registerRoot} from "remotion";
import {ConfFilm} from "./ConfFilm";
import {SIZES, Ratio} from "./theme";
import {DURATION, FPS} from "./events";

// composition ids (literal, checked by render_all.ps1): "ConfL16x9" "ConfL9x16" "ConfL1x1" "ConfL4x5"
const Root: React.FC = () => (
  <>
    {(Object.keys(SIZES) as Ratio[]).map((r) => (
      <Composition key={r} id={SIZES[r].id} component={ConfFilm} defaultProps={{ratio: r}} durationInFrames={DURATION} fps={FPS} width={SIZES[r].W} height={SIZES[r].H} />
    ))}
  </>
);
registerRoot(Root);
