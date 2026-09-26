// Vignette: The Veil of Ignorance.
// A hilltop in the fog. You and four others, all grey and faceless, stand behind a great pale veil: nobody knows who
// they'll be when it lifts. On a table, three model towns. In the first, everyone has the same (5 each). In the second,
// most have little and one has a fortune (1, 2, 4, 12, 31: the richest on average). In the third, some have more than
// others, but even the least well off have more than anyone in the first (6, 6, 8, 10, 14). Choose one. The veil lifts,
// the town is built in the valley, the lamps pick out your house at random, and you walk down to it.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeIsland, makePerson, animatePerson, makeHouse, makeFrog, makeTable } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { textTexture } from '../core/props.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOWNS = [
  { id: 'equal', name: 'The first town', shares: [5, 5, 5, 5, 5] },
  { id: 'gamble', name: 'The second town', shares: [1, 2, 4, 12, 31] },
  { id: 'worst', name: 'The third town', shares: [6, 6, 8, 10, 14] },
];
const TABLE = V(0, 0, -0.6);
const VEIL_Z = -4.2;
const VALLEY = V(0, -3, -16);
const IDLE_LIMIT = 60;
const COLORS = [palette.many, palette.one, palette.judge, 0x6f9a4f];

// a house whose size says how much its family has
function makeHome(share) {
  const g = makeHouse({ color: 0xf2e6d4, roof: [0xc9705a, 0x5b7fa6, 0xe2a93b][share % 3] });
  g.scale.setScalar(0.45 + Math.sqrt(share / 31) * 1.25);
  if (share >= 12) { const wing = makeHouse({ color: 0xf2e6d4, roof: 0xc9705a }); wing.scale.setScalar(0.6); wing.position.set(2.2, 0, 0.3); g.add(wing); }
  if (share >= 31) { const tower = mesh(new THREE.CylinderGeometry(0.6, 0.7, 5, 12), clay(0xf2e6d4)); tower.position.set(-2, 2.5, -0.5); g.add(tower); const cap = mesh(new THREE.ConeGeometry(0.9, 1.4, 12), clay(0xe2a93b)); cap.position.set(-2, 5.7, -0.5); g.add(cap); }
  return g;
}

export default function veilOfIgnorance(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  const fogCol = new THREE.Color(0xe6e6e2);
  stage.scene.background = fogCol.clone();
  stage.scene.fog = new THREE.Fog(0xe6e6e2, 8, 26);
  voice.load('veil-of-ignorance');
  const frame = makeFramer(stage);
  const rnd = seeded(1971);

  // ---- the hilltop, and the valley below it (hidden in the fog until the veil lifts)
  const hill = makeIsland({ radius: 9, seed: 4, color: 0xb8c4a8, decor: false }); root.add(hill);
  const valley = makeIsland({ radius: 20, seed: 8, color: 0xa9c48e, decor: false }); valley.position.copy(VALLEY); root.add(valley);
  for (let i = 0; i < 9; i++) { const t = mesh(new THREE.IcosahedronGeometry(1.2, 1), clay(0x7fa37a, { flatShading: true })); t.position.copy(VALLEY).add(V(-14 + i * 3.5, 1.6, -6 - (i % 2) * 2)); root.add(t); }
  const slope = mesh(new THREE.BoxGeometry(3, 0.4, 9), clay(0xb8c4a8)); slope.position.set(0, -1.5, -8.6); slope.rotation.x = -0.33; root.add(slope);
  // the veil: a long pale cloth between poles, across the brow of the hill
  const veilGeo = new THREE.PlaneGeometry(16, 5, 30, 10);
  const veil = new THREE.Mesh(veilGeo, new THREE.MeshStandardMaterial({ color: 0xfbfaf6, transparent: true, opacity: 0.86, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
  veil.position.set(0, 2.5, VEIL_Z); root.add(veil);
  const veilBase = veilGeo.attributes.position.array.slice();
  for (const x of [-8, -2.7, 2.7, 8]) { const p = mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.4, 6), clay(palette.wood)); p.position.set(x, 2.7, VEIL_Z - 0.1); root.add(p); }
  const bar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 16.4, 6), clay(palette.wood)); bar.rotation.z = Math.PI / 2; bar.position.set(0, 5.2, VEIL_Z - 0.1); root.add(bar);

  // ---- the table and its three model towns
  const table = makeTable({ w: 7.6, d: 1.6, h: 1, color: 0x8a7a66 }); table.position.copy(TABLE); root.add(table);
  const models = TOWNS.map((town, k) => {
    const g = new THREE.Group(); g.position.copy(TABLE).add(V(-2.6 + k * 2.6, 1.14, 0));
    const base = mesh(new THREE.BoxGeometry(2.2, 0.06, 1.2), clay(0xa9c48e)); g.add(base);
    town.shares.forEach((s, i) => { const h = makeHome(s); h.scale.multiplyScalar(0.16); h.position.set(-0.85 + i * 0.42, 0.03, 0); g.add(h); });
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.34), new THREE.MeshBasicMaterial({ map: textTexture(town.shares.join('   '), { w: 320, h: 68, font: '600 34px Figtree, sans-serif', bg: '#fbf6ea' }) }));
    plaque.position.set(0, -0.2, 0.62); plaque.rotation.x = -0.25; g.add(plaque);
    root.add(g); return g;
  });

  // ---- you and the four others, grey and faceless behind the veil
  const others = [[-3.4, 2], [-1.6, 2.8], [1.8, 2.8], [3.6, 2]].map(([x, z], i) => {
    const p = makePerson({ color: 0xb8b8b4 }); p.position.set(x, 0, z); p.rotation.y = Math.atan2(TABLE.x - x, TABLE.z - z);
    p.userData.body.children.forEach((c) => { if (c.geometry?.parameters?.radius === 0.045) c.visible = false; });   // no faces, yet
    root.add(p); p.userData.color = COLORS[i]; return p;
  });

  // ---- the town in the valley (built when the veil lifts), and a lamp over each house
  const town = new THREE.Group(); town.position.copy(VALLEY); root.add(town);
  const HOUSE_X = [-12, -7.5, -3, 2.5, 10.5];            // (more room at the rich end)
  const homes = [], lamps = [];

  // ---- the frog, grey in the fog: it hops out from under the veil onto the table, sits on the biggest model house, and
  // hops off again
  const frog = makeFrog({ scale: 0.35 }); root.add(frog);
  const big = models[1].position.clone().add(V(0.83, 0, 0));
  const cameo = frogCameo(frog, [[5, VEIL_Z + 0.5], [4.4, -2.4], { at: [3.6, -1.6], height: 0.6 }, { at: [big.x, big.z], y: 1.55, height: 1.2 }, { face: [0, 6] },
    { wait: 2.6, act: (f, u) => (f.userData.body.rotation.z = Math.sin(u * 14) * 0.12 * Math.sin(Math.PI * u)) }, { at: [2, 0.8], y: 0, height: 1.2 }, [3.4, 1.8], [5.2, 2.6]]);

  // ---- state
  const S = { phase: 'intro', idle: 0, town: null, lot: -1, lift: 0, pick: -1, pickT: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/veil-of-ignorance.json', 'The Veil of Ignorance');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  async function choose(k, byOthers) {
    if (S.phase !== 'choose') return;
    S.phase = 'lifting'; S.town = k; player.enabled = false;
    const tn = TOWNS[k];
    await voice.say(byOthers ? 'others_chose' : 'chosen', { urgent: true });
    // the veil lifts, the fog thins, and the town is built in the valley
    S.lift = 0.001;
    tn.shares.forEach((s, i) => { const h = makeHome(s); h.position.set(HOUSE_X[i], 0, 0); h.scale.multiplyScalar(0.001); h.userData.target = h.scale.x * 1000; town.add(h); homes.push(h);
      const l = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ color: 0xcfd6c8 })); l.rotation.x = -Math.PI / 2; l.position.set(HOUSE_X[i], 0.05, 2.8); town.add(l); lamps.push(l); });   // a pool of light at each door
    others.forEach((p) => { p.traverse((c) => { if (c.material && c.geometry?.parameters?.radius !== 0.32) { c.material = clay(p.userData.color); } if (c.geometry?.parameters?.radius === 0.045) { c.visible = true; c.material = clay(palette.ink); } }); });
    await ctx.wait(4.5);
    // the lamps pick out your house: honestly at random
    S.lot = Math.floor(Math.random() * 5); S.pickT = 0; S.phase = 'picking';
    await ctx.wait(4.6);
    // everyone walks down to their house; you to yours
    const rest = [0, 1, 2, 3, 4].filter((i) => i !== S.lot);
    others.forEach((p, i) => (p.userData.goal = town.position.clone().add(V(HOUSE_X[rest[i]], 0, 2.8))));
    S.phase = 'walking'; player.locked = true; player.enabled = true; player.target = V(0, 0, -6.2);
    await ctx.wait(3); S.down = true;
    const share = tn.shares[S.lot], sorted = [...tn.shares].sort((a, b) => a - b), rank = sorted.indexOf(share);
    const line = tn.id === 'equal' ? 'eq_1' : tn.id === 'gamble' ? (share === 31 ? 'g_rich' : share >= 12 ? 'g_mid' : 'g_poor') : (rank <= 1 ? 'r_low' : 'r_mid');
    await voice.say(line); await ctx.wait(0.8); await voice.say(tn.id === 'equal' ? 'eq_2' : tn.id === 'gamble' ? 'g_2' : 'r_2'); await ctx.wait(1.6);
    save.complete('veil-of-ignorance');
    const lot = `You landed in the house with ${share}.`;
    ctx.gameOver(byOthers ? { title: 'The others chose for you', text: `You didn't choose, so the others did: the second town, the gamble. ${lot} Leaving it to others is a choice about who you might be, too.` }
      : tn.id === 'equal' ? { title: 'You chose equal shares', text: `${lot} So did everyone. Nobody was left with less, and nobody could have more. Is that the fairest town, or only the most equal one?` }
      : tn.id === 'gamble' ? { title: 'You took the gamble', text: `${lot} On average, the second town is the richest, and if you'd take the average of all your possible lives, it was the best bet. But you only get the one life.` }
      : { title: 'You looked after the worst-off', text: `${lot} You chose the town where the worst place to land was as good as it could be. Some houses had more than others; even the smallest had more than anyone in the equal town.` });
  }
  models.forEach((m, k) => interact.add({ pos: m.position.clone().setY(0).add(V(0, 0, 1.3)), radius: 1.1, height: 2.2, prompt: 'Choose this town', terminal: true, enabled: () => S.phase === 'choose', onUse: () => choose(k) }));

  // asides: each town, and the others
  models.forEach((m, k) => look(ctx, { pos: m.position.clone().setY(0).add(V(0.9, 0, 1.3)), radius: 0.8, height: 2.2, prompt: 'Look closely', lines: ['town_' + (k + 1)], enabled: () => S.phase === 'intro' || S.phase === 'choose' }));
  others.forEach((p, k) => talk(ctx, { who: p, enabled: () => S.phase === 'choose' || S.phase === 'intro', lines: [
    ['I might be the one in the big house.', 'Or not.'], ['What if I am ill? What if I am old?', 'I would like to be sure of something.'],
    ["I don't mind taking a chance.", 'Somebody has to live in the big house.'], ['I don\'t know what I will want, on the other side.', 'Do you?']][k] }));

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('veil'); await ctx.wait(0.6); await voice.say('towns');
    await ctx.wait(0.8); await voice.say('ask'); S.phase = 'choose'; S.idle = 0; cameo.start();
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 3.4, rotY: Math.PI },
    walkable: (x, z) => (S.down ? true : Math.hypot(x, z) < 8.4 && z > VEIL_Z + 0.6),
    blockers: () => [{ x: TABLE.x, z: TABLE.z, w: 7.7, d: 1.7 }, ...others.map((p) => ({ x: p.position.x, z: p.position.z, r: 0.4 }))],
    update(dt, t) {
      // the veil moves in the wind; when it lifts, it rises away and the fog thins
      const va = veilGeo.attributes.position;
      for (let i = 0; i < va.count; i++) { const x = veilBase[i * 3], y = veilBase[i * 3 + 1]; va.setZ(i, Math.sin(t * 1.3 + x * 0.6 + y * 0.8) * 0.18 * (0.6 - y / 5)); }
      va.needsUpdate = true;
      if (S.lift > 0) {
        S.lift = Math.min(1, S.lift + dt * 0.3); const u = easeInOut(S.lift);
        veil.position.y = 2.5 + u * 12; veil.material.opacity = 0.86 * (1 - u);
        stage.scene.fog.near = lerp(8, 30, u); stage.scene.fog.far = lerp(26, 120, u);
        stage.scene.background.copy(fogCol).lerp(new THREE.Color(palette.sky), u); stage.scene.fog.color.copy(stage.scene.background);
        homes.forEach((h, i) => h.scale.setScalar(Math.max(0.001, h.userData.target * easeInOut(clamp(S.lift * 1.6 - i * 0.1)))));
      }
      // the lamps run round, slow down, and stop over your house
      if (S.phase === 'picking' || S.phase === 'walking') {
        S.pickT += dt;
        const steps = 5 * 3 + S.lot, k = S.pickT < 4 ? Math.floor(steps * (1 - Math.pow(1 - S.pickT / 4, 2.2))) : steps;
        lamps.forEach((l, i) => l.material.color.set(i === k % 5 ? 0x3f8f86 : 0xcfd6c8));
        if (S.pickT >= 4 && !S.pickedAt) { S.pickedAt = t; player.target = null; }
      }
      if (S.down && S.lot >= 0) { player.target = town.position.clone().add(V(HOUSE_X[S.lot], 0, 2.8)); }
      others.forEach((p, i) => {
        if (p.userData.goal) { const d = p.userData.goal.clone().sub(p.position).setY(0); if (d.length() > 0.2) { p.position.addScaledVector(d.normalize(), dt * 3.4); p.rotation.y = Math.atan2(d.x, d.z); } }
        p.position.y = S.down ? lerp(p.position.y, VALLEY.y, 0.05) : 0;
        animatePerson(p, t, { phase: i, energy: 0.3 });
      });
      if (S.down) player.pos.y = lerp(player.pos.y, VALLEY.y, 0.05);
      if (S.phase === 'choose') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) choose(1, true);
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.lift > 0) return { ...frame([pl.pos.clone(), TABLE.clone(), town.position.clone().add(V(-13.5, 0, 0)), town.position.clone().add(V(14, 7, 0))], { min: 16, max: 60 }), stiffness: 1.2 };
      return { ...frame([pl.pos.clone(), TABLE.clone().add(V(-4, 0, 0)), TABLE.clone().add(V(4, 0, 0)), V(0, 3, VEIL_Z)], { min: 12, max: 30 }), stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; player.pos.y = 0; },
  });
}
