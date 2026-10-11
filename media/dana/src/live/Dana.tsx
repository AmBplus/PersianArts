import React from "react";
import {AbsoluteFill, Sequence} from "remotion";
import {SCENES} from "./timing";
import {DanaFonts} from "./kit/fonts";
import {S0} from "./scenes/S0";
import {S1} from "./scenes/S1";
import {S2} from "./scenes/S2";
import {S3} from "./scenes/S3";
import {S4} from "./scenes/S4";
import {S5} from "./scenes/S5";
import {S6} from "./scenes/S6";
import {S7} from "./scenes/S7";

// v2 film: 8 scenes (S0..S7), absolute <Sequence from> positions from the v2 cue sheet.
export const SCENE_COMPONENTS: Record<string, React.FC> = {
  s0: S0, s1: S1, s2: S2, s3: S3, s4: S4, s5: S5, s6: S6, s7: S7,
};

export const Dana: React.FC = () => (
  <DanaFonts>
    <AbsoluteFill style={{background: "#000"}}>
      {SCENES.map((s) => {
        const C = SCENE_COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.frames} name={`${s.compId} ${s.id}`}>
            <C />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  </DanaFonts>
);
