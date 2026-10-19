import * as THREE from 'three';
import { gsap } from 'gsap';
import * as Tone from 'tone';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

window.THREE = THREE;
window.gsap = gsap;
window.Tone = Tone;
window.FX = { EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoomEnvironment, BokehPass };
