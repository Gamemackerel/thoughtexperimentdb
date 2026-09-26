// Vignette: The Ones Who Walk Away from Omelas.
// The Festival of Summer in Omelas: white walls and gold roofs, bells, pennants, a fountain, dancers, a boy playing the
// flute, horses with ribbons in their manes waiting for the race. Everyone is happy. Under one of the public buildings,
// a cellar door; down there, in the dark, one child, alone. Their happiness depends on the child staying there: those
// are the terms. Go back up, and (if you do nothing more) you stay; join the dancing; walk out of the north gate towards
// the mountains, alone; or carry the child up into the sun, and watch the city lose everything it had.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeIsland, makePerson, animatePerson, makeHouse, makeFrog } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALL = V(7.5, 0, -7);                 // the public building with the cellar under it
const HATCH = V(7.5, 0, -4.4);              // its cellar door
const GATE_Z = -15.5;                        // the north gate, towards the mountains
const CELLAR = V(80, 0, 0);                 // the cellar, a room of its own
const IDLE_LIMIT = 50;

function makeHorse(color) {
  const g = new THREE.Group(), coat = clay(color), dark = clay(0x3a2a20);
  const body = mesh(new THREE.CapsuleGeometry(0.42, 1.1, 8, 14), coat); body.rotation.x = Math.PI / 2; body.position.y = 1.35; g.add(body);
  const neck = mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.9, 10), coat); neck.position.set(0, 1.85, 0.8); neck.rotation.x = 0.6; g.add(neck);
  const head = mesh(new THREE.CapsuleGeometry(0.17, 0.45, 6, 10), coat); head.position.set(0, 2.2, 1.15); head.rotation.x = 1.3; g.add(head);
  for (const [x, z] of [[-0.25, -0.55], [0.25, -0.55], [-0.25, 0.55], [0.25, 0.55]]) { const l = mesh(new THREE.CylinderGeometry(0.08, 0.07, 1.1, 6), coat); l.position.set(x, 0.55, z); g.add(l); }
  const mane = mesh(new THREE.BoxGeometry(0.06, 0.2, 0.8), dark); mane.position.set(0, 2.1, 0.75); mane.rotation.x = 0.6; g.add(mane);
  for (let i = 0; i < 3; i++) { const rib = mesh(new THREE.BoxGeometry(0.04, 0.5, 0.06), clay([0xe2b33b, 0xc9ccd1, 0x3f8f86][i])); rib.position.set(0.06, 1.95 - i * 0.05, 0.5 + i * 0.2); rib.rotation.x = 0.3; g.add(rib); }
  const tail = mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.9, 6), dark); tail.position.set(0, 1.2, -1.05); tail.rotation.x = -0.4; g.add(tail);
  return g;
}

export default function omelas(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xbfe0f2);
  stage.scene.fog = new THREE.Fog(0xbfe0f2, 60, 200);
  voice.load('omelas');
  const rnd = seeded(1973);
  const canvas = document.getElementById('gl');

  // ---- the city: a green hill by the sea, a stone plaza, white houses with gold and teal roofs, the mountains north
  root.add(makeIsland({ radius: 22, seed: 12, color: 0x9cc86a, decor: false }));
  const sea = mesh(new THREE.CylinderGeometry(160, 160, 0.4, 64), clay(0x6fa8c8, { roughness: 0.3 })); sea.position.y = -2.6; root.add(sea);
  const plaza = mesh(new THREE.CylinderGeometry(9, 9, 0.08, 48), clay(0xf2eadb)); plaza.position.y = 0.04; root.add(plaza);
  const road = mesh(new THREE.BoxGeometry(2.6, 0.08, 14), clay(0xe6dcc8)); road.position.set(0, 0.03, -15); root.add(road);
  const houses = [];
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI / 2 + 0.45 + (i / 12) * (Math.PI * 2 - 0.9), d = 13 + (i % 2) * 1.6;
    if (Math.abs(Math.atan2(Math.sin(a - Math.atan2(HALL.z, HALL.x)), Math.cos(a - Math.atan2(HALL.z, HALL.x)))) < 0.35) continue;
    if (Math.sin(a) > 0.75) continue;                                     // keep the south open (the camera's side)
    const h = makeHouse({ color: 0xf8f4ec, roof: [0xe2b33b, 0x3f8f86, 0xe6c65a][i % 3] }); h.scale.setScalar(1.4 + (i % 3) * 0.15);
    h.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); h.rotation.y = -a - Math.PI / 2; root.add(h); houses.push(h);
  }
  // the public hall: columns, a pediment, and at its foot a slanting cellar door
  const hall = new THREE.Group(); const marble = clay(0xfbf8f0);
  const hbase = mesh(new THREE.BoxGeometry(6, 0.5, 4.4), marble); hbase.position.y = 0.25; hall.add(hbase);
  const hbody = mesh(new THREE.BoxGeometry(5, 3.6, 3), marble); hbody.position.set(0, 2.3, -0.5); hall.add(hbody);
  for (let i = 0; i < 5; i++) { const c = mesh(new THREE.CylinderGeometry(0.2, 0.22, 3.6, 12), marble); c.position.set(-2.2 + i * 1.1, 2.3, 1.6); hall.add(c); }
  const ped = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-3.1, 0), new THREE.Vector2(3.1, 0), new THREE.Vector2(0, 1.3)]), { depth: 4.2, bevelEnabled: false }), clay(0xe2b33b)); ped.position.set(0, 4.1, -2.4); hall.add(ped);
  hall.position.copy(HALL); root.add(hall);
  const hatchPivot = new THREE.Group(); hatchPivot.position.copy(HATCH).add(V(0, 0.3, -0.6)); root.add(hatchPivot);
  const hatch = mesh(new THREE.BoxGeometry(1.4, 0.08, 1.2), clay(0x5a4a3c)); hatch.position.set(0, 0, 0.55); hatch.rotation.x = 0.3; hatchPivot.add(hatch);
  const ring = mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), clay(0x3a3a3a)); ring.position.set(0, 0.05, 0.9); ring.rotation.x = Math.PI / 2 + 0.3; hatchPivot.add(ring);
  // a bell tower, and pennants strung over the plaza
  const tower = new THREE.Group(); const tw = mesh(new THREE.BoxGeometry(1.8, 8, 1.8), marble); tw.position.y = 4; tower.add(tw);
  const cap = mesh(new THREE.ConeGeometry(1.5, 2.2, 4), clay(0x3f8f86)); cap.position.y = 9.1; cap.rotation.y = Math.PI / 4; tower.add(cap);
  const bell = mesh(new THREE.CylinderGeometry(0.3, 0.55, 0.7, 14), clay(0xe2b33b, { metalness: 0.6, roughness: 0.3 })); bell.position.y = 7.3; tower.add(bell);
  tower.position.set(-8, 0, -9); root.add(tower);
  const pennants = [];
  for (let s = 0; s < 3; s++) {
    const a0 = s * 2.1 + 0.5, p0 = V(Math.cos(a0) * 8.5, 4.4, Math.sin(a0) * 8.5), p1 = V(Math.cos(a0 + 2.1) * 8.5, 4.4, Math.sin(a0 + 2.1) * 8.5);   // chords, not across the middle
    for (let i = 1; i < 16; i++) {
      const u = i / 16, p = p0.clone().lerp(p1, u); p.y -= Math.sin(Math.PI * u) * 1.2;
      const pen = mesh(new THREE.ConeGeometry(0.2, 0.55, 3), clay([0xe0674f, 0xf2c14e, 0x3f8f86, 0x5b7fa6, 0xf6efe0][(i + s) % 5])); pen.rotation.x = Math.PI; pen.position.copy(p).add(V(0, -0.3, 0)); root.add(pen); pennants.push(pen);
    }
  }
  // the fountain, the dancers round it, a boy with a flute on its step
  const fountain = new THREE.Group(); const basin = mesh(new THREE.CylinderGeometry(1.8, 2, 0.6, 24), marble); basin.position.y = 0.3; fountain.add(basin);
  const water = mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.05, 24), clay(0x8fc7e0, { roughness: 0.2 })); water.position.y = 0.58; fountain.add(water);
  const spout = mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.6, 10), marble); spout.position.y = 0.9; fountain.add(spout);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfeaf6, transparent: true, opacity: 0.6, roughness: 0.1, side: THREE.DoubleSide })); jet.position.y = 2; jet.rotation.x = Math.PI; fountain.add(jet);
  root.add(fountain);
  const dancers = [...Array(8)].map((_, i) => { const p = makePerson({ color: [0xe0674f, 0xf2c14e, 0x5b7fa6, 0xf6efe0, 0x7cc04e, 0xe8435a][i % 6], robe: i % 2 === 0 }); root.add(p); return p; });
  const flute = makePerson({ color: 0xf6efe0, scale: 0.7 }); flute.position.set(-0.4, 0, 2.3); root.add(flute);
  const pipe = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), clay(0x8a6a3a)); pipe.rotation.z = Math.PI / 2 - 0.3; pipe.position.set(0.25, 1.62, 0.35); flute.userData.body.add(pipe);
  const horses = [makeHorse(0xf6f1e7), makeHorse(0x8a6a4a)]; horses.forEach((h, i) => { h.position.set(-11 - i * 1.8, 0, 3 + i * 0.8); h.rotation.y = 1.3; root.add(h); });
  const citizens = [V(4.2, 0, 4.6), V(-5.5, 0, -3.5), V(10.5, 0, 2.2)].map((p, i) => { const c = makePerson({ color: [0x9a5ab8, 0x5b7fa6, 0xe2a93b][i], robe: i === 1 }); c.position.copy(p); c.rotation.y = Math.atan2(-p.x, -p.z); root.add(c); return c; });
  // the north gate, and the mountains beyond it
  const gate = new THREE.Group();
  for (const s of [-1, 1]) { const col = mesh(new THREE.BoxGeometry(0.8, 4.4, 0.8), marble); col.position.set(s * 1.8, 2.2, 0); gate.add(col); }
  const lintel = mesh(new THREE.BoxGeometry(4.4, 0.7, 0.9), marble); lintel.position.y = 4.6; gate.add(lintel);
  for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(5, 2.4, 0.6), marble); w.position.set(s * 4.7, 1.2, 0); gate.add(w); }
  gate.position.set(0, 0, GATE_Z); root.add(gate);
  // the land runs on, north, all the way to the mountains, and the road with it
  const north = mesh(new THREE.BoxGeometry(70, 0.6, 120), clay(0x9cc86a)); north.position.set(0, -0.3, -80); root.add(north);
  const northRoad = mesh(new THREE.BoxGeometry(2.6, 0.08, 110), clay(0xe6dcc8)); northRoad.position.set(0, 0.03, -76); root.add(northRoad);
  for (let i = 0; i < 30; i++) { const tr = mesh(new THREE.ConeGeometry(0.9, 2.6, 7), clay(0x5d8a45, { flatShading: true })); const side = i % 2 ? 1 : -1; tr.position.set(side * (4 + rnd() * 26), 1.3, -26 - rnd() * 90); root.add(tr); }
  for (const [x, z, h] of [[-50, -130, 30], [0, -150, 42], [52, -135, 34], [-95, -140, 26], [96, -155, 30]]) {
    const m = mesh(new THREE.ConeGeometry(h * 0.8, h, 7), clay(0x8a8fa8, { flatShading: true })); m.position.set(x, h / 2 - 3, z); root.add(m);
    const snow = mesh(new THREE.ConeGeometry(h * 0.27, h * 0.34, 7), clay(0xfbfbf8, { flatShading: true })); snow.position.set(x, h - 3 - h * 0.17 + 0.02, z); root.add(snow);
  }

  // ---- the cellar: a dirt floor, a tiny cobwebbed window, a bucket and two mops, and the child in the corner
  const cellar = new THREE.Group(); cellar.position.copy(CELLAR); root.add(cellar);
  const dirt = mesh(new THREE.BoxGeometry(5, 0.2, 4), clay(0x5a4a3c)); dirt.position.y = -0.1; cellar.add(dirt);
  const stone = clay(0x6a655e);
  const cback = mesh(new THREE.BoxGeometry(5.4, 3.2, 0.3), stone); cback.position.set(0, 1.6, -2.15); cellar.add(cback);
  for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.3, 3.2, 4.3), stone); w.position.set(s * 2.65, 1.6, 0); cellar.add(w); }
  const cceil = mesh(new THREE.BoxGeometry(5.4, 0.2, 4.3), stone); cceil.position.y = 3.2; cellar.add(cceil);
  const cwin = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshBasicMaterial({ color: 0xa8a090 })); cwin.position.set(-1.2, 2.6, -1.99); cellar.add(cwin);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 3, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })); shaft.position.set(-1, 1.4, -1.4); shaft.rotation.x = 0.5; cellar.add(shaft);
  const dim = new THREE.PointLight(0xd8c8a8, 5, 6, 1.6); dim.position.set(0, 2.6, 1); cellar.add(dim);
  const bucket = mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 12), clay(0x7a7066)); bucket.position.set(2, 0.2, -1.6); cellar.add(bucket);
  for (const x of [1.6, 1.8]) { const mop = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), clay(0x8a7a5a)); mop.position.set(x, 0.9, -1.85); mop.rotation.z = 0.15; cellar.add(mop); const head = mesh(new THREE.SphereGeometry(0.16, 8, 6), clay(0x9a9080)); head.position.set(x - 0.13, 0.12, -1.85); cellar.add(head); }
  const steps = mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), clay(0x7a7066)); steps.position.set(1.8, 0.3, 1.4); cellar.add(steps);
  const child = makePerson({ color: 0x9a9488, scale: 0.55 }); child.userData.body.position.y = -0.42 * 0.55; child.position.set(-1.9, 0, -1.4); child.rotation.y = 2.4; cellar.add(child);

  // ---- the frog: after you've been down there, it sits by the cellar door looking down the steps, then hops away
  const frog = makeFrog({ scale: 0.8 }); root.add(frog);
  const cameo = frogCameo(frog, [[12, -2], [10.5, -2.6], [9.2, -3.2], [8.2, -3.8], { face: [HATCH.x, HATCH.z - 1] }, { wait: 3.4, act: (f, u) => (f.userData.body.rotation.x = 0.25 * Math.sin(Math.PI * clamp(u * 1.4))) },
    { face: [3, 2] }, [6.6, -2.8], [5, -1.6], [3.4, -0.4], [1.8, 0.6], [0.4, 1.6]]);

  // ---- state
  const S = { phase: 'festival', seen: false, idle: 0, drain: -1, carry: false, dance: 0, spin: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/omelas.json', 'The Ones Who Walk Away from Omelas');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.x = 40; root.add(gp); level.ground.push(gp);

  const toCellar = async () => {
    S.phase = 'down'; S.hatch = 1; player.enabled = false;
    await ctx.flash(true);
    player.place(CELLAR.x + 1.2, CELLAR.z + 0.3, -2.4); S.phase = 'cellar'; S.inCellar = true; S.idle = 0;
    await ctx.flash(false); player.enabled = true;
    await voice.say('cellar', { urgent: true }); await ctx.wait(0.8);
    ctx.speak(child, 'Please let me out. I will be good.', { offset: [0, 1.6, 0] });
    await ctx.wait(2.6); await voice.say('terms'); await ctx.wait(0.6); await voice.say('terms_2'); await ctx.wait(1.2); await voice.say('ask');
    S.seen = true; S.idle = 0;
  };
  const upAgain = async (carrying) => {
    S.phase = 'up'; player.enabled = false;
    await ctx.flash(true);
    S.inCellar = false; player.place(HATCH.x, HATCH.z + 1.2, 0);
    if (carrying) { S.carry = true; cellar.remove(child); root.add(child); child.userData.body.position.y = 0; }
    S.hatch = 0; S.phase = carrying ? 'freed' : 'after'; S.idle = 0;
    await ctx.flash(false); player.enabled = !carrying;
    if (!carrying) { cameo.start(); await voice.say('back_up', { urgent: true }); }
  };

  interact.add({ pos: HATCH.clone().add(V(0, 0, 0.9)), radius: 1.5, height: 1.4, prompt: () => (S.seen ? 'Go back down' : 'Open the cellar door'), enabled: () => S.phase === 'festival' || (S.phase === 'after' && !S.backDown),
    onUse: () => { if (S.seen) S.backDown = true; toCellar(); } });
  interact.add({ pos: V(CELLAR.x + 1.8, 0, CELLAR.z + 0.6), radius: 1.2, height: 1.8, prompt: 'Go back up the steps', enabled: () => S.phase === 'cellar' && S.seen, onUse: () => upAgain(false) });
  interact.add({ pos: V(CELLAR.x - 1.3, 0, CELLAR.z - 0.8), radius: 1.1, height: 1.4, prompt: 'Take the child up into the sun', terminal: true, enabled: () => S.phase === 'cellar' && S.seen,
    onUse: async () => {
      await upAgain(true);
      S.drain = 0; await ctx.wait(0.6);
      await voice.say('free_1', { urgent: true }); await ctx.wait(1.5); await voice.say('free_2'); await ctx.wait(1.2); await voice.say('free_3'); await ctx.wait(1.6);
      save.complete('omelas');
      ctx.gameOver({ title: 'You brought the child out', text: 'One child sat in the sun. Everything else Omelas had, it lost: those were the terms. Some would call that the only decent thing to do; others, a terrible trade.' });
    } });
  async function stay(danced) {
    if (S.phase !== 'after') return;
    S.phase = 'over'; player.enabled = false; S.joined = danced;
    await voice.say(danced ? 'dance_1' : 'stay_idle', { urgent: true }); await ctx.wait(1); await voice.say('stay_2'); await ctx.wait(1.4);
    save.complete('omelas');
    ctx.gameOver({ title: 'You stayed in Omelas', text: 'The music went on. You knew about the child, and you stayed, as most people do. Is their happiness still real, knowing what it rests on?' });
  }
  interact.add({ pos: V(2.8, 0, 1.4), radius: 1.6, height: 2.2, prompt: 'Join the dancing', terminal: true, enabled: () => S.phase === 'after', onUse: () => stay(true) });
  // walking out of the north gate
  interact.trigger({ test: (p) => p.z < GATE_Z - 1.5 && Math.abs(p.x) < 2, when: () => S.phase === 'after', onEnter: async () => {
    S.phase = 'over'; S.walking = true; player.locked = true; player.target = V(0, 0, -22);
    await voice.say('walk_1', { urgent: true }); await ctx.wait(1.2); await voice.say('walk_2'); await ctx.wait(1.6);
    save.complete('omelas');
    ctx.gameOver({ title: 'You walked away', text: 'You left Omelas, alone, towards the mountains. It did nothing for the child. But you would not live on those terms.' });
  } });
  interact.trigger({ test: (p) => p.z < GATE_Z + 1.4 && Math.abs(p.x) < 2.2, when: () => S.phase === 'festival', once: false, onEnter: () => voice.say('not_yet', { urgent: true, once: false, when: () => !voice.busy }) });

  // asides: the people of Omelas, the flute boy, the horses; the bell
  const CHAT = [
    ['Have you seen the horses? The race starts at noon.', 'Isn\'t it a wonderful day?', "No king here. We never needed one."],
    ['Try the cakes by the fountain.', 'We are not simple, you know. We are happy.', 'Everyone comes to the festival.'],
    ['My daughter is dancing. There, in the yellow!', 'The boy with the flute plays better every year.', 'Have you been to see? Everyone goes, once.'],
  ];
  citizens.forEach((c, k) => talk(ctx, { who: c, enabled: () => S.phase === 'festival' || S.phase === 'after',
    lines: (i) => (S.seen ? ['…', 'You went down, then.', 'It is a terrible thing. It is also the way things are.'][i % 3] : CHAT[k][i % 3]) }));
  look(ctx, { pos: V(-0.4, 0, 3.4), radius: 1.4, height: 1.8, prompt: 'Listen to the flute', lines: ['flute'], enabled: () => S.phase === 'festival' || S.phase === 'after' });
  look(ctx, { pos: V(-10.2, 0, 4.8), radius: 1.8, height: 2.6, prompt: 'Look at the horses', lines: ['horses'], enabled: () => S.phase === 'festival' || S.phase === 'after' });
  interact.trigger({ pos: HATCH, radius: 3.4, when: () => S.phase === 'festival', onEnter: () => voice.say('knows') });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6); await voice.say('happy');
    await ctx.wait(20); voice.say('knows', { when: () => S.phase === 'festival' });
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 6.5, rotY: Math.PI },
    walkable: (x, z) => {
      if (S.inCellar) return Math.abs(x - CELLAR.x) < 2.2 && Math.abs(z - CELLAR.z) < 1.7;
      if (z < GATE_Z + 0.6) return Math.abs(x) < 1.1 && z > -23;            // only through the gate, and along the road
      return Math.hypot(x, z) < 20.5;
    },
    blockers: () => [
      { x: 0, z: 0, r: 2.1 }, { x: HALL.x, z: HALL.z, w: 6.2, d: 4.6 }, { x: -8, z: -9, w: 2, d: 2 }, { x: flute.position.x, z: flute.position.z, r: 0.35 },
      ...horses.map((h) => ({ x: h.position.x, z: h.position.z, w: 0.9, d: 2.4, rot: 1.3 })), ...citizens.map((c) => ({ x: c.position.x, z: c.position.z, r: 0.45 })),
      ...houses.map((h) => ({ x: h.position.x, z: h.position.z, r: 2.6 })), { x: -4.7, z: GATE_Z, w: 5.2, d: 0.8 }, { x: 4.7, z: GATE_Z, w: 5.2, d: 0.8 },
      { x: CELLAR.x + 1.8, z: CELLAR.z + 1.4, w: 1.3, d: 1.3 }, { x: CELLAR.x - 1.9, z: CELLAR.z - 1.4, r: 0.4 }, { x: CELLAR.x + 1.9, z: CELLAR.z - 1.7, r: 0.5 },
    ],
    update(dt, t) {
      // the festival goes on (until it doesn't)
      const joy = S.drain >= 0 ? 1 - easeInOut(clamp(S.drain / 5)) : 1;
      if (S.drain >= 0) { S.drain += dt; canvas.style.filter = `grayscale(${(0.85 * (1 - joy)).toFixed(3)}) brightness(${(1 - 0.15 * (1 - joy)).toFixed(3)})`; }
      S.spin += dt * 0.5 * joy;
      dancers.forEach((d, i) => {
        const a = S.spin + (i / 8) * Math.PI * 2, r = 3.6 + Math.sin(t * 2 + i) * 0.2 * joy;
        d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        d.rotation.y = joy > 0.2 ? -a : lerp(d.rotation.y, Math.atan2(player.pos.x - d.position.x, player.pos.z - d.position.z), 0.05);
        animatePerson(d, t * 1.6, { phase: i, energy: 0.2 + 1.2 * joy });
      });
      animatePerson(flute, t, { energy: 0.5 * joy }); pipe.visible = joy > 0.3;
      citizens.forEach((c, i) => animatePerson(c, t, { phase: i, energy: 0.4 * joy + 0.1 }));
      horses.forEach((h, i) => { h.rotation.z = Math.sin(t * 0.8 + i) * 0.01; });
      pennants.forEach((p, i) => { p.rotation.z = Math.sin(t * 2 + i) * 0.25 * joy; p.position.y += (-0.002) * (1 - joy); });
      jet.scale.setScalar(Math.max(0.01, joy)); jet.rotation.y = t;
      bell.rotation.z = joy * Math.sin(t * 3) * 0.25 * ((t % 12) < 4 ? 1 : 0);
      hatchPivot.rotation.x = lerp(hatchPivot.rotation.x, S.hatch ? -1.6 : 0, 1 - Math.exp(-dt * 4));
      // carried up into the sun, the child sits beside you
      if (S.carry) { child.position.copy(player.pos).add(V(0.7, 0, 0.5)); child.rotation.y = 0.3; }
      // after you've seen it, doing nothing is staying
      if ((S.phase === 'after' || S.phase === 'cellar') && S.seen) {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.phase === 'cellar' && S.idle > 40) { S.idle = 0; upAgain(false); }
        if (S.phase === 'after' && S.idle > IDLE_LIMIT) stay(false);
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.inCellar) return { pos: V(CELLAR.x + 0.3, 2.5, CELLAR.z + 7), look: V(CELLAR.x - 0.4, 1, CELLAR.z - 0.8), stiffness: 3 };
      if (S.walking) return { pos: pl.pos.clone().add(V(0, 3.2, 8.5)), look: pl.pos.clone().add(V(0, 1.2, -30)), stiffness: 1.2 };   // towards the mountains
      const look = V(clamp(pl.pos.x, -9, 9), 1.6, clamp(pl.pos.z, -18, 6) - 3);
      return { pos: look.clone().add(V(0, 8.5, 15.5)), look: look.clone().add(V(0, 1.2, 0)), stiffness: 2 };
    },
    dispose() { voice.stop(); canvas.style.filter = ''; player.locked = false; },
  });
}
