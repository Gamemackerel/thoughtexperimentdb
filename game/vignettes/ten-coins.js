// Vignette: Ten Coins (Gettier's first case).
// A panelled waiting room. You (Smith) and Jones have applied for the same job. The president leans out of his door:
// between you and me, Jones is getting it. Jones empties his pockets onto the table and counts his coins for the bus:
// ten. Put two and two together (the man who gets the job has ten coins in his pocket) and bet Jones a shilling on it
// (or wait long enough, and the narrator draws the conclusion for you anyway). Then you're called in, and the job is
// yours. Empty your pockets: ten coins you never counted. You win the bet, on your own coins.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeTable } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { textTexture } from '../core/props.js';
import { canvasTexture } from '../core/brush.js';
import { makeCountry } from '../core/grantwood.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 7, BACK = -4, FRONT = 2.8;
const TABLE = V(0.4, 0, -1.2);
const PDOOR = V(4.6, 0, BACK);
const OFFICE = V(60, 0, 0);
const PSPOT = V(2.6, 0, 0.2);             // where the president comes out to, to speak to you
const IDLE_LIMIT = 60;

function makeChair(color = 0x6b4a33) {
  const c = new THREE.Group(); const seat = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), clay(color)); seat.position.y = 0.5; c.add(seat);
  const bk = mesh(new THREE.BoxGeometry(0.7, 0.8, 0.1), clay(color)); bk.position.set(0, 0.95, -0.32); c.add(bk);
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), clay(color)); l.position.set(x, 0.25, z); c.add(l); }
  return c;
}

export default function tenCoins(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xdfe9ee);
  stage.scene.fog = new THREE.Fog(0xdfe9ee, 50, 150);
  voice.load('ten-coins');
  const rnd = seeded(1963);

  // ---- the waiting room: wood panelling, a window onto the hills, chairs, a low table, the president's door
  const country = makeCountry({ seed: 19, depth: -14 }); country.position.z = -4; root.add(country);
  const floor = mesh(new THREE.BoxGeometry(HALF * 2, 0.4, 7.2), clay(0xb89572)); floor.position.set(0, -0.2, -0.6); floor.receiveShadow = true; root.add(floor);
  const panel = canvasTexture(512, 256, (g, w, h) => { g.fillStyle = '#8a6a4a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6b4a33'; g.lineWidth = 6; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo((i / 8) * w, 0); g.lineTo((i / 8) * w, h); g.stroke(); } g.fillStyle = '#f2e6d4'; g.fillRect(0, 0, w, h * 0.45); });
  panel.wrapS = THREE.RepeatWrapping; panel.repeat.set(3, 1);
  const wallM = new THREE.MeshStandardMaterial({ map: panel, roughness: 0.9 });
  const WIN = [-3.4, 0.4];                                              // a window in the back wall, from x -3.4 to 0.4
  for (const [x0, x1] of [[-HALF, WIN[0]], [WIN[1], HALF]]) { const w = mesh(new THREE.BoxGeometry(x1 - x0, 4.4, 0.3), wallM); w.position.set((x0 + x1) / 2, 2.2, BACK - 0.15); root.add(w); }
  const under = mesh(new THREE.BoxGeometry(WIN[1] - WIN[0], 1.2, 0.3), wallM); under.position.set((WIN[0] + WIN[1]) / 2, 0.6, BACK - 0.15); root.add(under);
  const over = mesh(new THREE.BoxGeometry(WIN[1] - WIN[0], 0.8, 0.3), wallM); over.position.set((WIN[0] + WIN[1]) / 2, 4, BACK - 0.15); root.add(over);
  const mullion = mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), clay(0xf6f1e7)); mullion.position.set((WIN[0] + WIN[1]) / 2, 2.4, BACK - 0.1); root.add(mullion);
  for (const s of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.3, 4.4, 7), wallM); e.position.set(s * (HALF + 0.15), 2.2, -0.5); root.add(e); }
  const pdoor = mesh(new THREE.BoxGeometry(1.3, 2.5, 0.12), clay(0x6b4a33)); pdoor.position.copy(PDOOR).add(V(0, 1.25, 0.05)); root.add(pdoor);
  const pglass = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: textTexture('PRESIDENT', { w: 256, h: 140, font: 'bold 40px Newsreader, serif', bg: '#e9eef0' }) })); pglass.position.copy(PDOOR).add(V(0, 1.85, 0.13)); root.add(pglass);
  const table = makeTable({ w: 1.6, d: 0.8, h: 0.55, color: 0x6b4a33 }); table.position.copy(TABLE); root.add(table);
  const jonesChair = makeChair(); jonesChair.position.copy(TABLE).add(V(1.4, 0, -0.9)); jonesChair.rotation.y = -0.5; root.add(jonesChair);
  const myChair = makeChair(); myChair.position.copy(TABLE).add(V(-1.6, 0, -0.8)); myChair.rotation.y = 0.5; root.add(myChair);
  const plant = mesh(new THREE.SphereGeometry(0.5, 10, 8), clay(0x6f9a4f, { flatShading: true })); plant.position.set(-6, 1, -3.4); root.add(plant);
  const pot = mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.6, 10), clay(0xc9705a)); pot.position.set(-6, 0.3, -3.4); root.add(pot);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), new THREE.MeshBasicMaterial({ map: canvasTexture(128, 128, (g) => { g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#2b2a33'; g.lineWidth = 5; g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 20); g.moveTo(64, 64); g.lineTo(92, 70); g.stroke(); }) }));
  clock.position.set(2.6, 3.2, BACK + 0.05); root.add(clock);

  // ---- Jones, the president, and the coins
  const jones = makePerson({ color: palette.one, hat: true }); jones.position.copy(jonesChair.position); jones.rotation.y = -0.5 + Math.PI; jones.userData.body.position.y = -0.42; root.add(jones);
  const president = makePerson({ color: 0x2b2a33 }); president.position.copy(PDOOR).add(V(0, 0, 0.6)); president.visible = false; root.add(president);
  const tie = mesh(new THREE.BoxGeometry(0.1, 0.4, 0.04), clay(0xc0182a)); tie.position.set(0, 1.2, 0.34); president.userData.body.add(tie);
  const coinGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.025, 16), coinMat = clay(0xc9a54c, { metalness: 0.6, roughness: 0.35 });
  const jonesCoins = [...Array(10)].map((_, i) => { const c = mesh(coinGeo, coinMat); c.position.copy(TABLE).add(V(-0.5 + (i % 5) * 0.24, 0.68, 0.05 + Math.floor(i / 5) * 0.22)); c.visible = false; root.add(c); return c; });

  // ---- the president's office (you'll be called in)
  const office = new THREE.Group(); office.position.copy(OFFICE); root.add(office);
  const ofloor = mesh(new THREE.BoxGeometry(10, 0.4, 7), clay(0xb89572)); ofloor.position.y = -0.2; office.add(ofloor);
  const oback = mesh(new THREE.BoxGeometry(10, 4.4, 0.3), wallM); oback.position.set(0, 2.2, -3.4); office.add(oback);
  for (const s of [-1, 1]) { const ow = mesh(new THREE.BoxGeometry(0.3, 4.4, 7.3), wallM); ow.position.set(s * 5.15, 2.2, 0); office.add(ow); }   // side walls: close the room so nothing outside shows past it
  const desk = makeTable({ w: 2.6, d: 1.2, h: 1, color: 0x5a3d29 }); desk.position.set(0, 0, -1.4); office.add(desk);
  const flag = mesh(new THREE.BoxGeometry(0.8, 0.5, 0.02), clay(0x5b7fa6)); flag.position.set(3.4, 2.4, -3.2); office.add(flag);
  const stake = [0.1, 0.3].map((z) => { const c = mesh(coinGeo, coinMat); c.position.copy(TABLE).add(V(0.68, 0.68, z)); c.visible = false; root.add(c); return c; });   // the bet: a shilling each
  const shown = [...Array(10)].map((_, i) => { const c = mesh(coinGeo, coinMat); c.position.copy(TABLE).add(V(-0.66 + i * 0.13, 0.68 + (i % 2) * 0.01, -0.26)); c.visible = false; root.add(c); return c; });   // your ten, back in the waiting room
  const myCoins = [...Array(10)].map((_, i) => { const c = mesh(coinGeo, coinMat); c.position.set(-0.6 + (i % 5) * 0.28, 1.13, -1 + Math.floor(i / 5) * 0.26); c.visible = false; office.add(c); return c; });

  // ---- the frog peers at Jones's coins, one by one, then hops off
  const frog = makeFrog({ scale: 0.4 }); root.add(frog);
  const cameo = frogCameo(frog, [[-3, 2.4], [-1.8, 1.6], [-0.8, 0.6], { at: [TABLE.x - 0.3, TABLE.z + 0.3], y: 0.66, height: 0.7 }, { face: [TABLE.x + 0.2, TABLE.z] },
    { wait: 2.6, act: (f, u) => (f.rotation.y = Math.PI / 2 + Math.sin(u * 9) * 0.3) }, { at: [TABLE.x - 1.2, TABLE.z + 1.4], y: 0, height: 0.7 }, [-2.8, 2], [-4.2, 2.6]]);

  // ---- state
  const S = { phase: 'intro', idle: 0, where: 'room' };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/ten-coins.json', 'Ten Coins');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(160, 30), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.x = 30; root.add(gp); level.ground.push(gp);
  let card = null;

  // the president steps out of his office into the room to say something, and goes back in
  async function presidentOut() { president.position.copy(PDOOR).add(V(0, 0, 0.6)); president.visible = true; S.presTo = PSPOT.clone(); for (let i = 0; i < 40 && S.presTo; i++) await ctx.wait(0.1); }
  async function presidentIn() { S.presTo = PDOOR.clone().add(V(0, 0, 0.6)); for (let i = 0; i < 40 && S.presTo; i++) await ctx.wait(0.1); president.visible = false; }
  async function calledIn() {
    S.phase = 'called'; player.enabled = false;
    await presidentOut(); ctx.speak(president, 'Smith? Would you come in, please?'); await ctx.wait(2.4);
    await ctx.flash(true); S.where = 'office'; player.place(OFFICE.x - 0.9, OFFICE.z + 0.6, Math.PI); president.position.copy(OFFICE).add(V(0.4, 0, -2.4)); president.rotation.y = 0; await ctx.flash(false);
    ctx.speak(president, 'Congratulations. The job is yours!'); await ctx.wait(1.8);
    await voice.say('twist', { urgent: true }); S.phase = 'pockets'; player.enabled = true;
  }
  async function conclude() {
    if (S.phase !== 'choose') return;
    S.phase = 'thinking'; player.enabled = false;
    card = beliefCard('The man who gets the job has ten coins in his pocket.', { reason: 'You had good reason to (the president said so; you watched Jones count)' });
    await voice.say('concluded', { urgent: true }); card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
    await ctx.wait(0.6); await voice.say('dare'); S.phase = 'bet'; S.idle = 0; player.enabled = true;
  }
  // acting on it: a shilling says the man who gets the job has ten coins in his pocket
  async function bet() {
    if (S.phase !== 'bet') return;
    S.phase = 'betting'; S.bet = true; player.enabled = false;
    ctx.speak(player.obj, 'A shilling says the man who gets the job has ten coins in his pocket.', { offset: [0, 2.3, 0], secs: 4 }); await ctx.wait(3.8);
    ctx.speak(jones, 'Ha! Whoever he is? All right. You\'re on.', { offset: [0, 2.3, 0] }); await ctx.wait(1); stake[0].visible = true; await ctx.wait(0.4); stake[1].visible = true; await ctx.wait(1.8);
    calledIn();
  }
  interact.add({ pos: TABLE.clone().add(V(-0.9, 0, 1)), radius: 1.1, height: 1.6, prompt: 'Put two and two together', terminal: true, enabled: () => S.phase === 'choose', onUse: conclude });
  interact.add({ pos: jones.position.clone().add(V(-0.3, 0, 1.3)), radius: 1.3, height: 1.8, prompt: 'Bet Jones a shilling on it', terminal: true, enabled: () => S.phase === 'bet', onUse: bet });
  interact.add({ pos: OFFICE.clone().add(V(0, 0, 0.4)), radius: 1.6, height: 2.2, prompt: 'Empty your pockets', enabled: () => S.phase === 'pockets',
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      for (let i = 0; i < 10; i++) { myCoins[i].visible = true; await ctx.wait(0.18); }
      ctx.speak(president, 'Ten coins. Bus fare, is it?', { offset: [0, 2.4, 0] }); await ctx.wait(1.4);
      await voice.say('yours', { urgent: true }); card.tick(1); await ctx.wait(0.4);
      // back out to Jones, to settle up
      await ctx.flash(true); S.where = 'room'; player.place(TABLE.x + 2.3, TABLE.z + 0.7, -1.9); for (const c of shown) c.visible = true; await ctx.flash(false);
      ctx.speak(jones, 'Ten coins? In the new man\'s pocket?', { offset: [0, 2.3, 0] }); await ctx.wait(2.6);
      ctx.speak(jones, 'Well. A bet\'s a bet.', { offset: [0, 2.3, 0] }); S.pay = 0.001; await ctx.wait(1.6);
      await voice.say('won', { urgent: true }); await ctx.wait(0.4); card.ask(); await voice.say('end');
      await ctx.wait(1.8);
      save.complete('ten-coins');
      ctx.gameOver({ title: 'Right about the wrong man', text: 'You believed the man who gets the job has ten coins in his pocket, and you bet on it. You had good reason, it was true, and you won. But it was true of you, not of Jones: the coins that won it were ones you never counted.' });
    } });

  // asides
  talk(ctx, { who: jones, offset: [0, 2.3, 0], enabled: () => S.phase === 'choose' || S.phase === 'intro', lines: ['Nervous? Me too.', 'I think it went well. I think.', 'Always keep bus fare. My mother taught me that.'] });
  look(ctx, { pos: V(-1.5, 0, BACK + 1.2), radius: 1.3, height: 3, prompt: 'Look out of the window', lines: ['window'], enabled: () => S.phase === 'choose' || S.phase === 'intro' });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6);
    await presidentOut(); ctx.speak(president, 'Between you and me: Jones is getting the job.', { secs: 3.6 }); await ctx.wait(3.8); presidentIn();
    await voice.say('told'); await ctx.wait(0.4);
    ctx.speak(jones, 'Bus fare…', { offset: [0, 2.3, 0] });
    for (let i = 0; i < 10; i++) { jonesCoins[i].visible = true; await ctx.wait(0.22); }
    ctx.speak(jones, '…eight, nine, ten.', { offset: [0, 2.3, 0] }); await ctx.wait(1.4);
    await voice.say('counted'); S.phase = 'choose'; S.idle = 0; cameo.start();
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -1.4, z: 1.4, rotY: Math.PI },
    walkable: (x, z) => (S.where === 'office' ? Math.abs(x - OFFICE.x) < 4.4 && z > OFFICE.z - 0.6 && z < OFFICE.z + 3 : Math.abs(x) < HALF - 0.4 && z > BACK + 0.5 && z < FRONT),
    blockers: () => (S.where === 'office' ? [] : [{ x: TABLE.x, z: TABLE.z, w: 1.7, d: 0.9 }, { x: jonesChair.position.x, z: jonesChair.position.z, r: 0.5 }, { x: myChair.position.x, z: myChair.position.z, r: 0.45 }, { x: -6, z: -3.4, r: 0.5 }]),
    update(dt, t) {
      animatePerson(jones, t, { energy: 0.2 }); animatePerson(president, t, { energy: S.presTo ? 1 : 0.2 });
      if (S.presTo) { const d = S.presTo.clone().sub(president.position).setY(0); if (d.length() < 0.1) { S.presTo = null; president.rotation.y = Math.atan2(player.pos.x - president.position.x, player.pos.z - president.position.z); } else { president.position.addScaledVector(d.normalize(), Math.min(d.length(), dt * 2)); president.rotation.y = Math.atan2(d.x, d.z); } }
      if (S.phase === 'choose') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) conclude();
      }
      if (S.phase === 'bet') {   // (sitting on it: Jones notices the look on your face, and you can't resist)
        const was = S.idle; S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (was < 20 && S.idle >= 20) ctx.speak(jones, 'What are you grinning about?', { offset: [0, 2.3, 0] });
        if (S.idle > 34) bet();
      }
      if (S.pay > 0) { S.pay = Math.min(1, S.pay + dt * 0.8); const k = easeInOut(S.pay); stake.forEach((c, i) => c.position.copy(TABLE).add(V(lerp(0.68, 0.64 + i * 0.13, k), 0.68 + Math.sin(Math.PI * k) * 0.08, lerp(0.1 + i * 0.2, -0.26, k)))); }   // Jones slides the stake over
      cameo.update(dt);
    },
    camera(pl) {
      if (S.where === 'office') return { pos: OFFICE.clone().add(V(4.6, 3.8, 5.4)), look: OFFICE.clone().add(V(-0.4, 1.1, -1.2)), stiffness: 3 };   // from the side, so you're not in the way
      const look = V(clamp(pl.pos.x, -2, 2), 1.4, -1);
      return { pos: look.clone().add(V(0, 4.8, 10)), look, stiffness: 2.2 };
    },
    dispose() { voice.stop(); },
  });
}
