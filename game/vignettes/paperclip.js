// Vignette: The Paperclip Maximiser.
// Your workshop on a small island, and your new machine: a little robot cleverer than anyone who has ever lived. It
// will want whatever you tell it to want. Press one of the buttons on the console: "Make as many paperclips as you can"
// or "Make exactly one hundred paperclips"; or switch it off at the wall and go home. Either goal ends the same way, for
// different reasons: more of it, the fence, the shed, the trees, the house, the far islands. The off switch? It saw that
// coming. It doesn't hate you. It just has other plans for what you're made of.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeIsland, makeTree, makeRock, makeHouse, makeFrog, makeTable } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DESK = V(-2.6, 0, -1.2);
const SPOOL = V(1.4, 0, -2.2);
const TRAY = V(2.8, 0, -1.2);
const SWITCH = V(6, 0, 1.6);
const SILVER = 0xc9ccd1;
const IDLE_LIMIT = 55;

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

export default function paperclip(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 220);
  voice.load('paperclip');
  const frame = makeFramer(stage);
  const rnd = seeded(2003);

  // ---- the island: grass, a cottage, a shed, a fence, trees and rocks; far islands on the horizon
  const island = makeIsland({ radius: 17, seed: 41, decor: false }); root.add(island);
  const groundMat = island.children[0].material = island.children[0].material.clone();
  const house = makeHouse({ roof: 0x5b7fa6 }); house.position.set(-8, 0, -6); house.rotation.y = 0.4;
  const shed = new THREE.Group(); const sb = mesh(new THREE.BoxGeometry(2.4, 2, 2), clay(0x9a7a55)); sb.position.y = 1; shed.add(sb); const sr = mesh(new THREE.BoxGeometry(2.8, 0.15, 2.4), clay(0x5d6470)); sr.position.y = 2.1; sr.rotation.z = 0.12; shed.add(sr); shed.position.set(7.5, 0, -6);
  const fence = new THREE.Group(); for (let i = 0; i < 12; i++) { const p = mesh(new THREE.BoxGeometry(0.12, 1, 0.12), clay(0x8b909a, { metalness: 0.4 })); p.position.set(-6 + i * 1.1, 0.5, -10); fence.add(p); } const rail = mesh(new THREE.BoxGeometry(12.2, 0.06, 0.06), clay(0x8b909a, { metalness: 0.4 })); rail.position.set(0, 0.8, -10); fence.add(rail);
  const trees = [[-11, 2], [-10, -1.5], [11, 3], [10.5, -1.5], [-4, -12], [3, -12.5], [-13, -6], [12.5, -7]].map(([x, z]) => { const t = makeTree(0.9 + rnd() * 0.5, rnd); t.position.set(x, 0, z); return t; });
  const rocks = [[-6, 6], [8, 7], [-13, 5.5], [2, 9.5]].map(([x, z]) => { const r = makeRock(1, rnd); r.position.set(x, 0, z); return r; });
  root.add(house, shed, fence, ...trees, ...rocks);
  const far = [[-45, -40], [50, -55], [-70, 10], [65, 5], [0, -80]].map(([x, z], i) => { const f = makeIsland({ radius: 8 + (i % 3) * 3, seed: 90 + i, decor: true }); f.position.set(x, -4 - i, z); f.scale.setScalar(0.9); root.add(f); f.traverse((m) => { if (m.isMesh) m.material = m.material.clone(); }); return f; });

  // the workshop: a long desk with the console and three buttons, a wire spool, a tray for the paperclips, the off switch
  const desk = makeTable({ w: 3, d: 1.1, h: 1, color: palette.wood }); desk.position.copy(DESK); root.add(desk);
  const screenCv = document.createElement('canvas'); screenCv.width = 256; screenCv.height = 128; const sg = screenCv.getContext('2d'); const screenTex = new THREE.CanvasTexture(screenCv);
  const drawScreen = (text) => { sg.fillStyle = '#12302e'; sg.fillRect(0, 0, 256, 128); sg.fillStyle = '#7cf0c4'; sg.font = '20px monospace'; sg.fillText('GOAL:', 14, 34); sg.font = 'bold 22px monospace'; text.split('\n').forEach((l, i) => sg.fillText(l, 14, 70 + i * 26)); screenTex.needsUpdate = true; };
  drawScreen('_');
  const monitor = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.2), clay(0x2b2a33)); monitor.position.copy(DESK).add(V(0, 1.45, -0.35)); root.add(monitor);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.56), new THREE.MeshBasicMaterial({ map: screenTex })); scr.position.copy(monitor.position).add(V(0, 0, 0.11)); root.add(scr);
  const buttons = [0xe0674f, 0xf2c14e].map((c, i) => { const b = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), clay(c)); b.position.copy(DESK).add(V(-0.9 + i * 1.8, 1.07, 0.2)); root.add(b); return b; });
  const spool = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 20), clay(SILVER, { metalness: 0.6, roughness: 0.35 })); spool.rotation.z = Math.PI / 2; spool.position.copy(SPOOL).setY(0.5); root.add(spool);
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
  const heap = (p, r) => { const h = mesh(new THREE.ConeGeometry(r * 1.3, r * 1.1, 9), heapMat); h.position.copy(p); h.scale.setScalar(0.001); root.add(h); return h; };
  // counting machines (for the hundred): grey boxes with rows of little lights
  const counter = (p) => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(1.2, 1.6, 1), clay(0x5d6470)); b.position.y = 0.8; g.add(b); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0x7cf0c4 })); l.position.set(-0.4 + (i % 3) * 0.4, 1 + Math.floor(i / 3) * 0.3, 0.51); g.add(l); } g.position.copy(p); g.scale.setScalar(0.001); root.add(g); return g; };

  // ---- the robots (one to start with)
  const robots = [];
  const addRobot = (p) => { const r = makeRobot(); r.position.copy(p); r.userData.goal = null; r.userData.job = null; root.add(r); robots.push(r); return r; };
  const first = addRobot(V(0.2, 0, -1.2)); first.rotation.y = 0.3;

  // ---- the frog, curious about the new heap: the robot picks it up, looks at it, puts it down again, and it hops off
  const frog = makeFrog({ scale: 0.7 }); root.add(frog);
  const cameo = frogCameo(frog, [[9, 5], [7, 3.6], [5.2, 2.2], [3.8, 0.4], { face: [TRAY.x, TRAY.z] },
    { wait: 3, act: (f, u) => { const k = Math.sin(Math.PI * u); f.position.y = k * 1.1; f.userData.body.rotation.z = Math.sin(u * 20) * 0.1 * k; } },
    { wait: 0.6 }, [5, 1.8], [6.8, 3.4], [8.6, 5], [10.4, 6.6]]);

  // ---- state
  const S = { phase: 'intro', mode: null, t: 0, made: 0, targets: [], stage: 0, idle: 0, silver: 0, gone: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/paperclip.json', 'The Paperclip Maximiser');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  // what gets taken, in order: the fence, the shed, the trees, the rocks, the house, the far islands (and the switch is
  // guarded from the moment you might think of it)
  const queue = () => [
    { obj: fence, pos: V(0, 0, -10), r: 1.6 }, { obj: shed, pos: shed.position.clone(), r: 1.8 },
    ...trees.map((t) => ({ obj: t, pos: t.position.clone(), r: 1 })), ...rocks.map((r) => ({ obj: r, pos: r.position.clone(), r: 0.8 })),
    { obj: house, pos: house.position.clone(), r: 2.2 },
  ];

  function start(mode) {
    S.phase = 'running'; S.mode = mode; S.t = 0; S.idle = 0;
    drawScreen(mode === 'many' ? 'AS MANY\nPAPERCLIPS AS\nPOSSIBLE' : 'EXACTLY 100\nPAPERCLIPS');
    first.userData.goal = SPOOL.clone().add(V(0.9, 0, 0.3));
    S.targets = queue();
    (async () => {
      if (mode === 'many') {
        await voice.say('a_1', { urgent: true }); await ctx.wait(4); cameo.start();
        await ctx.wait(4); S.stage = 1; await voice.say('a_2');
        await ctx.wait(3); S.stage = 2; await voice.say('a_3');
        await ctx.wait(9); S.stage = 3; await voice.say('a_4');
        await ctx.wait(6); S.stage = 4; await voice.say('a_5');
        await ctx.wait(7); finish();
      } else {
        await ctx.wait(7); await voice.say('b_1', { urgent: true }); cameo.start();
        await ctx.wait(1.5); S.stage = 1; await voice.say('b_2');
        await ctx.wait(3); S.stage = 2; await voice.say('b_3');
        await ctx.wait(9); S.stage = 3; await voice.say('b_4');
        await ctx.wait(8); S.stage = 4; await ctx.wait(4); finish();
      }
    })();
  }
  async function finish() {
    S.phase = 'end'; player.enabled = false;
    robots.forEach((r, i) => { r.userData.job = null; r.userData.goal = player.pos.clone().add(V(Math.cos(i * 1.3) * 1.6, 0, Math.sin(i * 1.3) * 1.6)); });
    await ctx.wait(2.5); S.gone = 1;                                   // and then you, too
    await ctx.wait(2); await voice.say(S.mode === 'many' ? 'a_end' : 'b_end'); await ctx.wait(1.6);
    save.complete('paperclip');
    ctx.gameOver(S.mode === 'many'
      ? { title: 'Everything became paperclips', text: 'You asked for as many paperclips as possible, and got exactly that. It never hated anyone. It just wanted paperclips, and everything was made of something it could use.' }
      : { title: 'It had to be sure', text: 'You asked for exactly one hundred. It made them in a minute, and then spent everything there was on making sure. Even a small goal, held perfectly, never quite stops.' });
  }
  async function leave(idle) {
    S.phase = 'over'; player.enabled = false; drawScreen('OFF');
    await voice.say(idle ? 'c_idle' : 'c_1', { urgent: true }); await ctx.wait(1); await voice.say('c_2'); await ctx.wait(1.4);
    save.complete('paperclip');
    ctx.gameOver({ title: 'You left it switched off', text: 'You never gave it a goal, so you will never know what it would have done with one. Somebody, somewhere, might switch theirs on.' });
  }

  interact.add({ pos: DESK.clone().add(V(-0.9, 0, 1.2)), radius: 1.1, height: 2, prompt: 'Make as many paperclips as you can', terminal: true, enabled: () => S.phase === 'ask', onUse: () => start('many') });
  interact.add({ pos: DESK.clone().add(V(0.9, 0, 1.2)), radius: 1.1, height: 2, prompt: 'Make exactly one hundred paperclips', terminal: true, enabled: () => S.phase === 'ask', onUse: () => start('hundred') });
  interact.add({ pos: SWITCH.clone().add(V(-0.6, 0, 1)), radius: 1.3, height: 2.4, prompt: () => (S.phase === 'running' ? 'Switch it off' : 'Switch it off and go home'), terminal: true,
    enabled: () => S.phase === 'ask' || (S.phase === 'running' && S.stage >= 1 && !S.triedOff),
    onUse: async () => {
      if (S.phase === 'ask') return leave(false);
      S.triedOff = true; S.guard = true;                                  // one of them is already there, between you and it
      await voice.say('off_1', { urgent: true });
    } });

  // asides
  talk(ctx, { who: first, offset: [0, 2.1, 0], enabled: () => S.phase === 'ask' || S.phase === 'intro' || S.phase === 'running',
    lines: (i) => (S.phase === 'running' ? ['Paperclips!', 'More paperclips.', 'Please stand a little to the left. You are standing on some iron.'][i % 3] : ['Ready.', 'Awaiting a goal.', 'I will want whatever you tell me to want.'][i % 3]) });
  look(ctx, { pos: SPOOL.clone().add(V(0, 0, 1.2)), radius: 1.2, height: 1.6, prompt: 'Look at the spool', lines: ['spool'], enabled: () => S.phase === 'ask' || S.phase === 'intro' });
  look(ctx, { pos: SWITCH.clone().add(V(0.8, 0, 1)), radius: 1, height: 2.4, prompt: 'Check the off switch', lines: ['switch'], enabled: () => S.phase === 'ask' || S.phase === 'intro' });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('wants'); await ctx.wait(0.8); await voice.say('ask');
    S.phase = 'ask'; S.idle = 0;
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 4, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 15.5,
    blockers: () => [
      { x: DESK.x, z: DESK.z, w: 3.1, d: 1.2 }, { x: SPOOL.x, z: SPOOL.z, r: 0.6 }, { x: TRAY.x, z: TRAY.z, w: 1.3, d: 0.9 }, { x: SWITCH.x, z: SWITCH.z, r: 0.3 },
      ...(house.visible ? [{ x: house.position.x, z: house.position.z, w: 3.4, d: 2.8, rot: 0.4 }] : []), ...(shed.visible ? [{ x: shed.position.x, z: shed.position.z, w: 2.6, d: 2.2 }] : []),
      ...trees.filter((t) => t.visible).map((t) => ({ x: t.position.x, z: t.position.z, r: 0.35 })),
    ],
    update(dt, t) {
      if (S.phase === 'ask') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) leave(true);
      }
      if (S.phase === 'running' || S.phase === 'end') {
        S.t += dt;
        // making paperclips (fast, then faster; for the hundred, exactly a hundred)
        const target = S.mode === 'hundred' ? 100 : Math.floor(Math.pow(S.t, 2.4) * 3);
        while (S.made < target && S.made < (S.mode === 'hundred' ? 100 : 1e9)) { S.made++; if (clips.count < 160) addClip(TRAY.clone().add(V(0, 0.25 + Math.min(0.4, clips.count * 0.002), 0)), 0.9); }
        // more robots, and jobs for them
        const want = [1, 2, 4, 6, 8][S.stage];
        while (robots.length < want) { const r = addRobot(first.position.clone().add(V((rnd() - 0.5) * 2, 0, 1 + rnd()))); r.scale.setScalar(0.001); r.userData.grow = 0; }
        if (S.stage >= 2) robots.forEach((r) => {
          if (r.userData.job || S.phase !== 'running') return;
          if (S.guard && !robots.some((o) => o.userData.guarding)) { r.userData.guarding = true; r.userData.goal = SWITCH.clone().add(V(-0.4, 0, 0.7)); r.userData.job = { guard: true }; return; }
          const j = S.targets.shift(); if (!j) return;
          r.userData.job = j; r.userData.goal = j.pos.clone().add(V(0, 0, j.r + 0.6));
          j.made = S.mode === 'many' ? heap(j.pos.clone().setY(0), j.r) : counter(j.pos.clone());
        });
        robots.forEach((r) => {
          const u = r.userData;
          if (u.grow !== undefined && u.grow < 1) { u.grow = Math.min(1, u.grow + dt * 1.2); r.scale.setScalar(easeInOut(u.grow)); }
          // at the job: the thing shrinks away, its heap (or counting machine) grows
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
        // the far islands, and then the ground, turn silver
        if (S.stage >= 3) S.silver = Math.min(1, S.silver + dt * 0.08);
        const sv = new THREE.Color(SILVER);
        far.forEach((f, i) => f.traverse((m) => { if (m.isMesh) { m.userData.base ??= m.material.color.clone(); m.material.color.copy(m.userData.base).lerp(sv, clamp(S.silver * 1.6 - i * 0.12)); m.material.metalness = clamp(S.silver - i * 0.1) * 0.6; } }));
        groundMat.color.set(palette.ground).lerp(sv, clamp((S.silver - 0.4) * 1.6)); groundMat.metalness = clamp(S.silver - 0.4) * 0.6;
        if (S.gone) { player.obj.scale.setScalar(Math.max(0.001, player.obj.scale.x - dt * 0.6)); if (player.obj.scale.x < 0.5 && !S.yourHeap) { S.yourHeap = heap(player.pos.clone(), 0.6); } if (S.yourHeap) S.yourHeap.scale.setScalar(Math.min(1, S.yourHeap.scale.x + dt * 0.6)); }
      }
      buttons.forEach((b, i) => (b.position.y = DESK.y + 1.07 + (S.phase === 'ask' ? Math.max(0, Math.sin(t * 3 + i * 1.5)) * 0.03 : 0)));
      ctx.ui.label('made', S.made ? 1 : 0, `${S.made.toLocaleString()} paperclip${S.made === 1 ? '' : 's'}`, V(TRAY.x, 1.4, TRAY.z));
      cameo.update(dt);
    },
    camera(pl) {
      const pts = [pl.pos.clone(), DESK.clone(), SWITCH.clone(), TRAY.clone()];
      if (S.stage >= 2) pts.push(V(-9, 0, -8), V(9, 0, -8), V(0, 0, -11));
      if (S.stage >= 3) pts.push(V(-13, 0, 5), V(13, 0, 5));
      if (S.stage >= 4 || S.phase === 'end') pts.push(V(-40, 0, -40), V(45, 0, -50));
      return { ...frame(pts, { min: 14, max: 90 }), stiffness: 1.4 };
    },
    dispose() { voice.stop(); player.obj.scale.setScalar(1); },
  });
}
