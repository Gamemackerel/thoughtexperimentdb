// Vignette: Plato's Cave.
// You begin chained among prisoners, facing a wall of shadows. Your chains come loose: turn back to the wall (ending),
// or turn around, find the fire and the cutouts, and climb into daylight. Outside you can stay (ending) or go back down
// to tell the others (ending).
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, setOpacity,
  makeIsland, makeTree, makePerson, animatePerson, makeFrog, animateFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { makeFramer } from '../core/camera.js';

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
  out.add(makeIsland({ radius: 26, seed: 14 }));
  const tree = makeTree(2.2, seeded(4)); tree.position.copy(TREE).sub(OUT); out.add(tree);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3, 40), clay(0x8fb3c9, { roughness: 0.25 })); pond.rotation.x = -Math.PI / 2; pond.position.copy(POND).sub(OUT).setY(0.02); out.add(pond);
  const mound = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x8a7a66)); mound.scale.set(6, 4.2, 5); mound.position.copy(ARCH).sub(OUT).add(V(-3, 0, 0)); out.add(mound);
  const archHole = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1b1612 }));
  archHole.position.copy(ARCH).sub(OUT).add(V(2.4, 0, 0)); archHole.rotation.y = Math.PI / 2; out.add(archHole);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffd76b, fog: false }));
  sun.position.copy(SUN).sub(OUT); out.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: 0xffc94d, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
  halo.position.copy(sun.position).add(V(0, 0, -0.5)); out.add(halo);
  const frog = makeFrog(); out.add(frog);
  const FROG_PATH = [[-7, 0, -5], [-5, 0, -4.4], [-3, 0, -4.2], [-1, 0, -4.4], [1, 0, -5], [3, 0, -6]].map(([x, y, z]) => [x, y, z]);

  // ================================================================ state + interactions
  const S = { phase: 'chained', pt: 0, where: 'cave', eyes: 0, frogT: -1, frogDone: false, told: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/platos-cave.json', "Plato's Cave");
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(800, 200), new THREE.MeshBasicMaterial({ visible: false }));
  groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.x = 150; root.add(groundPlane); level.ground.push(groundPlane);

  function setLight(where) {
    S.where = where;
    const dark = where === 'cave';
    stage.hemi.intensity = dark ? 0.16 : 1.6; stage.sun.intensity = dark ? 0.12 : 2.4;
    stage.scene.background = new THREE.Color(dark ? DARK : palette.sky);
    stage.scene.fog = dark ? new THREE.Fog(DARK, 22, 60) : new THREE.Fog(palette.sky, 60, 180);
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

  interact.add({ pos: SEAT, radius: 2, height: 1.8, prompt: 'Sit back down', enabled: () => S.phase === 'free' && S.where === 'cave' && !S.returned,
    onUse: () => { player.place(SEAT.x, SEAT.z, Math.PI); player.sit(true); player.pitch = 0.3; ending('watch_end', 'You kept watching', 'The shadows were all you knew. It is hard to leave what you know.'); } });
  interact.add({ pos: TREE, radius: 3.2, height: 2.5, prompt: 'Sit under the tree', enabled: () => S.phase === 'free' && S.where === 'out',
    onUse: () => { player.place(TREE.x + 1.2, TREE.z + 1.2, Math.PI * 0.8); player.sit(true); ending('stay_end', 'You stayed in the light', 'The others are still down there, watching the wall.'); } });
  interact.add({ pos: ARCH.clone().add(V(3, 0, 0)), radius: 2.8, height: 2.5, prompt: 'Go back down', enabled: () => S.phase === 'free' && S.where === 'out' && S.saidChoose,
    onUse: async () => {
      S.phase = 'transit'; player.enabled = false;
      await ctx.flash(true);
      setLight('cave'); S.returned = true; S.eyes = 1;
      player.place(MOUTH.x - 2, MOUTH.z, -Math.PI / 2);
      await ctx.flash(false); player.enabled = true; S.phase = 'free';
      await ctx.wait(0.5); voice.say('back_dark');
    } });
  interact.add({ pos: V(0, 0, SEAT.z + 1.6), radius: 3.6, height: 2.4, prompt: 'Tell them', enabled: () => S.phase === 'free' && S.returned && !S.told,
    onUse: async () => { S.told = true; S.tellT = 0; ending('tell', 'You went back', 'You saw the sun, and came back to say so. They would rather keep the shadows.'); } });

  // chained: the scene plays; then the chains come loose
  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(4); await voice.say('shadows'); await ctx.wait(6);
    await voice.say('loose'); S.phase = 'free'; S.pt = 0; player.sit(false); player.yawLimit = null;
  })();

  return Object.assign(level, {
    spawn: { x: SEAT.x, z: SEAT.z, rotY: Math.PI },
    start() { player.sit(true); player.firstPerson = true; player.obj.visible = false; player.pitch = 0.3; player.yawLimit = [Math.PI - 0.45, Math.PI + 0.45]; },   // chained: you can only turn your head a little
    walkable: (x, z) => (S.where === 'cave'
      ? (Math.abs(x) < 15.5 && z > WALL_Z + 0.8 && z < 10.5) || Math.hypot(x - MOUTH.x, z - MOUTH.z) < 3.5
      : Math.hypot(x - OUT.x, z - OUT.z) < 22 && Math.hypot(x - POND.x, z - POND.z) > 3.2),
    blockers: () => S.where === 'cave'
      ? [...prisoners.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.6 })), { x: FIRE.x, z: FIRE.z, r: 1.4 }, ...[-6, -2, 2, 6].map((x) => ({ x, z: 2.6, r: 1.6 }))]
      : [{ x: TREE.x, z: TREE.z, r: 0.8 }, { x: ARCH.x - 3, z: ARCH.z, r: 4.5 }],

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

      // discovery lines
      if (S.phase === 'free' && S.where === 'cave' && !S.returned) {
        if (player.pos.z > 0 && !voice.said.has('turn')) voice.say('turn');
        if (player.pos.distanceTo(FIRE) < 7 && voice.said.has('turn')) voice.say('climb');
        if (player.pos.distanceTo(MOUTH) < 7) voice.say('bright');
        if (player.pos.distanceTo(MOUTH) < 2 && S.phase === 'free') {
          S.phase = 'transit'; player.enabled = false;
          (async () => {
            await ctx.flash(true); setLight('out');
            player.place(ARCH.x + 3.5, ARCH.z, Math.PI / 2);
            ctx.ui.fade(0); await ctx.flash(false); player.enabled = true; S.phase = 'free';
            await voice.say('outside'); await ctx.wait(1.5); await voice.say('choose'); S.saidChoose = true;
          })();
        }
      }
      // light: blinding near the mouth, dark-adapted eyes after going back
      const blind = S.where === 'cave' && !S.returned ? clamp((9 - player.pos.distanceTo(MOUTH)) / 7) : 0;
      S.eyes = Math.max(0, S.eyes - dt / 9);
      if (blind > 0) ctx.ui.fade(blind * 0.92, '#fffdf8'); else ctx.ui.fade(S.eyes * 0.85, '#0c0a08');

      // frog: once, by the pond outside
      if (!S.frogDone && S.where === 'out' && S.frogT < 0 && player.pos.distanceTo(POND) < 11) S.frogT = 0;
      if (S.frogT >= 0 && !S.frogDone) { S.frogT += dt; if (S.frogT > FROG_PATH.length * 1.3 + 1 || S.where !== 'out') S.frogDone = true; }
      frog.visible = S.frogT >= 0 && !S.frogDone;
      if (frog.visible) animateFrog(frog, S.frogT, FROG_PATH, { loop: false });
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
