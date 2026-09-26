// Vignette: The Stopped Clock (a Gettier case, from Russell).
// A small town on a still afternoon (Grant Wood's country, round hills behind), and you need to know the time. Look up
// at the town clock: two o'clock. It has always kept good time. The church bell strikes two: it is two o'clock. Then
// the afternoon goes by, and the clock doesn't move: it stopped at two yesterday, and you looked at it in the one minute
// of the day it was right. Or ask the postman, whose watch is going: two o'clock, and this time you knew.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeHouse, makeBench } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { canvasTexture } from '../core/brush.js';
import { makeCountry, makeLollipop } from '../core/grantwood.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOWER = V(0, 0, -6);
const FACE_Y = 6.4;
const CHURCH = V(9, 0, -9);
const IDLE_LIMIT = 60;

export default function stoppedClock(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xdfe9ee);
  stage.scene.fog = new THREE.Fog(0xdfe9ee, 50, 150);
  voice.load('stopped-clock');
  const rnd = seeded(1948);

  // ---- the square: pale paving, a town hall with a clock tower, houses, a church, lollipop trees; hills behind
  root.add(makeCountry({ seed: 7, depth: -16 }));
  const square = mesh(new THREE.BoxGeometry(30, 0.4, 20), clay(0xe6dcc8)); square.position.set(0, -0.2, -2); square.receiveShadow = true; root.add(square);
  const hall = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(7, 4, 4), clay(0xf6f1e7)); body.position.y = 2; hall.add(body);
  const tower = mesh(new THREE.BoxGeometry(2.4, 5, 2.4), clay(0xf6f1e7)); tower.position.set(0, 6.5, 0); hall.add(tower);
  const spire = mesh(new THREE.ConeGeometry(1.9, 2.6, 4), clay(0x5a5a62)); spire.position.set(0, 10.3, 0); spire.rotation.y = Math.PI / 4; hall.add(spire);
  const roof = mesh(new THREE.BoxGeometry(7.4, 0.3, 4.4), clay(0x5a5a62)); roof.position.y = 4.1; hall.add(roof);
  for (let i = 0; i < 4; i++) { const w = mesh(new THREE.BoxGeometry(0.7, 1.2, 0.06), clay(0x5b6f86)); w.position.set(-2.6 + i * 1.73, 2.4, 2.02); hall.add(w); }
  const hdoor = mesh(new THREE.BoxGeometry(1.1, 1.9, 0.06), clay(0x8a6a4a)); hdoor.position.set(0, 0.95, 2.03); hall.add(hdoor);
  hall.position.copy(TOWER); root.add(hall);
  const faceTex = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.fill(); g.strokeStyle = '#2b2a33'; g.lineWidth = 6; g.stroke();
    g.font = 'bold 28px Newsreader, serif'; g.fillStyle = '#2b2a33'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = (i / 12) * 6.28 - 1.57; g.fillText(n, 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); });
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), new THREE.MeshBasicMaterial({ map: faceTex })); face.position.copy(TOWER).add(V(0, FACE_Y, 1.25)); root.add(face);
  const hands = new THREE.Group(); hands.position.copy(face.position).add(V(0, 0, 0.02)); root.add(hands);
  const hourHand = mesh(new THREE.BoxGeometry(0.08, 0.45, 0.02), clay(palette.ink)); hourHand.geometry.translate(0, 0.22, 0); hands.add(hourHand);
  const minHand = mesh(new THREE.BoxGeometry(0.05, 0.72, 0.02), clay(palette.ink)); minHand.geometry.translate(0, 0.36, 0); hands.add(minHand);
  hourHand.rotation.z = -(2 / 12) * Math.PI * 2; minHand.rotation.z = 0;           // two o'clock, and there it stays
  // the church, with a bell that swings
  const church = new THREE.Group(); const nave = mesh(new THREE.BoxGeometry(4, 3.4, 6), clay(0xf6f1e7)); nave.position.y = 1.7; church.add(nave);
  const croof = mesh(new THREE.ConeGeometry(3.4, 2, 4), clay(0x5a5a62)); croof.position.y = 4.3; croof.rotation.y = Math.PI / 4; croof.scale.z = 1.5; church.add(croof);
  const belfry = mesh(new THREE.BoxGeometry(1.4, 2.4, 1.4), clay(0xf6f1e7)); belfry.position.set(0, 4.6, 2.4); church.add(belfry);
  const bell = mesh(new THREE.CylinderGeometry(0.25, 0.45, 0.6, 14), clay(0xc9a54c, { metalness: 0.6 })); bell.position.set(0, 4.8, 3.12); church.add(bell);
  const cspire = mesh(new THREE.ConeGeometry(0.9, 2.2, 4), clay(0x5a5a62)); cspire.position.set(0, 6.9, 2.4); cspire.rotation.y = Math.PI / 4; church.add(cspire);
  church.position.copy(CHURCH); church.rotation.y = -0.4; root.add(church);
  for (const [x, z, r] of [[-9, -6, 0.3], [-11, 1, -0.2], [11, 2, 0.4]]) { const h = makeHouse({ color: 0xf6f1e7, roof: 0x5a5a62 }); h.position.set(x, 0, z); h.rotation.y = r; root.add(h); }
  for (const [x, z] of [[-5, -3], [5, -3], [-6.5, 4], [6.5, 4]]) { const t = makeLollipop(0.9); t.position.set(x, 0, z); root.add(t); }
  const bench = makeBench(); bench.position.set(-3.4, 0, 2.6); root.add(bench);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: canvasTexture(256, 192, (g) => { g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#2b2a33'; g.font = '22px Newsreader, serif'; ['Market day, Saturday', 'Choir, Thursday at 7', 'LOST: one cat (grey)', 'Clock repairs, enquire', 'within'].forEach((l, i) => g.fillText(l, 16, 34 + i * 34)); }) }));
  board.position.set(3.6, 1.6, -3.8); root.add(board);
  const bpost = mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), clay(palette.wood)); bpost.position.set(3.6, 1.6, -3.85); root.add(bpost);
  const blegs = mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), clay(palette.wood)); blegs.position.set(3.6, 0.55, -3.85); root.add(blegs);
  // the postman, on his round, with a watch that goes
  const postman = makePerson({ color: 0x3f5a8c, hat: true }); postman.position.set(4.6, 0, 1.6); root.add(postman);
  const bag = mesh(new THREE.BoxGeometry(0.4, 0.45, 0.2), clay(0x8a6a4a)); bag.position.set(-0.38, 0.9, 0); postman.userData.body.add(bag);
  // clouds, to show the afternoon going by
  const clouds = root.children[0].children.filter((c) => c.children?.length === 5 && c.position.y > 10);

  // ---- the frog: while the afternoon passes, it's up on the clock, sitting on the minute hand, which doesn't move
  const frog = makeFrog({ scale: 0.42 }); root.add(frog);
  const onHand = face.position.clone().add(V(0.05, 0.5, 0.22));
  const cameo = frogCameo(frog, [{ at: [onHand.x, onHand.z], y: onHand.y }, { face: [0, 10] }, { wait: 4, act: (f, u) => (f.userData.body.rotation.z = Math.sin(u * 30) * 0.05) }, { at: [onHand.x + 0.9, onHand.z], y: FACE_Y - 1.4, height: 0.5 }, { warp: [30, 30], y: 0 }]);

  // ---- state
  const S = { phase: 'walk', idle: 0, ring: -1, lapse: -1, how: null };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/stopped-clock.json', 'The Stopped Clock');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  async function believe(how) {
    if (S.phase !== 'walk') return;
    S.phase = 'look'; S.how = how; player.enabled = false;
    const card = beliefCard("It's two o'clock.", { reason: how === 'clock' ? 'You had good reason to (it always keeps good time)' : 'You had good reason to (his watch is going)' });
    if (how === 'clock') { S.lookUp = true; await voice.say('reads', { urgent: true }); }
    else { ctx.speak(postman, 'Two o\'clock, near enough. Just gone.'); await ctx.wait(1.6); await voice.say('asked', { urgent: true }); }
    card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
    // the bell strikes two
    await ctx.wait(1); S.ring = 0; ctx.speak(bell, 'Dong.   Dong.', { offset: [0, 1.4, 0], secs: 3 }); await ctx.wait(2);
    await voice.say('true'); card.tick(1);
    // then the afternoon goes by
    await ctx.wait(0.8); S.lapse = 0; cameo.start(); await voice.say('wait'); await ctx.wait(5); S.lapse = -2;
    if (how === 'clock') { await voice.say('stopped'); card.ask(); await ctx.wait(0.6); await voice.say('end'); }
    else { await voice.say('stopped_2'); card.ask('This time, you knew.'); await ctx.wait(0.6); await voice.say('asked_end'); }
    await ctx.wait(1.8);
    save.complete('stopped-clock');
    ctx.gameOver(how === 'clock'
      ? { title: 'Right by accident', text: 'You believed it was two o\'clock, it was two o\'clock, and you had good reason: the clock always keeps good time. But it had stopped. You looked at it in the one minute of the day it was right.' }
      : { title: 'You asked someone who knew', text: 'His watch was going, and so was the time. You believed the same thing as you would have from the clock, and it was just as true. What made the difference?' });
  }
  interact.add({ pos: TOWER.clone().add(V(0, 0, 3.6)), radius: 1.6, height: 3, prompt: 'Look up at the clock', terminal: true, enabled: () => S.phase === 'walk', onUse: () => believe('clock') });
  interact.add({ pos: () => postman.position.clone().add(V(-0.4, 0, 1)), radius: 1.3, height: 2.4, prompt: 'Ask the postman the time', terminal: true, enabled: () => S.phase === 'walk', onUse: () => believe('postman') });
  look(ctx, { pos: V(3.6, 0, -2.6), radius: 1.2, height: 2.4, prompt: 'Read the notice board', lines: ['notice'], enabled: () => S.phase === 'walk' });
  look(ctx, { pos: V(-3.4, 0, 3.6), radius: 1.3, height: 1.6, prompt: 'Sit a moment', lines: ['bench'], enabled: () => S.phase === 'walk' });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 5.6, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < 13 && z > -3.6 && z < 7.4,
    blockers: () => [{ x: -3.4, z: 2.6, w: 2, d: 0.8 }, { x: 3.6, z: -3.85, w: 1.4, d: 0.3 }, { x: postman.position.x, z: postman.position.z, r: 0.4 },
      ...[[-5, -3], [5, -3], [-6.5, 4], [6.5, 4]].map(([x, z]) => ({ x, z, r: 0.35 }))],
    update(dt, t) {
      // the postman strolls back and forth along his round (and stops when you ask him)
      if (S.phase === 'walk') { postman.position.x = 4.6 + Math.sin(t * 0.25) * 2.4; postman.rotation.y = Math.cos(t * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2; animatePerson(postman, t * 2, { energy: 0.8 }); }
      else if (S.how === 'postman') postman.rotation.y = lerp(postman.rotation.y, Math.atan2(player.pos.x - postman.position.x, player.pos.z - postman.position.z), 0.1);
      if (S.ring >= 0) { S.ring += dt; bell.rotation.x = Math.sin(S.ring * 5) * 0.6 * Math.exp(-S.ring * 0.5); }
      // the afternoon: clouds race, the light swings round; the clock's hands stay where they are
      if (S.lapse >= 0) { S.lapse += dt; clouds.forEach((c, i) => (c.position.x += dt * (6 + i))); stage.sun.intensity = 2.4 - S.lapse * 0.12; stage.hemi.color.setHSL(0.08, 0.5, 0.9 - S.lapse * 0.02); }   // (the evening coming on)
      if (S.phase === 'walk') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) believe('clock');
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.lookUp || S.lapse !== -1) { const f = face.position; return { pos: f.clone().add(V(2, -2.6, 9)), look: f.clone().add(V(0, -1.2, 0)), stiffness: 2 }; }
      const look = V(pl.pos.x * 0.6, 2.4, -2);
      return { pos: look.clone().add(V(0, 5, 14)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); },
  });
}
