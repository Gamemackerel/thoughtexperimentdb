// Vignette: The Ring of Gyges.
// You're a shepherd. After a storm the ground has split open; down in the crack is a hollow bronze horse, and inside
// it a gold ring. Turn it and you vanish. The village has a market stall, a coin box, and a palace with guards and a
// treasury. Nobody can see you. Throw the ring back into the dark, or keep it and walk off into the hills.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makePerson, animatePerson, makeHouse, makeTree, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';
import { makeSheep } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CHASM = V(-7, 0, -2);
const STALL = V(3.5, 0, 3);
const GATE = V(11.5, 0, -3.2);
const CHEST = V(15.5, 0, -7.2);
const HILLS = V(-15, 0, -9);

export default function ringOfGyges(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xf1e6cf);
  stage.scene.fog = new THREE.Fog(0xf1e6cf, 60, 160);
  voice.load('ring-of-gyges');
  const frame = makeFramer(stage);
  const rnd = seeded(359);

  root.add(makeIsland({ radius: 24, seed: 27, decor: false, color: 0xd9cfa6, rim: 0xb8a77c }));
  for (let i = 0; i < 9; i++) { const t = makeTree(0.8 + rnd() * 0.6, rnd); const a = 3.2 + rnd() * 2.4, r = 16 + rnd() * 5; t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); root.add(t); }
  // hills to walk off into
  for (const [x, z, s] of [[-17, -12, 5], [-12, -15, 4], [-20, -6, 3.5]]) { const h = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xa9bf8e)); h.scale.set(s, s * 0.6, s); h.position.set(x, 0, z); root.add(h); }

  // ---- the crack in the ground, and the bronze horse inside it
  const crackShape = new THREE.Shape(); crackShape.moveTo(-3.2, 0);
  [[-2.4, 0.7], [-1.2, 0.5], [0, 1.1], [1.3, 0.6], [2.6, 0.8], [3.4, 0], [2.4, -0.7], [1.1, -0.5], [0, -1.2], [-1.3, -0.6], [-2.5, -0.8]].forEach(([x, y]) => crackShape.lineTo(x, y));
  const crack = new THREE.Mesh(new THREE.ShapeGeometry(crackShape), new THREE.MeshBasicMaterial({ color: 0x2a221a })); crack.rotation.x = -Math.PI / 2; crack.position.copy(CHASM).setY(0.01); crack.scale.set(1.3, 1.6, 1); root.add(crack);
  const bronze = clay(0xa87a3c, { metalness: 0.6, roughness: 0.35 });
  const horse = new THREE.Group();
  const hb = mesh(new THREE.CapsuleGeometry(0.45, 1.4, 8, 14), bronze); hb.rotation.z = Math.PI / 2; hb.position.y = 1.3; horse.add(hb);
  const hn = mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.9, 10), bronze); hn.position.set(0.95, 1.8, 0); hn.rotation.z = -0.6; horse.add(hn);
  const hh = mesh(new THREE.CapsuleGeometry(0.18, 0.45, 6, 10), bronze); hh.position.set(1.35, 2.15, 0); hh.rotation.z = -1.2; horse.add(hh);
  for (const [x, z] of [[-0.6, -0.25], [-0.6, 0.25], [0.6, -0.25], [0.6, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.1, 0.08, 1, 8), bronze); l.position.set(x, 0.5, z); horse.add(l); }
  const hatch = mesh(new THREE.BoxGeometry(0.5, 0.4, 0.05), clay(0x2a221a)); hatch.position.set(0, 1.3, 0.46); horse.add(hatch);
  horse.position.copy(CHASM).setY(-1.2); horse.rotation.y = 0.2; root.add(horse);
  const ring = mesh(new THREE.TorusGeometry(0.1, 0.03, 10, 24), clay(0xe2b53b, { metalness: 0.7, roughness: 0.25 })); ring.position.copy(CHASM).add(V(0.1, 0.3, 0.4)); root.add(ring);

  // ---- your flock
  const flock = [0, 1, 2, 3, 4].map((i) => { const s = makeSheep(); s.position.set(-13 + (i % 3) * 1.6, 0, 5 + Math.floor(i / 3) * 1.4); s.rotation.y = rnd() * 6; root.add(s); return s; });

  // ---- the village: a market stall and its keeper, two neighbours talking, the palace wall, gate, guards and treasury
  const stall = new THREE.Group(); const plank = clay(palette.wood);
  const counter = mesh(new THREE.BoxGeometry(2.4, 1, 1), plank); counter.position.y = 0.5; stall.add(counter);
  const awning = mesh(new THREE.BoxGeometry(2.8, 0.1, 1.5), clay(0xe0674f)); awning.position.set(0, 2.5, 0.2); awning.rotation.x = 0.2; stall.add(awning);
  for (const x of [-1.2, 1.2]) { const p = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), plank); p.position.set(x, 1.25, -0.4); stall.add(p); }
  const apples = []; for (let i = 0; i < 9; i++) { const a = mesh(new THREE.SphereGeometry(0.1, 10, 8), clay(i % 3 ? 0xc0392b : 0x7cc04e)); a.position.set(-0.8 + (i % 5) * 0.2, 1.1, -0.15 + Math.floor(i / 5) * 0.2); stall.add(a); apples.push(a); }
  const coinBox = mesh(new THREE.BoxGeometry(0.4, 0.2, 0.3), clay(0x6b4a33)); coinBox.position.set(0.8, 1.1, 0); stall.add(coinBox);
  const coins = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), clay(0xe2b53b, { metalness: 0.6 })); coins.position.set(0.8, 1.23, 0); stall.add(coins);
  stall.position.copy(STALL); root.add(stall);
  const keeper = makePerson({ color: 0x8c4a4a }); keeper.position.copy(STALL).add(V(0, 0, -1)); root.add(keeper);
  const gossips = [0, 1].map((i) => { const p = makePerson({ color: [0x5b7fa6, 0x7a5a8c][i], robe: true }); p.position.set(6.5 + i * 1.1, 0, 7); p.rotation.y = i ? -1.6 : 1.6; root.add(p); return p; });
  for (const [x, z, r] of [[-1, 9, 0.2], [2.5, 10.5, -0.3], [8.5, 11, 0.1]]) { const h = makeHouse({ color: 0xf2e6d4, roof: 0xb5654e }); h.position.set(x, 0, z); h.rotation.y = r + Math.PI; root.add(h); }
  const wallM = clay(0xe4dccd);
  for (const [x, z, w, d] of [[GATE.x - 3.6, GATE.z, 5.4, 0.6], [GATE.x + 4.4, GATE.z, 5.6, 0.6], [GATE.x - 6, GATE.z - 3.5, 0.6, 7], [GATE.x + 7, GATE.z - 3.5, 0.6, 7], [GATE.x + 0.5, GATE.z - 7, 13.6, 0.6]]) {
    const w_ = mesh(new THREE.BoxGeometry(w, 2.6, d), wallM); w_.position.set(x, 1.3, z); root.add(w_);
  }
  for (const s of [-1, 1]) { const tower = mesh(new THREE.CylinderGeometry(0.7, 0.8, 3.6, 12), wallM); tower.position.set(GATE.x + s * 1.2, 1.8, GATE.z); root.add(tower); }
  const palace = makeHouse({ color: 0xf6efe0, roof: 0x3f8f86 }); palace.scale.setScalar(1.3); palace.position.set(GATE.x + 1.5, 0, GATE.z - 4.5); root.add(palace);
  const guards = [-1, 1].map((s) => { const g = makePerson({ color: 0x3f5a8c, hat: true }); g.position.copy(GATE).add(V(s * 1.5, 0, 0.9)); root.add(g); const spear = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 6), clay(0x6b4a33)); spear.position.set(0.45, 1.4, 0); g.add(spear); return g; });
  const chest = new THREE.Group(); const cb = mesh(new THREE.BoxGeometry(1, 0.6, 0.7), clay(0x6b4a33)); cb.position.y = 0.3; chest.add(cb);
  const lid = mesh(new THREE.BoxGeometry(1.02, 0.12, 0.72), clay(0x5a3d29)); lid.position.set(0, 0.66, 0); chest.add(lid);
  const gold = mesh(new THREE.BoxGeometry(0.8, 0.12, 0.5), clay(0xe2b53b, { metalness: 0.7, roughness: 0.3 })); gold.position.y = 0.62; chest.add(gold);
  chest.position.copy(CHEST); root.add(chest);

  // ---- state
  const S = { phase: 'explore', hasRing: false, invisible: false, took: new Set(), inside: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/ring-of-gyges.json', 'The Ring of Gyges');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  // invisibility: swap your materials for glassy ones
  const saved = new Map(), ghostMat = new THREE.MeshStandardMaterial({ color: palette.agent, transparent: true, opacity: 0.18, roughness: 0.2, depthWrite: false });
  function setInvisible(on) {
    S.invisible = on;
    player.obj.traverse((m) => { if (!m.isMesh) return; if (on) { saved.set(m, m.material); m.material = ghostMat; m.castShadow = false; } else if (saved.has(m)) { m.material = saved.get(m); m.castShadow = true; } });
    btn.textContent = on ? 'Turn the ring back (R)' : 'Turn the ring (R)';
    if (on) { voice.say('turn'); voice.say('ask'); frogStart(); }
  }
  const btn = document.createElement('button'); btn.className = 'ringbtn'; btn.hidden = true; btn.textContent = 'Turn the ring (R)';
  Object.assign(btn.style, { position: 'fixed', right: '18px', bottom: '18px', zIndex: 5, font: '600 16px var(--sans)', padding: '10px 18px', borderRadius: '999px', border: '0', background: '#e2b53b', color: '#2b2a33', cursor: 'pointer', pointerEvents: 'auto' });
  document.getElementById('hud').appendChild(btn);
  const toggle = () => { if (S.hasRing && S.phase === 'explore') setInvisible(!S.invisible); };
  btn.addEventListener('click', toggle);
  const onKey = (e) => { if (e.code === 'KeyR') toggle(); };
  addEventListener('keydown', onKey);

  // the frog hops up to where you are (you can't be seen), bumps into you, and hops round you, puzzled
  const frog = makeFrog(); root.add(frog);
  let cameo = { start() {}, update() {}, active: false, done: false };
  function frogStart() {
    if (cameo.started) return;
    const p = player.pos.clone(), a = V(p.x + 5, 0, p.z + 2.5);
    cameo = frogCameo(frog, [[a.x, a.z], [p.x + 3.4, p.z + 1.7], [p.x + 1.8, p.z + 0.9], { at: [p.x + 0.55, p.z + 0.3], height: 0.7 }, { at: [p.x + 1.2, p.z + 0.6], height: 0.5, back: true },
      { face: [p.x, p.z] }, { wait: 1.4, act: (f, u) => (f.userData.body.rotation.z = Math.sin(u * Math.PI * 2) * 0.25) }, [p.x + 0.6, p.z - 1.3], [p.x - 0.9, p.z - 1.1], [p.x - 1.3, p.z + 0.4], { face: [p.x, p.z] }, { wait: 0.8 },
      [p.x - 3, p.z + 1.6], [p.x - 5, p.z + 3]]);
    cameo.started = true; cameo.start(); level.__frog = cameo;
  }

  // ---- interactions
  interact.add({ pos: CHASM.clone().add(V(1.2, 0, 2.2)), radius: 2, prompt: 'Reach into the horse', enabled: () => S.phase === 'explore' && !S.hasRing && voice.said.has('horse'),
    onUse: async () => { S.hasRing = true; ring.visible = false; btn.hidden = false; await voice.say('take'); ctx.toast('Press <b>R</b> (or the gold button) to turn the ring.', 5); } });
  interact.trigger({ pos: CHASM, radius: 6, onEnter: () => voice.say('horse') });
  const take = (what, obj, line = 'took') => { S.took.add(what); if (obj) obj.visible = false; voice.say(line); };
  interact.add({ pos: STALL.clone().add(V(-0.6, 0, 1.2)), radius: 1.5, prompt: 'Take an apple', enabled: () => S.phase === 'explore' && S.invisible && apples.some((a) => a.visible),
    onUse: () => { take('apple', apples.find((a) => a.visible)); ctx.speak(keeper, "Hm. I'm sure I had more apples than that."); } });
  interact.add({ pos: STALL.clone().add(V(0.8, 0, 1.2)), radius: 1.3, prompt: 'Take the coins', enabled: () => S.phase === 'explore' && S.invisible && coins.visible,
    onUse: () => { take('coins', coins); ctx.speak(keeper, 'Where did my takings go?'); } });
  interact.add({ pos: CHEST.clone().add(V(0, 0, 1.1)), radius: 1.6, prompt: "Take the king's gold", enabled: () => S.phase === 'explore' && S.invisible && gold.visible,
    onUse: () => take('gold', gold, 'treasury') });
  interact.trigger({ test: (p) => p.z < GATE.z - 0.6 && Math.abs(p.x - GATE.x) < 5, onEnter: () => voice.say('guards') });
  interact.add({ pos: CHASM.clone().add(V(-1.6, 0, 2.2)), radius: 1.6, prompt: 'Throw the ring back', enabled: () => S.phase === 'explore' && S.hasRing && voice.said.has('ask'),
    onUse: () => end('throw') });
  interact.add({ pos: HILLS.clone().add(V(2, 0, 2)), radius: 2.6, prompt: 'Walk off into the hills', enabled: () => S.phase === 'explore' && S.hasRing && voice.said.has('ask'),
    onUse: () => end('keep') });

  // asides
  talk(ctx, { who: keeper, enabled: () => S.phase === 'explore', lines: (i) => (S.invisible ? ['Who said that?', 'Is somebody there?', "I'm hearing things."][i % 3] : ['Apples! Two for a coin!', "You look like you've seen a ghost.", "Mind the crack in the road. Opened up in the storm."][i % 3]) });
  gossips.forEach((g, k) => talk(ctx, { who: g, enabled: () => S.phase === 'explore', lines: (i) => (S.invisible ? ['…did you hear something?', "It's the wind."][(i + k) % 2] : ["They say the king's gold is counted every night.", 'That shepherd was always an honest sort.', 'Honest? Only because somebody was watching.'][(i + k) % 3]) }));
  guards.forEach((g) => talk(ctx, { who: g, radius: 1.8, enabled: () => S.phase === 'explore' && !S.invisible, lines: ['Halt. The palace is closed.', 'Move along, shepherd.', 'No one goes in without being seen.'] }));
  look(ctx, { pos: () => flock[1].position, radius: 2.2, height: 1.4, prompt: 'Look at your sheep', lines: ['flock'], enabled: () => S.phase === 'explore' });

  async function end(how) {
    S.phase = 'over'; player.enabled = false; btn.hidden = true;
    if (S.invisible) setInvisible(false);
    const took = S.took.size > 0;
    if (how === 'throw') { ring.visible = true; ring.position.copy(CHASM).add(V(0.4, 0.2, 0.3)); }
    else { player.locked = true; player.enabled = true; player.target = HILLS.clone().add(V(-3, 0, -3)); }
    await ctx.wait(1); await voice.say(`${how}_${took ? 'took' : 'clean'}`); await ctx.wait(1.2);
    save.complete('ring-of-gyges');
    const what = [...S.took].map((t) => ({ apple: 'an apple', coins: "the stallkeeper's coins", gold: "the king's gold" })[t]).join(', ');
    ctx.gameOver(how === 'throw'
      ? { title: 'You gave it back to the dark', text: took ? `First you took ${what}. Nobody saw. Then you let the ring go.` : 'You never used it for anything. Would you have stayed honest if you had kept it?' }
      : { title: 'You kept the ring', text: took ? `You took ${what}, and nobody will ever know. Is anyone honest, once nobody is watching?` : "You haven't used it yet. Nobody will ever see what you do with it." });
  }

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -10, z: 4, rotY: Math.PI * 0.8 },
    walkable: (x, z) => Math.hypot(x, z) < 22 && !(Math.abs(x - CHASM.x) < 3.2 && Math.abs(z - CHASM.z) < 1.3),
    blockers: () => {
      const b = [{ x: STALL.x, z: STALL.z, r: 1.3 }, { x: keeper.position.x, z: keeper.position.z, r: 0.4 }, { x: chest.position.x, z: chest.position.z, r: 0.7 }, { x: palace.position.x, z: palace.position.z, r: 2.8 },
        ...gossips.map((g) => ({ x: g.position.x, z: g.position.z, r: 0.45 }))];
      // the palace wall (with the gate open only to someone nobody can see)
      for (let x = GATE.x - 6; x <= GATE.x + 7; x += 0.7) { if (Math.abs(x - GATE.x) > 0.8 || !S.invisible) b.push({ x, z: GATE.z, r: 0.45 }); b.push({ x, z: GATE.z - 7, r: 0.45 }); }
      for (let z = GATE.z; z >= GATE.z - 7; z -= 0.7) { b.push({ x: GATE.x - 6, z, r: 0.45 }); b.push({ x: GATE.x + 7, z, r: 0.45 }); }
      guards.forEach((g) => b.push({ x: g.position.x, z: g.position.z, r: 0.4 }));
      return b;
    },
    update(dt, t) {
      flock.forEach((s, i) => { s.userData.body.rotation.x = Math.max(0, Math.sin(t * 0.7 + i * 1.7)) * 0.3; s.position.x += Math.sin(t * 0.2 + i) * 0.002; });
      animatePerson(keeper, t, { energy: 0.4 });
      gossips.forEach((g, i) => animatePerson(g, t, { phase: i * 2, energy: 0.6 }));
      guards.forEach((g, i) => { g.rotation.y = S.invisible ? Math.sin(t * 0.3 + i) * 0.2 : Math.atan2(player.pos.x - g.position.x, player.pos.z - g.position.z) * 0.5; });
      if (ring.visible && !S.hasRing) ring.rotation.y = t;
      level.__frog.update?.(dt);
    },
    camera(pl) {
      const pts = [pl.pos.clone(), CHASM.clone(), STALL.clone()];
      if (pl.pos.x > 4 || S.took.size) pts.push(GATE.clone(), CHEST.clone());
      if (pl.pos.x < -8) pts.push(HILLS.clone());
      return { ...frame(pts, { min: 16, max: 44 }), stiffness: 2.2 };
    },
    dispose() {
      voice.stop(); removeEventListener('keydown', onKey); btn.remove();
      if (S.invisible) player.obj.traverse((m) => { if (m.isMesh && saved.has(m)) { m.material = saved.get(m); m.castShadow = true; } });
      player.locked = false;
    },
  });
}
