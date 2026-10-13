// name: displace-dissolve
// family: dissolve
// behaviour: Both images are pushed apart by a noise displacement field while crossfading (liquid shimmer).
// params: strength, scale
// source: native (persian-arts), MIT-compatible, written for pa-fx
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
uniform float strength; // = 0.08
uniform float scale; // = 4.0
vec4 transition(vec2 uv) { vec2 n = vec2(fbm(uv * scale + 3.1), fbm(uv * scale + 9.7)) - 0.5; float k = sin(progress * 3.14159) * strength; vec2 q = n * k * 2.0; return mix(getFromColor(uv + q), getToColor(uv - q), smoothstep(0.2, 0.8, progress)); }
