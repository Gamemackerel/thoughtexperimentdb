// Vignette: The Sheep in the Field (a Gettier case, from Chisholm).
// A lane in Grant Wood's country, a five-bar gate, a field with a round green hill in it. In front of the hill, grazing:
// a sheep. Look in through the open gate, and you believe there's a sheep in the field; so you shut the gate, to keep
// it in. Climb over and go and see: it's a dog in a sheepskin. But over the brow of the hill, out of sight from the
// gate, there is a sheep, and the gate you shut is keeping it in. Or walk on down the lane, quite sure of it, and be
// right anyway.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeSheep } from '../core/props.js';
import { makeCountry, makeHill, makeLollipop } from '../core/grantwood.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const GATE = V(0, 0, 2.6);
const HILL = V(2.5, 0, -10);
const FAKE = V(-2.6, 0, -3.4);            // the "sheep" you can see
const REAL = V(8.4, 0, -18.5);            // the sheep you can't
const IDLE_LIMIT = 60, SHUT_LIMIT = 40;
const OPEN = 1.5;                          // how far the gate stands open (swung in, into the field)

function makeDogInFleece() {
  const g = new THREE.Group(), body = new THREE.Group(), fur = clay(0x8a6a4a);
  const torso = mesh(new THREE.CapsuleGeometry(0.24, 0.6, 6, 10), fur); torso.rotation.x = Math.PI / 2; torso.position.y = 0.5; body.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), fur); head.position.set(0, 0.62, 0.5); body.add(head);
  const snout = mesh(new THREE.SphereGeometry(0.1, 10, 8), clay(0x6b4a33)); snout.scale.z = 1.4; snout.position.set(0, 0.56, 0.68); body.add(snout);
  for (const [x, z] of [[-0.13, -0.25], [0.13, -0.25], [-0.13, 0.25], [0.13, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), clay(palette.ink)); l.position.set(x, 0.2, z); body.add(l); }
  const tail = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6), fur); tail.position.set(0, 0.62, -0.42); tail.rotation.x = -0.8; body.add(tail);
  // the sheepskin: a heap of wool on its back, and a dark woolly hood over its head
  const fleece = new THREE.Group(); const wool = clay(0xf7f3ea);
  for (const [x, y, s] of [[-0.25, 0.64, 0.36], [0.15, 0.68, 0.4], [0.05, 0.82, 0.3], [-0.1, 0.57, 0.32]]) { const b = mesh(new THREE.SphereGeometry(s, 14, 10), wool); b.position.set(0, y, x); fleece.add(b); }
  const hood = mesh(new THREE.SphereGeometry(0.2, 12, 10), clay(palette.ink)); hood.scale.set(0.95, 1, 1.35); hood.position.set(0, 0.68, 0.55); fleece.add(hood);
  body.add(fleece);
  g.add(body); g.userData = { body, head, tail, fleece };
  return g;
}

export default function sheepField(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xdfe9ee);
  stage.scene.fog = new THREE.Fog(0xdfe9ee, 50, 160);
  voice.load('sheep-field');
  const rnd = seeded(1966);

  // ---- the country: a lane, a fence with a gate, the field and its hill, more hills beyond
  root.add(makeCountry({ seed: 23, depth: -36 }));
  const field = mesh(new THREE.BoxGeometry(40, 0.4, 30), clay(0xa9c77a)); field.position.set(0, -0.2, -12); field.receiveShadow = true; root.add(field);
  const lane = mesh(new THREE.BoxGeometry(40, 0.42, 4), clay(0xd9c8a0)); lane.position.set(0, -0.19, 4.8); root.add(lane);
  const hill = makeHill(7, 3.4, '#8fb36a', 14, rnd); hill.position.copy(HILL).setY(-0.2); root.add(hill);
  const fence = new THREE.Group(), fwood = clay(0xd9d2c0);
  for (let x = -18; x <= 18; x += 2.2) { if (Math.abs(x - GATE.x) < 1.6) continue; const p = mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), fwood); p.position.set(x, 0.6, GATE.z); fence.add(p); }
  for (const s of [-1, 1]) for (const y of [0.5, 0.95]) { const r = mesh(new THREE.BoxGeometry(16.6, 0.08, 0.06), fwood); r.position.set(s * (1.4 + 8.3), y, GATE.z); fence.add(r); }
  root.add(fence);
  // the gate: two posts, and a five-bar leaf hung on the left one, standing open
  for (const x of [-1.4, 1.4]) { const p = mesh(new THREE.BoxGeometry(0.22, 1.6, 0.22), fwood); p.position.set(GATE.x + x, 0.8, GATE.z); root.add(p); }
  const gate = new THREE.Group();
  const latch = mesh(new THREE.BoxGeometry(0.14, 1.4, 0.14), fwood); latch.position.set(2.5, 0.7, 0); gate.add(latch);
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(2.5, 0.08, 0.06), fwood); b.position.set(1.3, 0.3 + i * 0.25, 0); gate.add(b); }
  const brace = mesh(new THREE.BoxGeometry(0.08, 1.5, 0.06), fwood); brace.position.set(1.3, 0.75, 0.05); brace.rotation.z = 1; gate.add(brace);
  gate.position.copy(GATE).add(V(-1.3, 0, 0)); gate.rotation.y = OPEN; root.add(gate);
  for (const [x, z] of [[-9, 5.8], [8, 6.2], [-14, -6], [13, -4]]) { const t = makeLollipop(1); t.position.set(x, 0, z); root.add(t); }

  // the one you see, and the one you don't; and a farmer on the lane
  const fake = makeDogInFleece(); fake.position.copy(FAKE); fake.rotation.y = 0.7; root.add(fake);
  const real = makeSheep(); real.position.copy(REAL); real.rotation.y = -0.6; root.add(real);
  const farmer = makePerson({ color: 0x3f5a8c, hat: true }); farmer.position.set(-7, 0, 4.4); farmer.rotation.y = 1.2; root.add(farmer);

  // ---- the frog hops across the field; the "sheep" lifts its head and sniffs at it, as a dog would
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);
  const cameo = frogCameo(frog, [[-9, -2], [-7.4, -2.6], [-5.8, -3], [-4.2, -3.2], { face: [FAKE.x, FAKE.z] }, { wait: 2.4 }, [-2.6, -1.8], [-1, -1.2], [0.8, -1.6], [2.6, -2.4], [4.4, -3.6]]);

  // ---- state
  const S = { phase: 'lane', idle: 0, believed: false, reveal: 0, over: 0, sniff: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/sheep-field.json', 'The Sheep in the Field');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  let card = null;

  interact.add({ pos: GATE.clone().add(V(0.3, 0, 1.2)), radius: 1.4, height: 1.8, prompt: 'Look in through the gate', enabled: () => S.phase === 'lane',
    onUse: async () => {
      S.phase = 'looking'; player.enabled = false; S.gaze = true;
      await voice.say('see', { urgent: true });
      card = beliefCard('There\'s a sheep in the field.', { reason: 'You had good reason to (it looks exactly like one)' }); card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
      await ctx.wait(0.6); await voice.say('open'); S.phase = 'shut'; S.idle = 0; player.enabled = true;
    } });
  // acting on it: shut the gate, so the sheep can't get out
  async function shut() {
    if (S.phase !== 'shut') return;
    S.phase = 'shutting'; player.locked = true; player.target = GATE.clone().add(V(1.9, 0, 1));
    for (let i = 0; i < 16 && player.target; i++) await ctx.wait(0.15);
    player.locked = false; player.enabled = false; player.obj.rotation.y = player.yaw = -2.05; S.swing = 0.001; await ctx.wait(1.3); await voice.say('shut', { urgent: true });
    await ctx.wait(0.6); await voice.say('ask'); S.phase = 'choose'; S.idle = 0; player.enabled = true; cameo.start();
  }
  interact.add({ pos: GATE.clone().add(V(-0.2, 0, 1.2)), radius: 1.4, height: 1.8, prompt: 'Shut the gate', terminal: true, enabled: () => S.phase === 'shut', onUse: shut });
  // go and see
  interact.add({ pos: GATE.clone().add(V(-0.4, 0, 1.2)), radius: 1.4, height: 1.8, prompt: 'Climb over and go and see', terminal: true, enabled: () => S.phase === 'choose',
    onUse: async () => {
      S.phase = 'over'; S.inField = true; player.locked = true; player.target = FAKE.clone().add(V(0.6, 0, 1.6));
      await ctx.wait(4); S.reveal = 0.001; await ctx.wait(0.8); await voice.say('dog', { urgent: true });
      player.target = V(9.4, 0, -3.6); await ctx.wait(3); player.target = HILL.clone().add(V(7, 0, -3)); await ctx.wait(2.6); S.overHill = true;   // round the hill
      await voice.say('real'); card.tick(1); await ctx.wait(0.6); card.ask(); await voice.say('end'); await ctx.wait(1.8);
      save.complete('sheep-field');
      ctx.gameOver({ title: 'There was a sheep in the field', text: 'You believed there was a sheep in the field, and shut the gate to keep it in. You had good reason, there was a sheep, and the gate kept it in. But the thing you saw was a dog in a sheepskin; the sheep that made you right was one you couldn\'t see.' });
    } });
  async function walkOn(idle) {
    if (S.phase !== 'choose') return;
    S.phase = 'over'; player.locked = true; player.target = V(12, 0, 4.8);
    await voice.say(idle ? 'lane_idle' : 'lane_1', { urgent: true }); await ctx.wait(1.4);
    S.flyOver = true; await ctx.wait(2.4); S.reveal = 0.001; await ctx.wait(1.2);
    await voice.say('lane_2'); card.tick(1); await ctx.wait(0.6); card.ask(); await ctx.wait(1.6);
    save.complete('sheep-field');
    ctx.gameOver({ title: 'You walked on, sure of it', text: 'You were quite sure there was a sheep in the field, so you shut the gate and walked on. There was one, behind the hill, and the gate kept it in. The one you saw was a dog. You never found out. Did you know there was a sheep there?' });
  }
  interact.add({ pos: V(5, 0, 4.8), radius: 1.6, height: 1.8, prompt: 'Walk on down the lane', terminal: true, enabled: () => S.phase === 'choose', onUse: () => walkOn(false) });

  talk(ctx, { who: farmer, enabled: () => S.phase === 'lane' || S.phase === 'shut' || S.phase === 'choose', lines: ['Fine day for it.', 'Aye, there\'s a sheep in that field. Always has been.', 'My dog? Haven\'t seen him all morning.'] });
  look(ctx, { pos: V(-4, 0, 4.2), radius: 1.2, height: 1.6, prompt: 'Look at the hills', lines: ['hills'], enabled: () => S.phase === 'lane' || S.phase === 'shut' || S.phase === 'choose' });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -3, z: 5, rotY: 0.5 },
    walkable: (x, z) => (S.inField ? Math.abs(x) < 18 && z > -22 && z < 6.6 : Math.abs(x) < 16 && z > GATE.z + 0.9 && z < 6.6),
    blockers: () => [{ x: farmer.position.x, z: farmer.position.z, r: 0.4 }, ...(S.inField ? [{ x: HILL.x, z: HILL.z, r: 6.4 }] : [])],
    update(dt, t) {
      // the "sheep" grazes, head down, and wags its tail (which a sheep wouldn't); then its fleece slips off
      const u = fake.userData;
      u.head.position.y = 0.62 - Math.max(0, Math.sin(t * 0.8)) * 0.12; u.tail.rotation.z = Math.sin(t * 9) * 0.4;
      if (cameo.active && frog.position.distanceTo(fake.position) < 2.6) fake.rotation.y = lerp(fake.rotation.y, Math.atan2(frog.position.x - fake.position.x, frog.position.z - fake.position.z), 0.08);
      if (S.reveal > 0) { S.reveal = Math.min(1, S.reveal + dt * 0.8); const k = easeInOut(S.reveal); u.fleece.position.set(-k * 0.9, -k * 0.35, -k * 0.2); u.fleece.rotation.z = k * 1.2; }
      real.userData.body.rotation.x = Math.max(0, Math.sin(t * 0.7)) * 0.3;
      animatePerson(farmer, t, { energy: 0.3 });
      if (S.swing > 0) { S.swing = Math.min(1, S.swing + dt * 1.1); const k = easeInOut(S.swing); gate.rotation.y = OPEN * (1 - k) + Math.sin(k * Math.PI * 3) * 0.03 * (1 - k); }   // swung to, with a little bounce on the latch
      if (S.phase === 'shut') {   // (leave it standing open, and the farmer asks; leave it longer, and you shut it anyway)
        const was = S.idle; S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (was < 20 && S.idle >= 20) ctx.speak(farmer, 'Shut that gate, would you? Can\'t have sheep getting out.');
        if (S.idle > SHUT_LIMIT) shut();
      }
      if (S.phase === 'choose') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) walkOn(true);
      }
      cameo.update(dt);
    },
    camera(pl) {
      // low, from behind you, so the hill hides whatever is behind it (until you go and look, or we fly over)
      if (S.flyOver) return { pos: V(2.4, 14, 16), look: V(3.4, -3.3, -10), stiffness: 1.2 };   // high enough to see over the hill: the sheep, and the gate you shut
      if (S.overHill) return { pos: V(5.2, 5, -27.5), look: V(8.8, 0.4, -15.5), stiffness: 2 };   // from beyond the sheep, looking back at you (round the side of the hill, never through it)
      if (S.inField) return { pos: pl.pos.clone().add(V(2.4, 3.2, 8)), look: pl.pos.clone().add(V(0, 0.8, -6)), stiffness: 2 };
      if (S.phase === 'shutting') return { pos: GATE.clone().add(V(3.4, 3.4, 7.4)), look: GATE.clone().add(V(-0.8, 0.5, -2.4)), stiffness: 1.6 };   // (up a little, to see the gate swing to)
      const look = S.gaze || S.phase === 'choose' ? V(-1, 0.9, -6) : pl.pos.clone().add(V(0, 1, -6));
      return { pos: V(pl.pos.x * 0.5 + 3.2, 2.9, pl.pos.z + 9), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; },
  });
}
