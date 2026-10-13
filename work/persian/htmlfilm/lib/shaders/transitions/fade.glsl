// name: fade
// family: fade
// behaviour: Plain crossfade.
// source: gl-transitions catalogue (MIT), https://github.com/gl-transitions/gl-transitions/blob/master/transitions/fade.glsl (author/licence lines below are the originals)
// Author: gre
// License: MIT
// Description: A linear crossfade between the two images
// Tags: fade, blend

vec4 transition (vec2 uv) {
  return mix(
    getFromColor(uv),
    getToColor(uv),
    progress
  );
}
