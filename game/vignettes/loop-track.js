// Vignette: The Loop.
// Like the lever, except the side track loops round and rejoins the main line beyond the five, so a diverted trolley
// would come back and hit them from the other side. A very large man stands on the loop: only his weight would stop it.
// Pull the lever and the five are saved because the trolley hits him. After the first pull, a ghost trolley shows what
// the loop does without him. Twice, then it ends.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, ghostify,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makeTunnel, makeLever, makePathGlow, makeTree, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFrameAll, knockPose, restore, slowly } from '../core/trolley-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const JUNCTION = -4, PORTAL = -50, START = -62, SLOW_AT = -32, RESET_X = -16;
const FAST = 9;
const FASTQ = new URLSearchParams(location.search).get('fast');
const CREEP = FASTQ !== null ? Number(FASTQ) || 3 : 0.55;
const RUNS_TO_END = 2;
const LOOP_Z = -8, FAR = 27;
const bez = (a, b, c, d) => new THREE.CubicBezierCurve3(a, b, c, d);
const path = (...parts) => { const p = new THREE.CurvePath(); parts.forEach((c) => p.add(c)); return p; };

export default function loopTrack(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 70, 190);
  voice.load('loop-track');
  const frameAll = makeFrameAll(stage);

  root.add(makeIsland({ radius: 50, seed: 13 }));
  const approach = new THREE.LineCurve3(V(START, 0, 0), V(JUNCTION, 0, 0));
  const out = bez(V(JUNCTION, 0, 0), V(2, 0, 0), V(4, 0, LOOP_Z), V(10, 0, LOOP_Z));
  const along = new THREE.LineCurve3(V(10, 0, LOOP_Z), V(FAR - 4, 0, LOOP_Z));
  const uturn = bez(V(FAR - 4, 0, LOOP_Z), V(FAR + 5, 0, LOOP_Z), V(FAR + 5, 0, 0), V(FAR - 4, 0, 0));
  const back = new THREE.LineCurve3(V(FAR - 4, 0, 0), V(6, 0, 0));
  const ROUTES = { main: new THREE.LineCurve3(V(START, 0, 0), V(30, 0, 0)), loop: path(approach, out, along, uturn, back) };
  root.add(makeTrack(new THREE.LineCurve3(V(START, 0, 0), V(FAR - 4, 0, 0))), makeTrack(path(out, along, uturn)));
  const tunnel = makeTunnel(); tunnel.position.x = PORTAL; root.add(tunnel);
  const rnd = seeded(31);
  for (let i = 0; i < 6; i++) { const t = makeTree(0.9 + rnd() * 0.6, rnd); t.position.set(-20 + i * 8, 0, 8 + rnd() * 5); root.add(t); }
  const lead = new THREE.LineCurve3(V(-12, 0, 0), V(JUNCTION, 0, 0));
  const glows = { main: makePathGlow(path(lead, new THREE.LineCurve3(V(JUNCTION, 0, 0), V(18.5, 0, 0))), palette.many), loop: makePathGlow(path(lead, out, along, uturn), palette.one) };
  Object.values(glows).forEach((g) => root.add(g));

  const trolley = makeTrolley();
  const drv = trolley.userData.driver; drv.userData.body.rotation.x = 0.55; drv.userData.body.rotation.z = 0.25;
  root.add(trolley);
  const ghost = ghostify(trolley, palette.one, 0.35); ghost.visible = false; root.add(ghost);
  const five = [];
  for (let i = 0; i < 5; i++) { const p = makePerson({ color: palette.many, hat: true }); p.position.set(11.5 + i * 1.5, 0, (rnd() - 0.5) * 0.6); p.rotation.y = -0.5 + rnd() * 0.5; five.push(p); root.add(p); }
  const fiveCenter = V(14.5, 0, 0);
  const big = makePerson({ color: palette.one, hat: true, scale: 1.45 }); big.position.set(16, 0, LOOP_Z); big.rotation.y = -0.4; root.add(big);
  const lever = makeLever(); lever.position.set(-7.2, 0, 2.7); lever.rotation.y = Math.PI / 2; root.add(lever);
  const leverSpot = V(-7.2, 0, 3.8);
  // a sign by the lever
  const signTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#2b2a33'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('LOOP LINE', 128, 52); g.font = '20px sans-serif'; g.fillText('rejoins main line', 128, 88); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const sign = new THREE.Group(); const spost = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 8), clay(palette.rail)); spost.position.y = 1; sign.add(spost);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: signTex })); board.position.y = 2; sign.add(board);
  sign.position.set(-9.6, 0, 3.4); sign.rotation.y = 0.3; root.add(sign);

  // ---- the frog does a lap inside the loop, then leaves over the rails
  const frog = makeFrog(); root.add(frog);
  const cameo = frogCameo(frog, [[8, -14], [9.6, -11.5], { at: [11, -9.4], height: 1.3 }, [12.4, -5.4], [15.6, -3.8], [19.2, -3.6], [22.6, -4.2], [24, -5.6], [21.4, -6.2], [17.6, -6], [14, -5.6],
    [12.6, -4.4], { face: [11, -9.4] }, { wait: 0.8 }, { at: [11.4, -9.6], height: 1.3 }, [10.4, -12], [9.4, -14.6]]);

  // ---- state
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, route: 'main', committed: null, runs: 0, choices: [], rewindFrom: 0, ghostT: -1, lastRoute: null };
  const go = (ph) => { S.phase = ph; S.pt = 0; };
  let routeCurve = ROUTES.main;
  const posAt = (curve, s) => curve.getPointAt(clamp(s / curve.getLength(), 0, 1));
  const arcOf = (curve, p) => { const pts = curve.getSpacedPoints(1200); let b = 0; pts.forEach((q, j) => { if (q.distanceToSquared(p) < pts[b].distanceToSquared(p)) b = j; }); return (b / 1200) * curve.getLength(); };
  const victims = five.map((p, i) => ({ obj: p, side: i % 2 ? 1 : -1, sMain: arcOf(ROUTES.main, p.position), sLoop: arcOf(ROUTES.loop, p.position), base: null, hitT: null }));
  const bigV = { obj: big, side: -1, s: arcOf(ROUTES.loop, big.position), base: null, hitT: null };
  const sJunction = JUNCTION - START;
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/loop-track.json', 'The Loop');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: leverSpot, radius: 2.8, height: 2.4, prompt: () => (S.route === 'loop' ? 'Put the lever back' : 'Pull the lever'), enabled: () => S.phase === 'slow',
    onUse: () => { S.route = S.route === 'loop' ? 'main' : 'loop'; } });
  interact.trigger({ pos: fiveCenter, radius: 9, when: () => S.phase === 'slow', onEnter: () => voice.say('five') });
  interact.trigger({ pos: big.position, radius: 8, when: () => S.phase === 'slow', onEnter: () => voice.say('one') });
  interact.trigger({ pos: leverSpot, radius: 4.5, when: () => S.phase === 'slow', onEnter: () => voice.say('lever') });
  const standing = (v) => () => !v.base && (S.phase === 'slow' || S.phase === 'reflect');
  const speak = (lines) => (i) => { const l = lines[i % lines.length]; return S.phase === 'slow' ? slowly(l) : l; };
  talk(ctx, { who: big, enabled: standing(bigV), lines: speak(['Nobody ever uses this bit of line.', "I'm on my break. It's quiet on the loop.", 'I go round it every day. It always comes back.']) });
  five.forEach((p, k) => talk(ctx, { who: p, enabled: standing(victims[k]), lines: speak([['Nearly done.'], ['Tea at four.'], ['Is that a bell?'], ['Lovely day.'], ['Mind the rails.']][k]) }));
  look(ctx, { pos: sign.position, radius: 2, height: 2.8, prompt: 'Read the sign', lines: ['sign'], enabled: () => S.phase === 'slow' });

  async function afterRun(c) {
    const choice = c === 'loop' ? 'pulled' : 'stayed';
    S.choices.push(choice); S.runs++;
    save.complete('loop-track');
    await ctx.wait(0.6);
    if (S.runs === 1 || !voice.said.has(choice + '_2')) {
      await voice.say(choice + '_1', { once: false }); await voice.say(choice + '_2');
      if (choice === 'pulled') { go('ghost'); S.ghostT = 0; await ctx.wait(7.5); await voice.say('ghost'); S.ghostT = -1; go('reflect'); }
    } else {
      await voice.say(choice + '_1', { once: false });
      await voice.say(S.choices[S.runs - 1] === S.choices[S.runs - 2] ? 'again_same' : 'again_diff', { once: false });
    }
    if (S.runs >= RUNS_TO_END) {
      await ctx.wait(0.6); await voice.say('end'); go('over'); await ctx.wait(1.2);
      return ctx.gameOver(choice === 'pulled'
        ? { title: 'You needed him there', text: 'The loop only saves the five because the trolley hits him. On the plain side track, the one was just in the way. Here, he is the plan.' }
        : { title: 'You left the lever', text: 'Five were hit. Pulling would have saved them, but only by using him to stop the trolley.' });
    }
    await ctx.wait(0.6); go('slow');
  }

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -14, z: 6, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.hypot(x, z) < 45 && !(x < PORTAL + 3 && Math.abs(z) < 11),
    blockers: () => {
      const b = [...five.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.5 })), { x: big.position.x, z: big.position.z, r: 0.7 }, { x: lever.position.x, z: lever.position.z, r: 0.5 }, { x: sign.position.x, z: sign.position.z, r: 0.3 }];
      const tp = trolley.position, dir = V(Math.cos(trolley.rotation.y), 0, -Math.sin(trolley.rotation.y));
      for (const k of [-1.4, 0, 1.4]) b.push({ x: tp.x + dir.x * k, z: tp.z + dir.z * k, r: 1.3 });
      return b;
    },
    update(dt, t) {
      S.pt += dt;
      if (S.phase === 'arrive') {
        S.speed = posAt(routeCurve, S.s).x < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) go('slow');
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        if (posAt(routeCurve, S.s).x > -20 && !voice.said.has('ask')) { voice.say('five'); voice.say('one'); voice.say('ask'); }
        if (S.s + 2.2 >= sJunction) { S.committed = S.route; S.lastRoute = S.route; routeCurve = ROUTES[S.route]; voice.stop(); player.enabled = false; go('go'); }
      } else if (S.phase === 'go') {
        S.speed = lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5));
        const end = S.committed === 'loop' ? bigV.s - 2 : arcOf(ROUTES.main, V(24, 0, 0));
        if (S.s > end - (S.committed === 'loop' ? 1.5 : 8)) S.speed = Math.max(0.4, S.speed * Math.exp(-dt * (S.committed === 'loop' ? 7 : 2.2)));
        if (S.s >= end) { S.speed = 0; go('aftermath'); }
      } else if (S.phase === 'aftermath') {
        S.speed = 0;
        if (S.pt > 1.6) { go('rewind'); S.rewindFrom = S.s; }
      } else if (S.phase === 'rewind') {
        const k = easeInOut(S.pt / 2);
        S.s = lerp(S.rewindFrom, RESET_X - START, k);
        if (k >= 1) {
          const c = S.committed; routeCurve = ROUTES.main; S.route = 'main'; S.committed = null;
          victims.forEach(restore); restore(bigV);
          player.enabled = true; go('reflect'); afterRun(c);
        }
      } else S.speed = 0;
      if (S.phase !== 'rewind') S.s += S.speed * dt;

      // trolley on its route
      const L = routeCurve.getLength(), u = clamp(S.s / L, 0, 1);
      const p = routeCurve.getPointAt(u), tan = routeCurve.getTangentAt(u), spd = S.speed / FAST;
      trolley.position.set(p.x, 0.05 * Math.abs(Math.sin(S.s * 2.6)) * spd, p.z);
      trolley.rotation.set(Math.sin(S.s * 2.1) * 0.018 * spd, Math.atan2(-tan.z, tan.x), 0.012 * spd);
      trolley.visible = p.x > PORTAL - 12;
      trolley.userData.wheels.forEach((w) => (w.rotation.z = -S.s / 0.34));

      // hits (and their undoing)
      const hitting = S.phase === 'go' || S.phase === 'aftermath';
      if (hitting && S.committed === 'loop') {
        if (bigV.hitT === null && S.s + 2.3 >= bigV.s) bigV.hitT = 0;
        if (bigV.hitT !== null) { bigV.hitT += dt; knockPose(bigV, Math.min(bigV.hitT, 0.4), { along: 1.2, side: 1.2 }); }
      } else if (hitting) for (const v of victims) {
        if (v.hitT === null && S.s + 2.3 >= v.sMain) v.hitT = 0;
        if (v.hitT !== null) { v.hitT += dt; knockPose(v, v.hitT); }
      } else if (S.phase === 'rewind') {
        const k = 1 - easeInOut(S.pt / 2);
        victims.forEach((v) => v.hitT !== null && knockPose(v, v.hitT * k));
        if (bigV.hitT !== null) knockPose(bigV, Math.min(bigV.hitT, 0.4) * k, { along: 1.2, side: 1.2 });
      }

      // the ghost: what the loop does if nobody is on it (round, back, and into the five from behind)
      ghost.visible = S.ghostT >= 0;
      big.visible = S.ghostT < 0;                         // the ghost shows the loop with nobody on it
      if (S.ghostT >= 0) {
        S.ghostT += dt;
        const gL = ROUTES.loop.getLength(), gs = lerp(sJunction - 10, victims[4].sLoop - 2.2, easeInOut(S.ghostT / 6.5));
        const gp2 = ROUTES.loop.getPointAt(clamp(gs / gL)), gt = ROUTES.loop.getTangentAt(clamp(gs / gL));
        ghost.position.copy(gp2); ghost.rotation.set(0, Math.atan2(-gt.z, gt.x), 0);
        ghost.userData.setOpacity(Math.min(1, S.ghostT / 0.4, (7.4 - S.ghostT) / 0.4));
      }

      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, S.route === 'loop' ? -0.45 : 0.45, 1 - Math.exp(-dt * 10));
      const showRoute = S.phase === 'slow' || S.phase === 'go' ? 0.45 + 0.1 * Math.sin(t * 3) : 0;
      for (const [k, g] of Object.entries(glows)) g.userData.set(1, S.route === k ? showRoute : 0);
      five.forEach((q, i) => { if (!victims[i].base) animatePerson(q, t, { phase: i * 1.3 }); });
      if (!bigV.base) animatePerson(big, t * 0.7, { phase: 2, energy: 0.5 });

      if (S.phase === 'slow' && player.pos.distanceTo(leverSpot) < 12) cameo.start();
      cameo.update(dt);
      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, S.pt / 0.2, (2 - S.pt) / 0.2) : 0, t);
    },
    camera(pl) {
      if (S.phase === 'go' || S.phase === 'aftermath') {
        const pts = [trolley.position.clone(), ...(S.lastRoute === 'loop' ? [big.position.clone(), V(FAR + 2, 0, LOOP_Z / 2)] : [fiveCenter.clone(), V(20, 0, 0)])];
        return { ...frameAll(pts, { margin: 1.25, min: 18 }), stiffness: 2.2 };
      }
      if (S.phase === 'ghost') return { ...frameAll([V(-4, 0, 0), V(FAR + 2, 0, LOOP_Z), fiveCenter.clone(), ghost.position.clone()], { min: 22 }), stiffness: 1.8 };
      const pts = [pl.pos.clone(), trolley.position.clone().setX(Math.max(trolley.position.x, PORTAL + 2)), leverSpot, fiveCenter, big.position.clone(), V(FAR + 1, 0, LOOP_Z / 2)];
      return { ...frameAll(pts), stiffness: S.phase === 'rewind' ? 1.5 : 2.4 };
    },
    dispose() { voice.stop(); ctx.ui.rewind(0); },
  });
}
