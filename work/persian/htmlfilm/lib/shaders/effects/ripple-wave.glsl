// name: ripple-wave
// family: distortion
// behaviour: Concentric ripples radiate from the centre, damping with t.
// params: amplitude, frequency
// source: native (persian-arts)
uniform float amplitude; // = 0.02
uniform float frequency; // = 24.0

vec4 effect(vec2 uv) { vec2 c = uv - 0.5; c.x *= ratio; float r = length(c); float k = sin(r * frequency - t * 12.0) * amplitude * (1.0 - t) ; vec2 dir = r > 0.0001 ? normalize(c) : vec2(0.0); vec2 q = uv + dir * k * vec2(1.0 / ratio, 1.0); return getColor(q); }
