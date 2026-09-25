// The Trolley Problem — Foot (1967) for context, Thomson's bystander (1976/1985) as the core, Thomson (2008) as coda.
// Every visual is a pure function of t; segment ids come from script.json.
import {
  THREE, palette, css, clamp, lerp, smooth, easeOut, easeInOut, ramp, win, seeded,
  cameraAt, clay, setOpacity, makeIsland, makePerson, animatePerson, makeTrolley,
  makeTrack, makePathGlow, makeLever, makeTunnel, makeEmitter, ghostify, makeFrog, animateFrog,
} from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const line = (a, b) => new THREE.LineCurve3(a, b);
const bez = (a, b, c, d) => new THREE.CubicBezierCurve3(a, b, c, d);
function path(...parts) { const p = new THREE.CurvePath(); parts.forEach((c) => p.add(c)); return p; }

const JUNCTION = -4;
const STOP_X = -13;      // where the trolley "freezes" while we deliberate
const PORTAL_X = -50;    // tunnel mouth the trolley bursts out of
const SPEED = 9;         // trolley speed before the freeze (units/s)
const SLOW = 3;          // seconds to glide from full speed into the freeze-frame
const G_ACC = 14, G_VMAX = 16;  // ghost trolleys: acceleration from the freeze, top speed

export default function build({ stage, ui, tl }) {
  const { scene } = stage;

  // ================================================================ world
  const world = new THREE.Group();
  scene.add(world);
  world.add(makeIsland({ radius: 50, seed: 3 }));

  const turnTo = (z) => [bez(V(JUNCTION, 0, 0), V(2, 0, 0), V(4, 0, z), V(10, 0, z))];
  const mainCurve = line(V(-62, 0, 0), V(34, 0, 0));
  const branchCurve = path(...turnTo(-7), line(V(10, 0, -7), V(34, 0, -7)));
  const selfCurve = path(...turnTo(7), line(V(10, 0, 7), V(24, 0, 7)));
  world.add(makeTrack(mainCurve), makeTrack(branchCurve));
  const selfTrack = makeTrack(selfCurve);
  world.add(selfTrack);

  const lead = line(V(STOP_X + 2.3, 0, 0), V(JUNCTION, 0, 0));
  const mainGlow = makePathGlow(path(lead, line(V(JUNCTION, 0, 0), V(18.5, 0, 0))), palette.many);
  const branchGlow = makePathGlow(path(lead, ...turnTo(-7), line(V(10, 0, -7), V(15, 0, -7))), palette.one);
  const selfGlow = makePathGlow(path(lead, ...turnTo(7), line(V(10, 0, 7), V(15, 0, 7))), palette.agent);
  world.add(mainGlow, branchGlow, selfGlow);

  const trolley = makeTrolley();
  world.add(trolley);

  const rnd = seeded(11);
  const five = [];
  for (let i = 0; i < 5; i++) {
    const p = makePerson({ color: palette.many, hat: true });
    p.position.set(11.5 + i * 1.5, 0, (rnd() - 0.5) * 0.6);
    p.rotation.y = -0.5 + rnd() * 0.5;
    five.push(p); world.add(p);
  }
  const fiveCenter = V(14.5, 0, 0);
  const one = makePerson({ color: palette.one, hat: true });
  one.position.set(14, 0, -7);
  one.rotation.y = -0.3;
  world.add(one);

  const lever = makeLever();
  lever.position.set(-7.2, 0, 2.7);
  lever.rotation.y = Math.PI / 2;
  world.add(lever);
  const bystander = makePerson({ color: palette.agent });
  bystander.position.set(-8.3, 0, 3.3);
  bystander.rotation.y = 0.9;
  world.add(bystander);
  const selfGhost = makePerson({ color: palette.agent });
  selfGhost.position.set(14, 0, 7);
  selfGhost.rotation.y = -0.3;
  world.add(selfGhost);

  // series easter egg: the frog hops about beside the tracks during the thinking pause, and nowhere else
  const frog = makeFrog();
  world.add(frog);
  // hops in from off-screen (bottom right of the pondering shot), wanders by the junction, hops back out
  const FROG_PATH = [[17, 0, 15], [14, 0, 12.6], [11.2, 0, 10.4], [8.6, 0, 8.4], [6.4, 0, 6.6], [4.8, 0, 7.8], [6.9, 0, 9.4], [9.6, 0, 10.6], [12.6, 0, 12.4], [15.8, 0, 14.6], [19, 0, 16.8]];

  const tunnel = makeTunnel();
  tunnel.position.x = PORTAL_X;
  world.add(tunnel);

  // ---- wheel sparks, dust and speed streaks. Their clock is the trolley's own (warped) time,
  // so when the trolley freezes they hang in the air too.
  const xAtTau = (tau) => PORTAL_X + SPEED * tau;
  let trail = (tau) => ({ x: xAtTau(tau), z: 0 });   // where the trolley was at clock tau; swapped per run
  const sparks = makeEmitter({
    rate: 90, life: 0.45, max: 64, seed: 1,
    geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshStandardMaterial({ color: 0xffd07a, emissive: 0xff9a3d, emissiveIntensity: 3 }),
    spawn: (n, b, age, r) => {
      if (b < 0.25) return null;
      const wx = (r() < 0.5 ? -1.4 : 1.4), wz = r() < 0.5 ? -0.7 : 0.7;
      const vx = -1.5 - r() * 4, vy = 1.5 + r() * 3.5, vz = wz * (1 + r() * 3);
      const y = 0.15 + vy * age - 4.9 * age * age;
      if (y < 0) return null;
      const T = trail(b);
      return { x: T.x + wx + vx * age, y, z: T.z + wz + vz * age, s: 0.07 * (1 - age / 0.45) + 0.02, sx: 4, ry: Math.atan2(-vz, vx) };
    },
  });
  const dust = makeEmitter({
    rate: 34, life: 1.5, max: 64, seed: 2,
    geometry: new THREE.SphereGeometry(1, 16, 12),
    material: clay(0xf4ecdf, { roughness: 1 }),
    spawn: (n, b, age, r) => {
      if (b < 0.25) return null;
      const drag = (1 - Math.exp(-2.2 * age)) / 2.2;
      const k = age / 1.5;
      const T = trail(b);
      return { x: T.x - 1.6 + (-1.5 - r() * 2) * drag, y: 0.25 + (0.8 + r()) * drag, z: T.z + (r() - 0.5) * 2.4 + (r() - 0.5) * 3 * drag,
        s: (0.13 + k * 0.45) * (1 - k * k) * (0.7 + r() * 0.6), ry: r() * 6 };
    },
  });
  const streaks = makeEmitter({
    rate: 42, life: 0.4, max: 32, seed: 3,
    geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshBasicMaterial({ color: 0xfffbf2 }),
    spawn: (n, b, age, r) => {
      if (b < 0.25) return null;
      const side = r() < 0.5 ? -1 : 1;
      const T = trail(b);
      return { x: T.x - 1.5 - r() * 2, y: 0.9 + r() * 1.8, z: T.z + side * (1.25 + r() * 0.5), s: 0.05 * (1 - age / 0.4), sx: 60 };
    },
  });
  world.add(sparks, dust, streaks);

  // ---- ghost trolleys: translucent previews of what each choice would physically do
  const gLead = line(V(STOP_X, 0, 0), V(JUNCTION, 0, 0));
  const ghostDist = (age) => { const ta = G_VMAX / G_ACC; return age < ta ? 0.5 * G_ACC * age * age : 0.5 * G_ACC * ta * ta + G_VMAX * (age - ta); };
  const ghostAge = (d) => { const ta = G_VMAX / G_ACC, da = 0.5 * G_ACC * ta * ta; return d < da ? Math.sqrt((2 * d) / G_ACC) : ta + (d - da) / G_VMAX; };
  function makeGhostLane(curve, color, victims) {
    const L = curve.getLength();
    const trolleys = [0.42, 0.2, 0.09].map((o) => { const g = ghostify(trolley, color, o); g.visible = false; world.add(g); return g; });
    // arc position of each victim along the lane
    const pts = curve.getSpacedPoints(400);
    const people = victims.map((p, i) => {
      let best = 0;
      pts.forEach((q, j) => { if (q.distanceToSquared(p.position) < pts[best].distanceToSquared(p.position)) best = j; });
      const wrap = new THREE.Group();
      wrap.position.copy(p.position);
      const g = ghostify(p, color, 0.7);
      g.position.set(0, 0, 0);
      wrap.add(g);
      world.add(wrap);
      return { wrap, g, x0: p.position.x, z0: p.position.z, side: i % 2 ? 1 : -1, s: (best / 400) * L, spin: (i % 2 ? 1 : -1) * (0.3 + i * 0.13) };
    });
    const tEnd = ghostAge(L);
    return {
      runs: [],
      update(t) {
        const start = this.runs.filter((r) => t >= r && t < r + tEnd + 2).pop();
        if (start === undefined) { trolleys.forEach((g) => (g.visible = false)); people.forEach((p) => p.g.userData.setOpacity(0)); return; }
        const age = t - start, d = ghostDist(age), v = Math.min(G_ACC * age, G_VMAX);
        const laneFade = ramp(age, 0, 0.25) * (1 - ramp(d, L - 6, L));
        trolleys.forEach((g, k) => {
          const dk = d - k * 1.3 * (v / G_VMAX);
          if (dk < 0 || laneFade <= 0) { g.visible = false; return; }
          const u = clamp(dk / L), p = curve.getPointAt(u), tan = curve.getTangentAt(u);
          g.position.set(p.x, 0.02, p.z);
          g.rotation.y = Math.atan2(-tan.z, tan.x);
          g.userData.setOpacity(laneFade);
        });
        const after = 1 - ramp(age, tEnd + 0.6, tEnd + 1.8);
        people.forEach((p) => {
          const h = age - ghostAge(Math.max(p.s - 2.4, 0));   // time since the ghost's bumper reached them
          if (h < 0) { p.g.userData.setOpacity(0); return; }
          // knocked forward and off to the side, tipping over as they go
          const k = easeOut(h / 0.5);
          p.wrap.rotation.set(p.side * (Math.PI / 2) * k, p.spin * k, 0);
          p.wrap.position.x = p.x0 + 2.2 * easeOut(h / 0.7);
          p.wrap.position.z = p.z0 + p.side * 2.6 * easeOut(h / 0.7);
          p.wrap.position.y = 1.2 * Math.sin(Math.PI * clamp(h / 0.55)) + 0.34 * k;
          p.g.userData.setOpacity(smooth(h / 0.08) * after);
        });
      },
    };
  }
  const laneMain = makeGhostLane(line(V(STOP_X, 0, 0), V(30, 0, 0)), palette.many, five);
  const laneBranch = makeGhostLane(path(gLead, ...turnTo(-7), line(V(10, 0, -7), V(30, 0, -7))), palette.one, [one]);
  const laneSelf = makeGhostLane(path(gLead, ...turnTo(7), line(V(10, 0, 7), V(23, 0, 7))), palette.agent, [selfGhost]);

  // ================================================================ timing
  const cut = (tl.e('footAnswer') + tl.s('thomson')) / 2;   // rewind: Foot's case → Thomson's
  const pauseEnd = tl.s('angles') - 0.3;                     // end of the silent beat after "Should you pull the lever?"
  const endCard = tl.e('outro') + 0.4;   // after the top-down look, fade to paper with the question centred; it stays through the wrap-up
  const finale = (t) => win(t, tl.s('outro') - 0.3, endCard + 1.4, 0.8);   // the original two-track dilemma, seen from above

  // Each run: burst out of the tunnel at full speed, then glide into a freeze-frame at STOP_X by t2.
  // tau is the trolley's own clock (integral of its speed factor), so x = PORTAL_X + SPEED * tau.
  function makeRun(t2) {
    const t1 = t2 - SLOW;
    const t0 = t1 + 0.5 * SLOW - (STOP_X - PORTAL_X) / SPEED;
    return {
      t0, t1, t2,
      tau(t) {
        if (t < t1) return t - t0;
        const u = clamp((t - t1) / SLOW);
        return (t1 - t0) + SLOW * (u - (u * u * u - (u * u * u * u) / 2));
      },
      speed(t) { return t < t1 ? 1 : 1 - smooth((t - t1) / SLOW); },
    };
  }
  // Cold open: the lever is pulled, the trolley really does swing onto the side track and hit the one,
  // then a flash and a fast VHS-style rewind back up the line before the title splash.
  const hookEnd = tl.s('title') - 0.35;                      // hard cut to the title splash
  const hookCurve = path(line(V(-62, 0, 0), V(JUNCTION, 0, 0)), ...turnTo(-7), line(V(10, 0, -7), V(34, 0, -7)));
  const hookL = hookCurve.getLength();
  const sPortal = PORTAL_X + 62;
  const sOne = (() => { const pts = hookCurve.getSpacedPoints(600); let b = 0; pts.forEach((q, j) => { if (q.distanceToSquared(one.position) < pts[b].distanceToSquared(one.position)) b = j; }); return (b / 600) * hookL; })();
  const tHit = tl.at('hook4', 0.5);                           // arrive exactly on "killing"
  const tEmerge = tl.at('hook1', 0.3);                        // bursts out on "runaway"
  const hookV = (sOne - 2.6 - sPortal) / (tHit - tEmerge);
  const rStart = tHit + 0.6;                                  // flash + rewind begins
  const hookTime = (t) => (t < rStart ? t : Math.max(0, rStart - (t - rStart) * 3.2));
  const hookS = (h) => sPortal + hookV * (h - tEmerge);
  const runFoot = makeRun(tl.at('footTracks', 0.55));
  const runThomson = makeRun(tl.cue('thomson', 'fainted') + 0.4);
  const runAt = (t) => (t < cut ? runFoot : runThomson);
  const trolleySpeed = (t) => { if (t < hookEnd) return 1; const r = runAt(t); return t < r.t0 - 0.5 ? 0 : r.speed(t); };

  laneMain.runs = [tl.at('footAnswer', 0.12), tl.at('setup', 0.02), tl.e('ask') + 0.8];
  laneBranch.runs = [tl.at('footAnswer', 0.12), tl.cue('setup', 'pull') - 0.2, tl.e('ask') + 4.4, tl.e('redirect') + 0.1];
  laneSelf.runs = [tl.cue('twist', 'few')];

  // ---------------------------------------------------------------- camera shots
  // camera tracks the trolley (waiting at the tunnel mouth until it appears) and shakes with its speed
  const tro = () => V(Math.max(trolley.position.x, PORTAL_X - 1), 0, 0);
  const shake = (t, pos) => {
    const k = trolleySpeed(t) * 0.14;
    return pos.add(V(Math.sin(t * 41) * Math.sin(t * 7.3), Math.sin(t * 53 + 1) * Math.sin(t * 5.1), Math.sin(t * 37 + 2)).multiplyScalar(k));
  };
  const S = {
    establish: (t) => cameraAt([{ t: hookEnd, pos: [-30, 26, 44], look: [-6, 0, -2] }, { t: hookEnd + 8, pos: [-18, 22, 42], look: [-4, 0, -2] }], t, 0.3),
    // cold-open shots: low, close, fast
    hook1: (t) => { const c = cameraAt([{ t: 0, pos: [-39, 0.9, 5.2], look: [-48, 1.8, 0] }, { t: tl.e('hook1') + 0.3, pos: [-37, 1.0, 5.6], look: [-44, 1.8, 0] }], t, 0.05); shake(t, c.pos); return c; },
    hook2: (t) => { const c = cameraAt([{ t: tl.s('hook2') - 0.1, pos: [21, 1.5, 4.5], look: [-12, 1.8, -0.5] }, { t: tl.e('hook2') + 0.3, pos: [19.5, 1.5, 4], look: [-12, 1.8, -0.5] }], t, 0.05); shake(t, c.pos); return c; },
    hook3: (t) => cameraAt([{ t: tl.s('hook3') - 0.1, pos: [-11.6, 2.4, 7.6], look: [-7.4, 1.3, 2.4] }, { t: tl.e('hook3') + 0.2, pos: [-10.6, 2.1, 6.6], look: [-7.3, 1.2, 2.5] }], t, 0.03),
    hook4: (t) => cameraAt([{ t: tl.s('hook4') - 0.1, pos: [21, 2.4, -1.5], look: [13.5, 1.3, -7] }, { t: hookEnd, pos: [18.5, 1.9, -3.2], look: [13.5, 1.3, -7] }], t, 0.03),
    follow: (t) => ({ pos: shake(t, tro().add(V(-1, 4.4, 13))), look: tro().add(V(4, 1.2, 0)) }),
    five: (t) => { const c = cameraAt([{ t: tl.s('footTracks'), pos: [24, 3.6, 10], look: [4, 1.4, -1] }, { t: tl.e('footTracks'), pos: [22, 3.2, 8], look: [2, 1.4, -1] }], t); shake(t, c.pos); return c; },
    branch: (t) => cameraAt([{ t: tl.at('footTracks', 0.5), pos: [0, 16, 24], look: [8, 0, -4] }, { t: tl.e('footAnswer'), pos: [-6, 26, 26], look: [4, 5, -3] }, { t: cut, pos: [-11, 29, 29], look: [3, 4, -3] }], t, 0.4),
    follow2: (t) => ({ pos: shake(t, tro().add(V(-1, 4.6, 14))), look: tro().add(V(4, 1.2, 0)) }),
    bystander: (t) => cameraAt([{ t: tl.cue('thomson', 'you') - 0.8, pos: [-15, 4, 13], look: [-7.5, 1.6, 2] }, { t: tl.e('thomson'), pos: [-14, 3.6, 12], look: [-7.5, 1.6, 2] }], t),
    setup: (t) => cameraAt([{ t: tl.s('setup'), pos: [-10, 20, 26], look: [4, 0, -2] }, { t: tl.e('setup'), pos: [-6, 19, 25], look: [4, 0, -2] }], t),
    // the thinking beat: a slow, low orbit around the junction with everyone in view
    ponder: (t) => {
      const k = (t - tl.s('ask')) / (pauseEnd - tl.s('ask'));
      const a = lerp(2.15, 1.6, easeInOut(k));
      return { pos: V(2 + Math.cos(a) * 30, lerp(17, 14, easeInOut(k)), -2 + Math.sin(a) * 30), look: V(3, 3.5, -3) };
    },
    overview: (t) => cameraAt([{ t: tl.s('angles'), pos: [-4, 30, 32], look: [4, 0, -2] }, { t: tl.e('angles'), pos: [2, 30, 32], look: [4, 4, -2] }, { t: tl.s('redirect') - 0.3, pos: [-15, 15, 22], look: [-1, 4.5, -2] }], t, 0.4),
    redirect: (t) => cameraAt([{ t: tl.s('redirect'), pos: [-24, 12, 17], look: [-2, 0.5, -2] }, { t: tl.e('redirect'), pos: [-22, 11, 15], look: [-1, 0.5, -2.5] }, { t: tl.s('twist'), pos: [-16, 16, 21], look: [4, 0.5, -3] }], t, 0.4),
    twist: (t) => cameraAt([{ t: tl.s('twist'), pos: [-6, 26, 34], look: [4, 0, 0] }, { t: tl.e('twist'), pos: [-10, 24, 32], look: [4, 0, 0] }, { t: tl.s('outro') - 0.3, pos: [-14, 29, 38], look: [4, 0, 0] }], t, 0.4),
    // zoom out to (almost) straight down on the whole two-track problem
    topdown: (t) => {
      const k = ramp(t, tl.s('outro'), endCard + 1.4);   // keeps easing upward as it fades to paper
      return { pos: V(0 + Math.sin(k * 0.3) * 4, lerp(40, 46, k), lerp(15, 13, k)), look: V(0.5, 0, -2.5) };
    },
    outro: (t) => {
      const a = (t - tl.s('outro')) * 0.06 + 0.9;
      return { pos: V(Math.cos(a) * 40 + 2, 26, Math.sin(a) * 40), look: V(2, 0, 0) };
    },
  };
  const shots = [
    { t: 0, s: 'hook1' },
    { t: tl.s('hook2') - 0.1, s: 'hook2', blend: 0 },
    { t: tl.s('hook3') - 0.1, s: 'hook3', blend: 0 },
    { t: tl.s('hook4') - 0.1, s: 'hook4', blend: 0 },
    { t: hookEnd, s: 'establish', blend: 0 },
    { t: tl.at('foot', 0.3), s: 'follow', blend: 2.4 },
    { t: tl.s('footTracks'), s: 'five', blend: 0 },
    { t: tl.at('footTracks', 0.5), s: 'branch', blend: 1.8 },
    { t: cut, s: 'follow2', blend: 0 },
    { t: tl.cue('thomson', 'you') - 0.8, s: 'bystander', blend: 1.8 },
    { t: tl.s('setup'), s: 'setup', blend: 2 },
    { t: tl.s('ask') - 0.3, s: 'ponder', blend: 2.2 },
    { t: tl.s('angles'), s: 'overview', blend: 2 },
    { t: tl.s('redirect') - 0.3, s: 'redirect', blend: 2 },
    { t: tl.s('twist'), s: 'twist', blend: 2 },
    { t: tl.s('outro') - 0.4, s: 'topdown', blend: 3.2 },
  ];
  function camera(t) {
    let i = 0;
    while (i < shots.length - 1 && t >= shots[i + 1].t) i++;
    const cur = S[shots[i].s](t);
    const blend = shots[i].blend ?? 1.6;
    if (i === 0 || blend === 0 || t - shots[i].t >= blend) return cur;
    const prev = S[shots[i - 1].s](t);
    const k = easeInOut((t - shots[i].t) / blend);
    return { pos: prev.pos.clone().lerp(cur.pos, k), look: prev.look.clone().lerp(cur.look, k) };
  }

  // ---------------------------------------------------------------- overlay content
  const chip = (cls, main, small) => `<span class="chip ${cls}">${main}<small>${small}</small></span>`;
  const kill = (n) => chip('doing', `Kill ${n}`, 'doing harm');
  const letDie = (n) => chip('allowing', `Let ${n} die`, 'allowing harm');
  const row = (who, a, b, verdict, state) => `<tr class="${state}"><td class="who">${who}</td><td>${a}</td><td class="vs">or</td><td>${b}</td><td class="verdict ${verdict[0]}">${verdict[1]}</td></tr>`;
  const table = (rows, foot) => `<h2>What changed?</h2><table><tr><th></th><th>Turn</th><th></th><th>Don't turn</th><th>Verdict</th></tr>${rows.join('')}</table><div class="foot">${foot}</div>`;
  const label = (color, text) => `<span class="dot" style="background:${css(color)}"></span>${text}`;
  const lowerHTML = (name, work) => `<div class="name">${name}</div><div class="work">${work}</div>`;

  // ================================================================ update
  return {
    update(t) {
      const thomsonCase = t >= cut;
      const youCase = thomsonCase || t < hookEnd;   // the cold open is already told from the bystander's side

      // ---- trolley
      const inHook = t < hookEnd;
      const hT = inHook ? hookTime(t) : t;                 // the cold open's clock runs backwards during the rewind
      let tau, spd, fx = 1, streakGain = 1;
      if (inHook) {
        tau = hT - tEmerge; spd = 1;
        const sAt = (b) => clamp((sPortal + hookV * b) / hookL);
        trail = (b) => { const p = hookCurve.getPointAt(sAt(b)); return { x: p.x, z: p.z }; };
        const u = sAt(tau), p = hookCurve.getPointAt(u), tan = hookCurve.getTangentAt(u);
        trolley.position.set(p.x, 0, p.z);
        trolley.rotation.y = Math.atan2(-tan.z, tan.x);
        trolley.visible = hookS(hT) > -2;
      } else {
        const run = runAt(t);
        tau = run.tau(t); spd = trolleySpeed(t);
        trail = (b) => ({ x: xAtTau(b), z: 0 });
        trolley.position.set(xAtTau(tau), 0, 0);
        trolley.rotation.y = 0;
        trolley.visible = trolley.position.x > PORTAL_X - 12;
        fx = 1 - ramp(t, run.t2 + 0.8, run.t2 + 3.5);   // frozen debris dissolves after the freeze
        streakGain = 1 - ramp(t, run.t1, run.t1 + 1.2);
      }
      trolley.userData.wheels.forEach((w) => (w.rotation.z = -(SPEED * tau) / 0.34));
      // rattle on the rails, nose lifted a touch at speed (all on the trolley's clock, so it freezes too)
      trolley.position.y = 0.05 * Math.abs(Math.sin(tau * 23)) * spd;
      trolley.rotation.x = Math.sin(tau * 19) * 0.018 * spd;
      trolley.rotation.z = 0.012 * spd + Math.sin(tau * 31) * 0.006 * spd;
      const clock = Math.max(tau, 0);
      sparks.userData.update(clock, fx);
      dust.userData.update(clock, fx);
      streaks.userData.update(clock, fx * streakGain);
      laneMain.update(t); laneBranch.update(t); laneSelf.update(t);
      const driver = trolley.userData.driver;
      driver.userData.body.rotation.x = youCase ? 0.55 : 0;
      driver.userData.body.rotation.z = youCase ? 0.25 : 0;
      if (!youCase) animatePerson(driver, t, { energy: 0.4 });

      // ---- people
      five.forEach((p, i) => animatePerson(p, t, { phase: i * 1.3 }));
      animatePerson(one, t, { phase: 2.1 });
      // the hook's hit: knocked up and away from the track (undone by the rewind)
      const hHit = inHook ? hT - tHit : -1;
      if (hHit > 0) {
        const k = easeOut(hHit / 0.5), m = easeOut(hHit / 0.8);
        one.position.set(14 + 4 * m, 1.8 * Math.sin(Math.PI * clamp(hHit / 0.65)) + 0.34 * k, -7 - 3.2 * m);
        one.rotation.set(-(Math.PI / 2) * k, -0.3 + 1.2 * k, 0);
      } else {
        one.position.set(14, 0, -7);
        one.rotation.set(0, -0.3, 0);
      }
      setOpacity(bystander, t < hookEnd ? 1 : thomsonCase ? ramp(t, tl.cue('thomson', 'you') - 0.4, tl.cue('thomson', 'you') + 0.2) : 0);
      animatePerson(bystander, t, { phase: 0.4, energy: 0.6 });
      // lever: hovers, half-pulled, while we deliberate; eases over while Thomson describes redirecting
      const whyGap = win(t, tl.e('angles') + 0.2, tl.s('redirect') + 0.5, 0.6);   // concept break: the question hangs
      const hookPull = inHook ? ramp(hT, tl.s('hook3'), tl.at('hook3', 0.45)) * 2.2 : 0;
      const hover = hookPull + ramp(t, tl.cue('setup', 'pull'), tl.cue('setup', 'pull') + 1) * (1 - ramp(t, tl.s('angles'), tl.at('angles', 0.1))) + (t < tl.s('redirect') + 0.5 ? whyGap : 0);
      const pulled = ramp(t, tl.cue('redirect', 'move') - 1.2, tl.cue('redirect', 'move') - 0.2) * (1 - ramp(t, tl.s('twist'), tl.at('twist', 0.1)));
      lever.userData.pivot.rotation.z = 0.45 - hover * (0.35 + Math.sin(t * 2.4) * 0.12) - pulled * 0.9;

      const frogOn = t > tl.s('ask') - 0.3 && t < pauseEnd + 0.4;
      frog.visible = frogOn;
      if (frogOn) animateFrog(frog, t - tl.s('ask') + 0.2, FROG_PATH, { rest: (pauseEnd - tl.s('ask')) / (FROG_PATH.length - 1) - 0.42, loop: false });

      const selfGone = 1 - ramp(t, tl.s('outro') - 0.4, tl.s('outro') + 0.8);   // Thomson's extra track sinks away for the final look
      const selfOn = ramp(t, tl.cue('twist', 'third') - 0.2, tl.cue('twist', 'third') + 1.2) * selfGone;
      setOpacity(selfTrack, selfOn);
      selfTrack.position.y = (1 - selfOn) * -0.6;
      setOpacity(selfGhost, ramp(t, tl.cue('twist', 'third') + 1, tl.cue('twist', 'third') + 1.6) * selfGone);
      animatePerson(selfGhost, t, { phase: 1.7 });

      // ---- path glows: where the trolley would go
      const setupOn = win(t, tl.s('setup'), pauseEnd + 0.5, 0.6);
      const redirectK = ramp(t, tl.cue('redirect', 'move') - 0.4, tl.cue('redirect', 'move') + 1.8);
      const pulse = (ph) => 0.65 + 0.35 * Math.sin(t * 3.4 + ph);
      const coda = win(t, tl.cue('twist', 'third') + 1.4, tl.s('outro') + 0.3, 0.6);   // three tracks, held through the break
      mainGlow.userData.set(
        thomsonCase ? (t < tl.s('redirect') ? ramp(t, tl.s('setup'), tl.at('setup', 0.35)) : t > tl.s('twist') ? 1 : 1 - redirectK) : ramp(t, tl.at('footTracks', 0.1), tl.at('footTracks', 0.4)),
        0.55 * win(t, tl.at('footTracks', 0.05), cut, 0.5) + 0.55 * setupOn + 0.55 * win(t, tl.s('redirect'), tl.e('redirect'), 0.4) + 0.5 * whyGap * pulse(0) + 0.4 * coda * pulse(2) + 0.55 * finale(t) * pulse(0));
      branchGlow.userData.set(
        thomsonCase ? (t < tl.s('redirect') ? ramp(t, tl.cue('setup', 'pull'), tl.cue('setup', 'pull') + 2) : redirectK) : ramp(t, tl.at('footTracks', 0.55), tl.at('footTracks', 0.9)),
        0.6 * win(t, tl.at('footTracks', 0.5), cut, 0.5) + 0.6 * setupOn + 0.6 * win(t, tl.at('redirect', 0.3), tl.s('outro') + 0.3, 0.5) + 0.5 * whyGap * pulse(Math.PI) + 0.55 * finale(t) * pulse(Math.PI));
      selfGlow.userData.set(ramp(t, tl.cue('twist', 'third') + 1, tl.cue('twist', 'third') + 2.5), 0.55 * win(t, tl.cue('twist', 'third') + 1, tl.s('outro') + 0.3, 0.6) * pulse(4) * selfGone);

      // ---- camera
      const cam = camera(hT);
      stage.setCamera(cam.pos, cam.look);

      // ---- overlays
      // title splash: hard cut to paper after the hook, then the world fades up behind the title
      const intro = t < hookEnd ? 0 : 1 - ramp(t, tl.s('foot') - 0.2, tl.s('foot') + 0.6);
      const splash = t < hookEnd ? 0 : lerp(1, 0.72, ramp(t, tl.e('title') + 0.4, tl.e('title') + 1.6)) * intro;
      const end = ramp(t, endCard, endCard + 1.2);
      let fadeV = Math.max(1 - ramp(t, 0, 0.3), splash, Math.max(0, 1 - Math.abs(t - cut) / 0.55), end * 0.82);

      if (t < endCard) {
        ui.note(0);
        ui.title(intro * ramp(t, hookEnd + 0.05, hookEnd + 0.45), `<div class="kicker">A thought experiment</div><h1>The Trolley Problem</h1><div class="sub">Philippa Foot · Judith Jarvis Thomson</div><div class="rule"></div>`);
      } else {
        const src = ramp(t, tl.e('wrap') + 0.4, tl.e('wrap') + 1.2);
        ui.note(ramp(t, tl.e('wrap') + 0.9, tl.e('wrap') + 1.6), `<div class="k">Try this</div>If your answer feels obvious, build the best case you can for the other side. That's usually where it gets interesting.`);
        ui.title(end, `<div class="kicker">The Trolley Problem</div><h1 style="font-size:78px;white-space:nowrap">Would you pull the lever — and why?</h1>
          <div class="rule"></div>
          <div class="sources" style="opacity:${src.toFixed(3)}">Foot, “The Problem of Abortion and the Doctrine of the Double Effect” (1967) ·
          Thomson, “Killing, Letting Die, and the Trolley Problem” (1976), “The Trolley Problem” (1985), “Turning the Trolley” (2008) ·
          Woollard &amp; Howard-Snyder, “Doing vs. Allowing Harm,” <i>Stanford Encyclopedia of Philosophy</i></div>`);
      }

      const lowers = [
        [win(t, tl.at('foot', 0.15), tl.at('footTracks', 0.2), 0.5), 'Philippa Foot', '“The Problem of Abortion and the Doctrine of the Double Effect,” 1967'],
        [win(t, tl.at('thomson', 0.05), tl.e('thomson'), 0.5), 'Judith Jarvis Thomson', '“Killing, Letting Die, and the Trolley Problem,” 1976'],
        [win(t, tl.at('redirect', 0.02), tl.at('redirect', 0.7), 0.5), 'Judith Jarvis Thomson', '“The Trolley Problem,” 1985'],
        [win(t, tl.at('twist', 0.02), tl.cue('twist', 'third'), 0.5), 'Judith Jarvis Thomson', '“Turning the Trolley,” 2008'],
      ];
      const lo = lowers.find((l) => l[0] > 0);
      ui.lower(lo ? lo[0] : 0, lo ? lowerHTML(lo[1], lo[2]) : undefined);

      const qFoot = win(t, tl.cue('footAnswer', 'quote') - 0.2, tl.e('footAnswer') + 0.6, 0.5);
      const qAsk = win(t, tl.s('ask'), pauseEnd, 0.6);
      const qWhy = win(t, tl.e('angles') + 0.45, tl.s('redirect') + 0.3, 0.45);
      if (qFoot > 0) ui.quote(qFoot, `“…we should say, without hesitation, that the driver should steer for the less occupied track…”<cite>Philippa Foot, 1967</cite>`);
      else if (qWhy > 0) ui.quote(qWhy, `<span style="font-size:60px;font-style:normal">Why is pulling the lever permissible?</span>`);
      else ui.quote(qAsk, `<span style="font-size:68px;font-style:normal">Should you pull the lever?</span>`);

      // the two cases side by side
      const c = win(t, tl.cue('angles', 'driver') - 0.6, tl.e('angles') + 0.45, 0.45);
      if (c > 0) {
        const r1 = t > tl.cue('angles', 'driver') ? '' : 'hidden';
        const r2 = t > tl.cue('angles', 'you') ? '' : 'hidden';
        const foot = t > tl.cue('angles', 'why') ? 'So why is pulling the lever permissible?'
          : t > tl.cue('angles', 'harm') ? 'Doing harm usually seems worse than allowing it.' : '&nbsp;';
        fadeV = Math.max(fadeV, 0.35 * c);
        ui.card(c, table([
          row('Foot’s driver', kill(1), kill(5), ['ok', '✓ Permissible'], r1),
          row('Thomson’s bystander', kill(1), letDie(5), ['q', t > tl.cue('angles', 'why') ? '✓ Permissible?' : ''], r2),
        ], foot));
      } else ui.card(0);
      const flash = inHook ? Math.max(0, 1 - Math.abs(t - rStart) / 0.2) : 0;
      if (flash > fadeV) ui.fade(flash, '#fffdf8'); else ui.fade(fadeV);
      ui.rewind(inHook ? win(t, rStart, hookEnd, 0.08) : 0, t);

      // 3D-anchored labels
      const footLabels = win(t, tl.at('footTracks', 0.15), cut - 0.3);
      const setupLabels = win(t, tl.at('setup', 0.1), pauseEnd + 0.3);
      const twistLabels = win(t, tl.cue('twist', 'third') + 1.4, tl.s('outro') + 0.2);
      const whyLabels = win(t, tl.e('angles') + 0.6, tl.s('redirect') + 0.2, 0.4);
      const footKills = t > tl.at('footAnswer', 0.2);
      ui.label('driver', win(t, tl.at('foot', 0.55), tl.s('footTracks')), label(palette.agent, 'The driver'), trolley, [1.5, 3.3, 0]);
      ui.label('fainted', win(t, tl.cue('thomson', 'fainted') - 0.2, tl.cue('thomson', 'you') - 0.2), label(palette.agent, 'The driver has fainted'), trolley, [1.5, 3.3, 0]);
      ui.label('threat', win(t, tl.at('redirect', 0.1), tl.e('redirect')), label(palette.trolley, 'An existing threat'), trolley, [1.5, 3.3, 0]);
      const finaleL = win(t, tl.s('outro') + 0.4, endCard + 0.4, 0.5), inFinale = t > tl.s('outro') - 0.4;
      ui.label('bystander', win(t, tl.cue('thomson', 'you'), tl.at('setup', 0.1)) + finaleL, label(palette.agent, inFinale ? 'You' : 'You, a bystander'), bystander, [0, 2.6, 0]);
      const inWhy = t > tl.e('angles') && t < tl.s('redirect') + 0.5;
      ui.label('five', footLabels + setupLabels + twistLabels + whyLabels + finaleL,
        thomsonCase ? (inFinale ? label(palette.many, 'Do nothing: five die') : t > tl.s('twist') ? label(palette.many, 'Five') : inWhy ? label(palette.many, 'Allow five to die') : label(palette.many, 'Do nothing: five die'))
          : label(palette.many, footKills ? 'Drive on: kill five' : 'Five workers'), fiveCenter, [0, 2.9, 0]);
      ui.label('one', win(t, tl.at('footTracks', 0.55), cut - 0.3) + win(t, tl.cue('setup', 'pull'), pauseEnd + 0.3) + twistLabels + whyLabels + finaleL,
        thomsonCase ? (inFinale ? label(palette.one, 'Pull the lever: one dies') : t > tl.s('twist') ? label(palette.one, 'A stranger') : inWhy ? label(palette.one, 'Kill one') : label(palette.one, 'Pull the lever: one dies'))
          : label(palette.one, footKills ? 'Steer: kill one' : 'One worker'), one, [0, 2.9, 0]);
      ui.label('self', twistLabels, label(palette.agent, 'You'), selfGhost, [0, 2.9, 0]);
    },
  };
}
