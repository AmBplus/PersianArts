// name: rgb-glitch
// family: glitch
// behaviour: RGB channel split plus horizontal scanline displacement bands; intensity peaks mid t (seeded).
// params: amount, bands
// source: native (persian-arts)
uniform float amount; // = 0.02
uniform float bands; // = 24.0

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21) + seed * 0.0137); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; } return s; }
vec4 effect(vec2 uv) { float k = sin(t * 3.14159); float row = floor(uv.y * bands); float off = (hash21(vec2(row, floor(t * 10.0))) - 0.5) * amount * 4.0 * k * step(0.7, hash21(vec2(row + 7.0, floor(t * 10.0))));
  vec2 u = uv + vec2(off, 0.0); float sp = amount * k; vec4 c = vec4(getColor(u + vec2(sp, 0.0)).r, getColor(u).g, getColor(u - vec2(sp, 0.0)).b, 1.0); c.rgb *= 1.0 - 0.08 * k * step(0.5, fract(uv.y * resolution.y * 0.5)); return c; }
