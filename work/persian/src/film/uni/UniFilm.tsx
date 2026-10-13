// Uni-admissions teaser film. One Sequence per beat-grid cut (see motion.ts CUT_BEATS), wipe between scenes,
// identical structure to film/social/SocialFilm.tsx. Timing is ratio-independent; only layout.ts differs per ratio.
import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {THEME} from "./theme";
import {Aspect, LAYOUT} from "./layout";
import {AUDIO_SRC, CUT_FRAMES} from "./motion";
import {ThemeFonts} from "./fonts";
import {LayoutCtx, UNI_SCENES} from "./scenes";

const WIPE_LEN = 5; // frames; the wipe completes exactly on the cut

export const UniFilm: React.FC<{aspect: Aspect}> = ({aspect}) => {
  const L = LAYOUT[aspect];
  return (
    <ThemeFonts>
      <LayoutCtx.Provider value={L}>
        <AbsoluteFill style={{background: THEME.colors.bg[0], direction: "rtl"}}>
          {UNI_SCENES.map(({Component: S}, i) => (
            <Sequence key={i} from={CUT_FRAMES[i]} durationInFrames={CUT_FRAMES[i + 1] - CUT_FRAMES[i]} layout="none">
              <S />
            </Sequence>
          ))}
          {UNI_SCENES.slice(1).map(({name}, i) => (
            <Sequence key={`w-${name}`} from={CUT_FRAMES[i + 1] - WIPE_LEN} durationInFrames={WIPE_LEN} layout="none">
              <Wipe color={THEME.colors.bg[i + 1]} len={WIPE_LEN} />
            </Sequence>
          ))}
          {AUDIO_SRC ? <Audio src={staticFile(AUDIO_SRC)} /> : null}
        </AbsoluteFill>
      </LayoutCtx.Provider>
    </ThemeFonts>
  );
};

/** Cut wipe: the next scene's paper colour sweeps across from the right (RTL page turn). */
const Wipe: React.FC<{color: string; len: number}> = ({color, len}) => {
  const f = useCurrentFrame();
  const p = Math.min(1, Math.max(0, f / len));
  const x = (1 - p) * 100;
  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, background: color, transform: `translateX(${x}%)`}} />
    </div>
  );
};
