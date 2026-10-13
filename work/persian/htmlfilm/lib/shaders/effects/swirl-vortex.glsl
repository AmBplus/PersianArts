// name: swirl-vortex
// family: distortion
// behaviour: Vortex twist around the centre that unwinds as t goes 0 to 1 (t=0 twisted, t=1 clean).
// params: strength
// source: native (persian-arts)
uniform float strength; // = 7.0

vec4 effect(vec2 uv) { vec2 c = uv - 0.5; c.x *= ratio; float r = length(c); float a = strength * (1.0 - t) * (1.0 - smoothstep(0.0, 0.8, r)); float s = sin(a), co = cos(a); vec2 q = vec2(co * c.x - s * c.y, s * c.x + co * c.y); q.x /= ratio; return getColor(q + 0.5); }
