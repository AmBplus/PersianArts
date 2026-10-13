// name: circle-reveal
// family: reveal
// behaviour: A circle opens from the centre revealing the new image with a soft rim.
// params: softness
// source: native (persian-arts), MIT-compatible, written for pa-fx
uniform float softness; // = 0.03
vec4 transition(vec2 uv) { vec2 c = uv - 0.5; c.x *= ratio; float r = length(c); float R = progress * (0.5 * length(vec2(ratio, 1.0)) + softness); float m = smoothstep(R, R - softness, r); return mix(getFromColor(uv), getToColor(uv), m); }
