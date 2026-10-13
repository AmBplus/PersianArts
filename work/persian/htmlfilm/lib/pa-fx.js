/* pa-fx.js: deterministic WebGL2 image-transition / image-effect runner for html-films (no CDN, no dependency).
   Load: <script src="../lib/pa-fx.js"></script>; shaders: <script src="../lib/shaders/index.js"></script> (generated, registers PA.fx shaders), or fx.register(name, glsl, "transition"|"effect").
   Every call is a PURE function of its arguments (progress / t): no requestAnimationFrame, no Date, no state carried between frames,
   so capture.mjs can seek any frame in any order and get identical pixels (checked by `pa fx check`).
   API:
     const fx = PA.fx.create(canvas?, {width, height})            -> instance (own WebGL2 context)
     fx.transition({from, to, shader, progress, params, seed})     from/to: canvas | img | video | ImageBitmap (any size; drawn stretched to the canvas)
     fx.effect({source, shader, t, params, seed})                   single-image effect, t 0..1
     fx.info()                                                       -> {backend, renderer, vendor, version, width, height}
   Shader format (GL Transitions style, MIT): body defines `vec4 transition(vec2 uv)` using getFromColor(uv), getToColor(uv), progress, ratio, resolution, seed;
   `uniform float x; // = 0.5` comments give defaults, params {x: 0.7} override. Effects define `vec4 effect(vec2 uv)` with getColor(uv), t. */
(function () {
  const PRE = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D from, to;
uniform float progress, ratio, seed;
uniform vec2 resolution;
in vec2 vUv;
out vec4 outColor;
vec4 getFromColor(vec2 uv) { return texture(from, uv); }
vec4 getToColor(vec2 uv) { return texture(to, uv); }
vec4 getColor(vec2 uv) { return texture(from, uv); }
float t_ = 0.0;
`;
  const POST_T = "\nvoid main() { outColor = transition(vUv); }\n";
  const POST_E = "\nvoid main() { outColor = effect(vUv); }\n";
  const VERT = `#version 300 es
in vec2 pos; out vec2 vUv;
void main() { vUv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }`;
  const registry = {};
  const register = (name, src, kind) => { registry[name] = { name, src, kind: kind || "transition" }; };
  const parseUniforms = (src) => {
    const out = []; const re = /uniform\s+(float|int|bool|vec2|vec3|vec4)\s+(\w+)\s*;\s*\/\/\s*=\s*([^\n]+)/g; let m;
    while ((m = re.exec(src))) {
      const v = m[3].trim().replace(/^vec\d\(|\)$/g, "").split(",").map((x) => (x.trim() === "true" ? 1 : x.trim() === "false" ? 0 : parseFloat(x)));
      out.push({ type: m[1], name: m[2], def: v });
    }
    return out;
  };
  function create(canvasIn, opt) {
    opt = opt || {};
    const canvas = canvasIn || document.createElement("canvas");
    canvas.width = opt.width || canvas.width || 1080; canvas.height = opt.height || canvas.height || 1920;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("pa-fx: WebGL2 not available (headless: capture.mjs adds the SwiftShader flags)");
    const progs = {}; const tex = {};
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    function program(name) {
      if (progs[name]) return progs[name];
      const r = registry[name]; if (!r) throw new Error("pa-fx: unknown shader " + name);
      const fs = PRE + (r.kind === "effect" ? "#define t progress" + String.fromCharCode(10) : "") + r.src + (r.kind === "effect" ? POST_E : POST_T);
      const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return (progs[name] = { p, uniforms: parseUniforms(r.src), loc: {} });
    }
    const upload = (slot, src) => {
      if (!tex[slot]) { tex[slot] = gl.createTexture(); }
      gl.activeTexture(gl.TEXTURE0 + slot); gl.bindTexture(gl.TEXTURE_2D, tex[slot]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    function draw(name, a, b, prog, params, seed) {
      const P = program(name); gl.useProgram(P.p); gl.viewport(0, 0, canvas.width, canvas.height);
      upload(0, a); upload(1, b || a);
      const U = (n) => (P.loc[n] !== undefined ? P.loc[n] : (P.loc[n] = gl.getUniformLocation(P.p, n)));
      gl.uniform1i(U("from"), 0); gl.uniform1i(U("to"), 1);
      gl.uniform1f(U("progress"), prog); gl.uniform1f(U("ratio"), canvas.width / canvas.height); gl.uniform1f(U("seed"), seed || 0);
      gl.uniform2f(U("resolution"), canvas.width, canvas.height);
      for (const u of P.uniforms) {
        let v = params && params[u.name] !== undefined ? [].concat(params[u.name]) : u.def; const l = U(u.name); if (l === null) continue;
        const nc = { vec2: 2, vec3: 3, vec4: 4 }[u.type] || 1; if (v.length < nc) v = Array.from({ length: nc }, (_, i) => (v[i] !== undefined ? v[i] : v[0]));
        if (u.type === "float") gl.uniform1f(l, v[0]); else if (u.type === "int" || u.type === "bool") gl.uniform1i(l, v[0]);
        else if (u.type === "vec2") gl.uniform2f(l, v[0], v[1]); else if (u.type === "vec3") gl.uniform3f(l, v[0], v[1], v[2]); else gl.uniform4f(l, v[0], v[1], v[2], v[3]);
      }
      const pl = gl.getAttribLocation(P.p, "pos"); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(pl); gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return {
      canvas, gl,
      transition: (o) => { draw(o.shader, o.from, o.to, Math.min(1, Math.max(0, o.progress)), o.params, o.seed); return canvas; },
      effect: (o) => { draw(o.shader, o.source, o.source, Math.min(1, Math.max(0, o.t)), o.params, o.seed); return canvas; },
      compile: (name) => { program(name); return true; },
      info: () => { const e = gl.getExtension("WEBGL_debug_renderer_info"); const r = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        return { renderer: r, vendor: e ? gl.getParameter(e.UNMASKED_VENDOR_WEBGL) : "", version: gl.getParameter(gl.VERSION), backend: /swiftshader/i.test(r) ? "SwiftShader (CPU)" : /angle/i.test(r) ? "ANGLE " + r : r, width: canvas.width, height: canvas.height }; },
    };
  }
  const root = typeof window !== "undefined" ? window : globalThis;
  root.PA = root.PA || {};
  root.PA.fx = { create, register, registry, parseUniforms };
})();
