// Remotion CLI config for the Dana project. Same convention as work/persian/src/workbench/remotion.config.ts:
// symlinks:false so the node_modules junction resolves to one react/remotion instance.
import {Config} from "@remotion/cli/config";

Config.overrideWebpackConfig((c) => ({
  ...c,
  resolve: {...c.resolve, symlinks: false},
}));
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("angle");
Config.setConcurrency(4);
