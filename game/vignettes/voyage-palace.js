// The house, seen from the sea (the voyage's last island): a teetering art palace crouched on four chicken legs, every
// wing after a different artist of the house's rooms, piled up and leaning, smoke from its chimneys. Its front door is
// the first room's sky door; a drawbridge runs down to it. When you go in, the door shuts, the bridge comes up and the
// whole thing stands up on its legs.
//   the middle: a cream classical block with a pediment and columns round the sky door, on a riveted iron belly
//   left: Grant Wood's red barn with a gambrel roof and the gothic window · right: a cubist wing of tilted ochre planes
//     with an eye front-on and an eye in profile
//   above: a wing painted as sky (a bowler hat, a floating green apple) · a copper onion dome · a ribbed terracotta
//     dome · a balcony with a clock melting off its edge · a turret painted in swirling night-sky strokes · a crooked
//     half-timbered cottage · a spiral stair with a flight hanging upside down and a flight up the wall, walked on both
// makePalace(wind) → { g, update(dt, t), door / ramp / lift / burst (set 0..1), rampY(local z), rampFoot }; +z is the
// front. Static parts are merged into one mesh per material per tier (the tiers sway separately).
import { THREE, seeded, clay, mesh, makePerson } from '/game/engine/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, strokes } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const UP = V(0, 1, 0);
const SILL = 3.3, RAMP = 7.4;                                   // the door sill's height; the drawbridge's length
const RAMP_DOWN = Math.asin(SILL / RAMP);

// one mesh, placed: put(parent, geometry, colour or material, [x, y, z], [rx, ry, rz], [sx, sy, sz])
function put(g, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = null) {
  const m = mesh(geo, typeof mat === 'number' ? clay(mat) : mat);
  m.position.set(...p); m.rotation.set(...r); if (s) m.scale.set(...s); g.add(m); return m;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, n = 16) => new THREE.CylinderGeometry(rt, rb, h, n);
// a shape extruded d deep, centred on z (gables, gambrel roofs)
function extrude(pts, d) { const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; }

// merge every plain clay mesh under g into one mesh per material (the palace is a few hundred pieces)
function bake(g) {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), byMat = new Map(), drop = [];
  g.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep) return;
    const m = o.material; if (!m.isMeshStandardMaterial || m.map || m.transparent) return;
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    geo.clearGroups(); geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    if (!byMat.has(m)) byMat.set(m, []); byMat.get(m).push(geo); drop.push(o);
  });
  drop.forEach((o) => o.parent.remove(o));
  for (const [m, geos] of byMat) g.add(mesh(mergeGeometries(geos), m));
}

// ---- painted surfaces
export function skyTexture(w = 256, h = 256, seed = 3) {
  return canvasTexture(w, h, (q) => {
    const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fa8d6'); gr.addColorStop(1, '#dce8f2'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
    const r = seeded(seed); q.fillStyle = '#ffffff';
    for (let c = 0; c < 4; c++) { const cx = r() * w, cy = h * (0.15 + r() * 0.7), s = w * (0.05 + r() * 0.05); for (let k = 0; k < 5; k++) { q.beginPath(); q.arc(cx + (k - 2) * s * 0.9, cy - Math.sin((k / 4) * Math.PI) * s * 0.6, s * (0.7 + 0.3 * Math.sin(k * 2)), 0, TAU); q.fill(); } }
  });
}
function swirlTexture() {
  const swirls = [[140, 180, 90], [360, 120, 70], [300, 360, 110], [80, 420, 60]];
  return canvasTexture(512, 512, (q, w, h) => {
    strokes(q, w, h, { base: '#2c4a7a', colors: ['#2c4a7a', '#3d6aa8', '#6f9bd1', '#a9c6e8', '#1f3560', '#5f8fc7'], count: 3200, len: [12, 26], width: [4, 7], seed: 1889,
      dir: (x, y) => { let vx = 0.7, vy = 0.3 * Math.sin(x * 0.03); for (const [cx, cy, r] of swirls) { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) + 1, k = Math.exp(-d / r) * 3; vx += (-dy / d) * k; vy += (dx / d) * k; } return Math.atan2(vy, vx); } });
    const r = seeded(7);
    for (const [cx, cy] of [[60, 60], [250, 40], [440, 230], [190, 300], [420, 450], [40, 250]]) {
      q.lineCap = 'round';
      for (let i = 0; i < 70; i++) { const a = r() * TAU, rad = 6 + r() * 26, l = 0.35; q.strokeStyle = ['#f2c14e', '#fbe39a', '#e2b24a', '#fff4c8'][i % 4]; q.lineWidth = 3 + r() * 3; q.beginPath(); q.arc(cx, cy, rad, a, a + l); q.stroke(); }
      q.fillStyle = '#fff1b0'; q.beginPath(); q.arc(cx, cy, 6, 0, TAU); q.fill();
    }
  });
}
function clockTexture() {
  return canvasTexture(256, 256, (q) => {
    q.clearRect(0, 0, 256, 256);
    q.fillStyle = '#f4ead2'; q.beginPath(); q.arc(128, 128, 118, 0, TAU); q.fill();
    q.strokeStyle = '#c9a54c'; q.lineWidth = 12; q.beginPath(); q.arc(128, 128, 114, 0, TAU); q.stroke();
    q.strokeStyle = '#3a3530'; q.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; q.lineWidth = i % 3 ? 4 : 8; q.beginPath(); q.moveTo(128 + Math.cos(a) * 82, 128 + Math.sin(a) * 82); q.lineTo(128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); q.stroke(); }
    q.lineWidth = 8; q.beginPath(); q.moveTo(128, 128); q.lineTo(128 + 40, 128 - 30); q.stroke();
    q.lineWidth = 5; q.beginPath(); q.moveTo(128, 128); q.lineTo(128 - 12, 128 + 76); q.stroke();
    q.fillStyle = '#3a3530'; q.beginPath(); q.arc(128, 128, 8, 0, TAU); q.fill();
  });
}

// a clock lying on a ledge whose front edge is at z = 0, the rest of it melting down over the edge
function meltingClock() {
  const geo = new THREE.PlaneGeometry(1.7, 1.7, 24, 24); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), z = p.getZ(k) + 0.25, over = z - 0;          // (a quarter of it on the ledge)
    if (over <= 0) { p.setXYZ(k, x, 0.012 * Math.sin(x * 5), z); continue; }
    const sag = 1.2 + 0.9 * Math.exp(-((x - 0.2) ** 2) * 5);            // it runs further in the middle, like a drip
    const bend = Math.min(1, over / 0.18), down = over * sag;
    p.setXYZ(k, x * (1 - 0.12 * bend * Math.min(1, over)), -down * bend - 0.02, 0.06 * bend + (1 - bend) * over);
  }
  geo.computeVertexNormals();
  const m = mesh(geo, new THREE.MeshStandardMaterial({ map: clockTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }));
  return m;
}

// a chicken leg: a feathered thigh, a scaly shin and a three-toed foot; posed each frame from the hip to the foot
function makeLeg(parent, foot, hip, side) {
  const thigh = put(parent, cyl(0.55, 0.32, 1, 10), 0x8a6d58), shin = put(parent, cyl(0.16, 0.2, 1, 8), 0xe3a83e);
  const knee = put(parent, new THREE.SphereGeometry(0.3, 12, 8), 0xe3a83e);
  const ruff = put(parent, new THREE.ConeGeometry(0.7, 0.9, 10), 0x9b7a62);
  const f = new THREE.Group(); f.position.copy(foot); f.rotation.y = side * 0.35; parent.add(f);
  for (const a of [-0.55, 0, 0.55]) { const toe = put(f, new THREE.ConeGeometry(0.1, 1.0, 6), 0xe3a83e, [Math.sin(a) * 0.45, 0.08, Math.cos(a) * 0.45]); toe.rotation.order = 'YXZ'; toe.rotation.set(Math.PI / 2, a, 0); toe.scale.set(1, 1, 0.7); }
  put(f, new THREE.ConeGeometry(0.08, 0.6, 6), 0xe3a83e, [0, 0.07, -0.3], [-Math.PI / 2, 0, 0]);
  put(f, new THREE.SphereGeometry(0.2, 10, 6), 0xe3a83e, [0, 0.12, 0]);
  const L1 = 2.5, L2 = 2.6, bendPref = V(side * 0.45, 0.25, -1).normalize();
  const q = new THREE.Quaternion(), K = V(), d = V(), b = V();
  const bone = (m, a, c) => { m.position.addVectors(a, c).multiplyScalar(0.5); d.subVectors(a, c); m.scale.set(1, d.length(), 1); m.quaternion.copy(q.setFromUnitVectors(UP, d.normalize())); };
  return (H) => {
    d.subVectors(foot, H); const dist = Math.min(d.length(), L1 + L2 - 0.02); d.normalize();
    const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    b.copy(bendPref).addScaledVector(d, -bendPref.dot(d)).normalize();
    K.copy(H).addScaledVector(d, a).addScaledVector(b, h);
    bone(thigh, H, K); bone(shin, K, foot); knee.position.copy(K);
    ruff.position.copy(H).add(V(0, -0.25, 0));
  };
}

export function makePalace(wind) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);                   // everything the legs carry
  const tier1 = new THREE.Group(); tier1.position.y = SILL + 4; body.add(tier1);
  const tier2 = new THREE.Group(); tier2.position.y = 2.8; tier1.add(tier2);
  const smokeAt = [];
  const chimneyTop = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); smokeAt.push(o); };
  const r = seeded(1904);
  const DARK = 0x2f3a48, CREAM = 0xeadfca, WHITE = 0xf6f1e7, IRON = 0x77716b, BRASS = 0xb58a3c, BRICK = 0x9c4a3a;
  const win = (p, w = 0.55, h = 0.85, rot = [0, 0, 0], parent = body) => { put(parent, box(w + 0.16, h + 0.16, 0.06), WHITE, p, rot); put(parent, box(w, h, 0.08), DARK, [p[0], p[1], p[2] + 0.02], rot); };

  // ---- the belly and the middle block (with the sky door)
  put(body, new THREE.SphereGeometry(1, 28, 12, 0, TAU, Math.PI / 2, Math.PI / 2), IRON, [0, SILL + 0.05, 0], [0, 0, 0], [5.4, 1.5, 3.4]);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; put(body, new THREE.SphereGeometry(0.1, 6, 4), BRASS, [Math.cos(a) * 5.1, SILL - 0.3, Math.sin(a) * 3.2]); }
  for (const [x, z, l, ry] of [[-3.2, 2.6, 2.2, 0.4], [2.6, -2.9, 2.8, -0.9], [4.6, 1.2, 1.6, 0.2]]) { put(body, cyl(0.16, 0.16, l, 10), BRASS, [x, SILL - 0.8, z], [0, ry, Math.PI / 2]); }
  put(body, box(7, 4, 5), CREAM, [0, SILL + 2, 0]);
  put(body, box(7.3, 0.3, 5.3), WHITE, [0, SILL + 4.1, 0]);
  for (const x of [-0.98, 0.98]) put(body, cyl(0.14, 0.17, 2.7, 12), WHITE, [x, SILL + 1.35, 2.78]);
  put(body, box(2.6, 0.26, 0.55), WHITE, [0, SILL + 2.8, 2.75]);
  put(body, cyl(1, 1, 0.3, 3), WHITE, [0, SILL + 2.94, 2.72], [-Math.PI / 2, 0, 0], [1.35, 1, 0.55]);
  for (const x of [-0.8, 0.8]) put(body, box(0.14, 2.62, 0.34), WHITE, [x, SILL + 1.26, 2.55]);
  put(body, box(1.74, 0.14, 0.34), WHITE, [0, SILL + 2.6, 2.55]);
  put(body, box(1.5, 2.55, 0.05), 0x1a1614, [0, SILL + 1.27, 2.51]);   // behind the door: dark
  win([2.6, SILL + 2.6, 2.53]); win([-2.6, SILL + 1.1, 2.53]);
  put(body, new THREE.TorusGeometry(0.46, 0.08, 8, 20), BRASS, [2.3, SILL + 1.05, 2.56]); put(body, cyl(0.42, 0.42, 0.05, 20), DARK, [2.3, SILL + 1.05, 2.53], [Math.PI / 2, 0, 0]);
  // the Escher bit on the front: a short flight of stairs up the wall, and someone standing on it sideways
  for (let k = 0; k < 6; k++) put(body, box(0.5, 0.12, 0.36), 0xd8cfc2, [-3.25 + k * 0.36, SILL + 2.0 + k * 0.3, 2.68]);
  const wallMan = makePerson({ color: 0x8c7a66, scale: 0.42 }); wallMan.position.set(-2.1, SILL + 2.7, 2.52); wallMan.rotation.set(Math.PI / 2, 0, -0.9); body.add(wallMan);

  // ---- left: the red barn (after Grant Wood), with a gambrel roof and the gothic window
  const barn = new THREE.Group(); barn.position.set(-5.15, SILL - 0.2, 0.3); barn.rotation.z = 0.06; body.add(barn);
  put(barn, box(3.4, 3.2, 4), 0xa8423a, [0, 1.6, 0]);
  put(barn, extrude([[-1.95, 0], [1.95, 0], [1.45, 1.05], [0, 1.8], [-1.45, 1.05]], 4.3), 0x5d6166, [0, 3.2, 0]);
  put(barn, extrude([[-1.7, 0], [1.7, 0], [1.25, 0.95], [0, 1.6], [-1.25, 0.95]], 4.02), 0xa8423a, [0, 3.2, 0]);
  put(barn, box(1.6, 1.9, 0.06), WHITE, [0, 0.95, 2.02]); put(barn, box(1.4, 1.7, 0.08), 0xa8423a, [0, 0.95, 2.03]);
  for (const s of [-1, 1]) put(barn, box(0.12, 2.2, 0.06), WHITE, [0, 0.95, 2.08], [0, 0, s * 0.68]);
  const gothic = [[-0.3, 0], [0.3, 0], [0.3, 0.6], [0.2, 0.95], [0, 1.2], [-0.2, 0.95], [-0.3, 0.6]];
  put(barn, extrude(gothic.map(([x, y]) => [x * 1.35, y * 1.2]), 0.06), WHITE, [0, 3.35, 2.03]); put(barn, extrude(gothic, 0.06), 0x5b6f86, [0, 3.45, 2.06]);
  put(barn, box(0.5, 0.6, 0.06), WHITE, [-0.95, 2.3, 2.02]);
  chimneyTop(barn, 1.0, 5.6, -1.1); put(barn, box(0.5, 1.6, 0.5), BRICK, [1.0, 4.7, -1.1]);

  // ---- right: the cubist wing, a heap of tilted ochre planes, an eye front-on and an eye in profile
  const cub = new THREE.Group(); cub.position.set(5.0, SILL - 0.1, 0.1); cub.rotation.z = -0.05; body.add(cub);
  put(cub, box(3.1, 3.8, 4.2), 0xc98f3f, [0, 1.9, 0]);
  const OCHRES = [0xd9a650, 0xa8692e, 0x8a7a66, 0xe8d3a0, 0x6b5a4a, 0xc7783a, 0xb5543a];
  for (let i = 0; i < 16; i++) {
    const front = i < 9, w = 0.8 + r() * 1.3, h = 0.8 + r() * 1.6, c = OCHRES[i % OCHRES.length];
    if (front) put(cub, box(w, h, 0.08), c, [-1.1 + r() * 2.2, 0.6 + r() * 2.8, 2.14 + i * 0.012], [(r() - 0.5) * 0.3, (r() - 0.5) * 0.4, (r() - 0.5) * 1.2]);
    else put(cub, box(0.08, h, w), c, [1.59 + i * 0.012, 0.6 + r() * 2.8, -1.5 + r() * 3], [(r() - 0.5) * 1.2, (r() - 0.5) * 0.3, (r() - 0.5) * 0.3]);
  }
  put(cub, new THREE.SphereGeometry(1, 16, 8), WHITE, [-0.35, 2.6, 2.3], [0, 0, 0.25], [0.45, 0.22, 0.08]); put(cub, new THREE.SphereGeometry(0.12, 10, 8), 0x1f1b1a, [-0.33, 2.62, 2.36]);
  put(cub, cyl(0.28, 0.28, 0.6, 3), 0xe8d3a0, [0.35, 2.1, 2.32], [0, 0, 0.3], [1, 1, 1.6]);
  put(cub, new THREE.SphereGeometry(1, 16, 8), WHITE, [1.72, 2.8, 0.4], [0, Math.PI / 2, -0.2], [0.42, 0.2, 0.08]); put(cub, new THREE.SphereGeometry(0.1, 10, 8), 0x1f1b1a, [1.78, 2.8, 0.52]);
  put(cub, box(3.6, 0.22, 4.6), 0x6b5a4a, [0, 4.0, 0], [0.12, 0, -0.1]);
  put(cub, box(0.9, 0.9, 0.9), 0xd9a650, [0.6, 4.6, -0.8], [0.3, 0.7, 0.2]);
  chimneyTop(cub, -0.7, 6.0, -1.3); put(cub, cyl(0.28, 0.34, 2.1, 5), 0x8a7a66, [-0.7, 4.9, -1.3], [0, 0, 0.12]);

  // ---- tier 1: the sky wing (a bowler hat, a green apple), the domes, the balcony with the melting clock
  const skyMat = new THREE.MeshStandardMaterial({ map: skyTexture(256, 256, 11), roughness: 0.85 });
  const skyWing = put(tier1, box(4.0, 2.8, 3.4), skyMat, [-1.6, 1.4, -0.3], [0, 0.12, 0.03]);
  put(tier1, box(4.25, 0.18, 3.65), WHITE, [-1.6, 2.88, -0.3], [0, 0.12, 0.03]);
  put(tier1, new THREE.SphereGeometry(0.42, 16, 8, 0, TAU, 0, Math.PI / 2), 0x1d1d22, [-2.9, 2.97, 0.5], [0, 0, 0], [1, 0.9, 1]); put(tier1, cyl(0.66, 0.66, 0.05, 20), 0x1d1d22, [-2.9, 2.99, 0.5]);
  put(tier1, new THREE.SphereGeometry(0.36, 16, 12), 0x7cb342, [-1.2, 1.3, 1.85]); put(tier1, new THREE.ConeGeometry(0.1, 0.3, 4), 0x4f7a3a, [-1.12, 1.72, 1.85], [0, 0, -0.6]);
  // copper onion dome on a drum
  put(tier1, cyl(1.0, 1.05, 1.4, 20), WHITE, [1.8, 0.7, 1.2]);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; put(tier1, box(0.22, 0.6, 0.06), DARK, [1.8 + Math.sin(a) * 1.02, 0.75, 1.2 + Math.cos(a) * 1.02], [0, a, 0]); }
  const onion = new THREE.LatheGeometry([[0, 0], [0.95, 0], [1.2, 0.4], [1.08, 0.85], [0.7, 1.3], [0.28, 1.65], [0.07, 2.0], [0.03, 2.4]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  put(tier1, onion, 0x7fb8a4, [1.8, 1.4, 1.2]); put(tier1, new THREE.SphereGeometry(0.12, 10, 8), BRASS, [1.8, 3.85, 1.2]);
  // a ribbed terracotta dome behind, with a lantern
  put(tier1, new THREE.SphereGeometry(1.9, 24, 12, 0, TAU, 0, Math.PI / 2), 0xc9704a, [0.7, 0, -1.4]);
  for (let k = 0; k < 8; k++) put(tier1, new THREE.TorusGeometry(1.92, 0.06, 4, 18, Math.PI), WHITE, [0.7, 0, -1.4], [0, (k / 8) * Math.PI, 0]);
  put(tier1, cyl(0.35, 0.35, 0.8, 8), WHITE, [0.7, 2.2, -1.4]); put(tier1, new THREE.ConeGeometry(0.45, 0.7, 8), 0xc9704a, [0.7, 2.95, -1.4]);
  // the balcony, and the clock
  put(tier1, box(2.7, 0.2, 1.4), 0xd8cfc2, [2.0, 0.1, 3.15]);
  for (const x of [1.0, 3.0]) put(tier1, box(0.18, 0.5, 0.7), 0xd8cfc2, [x, -0.25, 2.85]);
  for (const x of [0.75, 3.25]) for (let k = 0; k < 4; k++) put(tier1, cyl(0.04, 0.04, 0.6, 6), WHITE, [x, 0.5, 2.6 + k * 0.33]);
  for (const x of [0.75, 3.25]) put(tier1, box(0.08, 0.06, 1.2), WHITE, [x, 0.8, 3.1]);
  const clock = meltingClock(); clock.position.set(2.2, 0.21, 3.85); tier1.add(clock);
  // brick chimney
  put(tier1, box(0.6, 2.4, 0.6), BRICK, [3.3, 1.2, -1.9]); put(tier1, box(0.8, 0.18, 0.8), 0x5a3d29, [3.3, 2.45, -1.9]); chimneyTop(tier1, 3.3, 2.6, -1.9);
  // the spiral stair up to a lookout, and a flight hanging under it upside down, walked by someone upside down
  put(tier1, cyl(0.16, 0.16, 5.2, 8), WHITE, [-4.0, 2.6, 1.8]);
  for (let k = 0; k < 18; k++) { const a = k * 0.62; put(tier1, box(0.9, 0.1, 0.36), 0xd8cfc2, [-4.0 + Math.cos(a) * 0.55, 0.2 + k * 0.26, 1.8 - Math.sin(a) * 0.55], [0, a, 0]); }
  put(tier1, cyl(0.95, 0.95, 0.14, 16), 0xd8cfc2, [-4.0, 5.1, 1.8]);
  put(tier1, new THREE.TorusGeometry(0.95, 0.04, 6, 24), WHITE, [-4.0, 5.55, 1.8], [Math.PI / 2, 0, 0]);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; put(tier1, cyl(0.03, 0.03, 0.45, 5), WHITE, [-4.0 + Math.cos(a) * 0.95, 5.33, 1.8 + Math.sin(a) * 0.95]); }
  for (let k = 0; k < 6; k++) put(tier1, box(0.8, 0.1, 0.34), 0xd8cfc2, [-4.0, 4.95 - k * 0.24, 2.5 + k * 0.32]);
  const upside = makePerson({ color: 0x5a6f5a, scale: 0.34 }); upside.position.set(-4.0, 4.42, 3.14); upside.rotation.set(0, 0, Math.PI); tier1.add(upside);
  const topMan = makePerson({ color: 0x9a5a4a, scale: 0.34 }); topMan.position.set(-4.2, 5.17, 1.6); tier1.add(topMan);
  put(tier1, cyl(0.03, 0.03, 1.4, 5), 0x5a3d29, [-4.0, 5.9, 1.8]); put(tier1, new THREE.ConeGeometry(0.2, 0.7, 3), 0xe0674f, [-3.7, 6.45, 1.8], [0, 0, -Math.PI / 2], [1, 1, 0.15]);

  // ---- tier 2: the swirling turret, the crooked cottage on the sky wing, stovepipes
  const swirl = new THREE.MeshStandardMaterial({ map: swirlTexture(), roughness: 0.95 });
  const turret = new THREE.Group(); turret.position.set(3.5, -2.8, -0.5); turret.rotation.z = -0.07; tier2.add(turret);
  put(turret, cyl(1.05, 1.1, 6.4, 24), swirl, [0, 3.2, 0]);
  put(turret, new THREE.TorusGeometry(1.08, 0.08, 6, 24), 0xf2c14e, [0, 6.4, 0], [Math.PI / 2, 0, 0]);
  put(turret, new THREE.ConeGeometry(1.4, 2.6, 24), 0x2c4a7a, [0, 7.7, 0]);
  put(turret, new THREE.SphereGeometry(0.2, 10, 8), 0xf2c14e, [0, 9.1, 0]);
  for (const [a, y] of [[0.2, 2.2], [1.4, 4.4], [-0.9, 5.1]]) { put(turret, box(0.4, 0.7, 0.1), 0xf2c14e, [Math.sin(a) * 1.08, y, Math.cos(a) * 1.08], [0, a, 0]); }
  const cot = new THREE.Group(); cot.position.set(-1.7, 0.12, -0.3); cot.rotation.set(0.05, 0.32, -0.15); tier2.add(cot);
  put(cot, box(2.4, 1.7, 2.0), 0xf4ede0, [0, 0.85, 0]);
  const BEAM = 0x5a3d29;
  for (const x of [-1.15, -0.4, 0.4, 1.15]) put(cot, box(0.1, 1.7, 0.06), BEAM, [x, 0.85, 1.02]);
  put(cot, box(2.4, 0.1, 0.06), BEAM, [0, 0.9, 1.02]); put(cot, box(0.1, 0.95, 0.06), BEAM, [-0.78, 0.45, 1.03], [0, 0, 0.65]); put(cot, box(0.1, 0.95, 0.06), BEAM, [0.78, 0.45, 1.03], [0, 0, -0.65]);
  put(cot, extrude([[-1.45, 0], [1.45, 0], [0, 1.3]], 2.3), 0xb5543a, [0, 1.7, 0]);
  win([0, 1.3, 1.04], 0.4, 0.4, [0, 0, 0], cot);
  put(cot, cyl(0.03, 0.03, 0.9, 5), 0x3a3530, [0.3, 3.3, 0]); put(cot, new THREE.ConeGeometry(0.12, 0.8, 4), 0x3a3530, [0.3, 3.6, 0], [0, 0, Math.PI / 2], [1, 1, 0.3]);
  // a crooked black stovepipe with a cowl, the tallest thing on it
  put(tier2, cyl(0.22, 0.22, 2.4, 10), 0x2b2a33, [-0.2, 1.2, -2.0], [0, 0, 0.18]); put(tier2, cyl(0.22, 0.22, 2.0, 10), 0x2b2a33, [-0.5, 3.1, -2.0], [0, 0, -0.35]);
  put(tier2, new THREE.ConeGeometry(0.42, 0.5, 10), 0x2b2a33, [-0.14, 4.2, -2.0]); chimneyTop(tier2, -0.14, 4.3, -2.0);
  // a twisted brick chimney
  for (let k = 0; k < 8; k++) put(tier2, box(0.5, 0.42, 0.5), BRICK, [1.4, -1.5 + k * 0.42, -2.6], [0, k * 0.3, 0]);
  chimneyTop(tier2, 1.4, 1.9, -2.6);
  // the people on the stairs: part of the building (they're clay too)
  bake(body); bake(tier1); bake(tier2);

  // ---- moving parts: the door, the drawbridge, the legs, the smoke
  const hinge = new THREE.Group(); hinge.position.set(-0.68, SILL, 2.6); body.add(hinge);
  const doorMat = new THREE.MeshStandardMaterial({ map: skyTexture(128, 256, 5), roughness: 0.8 });
  put(hinge, box(1.36, 2.52, 0.1), doorMat, [0.68, 1.26, 0]);
  put(hinge, new THREE.SphereGeometry(0.08, 12, 8), clay(0xc9a54c, { metalness: 0.5 }), [1.2, 1.25, 0.08]);
  const light = new THREE.PointLight(0xffd79a, 0, 7, 1.5); light.position.set(0, SILL + 1.4, 2.1); body.add(light);
  const rampPivot = new THREE.Group(); rampPivot.position.set(0, SILL, 2.6); body.add(rampPivot);
  put(rampPivot, box(1.5, 0.14, RAMP), 0x8a6443, [0, -0.07, RAMP / 2]);
  for (let k = 0; k < 13; k++) put(rampPivot, box(1.6, 0.06, 0.12), 0x6b4a33, [0, 0.02, 0.3 + k * 0.55]);
  const legs = new THREE.Group(); g.add(legs);
  const hips = [], feet = [];
  for (const [x, z] of [[-1, 1.3], [1, 1.3], [-1, -1.7], [1, -1.7]]) {
    const hip = new THREE.Object3D(); hip.position.set(x * 2.9, SILL - 0.2, z); body.add(hip);
    const foot = V(x * 4.4, 0, z + (z > 0 ? 0.8 : -0.6)); feet.push(foot);
    hips.push({ hip, pose: makeLeg(legs, foot, hip.position.clone(), x) });
  }
  const PUFFS = 40, smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 1, transparent: true, opacity: 0.85, depthWrite: false }), PUFFS);
  smoke.castShadow = false; smoke.frustumCulled = false; g.add(smoke);
  const puffs = Array.from({ length: PUFFS }, (_, i) => ({ at: i % smokeAt.length, age: (i / PUFFS) * 5, life: 5, from: V() }));
  const m4 = new THREE.Matrix4(), tmp = V(), H = V();
  const windLocal = () => wind.clone().applyAxisAngle(UP, -g.rotation.y);

  const P = {
    g, door: 0, ramp: 1, lift: 0, burst: 0, feet,
    // the height of the drawbridge's walking surface at a point z along the palace's front axis
    rampY(z) { const foot = 2.6 + Math.cos(RAMP_DOWN) * RAMP; return z < 2.6 ? SILL : z > foot ? 0 : SILL * (foot - z) / (foot - 2.6); },
    rampFoot: 2.6 + Math.cos(RAMP_DOWN) * RAMP,
    update(dt, t) {
      body.position.y = 0.06 * Math.sin(t * 1.3) + 1.1 * P.lift + 0.1 * Math.sin(t * 7) * P.burst;
      body.rotation.z = 0.012 * Math.sin(t * 0.7); body.rotation.x = 0.008 * Math.sin(t * 0.9 + 1);
      tier1.rotation.z = 0.018 * Math.sin(t * 0.8 + 0.6); tier1.rotation.x = 0.01 * Math.sin(t * 0.6);
      tier2.rotation.z = 0.03 * Math.sin(t * 0.8 - 0.2); tier2.rotation.x = 0.015 * Math.sin(t * 0.7 + 2);
      hinge.rotation.y = -1.7 * P.door; light.intensity = 8 * P.door;
      rampPivot.rotation.x = THREE.MathUtils.lerp(-1.45, RAMP_DOWN, P.ramp);
      g.updateMatrixWorld(true);
      for (const { hip, pose } of hips) pose(g.worldToLocal(hip.getWorldPosition(H)));
      const w = windLocal(), rate = 1 + 2 * P.burst;
      for (let i = 0; i < PUFFS; i++) {
        const p = puffs[i]; p.age += dt * rate;
        if (p.age >= p.life) { p.age -= p.life; p.at = (p.at + 1 + (i % 3)) % smokeAt.length; g.worldToLocal(smokeAt[p.at].getWorldPosition(p.from)); }
        const k = p.age / p.life, s = (0.35 + k * 1.6) * Math.min(1, (1 - k) * 3) * Math.min(1, p.age * 4);
        tmp.copy(p.from).addScaledVector(UP, p.age * 1.1).addScaledVector(w, p.age * p.age * 0.35); tmp.x += Math.sin(t + i) * 0.2 * k;
        m4.makeScale(s, s, s).setPosition(tmp); smoke.setMatrixAt(i, m4);
      }
      smoke.instanceMatrix.needsUpdate = true;
    },
  };
  puffs.forEach((p) => { g.updateMatrixWorld(true); p.from.copy(smokeAt[p.at].getWorldPosition(V())); });
  return P;
}
