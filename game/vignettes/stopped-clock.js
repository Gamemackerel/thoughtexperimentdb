// Vignette: The Stopped Clock (a Gettier case, from Russell).
// A small town on a still afternoon (Grant Wood's country, round hills behind), and you've a train to catch at a
// quarter past two. Look up at the town clock: two o'clock. It has always kept good time. So you hurry to the station,
// and make the train, with the station clock at a quarter past on the dot. Then an evening, a night and a morning go by
// over the square, and the town clock's hands never move: it had stopped at two, and you looked at it in one of the two
// minutes a day it's right. (One path; the act is catching the train.)
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeHouse, makeBench } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { canvasTexture } from '../core/brush.js';
import { textTexture } from '../core/props.js';
import { makeCountry, makeLollipop } from '../core/grantwood.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOWER = V(0, 0, -6);
const FACE_Y = 6.4;
const CHURCH = V(9, 0, -9);
const SIGN = V(9.2, 0, 5.2);              // the way to the station
const STATION = V(90, 0, 0);              // somewhere else entirely: you get there by a cut
const IDLE_LIMIT = 60, GO_LIMIT = 30;
const DAY = 16;                           // seconds for the evening, the night and the morning

// sky keyframes through the night: [when (0..1), sky colour, sun, hemi light, dark (0 day .. 1 night)]
const SKY = [[0, 0xdfe9ee, 2.4, 1.6, 0], [0.13, 0xe9a878, 1.3, 1.1, 0.3], [0.26, 0x1c2340, 0.08, 0.4, 1], [0.66, 0x1c2340, 0.08, 0.4, 1], [0.8, 0xe8b4a0, 1.1, 1, 0.35], [0.92, 0xdfe9ee, 2.4, 1.6, 0], [1, 0xdfe9ee, 2.4, 1.6, 0]];
const skyAt = (u) => {
  let i = 0; while (i < SKY.length - 2 && SKY[i + 1][0] <= u) i++;
  const a = SKY[i], b = SKY[i + 1], k = easeInOut(clamp((u - a[0]) / (b[0] - a[0])));
  return { color: new THREE.Color(a[1]).lerp(new THREE.Color(b[1]), k), sun: lerp(a[2], b[2], k), hemi: lerp(a[3], b[3], k), dark: lerp(a[4], b[4], k) };
};

// a little steam train: an engine and two carriages, facing +x
function makeTrain() {
  const g = new THREE.Group(), ink = clay(palette.ink), green = clay(0x3f6a35), roof = clay(0x5a5a62), glass = clay(palette.glass, { roughness: 0.3 });
  const boiler = mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.6, 16), ink); boiler.rotation.z = Math.PI / 2; boiler.position.set(5.4, 1.3, 0); g.add(boiler);
  const cab = mesh(new THREE.BoxGeometry(1.3, 1.9, 1.5), ink); cab.position.set(3.6, 1.55, 0); g.add(cab);
  const chimney = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.8, 10), ink); chimney.position.set(6.2, 2.2, 0); g.add(chimney);
  const band = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.12, 16), clay(0xc9a54c, { metalness: 0.5 })); band.rotation.z = Math.PI / 2; band.position.set(4.8, 1.3, 0); g.add(band);
  for (const x of [-4.6, -0.6]) {
    const c = mesh(new THREE.BoxGeometry(3.6, 1.6, 1.5), green); c.position.set(x, 1.3, 0); g.add(c);
    const r = mesh(new THREE.BoxGeometry(3.8, 0.16, 1.7), roof); r.position.set(x, 2.18, 0); g.add(r);
    for (let i = 0; i < 3; i++) { const w = mesh(new THREE.BoxGeometry(0.7, 0.5, 0.04), glass); w.position.set(x - 1.1 + i * 1.1, 1.55, 0.76); g.add(w); }
  }
  for (const x of [-5.8, -3.4, -1.8, 0.6, 3.4, 4.6, 6]) for (const z of [-0.6, 0.6]) { const wh = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 14), ink); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.38, z); g.add(wh); }
  return g;
}

// a clock face (Roman numerals) with an hour, a minute and (optionally) a second hand; returns { face, hour, min, sec }
function makeClockFace(r, withSeconds) {
  const tex = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.fill(); g.strokeStyle = '#2b2a33'; g.lineWidth = 6; g.stroke();
    g.font = 'bold 28px Newsreader, serif'; g.fillStyle = '#2b2a33'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((n, i) => { const a = (i / 12) * 6.28 - 1.57; g.fillText(n, 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); });
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ map: tex }));
  const hand = (w, l, color) => { const h = mesh(new THREE.BoxGeometry(w * r, l * r, 0.02), clay(color)); h.geometry.translate(0, (l * r) / 2 - 0.04 * r, 0); h.position.z = 0.02; face.add(h); return h; };
  const hour = hand(0.085, 0.47, palette.ink), min = hand(0.055, 0.76, palette.ink), sec = withSeconds ? hand(0.02, 0.8, 0xc0182a) : null;
  if (sec) sec.position.z = 0.03;
  return { face, hour, min, sec };
}
const setTime = (c, h, m) => { c.hour.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; c.min.rotation.z = -(m / 60) * Math.PI * 2; };

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
  const town = makeClockFace(0.95, false); const face = town.face; face.position.copy(TOWER).add(V(0, FACE_Y, 1.25)); root.add(face);
  setTime(town, 2, 0);                                                             // two o'clock, and there it stays
  // windows that light up at night (on the town hall and the houses)
  const glow = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, fog: false });
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.1), glow); w.position.copy(TOWER).add(V(-2.6 + i * 1.73, 2.4, 2.07)); root.add(w); }
  // the church
  const church = new THREE.Group(); const nave = mesh(new THREE.BoxGeometry(4, 3.4, 6), clay(0xf6f1e7)); nave.position.y = 1.7; church.add(nave);
  const croof = mesh(new THREE.ConeGeometry(3.4, 2, 4), clay(0x5a5a62)); croof.position.y = 4.3; croof.rotation.y = Math.PI / 4; croof.scale.z = 1.5; church.add(croof);
  const belfry = mesh(new THREE.BoxGeometry(1.4, 2.4, 1.4), clay(0xf6f1e7)); belfry.position.set(0, 4.6, 2.4); church.add(belfry);
  const bell = mesh(new THREE.CylinderGeometry(0.25, 0.45, 0.6, 14), clay(0xc9a54c, { metalness: 0.6 })); bell.position.set(0, 4.8, 3.12); church.add(bell);
  const cwin = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), glow); cwin.position.set(0, 1.8, 3.03); church.add(cwin);
  const cspire = mesh(new THREE.ConeGeometry(0.9, 2.2, 4), clay(0x5a5a62)); cspire.position.set(0, 6.9, 2.4); cspire.rotation.y = Math.PI / 4; church.add(cspire);
  church.position.copy(CHURCH); church.rotation.y = -0.4; root.add(church);
  for (const [x, z, r] of [[-9, -6, 0.3], [-11, 1, -0.2], [11, 2, 0.4]]) { const h = makeHouse({ color: 0xf6f1e7, roof: 0x5a5a62 }); h.position.set(x, 0, z); h.rotation.y = r; root.add(h); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.56), glow); w.position.set(0.95, 1.5, 1.36); h.add(w); }
  for (const [x, z] of [[-5, -3], [5, -3], [-6.5, 4], [6.5, 4]]) { const t = makeLollipop(0.9); t.position.set(x, 0, z); root.add(t); }
  const bench = makeBench(); bench.position.set(-3.4, 0, 2.6); root.add(bench);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), new THREE.MeshBasicMaterial({ map: canvasTexture(256, 192, (g) => { g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, 256, 192); g.fillStyle = '#2b2a33'; g.font = '22px Newsreader, serif'; ['Market day, Saturday', 'Choir, Thursday at 7', 'LOST: one cat (grey)', 'Clock repairs, enquire', 'within'].forEach((l, i) => g.fillText(l, 16, 34 + i * 34)); }) }));
  board.position.set(3.6, 1.6, -3.8); root.add(board);
  const bpost = mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), clay(palette.wood)); bpost.position.set(3.6, 1.6, -3.85); root.add(bpost);
  const blegs = mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), clay(palette.wood)); blegs.position.set(3.6, 0.55, -3.85); root.add(blegs);
  // the way to the station
  const sign = new THREE.Group(); const spost = mesh(new THREE.BoxGeometry(0.12, 2, 0.12), clay(palette.wood)); spost.position.y = 1; sign.add(spost);
  const sboard = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshBasicMaterial({ map: textTexture('STATION  \u2192', { w: 360, h: 100, font: 'bold 44px Newsreader, serif' }) })); sboard.position.set(0.5, 1.7, 0.08); sign.add(sboard);
  const sback = mesh(new THREE.BoxGeometry(1.56, 0.48, 0.06), clay(palette.wood)); sback.position.set(0.5, 1.7, 0.02); sign.add(sback);
  sign.position.copy(SIGN).add(V(0.4, 0, -0.6)); root.add(sign);
  // the postman, on his round
  const postman = makePerson({ color: 0x3f5a8c, hat: true }); postman.position.set(4.6, 0, 1.6); root.add(postman);
  const bag = mesh(new THREE.BoxGeometry(0.4, 0.45, 0.2), clay(0x8a6a4a)); bag.position.set(-0.38, 0.9, 0); postman.userData.body.add(bag);
  // clouds, to show the time going by
  const clouds = root.children[0].children.filter((c) => c.children?.length === 5 && c.position.y > 10);
  // the sky through the night: a sun that sets, a moon, stars, and a sun that rises again
  const orb = (r, color) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color, fog: false })); root.add(m); m.visible = false; return m; };
  const sunDisc = orb(2.2, 0xffe08a), moon = orb(1.4, 0xf4f1e4);
  const starPos = []; for (let i = 0; i < 320; i++) starPos.push((rnd() - 0.5) * 150, 4 + rnd() * 60, -60 - rnd() * 30);
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff6d8, size: 0.45, transparent: true, opacity: 0, fog: false, depthWrite: false })); root.add(stars);
  const ARC = V(-1, -1, -40), ARC_R = 14;
  const onArc = (m, a) => { m.position.set(ARC.x + Math.cos(a) * ARC_R, ARC.y + Math.sin(a) * ARC_R, ARC.z); m.visible = m.position.y > -1; };

  // ---- the station, somewhere else: a platform, a train, a guard, and a clock that goes
  const station = new THREE.Group(); station.position.copy(STATION); root.add(station);
  const sfield = mesh(new THREE.BoxGeometry(40, 0.4, 24), clay(0x9aba72)); sfield.position.set(0, -0.21, -2); station.add(sfield);
  const platform = mesh(new THREE.BoxGeometry(22, 0.42, 3.6), clay(0xe6dcc8)); platform.position.set(0, -0.19, 0.6); station.add(platform);
  for (const z of [-1.8, -3]) { const r = mesh(new THREE.BoxGeometry(40, 0.1, 0.1), clay(palette.rail)); r.position.set(0, 0.05, z); station.add(r); }
  for (let x = -19; x < 20; x += 1.2) { const t = mesh(new THREE.BoxGeometry(0.3, 0.06, 1.8), clay(palette.tie)); t.position.set(x, 0.01, -2.4); station.add(t); }
  const train = makeTrain(); train.position.set(0, 0, -2.4); station.add(train);
  const shed = makeHouse({ color: 0xf6f1e7, roof: 0x5a5a62 }); shed.position.set(-7, 0, 4.4); station.add(shed);
  const cpost = mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 8), clay(palette.ink)); cpost.position.set(-1.6, 1.4, 1.6); station.add(cpost);
  const sclock = makeClockFace(0.5, true); sclock.face.position.set(-1.6, 3.1, 1.66); station.add(sclock.face);
  const scase = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.08, 24), clay(palette.ink)); scase.rotation.x = Math.PI / 2; scase.position.set(-1.6, 3.1, 1.6); station.add(scase);
  setTime(sclock, 2, 14.2);
  const guard = makePerson({ color: palette.ink, hat: true }); guard.position.set(2.6, 0, 0.6); guard.rotation.y = -1; station.add(guard);
  for (const x of [-12, 11]) { const t = makeLollipop(1); t.position.set(x, 0, 3); station.add(t); }
  const sc = makeCountry({ seed: 71, depth: -14 }); sc.position.z = -4; station.add(sc);

  // ---- the frog: while the afternoon passes, it's up on the clock, sitting on the minute hand, which doesn't move
  const frog = makeFrog({ scale: 0.42 }); root.add(frog);
  const onHand = face.position.clone().add(V(0.05, 0.5, 0.22));
  const cameo = frogCameo(frog, [{ at: [onHand.x, onHand.z], y: onHand.y }, { face: [0, 10] }, { wait: 7, act: (f, u) => (f.userData.body.rotation.z = Math.sin(u * 50) * 0.05) }, { at: [onHand.x + 0.9, onHand.z], y: FACE_Y - 1.4, height: 0.5 }, { warp: [30, 30], y: 0 }]);

  // ---- state
  const S = { phase: 'walk', idle: 0, lapse: -1, where: 'square', depart: -1 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/stopped-clock.json', 'The Stopped Clock');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(240, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.x = 40; root.add(gp); level.ground.push(gp);
  let card = null;

  // reading the clock
  async function read() {
    if (S.phase !== 'walk') return;
    S.phase = 'look'; player.enabled = false; S.lookUp = true;
    card = beliefCard("It's two o'clock.", { reason: 'You had good reason to (it always keeps good time)' });
    await voice.say('reads', { urgent: true });
    card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
    await ctx.wait(0.6); S.lookUp = false; await voice.say('go'); S.phase = 'go'; S.idle = 0; player.enabled = true;
  }
  // acting on it: you run for the quarter past two, and make it
  async function hurry() {
    if (S.phase !== 'go') return;
    S.phase = 'run'; player.locked = true; player.target = SIGN.clone().add(V(3.4, 0, 1));
    await ctx.wait(1.6); await ctx.flash(true);
    S.where = 'station'; player.locked = false; player.enabled = false; player.place(STATION.x - 4.2, STATION.z + 0.9, Math.PI / 2); await ctx.flash(false);
    ctx.speak(guard, 'Quarter past two! All aboard!', { offset: [0, 2.3, 0] }); await ctx.wait(1.4);
    await voice.say('true', { urgent: true }); card.tick(1);
    player.enabled = true; player.locked = true; player.target = STATION.clone().add(V(-0.6, 0, -0.9)); await ctx.wait(1.6);
    player.obj.visible = false; player.locked = false; player.enabled = false; await ctx.wait(0.4); S.depart = 0; await ctx.wait(3.2);
    // then the rest of the day, the night, and the next morning go by in the square
    await ctx.flash(true); S.where = 'square'; S.lapse = 0; cameo.start(); await ctx.flash(false);
    await voice.say('night'); while (S.lapse < DAY) await ctx.wait(0.2); S.lapse = -2;
    await voice.say('stopped'); card.ask(); await ctx.wait(0.6); await voice.say('end');
    await ctx.wait(1.8);
    save.complete('stopped-clock');
    ctx.gameOver({ title: 'Right by accident', text: 'You believed it was two o\'clock, it was two o\'clock, and you had good reason: the clock always keeps good time. You caught your train on it. But the clock had stopped. You happened to look at it in one of the two minutes a day it was right.' });
  }
  interact.add({ pos: TOWER.clone().add(V(0, 0, 3.6)), radius: 1.6, height: 3, prompt: 'Look up at the clock', enabled: () => S.phase === 'walk', onUse: read });
  interact.add({ pos: SIGN, radius: 1.6, height: 2.4, prompt: 'Hurry to the station', terminal: true, enabled: () => S.phase === 'go', onUse: hurry });
  look(ctx, { pos: V(3.6, 0, -2.6), radius: 1.2, height: 2.4, prompt: 'Read the notice board', lines: ['notice'], enabled: () => S.phase === 'walk' || S.phase === 'go' });
  look(ctx, { pos: V(-3.4, 0, 3.6), radius: 1.3, height: 1.6, prompt: 'Sit a moment', lines: ['bench'], enabled: () => S.phase === 'walk' || S.phase === 'go' });
  const chat = talk(ctx, { who: postman, enabled: () => S.phase === 'walk' || S.phase === 'go', lines: ['Afternoon!', 'Can\'t stop. These letters won\'t post themselves.', 'Lovely day. Far too nice for a round.'] });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 5.6, rotY: Math.PI },
    walkable: (x, z) => (S.where === 'station' ? Math.abs(x - STATION.x) < 10 && z > STATION.z - 1.2 && z < STATION.z + 2.2 : Math.abs(x) < 13 && z > -3.6 && z < 7.4),
    blockers: () => S.where === 'station' ? [] : [{ x: -3.4, z: 2.6, w: 2, d: 0.8 }, { x: 3.6, z: -3.85, w: 1.4, d: 0.3 }, { x: postman.position.x, z: postman.position.z, r: 0.4 }, { x: SIGN.x + 0.4, z: SIGN.z - 0.6, r: 0.2 },
      ...[[-5, -3], [5, -3], [-6.5, 4], [6.5, 4]].map(([x, z]) => ({ x, z, r: 0.35 }))],
    update(dt, t) {
      // the postman strolls back and forth along his round (and stops to talk)
      const tp = t - (S.pauseT ?? 0);
      if (interact.current !== chat && S.where === 'square') { postman.position.x = 4.6 + Math.sin(tp * 0.25) * 2.4; postman.rotation.y = Math.cos(tp * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2; animatePerson(postman, tp * 2, { energy: 0.8 }); }
      else S.pauseT = (S.pauseT ?? 0) + dt;
      animatePerson(guard, t, { energy: 0.3 });
      // the station clock goes: its second hand sweeps round, and on the quarter hour the minute hand clicks on
      if (sclock.sec) { sclock.sec.rotation.z = -((t * 1) % 60) / 60 * Math.PI * 2; if (S.depart >= 0) setTime(sclock, 2, 15); }
      if (S.depart >= 0) { S.depart += dt; train.position.x = 0.9 * S.depart * S.depart; }
      // the evening, the night and the morning: the sky, the light, the sun going down, the moon and stars, the lit
      // windows, the sun coming up again; and all the while, the town clock's hands stay exactly where they are
      if (S.lapse >= 0) {
        S.lapse += dt; const u = clamp(S.lapse / DAY), k = skyAt(u);
        stage.scene.background.copy(k.color); stage.scene.fog.color.copy(k.color);
        stage.sun.intensity = k.sun; stage.hemi.intensity = k.hemi;
        stars.material.opacity = k.dark; glow.opacity = clamp(k.dark * 1.4 - 0.3);
        onArc(sunDisc, u < 0.5 ? lerp(1.1, -0.3, clamp(u / 0.22)) : lerp(Math.PI + 0.3, 2.2, clamp((u - 0.72) / 0.24)));
        onArc(moon, lerp(Math.PI + 0.1, -0.1, clamp((u - 0.2) / 0.56)));
        clouds.forEach((c, i) => (c.position.x += dt * (4 + i)));
      }
      if (S.phase === 'walk') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) read();
      }
      if (S.phase === 'go') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > GO_LIMIT) hurry();
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.lapse !== -1) { const f = face.position; return { pos: f.clone().add(V(2.4, -3.4, 13)), look: f.clone().add(V(0, 0.4, -4)), stiffness: 60 }; }   // the tower against the sky (a cut)
      if (S.where === 'station') return { pos: STATION.clone().add(V(-0.4, 4, 14)), look: STATION.clone().add(V(-0.4, 1.9, -1.4)), stiffness: 60 };
      if (S.lookUp) { const f = face.position; return { pos: f.clone().add(V(2, -2.6, 9)), look: f.clone().add(V(0, -1.2, 0)), stiffness: 2 }; }
      const look = V(pl.pos.x * 0.6, 2.4, -2);
      return { pos: look.clone().add(V(0, 5, 14)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.obj.visible = true; player.locked = false; },
  });
}
