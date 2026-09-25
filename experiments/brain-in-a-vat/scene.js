// Brain in a Vat: Descartes (1641) for context, Putnam (1981) as the core, then his semantic answer and its critics.
// Every visual is a pure function of t; segment ids and [[cues]] come from script.json.
import {
  THREE, palette, css, clamp, lerp, smooth, easeOut, easeInOut, ramp, win, seeded,
  cameraAt, clay, mesh, setOpacity, makeIsland, makeTree, makePerson, animatePerson,
  makeEmitter, makeFrog, animateFrog, makeTable, makeBench, makeHouse,
} from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const D = V(220, 0, 0);            // Descartes' study lives on its own island
const WORLD_POS = V(0, 11, 0);     // the experienced world floats above the lab
const WORLD_SCALE = 0.22;
const BRAIN_POS = V(0, 3.62, 0);
const COMPUTER_POS = V(-5.6, 0, -1.4);

// ---------------------------------------------------------------- props specific to this film
export function makeBrain() {
  const g = new THREE.Group();
  const mat = clay(0xf58e9f, { roughness: 0.6, emissive: 0x7a2a3a, emissiveIntensity: 0.25 });
  for (const s of [-1, 1]) {
    const geo = new THREE.IcosahedronGeometry(0.5, 5);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = v.clone().normalize();
      // gyri: interfering folds, deeper towards the sides
      const fold = Math.sin(13 * v.x + 4 * Math.sin(9 * v.z)) * Math.sin(12 * v.y + 3 * Math.cos(8 * v.x)) + 0.5 * Math.sin(17 * v.z + 5 * v.y);
      v.addScaledVector(n, 0.035 * fold);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const h = mesh(geo, mat);
    h.scale.set(0.82, 0.78, 1.15);
    h.position.x = 0.21 * s;
    g.add(h);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.5, 12), mat);
  stem.position.set(0, -0.42, -0.2);
  stem.rotation.x = 0.35;
  g.add(stem);
  return g;
}

export function makeVat() {
  const g = new THREE.Group();
  const metal = clay(0x8b909a, { metalness: 0.5, roughness: 0.35 });
  const base = mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.36, 40), metal);
  base.position.y = 0.18;
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 2.0, 40),
    new THREE.MeshStandardMaterial({ color: 0x9fe0c6, emissive: 0x3fae8e, emissiveIntensity: 0.25, transparent: true, opacity: 0.42, roughness: 0.2, depthWrite: false }));
  fluid.position.y = 0.36 + 1.0;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.45, 40, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 }));
  glass.position.y = 0.36 + 1.22;
  const cap = mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.24, 40), metal);
  cap.position.y = 0.36 + 2.45 + 0.1;
  const ring = mesh(new THREE.TorusGeometry(1.16, 0.06, 10, 40), metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.36 + 1.02;
  g.add(base, fluid, glass, cap, ring);
  g.renderOrder = 2;
  return g;
}

export function makeComputer() {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(2.8, 4.2, 1.5), clay(0x8a929e));
  body.position.y = 2.1;
  const trim = mesh(new THREE.BoxGeometry(2.9, 0.18, 1.6), clay(0x5d6470));
  trim.position.y = 4.25;
  g.add(body, trim);
  // screen: scrolling green text on a dark panel
  const cvs = document.createElement('canvas');
  cvs.width = 256; cvs.height = 512;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#0f2a2b'; ctx.fillRect(0, 0, 256, 512);
  const r = seeded(4);
  for (let y = 10; y < 512; y += 14) {
    ctx.fillStyle = r() < 0.2 ? '#f2b35c' : '#6fe0b8';
    let x = 12;
    while (x < 230) { const w = 6 + r() * 40; if (r() < 0.8) ctx.fillRect(x, y, w, 5); x += w + 8; }
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 0.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 3.15, 0.76);
  g.add(screen);
  // tape reels
  const reels = [];
  for (const x of [-0.55, 0.55]) {
    const reel = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24), clay(0x2b2a33));
    reel.rotation.x = Math.PI / 2;
    reel.position.set(x, 1.95, 0.77);
    const hub = mesh(new THREE.BoxGeometry(0.5, 0.06, 0.1), clay(0xdcd6cb));
    hub.position.z = 0.02; hub.rotation.x = -Math.PI / 2;
    reel.add(hub);
    reels.push(reel); g.add(reel);
  }
  // blinking lights
  const lights = [];
  const cols = [0xe0674f, 0xe2a93b, 0x3f8f86, 0x6fe0b8];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.MeshStandardMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 0 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), m);
    l.position.set(-0.9 + (i % 6) * 0.36, 1.05 - Math.floor(i / 6) * 0.26, 0.77);
    lights.push(l); g.add(l);
  }
  g.userData = { tex, reels, lights };
  return g;
}

function makeScientist() {
  const p = makePerson({ color: 0xf4f1ea });
  const goggles = mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24), clay(palette.ink));
  goggles.rotation.x = Math.PI / 2; goggles.position.y = 1.78;
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.06), new THREE.MeshStandardMaterial({ color: 0xe0674f, emissive: 0xe0674f, emissiveIntensity: 0.6 }));
  lens.position.set(0, 1.79, 0.3);
  p.userData.body.add(goggles, lens);
  return p;
}

function makeDemon() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6b4a9c, emissive: 0x4a2a7a, emissiveIntensity: 0.6, transparent: true, opacity: 0.8, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 24, 1, true), mat);
  body.position.y = -0.2; body.rotation.x = Math.PI;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), mat);
  head.position.y = 1.35;
  g.add(body, head);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 10), mat);
    horn.position.set(0.28 * s, 1.8, 0); horn.rotation.z = -0.4 * s;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb259 }));
    eye.position.set(0.17 * s, 1.4, 0.44);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.9, 6, 10), mat);
    arm.position.set(0.85 * s, 0.6, 0.35); arm.rotation.set(0.9, 0, 0.9 * s);
    g.add(horn, eye, arm);
  }
  return g;
}

// ---------------------------------------------------------------- build
export default function build({ stage, ui, tl }) {
  const { scene } = stage;
  stage.camera.near = 0.04; stage.camera.updateProjectionMatrix();

  // ================================================================ the lab (what is really there)
  const lab = new THREE.Group();
  scene.add(lab);
  lab.add(makeIsland({ radius: 30, seed: 12 }));
  const floor = mesh(new THREE.CylinderGeometry(11, 11, 0.08, 64), clay(0xe7e2d8));
  floor.position.y = 0.04; floor.castShadow = false;
  lab.add(floor);
  const table = makeTable({ w: 4.4, d: 2.6 });
  lab.add(table);
  const vat = makeVat();
  vat.position.y = table.userData.top;
  lab.add(vat);
  const brain = makeBrain();
  brain.position.copy(BRAIN_POS);
  brain.scale.setScalar(1.15);
  lab.add(brain);
  const computer = makeComputer();
  computer.position.copy(COMPUTER_POS);
  computer.rotation.y = 0.85;
  lab.add(computer);
  const scientist = makeScientist();
  scientist.position.set(-2.3, 0, 2.3);
  scientist.rotation.y = -2.3;
  lab.add(scientist);

  // cables: computer → through the lid → brain
  const cablePorts = [[-0.75, 3.9], [-0.25, 3.6], [0.25, 3.3], [0.75, 3.0]];
  const cables = cablePorts.map(([dx, h], i) => {
    const start = V(COMPUTER_POS.x, 0, COMPUTER_POS.z).add(V(Math.cos(0.85) * dx * 0.8 + Math.sin(0.85) * 0.75, h, -Math.sin(0.85) * dx * 0.8 + Math.cos(0.85) * 0.75));
    const end = BRAIN_POS.clone().add(V((i - 1.5) * 0.14, 0.32, -0.05));
    const lid = V((i - 1.5) * 0.18, 5.25, 0);
    const curve = new THREE.CatmullRomCurve3([start, start.clone().add(V(0.8, 0.9 + i * 0.2, 0.4)), V(-2.2, 6.6 + i * 0.15, -0.4 + i * 0.1), lid.clone().add(V(0, 0.9, 0)), lid, end]);
    const tube = mesh(new THREE.TubeGeometry(curve, 80, 0.045, 8), clay(i % 2 ? palette.agent : palette.ink));
    lab.add(tube);
    return curve;
  });
  // signal pulses travel down the cables once the computer is "feeding" the brain
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x9ff5d6 });
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), pulseMat, 24);
  pulses.frustumCulled = false;
  lab.add(pulses);

  // bubbles in the vat
  const bubbles = makeEmitter({
    rate: 7, life: 2.6, max: 24, seed: 9,
    geometry: new THREE.SphereGeometry(1, 10, 8),
    material: new THREE.MeshStandardMaterial({ color: 0xe9fff6, transparent: true, opacity: 0.6, roughness: 0.1 }),
    spawn: (n, b, age, r) => {
      const a = r() * 6.28, rad = 0.3 + r() * 0.62;
      return { x: Math.cos(a) * rad + Math.sin(age * 3 + n) * 0.05, y: table.userData.top + 0.45 + age * 0.72, z: Math.sin(a) * rad, s: 0.035 + r() * 0.05 };
    },
  });
  lab.add(bubbles);

  // the thought-beam: from the brain up to the world it experiences
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x3fae8e, transparent: true, opacity: 0.04, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const beamH = WORLD_POS.y - 0.9 - (BRAIN_POS.y + 0.5);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 0.35, beamH, 40, 1, true), beamMat);
  beam.position.set(0, BRAIN_POS.y + 0.5 + beamH / 2, 0);
  lab.add(beam);
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 48), new THREE.MeshBasicMaterial({ color: 0x9ff5d6, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; lab.add(m); return m;
  });

  // ================================================================ the experienced world (floating, scaled down)
  const world = new THREE.Group();
  world.position.copy(WORLD_POS);
  world.scale.setScalar(WORLD_SCALE);
  lab.add(world);
  world.add(makeIsland({ radius: 22, seed: 5 }));
  const house = makeHouse();
  house.position.set(-6, 0, -5); house.rotation.y = 0.5;
  world.add(house);
  const bench = makeBench();
  bench.position.set(2, 0, 1.6); bench.rotation.y = -0.3;
  world.add(bench);
  const you = makePerson({ color: palette.agent });
  you.position.set(2, 0.35, 1.75); you.rotation.y = -0.3;
  world.add(you);
  const shade = makeTree(1.5, seeded(3));
  shade.position.set(4.6, 0, 0.2);
  world.add(shade);
  const rw = seeded(21);
  for (let i = 0; i < 9; i++) {
    const tr = makeTree(0.8 + rw() * 0.7, rw);
    const a = rw() * 6.28, rr = 9 + rw() * 9;
    tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr - 2);
    world.add(tr);
  }
  // little flowers: tiny, in three colours, scattered in the meadow
  const fm = new THREE.Matrix4();
  for (const [col, cnt] of [[0xfff6e6, 18], [0xf2c14e, 14], [0xf2a38f, 14]]) {
    const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), clay(col), cnt);
    for (let i = 0; i < cnt; i++) { fm.makeTranslation(-4 + rw() * 12, 0.06, 2.5 + rw() * 6); fl.setMatrixAt(i, fm); }
    world.add(fl);
  }
  // an image of a vat, on a little table in the world: what the brain's word "vat" would be about
  const imgTable = makeTable({ w: 3, d: 1.8, h: 1.5 });
  imgTable.position.set(7.5, 0, -3.5); imgTable.rotation.y = -0.4;
  world.add(imgTable);
  const imgVat = makeVat();
  imgVat.scale.setScalar(0.6);
  imgVat.position.set(7.5, 1.6, -3.5);
  world.add(imgVat);

  // "refers to" line: from the brain to the image of a vat
  // routed out past the island's rim and in from above, so it never pierces the floating world
  const refCurve = new THREE.CubicBezierCurve3(BRAIN_POS.clone().add(V(0.5, 0.4, 0.2)), V(6.5, 6.5, 3.5), V(7.5, WORLD_POS.y + 3, 1.5), V(1.65, WORLD_POS.y + 0.62, -0.77));
  const refMat = new THREE.MeshBasicMaterial({ color: palette.trolley, transparent: true, opacity: 0.9, depthWrite: false });
  const refGeo = new THREE.TubeGeometry(refCurve, 60, 0.04, 6);
  const refLine = new THREE.Mesh(refGeo, refMat);
  lab.add(refLine);

  // the frog — hops across the lab floor during the thinking pause only
  const frog = makeFrog({ scale: 0.9 });
  lab.add(frog);
  const FROG_PATH = [[13, 0, 7.5], [10.8, 0, 6.4], [8.6, 0, 5.2], [6.4, 0, 4.2], [4.6, 0, 3.4], [5.8, 0, 5.4], [8, 0, 6.2], [10.4, 0, 7], [12.8, 0, 8], [15.4, 0, 9]];

  // ================================================================ Descartes' study
  const study = new THREE.Group();
  study.position.copy(D);
  scene.add(study);
  study.add(makeIsland({ radius: 16, seed: 2, decor: false }));
  const boards = mesh(new THREE.CylinderGeometry(9, 9, 0.08, 48), clay(0xb89572));
  boards.position.y = 0.04; boards.castShadow = false;
  study.add(boards);
  const wallMat = clay(0xe9dcc3);
  const wallBack = mesh(new THREE.BoxGeometry(12, 5.5, 0.4), wallMat);
  wallBack.position.set(0, 2.75, -4);
  const wallSide = mesh(new THREE.BoxGeometry(0.4, 5.5, 8), wallMat);
  wallSide.position.set(-6, 2.75, 0);
  study.add(wallBack, wallSide);
  const hearth = mesh(new THREE.BoxGeometry(3.2, 2.6, 0.9), clay(0xa89c8c));
  hearth.position.set(2.2, 1.3, -3.55);
  const mantle = mesh(new THREE.BoxGeometry(3.8, 0.25, 1.1), clay(0x8a6b52));
  mantle.position.set(2.2, 2.7, -3.5);
  const opening = mesh(new THREE.BoxGeometry(1.8, 1.4, 0.3), clay(0x2b2320));
  opening.position.set(2.2, 0.75, -3.05);
  study.add(hearth, mantle, opening);
  const flames = [0, 1, 2].map((i) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.22 - i * 0.03, 0.8 - i * 0.12, 10), new THREE.MeshStandardMaterial({ color: 0xffc36b, emissive: 0xff8a3d, emissiveIntensity: 2.2 }));
    f.position.set(1.8 + i * 0.4, 0.45, -2.95); study.add(f); return f;
  });
  const fireLight = new THREE.PointLight(0xff9a4d, 18, 12, 1.6);
  fireLight.position.set(2.2, 1.2, -2.2);
  study.add(fireLight);
  const chair = new THREE.Group();
  const upholstery = clay(0x8c4a4a);
  const seat = mesh(new RoundedBoxGeometryFallback(1.6, 0.5, 1.5), upholstery); seat.position.y = 0.55;
  const back = mesh(new RoundedBoxGeometryFallback(1.6, 1.7, 0.35), upholstery); back.position.set(0, 1.35, -0.6);
  chair.add(seat, back);
  for (const s of [-1, 1]) { const arm = mesh(new RoundedBoxGeometryFallback(0.3, 0.6, 1.4), upholstery); arm.position.set(0.8 * s, 0.95, 0); chair.add(arm); }
  chair.position.set(-0.4, 0, -0.2); chair.rotation.y = 0.55;
  study.add(chair);
  const descartes = makePerson({ color: palette.judge });
  descartes.position.set(-0.35, 0.45, -0.05); descartes.rotation.y = 0.55;
  study.add(descartes);
  const desk = makeTable({ w: 2.2, d: 1.2, h: 1.3, color: 0x8a6b52 });
  desk.position.set(-3.6, 0, 0.6); desk.rotation.y = 0.3;
  study.add(desk);
  const book = mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), clay(0x7a5a8c));
  book.position.set(-3.6, 1.48, 0.6); book.rotation.y = 0.5;
  const candle = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 10), clay(0xfff6e6));
  candle.position.set(-3.1, 1.62, 0.35);
  const candleFlame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  candleFlame.position.set(-3.1, 1.88, 0.35);
  study.add(book, candle, candleFlame);
  const demon = makeDemon();
  demon.position.set(-1.2, 3.0, -2.2);
  study.add(demon);
  // strings from the demon's hands to Descartes and the room
  const stringTargets = [descartes.position.clone().add(V(0, 1.85, 0)), V(2.2, 2.8, -3.2), V(-3.6, 1.6, 0.6), V(-0.4, 2.2, -0.8)];
  const strings = stringTargets.map((tgt, i) => {
    const hand = V(-1.2 + (i % 2 ? 0.95 : -0.95), 3.3, -1.7);
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(hand, tgt), 1, 0.012, 4), new THREE.MeshBasicMaterial({ color: 0xc9a8ff, transparent: true, opacity: 0 }));
    study.add(m); return m;
  });

  // ================================================================ timing
  const hookEnd = tl.s('title') - 0.35;
  const cutLab = (tl.e('demon') + tl.s('bridge')) / 2;
  const pauseEnd = tl.s('argument') - 0.3;
  const endCard = tl.e('outro') + 0.4;
  const inLab = (t) => t < hookEnd || t >= cutLab;
  const glitchAmt = (t) => (t < hookEnd ? ramp(t, tl.s('hook3') + 0.4, tl.s('hook4')) * (0.35 + 0.65 * (Math.sin(t * 7.3) > 0.55 ? 1 : 0)) : 0);

  // ---------------------------------------------------------------- camera
  const W = (x, y, z) => WORLD_POS.clone().add(V(x, y, z).multiplyScalar(WORLD_SCALE));   // world-local → lab coords
  const Dp = (x, y, z) => [D.x + x, D.y + y, D.z + z];
  const S = {
    // hook — inside the experienced world, then the pull-back reveal
    h1: (t) => cameraAt([{ t: 0, pos: [...W(8.5, 2.6, 11).toArray()], look: [...W(2, 1.4, 1.6).toArray()] }, { t: tl.s('hook2'), pos: [...W(6.5, 2.2, 9).toArray()], look: [...W(2, 1.3, 1.6).toArray()] }], t, 0.02),
    h2: (t) => cameraAt([{ t: tl.s('hook2') - 0.2, pos: [...W(0.5, 1.6, 7).toArray()], look: [...W(-5, 2, -4.5).toArray()] }, { t: tl.s('hook3'), pos: [...W(-1.5, 1.8, 6.5).toArray()], look: [...W(-5.5, 2, -4.5).toArray()] }], t, 0.02),
    h3: (t) => cameraAt([{ t: tl.s('hook3') - 0.1, pos: [...W(3, 3, 12).toArray()], look: [...W(1, 1, 0).toArray()] }, { t: tl.e('hook3') + 0.1, pos: [10, 13, 19], look: [0, 7.5, 0] }], t, 0.05),
    h4: (t) => cameraAt([{ t: tl.s('hook4') - 0.1, pos: [9, 11, 17], look: [0, 6.5, 0] }, { t: tl.cue('hook4', 'vat'), pos: [2.6, 4.3, 4.3], look: [0, 3.7, 0] }, { t: hookEnd, pos: [2.2, 4.1, 3.7], look: [0, 3.65, 0] }], t, 0.03),
    // Descartes' study
    dEst: (t) => cameraAt([{ t: hookEnd, pos: Dp(1.5, 5.5, 12), look: Dp(0, 1.8, -1) }, { t: tl.s('demon'), pos: Dp(2.5, 3.6, 7.5), look: Dp(-0.2, 1.6, -0.8) }], t),
    dDemon: (t) => cameraAt([{ t: tl.s('demon'), pos: Dp(-4.5, 4.2, 9.5), look: Dp(-0.6, 3.1, -1.2) }, { t: cutLab, pos: Dp(-5.5, 4.8, 10.5), look: Dp(-0.6, 3.3, -1.2) }], t),
    // the lab
    lEst: (t) => cameraAt([{ t: cutLab, pos: [11, 7.5, 16], look: [-1.2, 4, -0.5] }, { t: tl.s('lab'), pos: [9, 6.5, 13], look: [-1.2, 3.8, -0.5] }], t),
    lLab: (t) => cameraAt([{ t: tl.s('lab'), pos: [3.6, 4.6, 5.6], look: [0, 3.5, 0] }, { t: tl.e('lab') + 0.6, pos: [2.8, 4.3, 4.6], look: [0, 3.6, 0] }], t),
    lWires: (t) => cameraAt([{ t: tl.s('wires') - 0.2, pos: [1.5, 6.2, 9.5], look: [-2.8, 4.2, -0.8] }, { t: tl.e('wires') + 0.6, pos: [-0.5, 6.8, 9.8], look: [-2.8, 4.4, -0.8] }], t),
    lWorld: (t) => cameraAt([{ t: tl.s('world') - 0.2, pos: [5.5, 13.8, 9.5], look: [0.3, 11.3, 0.3] }, { t: tl.cue('world', 'same'), pos: [3.8, 12.6, 6.8], look: [0.3, 11.2, 0.3] }, { t: tl.e('world') + 0.6, pos: [10, 11, 21], look: [0, 7.4, 0] }], t),
    // the thinking pause: slow orbit, everything in view
    ponder: (t) => {
      const k = easeInOut((t - tl.s('ask')) / (pauseEnd - tl.s('ask')));
      const a = lerp(1.2, 1.75, k);
      return { pos: V(Math.cos(a) * 32, lerp(8, 7, k), Math.sin(a) * 32), look: V(0, 7.2, 0) };
    },
    argue: (t) => cameraAt([{ t: tl.s('argument'), pos: [-10, 9, 18], look: [0, 7, 0] }, { t: tl.e('argument') + 3, pos: [-14, 10, 16], look: [0, 7, 0] }], t),
    // Putnam's answer: the real vat, then the image of a vat inside the world, then both with the reference line
    pReal: (t) => cameraAt([{ t: tl.s('putnam') - 0.3, pos: [4.2, 4.8, 6.2], look: [0, 3.9, 0] }, { t: tl.cue('putnam', 'image'), pos: [3.6, 4.6, 5.4], look: [0, 3.9, 0] }], t),
    pImage: (t) => cameraAt([{ t: tl.cue('putnam', 'image') - 0.2, pos: [...W(12, 3.2, 3.5).toArray()], look: [...W(7.5, 2.6, -3.5).toArray()] }, { t: tl.cue('putnam', 'thought'), pos: [...W(11, 3.4, 4.5).toArray()], look: [...W(7.5, 2.6, -3.5).toArray()] }], t, 0.02),
    pBoth: (t) => cameraAt([{ t: tl.cue('putnam', 'thought') - 0.2, pos: [9, 8, 13], look: [0.8, 7.6, 0] }, { t: tl.s('objections'), pos: [11, 9, 17], look: [0.5, 7.4, 0] }], t),
    oRecent: (t) => cameraAt([{ t: tl.s('objections') - 0.3, pos: [3.4, 4.6, 5.2], look: [0, 3.7, 0] }, { t: tl.cue('objections', 'nagel'), pos: [4.2, 5, 6.2], look: [0, 3.8, 0] }], t),
    oNagel: (t) => cameraAt([{ t: tl.cue('objections', 'nagel') - 0.2, pos: [-8, 10, 17], look: [0, 7.5, 0] }, { t: tl.s('outro'), pos: [-12, 12, 19], look: [0, 7.5, 0] }], t),
    finale: (t) => {
      const k = ramp(t, tl.s('outro'), endCard + 1.4);
      return { pos: V(lerp(13, 11, k) + Math.sin(k * 0.6) * 3, lerp(20, 24, k), lerp(17, 15, k)), look: V(0, 6.2, 0) };
    },
  };
  const shots = [
    { t: 0, s: 'h1' },
    { t: tl.s('hook2') - 0.2, s: 'h2', blend: 0 },
    { t: tl.s('hook3') - 0.1, s: 'h3', blend: 0 },
    { t: tl.s('hook4') - 0.1, s: 'h4', blend: 0.4 },
    { t: hookEnd, s: 'dEst', blend: 0 },
    { t: tl.s('demon'), s: 'dDemon', blend: 2 },
    { t: cutLab, s: 'lEst', blend: 0 },
    { t: tl.s('lab'), s: 'lLab', blend: 2 },
    { t: tl.s('wires') - 0.2, s: 'lWires', blend: 1.8 },
    { t: tl.s('world') - 0.2, s: 'lWorld', blend: 1.8 },
    { t: tl.s('ask') - 0.3, s: 'ponder', blend: 2.2 },
    { t: tl.s('argument'), s: 'argue', blend: 2 },
    { t: tl.s('putnam') - 0.3, s: 'pReal', blend: 2 },
    { t: tl.cue('putnam', 'image') - 0.2, s: 'pImage', blend: 2 },
    { t: tl.cue('putnam', 'thought') - 0.2, s: 'pBoth', blend: 2 },
    { t: tl.s('objections') - 0.3, s: 'oRecent', blend: 2 },
    { t: tl.cue('objections', 'nagel') - 0.2, s: 'oNagel', blend: 2 },
    { t: tl.s('outro') - 0.4, s: 'finale', blend: 3 },
  ];
  function camera(t) {
    let i = 0;
    while (i < shots.length - 1 && t >= shots[i + 1].t) i++;
    const cur = S[shots[i].s](t);
    const blend = shots[i].blend ?? 1.6;
    if (i === 0 || blend === 0 || t - shots[i].t >= blend) return cur;
    const prev = S[shots[i - 1].s](t);
    const k = easeInOut((t - shots[i].t) / blend);
    return { pos: prev.pos.clone().lerp(cur.pos, k), look: prev.look.clone().lerp(cur.look, k) };
  }

  const label = (color, text) => `<span class="dot" style="background:${css(color)}"></span>${text}`;
  const lowerHTML = (name, work) => `<div class="name">${name}</div><div class="work">${work}</div>`;
  const pm = new THREE.Matrix4();

  // ================================================================ update
  return {
    update(t) {
      const labOn = inLab(t);
      lab.visible = labOn;
      study.visible = !labOn;

      // ---- lab life
      brain.position.y = BRAIN_POS.y + Math.sin(t * 0.9) * 0.04;
      brain.rotation.y = Math.sin(t * 0.3) * 0.12;
      bubbles.userData.update(t);
      computer.userData.tex.offset.y = (t * 0.08) % 1;
      computer.userData.reels.forEach((r, i) => (r.rotation.y = t * (i ? 1.6 : -1.1)));
      computer.userData.lights.forEach((l, i) => (l.material.emissiveIntensity = Math.sin(t * (2 + (i % 5) * 0.7) + i * 1.9) > 0.2 ? 1.6 : 0.1));
      const sciOn = t < hookEnd ? 0 : ramp(t, cutLab + 0.3, tl.s('lab'));
      setOpacity(scientist, sciOn);
      animatePerson(scientist, t, { energy: 0.5 });
      animatePerson(you, t, { energy: 0.35 });

      // signal pulses: computer → brain (hook, and from "signals" on)
      const flow = t < hookEnd ? 1 : ramp(t, tl.cue('wires', 'signals') - 0.3, tl.cue('wires', 'signals') + 0.6);
      let n = 0;
      if (flow > 0.01) for (const [ci, c] of cables.entries()) for (let k = 0; k < 5; k++) {
        const u = ((t * 0.35 + k / 5 + ci * 0.13) % 1);
        pm.makeTranslation(...c.getPointAt(u).toArray()); pm.scale(V(1, 1, 1).multiplyScalar(flow));
        pulses.setMatrixAt(n++, pm);
      }
      pulses.count = n; pulses.instanceMatrix.needsUpdate = true;

      // thought-beam up to the experienced world
      const beamOn = t < hookEnd ? ramp(t, tl.s('hook3'), tl.s('hook4')) : ramp(t, tl.s('world'), tl.s('world') + 1.5);
      beamMat.opacity = 0.04 * beamOn;
      rings.forEach((m, i) => {
        const u = ((t * 0.25 + i / 3) % 1);
        m.position.y = BRAIN_POS.y + 0.6 + u * (beamH - 0.2);
        m.scale.setScalar(lerp(0.4, 4.1, u));
        m.material.opacity = 0.35 * beamOn * Math.sin(Math.PI * u);
        m.visible = beamOn > 0.01;
      });

      // the world: glitches in the hook as its unreality shows through
      const g = glitchAmt(t);
      const r = seeded(Math.floor(t * 30) + 7);
      world.position.set(WORLD_POS.x + (r() - 0.5) * 0.4 * g, WORLD_POS.y + (r() - 0.5) * 0.2 * g, WORLD_POS.z);
      world.scale.set(WORLD_SCALE * (1 + (r() - 0.5) * 0.08 * g), WORLD_SCALE * (1 + (r() - 0.5) * 0.08 * g), WORLD_SCALE);

      // "refers to": the brain's word "vat" points at the image, not the real vat
      const refOn = win(t, tl.cue('putnam', 'thought') - 0.1, tl.s('objections') - 0.2, 0.6);
      refLine.visible = refOn > 0.01;
      refMat.opacity = 0.85 * refOn;
      refGeo.setDrawRange(0, Math.floor(refGeo.index.count * ramp(t, tl.cue('putnam', 'thought'), tl.cue('putnam', 'thought') + 1.6)));

      // frog: only in the thinking pause
      const frogOn = t > tl.s('ask') - 0.3 && t < pauseEnd + 0.4;
      frog.visible = frogOn;
      if (frogOn) animateFrog(frog, t - tl.s('ask') + 0.2, FROG_PATH, { rest: (pauseEnd - tl.s('ask')) / (FROG_PATH.length - 1) - 0.42, loop: false });

      // ---- study life
      flames.forEach((f, i) => { f.scale.y = 0.8 + 0.35 * Math.abs(Math.sin(t * (7 + i * 2.3) + i)); f.rotation.z = Math.sin(t * 5 + i) * 0.15; });
      fireLight.intensity = 16 + Math.sin(t * 11) * 3 + Math.sin(t * 27) * 2;
      candleFlame.scale.y = 1 + Math.sin(t * 13) * 0.2;
      animatePerson(descartes, t, { energy: 0.3 });
      const demonOn = ramp(t, tl.cue('demon', 'demon') - 0.5, tl.cue('demon', 'demon') + 1);
      setOpacity(demon, demonOn);
      demon.position.y = 3.0 + Math.sin(t * 1.3) * 0.2;
      demon.rotation.y = Math.sin(t * 0.7) * 0.25;
      const strOn = ramp(t, tl.cue('demon', 'fool') - 0.8, tl.cue('demon', 'fool') + 0.4);
      strings.forEach((s, i) => { s.material.opacity = 0.7 * strOn * (0.7 + 0.3 * Math.sin(t * 3 + i)); s.visible = strOn > 0.01; });
      // "…might be an illusion": the room wavers
      const waver = strOn * win(t, tl.cue('demon', 'fool'), tl.e('demon') + 0.4, 0.5);
      [hearth, chair, desk, book].forEach((o, i) => { o.rotation.z = Math.sin(t * 5 + i * 1.7) * 0.025 * waver; });

      // ---- camera
      const cam = camera(t);
      stage.setCamera(cam.pos, cam.look);

      // ---- overlays
      const intro = t < hookEnd ? 0 : 1 - ramp(t, tl.s('descartes') - 0.2, tl.s('descartes') + 0.6);
      const splash = t < hookEnd ? 0 : lerp(1, 0.72, ramp(t, tl.e('title') + 0.4, tl.e('title') + 1.6)) * intro;
      const end = ramp(t, endCard, endCard + 1.2);
      const cutFade = Math.max(0, 1 - Math.abs(t - cutLab) / 0.55);
      let fadeV = Math.max(1 - ramp(t, 0, 0.3), splash, cutFade, end * 0.82);
      ui.glitch(g, t);

      if (t < endCard) {
        ui.note(0);
        ui.title(intro * ramp(t, hookEnd + 0.05, hookEnd + 0.45), `<div class="kicker">A thought experiment</div><h1>Brain in a Vat</h1><div class="sub">René Descartes · Hilary Putnam</div><div class="rule"></div>`);
      } else {
        const src = ramp(t, tl.e('wrap') + 0.4, tl.e('wrap') + 1.2);
        ui.title(end, `<div class="kicker">Brain in a Vat</div><h1 style="font-size:78px;white-space:nowrap">Could you ever know — and how?</h1>
          <div class="rule"></div>
          <div class="sources" style="opacity:${src.toFixed(3)}">Descartes, <i>Meditations on First Philosophy</i> (1641) · Putnam, “Brains in a Vat,” <i>Reason, Truth and History</i> (1981) ·
          Nagel, <i>The View from Nowhere</i> (1986) · Ebbs, “Content Externalism and Skepticism,” <i>Stanford Encyclopedia of Philosophy</i></div>`);
        ui.note(ramp(t, tl.e('wrap') + 0.9, tl.e('wrap') + 1.6), `<div class="k">Try this</div>If your answer feels obvious, build the best case you can for the other side. That's usually where it gets interesting.`);
      }

      const lowers = [
        [win(t, tl.at('descartes', 0.1), tl.cue('demon', 'demon') - 0.3, 0.5), 'René Descartes', '<i>Meditations on First Philosophy</i>, 1641'],
        [win(t, tl.s('bridge'), tl.e('bridge') + 0.8, 0.5), 'Hilary Putnam', '“Brains in a Vat,” <i>Reason, Truth and History</i>, 1981'],
      ];
      const lo = lowers.find((l) => l[0] > 0);
      ui.lower(lo ? lo[0] : 0, lo ? lowerHTML(lo[1], lo[2]) : undefined);

      const qDem = win(t, tl.cue('demon', 'demon') - 0.2, tl.cue('demon', 'fool') + 0.4, 0.5);
      const qAsk = win(t, tl.s('ask'), pauseEnd, 0.6);
      const qPut = win(t, tl.cue('putnam', 'self') - 0.2, tl.e('putnam') + 1.6, 0.5);
      const qNag = win(t, tl.cue('objections', 'nagel') + 0.6, tl.e('objections') + 1.6, 0.5);
      if (qDem > 0) ui.quote(qDem, `“…some malicious demon of the utmost power and cunning has employed all his energies in order to deceive me.”<cite>René Descartes, 1641</cite>`);
      else if (qPut > 0) ui.quote(qPut, `“…if we are brains in a vat, then ‘We are brains in a vat’ is false.”<cite>Hilary Putnam, 1981</cite>`);
      else if (qNag > 0) ui.quote(qNag, `“Perhaps I cannot even think the truth of what I am, because I lack the necessary concepts…”<cite>Thomas Nagel, 1986</cite>`);
      else ui.quote(qAsk, `<span style="font-size:64px;font-style:normal">How could you ever know?</span>`);

      // the skeptic's argument
      const c = win(t, tl.cue('argument', 'p1') - 0.6, tl.e('argument') + 1.6, 0.5);
      if (c > 0) {
        const st = (cue) => (t > tl.cue('argument', cue) - 0.1 ? '' : 'hidden');
        fadeV = Math.max(fadeV, 0.35 * c);
        ui.card(c, `<h2>The skeptic's argument</h2><ol class="steps">
          <li class="${st('p1')}">If you know you have hands, you know you're not a brain in a vat.</li>
          <li class="${st('p2')}">You can't know you're not a brain in a vat.</li>
          <li class="concl ${st('p3')}">So you don't know you have hands.</li></ol>
          <div class="foot">${t > tl.cue('argument', 'all') ? '…and the same goes for almost everything you believe.' : '&nbsp;'}</div>`);
      } else ui.card(0);
      ui.fade(fadeV);

      // ---- labels
      const lab3 = labOn && t >= cutLab;
      ui.label('demon', !labOn ? win(t, tl.cue('demon', 'demon') + 0.3, tl.cue('demon', 'fool') + 0.3) : 0, label(0x6b4a9c, 'An evil demon'), demon, [0, 2.3, 0]);
      ui.label('descartes', !labOn ? win(t, tl.at('descartes', 0.3), tl.s('demon')) : 0, label(palette.judge, 'Descartes'), descartes, [0, 2.4, 0]);
      ui.label('sci', lab3 ? win(t, tl.s('bridge') + 1, tl.cue('lab', 'vat')) : 0, label(0xe0674f, 'An evil scientist'), scientist, [0, 2.4, 0]);
      ui.label('brain', lab3 ? win(t, tl.s('lab') + 1, tl.e('lab') + 0.6) : 0, label(0xf0a7b1, 'Your brain'), brain, [0, 0.8, 0]);
      ui.label('vat', lab3 ? win(t, tl.cue('lab', 'vat') + 0.3, tl.e('lab') + 0.6) + win(t, tl.cue('world', 'same') + 1, pauseEnd + 0.3) + win(t, tl.s('putnam') + 0.8, tl.cue('putnam', 'image')) + win(t, tl.s('outro') + 0.4, endCard + 0.4) : 0,
        label(0x3fae8e, t > tl.s('putnam') + 0.5 && t < tl.s('outro') ? 'A real vat' : t > tl.cue('world', 'same') ? "What's really there" : 'A vat of nutrients'), vat, [1.6, 3.3, 0]);
      ui.label('computer', lab3 ? win(t, tl.cue('wires', 'signals') - 1.5, tl.e('wires') + 0.6) : 0, label(0x5d6470, 'A super-scientific computer'), computer, [0, 4.8, 0]);
      ui.label('you', lab3 ? win(t, tl.s('world') + 0.5, tl.cue('world', 'same')) : 0, label(palette.agent, 'You'), you, [0, 0.55, 0]);
      ui.label('world', lab3 ? win(t, tl.cue('world', 'same') + 1, pauseEnd + 0.3) + win(t, tl.s('outro') + 0.4, endCard + 0.4) : 0, label(palette.agent, 'What you experience'), world, [5.8, 0.4, 0]);
      ui.label('imgvat', lab3 ? win(t, tl.cue('putnam', 'image') + 0.6, tl.s('objections') - 0.2) : 0, label(palette.trolley, 'An image of a vat'), imgVat, [0, 0.46, 0]);
      ui.label('thought', lab3 ? win(t, tl.cue('putnam', 'thought') + 0.2, tl.s('objections') - 0.2) : 0, '“I am a brain in a vat.”', brain, [0, 1.1, 0], 'thought');
      ui.label('recent', lab3 ? win(t, tl.cue('objections', 'recent') + 0.2, tl.cue('objections', 'nagel')) : 0, label(palette.trolley, 'Put in the vat last night?'), brain, [0, 0.9, 0], 'warn');
    },
  };
}

// Rounded boxes without importing the addon into the scene file
function RoundedBoxGeometryFallback(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  const p = g.attributes.position, v = new THREE.Vector3(), r = Math.min(w, h, d) * 0.18;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const inner = V(clamp(v.x, -w / 2 + r, w / 2 - r), clamp(v.y, -h / 2 + r, h / 2 - r), clamp(v.z, -d / 2 + r, d / 2 - r));
    const dir = v.clone().sub(inner);
    if (dir.lengthSq() > 0) v.copy(inner.add(dir.normalize().multiplyScalar(r)));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
