// Vignette: The Ship of Theseus.
// Replace the old ship's planks one by one with new ones. When none of the original is left, the old planks are
// rebuilt into a second ship. Board one of them: that's your answer, and the ending.
import {
  THREE, palette, clamp, lerp, easeInOut, easeOut, seeded, clay, mesh,
  makeIsland, makeTree, makeRock, makePerson, animatePerson, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo, frogExtras, frogCroak } from '../core/frog.js';
import { talk } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHORE = V(-10, 0, 0);
const SHIP1 = V(16, -0.25, -4.7);
const SHIP2 = V(16, -0.25, 4.7);
const STACK = V(7.6, 0, 1.05);
const SCRAP = V(11, 0, -1.0);
const REPLACE = V(16, 0, -0.9);
const GANG2 = V(16, 0, 0.9);
const OLD = 0x8f7f6a, NEW = 0xd9a86c;
const ORDER = [1, 4, 0, 3, 2, 5];                   // which strake gets replaced next

// A clay ship whose six side planks (strakes) are separate meshes, so each can be swapped.
function makeShip(plankColor) {
  const g = new THREE.Group();
  const slots = [];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const geo = new THREE.BoxGeometry(10, 0.46, 0.14, 24, 1, 1);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      const t = v.x / 5, taper = 1 - 0.7 * t * t;
      v.set(v.x * (1 - 0.04 * i), v.y + 0.35 + i * 0.46 + 0.4 * t * t, (side * (0.62 + i * 0.42) + v.z) * taper);
      p.setXYZ(k, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const m = mesh(geo, clay(plankColor));
    g.add(m); slots.push(m);
  }
  const wood = clay(0x6b4a33);
  const keel = mesh(new THREE.BoxGeometry(10.4, 0.28, 0.3), wood); keel.position.y = 0.12; g.add(keel);
  for (const x of [-5.1, 5.1]) { const post = mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.9, 8), wood); post.position.set(x, 1, 0); post.rotation.z = x > 0 ? -0.25 : 0.25; g.add(post); }
  const deck = mesh(new THREE.BoxGeometry(7.6, 0.1, 1.5), clay(0xb89572)); deck.position.y = 1.15; g.add(deck);
  const mast = mesh(new THREE.CylinderGeometry(0.1, 0.13, 6, 10), wood); mast.position.set(0.6, 4, 0); g.add(mast);
  const sailGeo = new THREE.PlaneGeometry(3.2, 3.4, 8, 8), sp = sailGeo.attributes.position;
  for (let k = 0; k < sp.count; k++) sp.setZ(k, 0.35 * Math.cos((sp.getX(k) / 3.2) * Math.PI));
  sailGeo.computeVertexNormals();
  const sail = mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xf4ecdc, side: THREE.DoubleSide, roughness: 0.9 }));
  sail.position.set(0.6, 4.1, 0.1); sail.rotation.y = Math.PI / 2; g.add(sail);
  g.userData = { slots, rig: [mast, sail, deck, keel] };
  return g;
}

export default function shipOfTheseus(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 180);
  voice.load('ship-of-theseus');
  const frame = makeFramer(stage);

  // ---- sea, shore and dock
  const sea = mesh(new THREE.CylinderGeometry(120, 120, 0.4, 96), clay(0x9cc0d0, { roughness: 0.35 })); sea.position.y = -0.55; sea.castShadow = false; root.add(sea);
  const shore = makeIsland({ radius: 14, seed: 6, decor: false }); shore.position.copy(SHORE); root.add(shore);
  const rnd = seeded(33);
  for (let i = 0; i < 6; i++) { const tr = makeTree(0.9 + rnd() * 0.6, rnd); const a = 1.6 + rnd() * 3, r = 7 + rnd() * 4; tr.position.set(SHORE.x + Math.cos(a) * r, 0, Math.sin(a) * r); root.add(tr); }
  for (let i = 0; i < 4; i++) { const rk = makeRock(0.8 + rnd(), rnd); rk.position.set(SHORE.x + 4 + rnd() * 5, 0, (rnd() - 0.5) * 16); root.add(rk); }
  const boards = mesh(new THREE.BoxGeometry(23.5, 0.28, 3.2), clay(0xb89572)); boards.position.set(14, -0.14, 0); root.add(boards);   // deck flush with the ground you walk on
  for (let x = 4; x <= 25; x += 3) for (const z of [-1.5, 1.5]) { const post = mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 8), clay(0x6b4a33)); post.position.set(x, -0.5, z); root.add(post); }

  // ---- the ship, the stack of new planks, the scrap pile, and the second ship's empty berth
  const ship1 = makeShip(OLD); ship1.position.copy(SHIP1); root.add(ship1);
  const ship2 = makeShip(OLD); ship2.position.copy(SHIP2); root.add(ship2);
  ship2.userData.slots.forEach((m) => (m.visible = false)); ship2.userData.rig.forEach((m) => m.scale.setScalar(0.001));
  const stack = [];
  for (let i = 0; i < 6; i++) { const p = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(NEW)); p.position.copy(STACK).add(V(0, 0.07 + i * 0.15, 0)); p.rotation.y = 0.08 * (i % 2 ? 1 : -1); root.add(p); stack.push(p); }
  const scrap = [];
  const carried = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(NEW)); carried.position.set(0, 2.35, 0); carried.rotation.y = Math.PI / 2; carried.visible = false; player.obj.add(carried);
  const shipwright = makePerson({ color: palette.judge }); shipwright.position.set(12.5, 0, -1.1); shipwright.visible = false; root.add(shipwright);

  // a mooring bollard, and an old man fishing off the end of the dock
  const BOLLARD = V(20.5, 0, 1.2);
  const bollard = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.56, 12), clay(0x5d5a58)); bollard.position.copy(BOLLARD).setY(0.28); root.add(bollard);
  const fisher = makePerson({ color: 0x7a8a6a, hat: true }); fisher.position.set(24.4, 0, 1.2); fisher.rotation.y = 0; fisher.userData.body.position.y = -0.42; root.add(fisher);
  const rod = mesh(new THREE.CylinderGeometry(0.02, 0.035, 3.2, 6), clay(palette.trunk)); rod.position.set(24.45, 1.6, 2.4); rod.rotation.x = 1.0; root.add(rod);
  const lineMesh = mesh(new THREE.CylinderGeometry(0.006, 0.006, 3.2, 4), clay(0xf6f0e2)); lineMesh.position.set(24.45, 1.1, 3.75); root.add(lineMesh);

  // the frog climbs out of the sea, sits on the bollard, croaks twice at the ship, and dives back in
  const frog = frogExtras(makeFrog()); root.add(frog);
  const cameo = frogCameo(frog, [{ at: [19.2, 3], y: -0.9 }, { at: [19.6, 1.3], y: 0, height: 1.3 }, { at: [BOLLARD.x, BOLLARD.z], y: 0.56, height: 0.9 }, { face: [16, -4.7] },
    { wait: 0.6 }, { wait: 0.8, act: (f, u) => frogCroak(f, u) }, { wait: 0.3 }, { wait: 0.8, act: (f, u) => frogCroak(f, u) }, { wait: 0.8 },
    { face: [22, 4] }, { at: [21.8, 3.3], y: -1.1, height: 1.2 }]);

  // ---- flying planks (old out to the scrap pile, new in from your hands; later, old into the second ship)
  const flights = [];
  const fly = (obj, from, to, dur, spin = 1) => new Promise((resolve) => flights.push({ obj, from: from.clone(), to: to.clone(), t: 0, dur, spin, resolve }));
  const slotWorld = (ship, i) => { const m = ship.userData.slots[i]; m.geometry.computeBoundingBox(); return ship.localToWorld(m.geometry.boundingBox.getCenter(V())); };

  // ---- state
  const S = { phase: 'work', swaps: 0, carrying: false, busy: false, sailing: null, sailT: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/ship-of-theseus.json', 'The Ship of Theseus');
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; root.add(groundPlane); level.ground.push(groundPlane);

  interact.add({ pos: STACK.clone().setY(0), radius: 2.4, height: 2.2, prompt: 'Take a new plank',
    enabled: () => S.phase === 'work' && !S.carrying && !S.busy && S.swaps < 6,
    onUse: () => { S.carrying = true; carried.visible = true; stack[5 - S.swaps].visible = false; } });
  interact.add({ pos: REPLACE, radius: 2.6, height: 2.6, prompt: 'Replace an old plank',
    enabled: () => S.phase === 'work' && S.carrying && !S.busy,
    onUse: async () => {
      S.busy = true; S.carrying = false; carried.visible = false;
      const i = ORDER[S.swaps], slot = ship1.userData.slots[i], at = slotWorld(ship1, i);
      // the old plank flies to the scrap pile...
      const old = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(OLD)); old.position.copy(at); root.add(old);
      const pile = SCRAP.clone().add(V(0, 0.07 + scrap.length * 0.15, 0));
      scrap.push(old);
      fly(old, at, pile, 1.1, 2);
      // ...and the new one flies from your hands into its place
      const nw = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(NEW)); root.add(nw);
      await fly(nw, player.pos.clone().add(V(0, 2.35, 0)), at, 0.9, 1);
      root.remove(nw); slot.material = clay(NEW);
      S.swaps++; S.busy = false;
      if (S.swaps === 1) voice.say('first');
      if (S.swaps === 3) voice.say('half');
      if (S.swaps === 6) twist();
    } });
  const board = (ship, which) => ({ pos: which === 'new' ? REPLACE : GANG2, radius: 2.4, height: 2.8,
    prompt: which === 'new' ? 'Board the ship of new planks' : 'Board the ship of old planks',
    enabled: () => S.phase === 'choose',
    onUse: async () => {
      S.phase = 'sail'; S.sailing = ship; S.sailT = 0; player.enabled = false;
      player.obj.parent.remove(player.obj); ship.add(player.obj);
      player.pos.set(-1.5, 1.2, 0); player.obj.rotation.y = Math.PI / 2;
      await ctx.wait(1.5); await voice.say(which + '_end'); await ctx.wait(1.5);
      save.complete('ship-of-theseus');
      ctx.gameOver(which === 'new'
        ? { title: 'You sailed the new ship', text: 'Every plank was replaced, but it never stopped being the ship that sailed.' }
        : { title: 'You sailed the old wood', text: 'Every original plank, put back together. Whether that makes it the same ship is the question.' });
    } });
  interact.add(board(ship1, 'new'));
  interact.add(board(ship2, 'old'));
  interact.trigger({ pos: STACK, radius: 5, onEnter: () => voice.say('planks') });

  // asides: the fisherman, and the shipwright once he turns up
  talk(ctx, { who: fisher, offset: [0, 2.7, 0], radius: 2.2, enabled: () => !S.sailing, lines: [
    'Forty years I have fished off this dock.', 'Mind you, they have replaced every board of it since.', "This was my grandad's rod. New line, new reel, new handle.", 'Still his rod, though.', 'No bites. There never are.'] });
  talk(ctx, { who: shipwright, enabled: () => shipwright.visible && !S.sailing, lines: ['I kept every one. Seemed a shame to burn them.', 'Good wood, this. Just old.', 'Which one would you sail?'] });

  async function twist() {
    S.phase = 'rebuild';
    await ctx.wait(0.4); await voice.say('all'); await ctx.wait(0.8);
    shipwright.visible = true;
    await voice.say('twist');
    // the scrap pile becomes a ship
    for (const [k, i] of ORDER.entries()) {
      const src = scrap[k], at = slotWorld(ship2, i);
      await fly(src, src.position.clone(), at, 0.7, 1);
      src.visible = false; ship2.userData.slots[i].visible = true;
    }
    S.rigT = 0;
    await ctx.wait(1.4); await voice.say('rebuilt');
    S.phase = 'choose';
  }

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -4, z: 2, rotY: Math.PI / 2 },
    start() { setTimeout(() => voice.say('arrive'), 900); },
    walkable: (x, z) => Math.hypot(x - SHORE.x, z - SHORE.z) < 12.5 || (x > 2 && x < 25.4 && Math.abs(z) < 1.45),
    blockers: () => [{ x: STACK.x, z: STACK.z + 0.2, r: 0.35 }, { x: SCRAP.x, z: SCRAP.z - 0.2, r: 0.35 }, { x: BOLLARD.x, z: BOLLARD.z, r: 0.3 }, { x: 24.4, z: 1.2, r: 0.45 }],

    update(dt, t) {
      // planks in flight (with a little arc and spin)
      for (let i = flights.length - 1; i >= 0; i--) {
        const f = flights[i]; f.t += dt;
        const k = easeInOut(clamp(f.t / f.dur));
        f.obj.position.lerpVectors(f.from, f.to, k).y += Math.sin(Math.PI * k) * 2.2;
        f.obj.rotation.y = f.spin * k * Math.PI;
        if (k >= 1) { f.obj.rotation.set(0, 0.06 * (i % 2 ? 1 : -1), 0); flights.splice(i, 1); f.resolve(); }
      }
      // the second ship's mast and sail rise once its hull is back together
      if (S.rigT !== undefined) { S.rigT += dt; ship2.userData.rig.forEach((m) => m.scale.setScalar(Math.max(0.001, easeOut(S.rigT / 1.2)))); }
      // ships bob on the water
      for (const [sh, base, ph] of [[ship1, SHIP1, 0], [ship2, SHIP2, 1.7]]) {
        sh.position.y = base.y + Math.sin(t * 1.1 + ph) * 0.06; sh.rotation.x = Math.sin(t * 0.9 + ph) * 0.02;
      }
      if (S.sailing) {
        S.sailT += dt;
        const base = S.sailing === ship1 ? SHIP1 : SHIP2;
        S.sailing.position.x = base.x + easeInOut(clamp(S.sailT / 9)) * 30;
        S.sailing.position.z = base.z + (S.sailing === ship1 ? -1 : 1) * easeInOut(clamp(S.sailT / 9)) * 6;
      }
      if (shipwright.visible) { shipwright.rotation.y = Math.atan2(player.pos.x - 12.5, player.pos.z + 1.1); animatePerson(shipwright, t, { energy: 0.5 }); }

      // frog: once, from the sea onto the bollard, after the first plank goes in
      if (S.swaps >= 1 && !S.busy) cameo.start();
      cameo.update(dt);
      lineMesh.position.y = 1.1 + Math.sin(t * 1.3) * 0.04;
    },

    camera(pl) {
      if (S.sailing) {
        const c = S.sailing.position.clone().add(V(0, 2, 0));
        const away = S.sailing === ship1 ? -1 : 1;   // film from the open-water side, never through the other ship
        return { pos: c.clone().add(V(-9, 8, 15 * away)), look: c, stiffness: 1.6 };
      }
      const pts = [pl.pos.clone(), SHIP1.clone().add(V(0, 3.5, 0)), SHIP1.clone().add(V(-5, 1, 0)), SHIP1.clone().add(V(5, 1, 0)), STACK.clone(), SCRAP.clone()];
      if (S.phase === 'rebuild' || S.phase === 'choose') pts.push(SHIP2.clone().add(V(0, 3.5, 0)));
      return { ...frame(pts, { min: 14, max: 45 }), stiffness: 2.4 };
    },

    dispose() {
      voice.stop();
      if (player.obj.parent !== stage.scene) { player.obj.parent?.remove(player.obj); stage.scene.add(player.obj); }
      player.obj.remove(carried);
    },
  });
}
