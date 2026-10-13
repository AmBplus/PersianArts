// name: Dreamy
// family: warp
// behaviour: Dreamy wavy crossfade.
// source: gl-transitions catalogue (MIT), https://github.com/gl-transitions/gl-transitions/blob/master/transitions/Dreamy.glsl (author/licence lines below are the originals)
// Author: mikolalysenko
// License: MIT
// Description: A crossfade with a gentle wavy distortion
// Tags: wave, blend

vec2 offset(float progress, float x, float theta) {
  float phase = progress*progress + progress + theta;
  float shifty = 0.03*progress*cos(10.0*(progress+x));
  return vec2(0, shifty);
}
vec4 transition(vec2 p) {
  return mix(getFromColor(p + offset(progress, p.x, 0.0)), getToColor(p + offset(1.0-progress, p.x, 3.14)), progress);
}
