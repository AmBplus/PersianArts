import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {THEME} from "./theme";
import {Aspect, LAYOUT} from "./layout";
import {AUDIO_SRC, CUT_FRAMES} from "./motion";
import {ThemeFonts} from "./fonts";
import {LayoutCtx, SceneCount, SceneCta, SceneDaily, SceneHook, ScenePen, SceneSlow, Wipe} from "./scenes";

const SCENES = [SceneHook, SceneCount, ScenePen, SceneSlow, SceneDaily, SceneCta];
const WIPE_LEN = 5; // frames; the wipe completes exactly on the cut

export const SocialFilm: React.FC<{aspect: Aspect}> = ({aspect}) => {
  const L = LAYOUT[aspect];
  return (
    <ThemeFonts>
      <LayoutCtx.Provider value={L}>
        <AbsoluteFill style={{background: THEME.colors.bg[0], direction: "rtl"}}>
          {SCENES.map((S, i) => (
            <Sequence key={i} from={CUT_FRAMES[i]} durationInFrames={CUT_FRAMES[i + 1] - CUT_FRAMES[i]} layout="none">
              <S />
            </Sequence>
          ))}
          {SCENES.slice(1).map((_, i) => (
            <Sequence key={`w${i}`} from={CUT_FRAMES[i + 1] - WIPE_LEN} durationInFrames={WIPE_LEN} layout="none">
              <Wipe color={THEME.colors.bg[i + 1]} len={WIPE_LEN} />
            </Sequence>
          ))}
          {AUDIO_SRC ? <Audio src={staticFile(AUDIO_SRC)} /> : null}
        </AbsoluteFill>
      </LayoutCtx.Provider>
    </ThemeFonts>
  );
};
