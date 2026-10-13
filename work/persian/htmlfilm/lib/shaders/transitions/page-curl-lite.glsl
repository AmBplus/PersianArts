// name: page-curl-lite
// family: fold
// behaviour: Page-turn approximation: a fold line sweeps right to left; the old page shows its darker back mirrored along the fold, the new image lies beneath.
// params: radius
// source: native (persian-arts), MIT-compatible, written for pa-fx
uniform float radius; // = 0.16
vec4 transition(vec2 uv) { float e = 1.0 - progress * (1.0 + radius); float x = uv.x - e;
  if (x < 0.0) return getFromColor(uv);
  if (x < radius) { float k = x / radius; vec4 back = getFromColor(vec2(e - x, uv.y)); return vec4(back.rgb * (0.55 + 0.35 * k), 1.0); }
  return getToColor(uv); }
