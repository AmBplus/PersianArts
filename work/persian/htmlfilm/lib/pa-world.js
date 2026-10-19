/* pa-world.js — WebGL world kit for persian-arts films (three.js).
   Why this exists: the 2D canvas films (clips 1-2) could not produce atmosphere — flat fills, one light
   direction faked by gradients, no real depth. This kit renders an actual scene (geometry, PBR materials,
   shadows, fog, bloom, filmic grade) so the background reads as photography rather than as a drawing.

   Contract with capture.mjs: window.film.seek(t) is pure (same t => same frame), window.film.luma()
   returns mean luma of the rendered frame (the capture gate uses it because a WebGL canvas has no 2D context).

   Requires an import map in the film HTML:
     {"imports":{"three":"<rel>/three.module.js","three/addons/":"<rel>/examples/jsm/"}}
*/
import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
import {BokehPass} from "three/addons/postprocessing/BokehPass.js";

// ---------------------------------------------------------------- filmic grade
const GradeShader = {
  uniforms: {tDiffuse: {value: null}, uTime: {value: 0}, uGrain: {value: 0.05}, uVig: {value: 0.55}, uCA: {value: 0.0014}, uSat: {value: 1.04}, uLift: {value: 0.012}},
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig, uCA, uSat, uLift; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * uCA * (1.0 + r2 * 2.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      // saturation + a touch of lift so the blacks are not dead
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSat) + uLift;
      float vig = smoothstep(1.02, 0.28, length(d) * 1.26);
      col *= mix(1.0, vig, uVig);
      float n = hash(vUv * vec2(1920.0, 1080.0) + uTime * 91.7);
      col += (n - 0.5) * uGrain;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
};

// ---------------------------------------------------------------- engine
// `pr` = supersampling factor. The canvas is displayed at W x H but drawn at W*pr x H*pr, and the
// compositor box-downsamples it. That is 4x the fragments for pr=2 and the single biggest image-quality
// lever that does not change the delivered resolution.
export function init({W = 1080, H = 1920, pr = 1, fov = 40, exposure = 1.0, bloom = 0.55, bloomRes = 0.5, fog = 0.0011, fogColor = 0x0d1620, dof = null} = {}) {
  const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance"});
  renderer.setPixelRatio(pr);
  renderer.setSize(W, H, false);
  renderer.domElement.style.width = W + "px";
  renderer.domElement.style.height = H + "px";
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fogColor, fog);
  const camera = new THREE.PerspectiveCamera(fov, W / H, 1, 12000);

  const composer = new EffectComposer(renderer);
  composer.setSize(W * pr, H * pr);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(Math.round(W * pr * bloomRes), Math.round(H * pr * bloomRes)), bloom, 0.72, 0.68);
  composer.addPass(bloomPass);
  // Depth of field before bloom: a sharp frame with everything in focus reads as CG no matter how
  // good the shading is. `dof.focus` is a distance in scene units and can be re-keyed every frame.
  let bokeh = null;
  if (dof) {
    bokeh = new BokehPass(scene, camera, {focus: dof.focus ?? 1500, aperture: dof.aperture ?? 0.00012, maxblur: dof.maxblur ?? 0.012});
    composer.insertPass(bokeh, 1);
  }
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  const gl = renderer.getContext();
  return {
    W, H, pr, renderer, scene, camera, composer, grade, bloomPass, bokeh, gl,
    render(t) {
      grade.uniforms.uTime.value = t;
      composer.render();
    },
    luma() {
      // full-frame read, then a proper grid sample. A strided walk aliases with horizontal bands
      // (bright sky over dark ground) and reports a number the screenshot never had.
      const bw = renderer.domElement.width, bh = renderer.domElement.height;
      const px = new Uint8Array(4 * bw * bh);
      gl.readPixels(0, 0, bw, bh, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let s = 0, n = 0;
      for (let y = 0; y < bh; y += 6) {
        const row = y * bw * 4;
        for (let x = 0; x < bw; x += 6) {
          const i = row + x * 4;
          s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
          n++;
        }
      }
      return s / n;
    },
  };
}

// IBL from a real HDRI. This is the single largest realism lever available to a PBR scene: without an
// environment every surface is lit by 3-4 hand-placed lights and reads as plastic. CC0 sources:
// polyhaven.com (HDRIs) and ambientcg.com (PBR texture sets).
export async function environment(renderer, url, {intensity = 1} = {}) {
  const {RGBELoader} = await import("three/addons/loaders/RGBELoader.js");
  const tex = await new Promise((res, rej) => new RGBELoader().load(url, res, undefined, rej));
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  env.userData.intensity = intensity;
  pmrem.dispose();
  tex.dispose();
  return env;
}

// ---------------------------------------------------------------- sky
export function sky({top = 0x0a1220, mid = 0x2a4a5a, low = 0xffb066, sunDir = [-0.35, 0.22, -0.8], sunColor = [1.0, 0.72, 0.42], sunPower = 9.0, sunGain = 0.6, radius = 6000, clouds = 0, cloudColor = 0xf2f4f6, cloudShade = 0x6b7a86, cloudScale = 1.0, drift = 0.004} = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: {value: new THREE.Color(top)}, uMid: {value: new THREE.Color(mid)}, uLow: {value: new THREE.Color(low)},
      uSun: {value: new THREE.Vector3(...sunDir).normalize()}, uSunCol: {value: new THREE.Color(...sunColor)},
      uPower: {value: sunPower}, uGain: {value: sunGain},
      uClouds: {value: clouds}, uCloudCol: {value: new THREE.Color(cloudColor)}, uCloudShade: {value: new THREE.Color(cloudShade)},
      uCloudScale: {value: cloudScale}, uDrift: {value: drift}, uTime: {value: 0},
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uTop, uMid, uLow, uSun, uSunCol, uCloudCol, uCloudShade;
      uniform float uPower, uGain, uClouds, uCloudScale, uDrift, uTime;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.07; a *= 0.5; }
        return v;
      }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(uLow, uMid, smoothstep(0.500, 0.760, h));
        c = mix(c, uTop, smoothstep(0.720, 1.0, h));
        float s = pow(max(dot(d, normalize(uSun)), 0.0), uPower);
        c += uSunCol * s * uGain;
        c += uLow * 0.12 * exp(-abs(d.y) * 12.0);

        if (uClouds > 0.001 && d.y > 0.005) {
          // project the view ray onto a flat cloud deck, so the clouds have real perspective
          vec2 uv = (d.xz / max(d.y, 0.30)) * uCloudScale * 0.55 + vec2(uTime * uDrift, 0.0);
          float n = fbm(uv);
          float n2 = fbm(uv * 2.7 + 11.3);
          float mask = smoothstep(0.46, 0.80, n * 0.75 + n2 * 0.25);
          mask *= smoothstep(0.03, 0.30, d.y);            // dissolve at the horizon
          float lit = smoothstep(0.35, 0.95, n2);         // underside in shade, tops catching light
          vec3 cc = mix(uCloudShade, uCloudCol, lit);
          cc += uSunCol * s * 0.5 * lit;
          c = mix(c, cc, mask * uClouds);
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), mat);
  mesh.userData.setTime = (t) => { mat.uniforms.uTime.value = t; };
  return mesh;
}

// ---------------------------------------------------------------- procedural textures
export function canvasTexture(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// deterministic PRNG shared by every procedural surface
export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Soil: three scale bands (fine grain, mid clumps, coarse stones) on a warm base — the "material recipe"
// from palettes.md, generated once into a texture instead of being redrawn per frame.
export function soilTextures({size = 512, seed = 7, base = "#4b3729", light = "#7d6144", dark = "#22170f"} = {}) {
  const R = rng(seed);
  const color = canvasTexture(size, (g, S) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 5200; i++) { // band 1: fine grain
      const a = 0.05 + R() * 0.16;
      g.fillStyle = R() > 0.5 ? `rgba(120,96,70,${a})` : `rgba(20,12,8,${a})`;
      g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2);
    }
    for (let i = 0; i < 420; i++) { // band 2: clumps
      const r = 3 + R() * 10;
      const grd = g.createRadialGradient(R() * S, R() * S, 0, 0, 0, r);
      void grd;
      g.fillStyle = `rgba(${R() > 0.5 ? "96,76,54" : "26,18,12"},${0.10 + R() * 0.2})`;
      g.beginPath(); g.arc(R() * S, R() * S, r, 0, 6.2832); g.fill();
    }
    for (let i = 0; i < 90; i++) { // band 3: stones with a lit top edge and a contact shadow
      const x = R() * S, y = R() * S, rx = 8 + R() * 22, ry = rx * (0.55 + R() * 0.35), rot = R() * 3.14;
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = "rgba(10,7,5,0.45)";
      g.beginPath(); g.ellipse(2, 3, rx * 1.05, ry * 1.15, 0, 0, 6.2832); g.fill();
      const grd = g.createLinearGradient(0, -ry, 0, ry);
      grd.addColorStop(0, light); grd.addColorStop(0.55, "#4a3a2a"); grd.addColorStop(1, dark);
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.2832); g.fill();
      g.restore();
    }
  });
  const bump = canvasTexture(size, (g, S) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) {
      const v = Math.floor(90 + R() * 110);
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.fillRect(R() * S, R() * S, 1 + R() * 3, 1 + R() * 3);
    }
  });
  bump.colorSpace = THREE.NoColorSpace;
  return {color, bump};
}

// Soil strata: the texture a cutaway wall needs. Horizontal bands with irregular boundaries, embedded
// stones, root hairs and fissures — this is what makes a soil cross-section read as a section and not
// as a brown rectangle. Repeat is 1x1 by design: bands must not tile vertically.
export function soilStrata({size = 512, seed = 13, top = "#4a3626", bottom = "#231710", bandCount = 13} = {}) {
  const R = rng(seed);
  const color = canvasTexture(size, (g, S) => {
    const grd = g.createLinearGradient(0, 0, 0, S);
    grd.addColorStop(0, top); grd.addColorStop(1, bottom);
    g.fillStyle = grd; g.fillRect(0, 0, S, S);

    // bands: each a wobbly horizontal strip of its own tone
    for (let b = 0; b < bandCount; b++) {
      const y0 = (b / bandCount) * S + (R() - 0.5) * 8;
      const h = (S / bandCount) * (0.5 + R() * 0.9);
      const warm = R();
      const tone = warm > 0.62 ? `rgba(132,106,72,${0.07 + R() * 0.10})`
        : warm > 0.3 ? `rgba(78,58,40,${0.08 + R() * 0.11})`
          : `rgba(14,9,5,${0.08 + R() * 0.13})`;
      g.fillStyle = tone;
      g.beginPath();
      g.moveTo(0, y0);
      const steps = 14;
      // the band edge is periodic in x, so the texture tiles horizontally without a seam
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * S;
        g.lineTo(x, y0 + Math.sin((i / steps) * 12.566 + b) * 3 + Math.sin((i / steps) * 6.283 + b * 2.1) * 2);
      }
      for (let i = steps; i >= 0; i--) {
        const x = (i / steps) * S;
        g.lineTo(x, y0 + h + Math.sin((i / steps) * 12.566 + b * 3) * 3);
      }
      g.closePath(); g.fill();
    }

    // stones: lit top edge, contact shadow below — the single most important realism cue
    for (let i = 0; i < 120; i++) {
      const x = R() * S, y = R() * S, rx = 4 + R() * 15, ry = rx * (0.5 + R() * 0.4), rot = R() * 3.14;
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = "rgba(8,5,3,0.5)";
      g.beginPath(); g.ellipse(1, 2.5, rx * 1.08, ry * 1.2, 0, 0, 6.2832); g.fill();
      const sg = g.createLinearGradient(0, -ry, 0, ry);
      sg.addColorStop(0, "rgba(150,126,98,0.85)"); sg.addColorStop(0.5, "rgba(88,70,52,0.9)"); sg.addColorStop(1, "rgba(24,16,10,0.95)");
      g.fillStyle = sg;
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 6.2832); g.fill();
      g.restore();
    }

    // fine roots / hairs working their way through the section
    for (let i = 0; i < 26; i++) {
      let x = R() * S, y = R() * S;
      g.strokeStyle = `rgba(${190 + R() * 40 | 0},${168 + R() * 40 | 0},${120 + R() * 30 | 0},${0.14 + R() * 0.22})`;
      g.lineWidth = 0.6 + R() * 1.5;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 7; k++) {
        x += (R() - 0.5) * 26; y += 6 + R() * 20;
        g.lineTo(x, y);
      }
      g.stroke();
    }

    // fissures: near-black cracks, vertical, slightly wandering
    for (let i = 0; i < 9; i++) {
      let x = R() * S, y = R() * S * 0.7;
      g.strokeStyle = `rgba(0,0,0,${0.25 + R() * 0.3})`;
      g.lineWidth = 1 + R() * 2.2;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += (R() - 0.5) * 12; y += 10 + R() * 26; g.lineTo(x, y); }
      g.stroke();
    }

    // ambient-occlusion-ish darkening at the very top: the ceiling line is a hard cut otherwise
    const ao = g.createLinearGradient(0, 0, 0, S * 0.16);
    ao.addColorStop(0, "rgba(0,0,0,0.72)"); ao.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = ao; g.fillRect(0, 0, S, S * 0.16);

    // grain on top of everything, so the bands never look like vector shapes
    for (let i = 0; i < 14000; i++) {
      const a = 0.03 + R() * 0.1;
      g.fillStyle = R() > 0.5 ? `rgba(140,112,82,${a})` : `rgba(10,6,4,${a})`;
      g.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2);
    }
  });
  // bands tile horizontally (their edges are periodic) but must never tile vertically
  color.wrapS = THREE.RepeatWrapping; color.wrapT = THREE.ClampToEdgeWrapping;
  const bump = canvasTexture(size, (g, S) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 12000; i++) {
      const v = Math.floor(80 + R() * 120);
      g.fillStyle = `rgba(${v},${v},${v},0.45)`;
      g.fillRect(R() * S, R() * S, 1 + R() * 3, 1 + R() * 3);
    }
  });
  bump.colorSpace = THREE.NoColorSpace;
  bump.wrapS = THREE.RepeatWrapping; bump.wrapT = THREE.ClampToEdgeWrapping;
  return {color, bump};
}

// Dust motes: the cheapest, most reliable "this is a filmed space" cue. Additive points drifting in a
// light beam; motion is a pure function of t so seek() stays deterministic.
export function dustField({count = 260, area = [1200, 900, 1600], origin = [0, -300, 0], size = 9, color = 0xffe3bb, opacity = 0.55, speed = 26, seed = 31} = {}) {
  const R = rng(seed);
  const pos = new Float32Array(count * 3);
  const motes = [];
  for (let i = 0; i < count; i++) {
    const m = {
      x: (R() - 0.5) * area[0], y: (R() - 0.5) * area[1], z: (R() - 0.5) * area[2],
      ph: R() * 6.283, sp: 0.5 + R() * 1.4, sz: 0.35 + R() * 0.9,
    };
    motes.push(m);
    pos[i * 3] = origin[0] + m.x; pos[i * 3 + 1] = origin[1] + m.y; pos[i * 3 + 2] = origin[2] + m.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const sprite = canvasTexture(64, (g, S) => {
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.4, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
  });
  const mat = new THREE.PointsMaterial({
    map: sprite, color, size, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const attr = geo.attributes.position;
  return {
    mesh: points,
    update(t) {
      for (let i = 0; i < count; i++) {
        const m = motes[i];
        attr.setXYZ(i,
          origin[0] + m.x + Math.sin(t * 0.31 * m.sp + m.ph) * 22,
          origin[1] + ((m.y + t * speed * m.sp) % area[1]) - area[1] * 0.5,
          origin[2] + m.z + Math.cos(t * 0.24 * m.sp + m.ph) * 18);
      }
      attr.needsUpdate = true;
    },
    setOpacity(o) { mat.opacity = o; },
  };
}

// A leaf needs veins, or it is a green shape. UVs come from ShapeGeometry's bbox, so v=0.5 is the
// midrib and the lateral veins can be drawn from it.
export function leafTexture({size = 512, base = "#5f9b52", dark = "#2c5426", vein = "#a9cf8c", seed = 5} = {}) {
  const R = rng(seed);
  const t = canvasTexture(size, (g, S) => {
    const grd = g.createLinearGradient(0, 0, S, 0);
    grd.addColorStop(0, dark); grd.addColorStop(0.35, base); grd.addColorStop(0.85, base); grd.addColorStop(1, dark);
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    // mottling
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = R() > 0.5 ? `rgba(120,170,100,${0.02 + R() * 0.05})` : `rgba(24,52,20,${0.02 + R() * 0.06})`;
      g.beginPath(); g.arc(R() * S, R() * S, 2 + R() * 12, 0, 6.2832); g.fill();
    }
    // midrib
    g.strokeStyle = vein; g.globalAlpha = 0.55; g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke();
    // lateral veins, angled forward
    g.lineWidth = 1.6; g.globalAlpha = 0.42;
    for (let i = 1; i < 13; i++) {
      const x = (i / 13) * S;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(x, S / 2);
        g.quadraticCurveTo(x + S * 0.06, S / 2 + s * S * 0.14, x + S * 0.13, S / 2 + s * S * 0.30);
        g.stroke();
      }
    }
    g.globalAlpha = 1;
  });
  return t;
}

// ---------------------------------------------------------------- geometry helpers
// A leaf: a Shape extruded to nothing (flat) with a midrib groove, so it catches light at an angle.
export function leafGeometry(len = 1, wid = 0.36, cup = 0) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(len * 0.25, wid, len * 0.72, wid * 0.9, len, 0);
  s.bezierCurveTo(len * 0.72, -wid * 0.9, len * 0.25, -wid, 0, 0);
  const g = new THREE.ShapeGeometry(s, 24);
  // curl the leaf slightly across its width so it is never a flat cut-out
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, -Math.pow(Math.abs(y) / wid, 2) * len * (0.12 + cup) - Math.pow(x / len, 2) * len * 0.05);
  }
  // remap the raw x/y UVs to 0..1 over the leaf's own bbox
  const bb = new THREE.Box3().setFromBufferAttribute(p);
  const sx = bb.max.x - bb.min.x || 1, sy = bb.max.y - bb.min.y || 1;
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (p.getX(i) - bb.min.x) / sx, (p.getY(i) - bb.min.y) / sy);
  }
  uv.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

// Tube that grows: the full tube exists, a shader discards everything past uProgress along its length.
// Growth is then a single uniform write per frame (no geometry rebuild).
// `taper` (0..1) thins the far end — a stem that keeps one radius reads as a pipe, not a plant.
export function growTube(curve, {radius = 10, radial = 10, tubular = 96, material, taper = 0, shade = null} = {}) {
  const geo = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  if (taper > 0) {
    const p = geo.attributes.position;
    const c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= tubular; i++) {
      const along = i / tubular;
      curve.getPointAt(Math.min(0.9999, along), c);
      const k = 1 - taper * along * along;
      for (let j = 0; j <= radial; j++) {
        const idx = i * (radial + 1) + j;
        v.fromBufferAttribute(p, idx).sub(c).multiplyScalar(k).add(c);
        p.setXYZ(idx, v.x, v.y, v.z);
      }
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  }
  if (shade) {
    // dark at the base, bright at the tip: a single-colour stem has no direction
    const p = geo.attributes.position, uv = geo.attributes.uv;
    const a = new THREE.Color(shade.base), b = new THREE.Color(shade.tip), c = new THREE.Color();
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      c.copy(a).lerp(b, uv.getX(i));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }
  const u = {value: 1};
  const mat = material || new THREE.MeshStandardMaterial({color: 0x4f8f5e, roughness: 0.7});
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uProgress = u;
    sh.vertexShader = "varying float vAlong;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vAlong = uv.x;");
    sh.fragmentShader = "uniform float uProgress;\nvarying float vAlong;\n" + sh.fragmentShader.replace(
      "#include <clipping_planes_fragment>",
      "#include <clipping_planes_fragment>\n if (vAlong > uProgress) discard;"
    );
  };
  mat.customProgramCacheKey = () => "growTube";
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return {mesh, setProgress: (p) => { u.value = Math.max(0.0001, Math.min(1, p)); }};
}

// ---------------------------------------------------------------- meadow (alpha cards)
// A meadow built from thin geometric blades reads as a needle carpet: every blade has the same width,
// the same colour and a hard edge. What actually looks like grass is a TEXTURED CARD — several curved,
// tapered, colour-graded blades painted into one sprite, drawn on crossed quads. It is also cheaper
// (4 triangles per clump instead of 10) and it is what every game does.
export function grassTexture({size = 512, seed = 11, blades = 9, hue = 0} = {}) {
  const R = rng(seed);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const g = c.getContext("2d");
  g.clearRect(0, 0, size, size);
  const W = size, H = size;
  for (let i = 0; i < blades; i++) {
    const bx = W * (0.18 + R() * 0.64);
    const tipX = bx + (R() - 0.5) * W * 0.5;
    const tipY = H * (0.02 + R() * 0.30);
    const cx = bx + (R() - 0.5) * W * 0.22;
    const cy = H * (0.45 + R() * 0.25);
    const w0 = W * (0.012 + R() * 0.020);
    const dead = R() > 0.86;
    const steps = 18;
    const left = [], right = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const it = 1 - t;
      const px = it * it * bx + 2 * it * t * cx + t * t * tipX;
      const py = it * it * H + 2 * it * t * cy + t * t * tipY;
      const nx = 2 * it * (cx - bx) + 2 * t * (tipX - cx);
      const ny = 2 * it * (cy - H) + 2 * t * (tipY - cy);
      const len = Math.hypot(nx, ny) || 1;
      const w = w0 * Math.pow(1 - t, 0.75);
      left.push([px - (ny / len) * w, py + (nx / len) * w]);
      right.push([px + (ny / len) * w, py - (nx / len) * w]);
    }
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (const p of left) g.lineTo(p[0], p[1]);
    for (let k = right.length - 1; k >= 0; k--) g.lineTo(right[k][0], right[k][1]);
    g.closePath();
    const grd = g.createLinearGradient(0, H, 0, tipY);
    if (dead) {
      grd.addColorStop(0, "#3a3320"); grd.addColorStop(0.6, "#6b5f36"); grd.addColorStop(1, "#8d7c4c");
    } else {
      const h1 = 78 + hue, h2 = 92 + hue;
      grd.addColorStop(0, `hsl(${h1} 20% 11%)`);
      grd.addColorStop(0.45, `hsl(${h1} 24% 23%)`);
      grd.addColorStop(0.82, `hsl(${h2} 28% 36%)`);
      grd.addColorStop(1, `hsl(${h2 + 10} 30% 48%)`);
    }
    g.fillStyle = grd;
    g.fill();
    // a lit edge down one side: that highlight is what separates a blade from a silhouette
    g.strokeStyle = dead ? "rgba(200,186,140,0.25)" : "rgba(186,214,150,0.22)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(left[0][0], left[0][1]);
    for (const p of left) g.lineTo(p[0], p[1]);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// crossed quads, alpha-tested, wind-bent by uv.y, per-instance colour and scale
export function grassCards({count = 3000, area = 3000, height = 200, seed = 3, variants = 3, color = 0xffffff, width = 130, exclude = null, fade = null} = {}) {
  const R = rng(seed);
  const geo = new THREE.BufferGeometry();
  const verts = [], uvs = [], idx = [];
  for (const rot of [0, Math.PI / 2]) {
    const ca = Math.cos(rot), sa = Math.sin(rot);
    const base = verts.length / 3;
    for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]]) {
      verts.push(x * ca, y, x * sa);
      uvs.push(x + 0.5, y);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const meshes = [];
  for (let v = 0; v < variants; v++) {
    const tex = grassTexture({seed: seed + v * 37, blades: 8 + (v % 3), hue: v * 6});
    const mat = new THREE.MeshStandardMaterial({
      map: tex, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.92, metalness: 0,
      transparent: false,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = {value: 0};
      sh.uniforms.uFadeNear = {value: fade ? fade[0] : 1e9};
      sh.uniforms.uFadeFar = {value: fade ? fade[1] : 1e9};
      mat.userData.sh = sh;
      sh.vertexShader = "uniform float uTime;\nvarying vec3 vWPos;\n" + sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         float ph = instanceMatrix[3][0] * 0.06 + instanceMatrix[3][2] * 0.05;
         float bend = sin(uTime * 1.5 + ph) * 0.13 + sin(uTime * 0.7 + ph * 1.7) * 0.06;
         transformed.x += bend * pow(uv.y, 1.6);
         transformed.z += bend * 0.5 * pow(uv.y, 1.6);
         vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;`
      );
      // dissolve the field at its far edge: a hard line where the meadow stops, plus one card left
      // silhouetted against the sky, is the tell that this is a finite patch and not a landscape
      sh.fragmentShader = "varying vec3 vWPos;\nuniform float uFadeNear, uFadeFar;\n" + sh.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         diffuseColor.a *= 1.0 - smoothstep(uFadeNear, uFadeFar, distance(vWPos, cameraPosition));`
      );
    };
    const per = Math.ceil(count / variants);
    const mesh = new THREE.InstancedMesh(geo, mat, per);
    mesh.frustumCulled = false;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const base = new THREE.Color(color), c = new THREE.Color();
    for (let i = 0; i < per; i++) {
      p.set((R() - 0.5) * area, 0, (R() - 0.5) * area * 0.62);
      if (exclude) {
        // a bare patch: an impact ring hidden behind 15 cm of grass is not an impact ring
        const dx = p.x - exclude.x, dz = p.z - exclude.z;
        const d = Math.hypot(dx, dz);
        if (d < exclude.r) {
          const k = exclude.r / Math.max(d, 0.001);
          p.x = exclude.x + dx * k * (1.02 + R() * 0.5);
          p.z = exclude.z + dz * k * (1.02 + R() * 0.5);
        }
      }
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6.283);
      const h = height * (0.55 + R() * R() * 0.65);
      s.set(width * (0.7 + R() * 0.8), h, width * (0.7 + R() * 0.8));
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      c.copy(base).offsetHSL((R() - 0.5) * 0.03, (R() - 0.5) * 0.16, (R() - 0.5) * 0.26);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    meshes.push(mesh);
  }
  const group = new THREE.Group();
  meshes.forEach((m) => group.add(m));
  return {
    mesh: group,
    setTime: (t) => meshes.forEach((m) => { if (m.material.userData.sh) m.material.userData.sh.uniforms.uTime.value = t; }),
  };
}

// Grass: instanced blades on the top surface, each with its own lean and phase.
export function grassField({count = 2600, area = 2600, height = 90, seed = 3, color = 0x4f7a3e} = {}) {
  const R = rng(seed);
  const geo = new THREE.BufferGeometry();
  // one blade = a curved, tapering strip. A straight triangle at this size reads as a traffic cone;
  // the bend is what gives it a lit edge and a shaded side.
  const verts = [], idx = [], cols = [];
  const segs = 4;
  const bend = 0.34;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const w = 0.5 * (1 - Math.pow(u, 0.7)) + 0.03;
    const z = bend * u * u;
    verts.push(-w, u, z, w, u, z);
    // darker at the base where the light cannot reach, brighter at the tip
    const sh = 0.34 + 0.66 * Math.pow(u, 0.8);
    cols.push(sh, sh, sh, sh, sh, sh);
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  // white base: instanceColor supplies the actual green, so every blade can differ
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, vertexColors: true,
    emissive: 0x0e1808, emissiveIntensity: 1.0,   // tiny lift only; the IBL does the real work now
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = {value: 0};
    mat.userData.sh = sh;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float ph = instanceMatrix[3][0] * 0.7 + instanceMatrix[3][2] * 0.9;
       float sway = sin(uTime * 1.7 + ph) * 0.16 * position.y;
       transformed.x += sway;
       transformed.z += sway * 0.4;`
    );
  };
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  // per-blade colour variation: a field of one green is a texture, not a field
  const base = new THREE.Color(color), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    p.set((R() - 0.5) * area, 0, (R() - 0.5) * area * 0.6 - 200);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R() * 6.28);
    const h = height * (0.30 + R() * R() * 1.9);
    s.set(4 + R() * 5, h, 1);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
    c.copy(base).offsetHSL((R() - 0.5) * 0.06, (R() - 0.5) * 0.20, (R() - 0.5) * 0.30);
    mesh.setColorAt(i, c);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return {mesh, setTime: (t) => { if (mat.userData.sh) mat.userData.sh.uniforms.uTime.value = t; }};
}

// Rain: instanced streaks. Positions are deterministic per index, the fall is a pure function of t.
export function rainField({count = 900, area = 3200, top = 1600, bottom = 0, speed = 1500, seed = 11, opacity = 0.5} = {}) {
  const R = rng(seed);
  const geo = new THREE.PlaneGeometry(1.9, 62);
  const mat = new THREE.MeshBasicMaterial({color: 0xcfe3ef, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: true});
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const drops = [];
  for (let i = 0; i < count; i++) drops.push({x: (R() - 0.5) * area, z: (R() - 0.5) * area * 0.7, off: R() * (top - bottom), sp: speed * (0.7 + R() * 0.6), lean: (R() - 0.5) * 0.25});
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  const update = (t, camY = 0) => {
    const span = top - bottom;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      const y = top - ((d.off + t * d.sp) % span);
      p.set(d.x, y + camY * 0.0, d.z);
      e.set(0, 0, d.lean);
      q.setFromEuler(e);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return {mesh, update};
}

// Volumetric-ish shaft: a stack of additive cones with soft edges. Cheaper and softer than a real raymarch.
export function lightShaft({x = 0, y = 1200, z = -400, length = 2600, radiusTop = 40, radiusBottom = 420, color = 0xffd6a0, opacity = 0.16, segments = 24, rotZ = 0.18, rotX = 0} = {}) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, segments, 1, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: {uColor: {value: new THREE.Color(color)}, uOpacity: {value: opacity}, uTime: {value: 0}},
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vUv = uv;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position,1.0);
        vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      uniform vec3 uColor; uniform float uOpacity, uTime;
      void main(){
        float along = 1.0 - vUv.y;                 // 0 at the source, 1 at the far end
        // fade both ends: a hard rim at the source is what makes a shaft read as a glass cone
        float body = pow(1.0 - along, 1.5) * smoothstep(0.0, 0.16, along);
        // view-dependent softness: constant alpha across the silhouette is the other giveaway
        vec3 V = normalize(cameraPosition - vW);
        float facing = abs(dot(normalize(vN), V));
        float soft = pow(facing, 1.15);
        float flick = 0.92 + 0.08 * sin(uTime * 1.3 + vUv.y * 6.0);
        gl_FragColor = vec4(uColor, uOpacity * body * soft * flick);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotZ;
  mesh.rotation.x = rotX;
  return {mesh, setTime: (t) => { mat.uniforms.uTime.value = t; }};
}

// A soft contact shadow decal (radial alpha) to sit an object on a surface without a shadow map.
export function contactShadow({radius = 200, opacity = 0.5} = {}) {
  const tex = canvasTexture(128, (g, S) => {
    const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(0.55, "rgba(0,0,0,0.55)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
  });
  const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity, depthWrite: false});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export {THREE};
