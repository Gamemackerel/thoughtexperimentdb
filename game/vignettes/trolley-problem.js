// Vignette: The Trolley Problem.
// You arrive by the tracks; time slows; the lever is yours to pull, or not. The trolley runs through, shows what your
// choice did, then rewinds. After the first run a third track appears, with its own lever: send the trolley to yourself
// and it's over. Otherwise, after three runs, it ends anyway.
import {
  THREE, palette, clamp, lerp, easeOut, easeInOut, seeded, clay, mesh, setOpacity,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makePathGlow, makeLever, makeTunnel,
  makeEmitter, makeFrog, animateFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const line = (a, b) => new THREE.LineCurve3(a, b);
const bez = (a, b, c, d) => new THREE.CubicBezierCurve3(a, b, c, d);
const path = (...parts) => { const p = new THREE.CurvePath(); parts.forEach((c) => p.add(c)); return p; };

const JUNCTION = -4, PORTAL = -50, START = -62;
const FAST = 9;                                   // trolley speed when time runs normally (units/s)
const FASTQ = new URLSearchParams(location.search).get('fast');
const CREEP = FASTQ !== null ? Number(FASTQ) || 3 : 0.55;   // slowed time: ~50 s to act (?fast=<speed> for testing)
const SLOW_AT = -32;                              // where time slows (trolley x)
const RESET_X = -16;                              // after a rewind the trolley waits here
const RUNS_TO_END = 3;                            // completed runs before the vignette ends
const SELF_SPOT = V(18, 0, 7);                    // where you stand if you choose yourself
const SELF_LEVER = V(18, 0, 9.4);
const turn = (z) => bez(V(JUNCTION, 0, 0), V(2, 0, 0), V(4, 0, z), V(10, 0, z));
const approach = line(V(START, 0, 0), V(JUNCTION, 0, 0));

export default function trolley(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 70, 190);
  voice.load('trolley-problem');

  // ================================================================ world
  root.add(makeIsland({ radius: 50, seed: 3 }));
  const ROUTES = {
    main: line(V(START, 0, 0), V(34, 0, 0)),
    branch: path(approach, turn(-7), line(V(10, 0, -7), V(34, 0, -7))),
    self: path(approach, turn(7), line(V(10, 0, 7), V(26, 0, 7))),
  };
  root.add(makeTrack(ROUTES.main), makeTrack(path(turn(-7), line(V(10, 0, -7), V(34, 0, -7)))));
  const selfTrack = makeTrack(path(turn(7), line(V(10, 0, 7), V(26, 0, 7))));
  root.add(selfTrack);
  const tunnel = makeTunnel(); tunnel.position.x = PORTAL; root.add(tunnel);

  const lead = line(V(-12, 0, 0), V(JUNCTION, 0, 0));
  const glows = {
    main: makePathGlow(path(lead, line(V(JUNCTION, 0, 0), V(18.5, 0, 0))), palette.many),
    branch: makePathGlow(path(lead, turn(-7), line(V(10, 0, -7), V(15, 0, -7))), palette.one),
    self: makePathGlow(path(lead, turn(7), line(V(10, 0, 7), V(19, 0, 7))), palette.agent),
  };
  Object.values(glows).forEach((g) => root.add(g));

  const trolley = makeTrolley();
  const drv = trolley.userData.driver;
  drv.userData.body.rotation.x = 0.55; drv.userData.body.rotation.z = 0.25;      // the driver has fainted
  root.add(trolley);

  const rnd = seeded(11), five = [];
  for (let i = 0; i < 5; i++) {
    const p = makePerson({ color: palette.many, hat: true });
    p.position.set(11.5 + i * 1.5, 0, (rnd() - 0.5) * 0.6); p.rotation.y = -0.5 + rnd() * 0.5;
    five.push(p); root.add(p);
  }
  const fiveCenter = V(14.5, 0, 0);
  const one = makePerson({ color: palette.one, hat: true });
  one.position.set(14, 0, -7); one.rotation.y = -0.3; root.add(one);
  const lever = makeLever(); lever.position.set(-7.2, 0, 2.7); lever.rotation.y = Math.PI / 2; root.add(lever);
  const leverSpot = V(-7.2, 0, 3.8);

  // the third track's lever (teal knob: this one is yours), and a ring marking where you'd stand
  const selfLever = makeLever(); selfLever.position.copy(SELF_LEVER); selfLever.rotation.y = Math.PI / 2;
  selfLever.userData.pivot.children[1].material = clay(palette.agent);
  root.add(selfLever);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.95, 40), new THREE.MeshBasicMaterial({ color: palette.agent, transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.copy(SELF_SPOT).setY(0.33); root.add(ring);

  // the way home: a gilded frame that appears once you've seen a run through
  const gold = clay(0xc9a54c, { metalness: 0.45, roughness: 0.4 });
  const frame = new THREE.Group();
  for (const [x, y, w, h] of [[0, 3.1, 2.4, 0.22], [0, 0.1, 2.4, 0.22], [-1.1, 1.6, 0.22, 3.2], [1.1, 1.6, 0.22, 3.2]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.2), gold); b.position.set(x, y, 0); frame.add(b); }
  const portalGlow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.85 }));
  portalGlow.position.y = 1.6; frame.add(portalGlow);
  frame.position.set(-19, 0, 10); frame.rotation.y = 0.5; root.add(frame);

  const frog = makeFrog(); root.add(frog);
  const FROG_PATH = [[-15, 0, -4.5], [-13, 0, -3.2], [-11, 0, -2], [-9, 0, -0.6], [-7, 0, 0.8], [-5, 0, -0.6], [-3, 0, -2.2], [-1, 0, -3.8], [1, 0, -5.4]];

  // ---- sparks and dust ride the trolley's own travel clock (so they freeze and rewind with it)
  let routeCurve = ROUTES.main;
  const posAt = (s) => routeCurve.getPointAt(clamp(s / routeCurve.getLength(), 0, 1));
  const sparks = makeEmitter({
    rate: 60, life: 0.4, max: 48, seed: 1, geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshStandardMaterial({ color: 0xffd07a, emissive: 0xff9a3d, emissiveIntensity: 3 }),
    spawn: (n, b, age, r) => {
      const T = posAt(b * FAST); if (T.x < PORTAL + 1) return null;
      const wz = r() < 0.5 ? -0.7 : 0.7, vx = -1.5 - r() * 4, vy = 1.5 + r() * 3, vz = wz * (1 + r() * 3);
      const y = 0.15 + vy * age - 4.9 * age * age; if (y < 0) return null;
      return { x: T.x + (r() < 0.5 ? -1.4 : 1.4) + vx * age, y, z: T.z + wz + vz * age, s: 0.06, sx: 4, ry: Math.atan2(-vz, vx) };
    },
  });
  const dust = makeEmitter({
    rate: 26, life: 1.4, max: 40, seed: 2, geometry: new THREE.SphereGeometry(1, 12, 8), material: clay(0xf4ecdf, { roughness: 1 }),
    spawn: (n, b, age, r) => {
      const T = posAt(b * FAST); if (T.x < PORTAL + 1) return null;
      const d = (1 - Math.exp(-2.2 * age)) / 2.2, k = age / 1.4;
      return { x: T.x - 1.6 - (1.5 + r() * 2) * d, y: 0.25 + (0.8 + r()) * d, z: T.z + (r() - 0.5) * 2.2, s: (0.13 + k * 0.45) * (1 - k * k) };
    },
  });
  root.add(sparks, dust);

  // ---- who is on each route, where along it, and which way they'd be knocked (away from the other tracks)
  const arcOf = (curve, p) => { const pts = curve.getSpacedPoints(900); let b = 0; pts.forEach((q, j) => { if (q.distanceToSquared(p) < pts[b].distanceToSquared(p)) b = j; }); return (b / 900) * curve.getLength(); };
  const victim = (obj, route, side) => ({ obj, s: arcOf(ROUTES[route], obj.position), side, base: null, hitT: null });
  const victims = {
    main: five.map((p, i) => victim(p, 'main', i % 2 ? 1 : -1)),
    branch: [victim(one, 'branch', -1)],
    self: [{ obj: player.obj, s: arcOf(ROUTES.self, SELF_SPOT), side: 1, base: null, hitT: null }],
  };
  const endOf = { main: arcOf(ROUTES.main, V(30, 0, 0)), branch: arcOf(ROUTES.branch, V(30, 0, -7)), self: arcOf(ROUTES.self, V(24, 0, 7)) };
  const sJunction = JUNCTION - START;

  function knockPose(v, h) {
    if (!v.base) v.base = { p: v.obj.position.clone(), r: v.obj.rotation.clone() };
    const k = easeOut(h / 0.5), m = easeOut(h / 0.9);
    v.obj.position.set(v.base.p.x + 4.5 * m, 1.9 * Math.sin(Math.PI * clamp(h / 0.7)) + 0.34 * k, v.base.p.z + v.side * 3.4 * m);
    v.obj.rotation.set(v.side * (Math.PI / 2) * k, v.base.r.y + 1.4 * k * v.side, 0);
  }
  function restore(v) { if (v.base) { v.obj.position.copy(v.base.p); v.obj.rotation.copy(v.base.r); } v.base = null; v.hitT = null; }

  // ================================================================ state
  // phases: arrive → slow (choose) → go (runs through) → aftermath (hold) → rewind → reflect/twist → slow … → over
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, route: 'main', committed: null, runs: 0, choices: [],
    seen: new Set(), twist: false, frogT: -1, frogDone: false, rewindFrom: 0, frameOn: 0, twistOn: 0 };
  const go = (phase) => { S.phase = phase; S.pt = 0; };
  const selfChosen = () => S.route === 'self';

  interact.add({
    pos: leverSpot, radius: 2.8, height: 2.4,
    prompt: () => (S.route === 'branch' ? 'Put the lever back' : 'Pull the lever'),
    enabled: () => S.phase === 'slow' && !selfChosen(),
    onUse: () => { S.route = S.route === 'branch' ? 'main' : 'branch'; },
  });
  interact.add({
    pos: SELF_LEVER, radius: 2.6, height: 2.4, prompt: 'Pull this lever',
    enabled: () => S.phase === 'slow' && S.twist && !selfChosen(),
    onUse: () => {
      S.route = 'self';
      player.locked = true;                         // you walk onto the track, and stay there
      player.target = SELF_SPOT.clone();
      voice.say('self_pull');
    },
  });
  interact.add({
    pos: () => frame.position, radius: 2.4, height: 3.6, prompt: 'Step back through the frame',
    enabled: () => S.frameOn > 0.9 && S.phase === 'slow' && !selfChosen(),
    onUse: () => ctx.goto('house'),
  });
  interact.trigger({ pos: fiveCenter, radius: 9, when: () => S.phase === 'slow' || S.phase === 'arrive', onEnter: () => { S.seen.add('five'); voice.say('five'); } });
  interact.trigger({ pos: one.position, radius: 8, when: () => S.phase === 'slow' || S.phase === 'arrive', onEnter: () => { S.seen.add('one'); voice.say('one'); } });
  interact.trigger({ pos: leverSpot, radius: 4.5, when: () => S.phase === 'slow', onEnter: () => voice.say('lever') });

  // notebook (the scholarship lives here, never in the voice)
  const level = { root, ground: [], notebook: '', __S: null };
  loadNotebook(level, '/experiments/trolley-problem/script.json', 'The Trolley Problem');
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; root.add(groundPlane); level.ground.push(groundPlane);

  // ---- after a run: what you did, the third track (first time), and the ending (third time)
  async function afterRun(committed) {
    const choice = committed === 'branch' ? 'pulled' : 'stayed';
    S.choices.push(choice); S.runs++;
    save.complete('trolley-problem');
    await ctx.wait(0.6);
    if (S.runs === 1) {
      await voice.say(choice + '_1'); await voice.say(choice + '_2');
      S.twist = true; go('twist');
      await ctx.wait(1.4);
      await voice.say('twist_1'); await ctx.wait(0.5); await voice.say('twist_2');
      await ctx.wait(1.2);
    } else {
      const again = S.choices[S.runs - 1] === S.choices[S.runs - 2] ? 'again_same' : 'again_diff';
      await voice.say(choice + '_1', { once: false }); await voice.say(again, { once: false });
    }
    if (S.runs >= RUNS_TO_END) {
      await ctx.wait(0.6); await voice.say('end');
      go('over'); await ctx.wait(1.2);
      return ctx.gameOver({ title: 'Someone is always on the track', text: `You ran it ${S.runs} times. Nobody could stop the trolley. You only decided where it went.` });
    }
    await voice.say('leave', { once: S.runs > 1 });
    go('slow');
  }
  async function afterSelf() {
    go('over');
    await ctx.wait(1.4); await voice.say('self_end');
    await ctx.wait(0.8);
    ctx.gameOver({ title: 'You chose yourself', text: 'The five walk away. So does the one. The trolley only needed someone on the track.' });
  }

  // ---- camera: keep you, the trolley, the lever and everyone at risk in frame, from one steady angle
  // Fit the camera exactly: every point must sit inside the frame horizontally and vertically (with margin).
  // The view is mostly front-on, so the tracks run across the (wide) screen.
  const VIEW = V(-0.16, 0.62, 0.77).normalize();
  const RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), VIEW).normalize();
  const UPV = new THREE.Vector3().crossVectors(VIEW, RIGHT).normalize();
  const box = new THREE.Box3();
  function frameAll(points, { margin = 1.1, min = 16, max = 80, pad = 2.2 } = {}) {
    box.makeEmpty(); points.forEach((p) => box.expandByPoint(p));
    const c = box.getCenter(V()).setY(1);
    const cam = stage.camera, tv = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / margin, th = tv * cam.aspect;
    let d = min;
    for (const p of points) {
      const q = p.clone().sub(c);
      const x = Math.abs(q.dot(RIGHT)) + pad, y = Math.abs(q.dot(UPV)) + pad, z = q.dot(VIEW);   // z > 0: nearer the camera
      d = Math.max(d, z + x / th, z + y / tv);
    }
    d = Math.min(d, max);
    return { pos: c.clone().addScaledVector(VIEW, d), look: c };
  }

  level.__S = S;   // exposed for automated playtests
  // ================================================================ update / camera
  return Object.assign(level, {
    spawn: { x: -17, z: 7, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.hypot(x, z) < 45 && !(x < PORTAL + 3 && Math.abs(z) < 11),
    blockers: () => {
      const b = [...five.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.5 })), { x: one.position.x, z: one.position.z, r: 0.5 }, { x: lever.position.x, z: lever.position.z, r: 0.5 }];
      if (S.twist) b.push({ x: selfLever.position.x, z: selfLever.position.z, r: 0.5 });
      const tp = trolley.position, dir = V(Math.cos(trolley.rotation.y), 0, -Math.sin(trolley.rotation.y));
      if (!player.locked) for (const k of [-1.4, 0, 1.4]) b.push({ x: tp.x + dir.x * k, z: tp.z + dir.z * k, r: 1.3 });
      if (S.frameOn > 0.5) b.push({ x: frame.position.x, z: frame.position.z, r: 0.4 });
      return b;
    },
    start() { setTimeout(() => voice.say('arrive'), 900); },

    update(dt, t) {
      S.pt += dt;
      // ---- trolley motion by phase
      if (S.phase === 'arrive') {
        S.speed = posAt(S.s).x < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) go('slow');
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        if (posAt(S.s).x > -20 && !voice.said.has('ask') && !S.twist) {
          if (!S.seen.has('five')) { S.seen.add('five'); voice.say('five'); }
          if (!S.seen.has('one')) { S.seen.add('one'); voice.say('one'); }
          voice.say('ask');
        }
        if (S.s + 2.2 >= sJunction) {       // the switch is set: time runs again
          S.committed = S.route; routeCurve = ROUTES[S.route];
          if (!selfChosen()) voice.stop();
          if (selfChosen()) { player.pos.copy(SELF_SPOT); player.obj.rotation.y = -Math.PI / 2; }   // facing the oncoming trolley
          player.enabled = false; go('go');
        }
      } else if (S.phase === 'go') {
        S.speed = lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5));
        const end = endOf[S.committed];
        if (S.s > end - 8) S.speed = Math.max(0.5, S.speed * Math.exp(-dt * 2.2));   // roll to a stop past everyone
        if (S.s >= end) { S.speed = 0; go('aftermath'); }
      } else if (S.phase === 'aftermath') {
        S.speed = 0;
        if (S.pt > 1.6) {
          if (S.committed === 'self') afterSelf();
          else { go('rewind'); S.rewindFrom = S.s; }
        }
      } else if (S.phase === 'rewind') {
        const k = easeInOut(S.pt / 2.0);
        S.s = lerp(S.rewindFrom, RESET_X - START, k);
        if (k >= 1) {
          const committed = S.committed;                                   // remember the choice before resetting
          routeCurve = ROUTES.main; S.route = 'main'; S.committed = null;   // everything, lever included, goes back
          Object.values(victims).flat().forEach(restore);
          player.enabled = true; go('reflect'); afterRun(committed);
        }
      } else {
        S.speed = 0;
      }
      if (S.phase !== 'rewind') S.s += S.speed * dt;

      // ---- trolley placement
      const L = routeCurve.getLength(), u = clamp(S.s / L, 0, 1);
      const p = routeCurve.getPointAt(u), tan = routeCurve.getTangentAt(u);
      const spd = S.speed / FAST;
      trolley.position.set(p.x, 0.05 * Math.abs(Math.sin(S.s * 2.6)) * spd, p.z);
      trolley.rotation.set(Math.sin(S.s * 2.1) * 0.018 * spd, Math.atan2(-tan.z, tan.x), 0.012 * spd);
      trolley.visible = p.x > PORTAL - 12;
      trolley.userData.wheels.forEach((w) => (w.rotation.z = -S.s / 0.34));
      const clock = Math.max(0, S.s / FAST);
      sparks.userData.update(clock, 1);
      dust.userData.update(clock, 1);

      // ---- hits: whoever is on the committed route is knocked away as the trolley reaches them; rewinding undoes it
      const lastRoute = S.committed ?? S.lastRoute;
      if (S.committed) S.lastRoute = S.committed;
      if (lastRoute) for (const v of victims[lastRoute]) {
        if (S.phase === 'go' || S.phase === 'aftermath' || S.phase === 'over') {
          if (v.hitT === null && S.s + 2.3 >= v.s) v.hitT = 0;
          if (v.hitT !== null) { v.hitT += dt; knockPose(v, v.hitT); }
        } else if (S.phase === 'rewind' && v.hitT !== null) {
          knockPose(v, v.hitT * (1 - easeInOut(S.pt / 2.0)));
        }
      }

      // ---- levers, and the route they set
      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, S.route === 'branch' ? -0.45 : 0.45, 1 - Math.exp(-dt * 10));
      selfLever.userData.pivot.rotation.z = lerp(selfLever.userData.pivot.rotation.z, S.route === 'self' ? -0.45 : 0.45, 1 - Math.exp(-dt * 10));
      const showRoute = S.phase === 'slow' || S.phase === 'go' ? 0.45 + 0.1 * Math.sin(t * 3) : 0;
      for (const [k, g] of Object.entries(glows)) g.userData.set(1, S.route === k ? showRoute : 0);

      // ---- people idle (unless flying)
      five.forEach((q, i) => { if (!victims.main[i].base) animatePerson(q, t, { phase: i * 1.3 }); });
      if (!victims.branch[0].base) animatePerson(one, t, { phase: 2.1 });

      // ---- the third track and its lever
      S.twistOn = lerp(S.twistOn, S.twist ? 1 : 0, 1 - Math.exp(-dt * 1.6));
      setOpacity(selfTrack, S.twistOn); selfTrack.position.y = (1 - S.twistOn) * -0.6;
      selfLever.visible = S.twistOn > 0.02; selfLever.scale.setScalar(Math.max(0.001, S.twistOn));
      ring.material.opacity = S.twistOn * (0.5 + 0.3 * Math.sin(t * 3));

      // ---- the frame home
      S.frameOn = lerp(S.frameOn, S.runs > 0 ? 1 : 0, 1 - Math.exp(-dt * 1.5));
      frame.visible = S.frameOn > 0.01; frame.scale.setScalar(Math.max(0.001, S.frameOn));
      portalGlow.material.opacity = 0.6 + 0.25 * Math.sin(t * 2.2);

      // ---- the frog: once, in the first slowed moment, near the lever
      if (!S.frogDone && S.phase === 'slow' && S.frogT < 0 && player.pos.distanceTo(leverSpot) < 12) S.frogT = 0;
      if (S.frogT >= 0 && !S.frogDone) { S.frogT += dt; if (S.frogT > FROG_PATH.length * 1.3 + 1 || S.phase !== 'slow') S.frogDone = true; }
      frog.visible = S.frogT >= 0 && !S.frogDone;
      if (frog.visible) animateFrog(frog, S.frogT, FROG_PATH, { loop: false });

      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, S.pt / 0.2, (2.0 - S.pt) / 0.2) : 0, t);
    },

    camera(pl) {
      if (S.phase === 'go' || S.phase === 'aftermath' || (S.phase === 'over' && S.lastRoute === 'self')) {
        // the run: frame the trolley and whoever is on its route
        const targets = victims[S.lastRoute ?? 'main'].map((v) => (v.base ? v.base.p : v.obj.position).clone());
        return { ...frameAll([trolley.position.clone(), ...targets], { margin: 1.3, min: 16 }), stiffness: 2.2 };
      }
      const pts = [pl.pos.clone(), trolley.position.clone(), leverSpot, fiveCenter, one.position.clone()];
      if (S.twist) pts.push(SELF_SPOT, SELF_LEVER);
      if (S.phase === 'arrive') pts[1].setX(Math.max(pts[1].x, PORTAL + 2));
      return { ...frameAll(pts), stiffness: S.phase === 'rewind' ? 1.5 : 2.4 };
    },

    dispose() { voice.stop(); ctx.ui.rewind(0); player.locked = false; restore(victims.self[0]); },
  });
}
