// Vignette: Barn Façade County (a Gettier case, Ginet's, published by Goldman).
// Driving through Grant Wood's country, you get a flat tyre right beside a red barn. Look at it: that's a barn. It is.
// But look along the road: every other barn is only a front, propped up with sticks, and from the road you couldn't
// tell them apart. You happened to look at the one real barn. Or walk all the way round it first, and be able to tell.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeCar } from '../core/props.js';
import { makeCountry, makeLollipop } from '../core/grantwood.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ROAD_Z = 2.4, BARN_Z = -5;
const XS = [-26, -17.5, -9, 0, 9, 17.5, 26];         // x of each barn along the road; the real one is at 0
const IDLE_LIMIT = 60;

// a barn's front: red boards, white trim, a big X-braced door, a loft door; `real` adds the rest of the barn behind it
function makeBarnFront(real) {
  const g = new THREE.Group(), red = clay(0xa8322a), white = clay(0xf6f1e7);
  const sh = new THREE.Shape(); sh.moveTo(-3, 0); sh.lineTo(3, 0); sh.lineTo(3, 3.6); sh.lineTo(1.6, 5.4); sh.lineTo(-1.6, 5.4); sh.lineTo(-3, 3.6); sh.closePath();
  const front = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }), red); g.add(front);
  const door = mesh(new THREE.BoxGeometry(2.2, 2.7, 0.06), clay(0x8a2a24)); door.position.set(0, 1.35, 0.18); g.add(door);
  for (const s of [-1, 1]) { const x = mesh(new THREE.BoxGeometry(0.12, 3.2, 0.03), white); x.position.set(0, 1.35, 0.22); x.rotation.z = s * 0.66; g.add(x); }
  const frame = mesh(new THREE.BoxGeometry(2.5, 3, 0.04), white); frame.position.set(0, 1.4, 0.16); g.add(frame);
  const loft = mesh(new THREE.BoxGeometry(1, 1, 0.06), white); loft.position.set(0, 4.1, 0.18); g.add(loft);
  if (real) {
    const body = mesh(new THREE.BoxGeometry(6, 3.6, 7.6), red); body.position.set(0, 1.8, -3.8); g.add(body);
    for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(2.3, 0.18, 7.8), clay(0x5a5a62)); r.position.set(s * 2.2, 4.5, -3.8); r.rotation.z = -s * 0.9; g.add(r); const r2 = mesh(new THREE.BoxGeometry(2, 0.18, 7.8), clay(0x5a5a62)); r2.position.set(s * 0.8, 5.35, -3.8); r2.rotation.z = -s * 0.35; g.add(r2); }
    const gable = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }), red); gable.position.z = -7.7; g.add(gable);
    const silo = mesh(new THREE.CylinderGeometry(1.2, 1.2, 7, 18), clay(0xd9d2c0)); silo.position.set(4.4, 3.5, -5); g.add(silo);
    const dome = mesh(new THREE.SphereGeometry(1.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x8b909a)); dome.position.set(4.4, 7, -5); g.add(dome);
  } else {
    for (const x of [-2, 2]) { const prop = mesh(new THREE.BoxGeometry(0.12, 4.4, 0.12), clay(palette.wood)); prop.position.set(x, 2, -1.4); prop.rotation.x = -0.6; g.add(prop); }
    const brace = mesh(new THREE.BoxGeometry(5, 0.1, 0.1), clay(palette.wood)); brace.position.set(0, 2.6, -0.1); g.add(brace);
  }
  return g;
}

export default function fakeBarns(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xdfe9ee);
  stage.scene.fog = new THREE.Fog(0xdfe9ee, 50, 170);
  voice.load('fake-barns');
  const rnd = seeded(1976);

  // ---- the country, the road, the barns (one real), your car with its flat tyre
  root.add(makeCountry({ seed: 31, depth: -22, spread: 80 }));
  const ground = mesh(new THREE.BoxGeometry(80, 0.4, 30), clay(0xa9c77a)); ground.position.set(0, -0.2, -6); ground.receiveShadow = true; root.add(ground);
  const road = mesh(new THREE.BoxGeometry(80, 0.42, 3.2), clay(0x8b909a)); road.position.set(0, -0.19, ROAD_Z); root.add(road);
  for (let x = -38; x < 40; x += 4) { const dash = mesh(new THREE.BoxGeometry(1.6, 0.44, 0.12), clay(0xf6f1e7)); dash.position.set(x, -0.18, ROAD_Z); root.add(dash); }
  const barns = XS.map((x, i) => { const b = makeBarnFront(x === 0); b.position.set(x, 0, BARN_Z); b.rotation.y = (i % 2 ? 0.04 : -0.04); root.add(b); return b; });
  for (const x of [-21.5, -13, -4.6, 4.6, 13, 21.5]) { const t = makeLollipop(0.9); t.position.set(x, 0, BARN_Z - 0.6); root.add(t); }
  const car = makeCar(0x5b7fa6); car.position.set(1.4, 0, ROAD_Z + 0.2); car.rotation.set(0, Math.PI / 2, 0.06); root.add(car);
  const cow = new THREE.Group(); const cb = mesh(new THREE.CapsuleGeometry(0.45, 1, 6, 12), clay(0xf6f1e7)); cb.rotation.x = Math.PI / 2; cb.position.y = 0.9; cow.add(cb);
  for (const [x, z] of [[0.2, 0.2], [-0.3, -0.3]]) { const sp = mesh(new THREE.SphereGeometry(0.28, 10, 8), clay(palette.ink)); sp.scale.set(1, 0.6, 1); sp.position.set(x, 1.1, z); cow.add(sp); }
  const ch = mesh(new THREE.SphereGeometry(0.3, 10, 8), clay(0xf6f1e7)); ch.position.set(0, 1.1, 0.9); cow.add(ch);
  for (const [x, z] of [[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]]) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6), clay(0xf6f1e7)); l.position.set(x, 0.3, z); cow.add(l); }
  cow.position.set(1.6, 0, BARN_Z - 12.4); cow.rotation.y = 2.4; root.add(cow);
  const farmer = makePerson({ color: 0x3f5a8c, hat: true }); farmer.position.set(-3.8, 0, ROAD_Z + 2.4); farmer.rotation.y = 0.6; root.add(farmer);

  // ---- the frog hops out through the door of the next façade (there's nothing behind it) and across the road
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);
  const cameo = frogCameo(frog, [{ at: [9, BARN_Z - 1.4] }, [9, BARN_Z + 0.4], [9.2, BARN_Z + 2], { face: [9, 10] }, { wait: 1.6 }, [9.4, BARN_Z + 3.8], [9.8, ROAD_Z], [10.2, ROAD_Z + 2.2], [10.8, ROAD_Z + 4]]);

  // ---- state
  const S = { phase: 'road', idle: 0, cam: 'road', how: null };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/fake-barns.json', 'Barn Façade County');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  async function believe(how) {
    if (S.phase !== 'road') return;
    S.phase = 'over'; S.how = how; player.enabled = false;
    let card;
    if (how === 'look') {
      S.cam = 'barn'; await voice.say('barn', { urgent: true });
      card = beliefCard("That's a barn.", { reason: 'You had good reason to (you can see it plainly)' }); card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
      await ctx.wait(0.8); await voice.say('true'); card.tick(1);
    } else {
      player.locked = true; player.enabled = true; S.cam = 'round';
      const path = [V(-3.8, 0, BARN_Z + 1.4), V(-3.8, 0, BARN_Z - 9.6), V(6.6, 0, BARN_Z - 9.6), V(6.6, 0, BARN_Z + 1.4), V(3.4, 0, BARN_Z + 1.8)];   // wide of the silo
      for (const p of path) { player.target = p; for (let i = 0; i < 40 && player.target; i++) await ctx.wait(0.15); }
      player.enabled = false; await voice.say('round', { urgent: true });
      card = beliefCard("That's a barn.", { reason: 'You had good reason to (you walked all the way round it)' }); card.show(); await ctx.wait(0.6); card.tick(0); card.tick(2); await ctx.wait(0.5); card.tick(1);
    }
    // then, along the road
    await ctx.wait(0.8); await ctx.flash(true); S.cam = 'behind'; S.camT = 0; await ctx.flash(false); cameo.start(); await ctx.wait(1.2);   // (a cut, not a flight through the barns) await voice.say(how === 'look' ? 'facades' : 'facades_2');
    await ctx.wait(0.6);
    if (how === 'look') { card.ask(); await voice.say('end'); } else { card.ask('This time, you could tell.'); await voice.say('end_2'); }
    await ctx.wait(1.8);
    save.complete('fake-barns');
    ctx.gameOver(how === 'look'
      ? { title: 'You looked at the only real barn', text: 'You saw a barn, plainly, and said so, and you were right. But every other barn on that road was a front on sticks, and from the road you couldn\'t have told. Did you know it was a barn?' }
      : { title: 'You went round the back', text: 'You walked all the way round, so you could tell it from the fronts along the road. Knowing, perhaps, means being able to tell the real thing from the look-alikes around it.' });
  }
  interact.add({ pos: V(-0.6, 0, ROAD_Z - 1.2), radius: 1.3, height: 2.2, prompt: 'Look at the barn', terminal: true, enabled: () => S.phase === 'road', onUse: () => believe('look') });
  interact.add({ pos: V(-3.4, 0, BARN_Z + 2.6), radius: 1.3, height: 2.2, prompt: 'Walk all the way round it first', terminal: true, enabled: () => S.phase === 'road', onUse: () => believe('round') });
  look(ctx, { pos: V(2.8, 0, ROAD_Z + 1.2), radius: 1.3, height: 2, prompt: 'Look at the tyre', lines: ['tyre'], enabled: () => S.phase === 'road' });
  talk(ctx, { who: farmer, enabled: () => S.phase === 'road', lines: ['Lot of barns round here.', 'Lot of barns, for not many cows.', 'Film people put some of them up, years back. Or was it the tax man?'] });

  (async () => { await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.5); await voice.say('flat'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 2.8, z: ROAD_Z + 1.6, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < 34 && z > BARN_Z + 0.8 && z < ROAD_Z + 3.4 || (S.how === 'round' && Math.abs(x) < 7 && z > BARN_Z - 11),
    blockers: () => [{ x: car.position.x, z: car.position.z, w: 3.6, d: 1.8 }, { x: farmer.position.x, z: farmer.position.z, r: 0.4 }, { x: 0, z: BARN_Z - 3.8, w: 6.2, d: 7.8 }, { x: 4.4, z: BARN_Z - 5, r: 1.3 }],
    update(dt, t) {
      animatePerson(farmer, t, { energy: 0.3 });
      cow.userData.t = (cow.userData.t ?? 0) + dt; cow.children[3].position.y = 1.1 - Math.max(0, Math.sin(t * 0.7)) * 0.3;
      if (S.phase === 'road') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) believe('look');
      }
      if (S.camT !== undefined) S.camT += dt;
      cameo.update(dt);
    },
    camera(pl) {
      if (S.cam === 'barn') return { pos: V(-2, 2.6, ROAD_Z + 7), look: V(0, 2.6, BARN_Z), stiffness: 2 };
      if (S.cam === 'behind') {
        // round behind the row: the fronts, and the sticks holding them up; the real one in the middle, whole
        const u = easeInOut(clamp(S.camT / 4));
        return { pos: V(lerp(-22, 16, u), 13, BARN_Z - 30), look: V(lerp(-12, 8, u), 1.4, BARN_Z + 1), stiffness: S.camT < 0.4 ? 60 : 1.6 };
      }
      if (S.cam === 'round') return { pos: pl.pos.clone().add(V(6, 6, 9)), look: pl.pos.clone().add(V(0, 1, 0)), stiffness: 2 };
      const look = V(pl.pos.x * 0.7, 2, 0);
      return { pos: look.clone().add(V(0, 5, 14)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; },
  });
}
