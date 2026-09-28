// Vignette: Swampman.
// The long way home along the boardwalk through the swamp, at dusk, with your friend beside you and a storm coming in.
// By a dead tree, lightning strikes your friend: it takes them apart and, by sheer chance, turns the tree into an exact
// copy of them, every atom in place, every memory. The copy gets up and carries on as if nothing happened ("Kettle's on
// the minute we're in"). Is that your friend? Walk on with it, talk to it (it "remembers"), and the dog at the house
// isn't sure. Then the storm comes round again, and there's another dead tree. Go home together (or wait, and be taken
// home); or step up to the tree yourself, and the story simply stops: whatever walks out of the swamp afterwards.
import { THREE, palette, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeHouse } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { talk, look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TREE = V(-1.7, 0, 1.2);
const TREE2 = V(4.6, 0, -6.4);
const STEP = TREE2.clone().add(V(0, 0, 1.6));                         // where "Stand by the tree" is offered (on the boardwalk)
const UNDER = TREE2.clone().add(V(0.35, 0, 0.75));                    // where you stand when you step up
const HOUSE = V(8.6, 0, -8.4);
const DOOR = V(8.6, 0, -6.4);
const INSIDE = DOOR.clone().add(V(0.3, 0, 1.3));                      // "Go inside"
const PAD = V(-4.2, 0, 3.4);
const IDLE_LIMIT = 60;
// the way home, for your friend to walk along beside you: down the boardwalk, along to the house, to the door
const PATH = [V(0, 0, 8.4), V(0, 0, -4.2), V(7.6, 0, -4.2), V(7.3, 0, -5.9)];
const SEGS = PATH.slice(1).map((b, i) => ({ a: PATH[i], b, len: b.distanceTo(PATH[i]) }));
const LEN = SEGS.reduce((s, g) => s + g.len, 0);
const S_TREE = 8.4 - TREE.z;                                          // how far along the path the first tree is
function along(p) { let best = Infinity, s = 0, acc = 0; for (const g of SEGS) { const d = g.b.clone().sub(g.a), k = Math.max(0, Math.min(1, (p.clone().sub(g.a).setY(0).dot(d)) / (g.len * g.len))), q = g.a.clone().addScaledVector(d, k), e = Math.hypot(p.x - q.x, p.z - q.z); if (e < best) { best = e; s = acc + k * g.len; } acc += g.len; } return s; }
function pointAt(s) { for (const g of SEGS) { if (s <= g.len || g === SEGS[SEGS.length - 1]) { const dir = g.b.clone().sub(g.a).normalize(); return { pt: g.a.clone().addScaledVector(dir, Math.min(s, g.len)), dir }; } s -= g.len; } }
const turn = (o, a, k) => { let d = a - o.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); o.rotation.y += d * k; };

function makeDog() {
  const g = new THREE.Group(), body = new THREE.Group(), fur = clay(0x8a6a4a);
  const torso = mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 10), fur); torso.rotation.x = Math.PI / 2; torso.position.y = 0.5; body.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), fur); head.position.set(0, 0.72, 0.45); body.add(head);
  const snout = mesh(new THREE.SphereGeometry(0.1, 10, 8), clay(0x6b4a33)); snout.scale.z = 1.4; snout.position.set(0, 0.66, 0.64); body.add(snout);
  for (const s of [-1, 1]) { const ear = mesh(new THREE.SphereGeometry(0.08, 8, 6), clay(0x5a3d29)); ear.scale.set(0.6, 1.4, 0.6); ear.position.set(s * 0.14, 0.78, 0.4); body.add(ear); }
  for (const [x, z] of [[-0.13, -0.25], [0.13, -0.25], [-0.13, 0.25], [0.13, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), fur); l.position.set(x, 0.2, z); body.add(l); }
  const tail = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6), fur); tail.position.set(0, 0.62, -0.42); tail.rotation.x = -0.8; body.add(tail);
  g.add(body); g.userData = { body, tail, head };
  return g;
}

function makeDeadTree(rnd) {
  const tree = new THREE.Group(); const trunk = mesh(new THREE.CylinderGeometry(0.16, 0.3, 3.4, 7), clay(0x5a4a3c)); trunk.position.y = 1.7; tree.add(trunk);
  for (let i = 0; i < 4; i++) { const y = 2 + rnd() * 1.1, ry = rnd() * 6.28, rz = (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6); const br = mesh(new THREE.CylinderGeometry(0.04, 0.1, 1.4, 5), clay(0x5a4a3c)); br.position.set(Math.sin(ry) * 0.3, y + 0.3, Math.cos(ry) * 0.3); br.rotation.set(0, ry, rz); tree.add(br); }
  return tree;
}

function makeBolt(rnd) {
  const bolt = new THREE.Group(); let p = V(0, 14, 0);
  for (let i = 0; i < 7; i++) { const q = V((rnd() - 0.5) * 1.4, 14 - (i + 1) * 2, (rnd() - 0.5) * 0.6); const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, p.distanceTo(q), 5), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); seg.position.copy(p).lerp(q, 0.5); seg.quaternion.setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize()); bolt.add(seg); p = q; }
  bolt.visible = false; return bolt;
}

export default function swampman(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0x4a5560);
  stage.scene.fog = new THREE.Fog(0x4a5560, 18, 70);
  stage.hemi.intensity = 0.9; stage.hemi.color.set(0xb8c8d0); stage.sun.intensity = 0.9; stage.sun.color.set(0xc8d0e0);
  voice.load('swampman');
  const rnd = seeded(1987);

  // ---- the swamp: dark water, hummocks of moss, reeds, lily pads, a boardwalk; dry ground and your house beyond
  const water = mesh(new THREE.CylinderGeometry(20, 19, 0.6, 48), clay(0x3a4a3e, { roughness: 0.25 })); water.position.y = -0.45; root.add(water);
  for (let i = 0; i < 22; i++) { const h = mesh(new THREE.SphereGeometry(0.8 + rnd() * 1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x5d6a3e, { flatShading: true })); h.scale.y = 0.35; const a = rnd() * 6.28, d = 3 + rnd() * 14; h.position.set(Math.cos(a) * d, -0.2, Math.sin(a) * d); if (Math.abs(h.position.x) < 2.4 && h.position.z > -5) continue; if (h.position.distanceTo(HOUSE) < 6 || h.position.distanceTo(TREE2) < 2.2) continue; root.add(h); }
  for (let i = 0; i < 70; i++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1 + rnd() * 1.2, 4), clay(0x6a7a3a)); const a = rnd() * 6.28, d = 2.4 + rnd() * 14; r.position.set(Math.cos(a) * d, 0.3, Math.sin(a) * d); r.rotation.z = (rnd() - 0.5) * 0.3; if (Math.abs(r.position.x) < 1.4 || (r.position.x > 0 && r.position.x < 8.6 && Math.abs(r.position.z + 4.2) < 1.2)) continue; root.add(r); }
  for (let i = 0; i < 8; i++) { const p = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 14), clay(0x4f7a3a)); p.position.set(-5 + rnd() * 3, -0.12, 2 + rnd() * 3); root.add(p); }
  const pad = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 16), clay(0x4f7a3a)); pad.position.copy(PAD).setY(-0.12); root.add(pad);
  const planks = clay(0x7a6448);
  const walk1 = mesh(new THREE.BoxGeometry(1.8, 0.14, 13.4), planks); walk1.position.set(0, 0.05, 2.5); root.add(walk1);
  const walk2 = mesh(new THREE.BoxGeometry(8.4, 0.14, 1.8), planks); walk2.position.set(4.2, 0.05, -4.2); root.add(walk2);
  for (let z = -3.6; z <= 9; z += 1.6) for (const x of [-0.95, 0.95]) { const post = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), clay(0x5a4a3c)); post.position.set(x, -0.2, z); root.add(post); }
  const mound = mesh(new THREE.SphereGeometry(1.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x5d6a3e, { flatShading: true })); mound.scale.y = 0.25; mound.position.copy(TREE2).setY(-0.22); root.add(mound);   // the second tree's hummock
  const dry = mesh(new THREE.CylinderGeometry(5.4, 5.6, 0.8, 32), clay(0x8a8a5a)); dry.position.copy(HOUSE).setY(-0.35); root.add(dry);
  const house = makeHouse({ color: 0xd9d2c0, roof: 0x5a5a62 }); house.position.copy(HOUSE); root.add(house);
  const winLit = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.52), new THREE.MeshBasicMaterial({ color: 0xffd98a })); winLit.position.copy(HOUSE).add(V(0.95, 1.5, 1.33)); root.add(winLit);
  const porch = new THREE.PointLight(0xffc97a, 9, 7, 1.5); porch.position.copy(HOUSE).add(V(0, 2.4, 2.4)); root.add(porch);
  // the dead trees: one by the boardwalk, and another further on, just off it
  const tree = makeDeadTree(rnd); tree.position.copy(TREE); root.add(tree);
  const tree2 = makeDeadTree(rnd); tree2.position.copy(TREE2); tree2.rotation.y = 2.2; root.add(tree2);
  const scorch = mesh(new THREE.CircleGeometry(0.9, 20), clay(0x1f1f1f)); scorch.rotation.x = -Math.PI / 2; scorch.position.copy(TREE).setY(-0.1); scorch.visible = false; root.add(scorch);
  const bolt = makeBolt(rnd); bolt.position.copy(TREE); root.add(bolt);
  const bolt2 = makeBolt(rnd); bolt2.position.copy(UNDER); root.add(bolt2);
  // rain
  const rain = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3), new THREE.MeshBasicMaterial({ color: 0xaab8c4, transparent: true, opacity: 0.5 }), 600); root.add(rain);
  const drops = [...Array(600)].map(() => [(rnd() - 0.5) * 30, rnd() * 6, (rnd() - 0.5) * 30]);   // (kept below the camera)
  // your friend, walking home with you; and the dog, at the house
  const FRIEND = 0x7a5a8c;
  const friend = makePerson({ color: FRIEND }); root.add(friend);
  const dog = makeDog(); dog.position.copy(DOOR).add(V(2.6, 0, 1.4)); dog.rotation.y = -1.8; root.add(dog);
  // the pieces of your friend, knocked flying (like toys)
  const bits = [...Array(24)].map(() => { const b = mesh(new THREE.SphereGeometry(0.1 + rnd() * 0.08, 8, 6), clay(FRIEND)); b.visible = false; root.add(b); return { b, v: V() }; });

  // ---- the frog, on its lily pad. After the lightning, there are two of them, and they look at each other.
  const frog = makeFrog({ scale: 0.7 }); frog.position.copy(PAD).setY(-0.1); frog.rotation.y = 0.8; root.add(frog);
  const frog2 = makeFrog({ scale: 0.7 }); frog2.position.copy(PAD).add(V(0.55, -0.1, -0.2)); frog2.visible = false; root.add(frog2);

  // ---- state. fMode: how your friend moves (follow: beside you along the path; rise: getting up; door: going in; stay)
  const S = { phase: 'walk', idle: 0, struck: false, bitsT: -1, flash: 0, treeK: 1, fMode: 'follow', rise: 0, said: 0, again: false, cover: null, storm: 9, dogWary: false, side: 1, strikeStage: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/swampman.json', 'Swampman');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  level.__frog = { start() {}, update() {}, active: true, done: false };
  const friendSpot = () => {                                          // beside you, a step ahead: on the tree's side before the strike, then whichever side you aren't
    const sp = along(player.pos); let s = Math.min(sp + 0.15, LEN); if (!S.struck) s = Math.min(s, S_TREE);
    const { pt, dir } = pointAt(s); if (s > LEN - 0.05) return pt;
    const left = V(dir.z, 0, -dir.x), lp = player.pos.clone().sub(pointAt(sp).pt).dot(left);
    if (lp > 0.3) S.side = -1; else if (lp < -0.3) S.side = 1;
    const l = !S.struck ? (lp > 0.2 ? Math.max(-0.8, lp - 1) : Math.min(0.8, lp + 1)) : S.side > 0 ? Math.min(0.8, lp + 1) : Math.max(-0.8, lp - 1);
    return pt.add(left.multiplyScalar(l));
  };
  friend.position.copy(friendSpot()); friend.rotation.y = Math.PI;
  const cover = (to, color, rate = 3) => { S.cover = { o: S.cover?.o ?? 0, to, color, rate }; };

  // ---- the first strike: your friend, by the dead tree
  interact.trigger({ test: (p) => p.z < TREE.z + 1.0, onEnter: async () => {
    S.phase = 'strike'; player.enabled = false; player.target = null; S.fMode = 'stay';
    await ctx.wait(0.5);
    S.flash = 1; S.strikeStage = 1; bolt.position.copy(friend.position).setY(0); bolt.visible = true;
    bits.forEach((k) => { k.b.visible = true; k.b.position.copy(friend.position).add(V((rnd() - 0.5) * 0.5, 0.4 + rnd() * 1.4, (rnd() - 0.5) * 0.5)); k.v.set((rnd() - 0.5) * 6, 3 + rnd() * 4, (rnd() - 0.5) * 6); });
    friend.visible = false; S.bitsT = 0; scorch.visible = true;
    await ctx.wait(0.35); bolt.visible = false;
    await voice.say('strike_1', { urgent: true });
    await ctx.wait(0.7);                                              // a beat, before the second bolt
    // the second, separate bolt: it hits the dead tree, not your friend
    S.flash = 1; S.strikeStage = 2; bolt.position.copy(TREE).setY(0); bolt.visible = true;
    await ctx.wait(0.5); bolt.visible = false;
    S.treeK = 0.999; frog2.visible = true;                            // the tree goes; and there's a second frog
    await voice.say('strike_2'); await voice.say('strike_3'); await voice.say('strike_4');
    // and up it gets, where the tree was
    friend.position.copy(TREE).add(V(0.3, -0.08, 0)); friend.rotation.set(-Math.PI / 2, 0, 0); friend.visible = true; S.fMode = 'rise'; S.rise = 0; S.struck = true;
    await ctx.wait(2);
    ctx.speak(friend, 'Ooh! That was close. Come on. Kettle\'s on the minute we\'re in.', { secs: 4.6 });
    S.fMode = 'follow';
    await ctx.wait(2.6); await voice.say('ask'); S.phase = 'after'; player.enabled = true; S.idle = 0;
  } });
  // on along the boardwalk: it seems to know you; and the storm comes round again
  interact.trigger({ test: (p) => p.x > 1.4, when: () => S.phase === 'after', onEnter: async () => {
    await voice.say('seems'); await ctx.wait(1.2); S.storm = 3.5; S.again = true; await voice.say('again');
  } });

  // ---- going home together (also where doing nothing leads: your friend takes you home)
  async function inside(idle) {
    if (S.phase !== 'after') return;
    S.phase = 'home'; player.enabled = false; player.target = null;
    if (idle) {
      ctx.speak(friend, 'Come on, you. The kettle\'s on!');
      await voice.say('home_idle', { urgent: true });
      if (player.pos.distanceTo(INSIDE) > 2.5) { cover(1, '#15181b'); await ctx.wait(1); player.place(INSIDE.x, INSIDE.z + 0.6, Math.PI); friend.position.copy(PATH[3]); cover(0, '#15181b'); await ctx.wait(0.8); S.cover = null; }
    }
    ctx.speak(friend, 'Two sugars, isn\'t it? I know, I know.');
    player.locked = true; player.enabled = true; player.target = DOOR.clone().add(V(0, 0, -0.2));
    await ctx.wait(1.4); S.fMode = 'door';
    await voice.say('home_1', { urgent: !idle }); await ctx.wait(0.6); await voice.say('home_2'); await ctx.wait(1.6);
    save.complete('swampman');
    ctx.gameOver({ title: 'You went home together', text: 'The kettle, the mugs, two sugars, just as always. Nobody will ever know the difference. Did your friend remember you, or only seem to?' });
  }
  interact.add({ pos: INSIDE, radius: 1, height: 2.4, prompt: 'Go inside', terminal: true, enabled: () => S.phase === 'after', onUse: () => inside(false) });

  // ---- stepping up to the second tree: the lightning takes you, and that's the end of it
  interact.add({ pos: STEP, radius: 1.1, height: 2.6, prompt: 'Stand by the tree', terminal: true, enabled: () => S.phase === 'after',
    onUse: async () => {
      S.phase = 'strike2'; player.enabled = false; S.fMode = 'stay'; voice.stop();
      player.locked = true; player.enabled = true; player.target = UNDER.clone();
      ctx.speak(friend, 'Hey! What are you doing? Come away from there!', { secs: 3 });
      await ctx.wait(2.4); player.enabled = false; player.target = null;
      S.flash = 1; bolt2.visible = true; cover(1, '#fbfbf2', 30);
      await ctx.wait(0.3); bolt2.visible = false; player.obj.visible = false;
      await ctx.wait(2);
      save.complete('swampman');
      ctx.gameOver({ title: 'You stood by the tree', text: 'The lightning took you apart. Perhaps something with your face walked out of the swamp afterwards, and went home, and put the kettle on. But this is where your story stops.' });
    } });

  // asides: your friend (the same stories before and after), the dog, the frogs
  const nearEnd = () => player.pos.distanceTo(INSIDE) < 2.4 || player.pos.distanceTo(STEP) < 2.4;
  talk(ctx, { who: friend, offset: [0, 2.6, 0], enabled: () => (S.phase === 'walk' || S.phase === 'after') && !nearEnd(),
    lines: ['Remember when you fell in, just there? Last summer.', 'I\'ll do the toast. You always burn it.', 'Your mum rang, by the way. I said you\'d call her back.', 'Two sugars, isn\'t it? I know, I know.'] });
  talk(ctx, { who: dog, offset: [0, 1.4, 0], enabled: () => S.phase === 'after', lines: ['Woof!', '…', 'Wuff.'] });
  look(ctx, { pos: DOOR.clone().add(V(3.4, 0, 2.2)), radius: 1.1, height: 1.4, prompt: 'Look at the dog', lines: ['dog'], enabled: () => S.phase === 'after' });
  look(ctx, { pos: V(0.6, 0, 3.8), radius: 1.3, height: 1.2, prompt: 'Look at the frogs', lines: ['frogs'], enabled: () => S.phase === 'after' });

  (async () => {
    await ctx.wait(1); await voice.say('arrive');
    ctx.speak(friend, 'Glad we came the long way. Look at that sky!'); await ctx.wait(0.8); await voice.say('storm');
    await ctx.wait(1.5); if (S.phase === 'walk') ctx.speak(friend, 'Kettle\'s on the minute we\'re in.');
  })();

  return Object.assign(level, {
    spawn: { x: 0, z: 8.4, rotY: Math.PI },
    walkable: (x, z) => (Math.abs(x) < 0.85 && z > -5 && z < 9.1) || (x > 0 && x < 8.4 && Math.abs(z + 4.2) < 0.85) || Math.hypot(x - HOUSE.x, z - HOUSE.z) < 4.8
      || (S.phase === 'strike2' && Math.hypot(x - UNDER.x, z - UNDER.z) < 1.4 && z > TREE2.z + 0.4),
    blockers: () => [{ x: HOUSE.x, z: HOUSE.z, w: 3.4, d: 2.8 }, { x: dog.position.x, z: dog.position.z, r: 0.4 }],
    update(dt, t) {
      // rain
      const m = new THREE.Matrix4(); drops.forEach((d, i) => { d[1] -= dt * 10; if (d[1] < 0) d[1] += 6; m.setPosition(d[0], d[1], d[2]); rain.setMatrixAt(i, m); }); rain.instanceMatrix.needsUpdate = true;
      // lightning now and then in the distance (more often once the storm comes round again), and the big ones
      S.flash = Math.max(0, S.flash - dt * 2.2);
      const far = (t % S.storm) < 0.08 ? 0.35 : 0;
      if (S.cover) { const c = S.cover; c.o += Math.sign(c.to - c.o) * Math.min(Math.abs(c.to - c.o), dt * c.rate); ctx.ui.fade(c.o, c.color); }
      else ctx.ui.fade(Math.max(S.flash, far) * 0.9, '#fbfbf2');
      // your friend, knocked apart
      if (S.bitsT >= 0) { S.bitsT += dt; bits.forEach((k) => { k.v.y -= dt * 9; k.b.position.addScaledVector(k.v, dt); if (k.b.position.y < -0.2) { k.b.position.y = -0.2; k.v.set(0, 0, 0); } k.b.scale.setScalar(Math.max(0.001, 1 - S.bitsT / 3)); }); if (S.bitsT > 3) { bits.forEach((k) => (k.b.visible = false)); S.bitsT = -1; } }
      // the tree, gone
      if (S.treeK < 1) { S.treeK = Math.max(0, S.treeK - dt * 1.5); tree.scale.setScalar(Math.max(0.001, S.treeK)); tree.visible = S.treeK > 0.01; }
      // your friend: gets up where the tree was, then walks on beside you as before
      let moving = false;
      if (S.fMode === 'rise') { S.rise = Math.min(1, S.rise + dt / 1.6); friend.rotation.x = -Math.PI / 2 * (1 - easeInOut(S.rise)); }
      else if (friend.rotation.x !== 0) friend.rotation.x = 0;
      if (S.fMode === 'follow' || S.fMode === 'door') {
        const want = S.fMode === 'door' ? DOOR.clone().add(V(-0.5, 0, 0.1)) : friendSpot();
        const d = want.sub(friend.position).setY(0), len = d.length();
        if (friend.position.y !== 0) friend.position.y = Math.min(0, friend.position.y + dt);
        if (len > 0.06) { moving = true; friend.position.addScaledVector(d.normalize(), Math.min(len, dt * 3.8)); turn(friend, Math.atan2(d.x, d.z), 0.15); }
      }
      if (!moving && S.fMode !== 'rise') turn(friend, Math.atan2(player.pos.x - friend.position.x, player.pos.z - friend.position.z), 0.06);
      animatePerson(friend, t, { energy: moving ? 1 : 0.3 });
      // the two frogs look at each other
      if (frog2.visible) { frog.rotation.y = lerp(frog.rotation.y, Math.atan2(frog2.position.x - frog.position.x, frog2.position.z - frog.position.z), 0.05); frog2.rotation.y = lerp(frog2.rotation.y, Math.atan2(frog.position.x - frog2.position.x, frog.position.z - frog2.position.z), 0.05); }
      // the dog is pleased to see you; it isn't sure about your friend
      const nearYou = player.pos.distanceTo(dog.position) < 3.5, nearFriend = S.struck && friend.position.distanceTo(dog.position) < 5;
      if (nearFriend && !S.dogWary) { S.dogWary = true; ctx.speak(dog, 'Grrr…', { offset: [0, 1.4, 0] }); }
      const tail = dog.userData.tail;
      if (nearYou) { turn(dog, Math.atan2(player.pos.x - dog.position.x, player.pos.z - dog.position.z), 0.05); tail.rotation.x = lerp(tail.rotation.x, -0.8, 0.1); tail.rotation.z = Math.sin(t * (nearFriend ? 4 : 14)) * (nearFriend ? 0.2 : 0.6); }
      else if (nearFriend) { turn(dog, Math.atan2(friend.position.x - dog.position.x, friend.position.z - dog.position.z), 0.05); tail.rotation.x = lerp(tail.rotation.x, -2.5, 0.05); tail.rotation.z = 0; }
      else { tail.rotation.x = lerp(tail.rotation.x, -0.8, 0.1); tail.rotation.z = Math.sin(t * 3) * 0.3; }
      if (S.phase === 'after') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) inside(true);
      }
    },
    camera(pl) {
      if (S.phase === 'strike') return { pos: TREE.clone().add(V(4, 4, 8)), look: TREE.clone().add(V(0.8, 1.2, 0)), stiffness: 3 };
      if (S.phase === 'strike2') return { pos: UNDER.clone().add(V(-2.5, 4, 8.5)), look: UNDER.clone().add(V(-0.6, 1.3, 0)), stiffness: 2 };
      const look = pl.pos.clone().add(V(0.5, 1, -2));
      return { pos: look.clone().add(V(1, 7, 11)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); player.locked = false; player.obj.visible = true; },
  });
}
