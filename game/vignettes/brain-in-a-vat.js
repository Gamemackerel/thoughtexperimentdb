// Vignette: Brain in a Vat.
// A sunny little world. Its edges flicker. Step off and you land in a lab where your world floats above a brain in a
// vat; the lab's edges flicker too. Sit on the bench to stay (ending), or keep stepping out: after the third, it ends.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeTree, makePerson, animatePerson, makeBench, makeHouse, makeTable, makeFrog,
} from '/engine/core.js';
import { makeBrain, makeVat, makeComputer } from '/experiments/brain-in-a-vat/scene.js';
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
  g.add(makeIsland({ radius: 23, seed: 5, decor: false }));
  const house = makeHouse(); house.position.set(-6, 0, -5); house.rotation.y = 0.5; g.add(house);
  const bench = makeBench(); bench.position.set(2, 0, 1.6); bench.rotation.y = -0.3; g.add(bench);
  const shade = makeTree(1.5, seeded(3)); shade.position.set(4.6, 0, 0.2); g.add(shade);
  for (let i = 0; i < 12; i++) {
    const tr = makeTree(0.8 + rnd() * 0.7, rnd), a = rnd() * 6.28, rr = 9 + rnd() * 9;
    tr.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr - 2); g.add(tr);
  }
  const fm = new THREE.Matrix4();
  for (const [col, cnt] of [[0xfff6e6, 18], [0xf2c14e, 14], [0xf2a38f, 14]]) {
    const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), clay(col), cnt);
    for (let i = 0; i < cnt; i++) { fm.makeTranslation(-4 + rnd() * 12, 0.06, 2.5 + rnd() * 6); fl.setMatrixAt(i, fm); }
    g.add(fl);
  }
  g.userData = { bench, house };
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
  const sitter = makePerson({ color: palette.agent }); sitter.position.set(2, 0.35, 1.75); sitter.rotation.y = -0.3;   // "you", on the bench
  const miniWorld = buildWorld(seeded(21)); miniWorld.add(sitter);
  const lab1 = buildLab(miniWorld);
  const lab2 = buildLab(buildLab(buildWorld(seeded(21)).add(sitter.clone())));
  const layers = [world, lab1, lab2];
  layers.forEach((l, i) => { l.position.copy(LAYERS[i]); root.add(l); });

  // the frog hops past the bench, flickers, and does the same two hops again (déjà vu), then carries on
  const frog = makeFrog(); world.add(frog);
  const flicker = (f, u, t) => { f.visible = Math.sin(t * 55) > -0.2 || u > 0.9; };
  const cameo = frogCameo(frog, [[9, 9], [7, 7.5], [5, 6.6], [3, 6.4], { wait: 0.8 }, { wait: 0.35, act: flicker },
    { warp: [7, 7.5] }, [5, 6.6], [3, 6.4], { wait: 0.3, act: flicker }, { wait: 0.9 }, [1, 7], [-1, 8.2], [-3, 9.8], [-5, 11.6]]);

  const S = { layer: 0, phase: 'explore', pt: 0, fallT: 0, edgeSeen: false, revealT: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/experiments/brain-in-a-vat/script.json', 'Brain in a Vat');
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 200), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.x = 400; root.add(groundPlane); level.ground.push(groundPlane);

  const center = () => LAYERS[S.layer];
  const radius = () => (S.layer === 0 ? WORLD_R : LAB_R);
  const distFromCenter = () => Math.hypot(player.pos.x - center().x, player.pos.z - center().z);
  const edgePoint = () => { const c = center(), d = V(player.pos.x - c.x, 0, player.pos.z - c.z).normalize(); return c.clone().addScaledVector(d, radius()); };

  // ---- interactions
  interact.add({
    pos: () => world.userData.bench.getWorldPosition(V()), radius: 2.4, height: 2, prompt: 'Sit down',
    enabled: () => S.phase === 'explore' && S.layer === 0,
    onUse: async () => {
      S.phase = 'over';
      const b = world.userData.bench;
      player.place(b.position.x, b.position.z + 0.1, b.rotation.y); player.sit(true);
      await voice.say('sit'); await ctx.wait(1.2); await voice.say('stay_end'); await ctx.wait(1);
      save.complete('brain-in-a-vat');
      ctx.gameOver({ title: 'You stayed', text: 'You never found out whether the sun was real. You felt it anyway.' });
    },
  });
  interact.add({
    pos: edgePoint, radius: 2.8, height: 2, prompt: 'Step off the edge',
    enabled: () => S.phase === 'explore' && distFromCenter() > radius() - 2.6,
    onUse: () => { S.phase = 'fall'; S.pt = 0; player.enabled = false; S.fallFrom = player.pos.clone(); S.fallDir = V(player.pos.x - center().x, 0, player.pos.z - center().z).normalize(); voice.stop(); voice.say('fall', { once: false }); },
  });
  // asides: the shade tree, the house, and (in the labs) the machine
  look(ctx, { pos: V(4.6, 0, 0.2), radius: 2.2, height: 3, prompt: 'Look at the tree', lines: ['tree'], enabled: () => S.phase === 'explore' && S.layer === 0 });
  look(ctx, { pos: V(-4.4, 0, -3.6), radius: 2.2, height: 2.6, prompt: 'Look in the window', lines: ['window'], enabled: () => S.phase === 'explore' && S.layer === 0 });
  look(ctx, { pos: () => center().clone().add(V(-4.6, 0, -0.6)), radius: 2.4, height: 3, prompt: 'Look at the machine', lines: ['machine', 'machine_2'], enabled: () => S.phase === 'explore' && S.layer > 0 });
  interact.trigger({ test: () => S.layer === 0 && (player.pos.distanceTo(V(-6, 0, -5)) < 6 || player.pos.distanceTo(V(4.6, 0, 0.2)) < 5), onEnter: () => voice.say('solid') });

  // arrive in the next layer out: the camera starts on the little world above the vat, then pulls back
  async function land(layer) {
    S.layer = layer; S.phase = 'reveal'; S.pt = 0;
    const c = LAYERS[layer];
    player.place(c.x + 6, c.z + 7, Math.PI * 0.9);
    player.obj.visible = false;
    await ctx.flash(false);
    await ctx.wait(3.2);
    player.obj.visible = true; player.enabled = true; S.phase = 'explore';
    if (layer === 1) { await voice.say('lab_1'); await ctx.wait(0.8); voice.say('lab_2'); } else voice.say('layer_2');
  }

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 3, z: 5, rotY: Math.PI * 0.85 },
    walkable: (x, z) => Math.hypot(x - center().x, z - center().z) < radius(),
    blockers: () => {
      const c = center();
      if (S.layer === 0) return [{ x: -6, z: -5, r: 2.2 }, { x: 2, z: 1.6, r: 1.1 }, { x: 4.6, z: 0.2, r: 0.5 }];
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
        if (S.layer === 0 && !S.edgeSeen) { S.edgeSeen = true; voice.say('edge'); voice.say('ask'); }
        if (S.layer > 0 && !S['edge' + S.layer]) { S['edge' + S.layer] = true; voice.say('lab_edge', { once: false }); }
      }
      // the edge flickers: glitch grows as you approach it
      const edgeK = S.phase === 'explore' ? clamp((distFromCenter() - (radius() - 5)) / 5) : 0;
      ctx.ui.glitch(S.phase === 'fall' ? 0.8 : edgeK * 0.45, t);

      if (S.phase === 'fall') {
        const k = S.pt;
        player.pos.copy(S.fallFrom).addScaledVector(S.fallDir, Math.min(k, 0.6) * 3).setY(-(Math.max(0, k - 0.3) ** 2) * 9);
        if (k > 1.6 && !S.landing && S.phase === 'fall') {
          S.landing = true;
          (async () => {
            await ctx.flash(true);
            if (S.layer === 2) {        // there is no outside: the end
              S.phase = 'over'; ctx.ui.glitch(0);
              await ctx.flash(false); await voice.say('end'); await ctx.wait(1);
              save.complete('brain-in-a-vat');
              return ctx.gameOver({ title: 'No way out', text: 'Every time you stepped outside, there was another inside. You can only ever check the world with the world.' });
            }
            S.landing = false;
            await land(S.layer + 1);
          })();
        }
      }

      // frog: once, in the sunny world, when you're near the bench
      if (S.layer === 0 && player.pos.distanceTo(V(2, 0, 1.6)) < 9) cameo.start();
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

    dispose() { voice.stop(); ctx.ui.glitch(0); },
  });
}
