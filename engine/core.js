// Shared visual language for every thought-experiment film.
// Scenes are pure functions of time t (seconds) so frames render deterministically.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };

// ---------------------------------------------------------------- palette
export const palette = {
  sky: 0xf3ebdd,
  ground: 0xe9dcc3,
  groundEdge: 0xd6c4a3,
  grass: 0xa9bf8e,
  tree: 0x7fa37a,
  trunk: 0x9a7453,
  rock: 0xc9bca6,
  rail: 0x5b606b,
  tie: 0x8a6b52,
  trolley: 0xe0674f,
  trolleyRoof: 0xf2e6d4,
  glass: 0x2f3a48,
  many: 0x5b7fa6,      // the five
  one: 0xe2a93b,       // the one
  agent: 0x3f8f86,     // driver / bystander — the person choosing
  judge: 0x7a5a8c,
  crowd: 0x8c4a4a,
  wood: 0xa7825f,
  stone: 0xe4dccd,
  ink: 0x2b2a33,
  hat: 0xf6f1e7,
};
export const css = (hex) => '#' + hex.toString(16).padStart(6, '0');

// ---------------------------------------------------------------- math / easing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
// ramp: 0 before a, 1 after b, smooth between
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
// window: fades in over [a, a+f], out over [b-f, b]
export const win = (t, a, b, f = 0.4) => Math.min(ramp(t, a, a + f), 1 - ramp(t, b - f, b));

export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------------------------------------------------------------- timeline
export class Timeline {
  constructor(data) {
    this.data = data;
    this.duration = data.duration;
    this.byId = Object.fromEntries(data.segments.map((s) => [s.id, s]));
  }
  seg(id) { const s = this.byId[id]; if (!s) throw new Error('no segment ' + id); return s; }
  s(id) { return this.seg(id).start; }
  e(id) { return this.seg(id).end; }
  // time at fraction k through segment id's narration
  at(id, k = 0) { const s = this.seg(id); return s.start + (s.end - s.start) * k; }
  p(id, t) { const s = this.seg(id); return clamp((t - s.start) / (s.end - s.start)); }
  // absolute time of a [[cue]] marker inside a segment's narration
  cue(id, name) { const c = this.seg(id).cues?.[name]; if (c === undefined) throw new Error(`no cue ${id}.${name}`); return c; }
}

// ---------------------------------------------------------------- stage
export function createStage(canvas, { width = 1920, height = 1080 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  scene.fog = new THREE.Fog(palette.sky, 60, 160);

  // Portrait keeps most of the landscape shot's horizontal view (so subjects stay framed) and gains height above and
  // below, instead of cropping the sides. PORTRAIT_KEEP = share of the landscape horizontal field of view kept.
  const portrait = height > width;
  const LAND_VFOV = 35, PORTRAIT_KEEP = 0.86;
  const landH = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(LAND_VFOV / 2)) * (16 / 9));
  const vfov = portrait ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan((landH * PORTRAIT_KEEP) / 2) / (width / height))) : LAND_VFOV;
  const camera = new THREE.PerspectiveCamera(vfov, width / height, 0.1, 500);

  const hemi = new THREE.HemisphereLight(0xfff6e8, 0xcdb89a, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-30, 50, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 6;
  const sc = sun.shadow.camera;
  sc.left = -60; sc.right = 60; sc.top = 60; sc.bottom = -60; sc.near = 1; sc.far = 200;
  scene.add(sun, sun.target);

  // Keep the shadow frustum centred on whatever the camera looks at.
  const lookTarget = new THREE.Vector3();
  function setCamera(pos, look) {
    camera.position.copy(pos);
    lookTarget.copy(look);
    camera.lookAt(look);
    sun.target.position.copy(look);
    sun.position.copy(look).add(new THREE.Vector3(-30, 50, 25));
  }

  return { renderer, scene, camera, sun, hemi, setCamera, lookTarget, render: () => renderer.render(scene, camera), width, height, portrait };
}

// ---------------------------------------------------------------- camera paths
// keys: [{t, pos:[x,y,z], look:[x,y,z]}] sorted by t; eased between neighbours, held otherwise.
export function cameraAt(keys, t, drift = 0.25) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
    if (t > keys[i + 1].t) { a = b = keys[i + 1]; }
  }
  if (t < keys[0].t) a = b = keys[0];
  const k = a === b ? 0 : easeInOut((t - a.t) / (b.t - a.t));
  const pos = new THREE.Vector3().fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos), k);
  const look = new THREE.Vector3().fromArray(a.look).lerp(new THREE.Vector3().fromArray(b.look), k);
  // gentle "breathing" so held shots never feel frozen
  pos.x += Math.sin(t * 0.31) * drift;
  pos.y += Math.sin(t * 0.23 + 1.3) * drift * 0.6;
  pos.z += Math.cos(t * 0.27) * drift;
  return { pos, look };
}

// ---------------------------------------------------------------- materials
const matCache = new Map();
export function clay(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.0, ...opts }));
  return matCache.get(key);
}

function shadowed(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
export function mesh(geo, mat) { return shadowed(new THREE.Mesh(geo, mat)); }

// Fade a whole group: clones its materials once so fades don't leak to other objects.
export function setOpacity(group, o) {
  if (!group.userData.fadeReady) {
    group.traverse((c) => {
      if (c.material) { c.material = c.material.clone(); c.material.transparent = true; c.userData.baseOpacity = c.material.opacity; }
    });
    group.userData.fadeReady = true;
  }
  group.visible = o > 0.001;
  group.traverse((c) => {
    if (c.material) { c.material.opacity = c.userData.baseOpacity * o; c.material.depthWrite = o > 0.99; c.castShadow = o > 0.5; }
  });
}

// ---------------------------------------------------------------- world kit
export function makeIsland({ radius = 46, color = palette.ground, rim = palette.groundEdge, seed = 7, decor = true } = {}) {
  const g = new THREE.Group();
  const top = mesh(new THREE.CylinderGeometry(radius, radius, 0.6, 96), clay(color));
  top.position.y = -0.3;
  top.castShadow = false;
  const base = mesh(new THREE.CylinderGeometry(radius - 0.2, radius - 3, 5, 96), clay(rim));
  base.position.y = -3.1;
  g.add(top, base);
  if (decor) {
    const rnd = seeded(seed);
    for (let i = 0; i < 60; i++) {
      const a = rnd() * Math.PI * 2, r = radius * (0.35 + rnd() * 0.58);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(z) < 16 && x > -64 && x < 30) continue; // keep the stage clear
      const item = rnd() < 0.7 ? makeTree(0.7 + rnd() * 0.8, rnd) : makeRock(0.5 + rnd() * 0.9, rnd);
      item.position.set(x, 0, z);
      item.rotation.y = rnd() * 6.28;
      g.add(item);
    }
  }
  return g;
}

export function makeTree(s = 1, rnd = Math.random) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 1.2 * s, 8), clay(palette.trunk));
  trunk.position.y = 0.6 * s;
  const shade = new THREE.Color(palette.tree).offsetHSL((rnd() - 0.5) * 0.04, 0, (rnd() - 0.5) * 0.08);
  const crown = mesh(new THREE.IcosahedronGeometry(1.1 * s, 1), clay(shade.getHex(), { flatShading: true }));
  crown.position.y = 1.9 * s;
  crown.scale.y = 1.2;
  g.add(trunk, crown);
  return g;
}

export function makeRock(s = 1, rnd = Math.random) {
  const r = mesh(new THREE.DodecahedronGeometry(0.6 * s, 0), clay(palette.rock, { flatShading: true }));
  r.scale.set(1, 0.6 + rnd() * 0.3, 0.8 + rnd() * 0.4);
  r.position.y = 0.15 * s;
  return r;
}

// A peg person: capsule body, round head, dot eyes. Faces +z by default.
export function makePerson({ color = palette.many, hat = false, scale = 1, robe = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  const bodyMat = clay(color);
  const torso = robe
    ? mesh(new THREE.ConeGeometry(0.55, 1.5, 24), bodyMat)
    : mesh(new THREE.CapsuleGeometry(0.34, 0.7, 8, 16), bodyMat);
  torso.position.y = robe ? 0.75 : 0.72;
  const head = mesh(new THREE.SphereGeometry(0.32, 24, 16), clay(0xf1d7bd));
  head.position.y = 1.72;
  const eyeMat = clay(palette.ink);
  for (const x of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), eyeMat);
    eye.position.set(x, 1.76, 0.29);
    body.add(eye);
  }
  body.add(torso, head);
  if (hat) {
    const h = mesh(new THREE.SphereGeometry(0.36, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(palette.hat));
    h.position.y = 1.82;
    const brim = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 24), clay(palette.hat));
    brim.position.y = 1.83;
    body.add(h, brim);
  }
  g.add(body);
  g.scale.setScalar(scale);
  g.userData.body = body;
  g.userData.head = head;
  return g;
}

// Idle life: a small bob + sway, phase-shifted per figure.
export function animatePerson(p, t, { phase = 0, energy = 1 } = {}) {
  const b = p.userData.body;
  b.position.y = Math.abs(Math.sin(t * 2.2 * energy + phase)) * 0.06 * energy;
  b.rotation.z = Math.sin(t * 1.1 + phase) * 0.04 * energy;
}

export function makeTrolley() {
  const g = new THREE.Group();
  const body = mesh(new RoundedBoxGeometry(4.4, 1.9, 1.8, 4, 0.28), clay(palette.trolley));
  body.position.y = 1.55;
  const roof = mesh(new RoundedBoxGeometry(4.6, 0.3, 1.95, 3, 0.12), clay(palette.trolleyRoof));
  roof.position.y = 2.6;
  const skirt = mesh(new RoundedBoxGeometry(4.2, 0.35, 1.7, 2, 0.1), clay(0x9c4a3b));
  skirt.position.y = 0.6;
  const stripe = mesh(new RoundedBoxGeometry(4.46, 0.16, 1.86, 2, 0.06), clay(palette.trolleyRoof));
  stripe.position.y = 1.35;
  g.add(body, roof, skirt, stripe);
  for (const x of [-2.3, 2.3]) {
    const bumper = mesh(new RoundedBoxGeometry(0.3, 0.3, 1.6, 2, 0.1), clay(palette.rail, { metalness: 0.4, roughness: 0.5 }));
    bumper.position.set(x, 0.7, 0);
    g.add(bumper);
  }
  // windows along both sides + windshield
  const glass = clay(palette.glass, { roughness: 0.25, metalness: 0.1 });
  for (const z of [-0.91, 0.91]) {
    for (let i = 0; i < 4; i++) {
      const w = mesh(new RoundedBoxGeometry(0.72, 0.62, 0.05, 2, 0.08), glass);
      w.position.set(-1.45 + i * 0.95, 1.9, z);
      g.add(w);
    }
  }
  const windshield = mesh(new RoundedBoxGeometry(0.05, 0.75, 1.3, 2, 0.08), glass);
  windshield.position.set(2.21, 1.9, 0);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe9a0, emissiveIntensity: 1.5 }));
  lamp.position.set(2.22, 1.05, 0);
  g.add(windshield, lamp);
  // pole
  const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), clay(palette.ink));
  pole.position.set(-0.8, 3.3, 0);
  pole.rotation.z = -0.7;
  g.add(pole);
  // wheels
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 20);
  wheelGeo.rotateX(Math.PI / 2);
  for (const x of [-1.4, 1.4]) for (const z of [-0.62, 0.62]) {
    const w = mesh(wheelGeo, clay(0x3a3d45));
    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.2), clay(0x7c808a));
    w.add(hub);
    w.position.set(x, 0.38, z);
    wheels.push(w); g.add(w);
  }
  // driver seen through the windshield
  const driver = makePerson({ color: palette.agent, scale: 0.62 });
  driver.position.set(1.55, 0.95, 0);
  driver.rotation.y = Math.PI / 2;
  g.add(driver);
  g.userData = { wheels, driver };
  return g;
}

// Rails + ties along any THREE.Curve lying in the xz-plane.
export function makeTrack(curve, { gauge = 1.2, tieEvery = 0.75, samples = 200 } = {}) {
  const g = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
      const n = new THREE.Vector3().crossVectors(up, tan).normalize();
      pts.push(p.clone().addScaledVector(n, (gauge / 2) * side).setY(0.2));
    }
    const rail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), samples, 0.07, 6), clay(palette.rail, { metalness: 0.4, roughness: 0.45 }));
    g.add(rail);
  }
  const len = curve.getLength();
  const count = Math.floor(len / tieEvery);
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.12, gauge + 0.7), clay(palette.tie), count);
  ties.castShadow = ties.receiveShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
    q.setFromAxisAngle(up, Math.atan2(-tan.z, tan.x));
    m.compose(new THREE.Vector3(p.x, 0.07, p.z), q, new THREE.Vector3(1, 1, 1));
    ties.setMatrixAt(i, m);
  }
  g.add(ties);
  // gravel bed
  const bed = [];
  for (let i = 0; i <= samples; i++) bed.push(curve.getPointAt(i / samples).setY(0));
  const shape = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bed), samples, 1.25, 8);
  shape.scale(1, 0.02, 1);
  shape.translate(0, 0.012, 0);
  const gravel = new THREE.Mesh(shape, clay(0xcbbda4));
  gravel.receiveShadow = true;
  g.add(gravel);
  g.userData.curve = curve;
  return g;
}

// A glowing ribbon that "draws" itself along a curve — used to show where the trolley would go.
export function makePathGlow(curve, color, { width = 0.35, samples = 160, y = 0.32 } = {}) {
  const pts = [];
  for (let i = 0; i <= samples; i++) pts.push(curve.getPointAt(i / samples).setY(y));
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), samples, width, 8);
  geo.scale(1, 0.15, 1);
  geo.translate(0, y * 0.85, 0);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, depthWrite: false });
  const m = new THREE.Mesh(geo, mat);
  const total = geo.index.count;
  m.userData.set = (progress, opacity) => {
    m.visible = opacity > 0.001 && progress > 0.001;
    mat.opacity = opacity;
    geo.setDrawRange(0, Math.floor(total * clamp(progress)));
  };
  m.userData.set(0, 0);
  return m;
}

export function makeLever() {
  const g = new THREE.Group();
  const base = mesh(new RoundedBoxGeometry(0.9, 0.4, 0.6, 2, 0.08), clay(palette.rail));
  base.position.y = 0.2;
  const pivot = new THREE.Group();
  pivot.position.y = 0.4;
  const arm = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10), clay(palette.ink));
  arm.position.y = 0.65;
  const knob = mesh(new THREE.SphereGeometry(0.16, 16, 12), clay(palette.trolley));
  knob.position.y = 1.32;
  pivot.add(arm, knob);
  g.add(base, pivot);
  g.userData.pivot = pivot;
  return g;
}

// ---------------------------------------------------------------- brand easter egg
// The series frog: appears in exactly one scene of every film (see PRODUCTION.md). Faces +z; ~1.2 units long.
export function makeFrog({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  const green = clay(0x6cbf4a), belly = clay(0xd9eeb0), dark = clay(palette.ink), white = clay(0xfffdf6);
  const torso = mesh(new THREE.SphereGeometry(0.5, 28, 18), green);
  torso.scale.set(1, 0.62, 1.1);
  torso.position.y = 0.33;
  const tummy = mesh(new THREE.SphereGeometry(0.42, 24, 14), belly);
  tummy.scale.set(0.95, 0.5, 0.9);
  tummy.position.set(0, 0.24, 0.16);
  body.add(torso, tummy);
  for (const s of [-1, 1]) {
    const bulb = mesh(new THREE.SphereGeometry(0.19, 20, 14), green);
    bulb.position.set(0.2 * s, 0.6, 0.26);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), white);
    eye.position.set(0.2 * s, 0.64, 0.36);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), dark);
    pupil.position.set(0.2 * s, 0.66, 0.47);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: 0xf2a38f }));
    cheek.position.set(0.3 * s, 0.4, 0.5);
    cheek.rotation.y = 0.5 * s;
    const thigh = mesh(new THREE.SphereGeometry(0.2, 16, 12), green);
    thigh.scale.set(0.8, 0.7, 1.3);
    thigh.position.set(0.42 * s, 0.16, -0.22);
    const hand = mesh(new THREE.SphereGeometry(0.09, 12, 10), green);
    hand.scale.set(1.3, 0.5, 1.4);
    hand.position.set(0.27 * s, 0.03, 0.42);
    body.add(bulb, eye, pupil, cheek, thigh, hand);
  }
  g.add(body);
  g.scale.setScalar(scale);
  g.userData.body = body;
  return g;
}

// Hop along ground points (a closed loop by default): arc + squash/stretch, turning to face each hop.
// With loop: false the frog hops once along the path (e.g. in from off-screen, around, and out again) and then waits.
export function animateFrog(frog, t, points, { hop = 0.42, rest = 0.9, height = 1.1, loop = true } = {}) {
  const cycle = hop + rest, n = points.length;
  let k = Math.floor(t / cycle), u = t / cycle - k;
  if (!loop && k >= n - 1) { k = n - 2; u = 1; }
  if (!loop && t < 0) { k = 0; u = 0; }
  const a = points[((k % n) + n) % n], b = points[(((k + 1) % n) + n) % n];
  const air = clamp(u * cycle / hop);                 // 0..1 while airborne, then 1 at rest
  const p = easeInOut(air);
  frog.position.set(lerp(a[0], b[0], p), Math.sin(Math.PI * air) * height, lerp(a[2], b[2], p));
  frog.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
  const land = u * cycle - hop;                        // time since touchdown
  const squash = air < 1 ? 1 + 0.18 * Math.sin(Math.PI * air) : 1 - 0.22 * Math.exp(-land * 9) * Math.cos(land * 20);
  frog.userData.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
}

// A grassy mound with a stone portal facing +x; things can emerge from it at (x, 0, z).
export function makeTunnel() {
  const g = new THREE.Group();
  const hill = mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), clay(palette.grass));
  hill.scale.set(7, 6.5, 12);
  hill.position.x = -7;
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, 2.6, 0, Math.PI, false);
  ringShape.lineTo(-2.6, -0.1); ringShape.lineTo(2.6, -0.1);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 1.9, Math.PI, 0, true);
  ringShape.holes.push(hole);
  const portal = mesh(new THREE.ExtrudeGeometry(ringShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 }), clay(palette.stone));
  portal.rotation.y = Math.PI / 2;
  portal.scale.y = 1.45;
  portal.position.set(-0.6, 0, 0);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(1.95, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1c1a20 }));
  dark.rotation.y = Math.PI / 2;
  dark.scale.y = 1.45;
  dark.position.set(-0.1, 0, 0);
  g.add(hill, portal, dark);
  return g;
}

// Deterministic particles: particle n is born at clock n/rate, so any frame can be rendered in isolation.
// spawn(n, birth, age, rnd) → { x, y, z, s, sx?, sy?, sz?, ry? } or null.
export function makeEmitter({ max = 256, rate, life, geometry, material, spawn, seed = 1 }) {
  const im = new THREE.InstancedMesh(geometry, material, max);
  im.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), e = new THREE.Euler();
  im.userData.update = (clock, gain = 1) => {
    let i = 0;
    const first = Math.ceil((clock - life) * rate), last = Math.floor(clock * rate);
    for (let n = Math.max(first, 0); n <= last && i < max; n++) {
      const birth = n / rate, age = clock - birth;
      const r = seeded(n * 7919 + seed * 104729);
      r(); r();
      const o = spawn(n, birth, age, r);
      if (!o || gain <= 0.001) continue;
      p.set(o.x, o.y, o.z);
      const s = o.s * gain;
      sc.set(s * (o.sx ?? 1), s * (o.sy ?? 1), s * (o.sz ?? 1));
      e.set(0, o.ry ?? 0, o.rz ?? 0);
      im.setMatrixAt(i++, m.compose(p, q.setFromEuler(e), sc));
    }
    im.count = i;
    im.instanceMatrix.needsUpdate = true;
  };
  return im;
}

// Translucent, shadowless copy of an object — for "what would happen" previews.
export function ghostify(obj, color, opacity = 0.4) {
  const g = obj.clone(true);
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.6, transparent: true, opacity, depthWrite: false });
  g.traverse((c) => { if (c.isMesh) { c.material = mat; c.castShadow = false; c.receiveShadow = false; } });
  g.userData.ghostMat = mat;
  g.userData.baseOpacity = opacity;
  g.userData.setOpacity = (o) => { mat.opacity = opacity * o; g.visible = o > 0.001; };
  return g;
}

// ---------------------------------------------------------------- overlay UI
// Everything textual lives in DOM so it stays crisp; the frame grabber captures it with the canvas.
export function createUI(root, stage) {
  const el = (cls, parent = root) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };
  const fade = el('fade');
  const labels = el('labels');
  const title = el('title-card');
  const lower = el('lower-third');
  const card = el('card');
  const quote = el('quote');
  const rewind = el('rewind');
  const note = el('note');
  const thumb = el('thumbcard');
  const caption = el('caption');
  const cache = new WeakMap();
  const setHTML = (node, html) => { if (cache.get(node) !== html) { node.innerHTML = html; cache.set(node, html); } };
  const show = (node, o, html) => {
    node.style.opacity = o.toFixed(3);
    node.style.visibility = o > 0.001 ? 'visible' : 'hidden';
    if (html !== undefined) setHTML(node, html);
  };
  const labelNodes = new Map();
  const v = new THREE.Vector3();
  return {
    fade: (o, color = '#f3ebdd') => { fade.style.background = color; show(fade, o); },
    title: (o, html) => { show(title, o, html); title.style.transform = `translate(-50%, calc(-50% + ${(1 - o) * 12}px))`; },
    lower: (o, html) => { show(lower, o, html); lower.style.transform = `translateX(${(1 - o) * -24}px)`; },
    card: (o, html) => { show(card, o, html); card.style.transform = `translate(-50%, calc(-50% + ${(1 - o) * 16}px))`; },
    quote: (o, html) => { show(quote, o, html); },
    // small aside in the top-right corner
    note: (o, html) => { show(note, o, html); note.style.transform = `translateY(${(1 - o) * -12}px)`; },
    // VHS-style rewind: washed-out colour, scanlines, a rolling tracking band, horizontal jitter
    rewind: (o, t = 0) => {
      const cv = stage.renderer.domElement;
      if (o <= 0.001) { show(rewind, 0); cv.style.filter = ''; cv.style.transform = ''; return; }
      const band = ((t * 1.7) % 1) * 1180 - 100;
      show(rewind, o, `<div class="band" style="top:${band.toFixed(0)}px"></div><div class="rw">◀◀&nbsp;REWIND</div>`);
      cv.style.filter = `saturate(${1 - 0.65 * o}) contrast(${1 + 0.2 * o}) brightness(${1 + 0.06 * o})`;
      cv.style.transform = `translateX(${(Math.sin(t * 97) * Math.sin(t * 23) * 9 * o).toFixed(1)}px)`;
    },
    thumb: (html, side = 'left') => { thumb.className = 'thumbcard ' + side; show(thumb, 1, `<div class="kicker">Thought experiment</div><div class="h">${html}</div>`); },
    caption: (text) => { show(caption, text ? 1 : 0, text ? `<span>${text}</span>` : ''); },
    // Pin a label to a 3D point (Vector3 or Object3D + offset).
    label: (id, o, html, target, offset = [0, 0, 0], cls = '') => {
      let n = labelNodes.get(id);
      if (!n) { n = el('label ' + cls, labels); labelNodes.set(id, n); }
      stage.camera.updateMatrixWorld();
      if (target.isObject3D) { target.updateWorldMatrix(true, false); target.getWorldPosition(v); } else v.copy(target);
      v.add(new THREE.Vector3(...offset)).project(stage.camera);
      const x = (v.x * 0.5 + 0.5) * stage.width, y = (-v.y * 0.5 + 0.5) * stage.height;
      // keep the pill inside the frame; its pointer still aims at the target (content first, so the width is current)
      setHTML(n, html);
      const half = n.offsetWidth / 2 || 0, m = 24;
      const cx = Math.min(Math.max(x, half + m), stage.width - half - m);
      n.style.left = cx + 'px'; n.style.top = y + 'px';
      n.style.setProperty('--ax', `${Math.max(-half + 22, Math.min(half - 22, x - cx)).toFixed(1)}px`);
      o = clamp(o);
      show(n, v.z < 1 ? o : 0, html);
      n.style.transform = `translate(-50%, -100%) scale(${0.85 + 0.15 * o})`;
    },
  };
}

// Captions: split narration into readable chunks, timed by character share within each segment.
export function captionAt(timeline, t, max = 96) {
  for (const s of timeline.data.segments) {
    if (t < s.start || t > s.end + 0.35) continue;
    // voiced parts (between [[markers]]) carry exact times; otherwise the whole segment is one span
    const spans = s.parts ?? [{ text: s.caption ?? s.text, start: s.start, end: s.end }];
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i], next = spans[i + 1];
      if (next && t >= next.start) continue;
      const chunks = splitCaption(sp.text, max);
      const total = chunks.reduce((a, c) => a + c.length, 0);
      let acc = sp.start;
      for (const c of chunks) {
        const d = ((sp.end - sp.start) * c.length) / total;
        if (t <= acc + d + 0.35) return c;
        acc += d;
      }
      return chunks[chunks.length - 1];
    }
  }
  return '';
}

// Sentences become caption chunks; long ones split at the comma nearest their middle,
// and short fragments are folded into their neighbour so nothing flashes by.
function splitCaption(text, max = 96, min = 28) {
  const sentences = (text.match(/[^.!?]+[.!?]+["”’]?|[^.!?]+$/g) || [text]).map((s) => s.trim()).filter(Boolean);
  const out = [];
  const split = (s) => {
    if (s.length <= max) return [s];
    // break at the punctuation (else the space) nearest the middle, never at either end, so both halves shrink
    const mid = s.length / 2, inner = (i) => i > 0 && i < s.length - 2;
    let best = -1;
    for (let i = 0; i < s.length; i++) if (/[,;—:]/.test(s[i]) && inner(i) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    if (best < 0) for (let i = 0; i < s.length; i++) if (s[i] === ' ' && inner(i) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    if (best < 0) return [s];
    return [...split(s.slice(0, best + 1).trim()), ...split(s.slice(best + 1).trim())];
  };
  for (const s of sentences) out.push(...split(s));
  for (let i = out.length - 1; i > 0; i--) {
    if (out[i].length < min && (out[i - 1] + ' ' + out[i]).length <= max + 20) { out[i - 1] += ' ' + out[i]; out.splice(i, 1); }
    else if (out[i - 1].length < min && (out[i - 1] + ' ' + out[i]).length <= max + 20) { out[i - 1] += ' ' + out[i]; out.splice(i, 1); }
  }
  return out;
}
