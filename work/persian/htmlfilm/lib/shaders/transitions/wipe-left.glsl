// name: wipe-left
// family: wipe
// behaviour: Hard-edged wipe from right to left with a soft edge.
// params: softness
// source: native (persian-arts), MIT-compatible, written for pa-fx
uniform float softness; // = 0.04
vec4 transition(vec2 uv) { float e = 1.0 - progress; float m = smoothstep(e - softness, e + softness, uv.x * (1.0 - softness * 2.0) + softness); return mix(getFromColor(uv), getToColor(uv), m); }
