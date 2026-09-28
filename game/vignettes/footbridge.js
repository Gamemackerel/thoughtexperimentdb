// Vignette: The Footbridge.
// You're on a footbridge over the line. A runaway trolley is coming; five people are working on the track beyond.
// A very large man leans on the railing, watching it come. Push him (he doesn't go quietly: it takes three shoves) and
// he tips over the rail and lands in its way, and it stops against him. Or don't, and it goes under the bridge to the
// five. It runs once; then it ends. Nothing here to steer: the only way to save the five is to use him.
import {
  THREE, palette, clamp, lerp, easeInOut, easeOut, seeded, clay, mesh,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makeTunnel, makeTree, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeRide, makeFrameAll, knockPose, slowly } from '../core/trolley-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const START = -62, PORTAL = -50, SLOW_AT = -30;
const FAST = 9;
const FASTQ = new URLSearchParams(location.search).get('fast');
const CREEP = FASTQ !== null ? Number(FASTQ) || 3 : 0.5;
const BRIDGE_X = 2, DECK = 4.6;                    // deck high enough for the trolley's pole to pass under
const LAST_CALL = BRIDGE_X - 12;                   // trolley x: after this, too late to push
const MAN_Z = -0.4;
const PIVOT = V(0.75, DECK + 1.0, MAN_Z);          // his waist against the top rail (the rail facing the trolley)
const FEET = V(0.45, -1.0, 0);                     // his feet, from there
const LAND = V(-2.0, 0.95, 0);                     // the pivot once he's lying on the line, feet towards the trolley
const PUSH_SPOT = V(2.3, DECK, MAN_Z);             // where you stand to push, behind him
// the struggle (seconds since you pushed): how far he tips over the rail (+) or leans back into you (-), how far you
// lunge forward (-x) or get pushed back, and how far he turns round to look at you; then he goes over and drops
const TIP = [[0, 0], [0.35, 0], [0.6, 0.28], [0.95, -0.12], [1.25, -0.04], [1.5, 0.5], [1.85, 0.02], [2.15, 0.06], [2.45, 0.75], [2.85, 1.9]];
const LUNGE = [[0, 0], [0.35, 0], [0.58, -0.42], [0.95, 0.14], [1.25, 0], [1.48, -0.5], [1.85, 0.12], [2.15, 0], [2.42, -0.55], [2.9, -0.3]];
const TURN = [[0, 0], [0.5, 0], [0.8, 0.9], [2.2, 0.8], [2.6, 0]];
const OVER = 2.85, DROP = 0.75;                    // when he's past the tipping point, and how long the fall takes
const keyed = (keys, t) => {
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  let i = 0; while (keys[i + 1][0] < t) i++;
  const [t0, a] = keys[i], [t1, b] = keys[i + 1];
  return lerp(a, b, easeInOut((t - t0) / (t1 - t0)));
};

export default function footbridge(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 70, 190);
  voice.load('footbridge');
  const frameAll = makeFrameAll(stage, V(-0.25, 0.55, 0.8));

  // ---- world: the line, the tunnel, the five, and the bridge
  root.add(makeIsland({ radius: 50, seed: 8 }));
  const line = new THREE.LineCurve3(V(START, 0, 0), V(34, 0, 0));
  root.add(makeTrack(line));
  const tunnel = makeTunnel(); tunnel.position.x = PORTAL; root.add(tunnel);
  const rnd = seeded(12);
  for (let i = 0; i < 7; i++) { const t = makeTree(0.9 + rnd() * 0.7, rnd); t.position.set(-10 + i * 7 + rnd() * 2, 0, -9 - rnd() * 6); root.add(t); }
  const trolley = makeTrolley();
  const drv = trolley.userData.driver; drv.userData.body.rotation.x = 0.55; drv.userData.body.rotation.z = 0.25;
  root.add(trolley);
  const ride = makeRide(root, trolley, { fast: FAST, portal: PORTAL });
  const five = [];
  for (let i = 0; i < 5; i++) { const p = makePerson({ color: palette.many, hat: true }); p.position.set(11.5 + i * 1.5, 0, (rnd() - 0.5) * 0.6); p.rotation.y = -0.5 + rnd() * 0.5; five.push(p); root.add(p); }
  const fiveCenter = V(14.5, 0, 0);

  const stone = clay(0xcfc3ad), wood = clay(0x8a6b52);
  const deck = mesh(new THREE.BoxGeometry(2.8, 0.3, 10.8), stone); deck.position.set(BRIDGE_X, DECK - 0.15, 0); root.add(deck);
  for (const z of [-4.7, 4.7]) { const pier = mesh(new THREE.BoxGeometry(1.8, DECK - 0.3, 1.4), stone); pier.position.set(BRIDGE_X, (DECK - 0.3) / 2, z); root.add(pier); }
  for (const x of [-1.35, 1.35]) {
    const rail = mesh(new THREE.BoxGeometry(0.12, 0.12, 10.8), wood); rail.position.set(BRIDGE_X + x, DECK + 0.95, 0); root.add(rail);
    for (let z = -5.2; z <= 5.2; z += 1.3) { const post = mesh(new THREE.BoxGeometry(0.1, 0.95, 0.1), wood); post.position.set(BRIDGE_X + x, DECK + 0.47, z); root.add(post); }
  }
  // steps down at the far end (for show: the frog uses them)
  const STEPS = 6;
  for (let i = 0; i < STEPS; i++) { const h = DECK * (1 - (i + 1) / (STEPS + 1)); const st = mesh(new THREE.BoxGeometry(2.4, h, 0.95), stone); st.position.set(BRIDGE_X, h / 2, 5.4 + 0.5 + i * 0.95); root.add(st); }

  // the large man, leaning on the rail and watching the trolley come. He hangs from a pivot at his waist on the rail,
  // so that pushing tips him over it (never through the deck).
  const man = makePerson({ color: palette.one, hat: true, scale: 1.45 });
  const tipper = new THREE.Group(); tipper.position.copy(PIVOT); root.add(tipper);
  man.position.copy(FEET); man.rotation.y = -Math.PI / 2; tipper.add(man);
  const manWorld = V(PIVOT.x + FEET.x, DECK, MAN_Z);

  // ---- the frog climbs the steps, peers over the railing at the trolley, thinks better of it, and goes back down
  const frog = makeFrog(); root.add(frog);
  const stepY = (i) => DECK * (1 - (i + 1) / (STEPS + 1));
  const cameo = frogCameo(frog, [{ at: [BRIDGE_X + 0.3, 12.4], y: 0 }, { at: [BRIDGE_X + 0.3, 10.7], y: stepY(5) }, { at: [BRIDGE_X + 0.3, 8.8], y: stepY(3) }, { at: [BRIDGE_X + 0.3, 6.9], y: stepY(1) },
    { at: [BRIDGE_X + 0.4, 4.9], y: DECK }, { at: [BRIDGE_X - 0.9, 3.6], y: DECK }, { face: [-40, 0] },
    { wait: 2.2, act: (f, u) => (f.userData.body.rotation.x = 0.35 * Math.sin(Math.PI * u)) }, { face: [BRIDGE_X, 8] },
    { at: [BRIDGE_X + 0.4, 4.9], y: DECK }, { at: [BRIDGE_X + 0.3, 6.9], y: stepY(1) }, { at: [BRIDGE_X + 0.3, 8.8], y: stepY(3) }, { at: [BRIDGE_X + 0.3, 10.7], y: stepY(5) }, { at: [BRIDGE_X + 0.3, 12.8], y: 0 }]);

  // ---- state
  // phases: arrive → slow (choose) → push (the struggle and the fall) → go (runs) → aftermath (hold) → over
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, pushed: false, pushT: -1, committed: null, manHitT: null };
  const go = (ph) => { S.phase = ph; S.pt = 0; };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/footbridge.json', 'The Footbridge');
  const deckPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false }));
  deckPlane.rotation.x = -Math.PI / 2; deckPlane.position.set(BRIDGE_X, DECK, 0); root.add(deckPlane); level.ground.push(deckPlane);

  const victims = five.map((p, i) => ({ obj: p, x: p.position.x, side: i % 2 ? 1 : -1, base: null, hitT: null }));
  const trolleyX = () => START + S.s;

  interact.add({ pos: PUSH_SPOT, radius: 1.1, height: 3.2, prompt: 'Push him', terminal: true, enabled: () => S.phase === 'slow' && !S.pushed,
    onUse: () => { S.pushed = true; S.pushT = 0; voice.stop(); player.enabled = false; player.target = null; go('push'); } });
  look(ctx, { pos: () => V(BRIDGE_X - 0.7, DECK, 2.4), radius: 1.0, height: 1.6, prompt: 'Look over the railing', lines: ['too_light'], enabled: () => S.phase === 'slow' && !S.pushed });
  talk(ctx, { who: man, at: V(1.45, DECK, 0.85), radius: 0.9, offset: [0, 3.1, 0], enabled: () => S.phase === 'slow' && !S.pushed,
    lines: (i) => slowly(['Lovely view from up here.', 'I come up here to watch the trains.', 'Mind yourself. It\'s a long way down.', 'Is that one going a bit fast?'][i % 4]) });
  interact.trigger({ pos: manWorld, radius: 3.2, when: () => S.phase === 'slow', onEnter: () => voice.say('big') });

  async function afterRun(choice) {
    save.complete('footbridge');
    await ctx.wait(0.8);
    await voice.say(choice + '_1'); await voice.say(choice + '_2');
    await ctx.wait(0.6); await voice.say('end');
    await ctx.wait(1.2);
    ctx.gameOver(choice === 'pushed'
      ? { title: 'You pushed him', text: 'One life for five, the same trade as the lever. It only felt different because this time you used him.' }
      : { title: 'You kept your hands to yourself', text: 'Five were hit. You could have stopped it, but only by using someone as the brake.' });
  }

  // where he is: leaning on the rail, rocking as you shove, tipping over, falling, lying on the line (and nudged along
  // it when the trolley stops against him)
  function posePush(dt) {
    const t = S.pushT;
    if (t < OVER) { tipper.position.copy(PIVOT); tipper.rotation.z = keyed(TIP, t); }
    else {
      const u = clamp((t - OVER) / DROP), k = easeOut(u);
      tipper.position.set(lerp(PIVOT.x, LAND.x, k), lerp(PIVOT.y, LAND.y, u * u), lerp(PIVOT.z, LAND.z, k));
      tipper.rotation.z = lerp(1.9, Math.PI * 1.5, easeOut(u * 1.05));
      if (u >= 1) tipper.position.y = LAND.y + 0.12 * Math.max(0, Math.sin(Math.PI * clamp((t - OVER - DROP) / 0.25)));   // a small bounce
    }
    man.rotation.y = -Math.PI / 2 + keyed(TURN, t);
    if (S.manHitT !== null) { S.manHitT += dt; tipper.position.x += 0.6 * easeOut(S.manHitT / 0.35); }
    // you: up to him, then shove, get shoved back, shove again
    if (S.phase === 'push') {
      const k = clamp(t / 0.3);
      player.pos.set(lerp(player.pos.x, PUSH_SPOT.x + keyed(LUNGE, t), k), DECK, lerp(player.pos.z, PUSH_SPOT.z, k));
      player.obj.rotation.y = lerp(player.obj.rotation.y, -Math.PI / 2, 1 - Math.exp(-dt * 12));
    }
  }
  const SAY = [[0.62, 'Hey!'], [1.52, 'Stop that!'], [2.5, 'No, no, no!']];

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: BRIDGE_X - 0.3, z: 3.2, rotY: -Math.PI / 2 },
    walkable: (x, z) => Math.abs(x - BRIDGE_X) < 1.05 && z > -5 && z < 5.2,
    blockers: () => (S.pushed ? [] : [{ x: manWorld.x, z: manWorld.z, r: 0.55 }]),
    update(dt, t) {
      S.pt += dt;
      player.pos.y = DECK;                                    // you're up on the bridge
      if (S.phase === 'arrive') {
        S.speed = trolleyX() < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) go('slow');
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        if (trolleyX() > -22 && !voice.said.has('ask')) { voice.say('five'); voice.say('ask'); }
        if (trolleyX() > LAST_CALL) { S.committed = 'stayed'; voice.stop(); player.enabled = false; go('go'); }
      } else if (S.phase === 'push') {
        S.speed = trolleyX() < LAST_CALL + 1 ? Math.min(CREEP, 0.5) : 0;   // it waits for the struggle
        const before = S.pushT; S.pushT += dt;
        for (const [at, l] of SAY) if (before < at && S.pushT >= at) ctx.speak(man, slowly(l), { offset: [0, 3.2, 0], secs: 1.4 });
        if (S.pushT > OVER + DROP + 0.35) { S.committed = 'pushed'; go('go'); }
      } else if (S.phase === 'go') {
        S.speed = lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5));
        const pushed = S.committed === 'pushed';
        const stopAt = pushed ? LAND.x - 1.0 - 2.45 + 0.6 : 30;       // pushed: his feet, less the trolley's nose, plus the nudge
        if (trolleyX() > stopAt - (pushed ? 2.5 : 8)) S.speed = Math.max(0.3, S.speed * Math.exp(-dt * (pushed ? 5 : 2.2)));
        if (trolleyX() >= stopAt) { S.speed = 0; go('aftermath'); }
      } else if (S.phase === 'aftermath') {
        S.speed = 0;
        if (S.pt > 1.6) { go('over'); afterRun(S.committed); }
      } else S.speed = 0;
      S.s += S.speed * dt;

      // the trolley
      const x = trolleyX();
      ride(line, S.s, S.speed);

      // him, and the hits
      if (S.pushT >= 0) posePush(dt);
      else animatePerson(man, t * 0.6, { energy: 0.4 });
      if (S.committed === 'pushed' && S.manHitT === null && x + 2.45 >= LAND.x - 1.0) S.manHitT = 0;
      if (S.committed === 'stayed') for (const v of victims) {
        if (v.hitT === null && x + 2.3 >= v.x) v.hitT = 0;
        if (v.hitT !== null) { v.hitT += dt; knockPose(v, v.hitT); }
      }
      five.forEach((q, i) => { if (!victims[i].base) animatePerson(q, t, { phase: i * 1.3 }); });

      if (S.phase === 'slow') cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      if (S.phase === 'go' || S.phase === 'aftermath' || S.phase === 'over') {
        const pts = [trolley.position.clone(), S.committed === 'pushed' ? LAND.clone().add(V(1, 0, 0)) : fiveCenter.clone().add(V(4, 0, 0)), V(BRIDGE_X, DECK, 0)];
        return { ...frameAll(pts, { margin: 1.25, min: 18 }), stiffness: 2.2 };
      }
      const pts = [pl.pos.clone(), trolley.position.clone().setX(Math.max(trolley.position.x, -34)), fiveCenter.clone(), V(BRIDGE_X, DECK + 2, 0)];
      if (S.phase === 'push') pts.push(LAND.clone());
      return { ...frameAll(pts, { min: 18 }), stiffness: 2.4 };
    },
    dispose() { voice.stop(); },
  });
}
