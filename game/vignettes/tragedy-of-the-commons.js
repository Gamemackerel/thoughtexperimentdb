// Vignette: The Tragedy of the Commons.
// A shared pasture, five households, two sheep each, thick grass. Add a sheep and it's all gain for you; your
// neighbours copy you; the grass thins. Keep going and it's gone for everyone. Or ring the bell, meet, agree on limits.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeHouse, makePerson, animatePerson, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo, frogExtras, frogTongue } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = 10.5;                                    // pasture radius
const HOMES = [Math.PI / 2, Math.PI / 2 + 1.25, Math.PI / 2 + 2.5, Math.PI / 2 - 2.5, Math.PI / 2 - 1.25];   // 0 is yours (south)
const COLORS = [palette.agent, palette.many, palette.one, palette.judge, palette.trolley];
const PEN = V(3.4, 0, 13.4);
const BELL = V(-3.6, 0, 13.2);

function makeSheep() {
  const g = new THREE.Group(), body = new THREE.Group();
  const wool = clay(0xf7f3ea), dark = clay(palette.ink);
  for (const [x, y, s] of [[-0.25, 0.62, 0.36], [0.15, 0.66, 0.4], [0.05, 0.8, 0.3], [-0.1, 0.55, 0.32]]) { const b = mesh(new THREE.SphereGeometry(s, 14, 10), wool); b.position.set(0, y, x); body.add(b); }
  const head = mesh(new THREE.SphereGeometry(0.17, 12, 10), dark); head.scale.set(0.9, 1, 1.3); head.position.set(0, 0.72, 0.55); body.add(head);
  for (const [x, z] of [[-0.18, -0.25], [0.18, -0.25], [-0.18, 0.25], [0.18, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), dark); l.position.set(x, 0.22, z); body.add(l); }
  g.add(body); g.userData.body = body;
  return g;
}

export default function commons(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 180);
  voice.load('tragedy-of-the-commons');
  const frame = makeFramer(stage);

  root.add(makeIsland({ radius: 22, seed: 21, decor: false }));
  const pastureMat = clay(0x8fb36a);
  const pasture = mesh(new THREE.CylinderGeometry(R, R, 0.06, 64), pastureMat); pasture.position.y = 0.03; pasture.castShadow = false; root.add(pasture);
  const rnd = seeded(9);
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.4, 5), clay(0x6f9a4f), 700);
  const tuftPos = [];
  for (let i = 0; i < 700; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * (R - 0.4); tuftPos.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.7 + rnd() * 0.6]); }
  root.add(tufts);
  // fence around the common
  const fmat = clay(0x8a6b52);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const p = mesh(new THREE.BoxGeometry(0.14, 1, 0.14), fmat); p.position.set(Math.cos(a) * (R + 0.3), 0.5, Math.sin(a) * (R + 0.3)); root.add(p); }
  const rail = mesh(new THREE.TorusGeometry(R + 0.3, 0.04, 6, 80), fmat); rail.rotation.x = Math.PI / 2; rail.position.y = 0.8; root.add(rail);
  // five households; the others each have a herder
  const herders = HOMES.map((a, i) => {
    const hx = Math.cos(a) * (R + 5.5), hz = Math.sin(a) * (R + 5.5);
    const h = makeHouse({ color: 0xf2e6d4, roof: [0xc9705a, 0x5b7fa6, 0xc9a54c, 0x7a5a8c, 0xb5654e][i] }); h.position.set(hx * (i ? 1 : 0.0) + (i ? 0 : -7), 0, hz + (i ? 0 : 1.5)); h.rotation.y = -a + Math.PI / 2 + Math.PI; root.add(h);
    if (i === 0) return null;
    const p = makePerson({ color: COLORS[i] }); const home = V(Math.cos(a) * (R + 2), 0, Math.sin(a) * (R + 2)); p.position.copy(home); root.add(p);
    return { p, home, a };
  });
  // your pen and the village bell
  const pen = new THREE.Group();
  for (let i = 0; i < 8; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), fmat); p.position.set(-1.2 + (i % 4) * 0.8, 0.45, i < 4 ? -1 : 1); pen.add(p); }
  pen.position.copy(PEN); root.add(pen);
  const bell = new THREE.Group(); const bpost = mesh(new THREE.BoxGeometry(0.18, 3, 0.18), fmat); bpost.position.y = 1.5; bell.add(bpost);
  const beam = mesh(new THREE.BoxGeometry(1.2, 0.14, 0.14), fmat); beam.position.set(0.45, 2.9, 0); bell.add(beam);
  const bellBody = new THREE.Group(); const cup = mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.45, 16), clay(0xc9a54c, { metalness: 0.5, roughness: 0.35 })); cup.position.y = -0.25; bellBody.add(cup);
  bellBody.position.set(0.8, 2.85, 0); bell.add(bellBody);
  bell.position.copy(BELL); root.add(bell);

  // the sheep (owner index), wandering the common
  const sheep = [];
  const addSheep = (owner, from) => {
    const s = makeSheep(); s.position.copy(from ?? V((rnd() - 0.5) * 12, 0, (rnd() - 0.5) * 12)); root.add(s);
    sheep.push({ s, owner, seed: rnd() * 100, target: V(), t: 0, leaving: false });
  };
  for (let o = 0; o < 5; o++) { addSheep(o); addSheep(o); }

  // the frog hops along outside the fence, stops, and catches a fly (the only one here not grazing the common)
  const frog = frogExtras(makeFrog()); root.add(frog);
  const FLY = V(-5.6, 0.55, 12.6);
  const fly = mesh(new THREE.SphereGeometry(0.07, 8, 6), clay(palette.ink)); fly.visible = false; root.add(fly);
  const cameo = frogCameo(frog, [[-10.5, 17], [-8.8, 16], [-7.2, 15], [-5.9, 14.1], { set: () => (fly.visible = true) }, { face: [FLY.x, FLY.z] }, { wait: 1.4 },
    { wait: 0.3, act: (f, u) => { frogTongue(f, u, 1.35); if (u > 0.5) fly.visible = false; } }, { set: (f) => frogTongue(f, 0) },
    { wait: 1, act: (f, u) => (f.userData.body.scale.y = 1 + 0.08 * Math.sin(u * Math.PI * 3)) }, { face: [-3.5, 15.6] },
    [-4.2, 15.2], [-2.4, 16.1], [-0.6, 16.9], [1.2, 17.8], [3, 18.8]]);

  const S = { phase: 'graze', grass: 1, mine: 2, adds: 0, meetT: -1 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/tragedy-of-the-commons.json', 'The Tragedy of the Commons');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: PEN, radius: 2.4, height: 2, prompt: 'Add a sheep', enabled: () => S.phase === 'graze',
    onUse: async () => {
      addSheep(0, PEN.clone().add(V(0, 0, -1))); S.mine++; S.adds++;
      if (S.adds === 1) await voice.say('add_1');
      await ctx.wait(2.5);
      if (S.phase !== 'graze') return;
      for (let o = 1; o < 5; o++) { const h = herders[o]; addSheep(o, h.home.clone().multiplyScalar(0.92)); }   // the neighbours copy you
      if (S.adds === 1) voice.say('follow');
    } });
  interact.add({ pos: BELL, radius: 2.2, height: 3.4, prompt: 'Ring the bell', enabled: () => S.phase === 'graze',
    onUse: async () => {
      S.phase = 'meeting'; S.meetT = 0; S.ring = 0;
      await voice.say('bell'); await ctx.wait(2.5); await voice.say('agree');
      S.phase = 'recover'; S.recoverFrom = S.grass; S.recT = 0;
      await ctx.wait(4); save.complete('tragedy-of-the-commons');
      ctx.gameOver({ title: 'You agreed on limits', text: 'Nobody owned the pasture, and nobody had to. You talked, set rules, and kept to them. The grass came back.' });
    } });

  // asides: the neighbours (they get less chatty as the grass goes), and one of your sheep
  const CHAT = [
    ['Fine grass this year.', "Mine are the fat ones. Don't tell the others.", 'Morning!'],
    ["Grass isn't what it was.", 'Well, you added one. Why shouldn\'t I?', "If I don't, someone else will."],
    ['Somebody ought to do something.', 'Not my fault. I only did what everyone did.', "They're getting so thin, poor things."],
  ];
  herders.forEach((h, k) => h && talk(ctx, { who: h.p, radius: 2.2, enabled: () => S.phase === 'graze',
    lines: (i) => { const set = CHAT[S.grass > 0.8 ? 0 : S.grass > 0.4 ? 1 : 2]; return set[(k + i) % set.length]; } }));
  const mySheep = () => sheep.find((sh) => sh.owner === 0 && !sh.leaving)?.s;
  look(ctx, { pos: () => (mySheep()?.position ?? V(0, 0, 99)), radius: 1.8, height: 1.4, prompt: 'Look at your sheep', lines: ['sheep'], enabled: () => S.phase === 'graze' && !!mySheep() });

  (async () => { await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6); await voice.say('herders'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 15.5, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 20.5,
    blockers: () => [...herders.filter(Boolean).map((h) => ({ x: h.p.position.x, z: h.p.position.z, r: 0.5 })), { x: BELL.x, z: BELL.z, r: 0.4 }],
    update(dt, t) {
      const n = sheep.filter((s) => !s.leaving).length;
      // grass: grows back at a steady rate, is eaten in proportion to the number of sheep
      if (S.phase === 'graze') {
        S.grass = clamp(S.grass + dt * (0.02 * (S.grass > 0.02 ? 1 : 0.2) - 0.002 * n));
        if (S.grass < 0.65 && !voice.said.has('thin')) { voice.say('thin'); voice.say('ask'); }
        if (S.grass <= 0.01) {
          S.phase = 'over';
          (async () => { await voice.say('collapse'); await ctx.wait(1.2); save.complete('tragedy-of-the-commons');
            ctx.gameOver({ title: 'The grass is gone', text: 'Every sheep made sense to the one who added it. Together, they ate the pasture bare, for everyone.' }); })();
        }
      }
      if (S.phase === 'recover') { S.recT += dt; S.grass = lerp(S.recoverFrom, 1, easeInOut(clamp(S.recT / 4))); }
      pastureMat.color.set(0x8fb36a).lerp(new THREE.Color(0xb79a6a), 1 - S.grass);
      const m = new THREE.Matrix4();
      tuftPos.forEach(([x, z, h], i) => { m.makeScale(1, Math.max(0.02, S.grass * h), 1).setPosition(x, 0.1 * S.grass, z); tufts.setMatrixAt(i, m); });
      tufts.instanceMatrix.needsUpdate = true;

      // sheep wander (thin and lying down when the grass is gone); at the meeting, the extras go home
      sheep.forEach((sh, i) => {
        sh.t -= dt;
        if (sh.t <= 0) { const r2 = seeded(Math.floor(t * 3) + i * 13); const a = r2() * 6.28, rr = Math.sqrt(r2()) * (R - 1); sh.target.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); sh.t = 3 + r2() * 4; }
        if ((S.phase === 'meeting' || S.phase === 'recover') && sh.owner !== undefined && sheep.filter((o) => o.owner === sh.owner).indexOf(sh) >= 1) sh.leaving = true;
        const goal = sh.leaving ? (sh.owner === 0 ? PEN : herders[sh.owner].home) : sh.target;
        const d = goal.clone().sub(sh.s.position).setY(0);
        const starving = S.grass < 0.05 && S.phase !== 'recover';
        if (!starving && d.length() > 0.3) { sh.s.position.addScaledVector(d.normalize(), dt * (sh.leaving ? 1.8 : 0.6)); sh.s.rotation.y = Math.atan2(d.x, d.z); }
        sh.s.visible = !(sh.leaving && sh.s.position.distanceTo(goal) < 0.6);
        const b = sh.s.userData.body;
        b.rotation.z = starving ? lerp(b.rotation.z, Math.PI / 2, 0.05) : Math.sin(t * 5 + sh.seed) * 0.03;
        b.position.y = starving ? 0.25 : Math.abs(Math.sin(t * 6 + sh.seed)) * 0.03;
        b.scale.setScalar(lerp(0.75, 1, S.grass));
      });
      // herders: at home, watching; at the meeting, gather in the middle
      herders.forEach((h, i) => {
        if (!h) return;
        const meet = S.phase === 'meeting' || S.phase === 'recover';
        const goal = meet ? V(Math.cos(h.a) * 2.2, 0, Math.sin(h.a) * 2.2) : h.home;
        const d = goal.clone().sub(h.p.position).setY(0);
        if (d.length() > 0.2) { h.p.position.addScaledVector(d.normalize(), dt * 3); h.p.rotation.y = Math.atan2(d.x, d.z); }
        else h.p.rotation.y = Math.atan2(-h.p.position.x, -h.p.position.z);
        animatePerson(h.p, t, { phase: i, energy: d.length() > 0.2 ? 1 : 0.4 });
      });
      if (S.meetT >= 0) { S.meetT += dt; bellBody.rotation.z = Math.sin(S.meetT * 12) * 0.5 * Math.exp(-S.meetT * 0.8); }
      if (S.adds >= 1) cameo.start();
      cameo.update(dt);
      if (fly.visible) fly.position.copy(FLY).add(V(Math.sin(t * 9) * 0.25, Math.sin(t * 13) * 0.12, Math.cos(t * 7) * 0.2));
    },
    camera(pl) { return { ...frame([pl.pos.clone(), V(-R, 0, 0), V(R, 0, 0), V(0, 0, -R), V(0, 1, R), PEN.clone(), BELL.clone()], { min: 16, max: 50 }), stiffness: 2 }; },
    dispose() { voice.stop(); },
  });
}
