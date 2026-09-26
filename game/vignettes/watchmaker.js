// Vignette: The Watchmaker.
// Crossing a heath, you stub your toe on a stone: for all you know it has always been there. Then, in the heather, a
// watch. Open it: springs and wheels, each cut to fit the next, all for telling the time. Someone made this. And the
// hare watching you from the gorse has an eye far finer than any watch. Did someone make that too? Follow the path to
// the watchmaker's workshop; sit by the pond and watch a million years go by (a light-sensitive patch, a cup, a pinhole,
// a lens); or put the watch back in the heather: you've seen watches made, but never a world.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeIsland, makeHouse, makeTree, makeRock, makeFrog, makeTable, makePerson } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const STONE = V(0.6, 0, 3.2);
const WATCH = V(-3.2, 0, -1.6);
const HARE = V(-6.4, 0, -3.4);
const POND = V(8, 0, -2.6);
const GATE = V(-1, 0, -9.5);
const SHOP = V(-2, 0, -17.5);
const CLOSE = V(70, 0, 0);          // the watch, opened, up close
const EYES = V(-70, 0, 0);          // the pond, up close, over a million years
const IDLE_LIMIT = 60;

function makeGear(r, teeth, color, thick = 0.12) {
  const g = new THREE.Group(), m = clay(color, { metalness: 0.6, roughness: 0.35 });
  const disc = mesh(new THREE.CylinderGeometry(r, r, thick, 32), m); g.add(disc);
  for (let i = 0; i < teeth; i++) { const a = (i / teeth) * Math.PI * 2, t = mesh(new THREE.BoxGeometry(r * 0.16, thick, r * 0.2), m); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = -a; g.add(t); }
  const hub = mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, thick * 2, 12), clay(0xc0182a)); g.add(hub);
  return g;
}

function makeHare() {
  const g = new THREE.Group(), fur = clay(0xa88a6a);
  const body = mesh(new THREE.SphereGeometry(0.35, 14, 10), fur); body.scale.set(0.9, 0.9, 1.3); body.position.y = 0.4; g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), fur); head.position.set(0, 0.72, 0.36); g.add(head);
  for (const s of [-1, 1]) { const ear = mesh(new THREE.CapsuleGeometry(0.05, 0.4, 4, 8), fur); ear.position.set(s * 0.08, 1.08, 0.28); ear.rotation.set(-0.2, 0, s * 0.15); g.add(ear); const eye = mesh(new THREE.SphereGeometry(0.045, 8, 6), clay(0x2b1a10)); eye.position.set(s * 0.13, 0.76, 0.5); g.add(eye); }
  const tail = mesh(new THREE.SphereGeometry(0.1, 8, 6), clay(0xf6f1e7)); tail.position.set(0, 0.45, -0.45); g.add(tail);
  return g;
}

// the five steps of an eye (after Darwin), drawn as cross-sections standing up: a flat patch that feels light, a shallow
// cup, a deep cup, a pinhole, and a pinhole with a lens in it
function makeEyeStage(k) {
  const g = new THREE.Group(), skin = clay(0xe6b8a0), cells = clay(0x5a2a3a);
  const band = (r0, r1, span) => {                                   // an arc round the bottom of a circle, from r0 to r1
    const sh = new THREE.Shape(), n = 24, a0 = -Math.PI / 2 - span, a1 = -Math.PI / 2 + span;
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); i ? sh.lineTo(Math.cos(a) * r1, Math.sin(a) * r1) : sh.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); }
    for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * (i / n); sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
    return new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false });
  };
  if (k === 0) {
    const flat = mesh(new THREE.BoxGeometry(1.8, 0.3, 0.5), skin); flat.position.y = 0.6; g.add(flat);
    const patch = mesh(new THREE.BoxGeometry(0.7, 0.08, 0.52), cells); patch.position.y = 0.77; g.add(patch);
  } else {
    const span = [0, 0.7, 1.35, 2.6, 2.6][k];
    const wall = mesh(band(0.62, 0.9, span), skin); wall.position.y = 1; g.add(wall);
    const lining = mesh(band(0.54, 0.62, span * 0.97), cells); lining.position.set(0, 1, 0.01); g.add(lining);
    if (k === 4) { const lens = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.05 })); lens.scale.z = 0.6; lens.position.set(0, 1.55, 0.25); g.add(lens); }
  }
  return g;
}

export default function watchmaker(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xdfe6ea);
  stage.scene.fog = new THREE.Fog(0xdfe6ea, 40, 140);
  voice.load('watchmaker');
  const rnd = seeded(1802);

  // ---- the heath: heather in purple clumps, yellow gorse, a sandy path, the stone, and the watch
  root.add(makeIsland({ radius: 24, seed: 18, color: 0xa8a070, decor: false }));
  const path = mesh(new THREE.BoxGeometry(1.8, 0.04, 28), clay(0xd9c8a0)); path.position.set(-0.4, 0.02, -4); path.rotation.y = 0.06; root.add(path);
  const heather = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.45, 0), clay(0x8a5a8a, { flatShading: true }), 260);
  const gorse = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.55, 0), clay(0xd9b83a, { flatShading: true }), 60);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let nh = 0, ng = 0;
  const clear = (x, z) => Math.abs(x + 0.4) < 1.6 || Math.hypot(x - POND.x, z - POND.z) < 4.2 || Math.hypot(x - WATCH.x, z - WATCH.z) < 1.4 || Math.hypot(x - SHOP.x, z - SHOP.z) < 4.5 || Math.hypot(x - STONE.x, z - STONE.z) < 1.2;
  for (let i = 0; i < 900 && (nh < 260 || ng < 60); i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 22, x = Math.cos(a) * d, z = Math.sin(a) * d; if (clear(x, z)) continue;
    e.set(0, rnd() * 6, 0); q.setFromEuler(e); const s = 0.6 + rnd() * 0.9;
    m4.compose(V(x, s * 0.2, z), q, V(s * 1.3, s * 0.7, s * 1.3));
    if (rnd() < 0.8 && nh < 260) heather.setMatrixAt(nh++, m4); else if (ng < 60) gorse.setMatrixAt(ng++, m4);
  }
  heather.count = nh; gorse.count = ng; root.add(heather, gorse);
  const stone = makeRock(1.3, rnd); stone.position.copy(STONE); root.add(stone);
  const watch = new THREE.Group();
  const wcase = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 24), clay(0xe2b53b, { metalness: 0.7, roughness: 0.3 })); watch.add(wcase);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: 0xfbf6ea })); face.rotation.x = -Math.PI / 2; face.position.y = 0.045; watch.add(face);
  const hand = mesh(new THREE.BoxGeometry(0.02, 0.01, 0.16), clay(0x2b2a33)); hand.position.set(0, 0.055, -0.05); watch.add(hand);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(0.1, 0.1, 0.05); watch.add(glint);
  watch.position.copy(WATCH).setY(0.06); root.add(watch);
  const hare = makeHare(); hare.position.copy(HARE); hare.rotation.y = 0.9; root.add(hare);
  // the pond, with rushes and a lily pad
  const pond = mesh(new THREE.CylinderGeometry(3, 3, 0.06, 32), clay(0x6f98a8, { roughness: 0.2 })); pond.position.copy(POND).setY(0.03); root.add(pond);
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = mesh(new THREE.CylinderGeometry(0.02, 0.03, 1 + rnd(), 4), clay(0x6a7a3a)); r.position.set(POND.x + Math.cos(a) * 3.1, 0.5, POND.z + Math.sin(a) * 3.1); root.add(r); }
  const pad = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 16), clay(0x5d8a45)); pad.position.copy(POND).add(V(-1, 0.07, 0.8)); root.add(pad);
  // a gate in a line of gorse, and the path on to a workshop with a lit window
  for (const x of [-9, -7.6, -6.2, -4.8, -3.2, 1.2, 2.8, 4.4, 6, 7.4]) { const b = mesh(new THREE.IcosahedronGeometry(0.9, 0), clay(0xd9b83a, { flatShading: true })); b.position.set(x, 0.5, GATE.z + (rnd() - 0.5) * 0.4); b.scale.y = 0.8; root.add(b); }
  const gp1 = mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), clay(palette.wood)); gp1.position.copy(GATE).add(V(-1.3, 0.6, 0)); const gp2 = gp1.clone(); gp2.position.x = GATE.x + 1.3; root.add(gp1, gp2);
  const shop = makeHouse({ color: 0xe6dcc8, roof: 0x8a4a3a }); shop.position.copy(SHOP); root.add(shop);
  const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); lit.position.copy(SHOP).add(V(0.95, 1.5, 1.32)); root.add(lit);
  const shopLight = new THREE.PointLight(0xffc97a, 10, 7, 1.5); shopLight.position.copy(SHOP).add(V(0, 1.8, 2.6)); root.add(shopLight);
  const bench = makeTable({ w: 1.6, d: 0.7, h: 0.95, color: 0x6b4a33 }); bench.position.copy(SHOP).add(V(-2.4, 0, 2.4)); root.add(bench);
  for (let i = 0; i < 4; i++) { const tiny = makeGear(0.12 + i * 0.03, 10, [0xe2b53b, 0xc9ccd1][i % 2], 0.03); tiny.position.copy(SHOP).add(V(-2.9 + i * 0.35, 1.0, 2.4)); root.add(tiny); }
  const stool = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 12), clay(0x6b4a33)); stool.position.copy(SHOP).add(V(-2.4, 0.3, 3.2)); root.add(stool);
  for (const [x, z] of [[-9, -15], [5, -16], [-12, -8], [12, -12], [14, 4], [-15, 3]]) { const t = makeTree(1 + rnd() * 0.5, rnd); t.position.set(x, 0, z); root.add(t); }

  // ---- the watch, opened, up close: gears turning, a balance wheel swinging, a spring
  const close = new THREE.Group(); close.position.copy(CLOSE); root.add(close);
  const cbg = mesh(new THREE.CylinderGeometry(3, 3, 0.3, 48), clay(0xe2b53b, { metalness: 0.7, roughness: 0.35 })); cbg.position.y = -0.2; close.add(cbg);
  const plate = mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.1, 48), clay(0xd9d2c0, { metalness: 0.4 })); close.add(plate);
  const gears = [[0, 0, 1, 24, 0xe2b53b], [1.45, 0.4, 0.55, 14, 0xc9ccd1], [-1.2, 0.9, 0.7, 18, 0xe2b53b], [-0.6, -1.5, 0.5, 12, 0xc9ccd1], [1.2, -1.3, 0.45, 12, 0xe2b53b]].map(([x, z, r, n, c], i) => {
    const g = makeGear(r, n, c); g.position.set(x, 0.15 + (i % 2) * 0.12, z); g.userData.speed = (i % 2 ? -1 : 1) / r; close.add(g); return g;
  });
  const balance = new THREE.Group(); const brim = mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 32), clay(0xc9ccd1, { metalness: 0.7 })); brim.rotation.x = Math.PI / 2; balance.add(brim);
  for (let i = 0; i < 3; i++) { const sp = mesh(new THREE.BoxGeometry(1, 0.03, 0.05), clay(0xc9ccd1)); sp.rotation.y = (i / 3) * Math.PI; balance.add(sp); }
  balance.position.set(-1.6, 0.45, -0.5); close.add(balance);
  const springPts = []; for (let i = 0; i < 120; i++) { const a = i * 0.25, r = 0.05 + i * 0.0035; springPts.push(V(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const spring = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 240, 0.012, 4), clay(0x5d6470, { metalness: 0.6 })); spring.position.set(-1.6, 0.52, -0.5); close.add(spring);

  // ---- the pond, up close: the five steps of an eye, arriving one after another over a million years
  const eyes = new THREE.Group(); eyes.position.copy(EYES); root.add(eyes);
  const water = mesh(new THREE.BoxGeometry(14, 0.4, 7), clay(0x6f98a8, { roughness: 0.25 })); water.position.y = -0.3; eyes.add(water);
  const stages = [0, 1, 2, 3, 4].map((k) => { const s = makeEyeStage(k); s.position.set(-5.4 + k * 2.7, 0, -0.25); s.scale.setScalar(0.001); eyes.add(s); return s; });
  const swimmers = [...Array(24)].map((_, i) => { const b = mesh(new THREE.SphereGeometry(0.12, 8, 6), clay([0xe6b8a0, 0xc9907a, 0xd9a890][i % 3])); b.scale.z = 1.6; eyes.add(b); b.userData = { a: rnd() * 6.28, r: 1 + rnd() * 5, sp: 0.4 + rnd() * 0.6, y: 0.2 + rnd() * 0.3 }; return b; });

  // ---- the frog: on the lily pad, it slowly blinks, and plops in
  const frog = makeFrog({ scale: 0.8 }); root.add(frog);
  const cameo = frogCameo(frog, [{ at: [POND.x + 3.8, POND.z + 2.4] }, [POND.x + 2.4, POND.z + 1.8], { at: [pad.position.x, pad.position.z], y: 0.08 }, { face: [0, 8] },
    { wait: 3, act: (f, u) => { f.userData.body.scale.y = 1 - (Math.abs(u - 0.5) < 0.06 ? 0.3 : 0); } }, { at: [POND.x - 0.2, POND.z - 0.4], y: -0.6, height: 0.9 }]);

  // ---- state
  const S = { phase: 'walk', idle: 0, open: 0, closeT: -1, eyesT: -1, gen: 0, walkShop: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/watchmaker.json', 'The Watchmaker');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.trigger({ pos: STONE, radius: 1.6, onEnter: () => { S.stubbed = 1; voice.say('stub', { urgent: true }).then(() => voice.say('stone')); } });
  interact.trigger({ pos: WATCH, radius: 3.4, when: () => voice.said.has('stone') || S.stubbed, onEnter: () => voice.say('watch') });
  interact.add({ pos: WATCH.clone().add(V(0.4, 0, 1)), radius: 1.3, height: 1.2, prompt: 'Pick up the watch, and open it', enabled: () => S.phase === 'walk' && !S.opened,
    onUse: async () => {
      S.opened = true; S.phase = 'close'; player.enabled = false; watch.visible = false; S.closeT = 0;
      await ctx.wait(1.2); await voice.say('parts', { urgent: true }); await ctx.wait(0.6); await voice.say('maker');
      await ctx.wait(1); S.phase = 'walk'; S.closeT = -1; player.enabled = true;
      await ctx.wait(1.4); await voice.say('eye'); await ctx.wait(0.8); await voice.say('ask'); S.asked = true; S.idle = 0; cameo.start();
    } });
  // the three answers
  interact.add({ pos: GATE.clone().add(V(0, 0, 1.3)), radius: 1.5, height: 1.8, prompt: 'Follow the path to the maker', terminal: true, enabled: () => S.phase === 'walk' && S.asked,
    onUse: async () => {
      S.phase = 'over'; S.walkShop = true; player.locked = true; player.target = SHOP.clone().add(V(0, 0, 3.2));
      await ctx.wait(4); await voice.say('maker_1', { urgent: true }); await ctx.wait(1.2); await voice.say('maker_2'); await ctx.wait(1.6);
      save.complete('watchmaker');
      ctx.gameOver({ title: 'You went looking for the maker', text: 'A watch has a watchmaker; something far finer than a watch, you reasoned, must have a maker too. Many people, for a very long time, have found it impossible to believe otherwise.' });
    } });
  interact.add({ pos: POND.clone().add(V(-2.4, 0, 2.6)), radius: 1.4, height: 1.6, prompt: 'Sit by the pond and watch', terminal: true, enabled: () => S.phase === 'walk' && S.asked,
    onUse: async () => {
      S.phase = 'over'; player.enabled = false; player.sit(true); await ctx.wait(1);
      S.eyesT = 0; await voice.say('pond_1', { urgent: true }); await ctx.wait(3); await voice.say('pond_2'); await ctx.wait(6); await voice.say('pond_3'); await ctx.wait(2);
      save.complete('watchmaker');
      ctx.gameOver({ title: 'You watched the pond', text: 'A patch that felt the light, a cup, a pinhole, a lens: each step a little better than the one before, and nobody meaning any of it. Only an enormous amount of time.' });
    } });
  async function putBack(idle) {
    if (S.phase !== 'walk') return;
    S.phase = 'over'; player.enabled = false;
    if (!idle) { watch.visible = true; watch.position.copy(player.pos).add(V(0.5, 0.06, 0.5)); }
    await voice.say(idle ? 'walk_on' : 'hume_1', { urgent: true }); await ctx.wait(1); await voice.say('hume_2'); await ctx.wait(1.6);
    save.complete('watchmaker');
    ctx.gameOver(idle ? { title: 'You walked on', text: 'You put the watch in your pocket and walked on, and left the question lying on the heath. From one watch, how much can you really say about a world?' }
      : { title: 'You put the watch back', text: 'You have seen watches made. You have never seen a world made. It might be more like a plant than a watch; it might have had many makers, or a clumsy one. From one watch, how could you tell?' });
  }
  interact.add({ pos: WATCH.clone().add(V(0.4, 0, 1)), radius: 1.3, height: 1.2, prompt: 'Put the watch back in the heather', terminal: true, enabled: () => S.phase === 'walk' && S.asked, onUse: () => putBack(false) });

  // asides
  look(ctx, { pos: HARE.clone().add(V(1, 0, 1)), radius: 1.6, height: 1.6, prompt: 'Look at the hare', lines: ['hare'], enabled: () => S.phase === 'walk' });
  look(ctx, { pos: STONE.clone().add(V(1.2, 0, 0.4)), radius: 1.2, height: 1.4, prompt: 'Look at the stone', lines: ['stone_look'], enabled: () => S.phase === 'walk' && voice.said.has('stone') });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -0.2, z: 8, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 21 && Math.hypot(x - POND.x, z - POND.z) > 3.2 && (z > GATE.z + 0.6 || S.walkShop),
    blockers: () => [{ x: STONE.x, z: STONE.z, r: 0.8 }, { x: HARE.x, z: HARE.z, r: 0.5 }, { x: SHOP.x, z: SHOP.z, w: 3.4, d: 2.8 }],
    update(dt, t) {
      hand.rotation.y = -t * 0.5; glint.visible = (t % 2.4) < 0.3 && S.phase === 'walk';
      hare.rotation.y = 0.9 + Math.sin(t * 0.3) * 0.2; hare.children[1].position.y = 0.72 + Math.max(0, Math.sin(t * 2.3)) * 0.02;
      if (S.closeT >= 0) { S.closeT += dt; gears.forEach((g) => (g.rotation.y += dt * g.userData.speed * 0.8)); balance.rotation.y = Math.sin(t * 9) * 1.2; }
      if (S.eyesT >= 0) {
        S.eyesT += dt; S.gen = Math.floor(Math.pow(S.eyesT, 3) * 900);
        stages.forEach((s, k) => s.scale.setScalar(Math.max(0.001, easeInOut(clamp((S.eyesT - 1 - k * 2.2) / 1.2)))));
        swimmers.forEach((b) => { const u = b.userData; u.a += dt * u.sp * (1 + S.eyesT); b.position.set(Math.cos(u.a) * u.r, u.y, Math.sin(u.a) * u.r * 0.5); b.rotation.y = -u.a; });
        stage.scene.background.setHSL(0.55, 0.2, 0.55 + 0.3 * Math.abs(Math.sin(S.eyesT * 3)));
        ctx.ui.label('gen', 1, `${S.gen.toLocaleString()} generations`, V(EYES.x, 3.2, EYES.z));
      }
      if (S.phase === 'walk' && S.asked) {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) putBack(true);
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.closeT >= 0) { const u = easeInOut(clamp(S.closeT / 1.2)); return { pos: CLOSE.clone().add(V(0, 6.5 - u * 0.5, 3.4)), look: CLOSE.clone(), stiffness: 6 }; }
      if (S.eyesT >= 0) return { pos: EYES.clone().add(V(0, 3.8, 12.5)), look: EYES.clone().add(V(0, 0.9, 0)), stiffness: 6 };
      const look = V(clamp(pl.pos.x, -8, 8) * 0.7, 1, clamp(pl.pos.z, -16, 6) - 2);
      return { pos: look.clone().add(V(0, 8, 13)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; player.sit(false); },
  });
}
