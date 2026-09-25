// Vignette: The Utility Monster.
// A village feast; you're serving. One cake, eight slices, six villagers and, at the head of the table, a monster that
// gets a hundred times more joy from each slice than anyone else. A meter adds up everyone's happiness. Carry the slices
// to whoever you like. When the cake is gone, it ends.
import {
  THREE, palette, clamp, lerp, easeOut, seeded, clay, mesh, makeIsland, makePerson, animatePerson, makeTable, makeTree, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAKE = V(-6.6, 0, 0.2), METER = V(0.5, 0, -4.8), MONSTER = V(6.4, 0, 0);
const SLICES = 8, JOY = { villager: 1, monster: 100 };

function makeMonster() {
  const g = new THREE.Group(), body = new THREE.Group();
  const fur = clay(0x8a6bb0, { roughness: 1 });
  const blob = mesh(new THREE.SphereGeometry(1.5, 32, 20), fur); blob.scale.set(1, 1.1, 0.95); blob.position.y = 1.6; body.add(blob);
  for (let i = 0; i < 14; i++) { const tuft = mesh(new THREE.ConeGeometry(0.2, 0.5, 6), fur); const a = (i / 14) * Math.PI * 2; tuft.position.set(Math.cos(a) * 0.9, 3.1 + Math.sin(i * 1.7) * 0.1, Math.sin(a) * 0.9); tuft.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); body.add(tuft); }
  for (const [x, y, s] of [[-0.5, 2.3, 0.26], [0.5, 2.3, 0.26], [0, 2.7, 0.2]]) { const e = mesh(new THREE.SphereGeometry(s, 16, 12), clay(0xfbf6ea)); e.position.set(x, y, 1.25); body.add(e); const p = mesh(new THREE.SphereGeometry(s * 0.45, 10, 8), clay(0x111111)); p.position.set(x, y, 1.25 + s * 0.8); body.add(p); }
  const mouth = mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clay(0x5a1f2e)); mouth.scale.set(1.2, 0.6, 0.6); mouth.position.set(0, 1.7, 1.2); body.add(mouth);
  const bib = mesh(new THREE.CircleGeometry(0.6, 20), clay(0xfbf6ea)); bib.position.set(0, 1.2, 1.4); body.add(bib);
  for (const s of [-1, 1]) { const arm = mesh(new THREE.CapsuleGeometry(0.2, 0.6, 6, 10), fur); arm.position.set(1.4 * s, 1.5, 0.5); arm.rotation.z = s * 0.9; body.add(arm); }
  g.add(body); g.userData.body = body; g.userData.mouth = mouth;
  return g;
}

export default function utilityMonster(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 60, 160);
  voice.load('utility-monster');
  const frame = makeFramer(stage);
  const rnd = seeded(74);

  root.add(makeIsland({ radius: 18, seed: 41, decor: false }));
  for (let i = 0; i < 8; i++) { const t = makeTree(0.9 + rnd() * 0.6, rnd); const a = rnd() * 6.28, r = 12 + rnd() * 4; t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 3); root.add(t); }
  // bunting over the table
  for (let i = 0; i < 16; i++) { const f = mesh(new THREE.ConeGeometry(0.18, 0.4, 3), clay([0xe0674f, 0xf2c14e, 0x3f8f86, 0x5b7fa6][i % 4])); f.rotation.x = Math.PI; f.position.set(-7 + i * 0.95, 4 - Math.sin((i / 15) * Math.PI) * 0.6, -2.2); root.add(f); }
  const table = makeTable({ w: 10, d: 2.2, h: 1, color: palette.wood }); table.position.set(0, 0, 0); root.add(table);
  const cloth = mesh(new THREE.BoxGeometry(10.2, 0.04, 2.4), clay(0xfbf6ea)); cloth.position.set(0, 1.13, 0); root.add(cloth);

  // the diners: six villagers along the sides, the monster at the head
  const seats = [];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1, x = -3 + (i % 3) * 3;
    const p = makePerson({ color: [0x5b7fa6, 0xe2a93b, 0x7a5a8c, 0xc9705a, 0x6f9a4f, 0x8b909a][i] }); p.position.set(x, 0, side * 1.7); p.rotation.y = side < 0 ? 0 : Math.PI; p.userData.body.position.y = -0.3; root.add(p);
    const plate = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), clay(0xffffff)); plate.position.set(x, 1.17, side * 0.65); root.add(plate);
    seats.push({ who: p, kind: 'villager', plate, served: 0, name: i });
  }
  const monster = makeMonster(); monster.position.copy(MONSTER); monster.rotation.y = -Math.PI / 2; root.add(monster);
  const mplate = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 24), clay(0xffffff)); mplate.position.set(4.3, 1.17, 0); root.add(mplate);
  seats.push({ who: monster, kind: 'monster', plate: mplate, served: 0 });

  // the cake: eight slices on a stand at the other end
  const stand = mesh(new THREE.CylinderGeometry(0.5, 0.25, 1.1, 20), clay(0xf6f0e2)); stand.position.copy(CAKE).setY(0.55); root.add(stand);
  const sliceGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.42, 12, 1, false, 0, (Math.PI * 2) / SLICES);
  const slices = Array.from({ length: SLICES }, (_, i) => { const s = mesh(sliceGeo, clay(0xf2a38f)); s.position.copy(CAKE).setY(1.32); s.rotation.y = (i / SLICES) * Math.PI * 2; root.add(s); return s; });
  const carried = mesh(sliceGeo, clay(0xf2a38f)); carried.position.set(0, 2.4, 0); carried.visible = false; player.obj.add(carried);
  const served = [];                                 // slices sitting on plates

  // the happiness meter
  const meter = new THREE.Group();
  const post = mesh(new THREE.BoxGeometry(0.9, 4.6, 0.3), clay(0x2b2a33)); post.position.y = 2.3; meter.add(post);
  const fillMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xf2a33b, emissiveIntensity: 0.4 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.32), fillMat); fill.geometry.translate(0, 0.5, 0); fill.position.y = 0.3; fill.scale.y = 0.01; meter.add(fill);
  const heart = mesh(new THREE.SphereGeometry(0.3, 16, 12), clay(0xe8435a)); heart.position.y = 4.9; meter.add(heart);
  meter.position.copy(METER); root.add(meter);

  // hearts that pop up from whoever is served
  const hearts = [];
  const pop = (at, n) => { for (let i = 0; i < n; i++) { const h = mesh(new THREE.SphereGeometry(0.09 + (n > 10 ? 0.05 : 0), 8, 6), clay(0xe8435a)); h.position.copy(at); root.add(h); hearts.push({ h, v: V((Math.random() - 0.5) * (n > 10 ? 4 : 1), 2 + Math.random() * (n > 10 ? 4 : 1), (Math.random() - 0.5) * (n > 10 ? 4 : 1)), t: 0 }); } };

  // ---- the frog climbs onto the table and sits on an empty plate, as if waiting to be served; then gives up
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const cameo = frogCameo(frog, [[-2, 6], [-1.2, 4.4], [-0.4, 3], { at: [0.3, 1.7], height: 1 }, { at: [0.2, 0.7], y: 1.2, height: 1 }, { at: [0, 0.65], y: 1.2 }, { face: [0, 5] },
    { wait: 2.8, act: (f, u) => (f.userData.body.rotation.x = u > 0.7 ? -0.2 : 0) }, { at: [1.2, 1.9], y: 0, height: 1.2 }, [2.2, 3.4], [3.2, 5], [4.2, 6.6]]);

  // ---- state
  const S = { phase: 'intro', left: SLICES, carrying: false, total: 0, shown: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/utility-monster.json', 'The Utility Monster');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: CAKE.clone().add(V(1.2, 0, 0)), radius: 1.6, height: 2, prompt: 'Take a slice', enabled: () => S.phase === 'serve' && !S.carrying && S.left > 0,
    onUse: () => { S.carrying = true; carried.visible = true; slices[SLICES - S.left].visible = false; S.left--; } });
  for (const seat of seats) {
    const at = seat.kind === 'monster' ? V(5.4, 0, 2.6) : V(seat.who.position.x, 0, seat.who.position.z + Math.sign(seat.who.position.z) * 0.9);
    interact.add({ pos: at, radius: seat.kind === 'monster' ? 1.8 : 1.2, height: seat.kind === 'monster' ? 3.6 : 2.2, prompt: seat.kind === 'monster' ? 'Give it to the monster' : 'Give them the slice', enabled: () => S.phase === 'serve' && S.carrying,
      onUse: () => serve(seat) });
  }
  async function serve(seat) {
    S.carrying = false; carried.visible = false; seat.served++;
    const s = mesh(sliceGeo, clay(0xf2a38f)); s.scale.setScalar(0.6); s.position.copy(seat.plate.position).add(V(0, 0.14, 0)); root.add(s); served.push(s);
    S.total += JOY[seat.kind];
    pop(seat.who.position.clone().add(V(0, seat.kind === 'monster' ? 3.4 : 2.2, 0)), seat.kind === 'monster' ? 40 : 3);
    if (seat.kind === 'monster') { S.chomp = 1.2; ctx.speak(monster, ['OH! OH, THANK YOU!', 'THE BEST THING THAT HAS EVER HAPPENED!', 'MORE? IS THERE MORE?'][Math.min(seat.served - 1, 2)], { offset: [0, 4.2, 0] }); voice.say('first_monster'); }
    else { ctx.speak(seat.who, ['Thank you!', 'Lovely.', 'Oh, how kind.'][seat.served % 3]); voice.say('first_villager'); }
    const mon = seats[6].served, fed = seats.slice(0, 6).filter((v) => v.served > 0).length;
    if (mon >= 3 && fed === 0) voice.say('hungry');
    if (S.left === 0) {
      S.phase = 'over'; await ctx.wait(2.5);
      const kind = mon === SLICES ? 'monster' : fed === 6 ? 'shared' : 'mixed';
      await voice.say('end_' + kind); await ctx.wait(0.4); await voice.say('end'); await ctx.wait(1);
      save.complete('utility-monster');
      ctx.gameOver({
        title: kind === 'monster' ? 'You fed the monster' : kind === 'shared' ? 'You shared the cake' : 'You split it your own way',
        text: `The meter reached ${S.total.toLocaleString('en-GB')}. The monster had ${mon} slice${mon === 1 ? '' : 's'}; ${fed} of the six villagers had some. Adding up happiness says give it all to the monster. Most people feel something went wrong in the adding.`,
      });
    }
  }
  const villagerLines = [['I have been looking forward to this all week.', 'Is that raspberry?'], ['Do not mind me.', 'It does look hungry, bless it.'], ['Last year it ate the whole thing.', 'I suppose it does enjoy it more.'], ['Smells wonderful.', 'Just a small slice would do.'], ['My grandmother baked it.', 'Save a bit for the children?'], ['I am not hungry. Well. A little.', 'Fair is fair, surely?']];
  seats.slice(0, 6).forEach((seat, k) => talk(ctx, { who: seat.who, radius: 1.3, offset: [0, 2.8, 0], enabled: () => S.phase === 'serve' && !S.carrying, lines: (i) => (seat.served ? 'That was delicious.' : villagerLines[k][i % 2]) }));
  talk(ctx, { who: monster, radius: 2, offset: [0, 4.2, 0], enabled: () => S.phase === 'serve' && !S.carrying, lines: ['CAKE?', 'YOU ARE MY FAVOURITE PERSON.', 'I COULD EAT ALL OF IT. I WOULD BE SO VERY HAPPY.', 'NOBODY ENJOYS CAKE LIKE I DO.'] });
  look(ctx, { pos: METER.clone().add(V(0, 0, 1.4)), radius: 1.6, height: 5.4, prompt: 'Look at the meter', lines: ['meter_2'], enabled: () => S.phase === 'serve' });

  (async () => {
    await ctx.wait(0.9); await voice.say('arrive'); await voice.say('monster'); await ctx.wait(0.4); await voice.say('meter'); await voice.say('ask');
    S.phase = 'serve';
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -6.6, z: 3.2, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z * 1.3) < 15,
    blockers: () => [...[-4, -2, 0, 2, 4].map((x) => ({ x, z: 0, r: 1.25 })), ...seats.slice(0, 6).map((s) => ({ x: s.who.position.x, z: s.who.position.z, r: 0.35 })), { x: MONSTER.x, z: MONSTER.z, r: 1.6 }, { x: CAKE.x, z: CAKE.z, r: 0.7 }, { x: METER.x, z: METER.z, r: 0.6 }],
    update(dt, t) {
      // the meter fills (on a log scale, so the monster's slices tower over everyone else's)
      S.shown = lerp(S.shown, S.total, 1 - Math.exp(-dt * 3));
      fill.scale.y = Math.max(0.01, (Math.log10(1 + S.shown) / Math.log10(1 + SLICES * 100)) * 4);
      ctx.ui.label('meter', 1, `♥ ${Math.round(S.shown).toLocaleString('en-GB')}`, METER.clone().add(V(0, 5.6, 0)));
      // monster chomps and wobbles; villagers idle
      S.chomp = Math.max(0, (S.chomp ?? 0) - dt);
      monster.userData.mouth.scale.y = 0.6 + (S.chomp > 0 ? Math.abs(Math.sin(t * 16)) * 0.5 : 0);
      monster.userData.body.rotation.z = Math.sin(t * 1.3) * 0.04 + (S.chomp > 0 ? Math.sin(t * 20) * 0.05 : 0);
      seats.slice(0, 6).forEach((s, i) => { animatePerson(s.who, t, { phase: i, energy: 0.35 }); s.who.userData.body.position.y -= 0.3; });
      for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i]; h.t += dt; h.h.position.addScaledVector(h.v, dt); h.v.y -= dt * 2; h.h.scale.setScalar(Math.max(0.01, 1 - h.t / 1.6)); if (h.t > 1.6) { root.remove(h.h); hearts.splice(i, 1); } }
      if (S.phase === 'serve') cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      const pts = [pl.pos.clone(), CAKE.clone().add(V(0, 1.5, 0)), MONSTER.clone().add(V(0, 3.4, 0)), METER.clone().add(V(0, 5.2, 0)), V(0, 1, 2.4)];
      return { ...frame(pts, { min: 14, max: 36 }), stiffness: 2.2 };
    },
    dispose() { voice.stop(); player.obj.remove(carried); },
  });
}
