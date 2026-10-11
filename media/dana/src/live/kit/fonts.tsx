// Font loading for the Dana film. Estedad and Noto Nastaliq Urdu are served from src/public/fonts
// (staticFile). The @font-face rules are declared in a <style>, and DanaFonts holds the frame with
// delayRender until document.fonts reports both faces ready, so no frame renders with a fallback font.
import React from "react";
import {continueRender, delayRender, staticFile} from "remotion";

export const FONT_FAMILIES = {
  estedad: {family: "Estedad", file: "fonts/Estedad-Variable.ttf", weight: "100 900"},
  nastaliq: {family: "Noto Nastaliq Urdu", file: "fonts/NotoNastaliqUrdu-Variable.ttf", weight: "400 700"},
} as const;

const fontFaceCss = Object.values(FONT_FAMILIES)
  .map(
    (f) =>
      `@font-face { font-family: "${f.family}"; src: url("${staticFile(f.file)}") format("truetype"); font-weight: ${f.weight}; font-style: normal; font-display: block; }`,
  )
  .join("\n");

const loadAll = () =>
  Promise.all(Object.values(FONT_FAMILIES).map((f) => document.fonts.load(`400 48px "${f.family}"`, "ابجد"))).then(
    () => document.fonts.ready,
  );

export const DanaFonts: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const [handle] = React.useState(() => delayRender("dana-fonts"));
  React.useEffect(() => {
    loadAll().then(
      () => continueRender(handle),
      (err) => {
        console.error("dana font load failed", err);
        continueRender(handle);
      },
    );
  }, [handle]);
  return (
    <>
      <style>{fontFaceCss}</style>
      {children}
    </>
  );
};
