// Vignette: Plato's Cave.
// You begin chained among prisoners, facing a wall of shadows. Your chains come loose: turn back to the wall (ending),
// or turn around, find the fire and the cutouts, and climb into daylight. Outside you can stay (ending) or go back down
// to tell the others (ending).
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, setOpacity,
  makeIsland, makeTree, makePerson, animatePerson, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const OUT = V(300, 0, 0);                     // the world outside (its own island)
const SEAT = V(0, 0, -3);                     // your place in the row of prisoners
const WALL_Z = -9.4;
const FIRE = V(0, 0, 7.5);
const MOUTH = V(17, 0, 6);                    // the way up and out
const ARCH = OUT.clone().add(V(-11, 0, 6));   // the cave mouth, seen from outside
const TREE = OUT.clone().add(V(4, 0, -3));
const POND = OUT.clone().add(V(-2, 0, -8));
const SUN = OUT.clone().add(V(6, 11, -46));
const DARK = 0x17130f;

// silhouettes carried past the fire (and cast on the wall)
function cutoutShape(kind) {
  const s = new THREE.Shape();
  if (kind === 'tree') { s.moveTo(-0.08, 0); s.lineTo(0.08, 0); s.lineTo(0.08, 0.3); s.lineTo(0.45, 0.3); s.lineTo(0, 1.05); s.lineTo(-0.45, 0.3); s.lineTo(-0.08, 0.3); }
  else if (kind === 'bird') { s.moveTo(-0.6, 0.45); s.quadraticCurveTo(-0.3, 0.3, 0, 0.1); s.quadraticCurveTo(0.3, 0.3, 0.6, 0.45); s.quadraticCurveTo(0.3, 0.2, 0, 0); s.quadraticCurveTo(-0.3, 0.2, -0.6, 0.45); }
  else if (kind === 'jar') { s.moveTo(-0.12, 0); s.lineTo(0.12, 0); s.quadraticCurveTo(0.38, 0.35, 0.18, 0.7); s.lineTo(0.12, 0.85); s.lineTo(-0.12, 0.85); s.lineTo(-0.18, 0.7); s.quadraticCurveTo(-0.38, 0.35, -0.12, 0); }
  else { // horse
    s.moveTo(-0.5, 0); s.lineTo(-0.42, 0); s.lineTo(-0.38, 0.35); s.lineTo(0.3, 0.35); s.lineTo(0.34, 0); s.lineTo(0.42, 0); s.lineTo(0.42, 0.55);
    s.lineTo(0.6, 0.8); s.lineTo(0.7, 0.72); s.lineTo(0.5, 0.45); s.lineTo(0.45, 0.6); s.lineTo(-0.45, 0.6); s.lineTo(-0.6, 0.5); s.lineTo(-0.5, 0.4);
  }
  return s;
}

export default function platosCave(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  voice.load('platos-cave');
  const frame = makeFramer(stage);

  // ================================================================ the cave
  const cave = new THREE.Group(); root.add(cave);
  const floor = mesh(new THREE.CylinderGeometry(24, 24, 0.6, 64), clay(0x5a4a3c)); floor.position.y = -0.3; cave.add(floor);
  const wall = mesh(new THREE.BoxGeometry(26, 10, 1), clay(0x9a8a74)); wall.position.set(0, 5, WALL_Z - 0.5); cave.add(wall);
  const rnd = seeded(8), rockMat = clay(0x6b5a48, { flatShading: true });
  const rock = (x, z, s) => { const r = mesh(new THREE.DodecahedronGeometry(s, 0), rockMat); r.position.set(x, s * 0.55, z); r.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); cave.add(r); };
  for (let z = -9; z <= 3; z += 2.2) { rock(-17 - rnd() * 2, z, 2.6 + rnd() * 1.4); rock(17 + rnd() * 2, z, 2.6 + rnd() * 1.4); }
  for (let x = -16; x <= 16; x += 3) rock(x, -14 - rnd(), 3 + rnd() * 1.2);   // behind the shadow wall
  rock(19, 10, 3.2); rock(21, 3.6, 2.8);                      // frame the mouth
  const glowMouth = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: 0xfff6dc }));
  glowMouth.position.copy(MOUTH).add(V(2.6, 2.2, 0)); glowMouth.rotation.y = -Math.PI / 2; cave.add(glowMouth);
  const shaft = new THREE.PointLight(0xfff0cc, 30, 18, 1.4); shaft.position.copy(MOUTH).add(V(0, 3, 0)); cave.add(shaft);

  // the fire
  const logs = new THREE.Group();
  for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.8, 8), clay(0x4a3526)); l.rotation.set(Math.PI / 2, i * 1.05, 0); l.position.y = 0.2; logs.add(l); }
  const flames = [0, 1, 2, 3].map((i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.4 - i * 0.06, 1.4 - i * 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xffc36b, emissive: 0xff8a3d, emissiveIntensity: 2.4 })); f.position.set((i - 1.5) * 0.3, 0.8, (i % 2) * 0.2); logs.add(f); return f; });
  logs.position.copy(FIRE); cave.add(logs);
  const fireLight = new THREE.PointLight(0xff9a4d, 90, 40, 1.4); fireLight.position.copy(FIRE).add(V(0, 1.6, 0)); cave.add(fireLight);

  // the low wall, the puppeteers and their cutouts
  const parapet = mesh(new THREE.BoxGeometry(18, 1.3, 0.5), clay(0x7a6a58)); parapet.position.set(0, 0.65, 2.6); cave.add(parapet);
  const kinds = ['tree', 'bird', 'jar', 'horse'];
  const carriers = kinds.map((kind, i) => {
    const p = makePerson({ color: 0x5a4a5e }); p.position.set(0, 0, 3.4); cave.add(p);
    const cut = mesh(new THREE.ExtrudeGeometry(cutoutShape(kind), { depth: 0.05, bevelEnabled: false }), clay(0xc9a878));
    const stick = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), clay(palette.trunk)); stick.position.y = -0.55;
    const holder = new THREE.Group(); holder.add(cut, stick); holder.scale.setScalar(1.1); cave.add(holder);
    const shadow = new THREE.Mesh(new THREE.ShapeGeometry(cutoutShape(kind)), new THREE.MeshBasicMaterial({ color: 0x1b1612, transparent: true, opacity: 0.82 }));
    shadow.scale.setScalar(2.6); cave.add(shadow);
    return { p, holder, shadow, phase: i * 4.6 };
  });

  // your own shadow, which appears on the wall among the shapes if you keep watching after the chains fall
  const shadowMe = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ color: 0x1b1612, transparent: true, opacity: 0 }));
  shadowMe.scale.set(1, 1.2, 1); shadowMe.position.set(0.2, 2.4, WALL_Z + 0.03); cave.add(shadowMe);
  const shadowBody = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2), shadowMe.material); shadowBody.position.set(0, -1.9, 0); shadowMe.add(shadowBody);
  const bounce = new THREE.PointLight(0xff9a4d, 18, 14, 1.6); bounce.position.set(0, 3.5, WALL_Z + 3); cave.add(bounce);   // firelight on the wall

  // the prisoners (you in the middle), with shackles and chains
  const prisoners = [-6, -3, 3, 6].map((x) => { const p = makePerson({ color: palette.many }); p.position.set(x, 0, SEAT.z); p.rotation.y = Math.PI; p.userData.body.position.y = -0.42; cave.add(p); return p; });
  const chainMat = clay(0x3a3a40, { metalness: 0.4 });
  const makeChain = (x) => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) { const l = mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 12), chainMat); l.position.set(x + 0.18 * i - 0.4, 0.1, SEAT.z + 0.45); l.rotation.y = i % 2 ? Math.PI / 2 : 0; g.add(l); }
    const peg = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), chainMat); peg.position.set(x + 0.7, 0.1, SEAT.z + 0.45); g.add(peg);
    cave.add(g); return g;
  };
  [-6, -3, 3, 6].forEach(makeChain);
  const myChain = makeChain(0);

  // ================================================================ outside
  const out = new THREE.Group(); out.position.copy(OUT); root.add(out);
  out.add(makeIsland({ radius: 26, seed: 14, color: 0x9cc97a, rim: 0x7aa05c }));   // the most vivid place in the house
  const tree = makeTree(2.2, seeded(4)); tree.position.copy(TREE).sub(OUT); out.add(tree);
  // the pond really reflects (you, the tree, the sky): the first thing you can see clearly outside
  const pond = new Reflector(new THREE.CircleGeometry(3, 48), { clipBias: 0.003, textureWidth: 512, textureHeight: 512, color: 0x9fbccd });
  pond.rotation.x = -Math.PI / 2; pond.position.copy(POND).sub(OUT).setY(0.03); out.add(pond);
  const rim = mesh(new THREE.TorusGeometry(3.05, 0.12, 8, 48), clay(0xb8a98c)); rim.rotation.x = Math.PI / 2; rim.position.copy(pond.position); out.add(rim);
  // the real things the shadows were made from: a horse, birds, a jar (and the tree)
  const horse = new THREE.Group(), hide = clay(0x8c5a3c);
  const hb = mesh(new THREE.CapsuleGeometry(0.55, 1.5, 8, 14), hide); hb.rotation.z = Math.PI / 2; hb.position.y = 1.55; horse.add(hb);
  const hn = mesh(new THREE.CylinderGeometry(0.25, 0.38, 1.2, 12), hide); hn.position.set(1.1, 2.15, 0); hn.rotation.z = -0.7; horse.add(hn);
  const hh = mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), hide); hh.position.set(1.65, 2.55, 0); hh.rotation.z = -1.3; horse.add(hh);
  const mane = mesh(new THREE.BoxGeometry(0.9, 0.2, 0.12), clay(0x3a2a20)); mane.position.set(1.1, 2.55, 0); mane.rotation.z = -0.7; horse.add(mane);
  for (const [x, z] of [[-0.7, -0.3], [-0.7, 0.3], [0.7, -0.3], [0.7, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.11, 0.09, 1.2, 8), hide); l.position.set(x, 0.6, z); horse.add(l); }
  const htail = mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.9, 8), clay(0x3a2a20)); htail.position.set(-1.2, 1.4, 0); htail.rotation.z = 0.5; horse.add(htail);
  horse.position.set(8, 0, 4); horse.rotation.y = 2.4; out.add(horse);
  const jar = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.28, 0.05], [0.42, 0.35], [0.3, 0.7], [0.2, 0.8], [0.24, 0.9]].map(([x, y]) => new THREE.Vector2(x, y)), 24), clay(0xc9705a, { side: THREE.DoubleSide }));
  jar.position.copy(POND).sub(OUT).add(V(3.6, 0, 1.4)); out.add(jar);
  const birds = [0, 1, 2].map((i) => { const b = new THREE.Group(); for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.9, 0.05, 0.25), clay(0x2b2a33)); w.position.x = s * 0.42; w.rotation.z = s * 0.4; b.add(w); } out.add(b); return b; });
  const mound = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x8a7a66)); mound.scale.set(6, 4.2, 5); mound.position.copy(ARCH).sub(OUT).add(V(-3, 0, 0)); out.add(mound);
  const archHole = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1b1612 }));
  archHole.position.copy(ARCH).sub(OUT).add(V(2.4, 0, 0)); archHole.rotation.y = Math.PI / 2; out.add(archHole);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffd76b, fog: false }));
  sun.position.copy(SUN).sub(OUT); out.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: 0xffc94d, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
  halo.position.copy(sun.position).add(V(0, 0, -0.5)); out.add(halo);
  // the frog hops to the pond, looks at itself for a moment, and plops in; a ripple, then just its eyes
  const frog = makeFrog(); out.add(frog);
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.95, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.set(-2.4, 0.05, -7.6); out.add(ripple);
  const rippleAt = (u) => { ripple.scale.setScalar(0.3 + u * 2.4); ripple.material.opacity = 0.7 * (1 - u); };
  const cameo = frogCameo(frog, [[-10, -2], [-8.4, -3.2], [-6.8, -4.4], [-5.4, -5.4], { face: [-2, -8] },
    { wait: 1.6, act: (f, u) => (f.userData.body.rotation.x = 0.25 * Math.sin(Math.PI * u)) },
    { at: [-2.4, -7.6], y: -0.9, height: 1.7 }, { wait: 1.2, act: (f, u) => rippleAt(u) },
    { warp: [-1.4, -8.6], y: -0.42 }, { wait: 3, act: (f, u, t) => { f.position.y = -0.42 + Math.sin(t * 3) * 0.03; rippleAt(Math.min(1, u * 1.6)); } }]);

  // ================================================================ state + interactions
  const S = { phase: 'chained', pt: 0, where: 'cave', eyes: 0, told: false, turned: false, facingWall: 0, dazzle: 0, sawPond: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/platos-cave.json', "Plato's Cave");
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(800, 200), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.x = 150; root.add(groundPlane); level.ground.push(groundPlane);

  function setLight(where) {
    S.where = where;
    const dark = where === 'cave';
    stage.hemi.intensity = dark ? 0.32 : 1.8; stage.sun.intensity = dark ? 0.12 : 2.9;
    stage.hemi.color.set(dark ? 0xffb070 : 0xfff6e8);
    stage.scene.background = new THREE.Color(dark ? DARK : 0xcfe3f1);
    stage.scene.fog = dark ? new THREE.Fog(DARK, 22, 60) : new THREE.Fog(0xcfe3f1, 60, 180);
    cave.visible = dark; out.visible = !dark;
    // inside the cave you see through your own eyes; outside, the camera steps back
    player.firstPerson = dark; player.obj.visible = !dark; player.pitch = dark ? 0.1 : 0;
  }
  setLight('cave');

  async function ending(line, title, text) {
    S.phase = 'over';
    await voice.say(line); await ctx.wait(1.2);
    save.complete('platos-cave');
    ctx.gameOver({ title, text });
  }

  // asides: the other prisoners will chat (they're happy where they are); outside, the pond
  const CHAT = [
    ['My father sat here. And his father.', 'A tree! Did you see? Beautiful.'],
    ['Shh. The horse is next.', "I've counted. The bird always comes after the jar."],
    ['Best seat in the house, this.', "What's behind us? Nothing. Just rock."],
    ['I named that one. The jar. That was me.', 'Some days the shapes are faster.'],
  ];
  const BACK = ['Your eyes look strange.', "Out? There's no out.", "Sit down, you're in front of the tree.", 'Colours? What are colours?'];
  const inView = (p) => { const d = p.position.clone().sub(player.pos).setY(0).normalize(), v = player.viewDir().setY(0).normalize(); return !player.firstPerson || d.dot(v) > 0.45; };
  prisoners.forEach((p, k) => talk(ctx, { who: p, radius: 3.2, offset: [0, 2.7, 0], enabled: () => S.where === 'cave' && S.phase !== 'over' && S.phase !== 'transit' && inView(p),
    lines: (i) => (S.returned ? BACK[(k + i) % BACK.length] : CHAT[k][i % CHAT[k].length]) }));
  look(ctx, { pos: POND.clone().add(V(-2.4, 0, 2.6)), radius: 2.6, height: 1.5, prompt: 'Look in the pond', lines: ['reflection'], enabled: () => S.where === 'out' && S.phase === 'free' });
  look(ctx, { pos: () => horse.getWorldPosition(V()).add(V(-1.4, 0, 1.6)), radius: 2.4, height: 3, prompt: 'Look at the horse', lines: ['horse'], enabled: () => S.where === 'out' && S.phase === 'free' });

  interact.add({ pos: SEAT, radius: 2, height: 1.8, prompt: 'Sit back down', terminal: true, enabled: () => S.phase === 'free' && S.where === 'cave' && !S.returned && (S.turned || player.pos.distanceTo(SEAT) > 1.5),
    onUse: () => { player.place(SEAT.x, SEAT.z, Math.PI); player.sit(true); player.pitch = 0.3; ending('watch_end', 'You kept watching', 'The shadows were all you knew. It is hard to leave what you know.'); } });
  interact.add({ pos: TREE, radius: 3.2, height: 2.5, prompt: 'Sit under the tree', terminal: true, enabled: () => S.phase === 'free' && S.where === 'out' && S.saidChoose,
    onUse: () => { player.place(TREE.x + 0.6, TREE.z + 2.4, Math.PI); player.sit(true); S.stayed = true; ending('stay_end', 'You stayed in the light', 'The others are still down there, watching the wall. You are the only one who knows the way.'); } });
  interact.add({ pos: ARCH.clone().add(V(3, 0, 0)), radius: 2.8, height: 2.5, prompt: 'Go back down', enabled: () => S.phase === 'free' && S.where === 'out',
    onUse: async () => {
      S.phase = 'transit'; player.enabled = false;
      await ctx.flash(true);
      setLight('cave'); S.returned = true; S.eyes = 1;
      player.place(MOUTH.x - 2, MOUTH.z, -Math.PI / 2);
      await ctx.flash(false); player.enabled = true; S.phase = 'free';
      await ctx.wait(0.5); voice.say('back_dark');
    } });
  interact.add({ pos: V(0, 0, SEAT.z + 1.6), radius: 3.6, height: 2.4, prompt: 'Tell them', terminal: true, enabled: () => S.phase === 'free' && S.returned && !S.told,
    onUse: async () => { S.told = true; S.tellT = 0; ending('tell', 'You went back', 'You saw the sun, and came back to say so. They would rather keep the shadows.'); } });

  // chained: the scene plays; then someone comes, frees you and pulls you to your feet (you don't choose to go)
  const freer = makePerson({ color: 0x9a8a7a }); freer.position.set(-2, 0, 3.6); freer.visible = false; cave.add(freer);
  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(4); await voice.say('shadows'); await ctx.wait(5);
    freer.visible = true; S.freerTo = SEAT.clone().add(V(-0.9, 0, 0.8)); await ctx.wait(3.2);
    ctx.speak(freer, 'Get up. Come and see.', { offset: [0, 2.4, 0] });
    await voice.say('loose'); S.phase = 'free'; S.pt = 0; player.sit(false); player.yawLimit = null;
    await ctx.wait(1.5); S.freerTo = FIRE.clone().add(V(-2.4, 0, -1.5));
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: SEAT.x, z: SEAT.z, rotY: Math.PI },
    start() { player.sit(true); player.firstPerson = true; player.obj.visible = false; player.pitch = 0.3; player.yawLimit = [Math.PI - 1, Math.PI + 1]; },   // chained: you can turn your head to your neighbours, never behind you
    walkable: (x, z) => (S.where === 'cave'
      ? (Math.abs(x) < 15.5 && z > WALL_Z + 2.4 && z < 10.5) || Math.hypot(x - MOUTH.x, z - MOUTH.z) < 3.5
      : Math.hypot(x - OUT.x, z - OUT.z) < 22 && Math.hypot(x - POND.x, z - POND.z) > 3.2),
    blockers: () => S.where === 'cave'
      ? [...prisoners.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.6 })), { x: FIRE.x, z: FIRE.z, r: 1.4 }, { x: 0, z: 2.6, w: 18.4, d: 0.8 }, ...carriers.map((c) => ({ x: c.p.position.x, z: 3.4, r: 0.45 }))]
      : [{ x: TREE.x, z: TREE.z, r: 0.8 }, { x: ARCH.x - 3, z: ARCH.z, r: 5.3 }, { x: horse.position.x + OUT.x, z: horse.position.z + OUT.z, r: 1.3 }, { x: jar.position.x + OUT.x, z: jar.position.z + OUT.z, r: 0.5 }],

    update(dt, t) {
      S.pt += dt;
      // puppeteers walk back and forth behind the low wall; their cutouts' shadows cross the cave wall
      for (const c of carriers) {
        const u = ((t * 0.16 + c.phase / 18.4) % 2), x = (u < 1 ? u : 2 - u) * 18 - 9;
        c.p.position.x = x; c.p.rotation.y = u < 1 ? Math.PI / 2 : -Math.PI / 2;
        animatePerson(c.p, t * 1.4, { phase: c.phase });
        c.holder.position.set(x, 2.3 + Math.sin(t * 2 + c.phase) * 0.06, 3.1); c.holder.rotation.y = 0;
        c.shadow.position.set(x * 1.55, 2.8 + Math.sin(t * 2 + c.phase) * 0.15, WALL_Z + 0.02);
      }
      flames.forEach((f, i) => { f.scale.y = 0.8 + 0.35 * Math.abs(Math.sin(t * (7 + i * 2.3) + i)); f.rotation.z = Math.sin(t * 5 + i) * 0.15; });
      fireLight.intensity = 80 + Math.sin(t * 11) * 12 + Math.sin(t * 27) * 6;

      // prisoners: still, watching; when you come back to tell them, they turn on you
      prisoners.forEach((p, i) => {
        p.userData.body.position.y = -0.42;
        if (S.told) { p.rotation.y = lerp(p.rotation.y, Math.atan2(player.pos.x - p.position.x, player.pos.z - p.position.z), 0.05); p.userData.body.rotation.z = Math.sin(t * 9 + i) * 0.08; }
      });
      setOpacity(myChain, S.phase === 'chained' ? 1 : Math.max(0, 1 - S.pt));

      // the one who freed you walks you towards the fire
      if (S.freerTo) { const d = S.freerTo.clone().sub(freer.position).setY(0); if (d.length() > 0.2) { freer.position.addScaledVector(d.normalize(), dt * 1.4); freer.rotation.y = Math.atan2(d.x, d.z); animatePerson(freer, t * 2); } else { freer.rotation.y = lerp(freer.rotation.y, Math.atan2(player.pos.x - freer.position.x, player.pos.z - freer.position.z), 0.05); animatePerson(freer, t, { energy: 0.3 }); } }
      // discovery lines: by what you turn to face, not where you stand
      if (S.phase === 'free' && S.where === 'cave' && !S.returned) {
        const v = player.viewDir();
        if (!S.turned && v.z > 0.35) { S.turned = true; voice.say('turn', { urgent: true }); S.assist = 1.6; }
        // still facing the wall: the firelight flickers on it, and your own shadow appears among the shapes
        S.facingWall = !S.turned && v.z < -0.3 ? S.facingWall + dt : 0;
        if (S.facingWall > 7 && !voice.said.has('behind')) voice.say('behind');
        // turn assist: when you first turn, ease round to the fire and look down at it
        if (S.assist > 0) { S.assist -= dt; const want = Math.atan2(FIRE.x - player.pos.x, FIRE.z - player.pos.z); let d = want - player.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); player.yaw += d * dt * 2.2; player.pitch = lerp(player.pitch, -0.12, dt * 2); }
        if (player.pos.distanceTo(FIRE) < 7 && S.turned) { voice.say('hurts'); voice.say('climb'); }
        if (player.pos.distanceTo(MOUTH) < 7) voice.say('bright');
        // it hurts: the way to the fire and up to the light is slow going
        player.speed = S.turned ? 2.2 + clamp(player.pos.distanceTo(MOUTH) / 12) * 0.8 : 4.2;
        if ((player.pos.distanceTo(MOUTH) < 2 || player.pos.x > MOUTH.x - 0.3) && S.phase === 'free') {
          S.phase = 'transit'; player.enabled = false;
          (async () => {
            await ctx.flash(true); setLight('out'); player.speed = 4.2;
            player.place(ARCH.x + 3.5, ARCH.z, Math.PI / 2);
            S.dazzle = 1; ctx.ui.fade(0.95, '#fff6e2'); await ctx.flash(false); player.enabled = true; S.phase = 'free';
            await voice.say('outside_1');
            // the sun only once you've looked at things (the pond first), or after a while
            for (let i = 0; i < 100 && !voice.said.has('reflection') && !voice.said.has('horse'); i++) await ctx.wait(0.25);
            await ctx.wait(1); await voice.say('outside_2'); await ctx.wait(1.5); await voice.say('choose'); S.saidChoose = true;
          })();
        }
      }
      shadowMe.material.opacity = lerp(shadowMe.material.opacity, S.facingWall > 5 ? 0.75 : 0, dt * 1.5);
      // light: blinding near the mouth, dark-adapted eyes after going back
      const blind = S.where === 'cave' && !S.returned ? clamp((9 - player.pos.distanceTo(MOUTH)) / 7) : 0;
      S.eyes = Math.max(0, S.eyes - dt / 9);
      S.dazzle = Math.max(0, S.dazzle - dt / 6);                     // outside: washed out at first, then full colour
      if (blind > 0) ctx.ui.fade(blind * 0.92, '#fff3d6'); else if (S.dazzle > 0) ctx.ui.fade(S.dazzle * 0.9, '#fff6e2'); else ctx.ui.fade(S.eyes * 0.85, '#0c0a08');
      birds.forEach((b, i) => { const a = t * 0.12 + i * 2.1; b.position.set(Math.cos(a) * 18, 9 + i * 1.3 + Math.sin(t + i) * 0.4, -10 + Math.sin(a) * 10); b.rotation.y = -a; b.children.forEach((w, k) => (w.rotation.z = (k ? 1 : -1) * (0.15 + 0.35 * Math.sin(t * 7 + i)))); });

      // frog: once, by the pond outside
      if (S.where === 'out' && player.pos.distanceTo(POND) < 11) cameo.start();
      cameo.update(dt); if (cameo.done) ripple.material.opacity = 0;
      halo.material.opacity = 0.34 + 0.08 * Math.sin(t * 1.3);
    },

    camera(pl) {
      if (S.where === 'out') {
        // look out across the land towards the sun
        const look = pl.pos.clone().lerp(TREE, 0.3).add(V(0, 3, -6));
        return { pos: pl.pos.clone().add(V(-2, 7, 15)), look, stiffness: 2.2 };
      }
      // inside the cave: first person, through your own eyes
      const eye = pl.eye();
      return { pos: eye, look: eye.clone().add(pl.viewDir()), stiffness: 25, fov: 64 };
    },

    dispose() { voice.stop(); ctx.ui.fade(0); },
  });
}
