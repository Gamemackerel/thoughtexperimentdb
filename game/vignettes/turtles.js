// Vignette: Turtles All the Way Down.
// A little flat world, and you on it, wondering what holds it up. The sea pours off its edge, and over the edge there's a
// ladder. Climb down: a turtle, a larger one under it, and another, all the way down.
// The ways out of a regress: keep going forever; say this turtle stands on nothing; follow the turtles round, and find
// they hold each other up; or stop asking.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeFrog, makeTree, makeHouse, makeBench, setOpacity } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';
import { canvasTexture } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const N = 16;                                       // turtles built (the fog hides the rest)
const R = [6, ...[...Array(N)].map((_, i) => { const k = i + 1; return 6 + 3.5 * Math.min(k, 5) + 1.4 * Math.max(0, k - 5); })];   // R[0]: the world; R[k]: turtle k's shell
const WALK = 4;                                     // the deepest turtle you can stand on (below that, you only fall past them)
const Y = [0];                                      // Y[k]: the top of level k (0 is the world)
Y[1] = -0.6; for (let k = 2; k <= N; k++) Y[k] = Y[k - 1] - R[k - 1] * 0.75;
const LAND = [V(0, 0, 3.5), ...R.slice(1).map((r, k) => V(-0.6 * (k + 1), Y[k + 1], R[k] + 1.6))];   // where you stand on each level
const IDLE_LIMIT = 60;
// the top of the ladder down from level k (on the rim, just outside the shell), and its foot, beside where you land below
const RIM = (k) => V(LAND[k + 1].x, Y[k] + 0.05, R[k] * (k ? 1.03 : 1) + 0.2);
const FOOT = (k) => V(LAND[k + 1].x, Y[k + 1], R[k] * (k ? 1.03 : 1) + 0.6);

const shellTex = canvasTexture(512, 512, (g, w, h) => {
  g.fillStyle = '#6b7a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4a5a2a'; g.lineWidth = 8; g.fillStyle = '#7c8c48';
  for (let y = -1; y < 7; y++) for (let x = -1; x < 7; x++) {
    const cx = x * 80 + (y % 2 ? 40 : 0), cy = y * 70; g.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28 + 0.52; i ? g.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40) : g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); }
    g.closePath(); g.fill(); g.stroke();
  }
});

// A turtle whose flat-topped shell has radius r; the top of the shell is at y = 0; it faces +x.
function makeTurtle(r) {
  const g = new THREE.Group(), skin = clay(0x8a9a5a), H = r * 0.35, L = r * 0.4;
  const top = mesh(new THREE.CylinderGeometry(r, r * 1.02, H * 0.4, 48), new THREE.MeshStandardMaterial({ map: shellTex, roughness: 0.9 }));
  top.position.y = -H * 0.2; g.add(top);
  const dome = mesh(new THREE.SphereGeometry(r * 1.02, 40, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clay(0x5a6a30)); dome.scale.y = (H * 0.8) / r; dome.position.y = -H * 0.4; g.add(dome);
  const belly = mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.7, H * 0.2, 32), clay(0xd9c88a)); belly.position.y = -H * 1.15; g.add(belly);
  const head = mesh(new THREE.SphereGeometry(r * 0.2, 20, 14), skin); head.scale.set(1.3, 1, 1); head.position.set(r * 1.2, -H * 0.55, 0); g.add(head);
  const neck = mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.15, r * 0.35, 12), skin); neck.rotation.z = Math.PI / 2 + 0.3; neck.position.set(r * 1, -H * 0.7, 0); g.add(neck);
  for (const s of [-1, 1]) { const eye = mesh(new THREE.SphereGeometry(r * 0.035, 8, 6), clay(palette.ink)); eye.position.set(r * 1.38, -H * 0.45, s * r * 0.1); g.add(eye); }
  for (const [x, z] of [[0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]]) { const leg = mesh(new THREE.CylinderGeometry(r * 0.13, r * 0.16, L + H * 0.6, 12), skin); leg.position.set(x * r * 0.75, -H - L / 2 + H * 0.3, z * r * 0.75); g.add(leg); }
  const tail = mesh(new THREE.ConeGeometry(r * 0.08, r * 0.3, 8), skin); tail.rotation.z = Math.PI / 2; tail.position.set(-r * 1.1, -H * 0.8, 0); g.add(tail);
  g.userData = { head, H, L };
  return g;
}

export default function turtles(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0x14203e);
  stage.scene.fog = new THREE.Fog(0x14203e, 40, 150);
  stage.hemi.color.set(0xd6e0ff); stage.hemi.intensity = 1.4;
  voice.load('turtles');
  const rnd = seeded(1988);

  // stars all round (the world is in space, after all)
  const sp = new Float32Array(3000 * 3); for (let i = 0; i < 3000; i++) { const v = V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(260); sp.set([v.x, v.y, v.z], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); root.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff6d8, size: 2, sizeAttenuation: false, fog: false })));

  // ---- the world: a flat green plate with a house, a bench and a few trees; the sea runs round it and pours off the edge
  const world = new THREE.Group(); root.add(world);
  const plate = mesh(new THREE.CylinderGeometry(R[0], R[0], 0.6, 48), [clay(0x7a6a4a), clay(0x9cc86a), clay(0x7a6a4a)]); plate.position.y = -0.3; world.add(plate);
  const sea = mesh(new THREE.TorusGeometry(R[0] - 0.4, 0.3, 8, 48), clay(0x6fa8c8)); sea.rotation.x = Math.PI / 2; sea.position.y = 0.02; world.add(sea);
  const falls = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.5) continue;   // not over the ladder
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 5), new THREE.MeshBasicMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    f.position.set(Math.cos(a) * (R[0] + 0.06), -2.4, Math.sin(a) * (R[0] + 0.06)); f.rotation.y = -a + Math.PI / 2; world.add(f); falls.push(f);
  }
  const bench = makeBench(); bench.position.set(1.6, 0, -1.4); bench.rotation.y = 0.3; world.add(bench);
  const sign = new THREE.Group(); const spost = mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), clay(palette.wood)); spost.position.y = 0.8; sign.add(spost);
  const sboard = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.45), new THREE.MeshBasicMaterial({ map: canvasTexture(256, 88, (g) => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 256, 88); g.fillStyle = '#2b2a33'; g.font = 'bold 26px Newsreader, serif'; g.textAlign = 'center'; g.fillText('EDGE OF', 128, 38); g.fillText('THE WORLD', 128, 70); }) }));
  sboard.position.set(0, 1.45, 0.07); sign.add(sboard); sign.position.set(-1.4, 0, R[0] - 1.1); world.add(sign);
  for (const [x, z] of [[4, -1], [-4.2, -0.5], [3.4, 2.8]]) { const t = makeTree(0.6, rnd); t.position.set(x, 0, z); world.add(t); }
  const hut = makeHouse(); hut.scale.setScalar(0.6); hut.position.set(-3.4, 0, 2.6); world.add(hut);

  // ---- the turtles, each on the back of a larger one
  const stack = [];
  for (let k = 1; k <= N; k++) { const t = makeTurtle(R[k]); t.position.set(0, Y[k], 0); t.rotation.y = (k % 2 ? 0 : 0.35) + k * 0.12; root.add(t); stack.push(t); }
  // a ladder from each level down to the next, hooked over the rim of the shell (or the world) and hanging clear of it,
  // down to where you stand on the turtle below
  const ladders = [];
  for (let k = 0; k < WALK; k++) {
    const top = RIM(k), bot = FOOT(k), d = bot.clone().sub(top), len = d.length(), l = new THREE.Group();
    for (const x of [-0.3, 0.3]) { const r = mesh(new THREE.BoxGeometry(0.07, len, 0.07), clay(palette.wood)); r.position.set(x, -len / 2, 0); l.add(r); }
    for (let i = 0; i < len / 0.5 - 0.5; i++) { const r = mesh(new THREE.BoxGeometry(0.6, 0.05, 0.06), clay(palette.wood)); r.position.set(0, -0.3 - i * 0.5, 0); l.add(r); }
    for (const x of [-0.3, 0.3]) { const hook = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), clay(palette.wood)); hook.position.set(x, 0, -0.25); l.add(hook); }
    l.position.copy(top); l.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize()); root.add(l); ladders.push(l);
  }
  // the ring: seen from far off, the turtles go round in a great circle, each on the back of the one before, the world on top
  const RING = V(0, -30, -170), ring = new THREE.Group(); ring.position.copy(RING); ring.visible = false; root.add(ring);
  // each turtle's back faces along the circle, so the next one stands on it (turtle height, shell to feet: 0.75 r)
  const RR = 28, TR = 4.6, RN = Math.round((Math.PI * 2 * RR) / (0.75 * TR));
  for (let i = 0; i < RN; i++) {
    const a = (i / RN) * Math.PI * 2, t = makeTurtle(TR); t.position.set(Math.sin(a) * RR, Math.cos(a) * RR, 0); t.rotation.set(0, 0, -a - Math.PI / 2); ring.add(t);
  }
  const ringWorld = mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.5, 32), clay(0x9cc86a)); ringWorld.position.set(0, RR + TR * 1.1, 0); ring.add(ringWorld);
  const ringHouse = makeHouse(); ringHouse.scale.setScalar(0.4); ringHouse.position.set(0.8, RR + TR * 1.1 + 0.25, 0); ring.add(ringHouse);

  // ---- the frog, on the second turtle: it hops to the rim, looks over at the turtles below, and thinks better of it
  const frog = makeFrog({ scale: 0.8 }); root.add(frog);
  const L2 = LAND[2];
  const cameo = frogCameo(frog, [{ at: [L2.x - 3, L2.z - 1.4], y: L2.y }, { at: [L2.x - 2, L2.z - 0.2], y: L2.y }, { at: [L2.x - 1.4, L2.z + 1], y: L2.y }, { face: [L2.x - 1.4, L2.z + 6] },
    { wait: 2.8, act: (f, u) => (f.userData.body.rotation.x = 0.5 * Math.sin(Math.PI * clamp(u * 1.3))) }, { at: [L2.x - 2.2, L2.z - 0.4], y: L2.y, back: true }, { at: [L2.x - 3.4, L2.z - 1.6], y: L2.y }]);

  // ---- state
  const S = { phase: 'lecture', level: 0, idle: 0, climb: null, curved: false, end: null, fall: 0, fade: 1, ringT: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/turtles.json', 'Turtles All the Way Down');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  async function climbDown() {
    const k = S.level; S.phase = 'climbing'; player.enabled = false; S.idle = 0;
    S.climb = { pts: [player.pos.clone(), RIM(k), FOOT(k), LAND[k + 1].clone()], t: 0 };   // to the ladder, down it, and off
    await ctx.wait(3.2);
    S.level = k + 1; S.climb = null; S.phase = 'shell'; player.enabled = true; gp.position.y = Y[S.level];
    if (S.level === 2) cameo.start();
    if (S.level <= 3) await voice.say('turtle_' + S.level, { urgent: true });
    else voice.say('forever', { urgent: true });
    if (!S.asked) { await ctx.wait(0.8); await voice.say('ask'); S.asked = true; }
  }
  const ladderTop = () => RIM(S.level).setY(Y[S.level]).add(V(0, 0, -0.9));
  interact.add({ pos: ladderTop, radius: 1.3, height: 1.6, prompt: () => (S.level === 0 ? 'Climb down over the edge' : 'Climb down to the next turtle'),
    enabled: () => (S.phase === 'world' || S.phase === 'shell') && S.level < WALK, onUse: climbDown });
  // the three ways out of the regress (and a fourth, if you just stop)
  interact.add({ pos: () => LAND[S.level].clone().add(V(0.6, 0, 0.9)), radius: 1.3, height: 1.6, prompt: 'Keep climbing down', terminal: true, enabled: () => S.phase === 'shell' && S.level >= WALK,
    onUse: async () => {
      S.phase = 'over'; S.end = 'forever'; player.enabled = false; player.obj.visible = false; S.fall = 0;
      await voice.say('down_1', { urgent: true }); await ctx.wait(2.5); await voice.say('down_2'); await ctx.wait(1.6);
      save.complete('turtles');
      ctx.gameOver({ title: 'Turtles all the way down', text: 'You kept going. Every turtle needed another one under it, and there was always another one. Maybe that\'s fine: maybe the chain just never ends. It never quite explains the chain, though.' });
    } });
  interact.add({ pos: () => LAND[S.level].clone().add(V(-1.2, 0, 0.4)), radius: 1.2, height: 1.6, prompt: 'Say this one stands on nothing', terminal: true, enabled: () => S.phase === 'shell' && S.asked,
    onUse: async () => {
      S.phase = 'over'; S.end = 'last'; player.enabled = false; S.lastK = S.level;
      await voice.say('last_1', { urgent: true }); await ctx.wait(2); await voice.say('last_2'); await ctx.wait(1.6);
      save.complete('turtles');
      ctx.gameOver({ title: 'The last turtle', text: 'You said the chain stops here, at a turtle that needs nothing under it. Some call that a first cause, or a foundation, or a brute fact. The question is always: why that one?' });
    } });
  look(ctx, { pos: () => LAND[S.level].clone().add(V(0.2, 0, -1.2)), radius: 1.2, height: 1.8, prompt: 'Look along the stack', lines: ['curve'], enabled: () => S.phase === 'shell' && S.level >= 2 });
  interact.add({ pos: () => LAND[S.level].clone().add(V(0.2, 0, -1.2)), radius: 1.2, height: 1.8, prompt: 'Follow the turtles round', terminal: true, enabled: () => S.phase === 'shell' && voice.said.has('curve') && !voice.busy,
    onUse: async () => {
      S.phase = 'over'; S.end = 'loop'; player.enabled = false; ring.visible = true; S.ringT = 0; stage.scene.fog.far = 900;
      await voice.say('loop_1', { urgent: true }); await ctx.wait(1.5); await voice.say('loop_2'); await ctx.wait(1.6);
      save.complete('turtles');
      ctx.gameOver({ title: 'They hold each other up', text: 'The turtles went round in a great ring, the last one holding up the first. There was no bottom, because there was no bottom to reach. Is that an answer, or a very large circle?' });
    } });
  async function stopAsking() {
    S.phase = 'over'; S.end = 'stop'; player.enabled = false;
    await voice.say('stop_1', { urgent: true }); await ctx.wait(1.2); await voice.say('stop_2'); await ctx.wait(1.4);
    save.complete('turtles');
    ctx.gameOver({ title: 'You stopped asking', text: 'You stopped wondering what was underneath. Most people do, most of the time, and the world stays up either way. Or seems to.' });
  }

  // asides
  look(ctx, { pos: V(-1.4, 0, R[0] - 1.8), radius: 1.3, height: 1.8, prompt: 'Look over the edge', lines: ['edge'], enabled: () => S.phase === 'world' });
  look(ctx, { pos: V(1.6, 0, -0.5), radius: 1.3, height: 1.4, prompt: 'Sit and wonder', lines: ['wonder_2'], enabled: () => S.phase === 'world' });
  look(ctx, { pos: () => LAND[S.level].clone().add(V(1.6, 0, -0.8)), radius: 1.1, height: 1.2, prompt: 'Look at the turtle', lines: ['turtle_look'], enabled: () => S.phase === 'shell' && S.level === 1 });

  (async () => {
    await ctx.wait(1); S.phase = 'world'; await voice.say('arrive'); await ctx.wait(0.6); await voice.say('wonder');
    await ctx.wait(1.2); await voice.say('ladder');
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 3.2, rotY: Math.PI },
    walkable: (x, z) => (S.level === 0 ? Math.hypot(x, z) < R[0] - 0.6 : Math.hypot(x - LAND[S.level].x, z - LAND[S.level].z) < 2.6),
    blockers: () => (S.level === 0 ? [{ x: 1.6, z: -1.4, w: 2, d: 0.7, rot: 0.3 }, { x: -1.4, z: R[0] - 1.1, r: 0.25 }, { x: -3.4, z: 2.6, r: 1.1 }, { x: 4, z: -1, r: 0.4 }, { x: -4.2, z: -0.5, r: 0.4 }, { x: 3.4, z: 2.8, r: 0.4 }] : []),
    update(dt, t) {
      // down the ladder
      if (S.climb) {
        const c = S.climb; c.t = Math.min(1, c.t + dt / 3); const P = c.pts, seg = c.t < 0.2 ? 0 : c.t < 0.85 ? 1 : 2, u = easeInOut(seg === 0 ? c.t / 0.2 : seg === 1 ? (c.t - 0.2) / 0.65 : (c.t - 0.85) / 0.15);
        player.pos.lerpVectors(P[seg], P[seg + 1], u); if (seg === 1) player.obj.rotation.y = Math.PI;   // facing the ladder on the way down
      }
      else if (S.phase !== 'over' || S.end !== 'forever') player.pos.y = Y[S.level] ?? 0;
      // after the question, standing still long enough is an answer too
      if (S.phase === 'shell' || (S.phase === 'world' && S.asked)) {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) stopAsking();
      }
      stack.forEach((tu, i) => { tu.userData.head.position.y = -tu.userData.H * 0.55 + Math.sin(t * 0.4 + i) * 0.05 * R[i + 1]; });
      // the last turtle: everything under it fades away, and it simply stays where it is
      if (S.end === 'last') { S.fade = Math.max(0, S.fade - dt * 0.4); stack.forEach((tu, i) => { if (i + 1 > S.lastK) { setOpacity(tu, S.fade); tu.visible = S.fade > 0.02; } }); ladders.forEach((l, i) => (l.visible = i + 1 < S.lastK)); }
      if (S.end === 'forever') S.fall += dt;
      if (S.end === 'loop') S.ringT += dt;
      falls.forEach((f, i) => (f.material.opacity = 0.45 + Math.sin(t * 3 + i) * 0.1));
      cameo.update(dt);
    },
    camera(pl) {
      if (S.end === 'loop') { const u = easeInOut(clamp(S.ringT / 5)); const a = V(0, 20, 60).lerp(RING.clone().add(V(34, 22, 100)), u), b = V(0, -6, 0).lerp(RING.clone().add(V(0, 5, 0)), u); return { pos: a, look: b, stiffness: 1.5 }; }
      if (S.end === 'forever') {
        // down past turtle after turtle; it slows before the last ones built, where the fog hides that there are no more
        const drop = S.fall < 2 ? 3.5 * S.fall * S.fall : 14 + 14 * (S.fall - 2), y = Math.max(Y[S.level] - drop, Y[N - 3]);
        const r = R[Y.findIndex((v) => v < y) - 1] ?? R[N];
        return { pos: V(r * 1.8, y + 4, r * 2.6 + 24), look: V(0, y - 26, 0), stiffness: 4 };   // far enough out to see several turtles at once, going down into the dark
      }
      if (S.end === 'last') { const k = S.lastK, u = clamp((5 - S.fade * 5) / 4); return { pos: V(0, Y[k] + 6 - u * 10, R[k] * 1.8 + 18 + u * 20), look: V(0, Y[k] - 6 - u * 4, 0), stiffness: 1.4 }; }
      const k = S.level, p = pl.pos.clone();
      if (k === 0) return { pos: V(p.x * 0.4, 7.5, 15), look: V(p.x * 0.3, 0.6, 0), stiffness: 2 };
      // from the side, far enough out to see you, the turtle you're on, and the one under it
      const r = R[k], look = V(p.x * 0.5, lerp(p.y, Y[k] - r * 0.55, 0.6), p.z * 0.4);
      return { pos: look.clone().add(V(r * 0.9, r * 0.35 + 3, r * 1.25 + 10)), look, stiffness: 1.6 };
    },
    dispose() { voice.stop(); player.pos.y = 0; player.obj.visible = true; },
  });
}
