// Shared helpers of the type-assembly-moves Persian card (kept inside the card; the _fa kit is read-only).
import React from "react";
import {continueRender, delayRender} from "remotion";
import {G} from "../../_fixtures/Fixtures";
import {fs, FA_LH, type FaFamily} from "../../_fa";

/** Persian counterpart of the fixture TitleBlock: RTL, so the label sits at the top-RIGHT (mirror of left:120). */
export const FaTitle: React.FC<{text: string; family: FaFamily; weight?: number}> = ({text, family, weight = 800}) => (
  <div style={{position: "absolute", right: 120, top: 84}}>
    <div style={{fontFamily: `"${family}", "Vazirmatn", sans-serif`, fontWeight: weight, fontSize: fs(54), lineHeight: FA_LH, color: G.ink, letterSpacing: 0, textTransform: "none"}}>{text}</div>
  </div>
);

/** Blocks rendering until the given family is actually loaded (FaRoot/FaFonts adds the FontFace asynchronously). */
export const useFontLoaded = (family: string): boolean => {
  const [ok, setOk] = React.useState(false);
  const [handle] = React.useState(() => delayRender(`font-loaded:${family}`));
  React.useEffect(() => {
    let alive = true;
    const poll = () => {
      if (!alive) return;
      const hit = Array.from(document.fonts).some((f) => f.family.replace(/["']/g, "") === family && f.status === "loaded");
      if (hit) { setOk(true); } else { setTimeout(poll, 20); }
    };
    poll();
    return () => { alive = false; };
  }, [family]);
  React.useEffect(() => { if (ok) continueRender(handle); }, [ok, handle]);
  return ok;
};
