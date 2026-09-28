// The Ship of Theseus's voyage: what happens if you press S as your ship sails off (instead of the end card).
// You sail the ship yourself on a small sea with one steady wind: left/right steer, up trims the sail, down eases it.
// You can't sail into the wind (the no-go zone), so to go upwind you zigzag (tack). Six islands, each with a landing:
//   the lighthouse: its watcher (the Utility Monster's model) talks, then fights you (three hearts each); win, and his
//     cellar opens on a chest of gold you can carry back to the ship;
//   North Sentinel Island: people in the treeline warn you off; you may leave a bag of sweets at the waterline, then go;
//   an island of frogs; two nearly empty islands (a palm, a rock, a bottle);
//   the house's island, upwind: the house itself, a teetering art palace on chicken legs (voyage-palace.js). Go in at
//     its front door (the first room's sky door) and you're home: the end card (the chest, if it's on board, goes to
//     the museum first).
// You can also tie up again at the harbour you set out from, and walk about the dock. An island's name only shows once
// you've landed there.
// startVoyage(ctx, { root, ship, sea, ground, harbour }) → { S, update, camera, walkable, blockers, dispose, teleport, isles }
import { THREE, palette, css, clamp, lerp, easeInOut, easeOut, seeded, clay, mesh, makeIsland, makeTree, makeRock, makePerson, animatePerson, makeFrog } from '/game/engine/core.js';
import { frogExtras, frogCroak } from '../core/frog.js';
import { makeMonster } from '../core/monster.js';
import { makePalace } from './voyage-palace.js';
import { makeLollipop } from '../core/grantwood.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const WIND = V(0, 0, -1);                        // the way the wind blows (it comes from +z)
const MAX_SPEED = 7;
const DECK = V(-3.3, 1.2, 0);                    // where you stand on the ship (at the stern, by the tiller)
const TAU = Math.PI * 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawOf = (d) => Math.atan2(-d.z, d.x);      // the rotation.y that points local +x along d

// speed as a share of the best, by the angle off the wind (degrees; 0 = straight into it): nothing in the no-go zone,
// fastest across the wind (a beam reach), decent downwind
export function polar(a) {
  if (a < 40) return 0;
  if (a < 90) return Math.pow(Math.sin(((a - 40) / 50) * Math.PI / 2), 0.7);
  return 1 - 0.35 * Math.pow((a - 90) / 90, 1.3);
}

// A sea chest, lid open, heaped with gold
export function makeChest() {
  const g = new THREE.Group();
  const wood = clay(0x8a5a33), iron = clay(0x3a3530, { metalness: 0.4, roughness: 0.5 }), gold = clay(0xe8b94a, { metalness: 0.5, roughness: 0.35, emissive: 0x6a4a10, emissiveIntensity: 0.35 });
  const box = mesh(new THREE.BoxGeometry(1.2, 0.66, 0.8), wood); box.position.y = 0.33; g.add(box);
  for (const x of [-0.42, 0.42]) { const band = mesh(new THREE.BoxGeometry(0.08, 0.68, 0.82), iron); band.position.set(x, 0.33, 0); g.add(band); }
  const heap = mesh(new THREE.SphereGeometry(0.52, 20, 10), gold); heap.scale.set(1.08, 0.42, 0.7); heap.position.y = 0.66; g.add(heap);
  const lid = new THREE.Group(); lid.position.set(0, 0.66, -0.4); lid.rotation.x = -1.9; g.add(lid);
  const lidTop = mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI), wood); lidTop.rotation.z = Math.PI / 2; lidTop.rotation.x = -Math.PI / 2; lidTop.position.z = 0.4; lid.add(lidTop);
  const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), gold, 14), m = new THREE.Matrix4(), r = seeded(9);
  for (let i = 0; i < 14; i++) { m.makeRotationFromEuler(new THREE.Euler(r() - 0.5, 0, r() - 0.5)).setPosition((r() - 0.5) * 0.9, 0.78 + r() * 0.12, (r() - 0.5) * 0.45); coins.setMatrixAt(i, m); }
  coins.castShadow = true; g.add(coins);
  return g;
}

// A palm: a leaning, curving trunk and a crown of fronds
function makePalm(s = 1, lean = 0.3) {
  const g = new THREE.Group(), bark = clay(0x9a7453), leaf = clay(0x6f9a4f, { flatShading: true });
  let x = 0, y = 0;
  for (let i = 0; i < 6; i++) { const seg = mesh(new THREE.CylinderGeometry(0.16 * s, 0.2 * s, 0.7 * s, 8), bark); const a = lean * (i / 6); seg.position.set(x, y + 0.35 * s, 0); seg.rotation.z = -a; g.add(seg); x += Math.sin(a) * 0.7 * s; y += Math.cos(a) * 0.68 * s; }
  for (let k = 0; k < 7; k++) {
    const f = mesh(new THREE.ConeGeometry(0.28 * s, 1.9 * s, 4), leaf); f.scale.z = 0.25; f.geometry.translate(0, 0.95 * s, 0);
    f.position.set(x, y, 0); f.rotation.set(0, (k / 7) * TAU, 1.9); f.rotation.order = 'YZX'; g.add(f);
  }
  const nut = mesh(new THREE.SphereGeometry(0.13 * s, 10, 8), clay(0x6b4a33)); nut.position.set(x + 0.12, y - 0.15, 0.1); g.add(nut);
  return g;
}

// A plain sword, held in the right hand (the pivot is the grip; the blade points up)
function makeSword() {
  const pivot = new THREE.Group(), steel = clay(0xd8dde2, { metalness: 0.6, roughness: 0.3 });
  const blade = mesh(new THREE.BoxGeometry(0.09, 1.05, 0.03), steel); blade.position.y = 0.66; pivot.add(blade);
  const tip = mesh(new THREE.ConeGeometry(0.064, 0.16, 4), steel); tip.position.y = 1.26; tip.rotation.y = Math.PI / 4; tip.scale.z = 0.35; pivot.add(tip);
  const guard = mesh(new THREE.BoxGeometry(0.38, 0.06, 0.08), clay(0xc9a54c, { metalness: 0.5 })); guard.position.y = 0.12; pivot.add(guard);
  const grip = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8), clay(0x5a3d29)); pivot.add(grip);
  return pivot;
}

// a short synthesised croak (no sound files for frogs)
function croak(ac, vol) {
  const t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(150 + Math.random() * 60, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.28);
  f.type = 'lowpass'; f.frequency.value = 700;
  g.gain.setValueAtTime(0, t);
  for (let i = 0; i < 3; i++) { g.gain.linearRampToValueAtTime(vol, t + i * 0.09 + 0.02); g.gain.linearRampToValueAtTime(vol * 0.15, t + i * 0.09 + 0.07); }
  g.gain.linearRampToValueAtTime(0, t + 0.3);
  o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.32);
}

// a wooden creak: a slow stick-slip buzz through a narrow band (the house, shifting its weight)
function creak(ac, vol) {
  const t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), d = 0.7 + Math.random() * 0.5;
  o.type = 'sawtooth'; o.frequency.setValueAtTime(30 + Math.random() * 10, t); o.frequency.linearRampToValueAtTime(58, t + d * 0.6); o.frequency.linearRampToValueAtTime(36, t + d);
  f.type = 'bandpass'; f.frequency.value = 520 + Math.random() * 300; f.Q.value = 5;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.12); g.gain.linearRampToValueAtTime(vol * 0.6, t + d * 0.7); g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.05);
}

export function startVoyage(ctx, { root, ship, sea, ground, harbour }) {
  const { stage, player, interact, save } = ctx;
  const O = V(ship.position.x, 0, ship.position.z);           // the sea is laid out around where you set off
  const W = new THREE.Group(); root.add(W);
  const S = {
    mode: 'sail', at: null, h: ship.rotation.y, v: 4.5, trim: 0.75, side: 0, flips: 0, x: O.x, z: O.z, a: 90,
    chest: null, fight: 'idle', hp: 3, khp: 3, k: 'idle', sweets: false, visited: ['harbour'], homeT: -1,
  };
  let cutNext = false, dockT = 0, dockFrom = null, carryOn = null;
  const disposers = [];
  const listen = (el, type, fn) => { el.addEventListener(type, fn); disposers.push(() => el.removeEventListener(type, fn)); };

  // ---- the ship: from here it's yours. A fore-and-aft sail on a boom (so you can see it swing across when you tack),
  // a pennant at the masthead that streams downwind, and you at the stern
  ship.rotation.order = 'YXZ';
  const oldSail = ship.userData.parts.sail; oldSail.visible = false;
  const pivot = new THREE.Group(); pivot.position.set(0.6, 0, 0); ship.add(pivot);
  const belly = new THREE.Group(); pivot.add(belly);
  const sailGeo = new THREE.PlaneGeometry(1, 1, 10, 6), sp = sailGeo.attributes.position;
  for (let k = 0; k < sp.count; k++) {
    const u = 0.5 - sp.getX(k), v = sp.getY(k) + 0.5;            // u: 0 at the mast, 1 at the end of the boom; v: foot to head
    const top = 6.7 - 1.5 * u;
    sp.setXYZ(k, -3.8 * u, 3.55 + v * (top - 3.55), 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * Math.sin(Math.PI * (0.15 + 0.85 * v)));
  }
  sailGeo.computeVertexNormals();
  const sail = mesh(sailGeo, new THREE.MeshStandardMaterial({ color: oldSail.material.color.getHex(), side: THREE.DoubleSide, roughness: 0.9 })); belly.add(sail);
  const boom = mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.9, 8), clay(0x6b4a33)); boom.rotation.z = Math.PI / 2; boom.position.set(-1.95, 3.5, 0); pivot.add(boom);
  const penShape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(1.5, 0.16), new THREE.Vector2(0, 0.34)]);
  const pennant = new THREE.Mesh(new THREE.ShapeGeometry(penShape), new THREE.MeshStandardMaterial({ color: palette.trolley, side: THREE.DoubleSide, roughness: 0.8 }));
  pennant.position.set(0.6, 6.75, 0); ship.add(pennant);
  const deckChest = makeChest(); deckChest.scale.setScalar(0.7); deckChest.position.set(1.9, 1.2, 0); deckChest.visible = false; ship.add(deckChest);
  if (player.obj.parent !== stage.scene) { player.obj.parent?.remove(player.obj); stage.scene.add(player.obj); }
  player.enabled = false; player.locked = false; player.target = null; player.vel.set(0, 0, 0);
  const backChest = makeChest(); backChest.scale.setScalar(0.45); backChest.position.set(0, 1.05, -0.5); backChest.visible = false; player.obj.add(backChest);
  const sword = makeSword(); sword.position.set(0.42, 1.0, 0.18); sword.visible = false; player.obj.userData.body.add(sword);

  // ---- the sea around you: spray blowing downwind shows the wind
  const SPRAY = 46, spray = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 6, 4), clay(0xffffff), SPRAY); spray.castShadow = false; W.add(spray);
  const sprayP = Array.from({ length: SPRAY }, (_, i) => ({ p: V(0, -9, 0), life: (i / SPRAY) * 2 }));
  const m4 = new THREE.Matrix4();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ visible: false })); plane.rotation.x = -Math.PI / 2; plane.position.copy(O); W.add(plane); ground.push(plane);

  // ---- islands
  const isles = [];
  function addIsle(def) {
    const c = O.clone().add(V(def.at[0], 0, def.at[1]));
    const out = O.clone().sub(c).setY(0).normalize();
    if (def.turn) out.applyAxisAngle(V(0, 1, 0), def.turn);
    const side = V(out.z, 0, -out.x);
    const g = new THREE.Group(); g.position.copy(c); W.add(g);
    g.add(makeIsland({ radius: def.r, seed: def.seed ?? 5, color: def.color ?? 0xeadbb3, rim: def.rim ?? palette.groundEdge, decor: false }));
    const isle = { ...def, c, out, side, g, psi: yawOf(out) };
    if (def.beach) {
      isle.land = c.clone().addScaledVector(out, def.r - 1.4);
      isle.moor = c.clone().addScaledVector(out, def.r + 4.2);
      isle.moorH = isle.psi + Math.PI / 2;
    } else {
      // a wooden pier out from the shore; the ship ties up alongside its end
      const len = 8.5, pier = mesh(new THREE.BoxGeometry(len, 0.18, 1.5), clay(0xb89572));
      pier.position.copy(c).addScaledVector(out, def.r - 1.6 + len / 2).setY(-0.04); pier.rotation.y = isle.psi; W.add(pier);
      for (let s = 1; s < len; s += 2.2) for (const l of [-0.7, 0.7]) { const post = mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), clay(0x6b4a33)); post.position.copy(c).addScaledVector(out, def.r - 1.6 + s).addScaledVector(side, l).setY(-0.45); W.add(post); }
      isle.end = c.clone().addScaledVector(out, def.r + 6.4);
      isle.land = isle.end.clone();
      isle.moor = isle.end.clone().addScaledVector(side, 2.7).addScaledVector(out, -0.6);
      isle.moorH = isle.psi;
    }
    isles.push(isle); return isle;
  }
  // the harbour you set out from: tie up at your old berth, walk about the dock, board again. The dock and the other
  // ship keep you off (capsules: [x1, z1, x2, z2, r])
  {
    const out = V(0, 0, Math.sign(harbour.berth.z) || -1);
    isles.push({ id: 'harbour', name: 'The harbour', harbour: true, c: harbour.c.clone(), r: harbour.r, out, side: V(out.z, 0, -out.x),
      moor: harbour.berth.clone().setY(0), moorH: 0, land: harbour.land.clone(), walk: harbour.walkable, block: harbour.blockers, top: harbour.c.clone().setY(6), cam: [13, -3, 13, -2, 1.2] });
  }
  const AVOID = harbour.avoid;
  const at = (isle, f, s) => isle.c.clone().addScaledVector(isle.out, f).addScaledVector(isle.side, s);   // a spot on an island: f towards the landing, s across

  // the lighthouse (and its watcher)
  const LH = addIsle({ id: 'lighthouse', name: 'The lighthouse', at: [82, -26], r: 11, seed: 21, color: 0xd9d2b8 });
  const TOWER = at(LH, -5.2, -1.5);
  {
    const tw = new THREE.Group(); tw.position.copy(TOWER); W.add(tw);
    const tower = mesh(new THREE.CylinderGeometry(1.1, 1.6, 9, 20), clay(0xf6f1e7)); tower.position.y = 4.5; tw.add(tower);
    for (const y of [2.2, 5.6]) { const band = mesh(new THREE.CylinderGeometry(1.5 - y * 0.055, 1.55 - y * 0.055, 1, 20), clay(0xe0674f)); band.position.y = y; tw.add(band); }
    const gallery = mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.16, 20), clay(0x2b2a33)); gallery.position.y = 9.05; tw.add(gallery);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.1, 16), new THREE.MeshBasicMaterial({ color: 0xfff3c4 })); lamp.position.y = 9.7; tw.add(lamp);
    const cap = mesh(new THREE.ConeGeometry(1.2, 1.1, 20), clay(0x2b2a33)); cap.position.y = 10.8; tw.add(cap);
    const door = mesh(new THREE.BoxGeometry(0.9, 1.6, 0.1), clay(0x5a3d29)); door.position.set(0, 0.8, 1.52); door.rotation.x = -0.05; tw.add(door);
    tw.rotation.y = Math.atan2(LH.out.x, LH.out.z);
    const rr = seeded(4);
    for (let i = 0; i < 5; i++) { const t = makeTree(0.7 + rr() * 0.4, rr); const a = rr() * TAU; t.position.copy(LH.c).add(V(Math.cos(a) * 8, 0, Math.sin(a) * 8)); if (t.position.distanceTo(LH.land) > 7 && t.position.distanceTo(TOWER) > 3) W.add(t); }
  }
  const KEEPER_HOME = at(LH, -1.5, 1.2);
  const keeper = makeMonster(); keeper.scale.setScalar(0.85); keeper.rotation.order = 'YXZ'; keeper.position.copy(KEEPER_HOME); W.add(keeper);
  { const capBody = mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.36, 18), clay(0x2f3f5c)); capBody.position.y = 3.35; keeper.userData.body.add(capBody);
    const peak = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 18, 1, false, -Math.PI / 2, Math.PI), clay(0x1f2a3d)); peak.position.set(0, 3.2, 0.3); keeper.userData.body.add(peak);
    const badge = mesh(new THREE.SphereGeometry(0.08, 8, 6), clay(0xc9a54c, { metalness: 0.5 })); badge.position.set(0, 3.4, 0.64); keeper.userData.body.add(badge); }
  const stars = [0, 1, 2].map(() => { const s = mesh(new THREE.OctahedronGeometry(0.16), clay(0xf2c14e)); s.visible = false; W.add(s); return s; });
  const stripe = new THREE.Group(); W.add(stripe);
  { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 7), new THREE.MeshBasicMaterial({ color: palette.trolley, transparent: true, opacity: 0.35, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.set(0, 0.04, 3.5); stripe.add(s); stripe.visible = false; }
  // the cellar door: a pair of slanted wooden doors in a stone frame
  const CELLAR_DOOR = at(LH, -2.6, -5.6);
  const cellarDoors = [];
  {
    const cd = new THREE.Group(); cd.position.copy(CELLAR_DOOR); cd.rotation.y = Math.atan2(LH.side.x, LH.side.z) + Math.PI; W.add(cd);
    const frame = mesh(new THREE.BoxGeometry(2.2, 0.35, 1.9), clay(0xb0a590)); frame.position.y = 0.12; cd.add(frame);
    const hole = mesh(new THREE.BoxGeometry(1.8, 0.02, 1.5), clay(0x1f1b1a)); hole.position.y = 0.31; cd.add(hole);
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(s * 0.9, 0.34, 0); cd.add(hinge);
      const leaf = mesh(new THREE.BoxGeometry(0.9, 0.08, 1.5), clay(0x7a5230)); leaf.position.set(-s * 0.45, 0.05, 0); hinge.add(leaf);
      const ring = mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), clay(0x3a3530)); ring.position.set(-s * 0.8, 0.1, 0); ring.rotation.x = Math.PI / 2; hinge.add(ring);
      hinge.rotation.z = s * 0.12; cellarDoors.push({ hinge, s });
    }
  }

  // North Sentinel Island: the people there have made it plain they want to be left alone
  const NS = addIsle({ id: 'sentinel', name: 'North Sentinel Island', at: [-38, -84], r: 17, seed: 31, color: 0xeee0b8, beach: true });
  const sentinels = [];
  {
    const rr = seeded(12);
    for (let i = 0; i < 70; i++) {
      const a = rr() * TAU, rad = 2 + rr() * (NS.r - 3.5), p = NS.c.clone().add(V(Math.cos(a) * rad, 0, Math.sin(a) * rad));
      if (p.distanceTo(NS.land) < 6.5) continue;
      const t = makeTree(1 + rr() * 0.7, rr); t.position.copy(p); t.rotation.y = rr() * TAU; W.add(t);
    }
    const tones = [0x8a6a4a, 0xa7825f, 0x7a5a3c, 0x9a7453, 0x8c6d52, 0x6f5a45];
    for (let k = 0; k < 6; k++) {
      const f = makePerson({ color: tones[k] }); const home = at(NS, NS.r - 7.6 + (k % 2) * 0.5, (k - 2.5) * 1.9);
      f.position.copy(home); f.rotation.y = Math.atan2(NS.out.x, NS.out.z); W.add(f);
      const bow = new THREE.Group();
      const arc = mesh(new THREE.TorusGeometry(0.6, 0.035, 6, 18, Math.PI * 0.9), clay(0x5a3d29)); arc.rotation.z = Math.PI / 2 + Math.PI * 0.05; bow.add(arc);
      const string = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.18, 4), clay(0xe8e0cc)); string.position.x = 0.02; bow.add(string);
      bow.position.set(0.42, 1.05, 0.12); bow.rotation.set(0, Math.PI / 2, 0.15); f.userData.body.add(bow);
      sentinels.push({ f, home, bow, fwd: 0 });
    }
  }
  const sweets = new THREE.Group(); sweets.visible = false; W.add(sweets);
  { const bag = mesh(new THREE.SphereGeometry(0.22, 12, 10), clay(0xf6f1e7)); bag.scale.set(1, 0.8, 1); bag.position.y = 0.16; sweets.add(bag);
    const tie = mesh(new THREE.ConeGeometry(0.1, 0.18, 8), clay(0xf6f1e7)); tie.position.y = 0.38; sweets.add(tie);
    [0xe0674f, 0x6cbf4a, 0xf2c14e, 0x7a5a8c, 0x5b7fa6].forEach((col, i) => { const s = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.07), clay(col)); s.position.set(Math.cos(i * 1.3) * 0.34, 0.04, Math.sin(i * 1.3) * 0.34); s.rotation.y = i; sweets.add(s); }); }

  // the island of frogs, with a pond
  const FR = addIsle({ id: 'frogs', name: 'An island of frogs', at: [36, -92], r: 10, seed: 44, color: 0xb9c99a });
  const frogs = [];
  {
    const pond = mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.06, 32), clay(0x7fb0a8, { roughness: 0.3 })); pond.position.copy(at(FR, -2, 0)).setY(0.02); pond.castShadow = false; W.add(pond);
    for (let i = 0; i < 5; i++) { const pad = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.03, 14, 1, false, 0.3, TAU - 0.6), clay(0x5e9a4a)); pad.position.copy(pond.position).add(V(Math.cos(i * 1.7) * 2, 0.04, Math.sin(i * 1.7) * 2)); W.add(pad); }
    const rr = seeded(8);
    for (let i = 0; i < 16; i++) {
      const f = frogExtras(makeFrog({ scale: 0.5 + rr() * 0.35 })); const a = rr() * TAU, rad = 1.5 + rr() * 6.5;
      f.position.copy(FR.c).add(V(Math.cos(a) * rad, 0, Math.sin(a) * rad)); f.rotation.y = rr() * TAU; W.add(f);
      frogs.push({ f, from: f.position.clone(), to: f.position.clone(), t: 1, wait: rr() * 3, croak: -1, next: 2 + rr() * 6 });
    }
    for (let i = 0; i < 3; i++) { const t = makeTree(0.8, rr); t.position.copy(at(FR, -6 + i, (i - 1) * 5)); W.add(t); }
  }

  // two nearly empty islands: a palm, a rock, a bottle
  const E1 = addIsle({ id: 'palm', name: 'A small island', at: [128, 34], r: 5, seed: 13, color: 0xeee0b8 });
  { const p = makePalm(1.2, 0.5); p.position.copy(at(E1, -1.2, 0.5)); p.rotation.y = 0.6; W.add(p); const rk = makeRock(1.3, seeded(3)); rk.position.copy(at(E1, 0.2, -2.2)); W.add(rk); }
  const BOTTLE = at(E1, 3.4, 1.4);
  { const b = new THREE.Group(); const glass = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 12), clay(0x7fae8f, { roughness: 0.25, transparent: true, opacity: 0.8 })); glass.rotation.z = Math.PI / 2; b.add(glass);
    const neck = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.2, 10), glass.material); neck.rotation.z = Math.PI / 2; neck.position.x = 0.33; b.add(neck);
    const cork = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), clay(0xb8956a)); cork.rotation.z = Math.PI / 2; cork.position.x = 0.46; b.add(cork);
    const note = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 8), clay(0xf6f0e2)); note.rotation.z = Math.PI / 2; b.add(note);
    b.position.copy(BOTTLE).setY(0.14); b.rotation.y = 0.8; W.add(b); }
  const E2 = addIsle({ id: 'rock', name: 'A small island', at: [-26, 58], r: 4.2, seed: 17, color: 0xe4d8bb });
  { const rr = seeded(6); const rk = makeRock(2.2, rr); rk.position.copy(at(E2, -0.8, 0)); W.add(rk); const p = makePalm(1, 0.35); p.position.copy(at(E2, 0.6, 1.6)); p.rotation.y = 2; W.add(p); }

  // the house's island (upwind: you'll have to tack to get home), and the house: a palace on chicken legs, facing the pier
  const HO = addIsle({ id: 'house', name: 'The house', at: [58, 104], r: 12, seed: 9, color: 0xe4d6b4, top: 19, cam: [20, -6, 12, -4, 5] });
  const PAL_AT = -4, palace = makePalace(WIND); palace.g.position.copy(at(HO, PAL_AT, 0)); palace.g.rotation.y = Math.atan2(HO.out.x, HO.out.z); W.add(palace.g);
  const PAL = palace.g.position, palYaw = palace.g.rotation.y;
  const palLocal = (p) => { const d = V(p.x - PAL.x, 0, p.z - PAL.z); return { x: d.dot(HO.side), z: d.dot(HO.out) }; };
  const palWorld = (x, z) => PAL.clone().addScaledVector(HO.side, x).addScaledVector(HO.out, z);
  {
    const rr = seeded(19), stone = clay(0xcfc4ad);
    for (let f = palace.rampFoot + 1; f < HO.r - 1.6 - PAL_AT; f += 1.25) { const st = mesh(new THREE.CylinderGeometry(0.45 + rr() * 0.15, 0.5, 0.08, 9), stone); st.position.copy(palWorld((rr() - 0.5) * 0.5, f)).setY(0.02); st.castShadow = false; W.add(st); }
    for (const [x, z, s] of [[-7.5, 5.5, 1], [7.8, 4.2, 0.8], [-8.4, -4, 1.2], [8.6, -5.2, 0.9]]) { const t = makeLollipop(s, [0x4f7a3a, 0x5d8a45, 0x3f6a35][Math.round(s * 10) % 3]); t.position.copy(palWorld(x, z)); W.add(t); }
    for (const [x, z] of [[-4.5, 8], [5, 7.5]]) { const rk = makeRock(0.9, rr); rk.position.copy(palWorld(x, z)); W.add(rk); }
  }

  // ---- the cellar under the lighthouse (built off to one side of the world; you get there through the doors)
  const CEL = O.clone().add(V(0, 0, -700));
  {
    const c = new THREE.Group(); c.position.copy(CEL); W.add(c);
    const stone = clay(0x6f675c), dark = clay(0x4a443d);
    const floor = mesh(new THREE.BoxGeometry(8, 0.3, 6), stone); floor.position.y = -0.15; c.add(floor);
    for (const [x, z, w, d] of [[0, -3.1, 8.4, 0.3], [-4.1, 0, 0.3, 6.4], [4.1, 0, 0.3, 6.4]]) { const wall = mesh(new THREE.BoxGeometry(w, 3.4, d), dark); wall.position.set(x, 1.7, z); c.add(wall); }
    for (let i = 0; i < 6; i++) { const st = mesh(new THREE.BoxGeometry(1.4, 0.3 + i * 0.5, 0.6), stone); st.position.set(2.9, (0.3 + i * 0.5) / 2, 0.4 - i * 0.6); c.add(st); }
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending })); shaft.position.set(2.9, 2.6, -2.2); shaft.rotation.x = -0.4; c.add(shaft);
    const lid = mesh(new THREE.BoxGeometry(9, 0.3, 7), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })); lid.position.y = 3.6; lid.receiveShadow = false; c.add(lid);   // casts shadow only: it's dim down here
    const lamp = new THREE.PointLight(0xffc27a, 18, 12, 1.4); lamp.position.set(-1.5, 2.6, -0.5); c.add(lamp);
    const lantern = mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd79a })); lantern.position.copy(lamp.position); c.add(lantern);
    for (const [x, z] of [[-3.3, -2.4], [-3.3, 1.8]]) { const barrel = mesh(new THREE.CylinderGeometry(0.45, 0.4, 1, 14), clay(0x8a5a33)); barrel.position.set(x, 0.5, z); c.add(barrel); }
  }
  const CHEST_AT = CEL.clone().add(V(-1.2, 0, -2.1));
  const cellarChest = makeChest(); cellarChest.position.copy(CHEST_AT); W.add(cellarChest);

  // ---- state helpers
  const isle = () => isles.find((i) => i.id === S.at);
  const fwd = () => V(Math.cos(S.h), 0, -Math.sin(S.h));
  const hudRoot = document.getElementById('ui');
  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;inset:0;visibility:visible;pointer-events:none;font-family:var(--sans)';
  hud.innerHTML = `<div class="v-hearts" style="position:absolute;right:18px;top:calc(18px + env(safe-area-inset-top,0px));background:rgba(255,252,245,.94);border-radius:14px;padding:10px 16px;font:600 17px/1.5 var(--sans);box-shadow:0 8px 24px rgba(60,40,20,.12);display:none"></div>
    <div class="v-wind" style="position:absolute;left:18px;bottom:22px;width:84px;height:84px;border-radius:50%;background:rgba(255,252,245,.9);box-shadow:0 8px 24px rgba(60,40,20,.12);text-align:center">
      <div class="v-arrow" style="position:absolute;left:50%;top:50%;width:0;height:0;transition:none"><div style="position:absolute;left:-4px;top:-26px;width:8px;height:40px;background:${css(0x5b7fa6)};border-radius:4px"></div><div style="position:absolute;left:-11px;top:10px;border:11px solid transparent;border-top:14px solid ${css(0x5b7fa6)};border-bottom:0"></div></div>
      <div style="position:absolute;left:0;right:0;bottom:-20px;font:600 12px/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:#6b6259">wind</div></div>
    <button class="v-swing" style="position:absolute;right:22px;bottom:26px;display:none;pointer-events:auto;border:0;border-radius:999px;padding:16px 26px;font:600 18px var(--sans);background:${css(0x3f8f86)};color:#fff">Swing</button>`;
  hudRoot.appendChild(hud);
  const heartsEl = hud.querySelector('.v-hearts'), windEl = hud.querySelector('.v-wind'), arrowEl = hud.querySelector('.v-arrow'), swingBtn = hud.querySelector('.v-swing');
  const heartRow = (n) => [0, 1, 2].map((i) => `<span style="color:${i < n ? '#e0674f' : '#d8cfc2'}">♥</span>`).join('');
  const drawHearts = () => { heartsEl.innerHTML = `<div>You ${heartRow(S.hp)}</div><div>The watcher ${heartRow(S.khp)}</div>`; };

  // ---- sailing input: arrows / WASD, or hold on the left, right or middle of the screen
  let touch = null;
  const canvas = stage.renderer.domElement;
  listen(canvas, 'pointerdown', (e) => { if (S.mode === 'sail') touch = e.clientX < innerWidth * 0.35 ? 'left' : e.clientX > innerWidth * 0.65 ? 'right' : 'up'; });
  listen(window, 'pointerup', () => (touch = null));
  const key = (...codes) => codes.some((c) => player.keys.has(c));

  // ---- landing and boarding
  function goAshore(i) {
    S.mode = 'docking'; S.at = i.id; dockT = 0; dockFrom = { p: ship.position.clone(), h: S.h }; S.v = 0;
    if (!S.visited.includes(i.id)) S.visited.push(i.id);
  }
  function landPlayer(i) {
    S.mode = 'land';
    player.place(i.land.x, i.land.z, Math.atan2(-i.out.x, -i.out.z));
    player.enabled = true;
    if (i.id === 'sentinel') warnOff();
  }
  function board() {
    const i = isle();
    if (S.chest === 'hand') { S.chest = 'ship'; backChest.visible = false; deckChest.visible = true; ctx.toast('The chest goes on deck.', 2.5); }
    if (i.id === 'lighthouse' && S.fight !== 'won') resetFight();
    S.mode = 'sail'; S.v = 0; S.h = i.moorH; player.enabled = false; player.target = null; sword.visible = false;
    if (i.id === 'sentinel') sentinels.forEach((s) => (s.lower = true));
  }
  for (const i of isles) {
    interact.add({ pos: () => i.moor, radius: 9, height: 3, prompt: i.harbour ? 'Tie up at the dock' : i.beach ? 'Wade ashore' : 'Go ashore', enabled: () => S.mode === 'sail', onUse: () => goAshore(i) });
    interact.add({ pos: () => i.land.clone().addScaledVector(i.out, i.beach ? 0.6 : 0.3), radius: 1.5, height: 2.4, prompt: i.beach ? 'Wade back to the ship' : 'Board the ship',
      enabled: () => S.mode === 'land' && S.at === i.id && S.fight !== 'on' && S.fight !== 'down' && !S.leaving, onUse: board });
  }

  // ---- the lighthouse watcher: talks, then fights
  const K = { p: KEEPER_HOME.clone(), yaw: 0, t: 0, dir: V(0, 0, 1), inv: 0, fall: 0 };
  let inv = 0, swingT = -1, hitDone = false, talkToken = 0;
  const say = (text, secs) => ctx.speak(keeper, text, { offset: [0, 3.4, 0], secs });
  function resetFight() {
    talkToken++; S.fight = 'idle'; S.k = 'idle'; S.hp = 3; S.khp = 3; K.p.copy(KEEPER_HOME); K.fall = 0;
    keeper.rotation.x = 0; keeper.position.copy(KEEPER_HOME); stripe.visible = false; stars.forEach((s) => (s.visible = false));
    heartsEl.style.display = 'none'; swingBtn.style.display = 'none'; sword.visible = false;
  }
  async function keeperTalk() {
    const tok = ++talkToken; S.fight = 'talk';
    const lines = ['A VISITOR! NOBODY COMES OUT HERE.', 'I AM THE LIGHTHOUSE WATCHER. I WATCH THE LIGHTHOUSE.', 'IT HAS NEVER ONCE GONE OUT. BECAUSE I WATCH IT.',
      'YOU ARE LOOKING AT MY CELLAR. EVERYBODY WANTS WHAT IS IN MY CELLAR.', 'I AM VERY SORRY. I SHALL HAVE TO SQUASH YOU.'];
    for (const l of lines) { say(l, 2.9); await ctx.wait(3.1); if (tok !== talkToken) return; }
    S.fight = 'on'; S.k = 'approach'; K.t = 0; drawHearts(); heartsEl.style.display = 'block';
    if (matchMedia('(pointer: coarse)').matches) swingBtn.style.display = 'block';
    sword.visible = true; brandish = 0;
    ctx.toast(`You have a sword. <b>E</b> to swing it.<br><span style="font-size:17px">Step aside when he crouches; strike while he's dizzy.</span>`, 6);
  }
  let brandish = -1;
  function swing() {
    if (S.mode !== 'land' || S.at !== 'lighthouse' || S.fight !== 'on' || swingT >= 0) return;
    swingT = 0; hitDone = false;
    const d = K.p.clone().sub(player.pos).setY(0);
    if (d.length() < 4) player.obj.rotation.y = Math.atan2(d.x, d.z);   // a little help with aiming
  }
  listen(window, 'keydown', (e) => { if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) swing(); });
  swingBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); swing(); });
  async function playerDown() {
    S.fight = 'down'; player.enabled = false; player.target = null; stripe.visible = false;
    say('OH DEAR. THERE WE ARE.', 2.6);
    await ctx.wait(2.2); await ctx.flash(true);
    player.obj.rotation.x = 0; resetFight();
    S.at = 'lighthouse'; S.mode = 'sail'; S.v = 0; S.h = LH.moorH; ship.position.copy(LH.moor).setY(-0.25); cutNext = true;
    await ctx.flash(false);
    ctx.toast('You wake up on your ship, tied up at the lighthouse.', 4);
  }
  async function keeperDown() {
    S.fight = 'won'; S.k = 'down'; stripe.visible = false; swingBtn.style.display = 'none';
    say('OOF.', 1.6); await ctx.wait(1.8);
    say('ALL RIGHT. ALL RIGHT! TAKE IT. I ONLY WANTED SOMEBODY TO TALK TO.', 4); await ctx.wait(1.2);
    cellarOpen = 0; heartsEl.style.display = 'none'; sword.visible = false;
    ctx.toast('The cellar doors swing open.', 3);
  }
  let cellarOpen = -1;
  interact.trigger({ test: (p) => S.mode === 'land' && S.at === 'lighthouse' && p.distanceTo(K.p) < 8.5, once: false, when: () => S.fight === 'idle', onEnter: keeperTalk });
  talk(keeper, () => (S.fight === 'won' ? ['IT IS STILL MY LIGHTHOUSE.', 'COME BACK AND TALK SOMETIME.', 'MIND THE STEPS.'] : null));
  function talk(who, lines) {
    let n = 0;
    interact.add({ pos: () => K.p, radius: 2.6, height: 3, prompt: 'Talk', aside: true, enabled: () => S.mode === 'land' && S.at === 'lighthouse' && S.fight === 'won' && !!lines(),
      onUse: () => { const l = lines(); say(l[n++ % l.length], 3); } });
  }
  interact.add({ pos: CELLAR_DOOR.clone(), radius: 2.2, height: 1.4, prompt: () => (S.fight === 'won' ? 'Go down into the cellar' : 'Try the cellar door'),
    enabled: () => S.mode === 'land' && S.at === 'lighthouse' && S.fight !== 'on' && S.fight !== 'down',
    onUse: async () => {
      if (S.fight !== 'won') { ctx.toast('Locked. Something heavy is holding it shut from inside.', 3); return; }
      player.enabled = false; await ctx.flash(true);
      S.mode = 'cellar'; player.place(CEL.x + 2.2, CEL.z + 1.4, -2.4); player.enabled = true; cutNext = true;
      stage.scene.background = new THREE.Color(0x2b2622); stage.scene.fog = new THREE.Fog(0x2b2622, 20, 40); stage.hemi.intensity = 0.7;
      await ctx.flash(false);
    } });
  interact.add({ pos: CHEST_AT.clone().add(V(0, 0, 1.1)), radius: 1.6, height: 1.6, prompt: 'Take the chest of gold', enabled: () => S.mode === 'cellar' && cellarChest.visible,
    onUse: () => { cellarChest.visible = false; backChest.visible = true; S.chest = 'hand'; ctx.toast('It is very heavy, and very full.', 3); } });
  interact.add({ pos: CEL.clone().add(V(2.9, 0, 1.2)), radius: 1.3, height: 2.2, prompt: 'Climb back up', enabled: () => S.mode === 'cellar',
    onUse: async () => {
      player.enabled = false; await ctx.flash(true);
      stage.scene.background = new THREE.Color(palette.sky); stage.scene.fog = new THREE.Fog(palette.sky, 60, 180); stage.hemi.intensity = 1.6;
      S.mode = 'land'; const p = CELLAR_DOOR.clone().addScaledVector(LH.out, 1.8); player.place(p.x, p.z, Math.atan2(LH.out.x, LH.out.z)); player.enabled = true; cutNext = true;
      await ctx.flash(false);
    } });

  // ---- North Sentinel: warned off; a bag of sweets at the waterline, then you go
  function warnOff() { sentinels.forEach((s) => { s.warn = true; s.lower = false; }); if (!S.warned) { S.warned = true; ctx.toast('The people in the trees are telling you to go.', 4); } }
  interact.add({ pos: () => NS.land.clone().addScaledVector(NS.side, 1.8).addScaledVector(NS.out, 0.4), radius: 1.5, height: 1.8, prompt: 'Leave a bag of sweets at the waterline',
    enabled: () => S.mode === 'land' && S.at === 'sentinel' && !S.sweets,
    onUse: async () => {
      S.sweets = true; S.leaving = true; sweets.visible = true; sweets.position.copy(NS.land).addScaledVector(NS.side, 1.8).addScaledVector(NS.out, 0.9).setY(0);
      ctx.toast(`<span style="display:block;max-width:34em;font-size:19px">The people of North Sentinel Island have made it plain, for as long as anyone has tried to visit, that they want to be left alone. Outsiders can carry illnesses they have no protection against, so the law keeps everyone away.<br><br>You leave the sweets, and go.</span>`, 10);
      await ctx.wait(2.5);
      player.locked = true; player.target = NS.land.clone().addScaledVector(NS.out, 0.6);
      await ctx.wait(2); player.locked = false; S.leaving = false; board();
    } });

  // ---- home: in at the palace's front door; it shuts, the drawbridge comes up, the house stands up on its legs; the card
  interact.add({ pos: () => palWorld(0, palace.rampFoot + 0.8), radius: 1.8, height: 2.6, prompt: 'Go in at the front door', terminal: true,
    enabled: () => S.mode === 'land' && S.at === 'house',
    onUse: () => {
      S.mode = 'home'; S.homeT = 0; S.inside = -1; player.enabled = false; player.target = null;
      if (S.chest) { save.keep('chest-of-gold'); ctx.toast('The chest of gold will be waiting in the museum.', 4); }
    } });
  function updateHome(dt) {
    const T = (S.homeT += dt);
    if (S.inside < 0) {
      palace.door = easeInOut(T / 1.1);
      if (T > 0.5 && !player.enabled) { player.enabled = true; player.locked = true; player.target = palWorld(0, 1.9); }
      const q = palLocal(player.pos), ry = palace.rampY(q.z); player.pos.y = ry > 0 ? ry + palace.g.children[0].position.y : 0;   // (up the drawbridge)
      if (T > 0.5 && (q.z < 2.3 || T > 9)) { S.inside = T; player.obj.visible = false; player.enabled = false; player.locked = false; player.target = null; }
      return;
    }
    const k = T - S.inside;
    palace.door = 1 - easeInOut(k / 0.9);
    palace.ramp = 1 - easeInOut((k - 0.8) / 1.4);
    palace.lift = easeInOut((k - 1.8) / 2);
    palace.burst = clamp((k - 1.8) / 0.5) * clamp(1 - (k - 3.8) / 2);
    if (k > 1.8 && !S.stood) { S.stood = true; const a = audio(); if (a) { creak(a, 0.12); setTimeout(() => creak(a, 0.09), 700); } }
    if (k > 5 && !S.over) {
      S.over = true;
      ctx.gameOver({ title: 'You sailed home', text: 'You sailed it out and back again, and the sea wore at it all the way. Is it still the same ship you set out in?' });
    }
  }
  interact.add({ pos: BOTTLE.clone(), radius: 1.4, height: 1, prompt: 'Read the note in the bottle', aside: true, enabled: () => S.mode === 'land' && S.at === 'palm',
    onUse: () => ctx.toast('<i>Having a lovely time. Nobody here but me. Wish you were here.</i>', 4) });

  let ac = null;
  const audio = () => { try { ac = ac ?? new (window.AudioContext || window.webkitAudioContext)(); return ac.state === 'running' ? ac : (ac.resume(), null); } catch { return null; } };

  ctx.toast('<b>←</b> <b>→</b> steer · <b>↑</b> trim the sail · <b>↓</b> ease it<br><span style="font-size:17px">You can\'t sail straight into the wind: zigzag.</span>', 6);

  // ------------------------------------------------------------------ per frame
  function sailPhysics(dt, t) {
    const steer = (key('ArrowLeft', 'KeyA') || touch === 'left' ? 1 : 0) - (key('ArrowRight', 'KeyD') || touch === 'right' ? 1 : 0);
    if (key('ArrowUp', 'KeyW') || touch === 'up') S.trim = Math.min(1, S.trim + dt * 0.7);
    if (key('ArrowDown', 'KeyS')) S.trim = Math.max(0.15, S.trim - dt * 0.7);
    S.h = wrap(S.h + steer * (0.3 + 0.5 * clamp(S.v / 5)) * dt);
    const f = fwd();
    S.a = THREE.MathUtils.radToDeg(Math.acos(clamp(-f.dot(WIND), -1, 1)));    // degrees off the wind
    const target = MAX_SPEED * polar(S.a) * (0.3 + 0.7 * S.trim);
    S.v += (target - S.v) * (1 - Math.exp(-dt * (target > S.v ? 0.5 : 0.8)));
    const pos = ship.position;
    pos.addScaledVector(f, S.v * dt);
    if (S.a < 40) pos.addScaledVector(WIND, 0.6 * dt);                        // in irons: blown slowly backwards
    // islands (and the harbour you left) push you off
    for (const c of isles.map((i) => ({ c: i.c, r: i.r + 3.2 }))) {
      const d = V(pos.x - c.c.x, 0, pos.z - c.c.z), l = d.length();
      if (l < c.r) { pos.x = c.c.x + (d.x / l) * c.r; pos.z = c.c.z + (d.z / l) * c.r; S.v *= 0.5; }
    }
    for (const [x1, z1, x2, z2, r] of AVOID) {                                // the dock, and the other ship
      const ex = x2 - x1, ez = z2 - z1, k = clamp(((pos.x - x1) * ex + (pos.z - z1) * ez) / (ex * ex + ez * ez));
      const cx = x1 + ex * k, cz = z1 + ez * k, dx = pos.x - cx, dz = pos.z - cz, l = Math.hypot(dx, dz);
      if (l < r) { pos.x = cx + (dx / (l || 1)) * r; pos.z = cz + (dz / (l || 1)) * r; S.v *= 0.5; }
    }
    const fromO = V(pos.x - O.x, 0, pos.z - O.z);
    if (fromO.length() > 230) { fromO.setLength(230); pos.x = O.x + fromO.x; pos.z = O.z + fromO.z; }
    // which side the wind is on (the sail goes to the other); count every time it swaps
    const side = Math.cos(S.h) > 0 ? -1 : 1;
    if (S.side && side !== S.side) S.flips++;
    S.side = side;
  }
  function rig(dt, t, sailing) {
    const luff = S.a < 40 || !sailing;
    const want = luff ? S.side * 0.12 : S.side * THREE.MathUtils.degToRad(clamp(S.a / 2 + (1 - S.trim) * 25, 10, 85));
    pivot.rotation.y += (want - pivot.rotation.y) * (1 - Math.exp(-dt * 2.2));
    belly.scale.z = lerp(belly.scale.z, luff ? 0.15 + 0.25 * Math.sin(t * 13) : S.side * (0.6 + 0.4 * S.trim), 1 - Math.exp(-dt * 4));
    const penYaw = yawOf(WIND) - S.h;
    pennant.rotation.y = penYaw + Math.sin(t * 9) * 0.15;
    const heel = sailing && !luff ? S.side * 0.1 * clamp(S.v / MAX_SPEED) * (1 - Math.abs(S.a - 90) / 140) : 0;
    ship.rotation.x = lerp(ship.rotation.x, heel + Math.sin(t * 0.9) * 0.02, 1 - Math.exp(-dt * 2));
    ship.rotation.z = Math.sin(t * 1.1) * 0.025;
    ship.rotation.y = S.h;
    ship.position.y = -0.25 + Math.sin(t * 1.3) * 0.06;
  }
  function onDeck() {
    ship.updateMatrixWorld(true);
    const p = ship.localToWorld(DECK.clone());
    player.pos.copy(p); player.obj.rotation.y = S.h + Math.PI / 2; player.vel.set(0, 0, 0);
  }
  function updateFight(dt, t) {
    const toP = player.pos.clone().sub(K.p).setY(0), dist = toP.length();
    K.t += dt; inv = Math.max(0, inv - dt);
    player.obj.visible = inv > 0 ? Math.sin(t * 40) > -0.3 : true;
    const faceP = () => (K.yaw = Math.atan2(toP.x, toP.z));
    const body = keeper.userData.body;
    body.scale.set(1, 1, 1); stripe.visible = false; stars.forEach((s) => (s.visible = false));
    if (S.k === 'approach') {
      faceP();
      if (dist > 4.2) K.p.addScaledVector(toP.normalize(), Math.min(1.8 * dt, dist - 4.2));
      body.position.y = Math.abs(Math.sin(t * 7)) * 0.12;
      if (K.t > 1.4 && dist < 6) { S.k = 'windup'; K.t = 0; K.dir.copy(toP).normalize(); }
    } else if (S.k === 'windup') {
      const k = clamp(K.t / 1.0);
      body.scale.set(1 + 0.12 * k, 1 - 0.2 * k, 1 + 0.12 * k); body.position.y = 0;
      stripe.visible = true; stripe.position.copy(K.p).setY(0); stripe.rotation.y = Math.atan2(K.dir.x, K.dir.z);
      stripe.children[0].material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t * 10));
      K.yaw = Math.atan2(K.dir.x, K.dir.z);
      if (K.t > 1.0) { S.k = 'lunge'; K.t = 0; K.from = K.p.clone(); }
    } else if (S.k === 'lunge') {
      const k = easeOut(clamp(K.t / 0.4));
      K.p.copy(K.from).addScaledVector(K.dir, 7 * k); body.position.y = Math.sin(Math.PI * k) * 0.8;
      if (inv <= 0 && dist < 1.9) {                                             // caught you
        S.hp--; drawHearts(); inv = 1.4;
        const away = toP.clone().normalize();
        for (let i = 0; i < 10; i++) { const nx = player.pos.x + away.x * 0.2, nz = player.pos.z + away.z * 0.2; if (walkable(nx, nz)) { player.pos.x = nx; player.pos.z = nz; } }
        say(['BONK.', 'SQUASH!', 'GOT YOU.'][S.hp % 3], 1.5);
        if (S.hp <= 0) { player.obj.rotation.x = -1.35; player.pos.y = 0.35; playerDown(); return; }
      }
      if (K.t > 0.4) { S.k = 'dizzy'; K.t = 0; }
    } else if (S.k === 'dizzy') {
      body.rotation.z = Math.sin(t * 5) * 0.12; body.position.y = 0;
      stars.forEach((s, i) => { const a = t * 3 + (i * TAU) / 3; s.visible = true; s.position.copy(K.p).add(V(Math.cos(a) * 0.9, 3.4, Math.sin(a) * 0.9)); s.rotation.y = t * 4; });
      if (K.t > 2.4) { S.k = 'approach'; K.t = 0; body.rotation.z = 0; }
    } else if (S.k === 'hurt') {
      body.rotation.z = Math.sin(t * 30) * 0.1 * (1 - K.t);
      K.p.addScaledVector(K.dir, -2.5 * dt * (1 - K.t));
      if (K.t > 0.8) { S.k = 'approach'; K.t = 0; body.rotation.z = 0; }
    }
    // stay on the island, and out of the lighthouse
    const fromC = K.p.clone().sub(LH.c).setY(0); if (fromC.length() > LH.r - 1.8) K.p.copy(LH.c).add(fromC.setLength(LH.r - 1.8));
    const fromT = K.p.clone().sub(TOWER).setY(0); if (fromT.length() < 2.8) K.p.copy(TOWER).add(fromT.setLength(2.8));
    // your sword
    if (swingT >= 0 && !hitDone && swingT > 0.12) {
      hitDone = true;
      const d = K.p.clone().sub(player.pos).setY(0), facing = V(Math.sin(player.obj.rotation.y), 0, Math.cos(player.obj.rotation.y));
      if (d.length() < 3 && d.normalize().dot(facing) > 0.2) {
        if (S.k === 'dizzy') {
          S.khp--; drawHearts(); K.dir.copy(d); S.k = 'hurt'; K.t = 0;
          say(['OW.', 'OW! THAT IS MY FOOT.', 'OOF.'][S.khp % 3], 1.4);
          if (S.khp <= 0) keeperDown();
        } else if (S.k === 'approach' || S.k === 'windup') say(['NOT WHILE I AM LOOKING.', 'HA! MISSED.'][Math.floor(t) % 2], 1.4);
      }
    }
  }
  function updateKeeper(dt, t) {
    const body = keeper.userData.body;
    if (S.fight === 'on' && S.mode === 'land') updateFight(dt, t);
    else if (S.fight === 'won') {
      K.fall = Math.min(1, K.fall + dt * 1.6);
      keeper.rotation.x = -1.35 * easeOut(K.fall) + (K.fall < 1 ? 0 : Math.sin(t * 2) * 0.02);
      body.position.y = K.fall < 1 ? Math.sin(Math.PI * K.fall) * 0.4 : 0; body.scale.set(1, 1, 1);
      stars.forEach((s, i) => { const a = t * 2 + (i * TAU) / 3; s.visible = K.fall >= 1 && t % 12 < 6; s.position.copy(K.p).add(V(Math.cos(a) * 0.9, 0.9, Math.sin(a) * 0.9)); });
    } else if (S.fight === 'talk' || S.fight === 'idle') {
      const toP = player.pos.clone().sub(K.p);
      if (S.mode === 'land' && S.at === 'lighthouse') K.yaw = Math.atan2(toP.x, toP.z);
      body.position.y = Math.abs(Math.sin(t * 2.2)) * 0.06; body.scale.set(1, 1, 1);
    }
    let d = K.yaw - keeper.rotation.y; d = wrap(d); keeper.rotation.y += d * (1 - Math.exp(-dt * 8));
    keeper.position.copy(K.p);
    keeper.userData.mouth.scale.y = 0.6 + (S.fight === 'talk' ? Math.abs(Math.sin(t * 12)) * 0.4 : 0);
    // the sword: swing, or the flourish when it first appears
    if (swingT >= 0) { swingT += dt; const k = clamp(swingT / 0.3); sword.rotation.set(k < 0.35 ? lerp(-0.3, -2.3, k / 0.35) : lerp(-2.3, 1.5, (k - 0.35) / 0.65), 0, 0); if (swingT > 0.45) { swingT = -1; sword.rotation.set(-0.3, 0, 0); } }
    else if (brandish >= 0) { brandish += dt; const k = clamp(brandish / 1.2); sword.position.y = 1.0 + Math.sin(Math.PI * k) * 0.9; sword.rotation.set(-0.3, 0, k * TAU * 2); if (k >= 1) { brandish = -1; sword.position.y = 1.0; sword.rotation.set(-0.3, 0, 0); } }
    if (cellarOpen >= 0 && cellarOpen < 1) { cellarOpen = Math.min(1, cellarOpen + dt * 0.8); cellarDoors.forEach(({ hinge, s }) => (hinge.rotation.z = s * lerp(0.12, 2.3, easeOut(cellarOpen)))); }
  }
  function updateSentinels(dt, t) {
    const near = ship.position.distanceTo(NS.moor) < 34 || (S.mode === 'land' && S.at === 'sentinel');
    if (near && S.mode !== 'land') { sentinels.forEach((s) => { if (!s.lower) s.warn = true; }); }
    sentinels.forEach((s, k) => {
      const want = s.warn ? 1 : 0; s.fwd += (want - s.fwd) * (1 - Math.exp(-dt * 2));
      if (!s.carry) s.f.position.copy(s.home).addScaledVector(NS.out, s.fwd * 1.2);
      s.bow.rotation.set(-1.1 * s.fwd, Math.PI / 2 - 0.2 * s.fwd, 0.15 + 1.25 * s.fwd);
      s.bow.position.set(0.42 - 0.25 * s.fwd, 1.05 + 0.55 * s.fwd, 0.12 + 0.2 * s.fwd);
      animatePerson(s.f, t, { phase: k, energy: 0.4 + 0.6 * s.fwd });
    });
    if (!near && sentinels.some((s) => s.warn)) sentinels.forEach((s) => (s.warn = false));
    // once you've gone, one of them comes down and takes the bag back into the trees
    if (S.sweets && sweets.visible && S.mode === 'sail' && ship.position.distanceTo(NS.moor) > 26) {
      const s = sentinels[2]; s.carry = s.carry ?? { t: 0 }; s.carry.t += dt;
      const k = s.carry.t / 5, spot = sweets.position.clone();
      s.f.position.lerpVectors(s.home, spot, k < 0.5 ? easeInOut(k * 2) : 1 - easeInOut((k - 0.5) * 2));
      s.f.rotation.y = Math.atan2(NS.out.x, NS.out.z) + (k > 0.5 ? Math.PI : 0);
      if (k > 0.5) sweets.visible = false;
      if (k >= 1) s.carry = null;
    }
  }
  function updateFrogs(dt, t) {
    const near = (S.mode === 'land' && S.at === 'frogs') || ship.position.distanceTo(FR.c) < 30;
    for (const fr of frogs) {
      if (fr.t < 1) {
        fr.t = Math.min(1, fr.t + dt / 0.45);
        fr.f.position.lerpVectors(fr.from, fr.to, easeInOut(fr.t)); fr.f.position.y = Math.sin(Math.PI * fr.t) * 0.6;
      } else if ((fr.wait -= dt) < 0) {
        const a = Math.random() * TAU, step = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.8 + Math.random() * 1.2);
        let to = fr.f.position.clone().setY(0).add(step);
        if (to.distanceTo(FR.c) > FR.r - 1.2 || (S.mode === 'land' && to.distanceTo(player.pos) < 1)) to = fr.f.position.clone().setY(0).lerp(FR.c, 0.2);
        fr.from.copy(fr.f.position).setY(0); fr.to.copy(to); fr.t = 0; fr.wait = 0.8 + Math.random() * 3;
        fr.f.rotation.y = Math.atan2(to.x - fr.from.x, to.z - fr.from.z);
      }
      if ((fr.next -= dt) < 0) { fr.croak = 0; fr.next = 3 + Math.random() * 7; if (near) { const a = audio(); if (a) croak(a, 0.05 * clamp(1 - player.pos.distanceTo(fr.f.position) / 30)); } }
      if (fr.croak >= 0) { fr.croak += dt / 0.7; frogCroak(fr.f, fr.croak); if (fr.croak >= 1) { fr.croak = -1; frogCroak(fr.f, 0); } }
    }
  }
  function updateSpray(dt) {
    const c = ship.position;
    sprayP.forEach((s, i) => {
      s.life -= dt;
      if (s.life <= 0) { s.life = 1.2 + Math.random() * 1.4; s.p.set(c.x + (Math.random() - 0.5) * 30, -0.25 + Math.random() * 0.3, c.z + (Math.random() - 0.5) * 30); }
      s.p.addScaledVector(WIND, 5 * dt); s.p.y += dt * 0.25;
      const k = Math.min(1, s.life * 2) * 0.9;
      m4.makeScale(k * 1.8, k * 0.6, k).setPosition(s.p); spray.setMatrixAt(i, m4);
    });
    spray.instanceMatrix.needsUpdate = true;
  }
  function labels() {
    const from = ship.position, sailing = S.mode === 'sail' || S.mode === 'docking';
    for (const i of isles) {
      const top = i.top?.isVector3 ? i.top : i.c.clone().setY(i.top ?? (i.id === 'lighthouse' ? 13 : 6)), d = from.distanceTo(i.c), v = top.clone().project(stage.camera);
      const onScreen = v.z < 1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.95;   // (labels otherwise cling to the frame's edge, pointing the wrong way)
      const o = !sailing || !onScreen ? 0 : clamp((110 - d) / 20) * clamp((d - i.r - 8) / 6);
      const known = S.visited.includes(i.id);                                  // (a name only once you've landed there)
      ctx.ui.label('isle-' + i.id, o, `<span class="dot" style="background:${css(known && i.id === 'house' ? palette.agent : palette.rail)}"></span>${known ? i.name : '?'}`, top);
    }
  }
  function walkable(x, z) {
    if (S.mode === 'sail' || S.mode === 'docking' || S.mode === 'home') return true;
    if (S.mode === 'cellar') return Math.abs(x - CEL.x) < 3.5 && z - CEL.z > -2.5 && z - CEL.z < 2.7 && !(x - CEL.x > 2.1 && z - CEL.z < 0.7);
    const i = isle(); if (!i) return true;
    if (i.walk) return i.walk(x, z);
    const dx = x - i.c.x, dz = z - i.c.z;
    if (i.beach) return Math.hypot(x - i.land.x, z - i.land.z) < 3.2 && Math.hypot(dx, dz) < i.r - 0.3;
    if (Math.hypot(dx, dz) < i.r - 0.9) return true;
    const f = dx * i.out.x + dz * i.out.z, s = dx * i.side.x + dz * i.side.z;
    return f > i.r - 2 && f < i.r + 6.8 && Math.abs(s) < 0.62;
  }

  let creakT = 3;
  const api = {
    S, isles, O, K,
    walkable,
    blockers() {
      if (S.mode === 'cellar') return [{ x: CHEST_AT.x, z: CHEST_AT.z, r: 0.75 }, { x: CEL.x - 3.3, z: CEL.z - 2.4, r: 0.5 }, { x: CEL.x - 3.3, z: CEL.z + 1.8, r: 0.5 }];
      if (S.mode !== 'land') return [];
      if (S.at === 'lighthouse') return [{ x: TOWER.x, z: TOWER.z, r: 1.7 }, ...(S.fight === 'on' && S.k === 'lunge' ? [] : [{ x: K.p.x, z: K.p.z, r: S.fight === 'won' ? 1.6 : 1.1 }]), { x: CELLAR_DOOR.x, z: CELLAR_DOOR.z, r: 0.9 }];
      if (S.at === 'palm') return [{ x: at(E1, 0.2, -2.2).x, z: at(E1, 0.2, -2.2).z, r: 0.9 }];
      if (S.at === 'rock') return [{ x: at(E2, -0.8, 0).x, z: at(E2, -0.8, 0).z, r: 1.4 }];
      if (S.at === 'harbour') return isle().block();
      if (S.at === 'house') {
        const body = palWorld(0, -0.3), ramp = palWorld(0, 5.6);                 // (a box's rot turns the other way to rotation.y)
        return [{ x: body.x, z: body.z, w: 14, d: 7.4, rot: -palYaw }, { x: ramp.x, z: ramp.z, w: 1.8, d: 6, rot: -palYaw }];
      }
      return [];
    },
    // for tests: put the ship just off an island's landing, pointing at it
    teleport(id) { const i = isles.find((q) => q.id === id); const p = i.moor.clone().addScaledVector(i.out, 4.5); ship.position.set(p.x, -0.25, p.z); S.h = yawOf(i.out.clone().negate()); S.v = 2; S.mode = 'sail'; cutNext = true; },
    update(dt, t) {
      if (S.mode === 'sail') sailPhysics(dt, t);
      if (S.mode === 'docking') {
        const i = isle(); dockT = Math.min(1, dockT + dt / 1.6); const k = easeInOut(dockT);
        ship.position.lerpVectors(dockFrom.p, i.moor, k); S.h = dockFrom.h + wrap(i.moorH - dockFrom.h) * k;
        if (dockT >= 1) landPlayer(i);
      }
      rig(dt, t, S.mode === 'sail');
      if (S.mode === 'sail' || S.mode === 'docking') onDeck();
      S.x = +ship.position.x.toFixed(1); S.z = +ship.position.z.toFixed(1);
      sea.position.x = ship.position.x; sea.position.z = ship.position.z;
      if (S.mode === 'home') updateHome(dt);
      palace.update(dt, t);
      if ((creakT -= dt) < 0) { creakT = 5 + Math.random() * 6; const near = Math.min(player.pos.distanceTo(PAL), ship.position.distanceTo(PAL)); const a = near < 45 && audio(); if (a) creak(a, 0.06 * clamp(1 - near / 45)); }
      updateSpray(dt); updateKeeper(dt, t); updateSentinels(dt, t); updateFrogs(dt, t); labels();
      plane.position.set(player.pos.x, 0, player.pos.z);
      // the wind dial: which way the wind blows, as seen from the camera
      const cf = new THREE.Vector3(); stage.camera.getWorldDirection(cf);
      const ang = Math.atan2(cf.x * WIND.z - cf.z * WIND.x, cf.x * WIND.x + cf.z * WIND.z);
      arrowEl.style.transform = `rotate(${(-ang * 180) / Math.PI}deg)`;
      windEl.style.display = S.mode === 'sail' ? 'block' : 'none';
    },
    camera(pl) {
      const cut = cutNext; cutNext = false;
      if (S.mode === 'cellar') return { pos: CEL.clone().add(V((pl.pos.x - CEL.x) * 0.3, 7.5, 9.5)), look: CEL.clone().add(V((pl.pos.x - CEL.x) * 0.3, 0.6, -0.6)), cut, stiffness: 3 };
      if (S.mode === 'home') return { pos: PAL.clone().addScaledVector(HO.out, 25).addScaledVector(HO.side, -10).add(V(0, 8, 0)), look: PAL.clone().add(V(0, 7, 0)), cut, stiffness: 0.9 };
      if (S.mode === 'land') {
        const i = isle(), p = pl.pos.clone(), [back, side, up, ahead, lookUp] = i.cam ?? [i.beach ? 10 : 12, -4, i.beach ? 8 : 9.5, -2, 1.2];
        return { pos: p.clone().addScaledVector(i.out, back).addScaledVector(i.side, side).add(V(0, up, 0)), look: p.clone().addScaledVector(i.out, ahead).add(V(0, lookUp, 0)), cut, stiffness: 2.4 };
      }
      const f = fwd(), c = ship.position.clone();
      return { pos: c.clone().addScaledVector(f, -20).add(V(0, 9.5, 0)), look: c.clone().addScaledVector(f, 9).add(V(0, 1.5, 0)), cut, stiffness: 1.5 };
    },
    dispose() {
      disposers.forEach((d) => d()); hud.remove(); talkToken++;
      player.obj.remove(backChest); sword.parent?.remove(sword); player.obj.rotation.x = 0; player.obj.visible = true;
      try { ac?.close(); } catch {}
    },
  };
  return api;
}
