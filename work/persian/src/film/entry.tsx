import React from "react";
import {registerRoot, Composition} from "remotion";
import {PortraitProbe} from "./PortraitProbe";

const Root: React.FC = () => (
  <Composition id="PortraitProbe" component={PortraitProbe} durationInFrames={60} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
