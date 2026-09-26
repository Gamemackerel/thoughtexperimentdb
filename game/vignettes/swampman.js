// Vignette: Swampman.
// A walk home along the boardwalk through the swamp, at dusk, with a storm coming. Beside the path, a dead tree.
// Lightning strikes: it takes you apart, and by sheer chance turns the tree into an exact copy of you, every atom in
// place, every memory. You walk on (is it you?) to your house, where your friend is at the door and the dog is not so
// sure. Go inside and carry on; tell them what happened; or go back to the swamp to look for yourself.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeHouse, makeRock } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { talk, look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TREE = V(-1.7, 0, 1.2);
const HOUSE = V(8.6, 0, -8.4);
const DOOR = V(8.6, 0, -6.4);
const PAD = V(-4.2, 0, 3.4);
const IDLE_LIMIT = 60;

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
  for (let i = 0; i < 22; i++) { const h = mesh(new THREE.SphereGeometry(0.8 + rnd() * 1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x5d6a3e, { flatShading: true })); h.scale.y = 0.35; const a = rnd() * 6.28, d = 3 + rnd() * 14; h.position.set(Math.cos(a) * d, -0.2, Math.sin(a) * d); if (Math.abs(h.position.x) < 2.4 && h.position.z > -5) continue; if (h.position.distanceTo(HOUSE) < 6) continue; root.add(h); }
  for (let i = 0; i < 70; i++) { const r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1 + rnd() * 1.2, 4), clay(0x6a7a3a)); const a = rnd() * 6.28, d = 2.4 + rnd() * 14; r.position.set(Math.cos(a) * d, 0.3, Math.sin(a) * d); r.rotation.z = (rnd() - 0.5) * 0.3; if (Math.abs(r.position.x) < 1.4) continue; root.add(r); }
  for (let i = 0; i < 8; i++) { const p = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 14), clay(0x4f7a3a)); p.position.set(-5 + rnd() * 3, -0.12, 2 + rnd() * 3); root.add(p); }
  const pad = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 16), clay(0x4f7a3a)); pad.position.copy(PAD).setY(-0.12); root.add(pad);
  const planks = clay(0x7a6448);
  const walk1 = mesh(new THREE.BoxGeometry(1.8, 0.14, 13.4), planks); walk1.position.set(0, 0.05, 2.5); root.add(walk1);
  const walk2 = mesh(new THREE.BoxGeometry(8.4, 0.14, 1.8), planks); walk2.position.set(4.2, 0.05, -4.2); root.add(walk2);
  for (let z = -3.6; z <= 9; z += 1.6) for (const x of [-0.95, 0.95]) { const post = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), clay(0x5a4a3c)); post.position.set(x, -0.2, z); root.add(post); }
  const dry = mesh(new THREE.CylinderGeometry(5.4, 5.6, 0.8, 32), clay(0x8a8a5a)); dry.position.copy(HOUSE).setY(-0.35); root.add(dry);
  const house = makeHouse({ color: 0xd9d2c0, roof: 0x5a5a62 }); house.position.copy(HOUSE); root.add(house);
  const winLit = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.52), new THREE.MeshBasicMaterial({ color: 0xffd98a })); winLit.position.copy(HOUSE).add(V(0.95, 1.5, 1.33)); root.add(winLit);
  const porch = new THREE.PointLight(0xffc97a, 9, 7, 1.5); porch.position.copy(HOUSE).add(V(0, 2.4, 2.4)); root.add(porch);
  // the dead tree, by the path
  const tree = new THREE.Group(); const trunk = mesh(new THREE.CylinderGeometry(0.16, 0.3, 3.4, 7), clay(0x5a4a3c)); trunk.position.y = 1.7; tree.add(trunk);
  for (const [y, rz, ry] of [[2.4, 0.9, 0], [2.9, -0.8, 1], [2, 1.1, 2.4], [3.1, 0.5, 4]]) { const br = mesh(new THREE.CylinderGeometry(0.04, 0.1, 1.4, 5), clay(0x5a4a3c)); br.position.set(Math.sin(ry) * 0.3, y + 0.3, Math.cos(ry) * 0.3); br.rotation.set(0, ry, rz); tree.add(br); }
  tree.position.copy(TREE); root.add(tree);
  const scorch = mesh(new THREE.CircleGeometry(0.9, 20), clay(0x1f1f1f)); scorch.rotation.x = -Math.PI / 2; scorch.position.copy(TREE).setY(-0.1); scorch.visible = false; root.add(scorch);
  const bolt = new THREE.Group(); { let p = V(0, 14, 0); for (let i = 0; i < 7; i++) { const q = V((rnd() - 0.5) * 1.4, 14 - (i + 1) * 2, (rnd() - 0.5) * 0.6); const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, p.distanceTo(q), 5), new THREE.MeshBasicMaterial({ color: 0xfff6d0 })); seg.position.copy(p).lerp(q, 0.5); seg.quaternion.setFromUnitVectors(V(0, 1, 0), q.clone().sub(p).normalize()); bolt.add(seg); p = q; } }
  bolt.position.copy(TREE); bolt.visible = false; root.add(bolt);
  // rain
  const rain = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3), new THREE.MeshBasicMaterial({ color: 0xaab8c4, transparent: true, opacity: 0.5 }), 600); root.add(rain);
  const drops = [...Array(600)].map(() => [(rnd() - 0.5) * 30, rnd() * 6, (rnd() - 0.5) * 30]);   // (kept below the camera)
  // your friend at the door, and the dog
  const friend = makePerson({ color: 0x7a5a8c }); friend.position.copy(DOOR).add(V(-1.4, 0, 0.3)); friend.rotation.y = -0.6; root.add(friend);
  const dog = makeDog(); dog.position.copy(DOOR).add(V(2.6, 0, 1.4)); dog.rotation.y = -1.8; root.add(dog);
  // the pieces of you, knocked flying (like toys)
  const bits = [...Array(24)].map(() => { const b = mesh(new THREE.SphereGeometry(0.1 + rnd() * 0.08, 8, 6), clay(palette.agent)); b.visible = false; root.add(b); return { b, v: V() }; });

  // ---- the frog, on its lily pad. After the lightning, there are two of them, and they look at each other.
  const frog = makeFrog({ scale: 0.7 }); frog.position.copy(PAD).setY(-0.1); frog.rotation.y = 0.8; root.add(frog);
  const frog2 = makeFrog({ scale: 0.7 }); frog2.position.copy(PAD).add(V(0.55, -0.1, -0.2)); frog2.visible = false; root.add(frog2);

  // ---- state
  const S = { phase: 'walk', idle: 0, struck: false, bitsT: -1, flash: 0, treeK: 1, dogWag: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/swampman.json', 'Swampman');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  level.__frog = { start() {}, update() {}, active: true, done: false };

  // the strike
  interact.trigger({ test: (p) => p.z < TREE.z + 1 && p.z > TREE.z - 1.6, onEnter: async () => {
    S.phase = 'strike'; player.enabled = false; player.target = null;
    await ctx.wait(0.4);
    S.flash = 1; bolt.visible = true;
    bits.forEach((k) => { k.b.visible = true; k.b.position.copy(player.pos).add(V((rnd() - 0.5) * 0.5, 0.4 + rnd() * 1.4, (rnd() - 0.5) * 0.5)); k.v.set((rnd() - 0.5) * 6, 3 + rnd() * 4, (rnd() - 0.5) * 6); });
    player.obj.visible = false; S.bitsT = 0; scorch.visible = true;
    await ctx.wait(0.35); bolt.visible = false;
    await voice.say('strike_1', { urgent: true });
    S.treeK = 0.999; frog2.visible = true;                            // the tree goes; and there's a second frog
    await ctx.wait(0.4); await voice.say('strike_2');
    player.place(TREE.x + 0.4, TREE.z + 0.3, Math.PI); player.obj.visible = true; S.struck = true;
    await ctx.wait(1); await voice.say('ask'); S.phase = 'after'; player.enabled = true; S.idle = 0;
  } });

  async function inside(idle) {
    if (S.phase !== 'after') return;
    S.phase = 'over'; player.enabled = false;
    if (idle) { await voice.say('home_idle', { urgent: true }); }
    ctx.speak(friend, 'There you are! You\'re soaked. Come in, the kettle\'s on.');
    player.locked = true; player.enabled = true; player.target = DOOR.clone().add(V(0, 0, -0.2)); S.goingIn = true;
    await ctx.wait(1.6); await voice.say('home_1', { urgent: !idle }); await ctx.wait(0.6); await voice.say('home_2'); await ctx.wait(1.6);
    save.complete('swampman');
    ctx.gameOver({ title: 'You went home', text: 'You walked in, found the mugs where they always are, and knew your friend takes two sugars. Nobody will ever know the difference. Did you recognise your friend, or only seem to?' });
  }
  interact.add({ pos: DOOR.clone().add(V(0.3, 0, 1.3)), radius: 1, height: 2.4, prompt: 'Go inside', terminal: true, enabled: () => S.phase === 'after', onUse: () => inside(false) });
  interact.add({ pos: friend.position.clone().add(V(-0.5, 0, 1.2)), radius: 1, height: 2.4, prompt: 'Tell them what happened', terminal: true, enabled: () => S.phase === 'after',
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      ctx.speak(friend, 'Lightning? And a tree? …But you\'re you. You remember everything!', { secs: 4.4 });
      await ctx.wait(3); await voice.say('tell_1', { urgent: true }); await ctx.wait(0.6); await voice.say('tell_2'); await ctx.wait(1.6);
      save.complete('swampman');
      ctx.gameOver({ title: 'You told them', text: 'Your friend didn\'t believe a word. Same face, same voice, same memories: of course it\'s you. Some people agree. Others say the one who walked into the swamp never came out.' });
    } });
  interact.add({ pos: TREE.clone().add(V(1.6, 0, -0.6)), radius: 1.3, height: 1.6, prompt: 'Look for yourself', terminal: true, enabled: () => S.phase === 'after' && S.left,
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      await voice.say('back_1', { urgent: true }); await ctx.wait(0.8); await voice.say('back_2'); await ctx.wait(1.6);
      save.complete('swampman');
      ctx.gameOver({ title: 'You went back to look', text: 'There was only a scorch mark, and the black water. Nobody else was coming home tonight. Only you. If it is you: you never met your friend, never learned their name; you only remember doing it.' });
    } });
  interact.trigger({ test: (p) => p.x > 3, when: () => S.struck, onEnter: () => { S.left = true; } });

  // asides
  talk(ctx, { who: dog, offset: [0, 1.4, 0], enabled: () => S.phase === 'after', lines: ['Woof?', '…', 'Wuff.'] });
  look(ctx, { pos: DOOR.clone().add(V(3.4, 0, 2.2)), radius: 1.1, height: 1.4, prompt: 'Look at the dog', lines: ['dog'], enabled: () => S.phase === 'after' });
  look(ctx, { pos: V(1.4, 0, 3.6), radius: 1.6, height: 1.2, prompt: 'Look at the frogs', lines: ['frogs'], enabled: () => S.phase === 'after' });

  (async () => { await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('storm'); })();

  return Object.assign(level, {
    spawn: { x: 0, z: 8.4, rotY: Math.PI },
    walkable: (x, z) => (Math.abs(x) < 0.85 && z > -5 && z < 9.1) || (x > 0 && x < 8.4 && Math.abs(z + 4.2) < 0.85) || Math.hypot(x - HOUSE.x, z - HOUSE.z) < 4.8
      || (S.struck && x > TREE.x - 0.6 && x < 0.9 && Math.abs(z - TREE.z) < 0.9),
    blockers: () => [{ x: HOUSE.x, z: HOUSE.z, w: 3.4, d: 2.8 }, { x: friend.position.x, z: friend.position.z, r: 0.4 }, { x: dog.position.x, z: dog.position.z, r: 0.4 }],
    update(dt, t) {
      // rain
      const m = new THREE.Matrix4(); drops.forEach((d, i) => { d[1] -= dt * 10; if (d[1] < 0) d[1] += 6; m.setPosition(d[0], d[1], d[2]); rain.setMatrixAt(i, m); }); rain.instanceMatrix.needsUpdate = true;
      // lightning now and then in the distance, and the big one
      S.flash = Math.max(0, S.flash - dt * 2.2);
      const far = (t % 9) < 0.08 ? 0.35 : 0;
      ctx.ui.fade(Math.max(S.flash, far) * 0.9, '#fbfbf2');
      // you, knocked apart
      if (S.bitsT >= 0) { S.bitsT += dt; bits.forEach((k) => { k.v.y -= dt * 9; k.b.position.addScaledVector(k.v, dt); if (k.b.position.y < -0.2) { k.b.position.y = -0.2; k.v.set(0, 0, 0); } k.b.scale.setScalar(Math.max(0.001, 1 - S.bitsT / 3)); }); if (S.bitsT > 3) bits.forEach((k) => (k.b.visible = false)); }
      // the tree, gone
      if (S.treeK < 1) { S.treeK = Math.max(0, S.treeK - dt * 1.5); tree.scale.setScalar(Math.max(0.001, S.treeK)); tree.visible = S.treeK > 0.01; }
      // the two frogs look at each other
      if (frog2.visible) { frog.rotation.y = lerp(frog.rotation.y, Math.atan2(frog2.position.x - frog.position.x, frog2.position.z - frog.position.z), 0.05); frog2.rotation.y = lerp(frog2.rotation.y, Math.atan2(frog.position.x - frog2.position.x, frog.position.z - frog2.position.z), 0.05); }
      // the dog isn't sure about you; then it is
      const near = player.pos.distanceTo(dog.position) < 3.5 && S.struck;
      S.dogWag += dt; dog.userData.tail.rotation.z = near ? Math.sin(t * (S.dogWag > 8 ? 14 : 2)) * (S.dogWag > 8 ? 0.6 : 0.15) : Math.sin(t * 3) * 0.3;
      if (near) dog.rotation.y = lerp(dog.rotation.y, Math.atan2(player.pos.x - dog.position.x, player.pos.z - dog.position.z), 0.05); else S.dogWag = 0;
      animatePerson(friend, t, { energy: 0.3 });
      if (S.phase === 'after') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) inside(true);
      }
    },
    camera(pl) {
      if (S.phase === 'strike') return { pos: TREE.clone().add(V(4, 4, 8)), look: TREE.clone().add(V(0, 1.4, 0)), stiffness: 3 };
      const look = pl.pos.clone().add(V(0.5, 1, -2));
      return { pos: look.clone().add(V(1, 7, 11)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); player.locked = false; player.obj.visible = true; },
  });
}
