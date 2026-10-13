// name: swirl
// family: warp
// behaviour: Both images twist around the centre while crossfading (stronger at mid-transition).
// params: strength
// source: native (persian-arts), MIT-compatible, written for pa-fx
uniform float strength; // = 6.0
vec4 transition(vec2 uv) { vec2 c = uv - 0.5; c.x *= ratio; float r = length(c); float a = strength * sin(progress * 3.14159) * (1.0 - smoothstep(0.0, 0.9, r));
  float s = sin(a), co = cos(a); vec2 q = vec2(co * c.x - s * c.y, s * c.x + co * c.y); q.x /= ratio; q += 0.5; return mix(getFromColor(q), getToColor(q), smoothstep(0.35, 0.65, progress)); }
