// Vignette: Brain in a Vat.
// A sunny little world. Its edges flicker. Step off and you land in a lab where your world floats above a brain in a
// vat; the lab's edges flicker too. Sit on the bench to stay (ending), or keep stepping out: after the third, it ends.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeTree, makePerson, animatePerson, makeBench, makeHouse, makeTable, makeFrog,
} from '/game/engine/core.js';
import { makeBrain, makeVat, makeComputer } from '../core/lab.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const WORLD_R = 20;                 // walkable radius of the sunny world
const LAB_R = 15;                   // walkable radius of a lab
const LAYERS = [V(0, 0, 0), V(400, 0, 0), V(800, 0, 0)];   // world, lab 1, lab 2 (far apart; one is shown at a time)
const MINI = 0.2;                   // scale of the world-above-the-vat

function buildWorld(rnd) {
  const g = new THREE.Group();
  g.add(makeIsland({ radius: 23, seed: 5, decor: false, color: 0xa9c98a, rim: 0x86a86c }));   // a green, sunny afternoon
  const house = makeHouse(); house.position.set(-6, 0, -5); house.rotation.y = 0.5; g.add(house);
  const bench = makeBench(); bench.position.set(2, 0, 1.6); bench.rotation.y = -0.3; g.add(bench);
  const shade = makeTree(1.5, seeded(3)); shade.position.set(4.6, 0, 0.2); g.add(shade);
  const trees = [{ x: 4.6, z: 0.2 }];
  for (let i = 0; i < 12; i++) {
    const tr = makeTree(0.8 + rnd() * 0.7, rnd), a = rnd() * 6.28, rr = 9 + rnd() * 9;
    tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr - 2); g.add(tr); trees.push({ x: tr.position.x, z: tr.position.z });
  }
  const fm = new THREE.Matrix4();
  for (const [col, cnt] of [[0xfff6e6, 18], [0xf2c14e, 14], [0xf2a38f, 14]]) {
    const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), clay(col), cnt);
    for (let i = 0; i < cnt; i++) { fm.makeTranslation(-4 + rnd() * 12, 0.06, 2.5 + rnd() * 6); fl.setMatrixAt(i, fm); }
    g.add(fl);
  }
  g.userData = { bench, house, trees };
  return g;
}

function buildLab(inner) {
  const g = new THREE.Group();
  g.add(makeIsland({ radius: 18, seed: 12, decor: false }));
  const floor = mesh(new THREE.CylinderGeometry(10, 10, 0.08, 64), clay(0xe7e2d8)); floor.position.y = 0.04; floor.castShadow = false; g.add(floor);
  const table = makeTable({ w: 4.4, d: 2.6 }); g.add(table);
  const vat = makeVat(); vat.position.y = table.userData.top; g.add(vat);
  const brain = makeBrain(); brain.position.set(0, 3.62, 0); brain.scale.setScalar(1.15); g.add(brain);
  const computer = makeComputer(); computer.position.set(-5.6, 0, -1.4); computer.rotation.y = 0.85; g.add(computer);
  // cables from the computer over the lid into the brain
  for (let i = 0; i < 4; i++) {
    const start = V(-4.6, 3.2 + i * 0.25, -0.4 + i * 0.2), end = V((i - 1.5) * 0.14, 3.95, -0.05);
    const curve = new THREE.CatmullRomCurve3([start, V(-3, 6.2 + i * 0.15, -0.3), V((i - 1.5) * 0.18, 6.1, 0), V((i - 1.5) * 0.18, 5.25, 0), end]);
    g.add(mesh(new THREE.TubeGeometry(curve, 60, 0.045, 8), clay(i % 2 ? palette.agent : palette.ink)));
  }
  // the world above the vat (a miniature of the layer you just left)
  inner.scale.setScalar(MINI); inner.position.set(0, 10, 0); g.add(inner);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(4, 0.35, 5.4, 40, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x3fae8e, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  beam.position.set(0, 6.9, 0); g.add(beam);
  g.userData = { brain, vat, computer, inner };
  return g;
}

export default function brainInAVat(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 180);
  voice.load('brain-in-a-vat');
  const frame = makeFramer(stage);

  // ---- layer 0: the sunny world; layers 1–2: labs, each with the previous layer floating above its vat
  const world = buildWorld(seeded(21));
  const sitter = makePerson({ color: palette.agent }); sitter.position.set(2, 0.8, 1.65); sitter.rotation.y = -0.3;   // "you", on the bench
  const miniWorld = buildWorld(seeded(21)); miniWorld.add(sitter);
  const lab1 = buildLab(miniWorld);
  const lab2 = buildLab(buildLab(buildWorld(seeded(21)).add(sitter.clone())));
  const layers = [world, lab1, lab2];
  layers.forEach((l, i) => { l.position.copy(LAYERS[i]); root.add(l); });

  // a warm low sun over the sunny world; the labs are cool and clinical (see setLight)
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }));
  sunDisc.position.set(-45, 26, -70); world.add(sunDisc);
  const sunHalo = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: 0xffc86b, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
  sunHalo.position.copy(sunDisc.position).add(V(0.6, 0, 1.4)); sunHalo.lookAt(V(0, 0, 0)); world.add(sunHalo);
  function setLight(layer) {
    const warm = layer === 0;
    stage.hemi.color.set(warm ? 0xffefd2 : 0xe2ecf4); stage.sun.color.set(warm ? 0xffd9a0 : 0xf2f6fa);
    stage.hemi.intensity = warm ? 1.5 : 1.45; stage.sun.intensity = warm ? 2.7 : 2.1;
    stage.scene.background.set(warm ? 0xf6e8cf : 0xe6ebee); stage.scene.fog.color.set(warm ? 0xf6e8cf : 0xe6ebee);
  }
  setLight(0);
  // the edge of each world shimmers where it ends (a curtain of scanlines), rather than the whole screen glitching
  const scan = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const g = c.getContext('2d'); for (let y = 0; y < 64; y += 4) { g.fillStyle = `rgba(63,174,142,${0.25 + 0.5 * Math.random()})`; g.fillRect(0, y, 8, 2); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 2); return t; })();
  const curtains = LAYERS.map((c, i) => { const r = i === 0 ? WORLD_R + 0.6 : LAB_R + 0.6; const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 3, 96, 1, true), new THREE.MeshBasicMaterial({ map: scan, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.copy(c).setY(1.2); root.add(m); return m; });

  // the frog hops past the bench, flickers, and does the same two hops again (déjà vu), then carries on
  const frog = makeFrog(); world.add(frog);
  const flicker = (f, u, t) => { f.visible = Math.sin(t * 55) > -0.2 || u > 0.9; };
  const cameo = frogCameo(frog, [[9, 9], [7, 7.5], [5, 6.6], [3, 6.4], { wait: 0.8 }, { wait: 0.35, act: flicker },
    { warp: [7, 7.5] }, [5, 6.6], [3, 6.4], { wait: 0.3, act: flicker }, { wait: 0.9 }, [1, 7], [-1, 8.2], [-3, 9.8], [-5, 11.6]]);

  const S = { layer: 0, phase: 'explore', pt: 0, fallT: 0, edgeSeen: false, asked: false, revealT: 0, seated: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/brain-in-a-vat.json', 'Brain in a Vat');
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 200), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.x = 400; root.add(groundPlane); level.ground.push(groundPlane);

  const center = () => LAYERS[S.layer];
  const radius = () => (S.layer === 0 ? WORLD_R : LAB_R);
  const distFromCenter = () => Math.hypot(player.pos.x - center().x, player.pos.z - center().z);
  const edgePoint = () => { const c = center(), d = V(player.pos.x - c.x, 0, player.pos.z - c.z).normalize(); return c.clone().addScaledVector(d, radius()); };

  // ---- interactions
  // the bench: before you've found the edge it's only a rest (you can get up again); after, sitting is an answer
  const sitDown = () => { const b = world.userData.bench, f = V(Math.sin(b.rotation.y), 0, Math.cos(b.rotation.y)); player.place(b.position.x + f.x * 0.12, b.position.z + f.z * 0.12, b.rotation.y); player.sit(true); S.seated = true; };
  interact.add({
    pos: () => world.userData.bench.getWorldPosition(V()).add(V(0.3, 0, 1)), radius: 1.5, height: 2, prompt: () => (S.seated ? 'Get up' : 'Sit down'),
    enabled: () => S.phase === 'explore' && S.layer === 0 && (!S.asked || S.seated),
    onUse: () => {
      if (S.seated) { S.seated = false; player.sit(false); player.pos.y = 0; player.place(player.pos.x + 0.3, player.pos.z + 1, player.obj.rotation.y); return; }
      sitDown(); voice.say('sit_rest');
    },
  });
  interact.add({
    pos: () => world.userData.bench.getWorldPosition(V()).add(V(0.3, 0, 1)), radius: 1.5, height: 2, prompt: 'Sit down, and stay', terminal: true,
    enabled: () => S.phase === 'explore' && S.layer === 0 && S.asked && !S.seated,
    onUse: async () => {
      S.phase = 'over'; sitDown();
      await voice.say('sit'); await ctx.wait(1.2); await voice.say('stay_end'); await ctx.wait(1);
      save.complete('brain-in-a-vat');
      ctx.gameOver({ title: 'You stayed', text: 'You never found out whether the sun was real. You felt it anyway.' });
    },
  });
  // V4: in each lab, a stool by the machine: decide this one is the bottom
  interact.add({
    pos: () => center().clone().add(V(-3.8, 0, 1.2)), radius: 1.3, height: 1.6, prompt: 'Sit on the stool', terminal: true,
    enabled: () => S.phase === 'explore' && S.layer > 0 && voice.said.has(S.layer === 1 ? 'lab_2' : 'layer_2'),
    onUse: async () => {
      S.phase = 'over'; player.sit(true);
      await voice.say('stool_end'); await ctx.wait(1);
      save.complete('brain-in-a-vat');
      ctx.gameOver({ title: 'You stopped here', text: 'You decided this one was the bottom, the real one. You can\'t check that either.' });
    },
  });
  interact.add({
    pos: edgePoint, radius: 2.8, height: 2, prompt: 'Step off the edge', terminal: true,
    enabled: () => S.phase === 'explore' && distFromCenter() > radius() - 2.6 && (S.layer > 0 || S.asked) && !S.seated,
    onUse: () => { S.phase = 'fall'; S.pt = 0; player.enabled = false; S.fallFrom = player.pos.clone(); S.fallDir = V(player.pos.x - center().x, 0, player.pos.z - center().z).normalize(); voice.stop(); voice.say('fall', { once: false }); },
  });
  // asides: the shade tree, the house, and (in the labs) the machine
  look(ctx, { pos: V(4.6, 0, 0.2), radius: 2.2, height: 3, prompt: 'Look at the tree', lines: ['tree'], enabled: () => S.phase === 'explore' && S.layer === 0 });
  look(ctx, { pos: V(-4.4, 0, -3.6), radius: 2.2, height: 2.6, prompt: 'Look in the window', lines: ['window'], enabled: () => S.phase === 'explore' && S.layer === 0 });
  look(ctx, { pos: () => center().clone().add(V(-4.6, 0, -0.6)), radius: 2.4, height: 3, prompt: 'Look at the machine', lines: ['machine', 'machine_2'], enabled: () => S.phase === 'explore' && S.layer === 1 });
  look(ctx, { pos: () => center().clone().add(V(-4.6, 0, -0.6)), radius: 2.4, height: 3, prompt: 'Look at the machine', lines: ['machine_3'], enabled: () => S.phase === 'explore' && S.layer === 2 });
  interact.trigger({ test: () => S.layer === 0 && (player.pos.distanceTo(V(-6, 0, -5)) < 6 || player.pos.distanceTo(V(4.6, 0, 0.2)) < 5), onEnter: () => voice.say('solid') });

  // arrive in the next layer out: the camera starts on the little world above the vat, then pulls back
  async function land(layer) {
    S.layer = layer; S.phase = 'reveal'; S.pt = 0; setLight(layer);
    const c = LAYERS[layer];
    player.place(c.x + 6, c.z + 7, Math.PI * 0.9);
    player.obj.visible = false;
    await ctx.flash(false);
    await ctx.wait(3.2);
    player.obj.visible = true; player.enabled = true; S.phase = 'explore';
    if (layer === 1) { await voice.say('lab_1'); await ctx.wait(0.8); voice.say('lab_2'); } else voice.say('layer_2');
    save.complete('brain-in-a-vat');
  }

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 3, z: 5, rotY: Math.PI * 0.85 },
    walkable: (x, z) => Math.hypot(x - center().x, z - center().z) < radius(),
    blockers: () => {
      const c = center();
      if (S.layer === 0) return [{ x: -6, z: -5, w: 3.4, d: 3, rot: 0.5 }, { x: 2, z: 1.6, w: 2.6, d: 0.8, rot: -0.3 }, ...world.userData.trees.map((t) => ({ x: t.x, z: t.z, r: 0.45 }))];
      return [{ x: c.x, z: c.z, r: 2.6 }, { x: c.x - 5.6, z: c.z - 1.4, r: 1.8 }];
    },
    start() { setTimeout(() => voice.say('arrive'), 900); },

    update(dt, t) {
      S.pt += dt;
      // bench-sitter in the miniature world, brains bobbing, computer screens scrolling
      for (const lab of [lab1, lab2]) {
        const u = lab.userData; u.brain.position.y = 3.62 + Math.sin(t * 0.9) * 0.04;
        u.computer.userData.tex.offset.y = (t * 0.08) % 1;
        u.computer.userData.reels.forEach((r, i) => (r.rotation.y = t * (i ? 1.6 : -1.1)));
        u.computer.userData.lights.forEach((l, i) => (l.material.emissiveIntensity = Math.sin(t * (2 + (i % 5) * 0.7) + i * 1.9) > 0.2 ? 1.6 : 0.1));
      }
      // only the current layer (and, during a fall, the next one) is shown
      layers.forEach((l, i) => (l.visible = i === S.layer || (S.phase === 'fall' && i === S.layer + 1)));

      // nearing the edge: the first time, the question; in the labs, the same flicker
      if (S.phase === 'explore' && distFromCenter() > radius() - 4) {
        if (S.layer === 0 && !S.edgeSeen) { S.edgeSeen = true; voice.say('edge'); voice.say('ask').then(() => (S.asked = true)); }
        if (S.layer > 0 && !S['edge' + S.layer]) { S['edge' + S.layer] = true; voice.say(S.layer === 1 ? 'lab_edge' : 'lab_edge_2'); }
      }
      // the edge flickers: glitch grows as you approach it
      const edgeK = S.phase === 'explore' ? clamp((distFromCenter() - (radius() - 5)) / 5) : 0;
      ctx.ui.glitch(S.phase === 'fall' ? 0.6 : edgeK * 0.12, t);
      curtains.forEach((c, i) => (c.material.opacity = i === S.layer ? (0.12 + edgeK * 0.5) * (0.7 + 0.3 * Math.sin(t * 23 + i)) : 0));
      scan.offset.y = (t * 0.6) % 1;
      if (S.seated) player.pos.y = 1.22;                     // on the seat, not in it

      if (S.phase === 'fall') {
        const k = S.pt;
        player.pos.copy(S.fallFrom).addScaledVector(S.fallDir, Math.min(k, 0.6) * 3).setY(-(Math.max(0, k - 0.3) ** 2) * 9);
        if (k > 1.6 && !S.landing && S.phase === 'fall') {
          S.landing = true;
          (async () => {
            await ctx.flash(true);
            if (S.layer === 2) {        // there is no outside: pull back through every world, and end
              S.phase = 'final'; S.pt = 0; ctx.ui.glitch(0); player.obj.visible = false;
              await ctx.flash(false); await ctx.wait(1.5); await voice.say('end'); await ctx.wait(2.5); S.phase = 'over';
              save.complete('brain-in-a-vat');
              return ctx.gameOver({ title: 'No way out', text: 'Every time you stepped outside, there was another inside. You can only ever check the world with the world.' });
            }
            S.landing = false;
            await land(S.layer + 1);
          })();
        }
      }

      // frog: once, in the sunny world, when you're near the bench
      if (S.layer === 0 && voice.said.has('solid')) cameo.start();
      cameo.update(dt);
      animatePerson(sitter, t, { energy: 0.3 });
    },

    camera(pl) {
      const c = LAYERS[S.layer];
      if (S.phase === 'reveal') {
        // start on the little world above the vat (it looks like the real thing), pull back to show the lab
        const k = easeInOut(clamp(S.pt / 3));
        const look = c.clone().add(V(0, lerp(10.2, 6.5, k), 0));
        return { pos: look.clone().add(V(lerp(1.2, 9, k), lerp(0.9, 5.5, k), lerp(2.2, 17, k))), look, cut: S.pt < 0.05, stiffness: 8 };
      }
      if (S.phase === 'final' || (S.phase === 'over' && S.layer === 2 && !player.sitting)) {
        // from the tiny bench deep inside, out through the world, the first lab, and this one
        const k = easeInOut(clamp((S.phase === 'final' ? S.pt : 99) / 9));
        const look = c.clone().add(V(0, lerp(10 + 0.16 * 10.5, 6, k), 0));
        return { pos: look.clone().add(V(lerp(0.5, 16, k), lerp(0.4, 12, k), lerp(0.8, 30, k))), look, cut: S.phase === 'final' && S.pt < 0.05, stiffness: 6 };
      }
      if (S.phase === 'fall') {
        const look = pl.pos.clone();
        return { pos: look.clone().add(V(0, 9 + S.pt * 6, 16 + S.pt * 8)), look, stiffness: 3 };
      }
      const pts = [pl.pos.clone()];
      if (distFromCenter() > radius() - 5) pts.push(edgePoint().add(V(0, 2.5, 0)));   // keep the edge (and its prompt) in frame
      if (S.layer === 0) pts.push(V(2, 0, 1.6), V(-6, 2, -5), V(4.6, 3, 0.2));
      else pts.push(c.clone(), c.clone().add(V(0, 11.5, 0)), c.clone().add(V(-5.6, 3, -1.4)));
      return { ...frame(pts, { min: 14 }), stiffness: 2.4 };
    },

    dispose() { voice.stop(); ctx.ui.glitch(0); player.sit(false); player.pos.y = 0; },
  });
}
