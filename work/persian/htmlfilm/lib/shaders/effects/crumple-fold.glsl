// name: crumple-fold
// family: fold
// behaviour: Crumple-ish approximation: faceted fold lines displace and shade the image (paper look), relaxing as t goes 0 to 1.
// params: facets, depth
// source: native (persian-arts)
uniform float facets; // = 5.0
uniform float depth; // = 0.06

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
vec4 effect(vec2 uv) { vec2 g = uv * facets; vec2 id = floor(g); vec2 f = fract(g); float h = hash21(id); float h2 = hash21(id + 17.0); vec2 dir = vec2(h - 0.5, h2 - 0.5);
  float k = (1.0 - t); vec2 q = uv + dir * depth * k * (0.5 + f.x * f.y); float shade = 1.0 - (0.25 * (h - 0.5) + 0.1 * (f.x - 0.5)) * k; vec4 c = getColor(q); return vec4(c.rgb * shade, 1.0); }
