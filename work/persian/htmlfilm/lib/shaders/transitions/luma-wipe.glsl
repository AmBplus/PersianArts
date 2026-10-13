// name: luma-wipe
// family: wipe
// behaviour: Luma/diagonal wipe driven by a procedural gradient + noise map (no texture needed).
// params: angle, softness
// source: native (persian-arts), MIT-compatible, written for pa-fx
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
uniform float angle; // = 0.6
uniform float softness; // = 0.15
vec4 transition(vec2 uv) { vec2 d = vec2(cos(angle), sin(angle)); float l = dot(uv - 0.5, d) + 0.5 + (vnoise(uv * 6.0) - 0.5) * 0.12; float p = progress * (1.0 + softness * 2.0) - softness; float m = smoothstep(p - softness, p + softness, l); return mix(getToColor(uv), getFromColor(uv), m); }
