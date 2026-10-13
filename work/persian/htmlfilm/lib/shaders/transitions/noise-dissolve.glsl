// name: noise-dissolve
// family: dissolve
// behaviour: Organic noise dissolve: the new image grows through fractal noise blobs with a soft edge (seeded, deterministic).
// params: scale, softness
// source: native (persian-arts), MIT-compatible, written for pa-fx
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
uniform float scale; // = 5.0
uniform float softness; // = 0.12
vec4 transition(vec2 uv) { float n = fbm(uv * vec2(ratio, 1.0) * scale); float p = progress * (1.0 + softness * 2.0) - softness; float m = smoothstep(p - softness, p + softness, n); return mix(getToColor(uv), getFromColor(uv), m); }
