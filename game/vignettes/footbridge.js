// Vignette: The Footbridge.
// You're on a footbridge over the line. A runaway trolley is coming; five people are working on the track beyond.
// Beside you, a very large man leans on the railing. Push him, and his body stops the trolley. Or don't. Twice, then it
// ends. Nothing here to steer: the only way to save the five is to use him.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makeTunnel, makeTree, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFrameAll, knockPose, restore, slowly } from '../core/trolley-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const START = -62, PORTAL = -50, SLOW_AT = -30, RESET_X = -16;
const FAST = 9;
const FASTQ = new URLSearchParams(location.search).get('fast');
const CREEP = FASTQ !== null ? Number(FASTQ) || 3 : 0.5;
const BRIDGE_X = 2, DECK = 4.2, RUNS_TO_END = 2;
const MAN_AT = V(2.35, DECK, -1.2);            // leaning on the railing, looking up the line
const MAN_ON_TRACK = V(BRIDGE_X - 0.4, 0.1, 0);

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

  // the large man
  const man = makePerson({ color: palette.one, hat: true, scale: 1.45 });
  man.position.copy(MAN_AT); man.rotation.y = -Math.PI / 2 - 0.2; root.add(man);

  // ---- the frog climbs the steps, peers over the railing at the trolley, thinks better of it, and goes back down
  const frog = makeFrog(); root.add(frog);
  const stepY = (i) => DECK * (1 - (i + 1) / (STEPS + 1));
  const cameo = frogCameo(frog, [{ at: [BRIDGE_X + 0.3, 12.4], y: 0 }, { at: [BRIDGE_X + 0.3, 10.7], y: stepY(5) }, { at: [BRIDGE_X + 0.3, 8.8], y: stepY(3) }, { at: [BRIDGE_X + 0.3, 6.9], y: stepY(1) },
    { at: [BRIDGE_X + 0.4, 4.9], y: DECK }, { at: [BRIDGE_X - 0.9, 3.6], y: DECK }, { face: [-40, 0] },
    { wait: 2.2, act: (f, u) => (f.userData.body.rotation.x = 0.35 * Math.sin(Math.PI * u)) }, { face: [BRIDGE_X, 8] },
    { at: [BRIDGE_X + 0.4, 4.9], y: DECK }, { at: [BRIDGE_X + 0.3, 6.9], y: stepY(1) }, { at: [BRIDGE_X + 0.3, 8.8], y: stepY(3) }, { at: [BRIDGE_X + 0.3, 10.7], y: stepY(5) }, { at: [BRIDGE_X + 0.3, 12.8], y: 0 }]);

  // ---- state
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, runs: 0, choices: [], pushed: false, fallT: -1, committed: null, rewindFrom: 0 };
  const go = (ph) => { S.phase = ph; S.pt = 0; };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/footbridge.json', 'The Footbridge');
  const deckPlane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false }));
  deckPlane.rotation.x = -Math.PI / 2; deckPlane.position.set(BRIDGE_X, DECK, 0); root.add(deckPlane); level.ground.push(deckPlane);

  const victims = five.map((p, i) => ({ obj: p, x: p.position.x, side: i % 2 ? 1 : -1, base: null, hitT: null }));
  const manV = { hitT: null };
  const trolleyX = () => START + S.s;

  interact.add({ pos: () => MAN_AT.clone().add(V(-0.1, 0, 1.3)), radius: 1.6, height: 3.2, prompt: 'Push him', enabled: () => S.phase === 'slow' && !S.pushed,
    onUse: () => { S.pushed = true; S.fallT = 0; voice.stop(); } });
  look(ctx, { pos: () => V(BRIDGE_X - 0.6, DECK, 2.2), radius: 1.3, height: 1.6, prompt: 'Look over the railing', lines: ['too_light'], enabled: () => S.phase === 'slow' && !S.pushed });
  talk(ctx, { who: man, radius: 1.9, offset: [0, 3.1, 0], enabled: () => (S.phase === 'slow' || S.phase === 'reflect') && !S.pushed,
    lines: (i) => { const l = ['Lovely view from up here.', 'I come up here to watch the trains.', 'Mind yourself. It\'s a long way down.', 'Is that one going a bit fast?'][i % 4]; return S.phase === 'slow' ? slowly(l) : l; } });
  interact.trigger({ pos: MAN_AT, radius: 3.2, when: () => S.phase === 'slow', onEnter: () => voice.say('big') });

  async function afterRun(choice) {
    S.choices.push(choice); S.runs++;
    save.complete('footbridge');
    await ctx.wait(0.6);
    if (S.runs === 1) { await voice.say(choice + '_1'); await voice.say(choice + '_2'); }
    else {
      await voice.say(choice + '_1', { once: false });
      await voice.say(S.choices[0] === S.choices[1] ? 'again_same' : 'again_diff', { once: false });
    }
    if (S.runs >= RUNS_TO_END) {
      await ctx.wait(0.6); await voice.say('end'); go('over'); await ctx.wait(1.2);
      return ctx.gameOver(choice === 'pushed'
        ? { title: 'You pushed him', text: 'One life for five, the same trade as the lever. It only felt different because this time you used him.' }
        : { title: 'You kept your hands to yourself', text: 'Five were hit. You could have stopped it, but only by using someone as the brake.' });
    }
    await ctx.wait(0.8); go('slow');
  }

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: BRIDGE_X - 0.3, z: 3.2, rotY: -Math.PI / 2 },
    walkable: (x, z) => Math.abs(x - BRIDGE_X) < 1.05 && z > -5 && z < 5.2,
    blockers: () => (S.pushed ? [] : [{ x: MAN_AT.x, z: MAN_AT.z, r: 0.55 }]),
    update(dt, t) {
      S.pt += dt;
      player.pos.y = DECK;                                    // you're up on the bridge
      if (S.phase === 'arrive') {
        S.speed = trolleyX() < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) go('slow');
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        if (trolleyX() > -20 && !voice.said.has('ask')) { voice.say('five'); voice.say('ask'); }
        if (S.pushed && S.fallT > 1) { S.committed = 'pushed'; player.enabled = false; go('go'); }
        else if (!S.pushed && trolleyX() > BRIDGE_X - 9) { S.committed = 'stayed'; voice.stop(); player.enabled = false; go('go'); }
      } else if (S.phase === 'go') {
        S.speed = lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5));
        const stopAt = S.committed === 'pushed' ? MAN_ON_TRACK.x - 1.6 : 24;
        if (trolleyX() > stopAt - (S.committed === 'pushed' ? 1.2 : 8)) S.speed = Math.max(0.3, S.speed * Math.exp(-dt * (S.committed === 'pushed' ? 9 : 2.2)));
        if (trolleyX() >= stopAt) { S.speed = 0; go('aftermath'); }
      } else if (S.phase === 'aftermath') {
        S.speed = 0;
        if (S.pt > 1.6) { go('rewind'); S.rewindFrom = S.s; }
      } else if (S.phase === 'rewind') {
        const k = easeInOut(S.pt / 2);
        S.s = lerp(S.rewindFrom, RESET_X - START, k);
        if (k >= 1) {
          const c = S.committed; S.committed = null; S.pushed = false; S.fallT = -1;
          victims.forEach(restore); manV.hitT = null; man.position.copy(MAN_AT); man.rotation.set(0, -Math.PI / 2 - 0.2, 0);
          player.enabled = true; go('reflect'); afterRun(c);
        }
      } else S.speed = 0;
      if (S.phase !== 'rewind') S.s += S.speed * dt;

      // the trolley
      const x = trolleyX(), spd = S.speed / FAST;
      trolley.position.set(x, 0.05 * Math.abs(Math.sin(S.s * 2.6)) * spd, 0);
      trolley.rotation.set(Math.sin(S.s * 2.1) * 0.018 * spd, 0, 0.012 * spd);
      trolley.visible = x > PORTAL - 12;
      trolley.userData.wheels.forEach((w) => (w.rotation.z = -S.s / 0.34));

      // the man: pushed, he tumbles off the bridge onto the line (and back up, when time rewinds)
      if (S.fallT >= 0 && S.phase !== 'rewind') S.fallT += dt;
      const fallK = S.phase === 'rewind' ? 1 - easeInOut(S.pt / 2) : clamp(S.fallT / 0.9);
      if (S.fallT >= 0) {
        const k = easeInOut(fallK);
        man.position.set(lerp(MAN_AT.x, MAN_ON_TRACK.x, k), lerp(MAN_AT.y, MAN_ON_TRACK.y, k) + Math.sin(Math.PI * k) * 0.8, lerp(MAN_AT.z, MAN_ON_TRACK.z, k));
        man.rotation.set(0, -Math.PI / 2 - 0.2, (Math.PI / 2) * k);
      }
      // hits
      if (S.phase === 'go' || S.phase === 'aftermath') {
        if (S.committed === 'pushed') {
          if (manV.hitT === null && x + 2.3 >= MAN_ON_TRACK.x) manV.hitT = 0;
          if (manV.hitT !== null) manV.hitT += dt;
        } else for (const v of victims) {
          if (v.hitT === null && x + 2.3 >= v.x) v.hitT = 0;
          if (v.hitT !== null) { v.hitT += dt; knockPose(v, v.hitT); }
        }
      } else if (S.phase === 'rewind') {
        const k = 1 - easeInOut(S.pt / 2);
        for (const v of victims) if (v.hitT !== null) knockPose(v, v.hitT * k);
      }
      // he stops it: shoved a little way along the line (undone by the rewind)
      if (manV.hitT !== null && S.fallT >= 0) man.position.x += 1.4 * clamp(manV.hitT / 0.3) * (S.phase === 'rewind' ? 1 - easeInOut(S.pt / 2) : 1);
      five.forEach((q, i) => { if (!victims[i].base) animatePerson(q, t, { phase: i * 1.3 }); });
      if (S.fallT < 0) animatePerson(man, t * 0.6, { energy: 0.4 });

      if (S.phase === 'slow') cameo.start();
      cameo.update(dt);
      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, S.pt / 0.2, (2 - S.pt) / 0.2) : 0, t);
    },
    camera(pl) {
      if (S.phase === 'go' || S.phase === 'aftermath') {
        const pts = [trolley.position.clone(), S.committed === 'pushed' ? MAN_ON_TRACK.clone() : fiveCenter.clone().add(V(4, 0, 0)), V(BRIDGE_X, DECK, 0)];
        return { ...frameAll(pts, { margin: 1.25, min: 18 }), stiffness: 2.2 };
      }
      const pts = [pl.pos.clone(), trolley.position.clone().setX(Math.max(trolley.position.x, -34)), fiveCenter.clone(), V(BRIDGE_X, DECK + 2, 0)];
      return { ...frameAll(pts, { min: 18 }), stiffness: S.phase === 'rewind' ? 1.5 : 2.4 };
    },
    dispose() { voice.stop(); ctx.ui.rewind(0); },
  });
}
