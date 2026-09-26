// Vignette: Turtles All the Way Down.
// A lecture on a little flat world: the scientist explains how the Earth goes round the Sun, and an old lady puts him
// right. The world is flat, and it sits on the back of a giant turtle. And what is the turtle standing on? Turtles all
// the way down. There's a ladder over the edge of the world. Climb down: a turtle, a larger one under it, and another.
// The ways out of a regress: keep going forever; say this turtle stands on nothing; follow the turtles round, and find
// they hold each other up; or stop asking.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeTree, makeHouse, setOpacity } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { canvasTexture } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const N = 9;                                        // turtles built (the fog hides the rest)
const R = [6, ...[...Array(N)].map((_, k) => 6 + 3.5 * (k + 1))];                // R[0]: the world's radius; R[k]: turtle k's shell
const Y = [0];                                      // Y[k]: the top of level k (0 is the world)
Y[1] = -0.6; for (let k = 2; k <= N; k++) Y[k] = Y[k - 1] - R[k - 1] * 0.75;
const LAND = [V(0, 0, 3.5), ...R.slice(1).map((r, k) => V(-0.6 * (k + 1), Y[k + 1], R[k] + 1.6))];   // where you stand on each level
const IDLE_LIMIT = 60;

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

  // ---- the world: a flat green plate, with a lecture going on
  const world = new THREE.Group(); root.add(world);
  const plate = mesh(new THREE.CylinderGeometry(R[0], R[0], 0.6, 48), [clay(0x7a6a4a), clay(0x9cc86a), clay(0x7a6a4a)]); plate.position.y = -0.3; world.add(plate);
  const sea = mesh(new THREE.TorusGeometry(R[0] - 0.4, 0.3, 8, 48), clay(0x6fa8c8)); sea.rotation.x = Math.PI / 2; sea.position.y = 0.02; world.add(sea);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ map: canvasTexture(320, 200, (g, w, h) => {
    g.fillStyle = '#23302a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#eeeeee'; g.lineWidth = 2; g.fillStyle = '#f6e27a';
    g.beginPath(); g.arc(160, 100, 14, 0, 7); g.fill(); for (const r of [40, 62, 84]) { g.beginPath(); g.ellipse(160, 100, r * 1.4, r * 0.8, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#8fb5d9'; g.beginPath(); g.arc(160 + 62 * 1.4, 100, 7, 0, 7); g.fill();
  }) })); board.position.set(0, 2.2, -2.6); world.add(board);
  const bframe = mesh(new THREE.BoxGeometry(2.8, 1.8, 0.1), clay(0x6b4a33)); bframe.position.set(0, 2.2, -2.68); world.add(bframe);
  for (const x of [-1.2, 1.2]) { const l = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), clay(0x6b4a33)); l.position.set(x, 0.8, -2.7); world.add(l); }
  const scientist = makePerson({ color: 0x5d6470 }); scientist.position.set(-1.8, 0, -1.8); scientist.rotation.y = 0.5; world.add(scientist);
  const audience = [[-2, 1], [-0.7, 1.1], [0.6, 1], [2, 1.1]].map(([x, z], i) => { const p = makePerson({ color: [0x5b7fa6, 0xe2a93b, 0x7a5a8c, 0x6f9a4f][i], scale: 0.9 }); p.position.set(x, 0, z); p.rotation.y = Math.PI; p.userData.body.position.y = -0.3; world.add(p); return p; });
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(1.1, 0.4, 0.5), clay(palette.wood)); b.position.set(-1.35 + i * 1.35, 0.2, 1.3); world.add(b); }
  const lady = makePerson({ color: 0x8a8fa8, robe: true }); root.add(lady);
  const bun = mesh(new THREE.SphereGeometry(0.16, 10, 8), clay(0xdcdcdc)); bun.position.set(0, 2.0, -0.18); lady.userData.body.add(bun);
  const hair = mesh(new THREE.SphereGeometry(0.33, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), clay(0xdcdcdc)); hair.position.y = 1.74; lady.userData.body.add(hair);
  const knit = mesh(new THREE.SphereGeometry(0.15, 10, 8), clay(0xe0674f)); knit.position.set(0.1, 1.05, 0.38); lady.userData.body.add(knit);
  for (const [x, z] of [[4, -1], [-4.2, -0.5], [3.4, 2.8]]) { const t = makeTree(0.6, rnd); t.position.set(x, 0, z); world.add(t); }
  const hut = makeHouse(); hut.scale.setScalar(0.6); hut.position.set(-3.4, 0, 2.6); world.add(hut);
  const ladder0 = new THREE.Group(); for (const x of [-0.3, 0.3]) { const r = mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), clay(palette.wood)); r.position.set(x, -0.3, 0); ladder0.add(r); } ladder0.position.set(LAND[0].x, 0, R[0] + 0.05); world.add(ladder0);

  // ---- the turtles, each on the back of a larger one
  const stack = [];
  for (let k = 1; k <= N; k++) { const t = makeTurtle(R[k]); t.position.set(0, Y[k], 0); t.rotation.y = (k % 2 ? 0 : 0.35) + k * 0.12; root.add(t); stack.push(t); }
  // a ladder from each level down to the next
  const ladders = [];
  for (let k = 1; k < N; k++) {
    const from = LAND[k], to = LAND[k + 1], l = new THREE.Group(), len = from.y - to.y;
    for (const x of [-0.3, 0.3]) { const r = mesh(new THREE.BoxGeometry(0.07, len, 0.07), clay(palette.wood)); r.position.set(x, -len / 2, 0); l.add(r); }
    for (let i = 0; i < len / 0.5; i++) { const r = mesh(new THREE.BoxGeometry(0.6, 0.05, 0.06), clay(palette.wood)); r.position.set(0, -0.3 - i * 0.5, 0); l.add(r); }
    l.position.set(from.x + 1.2, from.y, from.z + 0.9); l.lookAt(V(to.x + 1.2, from.y, to.z + 0.9)); root.add(l); ladders.push(l);
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
  const placeLady = (k) => { const p = LAND[k]; lady.position.set(p.x - 1.8, p.y, p.z - 0.8); lady.rotation.y = 0.9; };
  lady.position.set(1.4, 0, 1.8); lady.rotation.y = -2.6;

  const LADY = ['Told you.', 'Still turtles, dear.', 'Mind your step. It\'s a long way down.', 'I did say.', 'Turtles. All of them.'];
  async function climbDown() {
    const k = S.level; S.phase = 'climbing'; player.enabled = false; S.idle = 0;
    S.climb = { from: player.pos.clone(), to: LAND[k + 1].clone(), t: 0 };
    await ctx.wait(2.4);
    S.level = k + 1; S.climb = null; S.phase = 'shell'; player.enabled = true; placeLady(S.level); gp.position.y = Y[S.level];
    ctx.speak(lady, LADY[(S.level - 1) % LADY.length], { offset: [0, 2.6, 0] });
    if (S.level === 2) cameo.start();
    if (S.level <= 3) await voice.say('turtle_' + S.level, { urgent: true });
    else voice.say('forever', { urgent: true });
    if (!S.asked) { await ctx.wait(0.8); await voice.say('ask'); S.asked = true; }
  }
  interact.add({ pos: () => (S.level === 0 ? V(LAND[0].x, 0, R[0] - 0.6) : LAND[S.level].clone().add(V(1.2, 0, 0.6))), radius: 1.3, height: 1.6, prompt: () => (S.level === 0 ? 'Climb down over the edge' : 'Climb down to the next turtle'),
    enabled: () => (S.phase === 'world' || S.phase === 'shell') && S.level < 4, onUse: climbDown });
  // the three ways out of the regress (and a fourth, if you just stop)
  interact.add({ pos: () => LAND[S.level].clone().add(V(1.2, 0, 0.6)), radius: 1.3, height: 1.6, prompt: 'Keep climbing down', terminal: true, enabled: () => S.phase === 'shell' && S.level >= 4,
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
  talk(ctx, { who: lady, offset: [0, 2.6, 0], enabled: () => S.phase === 'world' || S.phase === 'shell',
    lines: (i) => (S.level === 0 ? ["You're very clever, young man. But it's turtles all the way down.", 'Go and look, if you like. Over the edge.', 'I have been knitting this scarf for a very long time.'] : ["What did you expect? An elephant?", 'Every one of them is standing on another one.', "Don't ask me what the last one stands on. There isn't a last one."])[i % 3] });
  talk(ctx, { who: scientist, enabled: () => S.phase === 'world', lines: ['Well, I… I suppose we could go and look.', 'The mathematics was very clear.', 'I have never been heckled by a grandmother before.'] });
  look(ctx, { pos: () => LAND[S.level].clone().add(V(1.6, 0, -0.8)), radius: 1.1, height: 1.2, prompt: 'Look at the turtle', lines: ['turtle_look'], enabled: () => S.phase === 'shell' && S.level === 1 });

  (async () => {
    await ctx.wait(1); await voice.say('arrive');
    ctx.speak(scientist, '…and so the Earth goes round the Sun, and the Sun round the middle of the galaxy.', { secs: 4 }); await ctx.wait(4.4);
    ctx.speak(lady, "Rubbish. The world is flat, and it sits on the back of a giant turtle.", { secs: 4, offset: [0, 2.6, 0] }); await ctx.wait(4.4);
    ctx.speak(scientist, 'And what is the turtle standing on?', { secs: 3 }); await ctx.wait(3.4);
    ctx.speak(lady, "You're very clever, young man. But it's turtles all the way down.", { secs: 4.4, offset: [0, 2.6, 0] }); await ctx.wait(4.8);
    S.phase = 'world'; await voice.say('ladder');
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 3.2, rotY: Math.PI },
    walkable: (x, z) => (S.level === 0 ? Math.hypot(x, z) < R[0] - 0.6 : Math.hypot(x - LAND[S.level].x, z - LAND[S.level].z) < 2.6),
    blockers: () => (S.level === 0 ? [{ x: 0, z: 1.3, w: 4.2, d: 0.6 }, { x: 0, z: -2.6, w: 2.8, d: 0.4 }, { x: scientist.position.x, z: scientist.position.z, r: 0.4 }, { x: lady.position.x, z: lady.position.z, r: 0.4 }, { x: -3.4, z: 2.6, r: 1.1 }, { x: 4, z: -1, r: 0.4 }, { x: -4.2, z: -0.5, r: 0.4 }, { x: 3.4, z: 2.8, r: 0.4 }]
      : [{ x: lady.position.x, z: lady.position.z, r: 0.4 }]),
    update(dt, t) {
      // down the ladder
      if (S.climb) { S.climb.t = Math.min(1, S.climb.t + dt / 2.2); const u = easeInOut(S.climb.t); player.pos.lerpVectors(S.climb.from, S.climb.to, u); player.pos.x += Math.sin(u * Math.PI) * 1.4; }
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
      animatePerson(lady, t, { energy: 0.2 }); animatePerson(scientist, t, { energy: 0.3 });
      audience.forEach((a, i) => animatePerson(a, t, { phase: i, energy: 0.15 }));
      cameo.update(dt);
    },
    camera(pl) {
      if (S.end === 'loop') { const u = easeInOut(clamp(S.ringT / 5)); const a = V(0, 20, 60).lerp(RING.clone().add(V(34, 22, 100)), u), b = V(0, -6, 0).lerp(RING.clone().add(V(0, 5, 0)), u); return { pos: a, look: b, stiffness: 1.5 }; }
      if (S.end === 'forever') { const y = Y[S.level] - S.fall * S.fall * 3.5; return { pos: V(R[N] * 1.1, y + 8, R[N] * 1.6 + 12), look: V(0, y - 14, 0), stiffness: 4 }; }
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
