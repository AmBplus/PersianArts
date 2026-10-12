// Loads the theme's two families and FAILS the render if a file is missing (no silent fallback, see m2 report).
import React from "react";
import {cancelRender, continueRender, delayRender, staticFile} from "remotion";
import {THEME} from "./theme";

let pending: Promise<void> | null = null;
const loadAll = () => {
  if (!pending) {
    pending = Promise.all(
      Object.entries(THEME.fonts.files).map(([family, file]) =>
        new FontFace(family, `url(${staticFile(file)})`, {weight: "100 900"}).load().then((f) => {
          document.fonts.add(f);
        }),
      ),
    ).then(() => undefined);
  }
  return pending;
};

export const ThemeFonts: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const [handle] = React.useState(() => delayRender("social-fonts"));
  React.useEffect(() => {
    loadAll().then(() => continueRender(handle), (err) => cancelRender(err));
  }, [handle]);
  return <>{children}</>;
};
