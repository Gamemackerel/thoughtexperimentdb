// Vignette: The Loop.
// Left alone, the trolley hits the five, and they stop it. The lever sends it round a loop into one very large man
// instead: his weight stops it, but he'd have been fine if you'd left it. A ghost trolley shows each way once, then the
// real one runs, once, and it ends.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, ghostify,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makeTunnel, makeLever, makePathGlow, makeTree, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeRide, placeTrolley, makeFrameAll, knockPose, slowly } from '../core/trolley-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const JUNCTION = -4, PORTAL = -50, START = -62, SLOW_AT = -32;
const FAST = 9;
const FASTQ = new URLSearchParams(location.search).get('fast');
const CREEP = FASTQ !== null ? Number(FASTQ) || 3 : 0.55;
const LOOP_Z = -8, FAR = 27;
const NOSE = 2.45;                                  // from the trolley's middle to its bumper
const GHOST_RUN = 2.6, GHOST_HOLD = 0.9;            // a ghost's run, and how long it rests against them before fading
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
  const ride = makeRide(root, trolley, { fast: FAST, portal: PORTAL });
  const ghost = ghostify(trolley, palette.many, 0.55); ghost.visible = false; root.add(ghost);
  ghost.userData.wheels = trolley.userData.wheels.map((w) => ghost.children[trolley.children.indexOf(w)]);   // so they turn
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
  // phases: arrive → show (a ghost down each track) → slow (choose) → go (runs) → aftermath (hold) → over
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, route: 'main', committed: null, ghostRoute: null, ghostT: -1 };
  const go = (ph) => { S.phase = ph; S.pt = 0; };
  const posAt = (curve, s) => curve.getPointAt(clamp(s / curve.getLength(), 0, 1));
  const arcOf = (curve, p) => { const pts = curve.getSpacedPoints(1200); let b = 0; pts.forEach((q, j) => { if (q.distanceToSquared(p) < pts[b].distanceToSquared(p)) b = j; }); return (b / 1200) * curve.getLength(); };
  const victims = five.map((p, i) => ({ obj: p, side: i % 2 ? 1 : -1, s: arcOf(ROUTES.main, p.position), base: null, hitT: null }));
  const bigV = { obj: big, side: -1, s: arcOf(ROUTES.loop, big.position), base: null, hitT: null };
  // where the trolley comes to rest on each route: the five bring it up short among them; he stops it on his own
  const STOP = { main: victims[4].s - NOSE + 0.3, loop: bigV.s - NOSE + 0.8 };
  const BRAKE = { main: victims[0].s - NOSE, loop: bigV.s - NOSE };   // first contact: it brakes from here
  const sJunction = JUNCTION - START;
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/loop-track.json', 'The Loop');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: leverSpot, radius: 2.8, height: 2.4, prompt: () => (S.phase !== 'slow' ? 'Not yet' : S.route === 'loop' ? 'Put the lever back' : 'Pull the lever'),
    enabled: () => ['arrive', 'show', 'slow'].includes(S.phase),
    onUse: () => { if (S.phase === 'slow') S.route = S.route === 'loop' ? 'main' : 'loop'; } });
  const standing = (v) => () => !v.base && ['arrive', 'show', 'slow'].includes(S.phase);
  const speak = (lines) => (i) => slowly(lines[i % lines.length]);
  talk(ctx, { who: big, enabled: standing(bigV), lines: speak(['Nobody ever uses this bit of line.', "I'm on my break. It's quiet on the loop.", 'I go round it every day. It always comes back.']) });
  five.forEach((p, k) => talk(ctx, { who: p, enabled: standing(victims[k]), lines: speak([['Nearly done.'], ['Tea at four.'], ['Is that a bell?'], ['Lovely day.'], ['Mind the rails.']][k]) }));
  look(ctx, { pos: sign.position, radius: 2, height: 2.8, prompt: 'Read the sign', lines: ['sign'], enabled: () => S.phase !== 'go' && S.phase !== 'aftermath' && S.phase !== 'over' });

  // the opening: one line, then a ghost down each track (it rests against whoever stops it), then the question
  async function show() {
    while (voice.busy) await ctx.wait(0.1);
    const ghostRun = async (route) => { ghost.userData.ghostMat.color.set(palette[route === 'loop' ? 'one' : 'many']); ghost.userData.ghostMat.emissive.set(palette[route === 'loop' ? 'one' : 'many']); S.ghostRoute = route; S.ghostT = 0; await ctx.wait(GHOST_RUN + GHOST_HOLD + 0.4); S.ghostT = -1; S.ghostRoute = null; };
    await ghostRun('main');
    const told = voice.say('loop');
    await ctx.wait(1.6); await ghostRun('loop'); await told;
    go('slow');
    await voice.say('ask');
  }
  async function afterRun(c) {
    save.complete('loop-track');
    await ctx.wait(0.8);
    await voice.say(c === 'loop' ? 'pulled' : 'stayed');
    await ctx.wait(1.0);
    ctx.gameOver(c === 'loop'
      ? { title: 'You needed him there', text: 'He stopped the trolley, and the five are safe. But he was only in its way because you sent it to him.' }
      : { title: 'You left the lever', text: 'The five stopped the trolley. He was never in its way, and you left it that way.' });
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
      const routeCurve = ROUTES[S.committed ?? 'main'];
      if (S.phase === 'arrive') {
        S.speed = posAt(routeCurve, S.s).x < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) { go('show'); show(); }
      } else if (S.phase === 'show') {
        S.speed = lerp(S.speed, Math.min(CREEP, 0.55), 1 - Math.exp(-dt * 2));   // it waits for the ghosts
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        if (S.s + 2.2 >= sJunction) { S.committed = S.route; voice.stop(); player.enabled = false; go('go'); }
      } else if (S.phase === 'go') {
        const c = S.committed, rem = STOP[c] - S.s;
        S.speed = S.s < BRAKE[c] ? lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5))
          : Math.min(S.speed, FAST * Math.sqrt(Math.max(0, rem) / (STOP[c] - BRAKE[c])) + 0.25);   // brought up short
        if (rem <= 0) { S.speed = 0; go('aftermath'); }
      } else if (S.phase === 'aftermath') {
        S.speed = 0;
        if (S.pt > 1.4) { go('over'); afterRun(S.committed); }
      } else S.speed = 0;
      S.s += S.speed * dt;
      ride(ROUTES[S.committed ?? 'main'], S.s, S.speed);

      // hits
      if (S.committed === 'loop') {
        if (bigV.hitT === null && S.s + NOSE >= bigV.s) bigV.hitT = 0;
        if (bigV.hitT !== null) { bigV.hitT += dt; knockPose(bigV, Math.min(bigV.hitT, 0.4), { along: 1.2, side: 1.2 }); }
      } else if (S.committed === 'main') for (const v of victims) {
        if (v.hitT === null && S.s + NOSE >= v.s) v.hitT = 0;
        if (v.hitT !== null) { v.hitT += dt; knockPose(v, Math.min(v.hitT, 0.6), { along: 1.6, side: 2.2 }); }
      }

      // the ghost: runs down one track and stops against whoever is on it, then fades
      if (S.ghostT >= 0) {
        S.ghostT += dt;
        const r = ROUTES[S.ghostRoute], s0 = sJunction - 10, u = clamp(S.ghostT / GHOST_RUN);
        const gs = lerp(s0, STOP[S.ghostRoute], 1 - Math.pow(1 - u, 2));
        placeTrolley(ghost, r, gs, (1 - u) * 0.8, PORTAL);
        ghost.userData.setOpacity(Math.min(1, S.ghostT / 0.3, (GHOST_RUN + GHOST_HOLD + 0.3 - S.ghostT) / 0.3));
      } else ghost.visible = false;

      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, S.route === 'loop' ? -0.45 : 0.45, 1 - Math.exp(-dt * 10));
      const pulse = 0.45 + 0.1 * Math.sin(t * 3);
      const lit = S.phase === 'show' ? S.ghostRoute : S.phase === 'slow' || S.phase === 'go' ? S.route : null;
      for (const [k, g] of Object.entries(glows)) g.userData.set(1, lit === k ? pulse : 0);
      five.forEach((q, i) => { if (!victims[i].base) animatePerson(q, t, { phase: i * 1.3 }); });
      if (!bigV.base) animatePerson(big, t * 0.7, { phase: 2, energy: 0.5 });

      if (S.phase === 'slow' && player.pos.distanceTo(leverSpot) < 12) cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      if (S.phase === 'go' || S.phase === 'aftermath' || S.phase === 'over') {
        const pts = [trolley.position.clone(), ...(S.committed === 'loop' ? [big.position.clone(), V(FAR + 2, 0, LOOP_Z / 2)] : [fiveCenter.clone(), V(20, 0, 0)])];
        return { ...frameAll(pts, { margin: 1.25, min: 18 }), stiffness: 2.2 };
      }
      const pts = [pl.pos.clone(), trolley.position.clone().setX(Math.max(trolley.position.x, PORTAL + 2)), leverSpot, fiveCenter, big.position.clone(), V(FAR + 1, 0, LOOP_Z / 2)];
      return { ...frameAll(pts), stiffness: 2.4 };
    },
    dispose() { voice.stop(); },
  });
}
