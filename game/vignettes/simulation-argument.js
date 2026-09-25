// Vignette: The Simulation Argument.
// Your study. Under a glass dome on your desk, a little world you built is running — and inside it, someone has built
// another. Run more worlds; then the camera pulls back and your study is under a dome too. Switch yours off, or leave
// them running.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeTree, makeHouse, makePerson, animatePerson, makeTable, makeLever, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DESK = V(0, 0, -3);
const DOME = V(0.6, 1.36, -3);            // the world on your desk
const COMPUTER = V(-1.4, 0, -3);
const DOOR = V(8.5, 0, 1);
const SHELF_X = -8.2;

// a little world (and, if depth > 0, a little study inside it with its own dome)
function miniWorld(depth, walkers) {
  const g = new THREE.Group(), r = seeded(40 + depth);
  g.add(makeIsland({ radius: 12, seed: 3 + depth, decor: false }));
  const h = makeHouse(); h.position.set(-3, 0, -3); g.add(h);
  for (let i = 0; i < 6; i++) { const t = makeTree(0.8 + r() * 0.5, r); const a = r() * 6.28, rr = 6 + r() * 4; t.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); g.add(t); }
  for (let i = 0; i < 3; i++) { const p = makePerson({ color: [palette.many, palette.one, palette.agent][i] }); g.add(p); walkers.push({ p, ph: i * 2.1 + depth, r: 3 + i }); }
  if (depth > 0) {
    const d = makeTable({ w: 2, d: 1, h: 1 }); d.position.set(3, 0, 1); g.add(d);
    const inner = miniWorld(depth - 1, walkers); inner.scale.setScalar(0.035); inner.position.set(3.3, 1.12, 1); g.add(inner);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05, depthWrite: false }));
    glass.position.set(3.3, 1.1, 1); g.add(glass);
  }
  return g;
}

function dome(radius) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }));
}

export default function simulationArgument(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 400);
  voice.load('simulation-argument');
  const frame = makeFramer(stage);

  // ---- the study
  const room = new THREE.Group(); root.add(room);
  room.add(makeIsland({ radius: 12, seed: 2, decor: false, color: 0xd9c3a2, rim: 0xb89572 }));
  const rug = mesh(new THREE.CylinderGeometry(4, 4, 0.04, 40), clay(0x8c4a4a)); rug.position.set(0, 0.02, 1); rug.castShadow = false; room.add(rug);
  const wall = mesh(new THREE.BoxGeometry(20, 6, 0.4), clay(0xe9dcc3)); wall.position.set(0, 3, -5.5); room.add(wall);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2), new THREE.MeshBasicMaterial({ color: 0xcfe0ee })); win.position.set(4, 3.4, -5.28); room.add(win);
  const desk = makeTable({ w: 3.4, d: 1.4, h: 1.2, color: palette.wood }); desk.position.copy(DESK); room.add(desk);
  const monitor = mesh(new THREE.BoxGeometry(1, 0.8, 0.7), clay(0xdcd6cb)); monitor.position.copy(COMPUTER).add(V(0, 1.72, 0)); room.add(monitor);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.58), new THREE.MeshBasicMaterial({ color: 0x3fae8e })); screen.position.copy(COMPUTER).add(V(0, 1.74, 0.36)); room.add(screen);
  const lever = makeLever(); lever.scale.setScalar(0.5); lever.position.copy(DESK).add(V(1.4, 1.31, 0.35)); room.add(lever);
  const walkers = [];
  const world = miniWorld(1, walkers); world.scale.setScalar(0.05); world.position.copy(DOME).add(V(0, -0.02, 0)); room.add(world);
  const glass = dome(0.75); glass.position.copy(DOME); room.add(glass);
  // shelves that fill up with more worlds
  const shelf = new THREE.Group();
  for (const y of [1, 2.2, 3.4]) { const b = mesh(new THREE.BoxGeometry(0.8, 0.08, 5), clay(palette.wood)); b.position.set(SHELF_X, y, -1.5); shelf.add(b); }
  room.add(shelf);
  const extras = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(); const w = miniWorld(0, walkers); w.scale.setScalar(0.03); g.add(w); const d = dome(0.45); g.add(d);
    g.position.set(SHELF_X, 1.05 + Math.floor(i / 2) * 1.2, -3 + (i % 2) * 2.4); g.scale.setScalar(0.001); room.add(g); extras.push(g);
  }
  const door = new THREE.Group(); const dmat = clay(0xf2e6d4);
  for (const x of [-0.8, 0.8]) { const p = mesh(new THREE.BoxGeometry(0.14, 3, 0.3), dmat); p.position.set(x, 1.5, 0); door.add(p); }
  const panel = mesh(new THREE.BoxGeometry(1.46, 2.9, 0.1), clay(palette.agent)); panel.position.y = 1.45; door.add(panel);
  door.position.copy(DOOR); door.rotation.y = -Math.PI / 2; room.add(door);

  // ---- the reveal: your study sits under a dome on a much bigger desk, and someone is looking in
  const outside = new THREE.Group(); outside.visible = false; root.add(outside);
  const bigDome = dome(16); outside.add(bigDome);
  const bigDesk = mesh(new THREE.BoxGeometry(160, 2, 90), clay(palette.wood)); bigDesk.position.set(0, -6.6, 0); outside.add(bigDesk);
  const giant = new THREE.Group();
  const gHead = mesh(new THREE.SphereGeometry(22, 40, 24), clay(0xf1d7bd)); giant.add(gHead);
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(2.4, 16, 12), clay(palette.ink)); e.position.set(7 * s, 3, 20.6); giant.add(e); }
  giant.position.set(0, 26, -78); outside.add(giant);

  // a photo on the wall
  const photo = new THREE.Group();
  const pframe = mesh(new THREE.BoxGeometry(1, 1.2, 0.08), clay(0x6b4a33)); photo.add(pframe);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.96), new THREE.MeshBasicMaterial({ color: 0xd9cdb6 })); pic.position.z = 0.045; photo.add(pic);
  const kid = makePerson({ color: palette.agent }); kid.scale.setScalar(0.28); kid.position.set(0, -0.42, 0.06); photo.add(kid);
  photo.position.set(-3.6, 3.1, -5.26); room.add(photo);

  // the frog hops up onto the desk and looks into the dome; inside, a (relatively enormous) frog comes to look back
  const frog = makeFrog(); room.add(frog);
  const mini = makeFrog({ scale: 2.4 }); world.add(mini);
  const miniCameo = frogCameo(mini, [[-1, -4], [-3.4, -1.4], [-5.8, 0.8], [-8, 2.6], { face: [-20, 11] }, { wait: 1.8 }, { face: [-1, -4] }, [-5.8, 0.8], [-3.4, -1.4], [-2.6, -3.4]]);
  const cameo = frogCameo(frog, [[6.2, 4.6], [4.8, 3], [3.2, 1.6], [1.6, 0.4], [0.2, -1], { at: [-0.4, -2.5], y: 1.31, height: 1.1 }, { face: [0.6, -3] },
    { set: () => miniCameo.start() }, { wait: 4.8, act: (f, u) => (f.userData.body.rotation.x = 0.18 * Math.sin(Math.PI * clamp(u * 1.3))) },
    { face: [-3, -1] }, { at: [-2.2, -1.2], y: 0, height: 1 }, [-3.8, 0.2], [-5.4, 1.6], [-7, 3], [-8.6, 4.4], [-10.2, 5.8]]);

  const S = { phase: 'explore', looked: false, more: false, zoomT: -1, revealT: -1, extrasT: -1, off: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/simulation-argument.json', 'The Simulation Argument');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: DESK.clone().add(V(0.6, 0, 1.2)), radius: 2.2, height: 2.4, prompt: 'Look closer', enabled: () => S.phase === 'explore' && !S.looked,
    onUse: async () => { S.looked = true; S.phase = 'zoom'; S.zoomT = 0; player.enabled = false;
      await voice.say('look'); await ctx.wait(0.8); S.zoomDeep = true; await voice.say('nested'); await ctx.wait(1.2);
      S.phase = 'explore'; S.zoomT = -1; S.zoomDeep = false; player.enabled = true; } });
  interact.add({ pos: COMPUTER.clone().add(V(0, 0, 1.2)), radius: 2, height: 2.4, prompt: 'Run more worlds', enabled: () => S.phase === 'explore' && S.looked && !S.more,
    onUse: async () => { S.more = true; S.extrasT = 0; await voice.say('more'); await ctx.wait(0.6); await voice.say('ask'); await ctx.wait(0.6);
      S.phase = 'reveal'; S.revealT = 0; player.enabled = false; outside.visible = true;
      await ctx.wait(3); await voice.say('pullout'); await ctx.wait(1.5);
      S.phase = 'choose'; S.revealT = -1; outside.visible = false; player.enabled = true; } });
  interact.add({ pos: DESK.clone().add(V(1.4, 0, 1.2)), radius: 1.8, height: 2.2, prompt: 'Switch them off', enabled: () => S.phase === 'choose',
    onUse: async () => { S.phase = 'off'; await ctx.wait(2.2); await voice.say('off_end'); await ctx.wait(1.4); save.complete('simulation-argument');
      ctx.gameOver({ title: 'You switched them off', text: 'Every little world went dark at once. If your world is one of those, somebody could do the same.' }); } });
  interact.add({ pos: DOOR.clone().add(V(-1.2, 0, 0)), radius: 2.2, height: 3, prompt: 'Leave them running', enabled: () => S.phase === 'choose',
    onUse: async () => { S.phase = 'over'; await voice.say('run_end'); await ctx.wait(1); save.complete('simulation-argument');
      ctx.gameOver({ title: 'You let them run', text: 'The little people carry on, never knowing. Neither, perhaps, do you.' }); } });

  // asides: the window, the photo
  look(ctx, { pos: V(4, 0, -4.1), radius: 1.8, height: 3.6, prompt: 'Look out of the window', lines: ['window'], enabled: () => S.phase === 'explore' || S.phase === 'choose' });
  look(ctx, { pos: V(-3.6, 0, -4.1), radius: 1.8, height: 3.6, prompt: 'Look at the photo', lines: ['photo'], enabled: () => S.phase === 'explore' || S.phase === 'choose' });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 3, z: 4, rotY: Math.PI * 1.1 },
    walkable: (x, z) => Math.hypot(x, z) < 10.5 && z > -4.6,
    blockers: () => [{ x: DESK.x, z: DESK.z, r: 1.6 }, { x: SHELF_X, z: -1.5, r: 0.7 }],
    update(dt, t) {
      // the little people wander
      for (const w of walkers) { const a = t * 0.25 + w.ph; w.p.position.set(Math.cos(a) * w.r, 0, Math.sin(a) * w.r * 0.7); w.p.rotation.y = -a; animatePerson(w.p, t * 2, { phase: w.ph }); }
      if (S.extrasT >= 0) { S.extrasT += dt; extras.forEach((e, i) => e.scale.setScalar(Math.max(0.001, clamp((S.extrasT - i * 0.35) / 0.6)))); }
      // switching off: the little worlds go dark, then your own lights falter
      if (S.phase === 'off' || S.offT !== undefined) {
        S.offT = (S.offT ?? 0) + dt;
        const dark = clamp(S.offT / 1.2);
        world.visible = dark < 0.5; extras.forEach((e) => (e.visible = dark < 0.5));
        screen.material.color.set(dark > 0.5 ? 0x1a1a1a : 0x3fae8e);
        const flick = S.offT > 1.6 ? (Math.sin(S.offT * 23) > 0.2 ? 0.25 : 1) * Math.max(0.35, 1 - (S.offT - 1.6) * 0.3) : 1;
        stage.hemi.intensity = 1.6 * flick; stage.sun.intensity = 2.4 * flick;
      }
      if (S.looked && S.phase === 'explore') cameo.start();
      cameo.update(dt); miniCameo.update(dt);
    },
    camera(pl, time, dt = 1 / 60) {
      if (S.phase === 'zoom') {
        // into the dome, then into the dome inside the dome
        S.zoomT += dt;
        const inner = V(0.6 + 3.3 * 0.05, 1.36 + 1.12 * 0.05, -3 + 1 * 0.05);
        const target = S.zoomDeep ? inner : DOME;
        const dist = S.zoomDeep ? 0.18 : 1.3;
        return { pos: target.clone().add(V(0.25 * dist, 0.5 * dist, 1 * dist)), look: target, stiffness: 3 };
      }
      if (S.phase === 'reveal') {
        S.revealT += dt;
        const k = easeInOut(clamp(S.revealT / 4));
        return { pos: V(lerp(6, 30, k), lerp(8, 34, k), lerp(14, 70, k)), look: V(0, lerp(1, 8, k), lerp(-3, -30, k)), stiffness: 2 };
      }
      return { ...frame([pl.pos.clone(), DOME.clone().add(V(0, 0.8, 0)), V(SHELF_X, 3.5, -1.5), DOOR.clone().add(V(0, 3, 0))], { min: 12, max: 30 }), stiffness: 2.4 };
    },
    dispose() { voice.stop(); },
  });
}
