// Vignette: Barn Façade County (a Gettier case, Ginet's, published by Goldman).
// Driving through Grant Wood's country, you get a flat tyre right beside a red barn, with a storm coming, in a row of
// barns that all look exactly alike. Look at it: that's a barn. Then the rain comes, and you run for it, and inside it's
// dry: it is a barn. But look along the road from behind: every other barn is only a front, propped up with sticks, and
// from the road you couldn't tell them apart. You happened to run into the one real barn. (One path; the act is shelter.)
// From the road, the real barn is only its front too: the rest of it (walls, roof, silo) appears once you're inside.
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
const IDLE_LIMIT = 40, RAIN_LIMIT = 25;
const DOOR = V(0, 0, BARN_Z + 1.4);                  // in front of the real barn's big door
const LOOK = V(0, 0, ROAD_Z + 1.5);                  // at the roadside, by your car, facing the barn: a step from where you stand

// a barn's front: red boards, white trim, a big X-braced door, a loft door; `real` adds the rest of the barn behind it,
// in two hidden groups: `inside` (walls, loft, straw, the back) shown as you go in, `outside` (roof, silo) after
function makeBarnFront(real) {
  const g = new THREE.Group(), red = clay(0xa8322a), white = clay(0xf6f1e7);
  const sh = new THREE.Shape(); sh.moveTo(-3, 0); sh.lineTo(3, 0); sh.lineTo(3, 3.6); sh.lineTo(1.6, 5.4); sh.lineTo(-1.6, 5.4); sh.lineTo(-3, 3.6); sh.closePath();
  const open = new THREE.Shape(); open.moveTo(-3, 0); open.lineTo(-1.1, 0); open.lineTo(-1.1, 2.7); open.lineTo(1.1, 2.7); open.lineTo(1.1, 0); open.lineTo(3, 0); open.lineTo(3, 3.6); open.lineTo(1.6, 5.4); open.lineTo(-1.6, 5.4); open.lineTo(-3, 3.6); open.closePath();   // (the real one has a doorway behind its door)
  const front = mesh(new THREE.ExtrudeGeometry(real ? open : sh, { depth: 0.14, bevelEnabled: false }), red); g.add(front);
  const door = new THREE.Group(); g.add(door); g.userData.door = door;
  const leaf = mesh(new THREE.BoxGeometry(2.2, 2.7, 0.06), clay(0x8a2a24)); leaf.position.set(0, 1.35, 0.2); door.add(leaf);
  for (const s of [-1, 1]) { const x = mesh(new THREE.BoxGeometry(0.12, 3.2, 0.03), white); x.position.set(0, 1.35, 0.25); x.rotation.z = s * 0.66; door.add(x); }
  for (const [x, y, w, h] of [[0, 2.85, 2.5, 0.16], [-1.2, 1.4, 0.12, 2.9], [1.2, 1.4, 0.12, 2.9]]) { const f = mesh(new THREE.BoxGeometry(w, h, 0.04), white); f.position.set(x, y, 0.16); g.add(f); }
  const loft = mesh(new THREE.BoxGeometry(1, 1, 0.06), white); loft.position.set(0, 4.1, 0.18); g.add(loft);
  if (real) {
    const inside = new THREE.Group(), outside = new THREE.Group(); inside.visible = outside.visible = false; g.add(inside, outside); g.userData.rest = [inside, outside];
    for (const x of [-2.93, 2.93]) { const w = mesh(new THREE.BoxGeometry(0.14, 3.6, 7.6), red); w.position.set(x, 1.8, -3.8); inside.add(w); }
    const loftFloor = mesh(new THREE.BoxGeometry(5.8, 0.12, 7.6), clay(0x6b4a33)); loftFloor.position.set(0, 3.55, -3.8); inside.add(loftFloor);   // (a ceiling, so it's dark and dry inside)
    const straw = mesh(new THREE.BoxGeometry(5.8, 0.04, 7.6), clay(0xd9b86a)); straw.position.set(0, 0.02, -3.8); inside.add(straw);
    for (const [x, z] of [[-1.9, -5.8], [-1.9, -4.4], [1.9, -6.2]]) { const b = mesh(new THREE.BoxGeometry(1.1, 0.7, 0.8), clay(0xe0c070)); b.position.set(x, 0.35, z); inside.add(b); }
    for (const s of [-1, 1]) { const r = mesh(new THREE.BoxGeometry(2.3, 0.18, 7.8), clay(0x5a5a62)); r.position.set(s * 2.2, 4.5, -3.8); r.rotation.z = -s * 0.9; outside.add(r); const r2 = mesh(new THREE.BoxGeometry(2, 0.18, 7.8), clay(0x5a5a62)); r2.position.set(s * 0.8, 5.35, -3.8); r2.rotation.z = -s * 0.35; outside.add(r2); }
    const gable = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }), red); gable.position.z = -7.7; inside.add(gable);
    const silo = mesh(new THREE.CylinderGeometry(1.2, 1.2, 7, 18), clay(0xd9d2c0)); silo.position.set(4.4, 3.5, -5); outside.add(silo);
    const dome = mesh(new THREE.SphereGeometry(1.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x8b909a)); dome.position.set(4.4, 7, -5); outside.add(dome);
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
  const real = barns[XS.indexOf(0)];
  for (const x of [-21.5, -13, -4.6, 4.6, 13, 21.5]) { const t = makeLollipop(0.9); t.position.set(x, 0, BARN_Z - 0.6); root.add(t); }
  const car = makeCar(0x5b7fa6); car.position.set(1.4, 0, ROAD_Z + 0.2); car.rotation.set(0, Math.PI / 2, 0.06); root.add(car);
  const cow = new THREE.Group(); const cb = mesh(new THREE.CapsuleGeometry(0.45, 1, 6, 12), clay(0xf6f1e7)); cb.rotation.x = Math.PI / 2; cb.position.y = 0.9; cow.add(cb);
  for (const [x, z] of [[0.2, 0.2], [-0.3, -0.3]]) { const sp = mesh(new THREE.SphereGeometry(0.28, 10, 8), clay(palette.ink)); sp.scale.set(1, 0.6, 1); sp.position.set(x, 1.1, z); cow.add(sp); }
  const ch = mesh(new THREE.SphereGeometry(0.3, 10, 8), clay(0xf6f1e7)); ch.position.set(0, 1.1, 0.9); cow.add(ch);
  for (const [x, z] of [[-0.25, -0.4], [0.25, -0.4], [-0.25, 0.4], [0.25, 0.4]]) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6), clay(0xf6f1e7)); l.position.set(x, 0.3, z); cow.add(l); }
  cow.position.set(1.6, 0, BARN_Z - 12.4); cow.rotation.y = 2.4; root.add(cow);
  const farmer = makePerson({ color: 0x3f5a8c, hat: true }); farmer.position.set(-3.8, 0, ROAD_Z + 2.4); farmer.rotation.y = 0.6; root.add(farmer);

  // ---- the storm: dark clouds on the horizon that roll in overhead, and rain (never inside the real barn)
  const stormM = new THREE.MeshStandardMaterial({ color: 0x6f7680, roughness: 1 });
  const storm = [...Array(9)].map((_, i) => {
    const c = new THREE.Group(); for (let j = 0; j < 5; j++) { const b = mesh(new THREE.SphereGeometry(2 + rnd() * 1.4, 14, 10), stormM); b.position.set((j - 2) * 2.2, rnd(), rnd() * 0.8); b.scale.y = 0.6; b.castShadow = false; c.add(b); }
    c.position.set(-46 - i * 7 + rnd() * 4, 10 + rnd() * 3, -34 + (i % 3) * 10); root.add(c); c.userData.to = -36 + i * 9; return c;
  });
  const DROPS = 2600, rainPos = new Float32Array(DROPS * 6);
  const drop = (i, y) => { const x = (rnd() - 0.5) * 70, z = BARN_Z - 15 + rnd() * 26; rainPos.set([x, y, z, x + 0.12, y + 0.7, z], i * 6); };
  for (let i = 0; i < DROPS; i++) drop(i, rnd() * 18);
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc6d2de, transparent: true, opacity: 0.7, depthWrite: false })); rain.frustumCulled = false; rain.visible = false; root.add(rain);
  const dry = (x, y, z) => S.inside && Math.abs(x) < 3.1 && z < BARN_Z + 0.2 && z > BARN_Z - 7.9 && y < 5.6;   // under the real barn's roof
  const SKY0 = new THREE.Color(0xdfe9ee), SKY1 = new THREE.Color(0x7d8792);

  // ---- the frog hops out through the door of the next façade (there's nothing behind it) and across the road
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);
  const cameo = frogCameo(frog, [{ at: [9, BARN_Z - 1.4] }, [9, BARN_Z + 0.4], [9.2, BARN_Z + 2], { face: [9, 10] }, { wait: 1.6 }, [9.4, BARN_Z + 3.8], [9.8, ROAD_Z], [10.2, ROAD_Z + 2.2], [10.8, ROAD_Z + 4]]);

  // ---- state
  const S = { phase: 'road', idle: 0, cam: 'road', storm: 0, door: 0, inside: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/fake-barns.json', 'Barn Façade County');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  let card;
  async function believe() {
    if (S.phase !== 'road') return;
    S.phase = 'believe'; player.enabled = false;
    S.cam = 'barn'; await voice.say('barn', { urgent: true }); S.cam = 'row'; await voice.say('same');
    card = beliefCard("That's a barn.", { reason: 'You had good reason to (you can see it plainly)' }); card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
    // then the storm breaks
    await ctx.wait(0.8); S.cam = 'road'; S.storm = 0.001; rain.visible = true;
    ctx.speak(farmer, 'Here it comes! I\'m off home.'); S.farmerOff = true;
    await voice.say('storm', { urgent: true }); S.phase = 'storm'; S.idle = 0; player.enabled = true;
  }
  // acting on it: you run for the barn, and it keeps the rain off
  async function shelter() {
    if (S.phase !== 'storm') return;
    S.phase = 'over'; S.inside = true; player.locked = true; S.door = 0.001; real.userData.rest[0].visible = true;   // (the inside, through the open door)
    const go = async (p) => { player.target = p; for (let i = 0; i < 30 && player.target; i++) await ctx.wait(0.15); };
    if (player.pos.z > ROAD_Z - 1) { const side = player.pos.x < car.position.x ? car.position.x - 2.9 : car.position.x + 2.9; await go(V(side, 0, player.pos.z)); await go(V(side, 0, ROAD_Z - 1.6)); }   // (round the car, not into it)
    await go(DOOR.clone());
    player.target = V(0, 0, BARN_Z - 2.6); for (let i = 0; i < 30 && player.target; i++) await ctx.wait(0.15);
    player.locked = false; player.enabled = false; player.obj.rotation.y = player.yaw = 0; S.cam = 'inside';
    await voice.say('dry', { urgent: true }); card.tick(1);
    // then, along the road, behind the row
    await ctx.wait(0.8); await ctx.flash(true); real.userData.rest[1].visible = true; S.cam = 'behind'; S.camT = 0; await ctx.flash(false); cameo.start(); await ctx.wait(1.2);   // (a cut, not a flight through the barns)
    await voice.say('facades');
    await ctx.wait(0.6); card.ask(); await voice.say('end');
    await ctx.wait(1.8);
    save.complete('fake-barns');
    ctx.gameOver({ title: 'You looked at the only real barn', text: 'You saw a barn, plainly, and when the storm came you ran into it and stayed dry. But every other barn on that road was a front on sticks, and from the road you couldn\'t have told. Did you know it was a barn?' });
  }
  interact.add({ pos: DOOR, radius: 1.5, height: 2.4, prompt: 'Run into the barn', terminal: true, enabled: () => S.phase === 'storm', onUse: shelter });
  interact.add({ pos: LOOK, radius: 2.2, height: 2.2, prompt: 'Look at the barn', terminal: true, enabled: () => S.phase === 'road', onUse: believe });   // (a wide spot, a step from where you stand)
  look(ctx, { pos: V(2.8, 0, ROAD_Z + 1.2), radius: 1.3, height: 2, prompt: 'Look at the tyre', lines: ['tyre'], enabled: () => S.phase === 'road' });
  talk(ctx, { who: farmer, enabled: () => S.phase === 'road' && !S.farmerOff, lines: ['Lot of barns round here.', 'Lot of barns, for not many cows.', 'Film people put some of them up, years back. Or was it the tax man?'] });

  (async () => { await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.5); await voice.say('flat'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 2.8, z: ROAD_Z + 1.6, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < 34 && z > BARN_Z + 0.8 && z < ROAD_Z + 3.4 || (S.inside && Math.abs(x) < 1.2 && z > BARN_Z - 3),
    blockers: () => [{ x: car.position.x, z: car.position.z, w: 3.6, d: 1.8 }, { x: farmer.position.x, z: farmer.position.z, r: 0.4 }, ...(S.inside ? [] : [{ x: 0, z: BARN_Z - 3.8, w: 6.2, d: 7.8 }])],
    update(dt, t) {
      if (!S.farmerOff) animatePerson(farmer, t, { energy: 0.3 });
      cow.userData.t = (cow.userData.t ?? 0) + dt; cow.children[3].position.y = 1.1 - Math.max(0, Math.sin(t * 0.7)) * 0.3;
      if (S.phase === 'road') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) believe();
      }
      if (S.phase === 'storm') {   // (stand about in the rain, and you run for it anyway)
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > RAIN_LIMIT) shelter();
      }
      // the storm: clouds creep up on the horizon, then roll in overhead; the sky and the light go grey; rain
      for (const c of storm) { c.position.x = S.storm > 0 ? lerp(c.position.x, c.userData.to, dt * 0.8) : c.position.x + dt * 0.25; if (S.storm > 0) c.position.y = lerp(c.position.y, 19, dt * 0.6); }   // (up out of the way of the shot from behind)
      if (S.storm > 0) {
        S.storm = Math.min(1, S.storm + dt * 0.6); const k = easeInOut(S.storm);
        stage.scene.background.copy(SKY0).lerp(SKY1, k); stage.scene.fog.color.copy(stage.scene.background);
        stage.sun.intensity = lerp(2.4, 0.5, k); stage.hemi.intensity = lerp(1.6, 0.95, k) + (S.storm < 1 && Math.sin(S.storm * 40) > 0.97 ? 1.2 : 0);
      }
      if (rain.visible) {
        for (let i = 0; i < DROPS; i++) {
          const o = i * 6; let y = rainPos[o + 1] - dt * 20, x = rainPos[o] - dt * 3;
          if (y < 0 || dry(x, y, rainPos[o + 2])) { drop(i, 16 + rnd() * 2); continue; }
          rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 3] = x + 0.12; rainPos[o + 4] = y + 0.7;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      // the farmer heads off home down the road; the big door slides open for you
      if (S.farmerOff && farmer.visible) { farmer.rotation.y = Math.PI / 2; farmer.position.x += dt * 3.4; animatePerson(farmer, t * 2, { energy: 1 }); if (farmer.position.x > 30) farmer.visible = false; }
      if (S.door > 0) { S.door = Math.min(1, S.door + dt * 1.2); barns[3].userData.door.position.x = easeInOut(S.door) * 2.3; }
      if (S.camT !== undefined) S.camT += dt;
      cameo.update(dt);
    },
    camera(pl) {
      if (S.cam === 'inside') return { pos: V(-3.2, 2.8, ROAD_Z + 5.2), look: V(0, 1.5, BARN_Z - 1.6), stiffness: 1.6 };   // from the road, through the rain, into the dry
      if (S.cam === 'row') return { pos: V(-1, 5.5, ROAD_Z + 22), look: V(0, 2.4, BARN_Z), stiffness: 1.2 };   // (and the row it stands in, all alike)
      if (S.cam === 'barn') return { pos: V(3.5, 5.5, ROAD_Z + 11), look: V(0, 2.2, BARN_Z), stiffness: 2 };   // (over the car, clear of the farmer)
      if (S.cam === 'behind') {
        // round behind the row: the fronts, and the sticks holding them up; the real one in the middle, whole
        const u = easeInOut(clamp(S.camT / 4));
        return { pos: V(lerp(-22, 16, u), 13, BARN_Z - 30), look: V(lerp(-12, 8, u), 1.4, BARN_Z + 1), stiffness: S.camT < 0.4 ? 60 : 1.6 };
      }
      const look = V(pl.pos.x * 0.7, 2, 0);
      return { pos: look.clone().add(V(0, 5, 14)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; },
  });
}
