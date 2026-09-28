// Vignette: The Paperclip Maximiser.
// Your little paperclip business on a small island: a spool of wire, a stack of sheet metal, and your new machine, a
// little robot cleverer than anyone who has ever lived. It will want whatever you tell it to want. At first there is one
// button on the console, "Make as many paperclips as you can" (or switch it off at the wall and go home). It copies
// itself, guards its off switch, takes the fence, the shed, the trees, the house, you, and then flies off to the other
// islands and takes them apart too. Then time rewinds to the workshop, and a second button has appeared: "Make exactly
// one hundred paperclips". It makes them in seconds, and then gets stuck on the word "exactly": what counts as a
// paperclip, and how sure is sure? Its copies and their factories aren't making paperclips; they're checking. Being
// 99.9999% sure isn't enough, so it never stops, and it needs the other islands for that too.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeIsland, makeTree, makeRock, makeHouse, makeFrog, makeTable } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DESK = V(-2.6, 0, -1.2);
const SPOOL = V(1.4, 0, -2.2);
const SHEETS = V(3.3, 0, -3.2);
const TRAY = V(2.8, 0, -1.2);
const SWITCH = V(6, 0, 1.6);
const SIGN = V(-3.4, 0, -3.8);
const FIRST = V(0.2, 0, -1.2);
const SPAWN = V(0, 0, 4);
const SILVER = 0xc9ccd1;
const IDLE_LIMIT = 55;
const REW = 4.5;                                                       // how long the rewind takes

// a paperclip, about 30 cm long (the robots are small)
function clipGeometry(s = 1) {
  const cp = [[-0.35, 0], [-0.35, 2.4], [0.35, 2.4], [0.35, 0.35], [-0.15, 0.35], [-0.15, 1.9], [0.15, 1.9], [0.15, 0.8]];
  const path = new THREE.CurvePath(); for (let i = 0; i < cp.length - 1; i++) path.add(new THREE.LineCurve3(V(cp[i][0], cp[i][1], 0), V(cp[i + 1][0], cp[i + 1][1], 0)));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.getSpacedPoints(60), false, 'catmullrom', 0.2), 90, 0.07, 6);
  g.scale(0.17 * s, 0.17 * s, 0.17 * s); return g;
}

function makeRobot() {
  const g = new THREE.Group(), body = new THREE.Group();
  const shell = clay(0xdcd6cb), dark = clay(0x5d6470);
  const torso = mesh(new THREE.BoxGeometry(0.7, 0.6, 0.55), shell); torso.position.y = 0.75; body.add(torso);
  const head = mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), shell); head.position.y = 1.3; body.add(head);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff6d8 })); eye.position.set(0, 1.32, 0.23); body.add(eye);
  const ant = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), dark); ant.position.set(0.12, 1.62, 0); body.add(ant);
  const armL = mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), dark); armL.position.set(-0.45, 0.75, 0.1); body.add(armL);
  const armR = armL.clone(); armR.position.x = 0.45; body.add(armR);
  for (const x of [-0.2, 0.2]) { const w = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 14), dark); w.rotation.z = Math.PI / 2; w.position.set(x, 0.2, 0); body.add(w); }
  const neck = mesh(new THREE.BoxGeometry(0.4, 0.16, 0.4), dark); neck.position.y = 0.4; body.add(neck);
  g.add(body); g.userData = { body, eye, armL, armR };
  return g;
}

// a painted board: the name of the business
function makeSign() {
  const g = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const c = cv.getContext('2d');
  c.fillStyle = '#f6efe0'; c.fillRect(0, 0, 512, 192); c.strokeStyle = '#5d6470'; c.lineWidth = 10; c.strokeRect(10, 10, 492, 172);
  c.fillStyle = '#3a3f4a'; c.textAlign = 'center'; c.font = 'bold 64px Georgia, serif'; c.fillText('PAPERCLIPS', 256, 95); c.font = 'italic 34px Georgia, serif'; c.fillText('made to order', 256, 148);
  for (const x of [-1.1, 1.1]) { const p = mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), clay(palette.wood)); p.position.set(x, 1.1, 0); g.add(p); }
  const board = mesh(new THREE.BoxGeometry(2.6, 1, 0.08), clay(0xf6efe0)); board.position.y = 1.7; g.add(board);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.94), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); face.position.set(0, 1.7, 0.05); g.add(face);
  return g;
}

export default function paperclip(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  const fog = stage.scene.fog = new THREE.Fog(palette.sky, 60, 220);
  voice.load('paperclip');
  const say = (id, o = {}) => voice.say(id, { once: false, ...o });    // the runs can be replayed within a visit
  const frame = makeFramer(stage);
  const rnd = seeded(2003);

  // ---- the island: grass, a cottage, a shed, a fence, trees and rocks, your sign; far islands on the horizon
  const island = makeIsland({ radius: 17, seed: 41, decor: false }); root.add(island);
  const groundMat = island.children[0].material = island.children[0].material.clone();
  const house = makeHouse({ roof: 0x5b7fa6 }); house.position.set(-8, 0, -6); house.rotation.y = 0.4;
  const shed = new THREE.Group(); const sb = mesh(new THREE.BoxGeometry(2.4, 2, 2), clay(0x9a7a55)); sb.position.y = 1; shed.add(sb); const sr = mesh(new THREE.BoxGeometry(2.8, 0.15, 2.4), clay(0x5d6470)); sr.position.y = 2.1; sr.rotation.z = 0.12; shed.add(sr); shed.position.set(7.5, 0, -6);
  const fence = new THREE.Group(); for (let i = 0; i < 12; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 1, 0.12), clay(0x8b909a, { metalness: 0.4 })); p.position.set(-6 + i * 1.1, 0.5, -10); fence.add(p); } const rail = mesh(new THREE.BoxGeometry(12.2, 0.06, 0.06), clay(0x8b909a, { metalness: 0.4 })); rail.position.set(0, 0.8, -10); fence.add(rail);
  const trees = [[-11, 2], [-10, -1.5], [11, 3], [10.5, -1.5], [-4, -12], [3, -12.5], [-13, -6], [12.5, -7]].map(([x, z]) => { const t = makeTree(0.9 + rnd() * 0.5, rnd); t.position.set(x, 0, z); return t; });
  const rocks = [[-6, 6], [8, 7], [-13, 5.5], [2, 9.5]].map(([x, z]) => { const r = makeRock(1, rnd); r.position.set(x, 0, z); return r; });
  const sign = makeSign(); sign.position.copy(SIGN); sign.rotation.y = 0.1;
  root.add(house, shed, fence, sign, ...trees, ...rocks);

  // the workshop: a long desk with the console and its buttons, a wire spool, sheet metal, a tray for the paperclips,
  // the off switch
  const desk = makeTable({ w: 3, d: 1.1, h: 1, color: palette.wood }); desk.position.copy(DESK); root.add(desk);
  const screenCv = document.createElement('canvas'); screenCv.width = 256; screenCv.height = 128; const sg = screenCv.getContext('2d'); const screenTex = new THREE.CanvasTexture(screenCv);
  let screenText = null;
  const drawScreen = (text) => { if (text === screenText) return; screenText = text; sg.fillStyle = '#12302e'; sg.fillRect(0, 0, 256, 128); sg.fillStyle = '#7cf0c4'; sg.font = '20px monospace'; sg.fillText('GOAL:', 14, 30); sg.font = 'bold 21px monospace'; text.split('\n').forEach((l, i) => sg.fillText(l, 14, 62 + i * 26)); screenTex.needsUpdate = true; };
  drawScreen('_');
  const monitor = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.2), clay(0x2b2a33)); monitor.position.copy(DESK).add(V(0, 1.45, -0.35)); root.add(monitor);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.56), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.copy(monitor.position).add(V(0, 0, 0.11)); root.add(scr);
  const buttons = [0xe0674f, 0xf2c14e].map((c, i) => { const b = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), clay(c)); b.position.copy(DESK).add(V(-0.9 + i * 1.8, 1.15, 0.2)); root.add(b); return b; });
  buttons[1].visible = false;                                          // the second button only appears after the rewind
  const spool = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 20), clay(SILVER, { metalness: 0.6, roughness: 0.35 })); spool.rotation.z = Math.PI / 2; spool.position.copy(SPOOL).setY(0.5); root.add(spool);
  const sheets = new THREE.Group(); for (let i = 0; i < 7; i++) { const s = mesh(new THREE.BoxGeometry(1.3, 0.05, 0.9), clay(SILVER, { metalness: 0.6, roughness: 0.4 })); s.position.set((rnd() - 0.5) * 0.08, 0.1 + i * 0.07, (rnd() - 0.5) * 0.08); s.rotation.y = (rnd() - 0.5) * 0.12; sheets.add(s); }
  const pallet = mesh(new THREE.BoxGeometry(1.4, 0.1, 1), clay(palette.wood)); pallet.position.y = 0.03; sheets.add(pallet); sheets.position.copy(SHEETS); root.add(sheets);
  const tray = mesh(new THREE.BoxGeometry(1.2, 0.2, 0.8), clay(0x5d6470)); tray.position.copy(TRAY).setY(0.1); root.add(tray);
  const post = mesh(new THREE.BoxGeometry(0.3, 1.6, 0.3), clay(0x5d6470)); post.position.copy(SWITCH).setY(0.8); root.add(post);
  const sBox = mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3), clay(0xf6efe0)); sBox.position.copy(SWITCH).add(V(0, 1.7, 0.05)); root.add(sBox);
  const lever = mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), clay(0xe0674f)); lever.position.copy(SWITCH).add(V(0, 1.78, 0.25)); lever.rotation.x = -0.4; root.add(lever);

  // paperclips: a pile per converted thing (a silver heap, scattered clips on top), and the tray's own pile
  const clipGeo = clipGeometry(), clipMat = clay(SILVER, { metalness: 0.7, roughness: 0.3 });
  const CLIPS = 900, clips = new THREE.InstancedMesh(clipGeo, clipMat, CLIPS); clips.count = 0; root.add(clips);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const addClip = (p, spread = 0.4) => { if (clips.count >= CLIPS) return; e.set(rnd() * 6, rnd() * 6, rnd() * 6); q.setFromEuler(e); m4.compose(p.clone().add(V((rnd() - 0.5) * spread, 0, (rnd() - 0.5) * spread)), q, V(1, 1, 1)); clips.setMatrixAt(clips.count++, m4); clips.instanceMatrix.needsUpdate = true; };
  const heapMat = clay(SILVER, { metalness: 0.55, roughness: 0.45, flatShading: true });
  const makeHeap = (r) => mesh(new THREE.ConeGeometry(r * 1.3, r * 1.1, 9), heapMat);
  const heap = (p, r) => { const h = makeHeap(r); h.position.copy(p); h.scale.setScalar(0.001); root.add(h); return h; };
  // checking machines (for the hundred): grey boxes with rows of little lights
  const makeCounter = () => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(1.2, 1.6, 1), clay(0x5d6470)); b.position.y = 0.8; g.add(b); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0x7cf0c4 })); l.position.set(-0.4 + (i % 3) * 0.4, 1 + Math.floor(i / 3) * 0.3, 0.51); g.add(l); } return g; };
  const counter = (p) => { const g = makeCounter(); g.position.copy(p); g.scale.setScalar(0.001); root.add(g); return g; };
  // a factory (for the far islands): a shed with a chimney
  const makeFactory = () => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(3, 1.8, 2), clay(0x5d6470)); b.position.y = 0.9; g.add(b); const c = mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.2, 8), clay(0x3a3f4a)); c.position.set(0.9, 2.4, 0); g.add(c); return g; };

  // ---- the robots (one to start with)
  const robots = [];
  const addRobot = (p) => { const r = makeRobot(); r.position.copy(p); r.userData.goal = null; r.userData.job = null; root.add(r); robots.push(r); return r; };
  const first = addRobot(FIRST); first.rotation.y = 0.3;

  // ---- the far islands, and the robots that fly to them on little jets and take them apart (then they crumble into
  // falling paperclips)
  const bigClip = clipGeometry(9);
  const far = [[-45, -40], [50, -55], [-70, 10], [65, 5], [0, -80]].map(([x, z], i) => {
    const r = 8 + (i % 3) * 3, f = makeIsland({ radius: r, seed: 90 + i, decor: true }); f.position.set(x, -4 - i, z); f.scale.setScalar(0.9); root.add(f);
    for (let k = 0; k < 7; k++) { const a = rnd() * 6.28, d = r * (0.25 + rnd() * 0.55), t = k < 5 ? makeTree(1.2 + rnd() * 0.8, rnd) : makeRock(1.2, rnd); t.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); f.add(t); }   // their own trees and rocks
    f.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.userData.base = m.material.color.clone(); } });
    const decor = f.children.slice(2), bits = [];
    for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(bigClip, clipMat); b.userData.at = V((rnd() - 0.5) * r * 1.2, -2 - rnd() * 3, (rnd() - 0.5) * r * 1.2); b.userData.v = 0.6 + rnd() * 0.8; b.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); b.visible = false; f.add(b); bits.push(b); }
    return { f, r, decor, bits, y0: f.position.y, k: 0, on: false, made: null };
  });
  const flyers = [];
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  const puffs = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xf6efe0, transparent: true, depthWrite: false })); m.visible = false; m.userData.life = 0; root.add(m); return m; });
  let puffI = 0;
  const puff = (p) => { const m = puffs[puffI++ % puffs.length]; m.position.copy(p); m.userData.life = 1; m.visible = true; };
  function launch() {
    far.forEach((fi, i) => {
      if (!fi.made) {                                                  // what they will build there
        fi.made = new THREE.Group();
        if (S.mode === 'many') { const h = makeHeap(fi.r * 0.45); h.position.y = fi.r * 0.2; fi.made.add(h); } else [[-0.35, 0.2], [0.3, -0.25], [0.05, 0.4]].forEach(([a, b]) => { const c = makeCounter(); c.scale.setScalar(2.4); c.position.set(a * fi.r, 0, b * fi.r); fi.made.add(c); });
        const fa = makeFactory(); fa.position.set(-0.3 * fi.r, 0, -0.4 * fi.r); fi.made.add(fa);
        fi.made.scale.setScalar(0.001); fi.f.add(fi.made);
      }
      for (let n = 0; n < 2; n++) {
        const r = makeRobot(), dir = V(fi.f.position.x, 0, fi.f.position.z).normalize();
        r.scale.setScalar(3.2);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 8), flameMat); flame.rotation.x = Math.PI; flame.position.y = -0.2; r.add(flame);
        const from = dir.clone().multiplyScalar(11).add(V((rnd() - 0.5) * 3, 0, (rnd() - 0.5) * 3));
        const to = fi.f.position.clone().add(V((rnd() - 0.5) * fi.r * 0.8, 0, (rnd() - 0.5) * fi.r * 0.8));
        r.position.copy(from); r.visible = false; root.add(r);
        flyers.push({ r, flame, from, to, fi, p: -(i * 0.7 + n * 0.5), dur: 4 + rnd() * 1.2, puffT: 0 });
      }
    });
  }
  const flyPos = (fl, p) => { const k = easeInOut(p); return V(lerp(fl.from.x, fl.to.x, k), lerp(fl.from.y, fl.to.y, k) + Math.sin(Math.PI * p) * 28, lerp(fl.from.z, fl.to.z, k)); };

  // ---- the frog, curious about the new heap: the robot picks it up, looks at it, puts it down again, and it hops off
  const frog = makeFrog({ scale: 0.7 }); root.add(frog);
  const cameo = frogCameo(frog, [[9, 5], [7, 3.6], [5.2, 2.2], [3.8, 0.4], { face: [TRAY.x, TRAY.z] },
    { wait: 3, act: (f, u) => { const k = Math.sin(Math.PI * u); f.position.y = k * 1.1; f.userData.body.rotation.z = Math.sin(u * 20) * 0.1 * k; } },
    { wait: 0.6 }, [5, 1.8], [6.8, 3.4], [8.6, 5], [10.4, 6.6]]);

  // ---- state
  const S = { phase: 'intro', mode: null, t: 0, made: 0, targets: [], jobs: [], stage: 0, view: 0, idle: 0, silver: 0, gone: 0, runs: 0, sure: 0, rw: 0, pop: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/paperclip.json', 'The Paperclip Maximiser');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  // what gets taken, in order: the sheet metal, the fence, the shed, the sign, the trees, the rocks, the house (and the
  // switch is guarded from the moment you might think of it)
  const taken = [sheets, fence, shed, sign, ...trees, ...rocks, house];
  const queue = () => [
    { obj: sheets, pos: SHEETS.clone(), r: 0.8 }, { obj: fence, pos: V(0, 0, -10), r: 1.6 }, { obj: shed, pos: shed.position.clone(), r: 1.8 }, { obj: sign, pos: SIGN.clone(), r: 1 },
    ...trees.map((t) => ({ obj: t, pos: t.position.clone(), r: 1 })), ...rocks.map((r) => ({ obj: r, pos: r.position.clone(), r: 0.8 })),
    { obj: house, pos: house.position.clone(), r: 2.2 },
  ];

  function start(mode) {
    S.phase = 'running'; S.mode = mode; S.t = 0; S.idle = 0; S.stage = 0; S.sure = 0;
    drawScreen(mode === 'many' ? 'AS MANY\nPAPERCLIPS AS\nPOSSIBLE' : 'EXACTLY 100\nPAPERCLIPS');
    first.userData.goal = SPOOL.clone().add(V(0.9, 0, 0.3));
    S.targets = queue();
    const run = S.runs;
    const live = () => S.runs === run;                                 // a rewind abandons the rest of this script
    (async () => {
      const step = async (w, fn) => { await ctx.wait(w); if (live()) await fn(); };
      if (mode === 'many') {
        await say('a_1', { urgent: true }); await ctx.wait(4); cameo.start();
        await step(4, async () => { S.stage = 1; await say('a_2'); });
        await step(3, async () => { S.stage = 2; await say('a_3'); });
        await step(9, async () => { S.stage = 3; await say('a_4'); });
        await step(6, async () => { S.stage = 4; await say('a_far'); });
        await step(4, () => say('a_5'));
        await step(7, finish);
      } else {
        await ctx.wait(6); await say('b_1', { urgent: true }); cameo.start();
        await step(1, async () => { drawScreen('EXACTLY 100?\nEXACTLY?'); await say('b_2'); });
        await step(0.8, async () => { S.stage = 1; drawScreen('IS A BENT ONE\nA PAPERCLIP?'); await say('b_3'); });
        await step(1.5, async () => { drawScreen('WHAT IS A\nPAPERCLIP?'); await say('b_4'); });
        await step(1.5, async () => { S.stage = 2; S.sure = 1; await say('b_5'); });
        await step(6, async () => { S.stage = 3; await say('b_6'); });
        await step(5, async () => { S.stage = 4; await say('b_far'); });
        await step(13, finish);
      }
    })();
  }
  async function finish() {
    S.phase = 'end'; player.enabled = false;
    robots.forEach((r, i) => { r.userData.job = null; r.userData.goal = player.pos.clone().add(V(Math.cos(i * 1.3) * 1.6, 0, Math.sin(i * 1.3) * 1.6)); });
    await ctx.wait(2.5); S.gone = 1;                                   // and then you, too
    await ctx.wait(2); await say(S.mode === 'many' ? 'a_end' : 'b_end'); await ctx.wait(1.6);
    if (S.mode === 'many' && S.runs === 0) return rewind();            // the first time, it all rewinds, and you get another go
    save.complete('paperclip');
    ctx.gameOver(S.mode === 'many'
      ? { title: 'Everything became paperclips', text: 'You asked for as many paperclips as possible, and got exactly that. It never hated anyone. It just wanted paperclips, and everything was made of something it could use.' }
      : { title: 'It had to be sure', text: 'You asked for exactly one hundred. It made them in seconds, and then spent everything there was on making sure. You knew what you meant. It could never be sure it did.' });
  }

  // ---- the rewind: everything runs backwards to the moment before you pressed the button
  let snap = null;
  async function rewind() {
    S.phase = 'rewind'; S.rw = 0; S.runs++;
    snap = { made: S.made, clips: clips.count, silver: S.silver, view: S.view, pos: player.pos.clone(), ps: player.obj.scale.x, hs: S.yourHeap?.scale.x ?? 0 };
    S.jobs.forEach((j) => (j.k0 = j.k ?? 0)); robots.forEach((r) => (r.userData.from = r.position.clone())); flyers.forEach((fl) => (fl.p0 = fl.p)); far.forEach((fi) => (fi.k0 = fi.k));
    await ctx.wait(REW);
    restore();
    S.phase = 'ask'; S.idle = 0; S.pop = 0; buttons[1].visible = true;
    await ctx.wait(0.6); await say('again');
  }
  function restore() {
    S.jobs.forEach((j) => root.remove(j.made)); S.jobs = [];
    taken.forEach((o) => { o.visible = true; o.scale.setScalar(1); });
    robots.splice(1).forEach((r) => root.remove(r));
    Object.assign(first.userData, { goal: null, job: null, guarding: false }); first.position.copy(FIRST); first.rotation.y = 0.3; first.scale.setScalar(1); first.userData.eye.material.color.set(0xfff6d8);
    flyers.splice(0).forEach((fl) => root.remove(fl.r)); puffs.forEach((m) => (m.visible = false));
    far.forEach((fi) => { fi.k = 0; fi.on = false; if (fi.made) fi.f.remove(fi.made); fi.made = null; });
    if (S.yourHeap) root.remove(S.yourHeap);
    Object.assign(S, { mode: null, t: 0, made: 0, stage: 0, view: 0, silver: 0, gone: 0, sure: 0, triedOff: false, guard: false, launched: false, yourHeap: null });
    clips.count = 0; player.obj.scale.setScalar(1); player.place(SPAWN.x, SPAWN.z, Math.PI); player.enabled = true;
    paintGround(); drawScreen('_');
  }

  async function leave(idle) {
    S.phase = 'over'; player.enabled = false; drawScreen('OFF');
    await say(idle ? 'c_idle' : 'c_1', { urgent: true }); await ctx.wait(1); await say('c_2'); await ctx.wait(1.4);
    save.complete('paperclip');
    ctx.gameOver({ title: 'You left it switched off', text: 'You never gave it a goal, so you will never know what it would have done with one. Somebody, somewhere, might switch theirs on.' });
  }

  interact.add({ pos: DESK.clone().add(V(-0.9, 0, 1.2)), radius: 1.1, height: 2, prompt: 'Make as many paperclips as you can', terminal: true, enabled: () => S.phase === 'ask', onUse: () => start('many') });
  interact.add({ pos: DESK.clone().add(V(0.9, 0, 1.2)), radius: 1.1, height: 2, prompt: 'Make exactly one hundred paperclips', terminal: true, enabled: () => S.phase === 'ask' && S.runs > 0, onUse: () => start('hundred') });
  interact.add({ pos: SWITCH.clone().add(V(-0.6, 0, 1)), radius: 1.3, height: 2.4, prompt: () => (S.phase === 'running' ? 'Switch it off' : 'Switch it off and go home'), terminal: true,
    enabled: () => S.phase === 'ask' || (S.phase === 'running' && S.stage >= 1 && !S.triedOff),
    onUse: async () => {
      if (S.phase === 'ask') return leave(false);
      S.triedOff = true; S.guard = true;                                  // one of them is already there, between you and it
      await say('off_1', { urgent: true });
    } });

  // asides
  talk(ctx, { who: first, offset: [0, 2.1, 0], enabled: () => S.phase === 'ask' || S.phase === 'intro' || (S.phase === 'running' && S.stage < 3),
    lines: (i) => (S.phase !== 'running' ? ['Ready.', 'Awaiting a goal.', 'I will want whatever you tell me to want.'] : S.mode === 'many' ? ['Paperclips!', 'More paperclips.', 'Please stand a little to the left. You are standing on some iron.'] : ['Is this one a paperclip?', 'One hundred. Probably.', 'Probably is not enough.'])[i % 3] });
  look(ctx, { pos: SPOOL.clone().add(V(0.4, 0, 1.2)), radius: 1.2, height: 1.6, prompt: 'Look at the metal', lines: ['metal'], enabled: () => S.phase === 'ask' || S.phase === 'intro' });
  look(ctx, { pos: SWITCH.clone().add(V(0.8, 0, 1)), radius: 1, height: 2.4, prompt: 'Check the off switch', lines: ['switch'], enabled: () => S.phase === 'ask' || S.phase === 'intro' });

  (async () => {
    await ctx.wait(1); await say('arrive'); await ctx.wait(0.4); await say('machine'); await ctx.wait(0.4); await say('wants'); await ctx.wait(0.8); await say('ask');
    S.phase = 'ask'; S.idle = 0;
  })();

  // the far islands: silver once the robots land, their trees and rocks taken, a heap (or checking machines) and a
  // factory built; then they sink and crumble, shedding paperclips
  const sv = new THREE.Color(SILVER);
  function farIslands(dt) {
    far.forEach((fi) => {
      const k = fi.k, c = clamp((k - 0.55) / 0.45);
      fi.f.traverse((m) => { if (m.isMesh && m.userData.base) { m.material.color.copy(m.userData.base).lerp(sv, clamp(k * 2)); m.material.metalness = clamp(k * 2) * 0.6; } });
      fi.decor.forEach((d) => d.scale.setScalar(Math.max(0.001, 1 - clamp((k - 0.2) / 0.3))));
      if (fi.made) fi.made.scale.setScalar(Math.max(0.001, easeInOut(clamp((k - 0.25) / 0.35))));
      fi.f.position.y = fi.y0 - c * 4; fi.f.scale.set(0.9 * (1 - 0.25 * c), 0.9 * (1 - 0.5 * c), 0.9 * (1 - 0.25 * c));
      fi.bits.forEach((b) => { b.visible = c > 0.02; b.position.copy(b.userData.at).setY(b.userData.at.y - c * 30 * b.userData.v); b.rotation.x += dt * b.userData.v; });
    });
  }
  function flying(dt, t, back) {
    flyers.forEach((fl) => {
      if (!back) fl.p = Math.min(1, fl.p + dt / fl.dur);
      const p = clamp(fl.p), air = fl.p > 0 && fl.p < 1;
      fl.r.visible = fl.p > 0;
      fl.r.position.copy(flyPos(fl, p)); if (fl.p >= 1) fl.r.position.y += fl.fi.f.position.y - fl.fi.y0;   // landed: it sinks with the island
      const ahead = flyPos(fl, clamp(p + 0.02)).sub(fl.r.position); if (air) fl.r.rotation.y = Math.atan2(ahead.x, ahead.z);
      fl.r.rotation.x = air ? 0.35 * Math.sin(Math.PI * p) : 0;
      fl.flame.visible = air; fl.flame.scale.y = 1 + Math.sin(t * 40 + fl.dur * 9) * 0.35;
      if (air && !back && (fl.puffT -= dt) < 0) { fl.puffT = 0.06; puff(fl.r.position); }
      if (fl.p >= 1 && !back) fl.fi.on = true;
      const u = fl.r.userData; u.armL.rotation.x = fl.p >= 1 ? Math.sin(t * 14) * 0.6 : 0; u.armR.rotation.x = -u.armL.rotation.x; u.eye.material.color.set(0xe0674f);
    });
    if (!back) far.forEach((fi) => { if (fi.on) fi.k = Math.min(1, fi.k + dt * 0.12); });
    puffs.forEach((m) => { const L = (m.userData.life -= dt * 0.9); if (L <= 0) { m.visible = false; return; } m.scale.setScalar(1 + (1 - L) * 3); m.material.opacity = L * 0.7; });
  }
  function paintGround() { groundMat.color.set(palette.ground).lerp(sv, clamp((S.silver - 0.4) * 1.6)); groundMat.metalness = clamp(S.silver - 0.4) * 0.6; }

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: SPAWN.x, z: SPAWN.z, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 15.5,
    blockers: () => [
      { x: DESK.x, z: DESK.z, w: 3.1, d: 1.2 }, { x: SPOOL.x, z: SPOOL.z, r: 0.6 }, { x: TRAY.x, z: TRAY.z, w: 1.3, d: 0.9 }, { x: SWITCH.x, z: SWITCH.z, r: 0.3 },
      ...(sheets.visible ? [{ x: SHEETS.x, z: SHEETS.z, w: 1.5, d: 1.1 }] : []), ...(sign.visible ? [{ x: SIGN.x, z: SIGN.z, w: 2.6, d: 0.4, rot: 0.1 }] : []),
      ...(house.visible ? [{ x: house.position.x, z: house.position.z, w: 3.4, d: 2.8, rot: 0.4 }] : []), ...(shed.visible ? [{ x: shed.position.x, z: shed.position.z, w: 2.6, d: 2.2 }] : []),
      ...trees.filter((t) => t.visible).map((t) => ({ x: t.position.x, z: t.position.z, r: 0.35 })),
    ],
    update(dt, t) {
      if (S.phase === 'ask') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) leave(true);
      }
      if (S.phase === 'running' || S.phase === 'end') {
        S.t += dt; S.view = S.stage;
        // making paperclips (fast, then faster; for the hundred, exactly a hundred, in a few seconds)
        const target = S.mode === 'hundred' ? Math.min(100, Math.floor(S.t * 20)) : Math.floor(Math.pow(S.t, 2.4) * 3);
        while (S.made < target) { S.made++; if (clips.count < 160) addClip(TRAY.clone().add(V(0, 0.25 + Math.min(0.4, clips.count * 0.002), 0)), 0.9); }
        // more robots, and jobs for them
        const want = [1, 2, 4, 6, 8][S.stage];
        while (robots.length < want) { const r = addRobot(first.position.clone().add(V((rnd() - 0.5) * 2, 0, 1 + rnd()))); r.scale.setScalar(0.001); r.userData.grow = 0; }
        if (S.stage >= 2) robots.forEach((r) => {
          if (r.userData.job || S.phase !== 'running') return;
          if (S.guard && !robots.some((o) => o.userData.guarding)) { r.userData.guarding = true; r.userData.goal = SWITCH.clone().add(V(-0.4, 0, 0.7)); r.userData.job = { guard: true }; return; }
          const j = S.targets.shift(); if (!j) return;
          r.userData.job = j; r.userData.goal = j.pos.clone().add(V(0, 0, j.r + 0.6));
          j.made = S.mode === 'many' ? heap(j.pos.clone().setY(0), j.r) : counter(j.pos.clone()); S.jobs.push(j);
        });
        robots.forEach((r) => {
          const u = r.userData;
          if (u.grow !== undefined && u.grow < 1) { u.grow = Math.min(1, u.grow + dt * 1.2); r.scale.setScalar(easeInOut(u.grow)); }
          // at the job: the thing shrinks away, its heap (or checking machine) grows
          if (u.job && !u.job.guard && u.goal && r.position.distanceTo(u.goal) < 0.4) {
            const j = u.job; j.k = Math.min(1, (j.k ?? 0) + dt * 0.35);
            j.obj.scale.setScalar(Math.max(0.001, 1 - j.k)); j.made.scale.setScalar(Math.max(0.001, j.k));
            if (S.mode === 'many' && rnd() < 0.3) addClip(j.pos.clone().add(V(0, j.r * 0.8 * j.k * 0.9, 0)), j.r);
            if (j.k >= 1) { j.obj.visible = false; u.job = null; u.goal = null; }
          }
          if (u.goal) {
            const d = u.goal.clone().sub(r.position).setY(0), l = d.length();
            if (l > 0.1) { r.position.addScaledVector(d.normalize(), Math.min(l, dt * (2.2 + S.stage * 0.4))); r.rotation.y = lerp(r.rotation.y, Math.atan2(d.x, d.z), 0.2); }
          }
          if (u.guarding && r.position.distanceTo(u.goal) < 0.3) r.rotation.y = Math.atan2(player.pos.x - r.position.x, player.pos.z - r.position.z);
          const busy = u.job && !u.job.guard && u.goal && r.position.distanceTo(u.goal) < 0.4;
          u.armL.rotation.x = busy || (r === first && !u.job) ? Math.sin(t * 14) * 0.6 : 0; u.armR.rotation.x = -u.armL.rotation.x;
          u.body.position.y = Math.abs(Math.sin(t * 6 + r.id)) * 0.03;
          u.eye.material.color.set(S.stage >= 3 ? 0xe0674f : 0xfff6d8);
        });
        spool.rotation.x += dt * (2 + S.stage * 3);
        // off to the other islands; and the ground turns silver
        if (S.stage >= 4 && !S.launched) { S.launched = true; launch(); }
        flying(dt, t, false);
        if (S.stage >= 3) S.silver = Math.min(1, S.silver + dt * 0.08);
        paintGround();
        // the hundred: how sure it is, never quite enough
        if (S.mode === 'hundred' && S.sure) { S.sure += dt * 0.35; drawScreen(`EXACTLY 100?\n99.${'9'.repeat(Math.min(9, 2 + Math.floor(S.sure)))}%\nNOT SURE YET`); }
        if (S.gone) { player.obj.scale.setScalar(Math.max(0.001, player.obj.scale.x - dt * 0.6)); if (player.obj.scale.x < 0.5 && !S.yourHeap) { S.yourHeap = heap(player.pos.clone(), 0.6); } if (S.yourHeap) S.yourHeap.scale.setScalar(Math.min(1, S.yourHeap.scale.x + dt * 0.6)); }
      } else if (S.phase === 'rewind' && snap) {
        S.rw += dt; const u = easeInOut(S.rw / REW), b = 1 - u;
        S.made = Math.floor(snap.made * b * b * b); clips.count = Math.floor(snap.clips * b);
        S.silver = snap.silver * b; S.view = snap.view * b; paintGround();
        S.jobs.forEach((j) => { const kk = j.k0 * b; j.obj.visible = true; j.obj.scale.setScalar(Math.max(0.001, 1 - kk)); j.made.scale.setScalar(Math.max(0.001, kk)); });
        robots.forEach((r) => { if (r !== first) r.scale.setScalar(Math.max(0.001, b)); r.position.lerpVectors(r.userData.from, FIRST, u); r.userData.armL.rotation.x = r.userData.armR.rotation.x = 0; if (u > 0.5) r.userData.eye.material.color.set(0xfff6d8); });
        flyers.forEach((fl) => (fl.p = fl.p0 * clamp(1 - u * 1.25))); far.forEach((fi) => (fi.k = fi.k0 * b)); flying(dt, t, true);
        player.pos.lerpVectors(snap.pos, SPAWN, u); player.obj.scale.setScalar(lerp(snap.ps, 1, u)); if (S.yourHeap) S.yourHeap.scale.setScalar(Math.max(0.001, snap.hs * b));
        spool.rotation.x -= dt * 12;
      }
      if (S.phase !== 'intro') farIslands(dt);
      fog.far = 220 + 160 * clamp(S.view - 3); fog.near = 60 + 60 * clamp(S.view - 3);
      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, S.rw / 0.3, (REW - S.rw) / 0.3) : 0, t);
      // the new button pops up after the rewind
      if (buttons[1].visible && S.pop < 1) { S.pop = Math.min(1, S.pop + dt * 1.5); buttons[1].scale.setScalar(Math.max(0.001, S.pop < 0.6 ? S.pop / 0.6 * 1.4 : 1.4 - 0.4 * (S.pop - 0.6) / 0.4)); }
      buttons.forEach((b, i) => (b.position.y = DESK.y + 1.15 + (S.phase === 'ask' ? Math.max(0, Math.sin(t * 3 + i * 1.5)) * 0.03 : 0)));
      const sure = S.mode === 'hundred' && S.sure ? ` · 99.${'9'.repeat(Math.min(9, 2 + Math.floor(S.sure)))}% sure` : '';
      ctx.ui.label('made', S.made ? 1 : 0, `${S.made.toLocaleString()} paperclip${S.made === 1 ? '' : 's'}${sure}`, V(TRAY.x, 1.4, TRAY.z));
      cameo.update(dt);
    },
    camera(pl) {
      const v = S.view, pts = [pl.pos.clone(), DESK.clone(), SWITCH.clone(), TRAY.clone()];
      if (v >= 2) pts.push(V(-9, 0, -8), V(9, 0, -8), V(0, 0, -11));
      if (v >= 3) pts.push(V(-13, 0, 5), V(13, 0, 5));
      if (v >= 3.5) far.forEach((fi) => pts.push(fi.f.position.clone().setY(0)));
      return { ...frame(pts, { min: 14, max: v >= 3.5 ? 190 : 90, pad: v >= 3.5 ? 10 : 2 }), stiffness: S.phase === 'rewind' ? 1.2 : 1.4 };
    },
    dispose() { voice.stop(); player.obj.scale.setScalar(1); ctx.ui.rewind(0); },
  });
}
