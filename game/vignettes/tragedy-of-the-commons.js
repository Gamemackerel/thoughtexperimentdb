// Vignette: The Tragedy of the Commons.
// A shared pasture with no rules yet: four neighbours and you, two sheep each, and grass that grows back as fast as it's
// eaten. Before long a neighbour adds a sheep (it's their right), then another, whether or not you do. Adding one of
// your own is all profit to you (the wool piles up by your gate) and the neighbours copy you. Take yours back and they
// don't follow. Ring the bell once the grass is thinning, go first with one of your own, and agree on limits; or watch
// the grass go.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeHouse, makePerson, animatePerson, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo, frogExtras, frogTongue } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = 10.5;                                    // pasture radius
const PEN = V(3.4, 0, 13.4);
const BELL = V(-3.6, 0, 13.2);
const HOMES = [Math.atan2(PEN.z, PEN.x), Math.PI / 2 + 1.25, Math.PI / 2 + 2.5, Math.PI / 2 - 2.5, Math.PI / 2 - 1.25];   // 0 is yours (south, towards the pen)
const COLORS = [palette.agent, palette.many, palette.one, palette.judge, palette.trolley];
const ROOFS = [0x3f8f86, 0x5b7fa6, 0xc9a54c, 0x7a5a8c, 0xb5654e];   // yours is teal; each household marks its sheep in its roof colour
const GATE = 0.1;                                  // half-width of a gate in the fence (radians)
const FIRST_NEIGHBOUR = 22, NEIGHBOUR_EVERY = 5, NEIGHBOUR_CAP = 5, ADD_COOLDOWN = 1.6, MY_CAP = 8;
const WOOL = V(5.4, 0, 13.8);

function makeSheep(mark) {
  const g = new THREE.Group(), body = new THREE.Group();
  const wool = clay(0xf7f3ea), dark = clay(palette.ink);
  for (const [x, y, s] of [[-0.25, 0.62, 0.36], [0.15, 0.66, 0.4], [0.05, 0.8, 0.3], [-0.1, 0.55, 0.32]]) { const b = mesh(new THREE.SphereGeometry(s, 14, 10), wool); b.position.set(0, y, x); body.add(b); }
  const head = mesh(new THREE.SphereGeometry(0.17, 12, 10), dark); head.scale.set(0.9, 1, 1.3); head.position.set(0, 0.72, 0.55); body.add(head);
  for (const [x, z] of [[-0.18, -0.25], [0.18, -0.25], [-0.18, 0.25], [0.18, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), dark); l.position.set(x, 0.22, z); body.add(l); }
  const dot = mesh(new THREE.SphereGeometry(0.16, 10, 6), clay(mark)); dot.scale.set(1, 0.35, 1); dot.position.set(0, 1.08, -0.05); body.add(dot);   // the raddle mark
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
  // the fence round the common, with a gate for each household
  const fmat = clay(0x8a6b52);
  const angDist = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const atGate = (a) => HOMES.some((h) => angDist(a, h) < GATE);
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; if (HOMES.some((h) => angDist(a, h) < GATE + 0.05)) continue; const p = mesh(new THREE.BoxGeometry(0.14, 1, 0.14), fmat); p.position.set(Math.cos(a) * (R + 0.3), 0.5, Math.sin(a) * (R + 0.3)); root.add(p); }
  const sorted = [...HOMES].sort((a, b) => ((a % 6.2832) + 6.2832) % 6.2832 - (((b % 6.2832) + 6.2832) % 6.2832)).map((a) => ((a % 6.2832) + 6.2832) % 6.2832);
  sorted.forEach((a, i) => {
    const from = a + GATE, to = (i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + Math.PI * 2) - GATE;
    const rail = mesh(new THREE.TorusGeometry(R + 0.3, 0.04, 6, 40, to - from), fmat); rail.rotation.set(Math.PI / 2, 0, from); rail.position.y = 0.8; root.add(rail);
    for (const g of [a - GATE, a + GATE]) { const p = mesh(new THREE.BoxGeometry(0.18, 1.2, 0.18), fmat); p.position.set(Math.cos(g) * (R + 0.3), 0.6, Math.sin(g) * (R + 0.3)); root.add(p); }
  });
  const gatePt = (o, r) => V(Math.cos(HOMES[o]) * r, 0, Math.sin(HOMES[o]) * r);
  // five households; the others each have a herder
  const herders = HOMES.map((a, i) => {
    const hx = Math.cos(a) * (R + 5.5), hz = Math.sin(a) * (R + 5.5);
    const h = makeHouse({ color: 0xf2e6d4, roof: ROOFS[i] }); h.position.set(i ? hx : -7.6, 0, i ? hz : 16); h.rotation.y = i ? -a + Math.PI / 2 + Math.PI : Math.PI; root.add(h);
    if (i === 0) return null;
    const p = makePerson({ color: COLORS[i] }); const home = V(Math.cos(a) * (R + 2), 0, Math.sin(a) * (R + 2)); p.position.copy(home); root.add(p);
    return { p, home, a, house: h.position.clone() };
  });
  // your pen, your wool, and the village bell
  const pen = new THREE.Group();
  for (let i = 0; i < 8; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), fmat); p.position.set(-1.2 + (i % 4) * 0.8, 0.45, i < 4 ? -1 : 1); pen.add(p); }
  pen.position.copy(PEN); root.add(pen);
  const woolBalls = [...Array(18)].map((_, i) => {
    const b = mesh(new THREE.SphereGeometry(0.26, 12, 8), clay(0xf7f3ea)); const ring = i < 8 ? 0 : i < 14 ? 1 : 2, k = i - [0, 8, 14][ring], n = [8, 6, 4][ring];
    b.position.copy(WOOL).add(V(Math.cos((k / n) * 6.28) * (0.55 - ring * 0.18), 0.22 + ring * 0.3, Math.sin((k / n) * 6.28) * (0.55 - ring * 0.18))); b.visible = false; root.add(b); return b;
  });
  const bell = new THREE.Group(); const bpost = mesh(new THREE.BoxGeometry(0.18, 3, 0.18), fmat); bpost.position.y = 1.5; bell.add(bpost);
  const beam = mesh(new THREE.BoxGeometry(1.2, 0.14, 0.14), fmat); beam.position.set(0.45, 2.9, 0); bell.add(beam);
  const bellBody = new THREE.Group(); const cup = mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.45, 16), clay(0xc9a54c, { metalness: 0.5, roughness: 0.35 })); cup.position.y = -0.25; bellBody.add(cup);
  bellBody.position.set(0.8, 2.85, 0); bell.add(bellBody);
  bell.position.copy(BELL); root.add(bell);

  // the sheep (owner index): they come in through their household's gate, wander the common, and go home the same way
  const sheep = [];
  const addSheep = (owner, fromOutside) => {
    const s = makeSheep(ROOFS[owner]); root.add(s);
    const sh = { s, owner, seed: rnd() * 100, rng: seeded(1000 + sheep.length * 7919 + owner * 31), target: V(), t: 0, leaving: false, route: [], fade: 1 };
    if (fromOutside) { s.position.copy(owner ? herders[owner].home : PEN.clone().add(V(-0.6, 0, -0.4))); sh.route = [gatePt(owner, R + 1), gatePt(owner, R - 1.2)]; }
    else s.position.set((rnd() - 0.5) * 12, 0, (rnd() - 0.5) * 12);
    sheep.push(sh); return sh;
  };
  const sendHome = (sh) => { sh.leaving = true; sh.route = [gatePt(sh.owner, R - 1), gatePt(sh.owner, R + 1), sh.owner ? herders[sh.owner].home.clone() : PEN.clone()]; };
  for (let o = 0; o < 5; o++) { addSheep(o); addSheep(o); }
  const count = (o) => sheep.filter((s) => s.owner === o && !s.leaving).length;

  // the frog hops along outside the fence, stops, and catches a fly (the only one here not grazing the common)
  const frog = frogExtras(makeFrog()); root.add(frog);
  const FLY = V(-5.6, 0.55, 12.6);
  const fly = mesh(new THREE.SphereGeometry(0.07, 8, 6), clay(palette.ink)); fly.visible = false; root.add(fly);
  const cameo = frogCameo(frog, [[-11, 14.5], [-9.4, 13.6], [-7.8, 13.2], [-6.4, 12.9], { set: () => (fly.visible = true) }, { face: [FLY.x, FLY.z] }, { wait: 1.4 },
    { wait: 0.3, act: (f, u) => { frogTongue(f, u, 1.1); if (u > 0.5) fly.visible = false; } }, { set: (f) => frogTongue(f, 0) },
    { wait: 1, act: (f, u) => (f.userData.body.scale.y = 1 + 0.08 * Math.sin(u * Math.PI * 3)) }, { face: [-3.5, 15.6] },
    [-5, 14], [-3.2, 14.8], [-1.4, 15.3], [0.6, 16], [2.4, 17.2]]);

  const S = { phase: 'graze', grass: 1, adds: 0, tookBack: 0, lastAdd: -9, clock: 0, nextNeighbour: FIRST_NEIGHBOUR, neighbourTurn: 1, escalated: false, wool: 0, meetT: -1 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/tragedy-of-the-commons.json', 'The Tragedy of the Commons');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  // the moment things start to slide: whoever starts it, the question follows
  const escalate = () => { if (S.escalated) return; S.escalated = true; (async () => { await ctx.wait(1.5); voice.say('ask', { when: () => S.phase === 'graze' }); })(); };
  const neighbourAdds = (o) => { if (count(o) >= NEIGHBOUR_CAP + 1) return false; addSheep(o, true); return true; };

  interact.add({ pos: PEN.clone().add(V(-0.9, 0, 1.4)), radius: 1.5, height: 2, prompt: () => (S.clock - S.lastAdd < ADD_COOLDOWN ? '…' : 'Add a sheep'),
    enabled: () => S.phase === 'graze' && count(0) < MY_CAP,
    onUse: async () => {
      if (S.clock - S.lastAdd < ADD_COOLDOWN) return;
      S.lastAdd = S.clock; addSheep(0, true); const first = ++S.adds === 1;
      if (first) voice.say('add_1', { urgent: true });
      await ctx.wait(2.5);
      if (S.phase !== 'graze') return;
      // two of the neighbours copy you
      const who = [1, 2, 3, 4].sort(() => rnd() - 0.5).slice(0, 2); who.forEach(neighbourAdds);
      if (first) { voice.say('follow', { maxAge: 6 }); escalate(); }
    } });
  interact.add({ pos: PEN.clone().add(V(1.2, 0, 1.4)), radius: 1.3, height: 2, prompt: 'Take a sheep back',
    enabled: () => S.phase === 'graze' && count(0) > 1,
    onUse: () => {
      const mine = sheep.filter((s) => s.owner === 0 && !s.leaving);
      sendHome(mine.sort((a, b) => a.s.position.distanceTo(PEN) - b.s.position.distanceTo(PEN))[0]);
      S.tookBack++;
      if (S.tookBack === 1) {
        voice.say('take_back', { urgent: true });
        const h = herders[1 + Math.floor(rnd() * 4)]; setTimeout(() => S.phase === 'graze' && ctx.speak(h.p, 'More for us, then.'), 1800);
      }
    } });

  // the bell: before anyone can see a problem it only brings the neighbours out for a look; once the grass is thinning
  // it calls a meeting, and you go first
  interact.add({ pos: BELL, radius: 2.2, height: 3.4, prompt: 'Ring the bell', enabled: () => S.phase === 'graze' && S.meetT < 0,
    onUse: async () => {
      if (!voice.said.has('thin')) {
        S.meetT = 0; S.early = true; await voice.say('bell_early', { urgent: true, once: false }); await ctx.wait(3); S.early = false; S.meetT = -1; return;
      }
      S.phase = 'meeting'; S.meetT = 0; S.recoverFrom = S.grass;
      player.locked = true; S.walk = [gatePt(0, R + 1.2), gatePt(0, R - 1.5), gatePt(0, 2.4)];
      await voice.say('bell', { urgent: true }); await ctx.wait(1);
      // you go first: one of your own back to the pen (all of your extras with it)
      const mine = sheep.filter((s) => s.owner === 0 && !s.leaving);
      mine.slice(count(0) > 2 ? 2 : 1).forEach(sendHome);
      await voice.say('agree_1'); await ctx.wait(1);
      // then the others, one of them a little slower than the rest
      const late = 1 + Math.floor(rnd() * 4);
      for (let o = 1; o < 5; o++) if (o !== late) sheep.filter((s) => s.owner === o && !s.leaving).slice(2).forEach(sendHome);
      await voice.say('agree'); await ctx.wait(1.5);
      sheep.filter((s) => s.owner === late && !s.leaving).slice(2).forEach(sendHome);
      S.phase = 'recover'; S.recT = 0;
      await ctx.wait(4.5); save.complete('tragedy-of-the-commons');
      ctx.gameOver({ title: 'You agreed on limits', text: `Nobody owned the pasture, and nobody had to. You talked, went first, set rules, and kept to them. ${S.recoverFrom > 0.4 ? 'The grass came back.' : 'It took a long time, but the grass came back.'}` });
    } });

  // asides: the neighbours (they get less chatty as the grass goes), one of your sheep, and your wool
  const CHAT = [
    () => ['Fine grass this year.', "Mine are the fat ones. Don't tell the others.", 'Morning!'],
    () => ["Grass isn't what it was.", S.adds ? "Well, you added one. Why shouldn't I?" : "Everyone's adding. Why shouldn't I?", "If I don't, someone else will."],
    () => ['Somebody ought to do something.', 'Not my fault. I only did what everyone did.', "They're getting so thin, poor things."],
  ];
  herders.forEach((h, k) => h && talk(ctx, { who: h.p, radius: 2.2, enabled: () => S.phase === 'graze',
    lines: (i) => { const set = CHAT[S.grass > 0.8 ? 0 : S.grass > 0.4 ? 1 : 2](); return set[(k + i) % set.length]; } }));
  const mySheep = () => sheep.find((sh) => sh.owner === 0 && !sh.leaving && !sh.route.length)?.s;
  look(ctx, { pos: () => (mySheep()?.position ?? V(0, 0, 99)), radius: 1.8, height: 1.4, prompt: 'Look at your sheep', lines: ['sheep'], enabled: () => S.phase === 'graze' && !!mySheep() });
  look(ctx, { pos: WOOL.clone().add(V(0.4, 0, 1)), radius: 1.4, height: 1.4, prompt: 'Look at the wool', lines: ['wool'], enabled: () => S.phase === 'graze' && woolBalls[2].visible });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6);
    await voice.say('herders', { when: () => S.phase === 'graze' && S.grass > 0.9 && !S.adds });
  })();

  // the end of the grass: hold on the bare field (everyone looks at you), then let it grow back and the extra sheep go
  async function collapse() {
    S.phase = 'over'; S.overT = 0;
    const title = S.adds > S.tookBack ? 'The grass is gone' : 'You held back';
    await voice.say('collapse', { urgent: true }); await ctx.wait(2.5);
    if (title === 'You held back') { await voice.say(S.tookBack ? 'took_back_end' : 'held_end'); await ctx.wait(1); }
    else await ctx.wait(1.5);
    S.phase = 'rewind'; S.recoverFrom = 0; S.recT = 0;
    for (let o = 0; o < 5; o++) sheep.filter((s) => s.owner === o && !s.leaving).slice(2).forEach((s) => (s.fading = true));
    await ctx.wait(4); save.complete('tragedy-of-the-commons');
    ctx.gameOver(title === 'You held back'
      ? { title, text: "Your restraint was real. On its own, it wasn't enough: everyone else's sheep ate the pasture bare." }
      : { title, text: 'Every sheep made sense to the one who added it. Together, they ate the pasture bare, for everyone.' });
  }

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 15.5, rotY: Math.PI },
    // the fence can only be crossed at a gate
    walkable: (x, z) => { const d = Math.hypot(x, z); return d < 20.5 && (d < R - 0.05 || d > R + 0.65 || atGate(Math.atan2(z, x))); },
    blockers: () => [
      ...herders.filter(Boolean).flatMap((h) => [{ x: h.p.position.x, z: h.p.position.z, r: 0.5 }, { x: h.house.x, z: h.house.z, r: 2 }]),
      { x: -7.6, z: 16, r: 2 }, { x: BELL.x, z: BELL.z, r: 0.4 }, { x: PEN.x, z: PEN.z, w: 2.6, d: 2.1 }, { x: WOOL.x, z: WOOL.z, r: 0.6 },
    ],
    update(dt, t) {
      S.clock += dt;
      const n = sheep.filter((s) => !s.leaving).length;
      // grass grows back at a steady rate and is eaten in proportion to the sheep (less so when there's little left)
      if (S.phase === 'graze') {
        const appetite = S.grass < 0.3 ? 0.45 + 0.55 * (S.grass / 0.3) : 1;
        S.grass = clamp(S.grass + dt * (0.02 * (S.grass > 0.02 ? 1 : 0.2) - 0.002 * n * appetite));
        if (S.grass < 0.7 && !voice.said.has('thin')) voice.say('thin');
        if (S.grass <= 0.01) collapse();
        // the neighbours add sheep on their own, whether or not you do
        if (S.clock > S.nextNeighbour) {
          S.nextNeighbour = S.clock + NEIGHBOUR_EVERY;
          for (let k = 0; k < 4; k++) { const o = S.neighbourTurn; S.neighbourTurn = (o % 4) + 1; if (neighbourAdds(o)) break; }
          if (!voice.said.has('neighbour_adds')) { voice.say('neighbour_adds', { maxAge: 4 }); escalate(); }
        }
        S.wool += dt * Math.max(0, count(0) - 2) * 0.18;
      }
      if (S.phase === 'recover' || S.phase === 'rewind') { S.recT += dt; S.grass = lerp(S.recoverFrom, 1, easeInOut(clamp(S.recT / 4))); }
      woolBalls.forEach((b, i) => (b.visible = i < Math.floor(S.wool)));
      pastureMat.color.set(0x8fb36a).lerp(new THREE.Color(0xb79a6a), 1 - S.grass);
      const m = new THREE.Matrix4();
      tuftPos.forEach(([x, z, h], i) => { m.makeScale(1, Math.max(0.02, S.grass * h), 1).setPosition(x, 0.1 * S.grass, z); tufts.setMatrixAt(i, m); });
      tufts.instanceMatrix.needsUpdate = true;

      // the walk to the meeting
      if (S.walk?.length && !player.target) { player.target = S.walk.shift(); if (!S.walk.length) S.walk = null; }

      // sheep: along their route (in or out by the gate), else wander, keeping a little apart; lie down when the grass is gone
      const starving = S.grass < 0.05 && S.phase !== 'recover' && S.phase !== 'rewind';
      sheep.forEach((sh, i) => {
        sh.t -= dt;
        if (sh.t <= 0) { const r2 = sh.rng; const a = r2() * 6.28, rr = Math.sqrt(r2()) * (R - 1.2); sh.target.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); sh.t = 3 + r2() * 4; }
        const goal = sh.route[0] ?? sh.target;
        const d = goal.clone().sub(sh.s.position).setY(0);
        if (sh.route.length && d.length() < 0.4) sh.route.shift();
        const step = V();
        if (!starving && d.length() > 0.3) step.copy(d).normalize().multiplyScalar(sh.leaving || sh.route.length ? 1.8 : 0.6);
        if (!sh.route.length) {
          for (const o of sheep) { if (o === sh) continue; const q = sh.s.position.clone().sub(o.s.position).setY(0), l = q.length(); if (l < 1.1 && l > 0.001) step.addScaledVector(q, (1.1 - l) * 1.6 / l); }
          const q = sh.s.position.clone().sub(player.pos).setY(0), l = q.length(); if (l < 1.3 && l > 0.001) step.addScaledVector(q, (1.3 - l) * 2.5 / l);   // they step aside for you
          const r = Math.hypot(sh.s.position.x, sh.s.position.z); if (r > R - 0.8) step.addScaledVector(sh.s.position.clone().setY(0), -(r - (R - 0.8)) * 2 / r);
        }
        if (starving) step.multiplyScalar(0.2);
        sh.s.position.addScaledVector(step, dt);
        if (step.lengthSq() > 0.04) sh.s.rotation.y = lerp(sh.s.rotation.y, Math.atan2(step.x, step.z), 0.15);
        if (sh.leaving && !sh.route.length) sh.s.visible = false;
        if (sh.fading) { sh.fade = Math.max(0, sh.fade - dt * 0.6); sh.s.visible = sh.fade > 0.02; }
        const b = sh.s.userData.body;
        b.rotation.z = starving ? lerp(b.rotation.z, Math.PI / 2, 0.05) : lerp(b.rotation.z, Math.sin(t * 5 + sh.seed) * 0.03, 0.1);
        b.position.y = starving ? 0.25 : Math.abs(Math.sin(t * 6 + sh.seed)) * 0.03;
        b.scale.setScalar(lerp(0.75, 1, S.grass) * sh.fade);
      });
      // herders: at home, watching; at the fence, leaning, once the grass is poor; in the middle for a meeting (or to
      // look at the thick grass, for an early ring); at the end, turned to look at you
      herders.forEach((h, i) => {
        if (!h) return;
        const meet = S.phase === 'meeting' || S.phase === 'recover' || S.early;
        const goal = meet ? V(Math.cos(h.a) * 2.4, 0, Math.sin(h.a) * 2.4) : S.grass < 0.4 && S.phase === 'graze' ? V(Math.cos(h.a) * (R + 0.8), 0, Math.sin(h.a) * (R + 0.8)) : h.home;
        const d = goal.clone().sub(h.p.position).setY(0);
        if (d.length() > 0.2) { h.p.position.addScaledVector(d.normalize(), dt * 3); h.p.rotation.y = Math.atan2(d.x, d.z); }
        else if (S.phase === 'over') h.p.rotation.y = Math.atan2(player.pos.x - h.p.position.x, player.pos.z - h.p.position.z);
        else h.p.rotation.y = Math.atan2(-h.p.position.x, -h.p.position.z);
        const lean = S.grass < 0.4 && S.phase === 'graze' && d.length() <= 0.2;
        animatePerson(h.p, t, { phase: i, energy: d.length() > 0.2 ? 1 : 0.4 });
        h.p.rotation.x = lerp(h.p.rotation.x, lean ? 0.18 : 0, 0.05);
      });
      if (S.meetT >= 0) { S.meetT += dt; bellBody.rotation.z = Math.sin(S.meetT * 12) * 0.5 * Math.exp(-S.meetT * 0.8); }
      if (S.escalated) cameo.start();
      cameo.update(dt);
      if (fly.visible) fly.position.copy(FLY).add(V(Math.sin(t * 9) * 0.25, Math.sin(t * 13) * 0.12, Math.cos(t * 7) * 0.2));
    },
    camera(pl) { return { ...frame([pl.pos.clone(), pl.pos.clone().add(V(0, 0, 4)), V(-R, 0, 0), V(R, 0, 0), V(0, 0, -R), V(0, 1, R), PEN.clone(), BELL.clone()], { min: 16, max: 50 }), stiffness: 2 }; },
    dispose() { voice.stop(); player.locked = false; },
  });
}
