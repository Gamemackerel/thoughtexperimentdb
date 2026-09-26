// Vignette: The Experience Machine.
// A calm, expensive clinic. A technician will plug you into a machine that gives you any life you like, and you'll
// never know it isn't real. Try the demonstration (a minute on a stage, the crowd cheering). Then climb into your tank
// for the rest of your life, or go home, out into the rain. The second time you come, the technician has something to
// tell you: you've been in one of their machines all along. Would you like to unplug?
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog, makeTable, makeIsland, makeTree } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 10, BACK = -4.4, FRONT = 3;
const TANK = V(8.2, 0, -3);                 // yours
const DEMO = V(-1.8, 0, -3);
const EXIT = V(-HALF, 0, 0.6);
const PLUG = V(-4.4, 0, BACK);
const DREAM = V(90, 0, 0), REAL = V(-90, 0, 0), STREET = V(-17, 0, 0.6);
const IDLE_LIMIT = 60;

function makeTankM(occupied) {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.4, 20), clay(0xdcd6cb)); base.position.y = 0.2; g.add(base);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.6, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xbfeee0, transparent: true, opacity: 0.28, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = 1.7; g.add(glass);
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 2.3, 20), new THREE.MeshStandardMaterial({ color: 0x9fe6d0, transparent: true, opacity: 0.22, depthWrite: false })); fluid.position.y = 1.6; g.add(fluid);
  const cap = mesh(new THREE.CylinderGeometry(0.8, 0.75, 0.35, 20), clay(0xdcd6cb)); cap.position.y = 3.15; g.add(cap);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7cf0c4 })); light.position.set(0, 0.3, 0.8); g.add(light);
  for (let i = 0; i < 3; i++) { const w = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 5), clay(0x5d6470)); w.position.set(-0.3 + i * 0.3, 3.9, -0.2); g.add(w); }
  if (occupied) { const p = makePerson({ color: 0xf6f1e7 }); p.position.y = 0.5; p.userData.body.rotation.x = 0.08; g.add(p); g.userData.person = p; }
  g.userData.fluid = fluid; g.userData.light = light;
  return g;
}

export default function experienceMachine(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xeef2f0);
  stage.scene.fog = new THREE.Fog(0xeef2f0, 50, 180);
  voice.load('experience-machine');
  const rnd = seeded(1974);
  const replay = save.done.has('experience-machine');

  // ---- the clinic: pale floor, pale walls, a reception desk, soft chairs, a row of tanks
  const floor = mesh(new THREE.BoxGeometry(HALF * 2, 0.4, 8), clay(0xe6ece8)); floor.position.set(0, -0.2, -0.7); floor.receiveShadow = true; root.add(floor);
  const wallM = clay(0xdfe9e6);
  const back = mesh(new THREE.BoxGeometry(HALF * 2 + 0.6, 5, 0.3), wallM); back.position.set(0, 2.5, BACK - 0.15); root.add(back);
  const right = mesh(new THREE.BoxGeometry(0.3, 5, 8), wallM); right.position.set(HALF + 0.15, 2.5, -0.7); root.add(right);
  for (const [z0, z1] of [[BACK, EXIT.z - 0.8], [EXIT.z + 0.8, FRONT + 0.3]]) { const w = mesh(new THREE.BoxGeometry(0.3, 5, z1 - z0), wallM); w.position.set(-HALF - 0.15, 2.5, (z0 + z1) / 2); root.add(w); }
  const lintel = mesh(new THREE.BoxGeometry(0.3, 2.4, 1.6), wallM); lintel.position.set(-HALF - 0.15, 3.8, EXIT.z); root.add(lintel);
  const stripe = mesh(new THREE.BoxGeometry(HALF * 2, 0.12, 0.05), clay(0x3f8f86)); stripe.position.set(0, 1.2, BACK + 0.03); root.add(stripe);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.6), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 70; const g = c.getContext('2d'); g.fillStyle = '#dfe9e6'; g.fillRect(0, 0, 512, 70); g.fillStyle = '#3f8f86'; g.font = '600 34px Figtree, sans-serif'; g.textAlign = 'center'; g.fillText('EXPERIENCE MACHINES', 256, 46); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
  sign.position.set(-5, 3.6, BACK + 0.04); root.add(sign);
  const reception = makeTable({ w: 2.6, d: 0.9, h: 1.1, color: 0xf6f1e7 }); reception.position.set(-6.2, 0, -2.4); root.add(reception);
  const tech = makePerson({ color: 0xf6f6f2 }); tech.position.set(-6.2, 0, -3.4); root.add(tech);
  const clip = mesh(new THREE.BoxGeometry(0.3, 0.4, 0.04), clay(0x5b7fa6)); clip.position.set(0.3, 1.05, 0.36); tech.userData.body.add(clip);
  for (let i = 0; i < 3; i++) { const c = new THREE.Group(); const seat = mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), clay(0xb8d8cf)); seat.position.y = 0.3; c.add(seat); const bk = mesh(new THREE.BoxGeometry(0.8, 0.7, 0.2), clay(0xb8d8cf)); bk.position.set(0, 0.75, -0.3); c.add(bk); c.position.set(-7.6 + i * 1, 0, 1.6); c.rotation.y = Math.PI; root.add(c); }
  const plant = mesh(new THREE.SphereGeometry(0.5, 10, 8), clay(0x6f9a4f, { flatShading: true })); plant.position.set(-9, 0.9, -3.6); root.add(plant);
  const pot = mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 10), clay(0xf6f1e7)); pot.position.set(-9, 0.25, -3.6); root.add(pot);
  const tanks = [0, 1, 2, 3].map((i) => { const t = makeTankM(true); t.position.set(1.4 + i * 1.7, 0, -3.2); root.add(t); return t; });
  const mine = makeTankM(false); mine.position.copy(TANK); root.add(mine);
  const steps = mesh(new THREE.BoxGeometry(1, 0.4, 0.6), clay(0xdcd6cb)); steps.position.copy(TANK).add(V(0, 0.2, 1)); root.add(steps);
  // the demonstration chair, with its helmet
  const demo = new THREE.Group();
  const dseat = mesh(new THREE.BoxGeometry(0.9, 0.2, 1.4), clay(0xf6f1e7)); dseat.position.y = 0.6; dseat.rotation.x = -0.2; demo.add(dseat);
  const dbase = mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.5, 12), clay(0x8b909a)); dbase.position.y = 0.25; demo.add(dbase);
  const helmet = mesh(new THREE.SphereGeometry(0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xc9ccd1, { metalness: 0.5 })); helmet.position.set(0, 1.55, -0.55); demo.add(helmet);
  const hpost = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), clay(0x8b909a)); hpost.position.set(0, 0.9, -0.85); demo.add(hpost);
  demo.position.copy(DEMO); root.add(demo);
  // the plug in the wall (it only matters the second time)
  const plugBox = mesh(new THREE.BoxGeometry(0.6, 0.8, 0.2), clay(0x5d6470)); plugBox.position.copy(PLUG).add(V(0, 1.3, 0.1)); root.add(plugBox);
  const cable = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), clay(0x2b2a33)); cable.position.copy(PLUG).add(V(0, 0.65, 0.12)); root.add(cable);
  const plugHead = mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), clay(0xe0674f)); plugHead.position.copy(PLUG).add(V(0, 1.3, 0.3)); root.add(plugHead);
  plugBox.visible = cable.visible = plugHead.visible = replay;

  // ---- outside: a grey street in the rain, a bus stop, your friend
  const street = new THREE.Group(); street.position.copy(STREET); root.add(street);
  const pave = mesh(new THREE.BoxGeometry(14, 0.4, 9), clay(0xb8bcc2)); pave.position.set(0, -0.2, 0); street.add(pave);
  const road = mesh(new THREE.BoxGeometry(14, 0.05, 3), clay(0x6d7684)); road.position.set(0, 0.02, 3); street.add(road);
  const shelter = new THREE.Group(); const sroof = mesh(new THREE.BoxGeometry(2.6, 0.1, 1.2), clay(0x5d6470)); sroof.position.y = 2.4; shelter.add(sroof);
  for (const x of [-1.2, 1.2]) { const p = mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), clay(0x5d6470)); p.position.set(x, 1.2, -0.5); shelter.add(p); }
  shelter.position.set(-3, 0, 0.4); street.add(shelter);
  const friend = makePerson({ color: 0xe2a93b }); friend.position.set(-3.2, 0, 0.6); street.add(friend);
  const umbrella = mesh(new THREE.SphereGeometry(0.8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.5), clay(0xe0674f)); umbrella.position.set(0, 2.5, 0); friend.userData.body.add(umbrella);
  const rainGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3), rain = new THREE.InstancedMesh(rainGeo, new THREE.MeshBasicMaterial({ color: 0x9fb2c8, transparent: true, opacity: 0.6 }), 500); street.add(rain);
  const drops = [...Array(500)].map(() => [(rnd() - 0.5) * 14, rnd() * 6, (rnd() - 0.5) * 9]);

  // ---- the dream: a sunny island, a stage, a cheering crowd, confetti
  const dream = new THREE.Group(); dream.position.copy(DREAM); root.add(dream);
  dream.add(makeIsland({ radius: 14, seed: 5, color: 0xa9d88a }));
  const dsea = mesh(new THREE.CylinderGeometry(80, 80, 0.3, 48), clay(0x6fc8e0)); dsea.position.y = -1.5; dream.add(dsea);
  const podium = mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.8, 20), clay(0xf2c14e)); podium.position.set(0, 0.4, -1); dream.add(podium);
  const crowd = [...Array(18)].map((_, i) => { const p = makePerson({ color: [0xe0674f, 0x5b7fa6, 0xe2a93b, 0x7a5a8c, 0x6f9a4f][i % 5] }); const a = -0.9 + (i / 17) * 1.8 + Math.PI / 2, r = 4.5 + (i % 3) * 1.1; p.position.set(Math.cos(a) * r, 0, -1 + Math.sin(a) * r); p.rotation.y = Math.atan2(-p.position.x, -1 - p.position.z) + Math.PI; p.lookAt(0, 0, -1); dream.add(p); return p; });
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), 260); dream.add(confetti);
  const bits = [...Array(260)].map((_, i) => { confetti.setColorAt(i, new THREE.Color([0xe0674f, 0xf2c14e, 0x5b7fa6, 0x3f8f86, 0xe8435a][i % 5])); return [(rnd() - 0.5) * 10, rnd() * 8, -1 + (rnd() - 0.5) * 8, rnd() * 6]; });
  for (let i = 0; i < 4; i++) { const t = makeTree(1.2, rnd); t.position.set(-9 + i * 5.5, 0, -8); dream.add(t); }
  const dreamer = makePerson({ color: palette.agent }); dreamer.position.set(0, 0.8, -1); dream.add(dreamer);

  // ---- the real thing (the second time): a grey room of tanks, one of them yours
  const real = new THREE.Group(); real.position.copy(REAL); root.add(real);
  const rfloor = mesh(new THREE.BoxGeometry(18, 0.4, 10), clay(0x6d7078)); rfloor.position.y = -0.2; real.add(rfloor);
  const rwall = mesh(new THREE.BoxGeometry(18, 6, 0.3), clay(0x55585f)); rwall.position.set(0, 3, -4.6); real.add(rwall);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const t = makeTankM(!(r === 1 && i === 3)); t.position.set(-7 + i * 2, 0, -3 + r * 3.4); t.userData.fluid.material.color.set(0x7a8f88); real.add(t); }
  const rlight = new THREE.PointLight(0xc8d0d8, 6, 14, 1.6); rlight.position.set(0, 4.5, 1); real.add(rlight);

  // ---- the frog: it hops up onto the rim of your empty tank, looks in, and decides against it
  const frog = makeFrog({ scale: 0.55 }); root.add(frog);
  const cameo = frogCameo(frog, [[HALF - 0.6, 1.8], [HALF - 1.2, 0.4], [TANK.x + 0.2, TANK.z + 1.3], { at: [TANK.x, TANK.z + 0.55], y: 3.35, height: 1.6 }, { face: [TANK.x, TANK.z - 2] },
    { wait: 2.6, act: (f, u) => (f.userData.body.rotation.x = 0.4 * Math.sin(Math.PI * clamp(u * 1.4))) }, { face: [TANK.x, TANK.z + 4] }, { wait: 0.5 },
    { at: [TANK.x - 0.6, TANK.z + 1.6], y: 0, height: 1.4 }, [HALF - 1.6, 1.6], [HALF - 0.8, 2.6]]);

  // ---- state
  const S = { phase: 'intro', idle: 0, where: 'clinic', dreamT: -1, pull: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/experience-machine.json', 'The Experience Machine');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(260, 30), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  const go = async (where, x, z, rotY = Math.PI) => { await ctx.flash(true); S.where = where; player.place(x, z, rotY); await ctx.flash(false); };
  interact.add({ pos: DEMO.clone().add(V(0.9, 0, 1)), radius: 1.3, height: 2.2, prompt: 'Try the demonstration', enabled: () => S.phase === 'choose' && !S.demoed,
    onUse: async () => {
      S.demoed = true; player.enabled = false;
      await go('dream', DREAM.x, DREAM.z - 1); player.pos.y = 0.8; S.dreamT = 0;
      await voice.say('demo', { urgent: true }); await ctx.wait(3);
      await go('clinic', DEMO.x + 0.6, DEMO.z + 1.4, Math.PI); player.pos.y = 0; S.dreamT = -1;
      player.enabled = true; S.idle = 0; S.demoDone = true; voice.say('demo_2');
    } });
  // the first time: plug in, or go home
  interact.add({ pos: TANK.clone().add(V(-0.3, 0, 1.6)), radius: 1.3, height: 3.6, prompt: 'Climb into the tank', terminal: true, enabled: () => S.phase === 'choose' && !replay,
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      await go('dream', DREAM.x, DREAM.z - 1); player.pos.y = 0.8; S.dreamT = 0;
      await voice.say('plug_1', { urgent: true }); await ctx.wait(1.4);
      S.pull = 1; await voice.say('plug_2'); await ctx.wait(1.8);
      save.complete('experience-machine');
      ctx.gameOver({ title: 'You plugged in', text: 'You chose the life that feels best, and you will never know it is a machine. If you never know, does it matter?' });
    } });
  async function goHome(idle) {
    if (S.phase !== 'choose') return;
    S.phase = 'over'; player.enabled = false;
    if (idle) await voice.say('idle', { urgent: true });
    await go('street', STREET.x + 4, STREET.z, -Math.PI / 2); player.locked = true; player.enabled = true; player.target = V(STREET.x - 2.2, 0, STREET.z + 0.5);
    await voice.say('home_1', { urgent: !idle }); ctx.speak(friend, 'There you are! Come on, the bus is coming.');
    await ctx.wait(1); await voice.say('home_2'); await ctx.wait(1.8);
    save.complete('experience-machine');
    ctx.gameOver({ title: 'You went home', text: 'Nothing out there was made for you. But it is real, and you are really in it. Nozick thought most of us would choose this. Would you still, if it rained every day?' });
  }
  interact.add({ pos: EXIT.clone().add(V(1.2, 0, 0)), radius: 1.3, height: 2.4, prompt: () => (replay ? 'Go out for some air' : 'Go home'), terminal: !replay, enabled: () => S.phase === 'choose',
    onUse: () => (replay ? voice.say('air', { urgent: true, once: false }) : goHome(false)) });
  // the second time: unplug, or stay
  interact.add({ pos: PLUG.clone().add(V(0, 0, 1.3)), radius: 1.3, height: 2.2, prompt: 'Pull the plug', terminal: true, enabled: () => S.phase === 'choose' && replay,
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      await voice.say('unplug_0', { urgent: true });
      await go('real', REAL.x + (-7 + 3 * 2), REAL.z + 1.6, Math.PI);
      await voice.say('unplug_1'); await ctx.wait(1.2); await voice.say('unplug_2'); await ctx.wait(1.8);
      save.complete('experience-machine');
      ctx.gameOver({ title: 'You unplugged', text: 'Everything you had known was made for you, and you gave it up for a cold grey room that wasn\'t. When people are told they are already plugged in, most of them choose to stay.' });
    } });
  async function stayIn(idle) {
    if (S.phase !== 'choose') return;
    S.phase = 'over'; player.enabled = false;
    await voice.say(idle ? 'stay_idle' : 'stay_1', { urgent: true }); await ctx.wait(1); await voice.say('stay_2'); await ctx.wait(1.6);
    save.complete('experience-machine');
    ctx.gameOver({ title: 'You stayed plugged in', text: 'Told that your life was a machine all along, you kept it. Most people do. Is that because it is better, or only because it is yours?' });
  }
  interact.add({ pos: V(-6.6, 0, 2.6), radius: 1.3, height: 2, prompt: 'Sit back down, and stay', terminal: true, enabled: () => S.phase === 'choose' && replay, onUse: () => stayIn(false) });

  // asides
  talk(ctx, { who: tech, enabled: () => S.phase === 'choose' || S.phase === 'intro', lines: replay
    ? ['I know. It is a lot to take in.', 'Nothing will change if you stay. Nothing at all.', 'Some people pull the plug. Very few.']
    : ['Any life you like. Just tell us.', 'Most clients choose to be loved. Some choose to be right.', "Take all the time you need. We close at five."] });
  look(ctx, { pos: tanks[1].position.clone().add(V(0.8, 0, 1.4)), radius: 1.3, height: 3.4, prompt: 'Look into the tanks', lines: ['tanks'], enabled: () => S.phase === 'choose' || S.phase === 'intro' });
  look(ctx, { pos: V(-8.6, 0, -2.6), radius: 1.3, height: 2, prompt: 'Read the brochure', lines: ['brochure'], enabled: () => S.phase === 'choose' || S.phase === 'intro' });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('pitch'); await ctx.wait(0.4); await voice.say('forever');
    if (replay) { await ctx.wait(1); await voice.say('twist'); await ctx.wait(0.6); await voice.say('twist_ask'); }
    else { await ctx.wait(0.8); await voice.say('ask'); }
    S.phase = 'choose'; S.idle = 0; cameo.start();
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -3, z: 2, rotY: Math.PI },
    walkable: (x, z) => {
      if (S.where === 'dream') return Math.hypot(x - DREAM.x, z - DREAM.z) < 3;
      if (S.where === 'street') return Math.abs(x - STREET.x) < 6.5 && Math.abs(z - STREET.z) < 1.4;
      if (S.where === 'real') return Math.abs(x - REAL.x) < 8 && z > REAL.z - 1 && z < REAL.z + 4;
      return Math.abs(x) < HALF - 0.4 && z > BACK + 0.5 && z < FRONT;
    },
    blockers: () => (S.where !== 'clinic' ? [{ x: STREET.x - 3.2, z: STREET.z + 0.6, r: 0.4 }] : [
      { x: -6.2, z: -2.4, w: 2.7, d: 1 }, { x: tech.position.x, z: tech.position.z, r: 0.4 }, { x: -6.6, z: 1.6, w: 3, d: 0.9 }, { x: -9, z: -3.6, r: 0.4 },
      ...tanks.map((t) => ({ x: t.position.x, z: t.position.z, r: 0.85 })), { x: TANK.x, z: TANK.z, r: 0.85 }, { x: DEMO.x, z: DEMO.z, w: 1, d: 1.5 }]),
    update(dt, t) {
      tanks.forEach((tk, i) => { const p = tk.userData.person; p.position.y = 0.5 + Math.sin(t * 0.6 + i) * 0.06; p.rotation.y = Math.sin(t * 0.2 + i) * 0.3; tk.userData.light.material.color.setHSL(0.45, 0.8, 0.5 + Math.sin(t * 2 + i) * 0.15); });
      animatePerson(tech, t, { energy: 0.3 }); animatePerson(friend, t, { energy: 0.4 });
      // rain on the street
      const m = new THREE.Matrix4();
      drops.forEach((d, i) => { d[1] -= dt * 9; if (d[1] < 0) d[1] += 6; m.setPosition(d[0], d[1], d[2]); rain.setMatrixAt(i, m); }); rain.instanceMatrix.needsUpdate = true;
      // the dream: the crowd cheers, confetti falls
      if (S.dreamT >= 0 || S.where === 'dream') {
        crowd.forEach((p, i) => { p.userData.body.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.25; });
        const q = new THREE.Quaternion(), e = new THREE.Euler();
        bits.forEach((b, i) => { b[1] -= dt * 1.2; if (b[1] < 0) b[1] += 8; e.set(t * 2 + b[3], t + b[3], 0); q.setFromEuler(e); m.compose(V(b[0] + Math.sin(t + b[3]) * 0.3, b[1], b[2]), q, V(1, 1, 1)); confetti.setMatrixAt(i, m); });
        confetti.instanceMatrix.needsUpdate = true; confetti.instanceColor && (confetti.instanceColor.needsUpdate = true);
        if (S.where === 'dream') player.pos.y = 0.8; dreamer.visible = false;
      }
      // pulled back out of the dream: it was you, floating in your tank, all along
      if (S.pull) { S.pullT = (S.pullT ?? 0) + dt; if (S.pullT > 2.4 && S.where === 'dream') S.where = 'tank'; }
      if (S.where === 'tank') { player.pos.set(TANK.x, 0.5 + Math.sin(t * 0.6) * 0.06, TANK.z); mine.userData.light.material.color.setHSL(0.45, 0.8, 0.5 + Math.sin(t * 2) * 0.15); }
      if (S.phase === 'choose' && S.where === 'clinic') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) { if (replay) stayIn(true); else goHome(true); }
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.where === 'dream') {
        // after you plug in, pull back out of the dream: through it, to you, floating in your tank
        if (S.pull) { const u = easeInOut(clamp(S.pullT / 2.4)); return { pos: DREAM.clone().add(V(0, 6 + u * 20, 11 + u * 20)), look: DREAM.clone().add(V(0, 1, -1)), stiffness: 3 }; }
        return { pos: DREAM.clone().add(V(0, 6, 11)), look: DREAM.clone().add(V(0, 1.6, -1)), stiffness: 3 };
      }
      if (S.where === 'tank') { const u = easeInOut(clamp((S.pullT - 2.4) / 4)); return { pos: TANK.clone().add(V(-1.5 - u * 3, 2.6 + u * 1.5, 4 + u * 6)), look: TANK.clone().add(V(-1 - u * 2, 1.7, 0)), stiffness: 2 }; }
      if (S.where === 'street') return { pos: STREET.clone().add(V(0, 4.5, 11)), look: STREET.clone().add(V(-0.5, 1.2, 0)), stiffness: 3 };
      if (S.where === 'real') return { pos: REAL.clone().add(V(0, 4.4, 10.5)), look: REAL.clone().add(V(-1, 1.4, -1)), stiffness: 3 };
      const look = V(clamp(pl.pos.x, -3.5, 3.5), 1.8, -1.2);
      return { pos: look.clone().add(V(0, 5, 13)), look, stiffness: 2.2 };
    },
    dispose() {
      voice.stop(); player.locked = false; player.pos.y = 0;
    },
  });
}
