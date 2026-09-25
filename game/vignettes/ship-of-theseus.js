// Vignette: The Ship of Theseus.
// Replace the old ship's parts one by one (six planks, the deck, the mast, the sail) with new ones. When none of the
// original is left, the old parts are rebuilt into a second ship. Board one of them and sail off: that's your answer,
// and the ending. The voyage goes on past islands and a lighthouse, gulls overhead, behind the game-over card.
import {
  THREE, palette, clamp, lerp, easeInOut, easeOut, seeded, clay, mesh,
  makeIsland, makeTree, makeRock, makePerson, animatePerson, makeFrog,
} from '/game/engine/core.js';
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
// everything that gets replaced, in order: planks first, then the deck among them, the mast and the sail last
const PARTS = [{ kind: 'plank', i: 1 }, { kind: 'plank', i: 4 }, { kind: 'plank', i: 0 }, { kind: 'deck' }, { kind: 'plank', i: 3 }, { kind: 'plank', i: 2 }, { kind: 'plank', i: 5 }, { kind: 'mast' }, { kind: 'sail' }];
const OLD_RIG = { deck: 0x9a8468, mast: 0x5a3d29, sail: 0xd9cfbd }, NEW_RIG = { deck: 0xe2c08c, mast: 0xc8955e, sail: 0xfffdf6 };
const LABEL = { plank: 'plank', deck: 'deck boards', mast: 'mast', sail: 'sail' };

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
  const deck = mesh(new THREE.BoxGeometry(7.6, 0.1, 1.5), clay(OLD_RIG.deck).clone()); deck.position.y = 1.15; g.add(deck);
  const mast = mesh(new THREE.CylinderGeometry(0.1, 0.13, 6, 10), clay(OLD_RIG.mast).clone()); mast.position.set(0.6, 4, 0); g.add(mast);
  const sailGeo = new THREE.PlaneGeometry(3.2, 3.4, 8, 8), sp = sailGeo.attributes.position;
  for (let k = 0; k < sp.count; k++) sp.setZ(k, 0.35 * Math.cos((sp.getX(k) / 3.2) * Math.PI));
  sailGeo.computeVertexNormals();
  const sail = mesh(sailGeo, new THREE.MeshStandardMaterial({ color: OLD_RIG.sail, side: THREE.DoubleSide, roughness: 0.9 }));
  sail.position.set(0.6, 4.1, 0.1); sail.rotation.y = Math.PI / 2; g.add(sail);
  g.userData = { slots, rig: [mast, sail, deck, keel], parts: { deck, mast, sail } };
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
  // the other new parts, laid out on the dock beside the planks
  const PILE = { deck: V(STACK.x - 2.6, 0, 0.7), mast: V(STACK.x + 0.4, 0, -0.95), sail: V(STACK.x + 2.7, 0, 0.8) };
  const newParts = {
    deck: mesh(new THREE.BoxGeometry(1.6, 0.3, 1), clay(NEW_RIG.deck)),
    mast: mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.4, 10), clay(NEW_RIG.mast)),
    sail: mesh(new THREE.BoxGeometry(1, 0.34, 0.8), clay(NEW_RIG.sail)),
  };
  newParts.deck.position.copy(PILE.deck).setY(0.15); newParts.mast.position.copy(PILE.mast).setY(0.14); newParts.mast.rotation.z = Math.PI / 2; newParts.sail.position.copy(PILE.sail).setY(0.17);
  Object.values(newParts).forEach((m) => root.add(m));
  const scrap = [], scrapRig = {};
  const oldBundle = (kind) => { const m = kind === 'mast' ? mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.4, 10), clay(OLD_RIG.mast)) : mesh(kind === 'deck' ? new THREE.BoxGeometry(1.6, 0.3, 1) : new THREE.BoxGeometry(1, 0.34, 0.8), clay(OLD_RIG[kind])); if (kind === 'mast') m.rotation.z = Math.PI / 2; return m; };
  const carriedShapes = {
    plank: mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(NEW)),
    deck: mesh(new THREE.BoxGeometry(1.6, 0.3, 1), clay(NEW_RIG.deck)),
    mast: mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.4, 10), clay(NEW_RIG.mast)),
    sail: mesh(new THREE.BoxGeometry(1, 0.34, 0.8), clay(NEW_RIG.sail)),
  };
  carriedShapes.mast.rotation.z = Math.PI / 2;
  for (const m of Object.values(carriedShapes)) { m.position.set(0, 2.35, 0); if (m !== carriedShapes.mast) m.rotation.y = Math.PI / 2; m.visible = false; player.obj.add(m); }
  const carried = { set visible(v) { for (const [k, m] of Object.entries(carriedShapes)) m.visible = v && k === PARTS[S.swaps]?.kind; } };
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

  // ---- the voyage: islands, a lighthouse, gulls, whitecaps and clouds that keep coming as you sail
  const voyage = (() => {
    const g = new THREE.Group(); g.visible = false; root.add(g);
    const r = seeded(77);
    const isles = [0, 1, 2, 3, 4].map((i) => {
      const isle = new THREE.Group();
      const land = makeIsland({ radius: 5 + r() * 5, seed: 50 + i, decor: false }); isle.add(land);
      for (let k = 0; k < 3 + Math.floor(r() * 4); k++) { const tr = makeTree(0.8 + r() * 0.7, r); const a = r() * 6.28, rr = r() * 3; tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); isle.add(tr); }
      if (i === 1) {                     // the lighthouse
        const tower = mesh(new THREE.CylinderGeometry(0.7, 1, 7, 16), clay(0xf6f1e7)); tower.position.y = 3.5; isle.add(tower);
        for (const y of [1.6, 4]) { const band = mesh(new THREE.CylinderGeometry(0.93 - y * 0.04, 0.95 - y * 0.04, 0.8, 16), clay(0xe0674f)); band.position.y = y; isle.add(band); }
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff3c4 })); lamp.position.y = 7.4; isle.add(lamp);
        const cap = mesh(new THREE.ConeGeometry(0.8, 0.8, 16), clay(0x2b2a33)); cap.position.y = 8.1; isle.add(cap);
      }
      isle.position.set(40 + i * 28 + r() * 10, -0.2, (i % 2 ? 1 : -1) * (16 + r() * 14)); g.add(isle); return isle;
    });
    const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 4), clay(0xffffff), 90); caps.castShadow = false; g.add(caps);
    const capBase = Array.from({ length: 90 }, () => [r() * 90 - 45, r() * 70 - 35, r() * 6.28]);
    const gulls = [0, 1, 2].map((i) => { const b = new THREE.Group(); for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.7, 0.04, 0.2), clay(0xffffff)); w.position.x = s * 0.35; w.rotation.z = s * 0.35; b.add(w); } g.add(b); return b; });
    const clouds = [0, 1, 2, 3].map((i) => { const c = new THREE.Group(); for (let k = 0; k < 4; k++) { const s = mesh(new THREE.SphereGeometry(1.4 + (k % 2) * 0.6, 12, 10), clay(0xffffff, { roughness: 1 })); s.position.set(k * 1.6, (k % 2) * 0.5, 0); s.castShadow = false; c.add(s); } c.position.set(20 + i * 30, 16 + i * 2, -30 - i * 8); g.add(c); return c; });
    const m4 = new THREE.Matrix4();
    return {
      update(at, dt, t, away) {
        if (!g.visible) isles.forEach((isle) => (isle.position.z = -away * Math.abs(isle.position.z)));   // islands on the far side, never between you and the camera
        g.visible = true;
        sea.position.x = at.x;                                        // the sea goes with you
        isles.forEach((isle) => { if (isle.position.x < at.x - 50) isle.position.x += 140; });
        clouds.forEach((c) => { if (c.position.x < at.x - 60) c.position.x += 120; });
        capBase.forEach(([x, z, ph], i) => {
          const wx = at.x + ((((x - at.x) % 90) + 135) % 90) - 45, s = 0.5 + 0.5 * Math.sin(t * 1.5 + ph);
          m4.makeScale(1.6 * s + 0.01, 0.12, 0.6 * s + 0.01).setPosition(wx, -0.33, z + at.z); caps.setMatrixAt(i, m4);
        });
        caps.instanceMatrix.needsUpdate = true;
        gulls.forEach((b, i) => { const a = t * (0.6 + i * 0.15) + i * 2; b.position.set(at.x + Math.cos(a) * (5 + i * 2), 7 + i + Math.sin(t * 2 + i) * 0.4, at.z + Math.sin(a) * (5 + i * 2)); b.rotation.y = -a; b.children.forEach((w, k) => (w.rotation.z = (k ? 1 : -1) * (0.2 + 0.3 * Math.sin(t * 8 + i)))); });
      },
    };
  })();

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

  const part = () => PARTS[S.swaps];
  interact.add({ pos: () => (part()?.kind === 'plank' || !part() ? STACK : PILE[part().kind]).clone().setY(0), radius: 2.2, height: 2.2,
    prompt: () => (part()?.kind === 'plank' ? 'Take a new plank' : `Take the new ${LABEL[part()?.kind]}`),
    enabled: () => S.phase === 'work' && !S.carrying && !S.busy && S.swaps < PARTS.length,
    onUse: () => {
      const p = part(); S.carrying = true; carried.visible = true;
      if (p.kind === 'plank') stack[5 - PARTS.slice(0, S.swaps).filter((q) => q.kind === 'plank').length].visible = false; else newParts[p.kind].visible = false;
    } });
  interact.add({ pos: REPLACE, radius: 2.6, height: 2.6, prompt: () => `Replace the old ${LABEL[part()?.kind] ?? 'plank'}`,
    enabled: () => S.phase === 'work' && S.carrying && !S.busy,
    onUse: async () => {
      S.busy = true; carried.visible = false; S.carrying = false;
      const p = part();
      if (p.kind === 'plank') {
        const slot = ship1.userData.slots[p.i], at = slotWorld(ship1, p.i);
        // the old plank flies to the scrap pile...
        const old = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(OLD)); old.position.copy(at); root.add(old);
        const pile = SCRAP.clone().add(V(0, 0.07 + scrap.length * 0.15, 0));
        scrap.push(old);
        fly(old, at, pile, 1.1, 2);
        // ...and the new one flies from your hands into its place
        const nw = mesh(new THREE.BoxGeometry(3, 0.14, 0.46), clay(NEW)); root.add(nw);
        await fly(nw, player.pos.clone().add(V(0, 2.35, 0)), at, 0.9, 1);
        root.remove(nw); slot.material = clay(NEW);
      } else {
        // the old deck, mast or sail comes off and is laid on the dock by the scrap; the new one goes up in its place
        const src = ship1.userData.parts[p.kind], at = src.getWorldPosition(V());
        // the old one comes off as a bundle (boards tied up, the mast laid down, the sail folded) and goes by the scrap
        const old = oldBundle(p.kind); old.position.copy(at); root.add(old);
        const spot = SCRAP.clone().add({ deck: V(-2.2, 0.15, 0.1), mast: V(0, 0.14, 0.9), sail: V(2.1, 0.17, 0.1) }[p.kind]);
        scrapRig[p.kind] = old;
        fly(old, at, spot, 1.2, 0).then(() => { if (p.kind === 'mast') old.rotation.set(0, 0, Math.PI / 2); });
        src.visible = false;
        const nw = carriedShapes[p.kind].clone(); nw.visible = true; root.add(nw);
        await fly(nw, player.pos.clone().add(V(0, 2.35, 0)), at, 0.9, 0);
        root.remove(nw); src.material.color.set(NEW_RIG[p.kind]); src.visible = true;
      }
      S.swaps++; S.busy = false;
      if (S.swaps === 1) voice.say('first');
      if (S.swaps === 5) voice.say('half');
      if (p.kind === 'mast') voice.say('mast');
      if (S.swaps === PARTS.length) twist();
    } });
  const board = (ship, which) => ({ pos: which === 'new' ? REPLACE : GANG2, radius: 2.4, height: 2.8,
    prompt: which === 'new' ? 'Board the ship of new parts' : 'Board the ship of old parts',
    enabled: () => S.phase === 'choose',
    onUse: async () => {
      S.phase = 'sail'; S.sailing = ship; S.sailT = 0; player.enabled = false;
      player.obj.parent.remove(player.obj); ship.add(player.obj);
      player.pos.set(-1.5, 1.2, 0); player.obj.rotation.y = Math.PI / 2;
      await ctx.wait(1.5); await voice.say(which + '_end');
      while (S.sailT < 16) await ctx.wait(0.25);             // sail on a while: islands, the lighthouse, the gulls
      save.complete('ship-of-theseus');
      ctx.gameOver(which === 'new'
        ? { title: 'You sailed the new ship', text: 'Every part was replaced, but it never stopped being the ship that sailed.' }
        : { title: 'You sailed the old wood', text: 'Every original part, put back together. Whether that makes it the same ship is the question.' });
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
    // then the old deck, mast and sail
    for (const k of ['deck', 'mast', 'sail']) {
      const src = scrapRig[k], dst = ship2.userData.parts[k];
      dst.scale.setScalar(1); dst.visible = false;
      await fly(src, src.position.clone(), dst.getWorldPosition(V()), 0.8, 0);
      src.visible = false; dst.visible = true;
    }
    ship2.userData.rig[3].scale.setScalar(1);
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
      // ships bob on the water
      for (const [sh, base, ph] of [[ship1, SHIP1, 0], [ship2, SHIP2, 1.7]]) {
        sh.position.y = base.y + Math.sin(t * 1.1 + ph) * 0.06; sh.rotation.x = Math.sin(t * 0.9 + ph) * 0.02;
      }
      if (S.sailing) {
        // out to sea, and on and on (it keeps going behind the game-over card)
        S.sailT += dt;
        const sh = S.sailing, base = sh === ship1 ? SHIP1 : SHIP2, side = sh === ship1 ? -1 : 1;
        S.sailX = (S.sailX ?? 0) + dt * Math.min(4.5, S.sailT * 0.9);
        sh.position.x = base.x + S.sailX;
        sh.position.z = base.z + side * easeInOut(clamp(S.sailT / 8)) * 8 + Math.sin(S.sailX * 0.05) * 3;
        sh.rotation.z = Math.sin(t * 0.8) * 0.04; sh.rotation.y = -Math.cos(S.sailX * 0.05) * 0.15 * 0.3;
        sh.userData.parts.sail.scale.z = 1 + 0.35 * clamp(S.sailT / 3);        // the sail fills
        voyage.update(sh.position, dt, t, side);
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
        // at first close by, then lower and wider, looking ahead along the course, with the horizon in view
        const k = easeInOut(clamp((S.sailT - 5) / 6));
        return { pos: c.clone().add(V(lerp(-9, -16, k), lerp(8, 4.2, k), lerp(15, 20, k) * away)), look: c.clone().add(V(lerp(0, 10, k), lerp(0, 1.5, k), 0)), stiffness: 1.6 };
      }
      const pts = [pl.pos.clone(), SHIP1.clone().add(V(0, 3.5, 0)), SHIP1.clone().add(V(-5, 1, 0)), SHIP1.clone().add(V(5, 1, 0)), STACK.clone(), SCRAP.clone()];
      if (S.phase === 'rebuild' || S.phase === 'choose') pts.push(SHIP2.clone().add(V(0, 3.5, 0)));
      return { ...frame(pts, { min: 14, max: 45 }), stiffness: 2.4 };
    },

    dispose() {
      voice.stop();
      if (player.obj.parent !== stage.scene) { player.obj.parent?.remove(player.obj); stage.scene.add(player.obj); }
      Object.values(carriedShapes).forEach((m) => player.obj.remove(m));
    },
  });
}
