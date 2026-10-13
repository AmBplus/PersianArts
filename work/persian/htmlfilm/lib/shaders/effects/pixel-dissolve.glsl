// name: pixel-dissolve
// family: dissolve
// behaviour: Image breaks into blocks that turn to the background colour in random order (t 0 clean to 1 gone).
// params: block, bg
// source: native (persian-arts)
uniform float block; // = 48.0
uniform vec3 bg; // = vec3(0.05, 0.05, 0.08)

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
vec4 effect(vec2 uv) { vec2 g = floor(uv * vec2(block * ratio, block)); float r = hash21(g); float m = step(r, t * 1.15 - 0.075); vec4 c = getColor((g + 0.5) / vec2(block * ratio, block)); return mix(getColor(uv), vec4(bg, 1.0), m) * 1.0 + c * 0.0; }
