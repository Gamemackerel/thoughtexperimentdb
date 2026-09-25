// Vignette: The Trolley Problem. You arrive by the tracks; time slows; the lever is yours to pull, or not.
import {
  THREE, palette, clamp, lerp, easeInOut, ramp, seeded, clay, mesh, setOpacity,
  makeIsland, makePerson, animatePerson, makeTrolley, makeTrack, makePathGlow, makeLever, makeTunnel,
  makeEmitter, ghostify, makeFrog, animateFrog,
} from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const line = (a, b) => new THREE.LineCurve3(a, b);
const bez = (a, b, c, d) => new THREE.CubicBezierCurve3(a, b, c, d);
const path = (...parts) => { const p = new THREE.CurvePath(); parts.forEach((c) => p.add(c)); return p; };

const JUNCTION = -4, PORTAL = -50, START = -62;
const FAST = 9;                        // trolley speed arriving (units/s)
const CREEP = new URLSearchParams(location.search).has('fast') ? 3 : 0.55;   // in slowed time: ~50 s to act (?fast for testing)
const SLOW_AT = -32;                   // where time slows down (trolley x)
const RESET_X = -16;                   // after a rewind the trolley waits here
const turn = (z) => bez(V(JUNCTION, 0, 0), V(2, 0, 0), V(4, 0, z), V(10, 0, z));

export default function trolley(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 160);
  voice.load('trolley-problem');

  // ================================================================ world
  root.add(makeIsland({ radius: 50, seed: 3 }));
  const mainCurve = line(V(START, 0, 0), V(34, 0, 0));
  const branchCurve = path(line(V(START, 0, 0), V(JUNCTION, 0, 0)), turn(-7), line(V(10, 0, -7), V(34, 0, -7)));
  const selfCurve = path(turn(7), line(V(10, 0, 7), V(24, 0, 7)));
  root.add(makeTrack(mainCurve), makeTrack(path(turn(-7), line(V(10, 0, -7), V(34, 0, -7)))));
  const selfTrack = makeTrack(selfCurve);
  root.add(selfTrack);
  const tunnel = makeTunnel(); tunnel.position.x = PORTAL; root.add(tunnel);

  const lead = line(V(-12, 0, 0), V(JUNCTION, 0, 0));
  const mainGlow = makePathGlow(path(lead, line(V(JUNCTION, 0, 0), V(18.5, 0, 0))), palette.many);
  const branchGlow = makePathGlow(path(lead, turn(-7), line(V(10, 0, -7), V(15, 0, -7))), palette.one);
  root.add(mainGlow, branchGlow);

  const trolley = makeTrolley();
  const drv = trolley.userData.driver;
  drv.userData.body.rotation.x = 0.55; drv.userData.body.rotation.z = 0.25;   // the driver has fainted
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

  const youGhost = ghostify(makePerson({ color: palette.agent }), palette.agent, 0.6);
  youGhost.position.set(14, 0, 7); youGhost.rotation.y = -0.3; root.add(youGhost);

  // the way home: a gilded frame that appears once you've made a choice
  const gold = clay(0xc9a54c, { metalness: 0.45, roughness: 0.4 });
  const frame = new THREE.Group();
  for (const [x, y, w, h] of [[0, 3.1, 2.4, 0.22], [0, 0.1, 2.4, 0.22], [-1.1, 1.6, 0.22, 3.2], [1.1, 1.6, 0.22, 3.2]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.2), gold); b.position.set(x, y, 0); frame.add(b); }
  const portalGlow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.85 }));
  portalGlow.position.y = 1.6; frame.add(portalGlow);
  frame.position.set(-19, 0, 10); frame.rotation.y = 0.5; root.add(frame);

  const frog = makeFrog(); root.add(frog);
  // crosses the rails behind the lever, between you and the junction
  const FROG_PATH = [[-15, 0, -4.5], [-13, 0, -3.2], [-11, 0, -2], [-9, 0, -0.6], [-7, 0, 0.8], [-5, 0, -0.6], [-3, 0, -2.2], [-1, 0, -3.8], [1, 0, -5.4]];

  // ---- wheel sparks and dust, on the trolley's own travel clock (so they freeze and rewind with it)
  let routeCurve = mainCurve;
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

  // victims' arc positions on each route
  const arcOf = (curve, p) => { const pts = curve.getSpacedPoints(800); let b = 0; pts.forEach((q, j) => { if (q.distanceToSquared(p) < pts[b].distanceToSquared(p)) b = j; }); return (b / 800) * curve.getLength(); };
  const hitMain = arcOf(mainCurve, five[0].position) - 4.2;     // freeze a breath before impact
  const hitBranch = arcOf(branchCurve, one.position) - 4.2;
  const sJunction = JUNCTION - START;

  // ================================================================ state
  const S = { phase: 'arrive', pt: 0, s: PORTAL - START - 6, speed: FAST, pulled: false, route: null, runs: 0, choices: [], seen: new Set(), frogDone: false, frogT: -1, twistOn: 0, frameOn: 0, rewindFrom: 0 };
  const go = (phase) => { S.phase = phase; S.pt = 0; };

  interact.add({
    pos: leverSpot, radius: 2.8, height: 2.4,
    prompt: () => (S.pulled ? 'Put the lever back' : 'Pull the lever'),
    enabled: () => S.phase === 'slow',
    onUse: () => { S.pulled = !S.pulled; },
  });
  interact.add({
    pos: () => frame.position, radius: 2.4, height: 3.6, prompt: 'Step back through the frame',
    enabled: () => S.frameOn > 0.9 && S.phase === 'slow',
    onUse: () => ctx.goto('house'),
  });
  // discovery: walk up to things
  interact.trigger({ pos: fiveCenter, radius: 9, when: () => S.phase === 'slow' || S.phase === 'arrive', onEnter: () => { S.seen.add('five'); voice.say('five'); } });
  interact.trigger({ pos: one.position, radius: 8, when: () => S.phase === 'slow' || S.phase === 'arrive', onEnter: () => { S.seen.add('one'); voice.say('one'); } });
  interact.trigger({ pos: leverSpot, radius: 4.5, when: () => S.phase === 'slow', onEnter: () => voice.say('lever') });

  // notebook: the scholarship lives here, never in the narration
  const level = { root, ground: [], notebook: '' };
  fetch('/experiments/trolley-problem/script.json').then((r) => r.json()).then((sc) => {
    const p = sc.publish;
    level.notebook = `<h2>The Trolley Problem</h2><p>${p.summary.split('\n\n')[1]}</p>
      <h3>Where it comes from</h3><ul>${p.citations.map((c) => `<li>${c}</li>`).join('')}</ul>
      <h3>Go deeper</h3><ul><li><a href="${p.essay.url}" target="_blank">${p.essay.creator}, “${p.essay.title}”</a></li>${(p.also ?? []).map((a) => `<li><a href="${a.url}" target="_blank">${a.creator}, “${a.title}”</a></li>`).join('')}</ul>
      <h3>Read</h3><ul>${p.reading.map((c) => `<li>${c}</li>`).join('')}</ul>`;
  }).catch(() => {});
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; root.add(groundPlane); level.ground.push(groundPlane);

  // after the consequence: what you did, then (first time) the third track, then the way home
  async function reflect() {
    const choice = S.pulled ? 'pulled' : 'stayed';
    S.choices.push(choice);
    S.runs++;
    await ctx.wait(0.8);
    if (S.runs === 1) {
      await voice.say(choice + '_1'); await voice.say(choice + '_2');
      save.complete('trolley-problem');
      go('twist'); await ctx.wait(1.2);
      await voice.say('twist_1'); await ctx.wait(0.6); await voice.say('twist_2');
      await ctx.wait(2.5);
    } else {
      const again = S.choices[S.runs - 1] === S.choices[S.runs - 2] ? 'again_same' : 'again_diff';
      await voice.say(choice + '_1', { once: false }); await voice.say(again, { once: false });
    }
    go('untwist');
    await voice.say('leave', { once: S.runs > 1 });
    S.s = RESET_X - START; routeCurve = mainCurve;
    go('slow');
  }

  // ================================================================ update / camera
  return Object.assign(level, {
    spawn: { x: -17, z: 7, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.hypot(x, z) < 45 && !(x < PORTAL + 3 && Math.abs(z) < 11),
    blockers: () => {
      const b = [...five.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.5 })), { x: one.position.x, z: one.position.z, r: 0.5 }, { x: lever.position.x, z: lever.position.z, r: 0.5 }];
      const tp = trolley.position, dir = V(Math.cos(trolley.rotation.y), 0, -Math.sin(trolley.rotation.y));
      for (const k of [-1.4, 0, 1.4]) b.push({ x: tp.x + dir.x * k, z: tp.z + dir.z * k, r: 1.3 });
      if (S.frameOn > 0.5) b.push({ x: frame.position.x, z: frame.position.z, r: 0.4 });
      return b;
    },
    start() { setTimeout(() => voice.say('arrive'), 900); },

    update(dt, t) {
      S.pt += dt;
      // ---- trolley motion by phase
      if (S.phase === 'arrive') {
        const x = posAt(S.s).x;
        S.speed = x < SLOW_AT ? FAST : lerp(S.speed, CREEP, 1 - Math.exp(-dt * 1.4));
        if (S.speed < CREEP * 1.3) go('slow');
      } else if (S.phase === 'slow') {
        S.speed = lerp(S.speed, CREEP, 1 - Math.exp(-dt * 2));
        // stakes must be known before the question
        if (posAt(S.s).x > -20 && !voice.said.has('ask')) {
          if (!S.seen.has('five')) { S.seen.add('five'); voice.say('five'); }
          if (!S.seen.has('one')) { S.seen.add('one'); voice.say('one'); }
          voice.say('ask');
        }
        if (S.s + 2.2 >= sJunction) { routeCurve = S.pulled ? branchCurve : mainCurve; S.route = S.pulled ? 'branch' : 'main'; go('go'); player.enabled = false; voice.stop(); }
      } else if (S.phase === 'go') {
        S.speed = lerp(S.speed, FAST, 1 - Math.exp(-dt * 2.5));
        if (S.s >= (S.route === 'branch' ? hitBranch : hitMain)) { go('freeze'); S.speed = 0; }
      } else if (S.phase === 'freeze') {
        S.speed = 0;
        if (S.pt > 1.8) { go('rewind'); S.rewindFrom = S.s; }
      } else if (S.phase === 'rewind') {
        const k = easeInOut(S.pt / 1.8);
        S.s = lerp(S.rewindFrom, RESET_X - START, k);
        if (k >= 1) { routeCurve = mainCurve; go('reflect'); player.enabled = true; reflect(); }
      } else {
        S.speed = 0;   // reflect / twist / untwist: the trolley waits
      }
      if (S.phase !== 'rewind') S.s += S.speed * dt;

      // ---- place the trolley along its route
      const L = routeCurve.getLength(), u = clamp(S.s / L, 0, 1);
      const p = routeCurve.getPointAt(u), tan = routeCurve.getTangentAt(u);
      const spd = S.speed / FAST;
      trolley.position.set(p.x, 0.05 * Math.abs(Math.sin(S.s * 2.6)) * spd, p.z);
      trolley.rotation.set(Math.sin(S.s * 2.1) * 0.018 * spd, Math.atan2(-tan.z, tan.x), 0.012 * spd);
      trolley.visible = p.x > PORTAL - 12;
      trolley.userData.wheels.forEach((w) => (w.rotation.z = -S.s / 0.34));
      const clock = Math.max(0, S.s / FAST);
      sparks.userData.update(clock, S.phase === 'reflect' || S.phase === 'twist' ? 0 : 1);
      dust.userData.update(clock, 1);

      // ---- the lever and the route it sets
      const want = S.pulled ? 0.9 : 0;
      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, 0.45 - want * 1.0, 1 - Math.exp(-dt * 10));
      const showRoute = S.phase === 'slow' ? 0.45 + 0.1 * Math.sin(t * 3) : 0;
      mainGlow.userData.set(1, S.pulled ? 0 : showRoute);
      branchGlow.userData.set(1, S.pulled ? showRoute : 0);

      // ---- people
      five.forEach((q, i) => animatePerson(q, t, { phase: i * 1.3 }));
      animatePerson(one, t, { phase: 2.1 });

      // ---- the third track (first reflection only)
      S.twistOn = lerp(S.twistOn, S.phase === 'twist' ? 1 : 0, 1 - Math.exp(-dt * 2));
      setOpacity(selfTrack, S.twistOn); selfTrack.position.y = (1 - S.twistOn) * -0.6;
      youGhost.userData.setOpacity(S.twistOn);
      animatePerson(youGhost, t, { phase: 1.7 });

      // ---- the frame home
      S.frameOn = lerp(S.frameOn, S.runs > 0 ? 1 : 0, 1 - Math.exp(-dt * 1.5));
      frame.visible = S.frameOn > 0.01; frame.scale.setScalar(Math.max(0.001, S.frameOn));
      portalGlow.material.opacity = 0.6 + 0.25 * Math.sin(t * 2.2);

      // ---- the frog: once, in the first slowed moment, near the lever
      if (!S.frogDone && S.phase === 'slow' && S.frogT < 0 && player.pos.distanceTo(leverSpot) < 12) S.frogT = 0;
      if (S.frogT >= 0 && !S.frogDone) { S.frogT += dt; if (S.frogT > FROG_PATH.length * 1.3 + 1 || S.phase !== 'slow') S.frogDone = true; }   // one scene only
      frog.visible = S.frogT >= 0 && !S.frogDone;
      if (frog.visible) animateFrog(frog, S.frogT, FROG_PATH, { loop: false });

      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, S.pt / 0.2, (1.8 - S.pt) / 0.2) : 0, t);
    },

    camera(pl) {
      const tp = trolley.position;
      if (S.phase === 'go' || S.phase === 'freeze') {
        const tgt = S.route === 'branch' ? one.position : fiveCenter;
        const from = S.route === 'branch' ? V(21, 2.6, -1.8) : V(24, 3.4, 9.5);
        return { pos: from, look: tp.clone().lerp(tgt, 0.35).add(V(0, 1.2, 0)), stiffness: S.phase === 'freeze' ? 1.5 : 2.5 };
      }
      if (S.phase === 'rewind') return { pos: V(-8, 22, 28), look: V(2, 0, -2), stiffness: 2 };
      if (S.phase === 'twist') return { pos: V(-8, 25, 33), look: V(3, 0, 0), stiffness: 1.2 };
      if (S.phase === 'reflect' || S.phase === 'untwist') return { pos: V(-10, 17, 25), look: V(2, 0, -1), stiffness: 1.2 };
      // exploring: follow you, leaning towards the junction so the dilemma stays in view
      const look = pl.pos.clone().lerp(V(-1, 0, -1), 0.35).add(V(0, 1.2, 0));
      return { pos: look.clone().add(V(-3.5, 8.5, 13)), look, stiffness: S.phase === 'arrive' ? 2 : 3 };
    },

    dispose() { voice.stop(); ctx.ui.rewind(0); },
  });
}
