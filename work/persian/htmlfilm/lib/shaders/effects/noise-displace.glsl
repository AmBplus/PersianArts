// name: noise-displace
// family: distortion
// behaviour: Heat-haze noise displacement that fades out with t.
// params: strength, scale
// source: native (persian-arts)
uniform float strength; // = 0.05
uniform float scale; // = 6.0

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
vec4 effect(vec2 uv) { vec2 n = vec2(fbm(uv * scale + t * 2.0), fbm(uv * scale + 5.2 - t * 2.0)) - 0.5; return getColor(uv + n * strength * (1.0 - t)); }
