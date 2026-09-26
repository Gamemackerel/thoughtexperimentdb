// Vignette: The Monty Hall Problem.
// A game show. Three doors: behind one a car, behind the others goats. Pick a door; the host (who knows where the car
// is) opens another door to show a goat; stay or switch. Play a few rounds; then press the big button to play a hundred
// times each way and watch the tally settle at a third for staying and two thirds for switching.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk } from '../core/extras.js';
import { makeGoat, makeCar, textTexture } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DOOR_X = [-4, 0, 4], DOOR_Z = -3, BACK = -6.2;
const HOST_HOME = V(6.8, 0, -0.9), BUTTON = V(5.4, 0, 0.4);
const COLORS = [0xe0674f, 0xf2c14e, 0x5b7fa6];

export default function montyHall(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0x2a2233);
  stage.scene.fog = new THREE.Fog(0x2a2233, 40, 110);
  stage.hemi.intensity = 1.1; stage.sun.intensity = 1.6;
  voice.load('monty-hall');

  // ---- the studio: a glossy floor, a curtain wall, three big doors with alcoves behind, lights, an audience
  const slab = mesh(new THREE.BoxGeometry(20, 1.2, 15), clay(0x3a2f45)); slab.position.set(0, -0.62, 0); root.add(slab);
  const stageFloor = mesh(new THREE.BoxGeometry(17, 0.06, 8), clay(0x7a2f3a, { roughness: 0.3 })); stageFloor.position.set(0, 0.02, -2.2); root.add(stageFloor);
  const back = mesh(new THREE.BoxGeometry(18, 7, 0.3), clay(0x5a2a36)); back.position.set(0, 3.5, BACK - 0.3); root.add(back);
  const doors = DOOR_X.map((x, i) => {
    const frameM = clay(0xf2c14e, { metalness: 0.4, roughness: 0.4 });
    for (const [dx, y, w, h] of [[-1.1, 1.6, 0.2, 3.3], [1.1, 1.6, 0.2, 3.3], [0, 3.3, 2.4, 0.25]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.4), frameM); b.position.set(x + dx, y, DOOR_Z); root.add(b); }
    for (const dx of [-1.2, 1.2]) { const side = mesh(new THREE.BoxGeometry(0.2, 3.3, 2.9), clay(0x3a2f45)); side.position.set(x + dx, 1.65, DOOR_Z - 1.5); root.add(side); }
    const hinge = new THREE.Group(); hinge.position.set(x - 1, 0, DOOR_Z + 0.05); root.add(hinge);
    const panel = mesh(new THREE.BoxGeometry(2, 3.1, 0.14), clay(COLORS[i])); panel.position.set(1, 1.55, 0); hinge.add(panel);
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: textTexture(String(i + 1), { w: 128, h: 128, font: 'bold 96px sans-serif', bg: '#fbf6ea' }) })); num.position.set(1, 2.1, 0.08); hinge.add(num);
    const bulbs = []; for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff3c4 })); b.position.set(x - 1 + k * 0.33, 3.55, DOOR_Z + 0.2); root.add(b); bulbs.push(b); }
    const goat = makeGoat(); goat.position.set(x, 0, DOOR_Z - 1.6); goat.rotation.y = 0.3; root.add(goat);
    const car = makeCar(); car.scale.setScalar(0.62); car.position.set(x, 0, DOOR_Z - 1.6); car.rotation.y = 0.5; root.add(car);
    return { x, hinge, open: 0, bulbs, goat, car };
  });
  const spots = DOOR_X.map((x) => { const s = new THREE.SpotLight(0xfff1dc, 60, 14, 0.4, 0.6); s.position.set(x, 7, 2); s.target.position.set(x, 0, DOOR_Z); root.add(s, s.target); return s; });
  const audience = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) { const p = makePerson({ color: [0x5b7fa6, 0xe2a93b, 0x7a5a8c, 0x6f9a4f, 0xc9705a][(r * 9 + c) % 5], scale: 0.9 }); p.position.set(-7.2 + c * 1.8 + r * 0.9, 0, 4.6 + r * 1.4); p.rotation.y = Math.PI; p.userData.body.position.y = -0.3; root.add(p); audience.push(p); }
  // the host, the tally board and the big button
  const host = makePerson({ color: 0xf6f1e7 }); host.position.copy(HOST_HOME); host.rotation.y = -0.6; root.add(host);
  const tie = mesh(new THREE.BoxGeometry(0.28, 0.1, 0.05), clay(0xe0674f)); tie.position.set(0, 1.36, 0.33); host.userData.body.add(tie);
  const mic = mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.4, 8), clay(0x2b2a33)); mic.position.set(0.3, 1.3, 0.3); mic.rotation.x = -0.4; host.userData.body.add(mic);
  const tally = textTexture([''], { w: 512, h: 320, bg: '#1b1a20', fg: '#f6efe0', font: '40px sans-serif' });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), new THREE.MeshBasicMaterial({ map: tally })); board.position.set(-6.4, 3.9, -3.4); board.rotation.y = 0.35; root.add(board);
  const podium = mesh(new THREE.CylinderGeometry(0.4, 0.5, 1, 16), clay(0xf2c14e)); podium.position.copy(BUTTON).setY(0.5); root.add(podium);
  const button = mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.16, 20), clay(0xe0674f).clone()); button.position.copy(BUTTON).setY(1.08); root.add(button);

  // ---- state
  const S = { phase: 'intro', round: 0, car: 0, pick: -1, opened: -1, final: -1, stats: { stay: [0, 0], switch: [0, 0] }, sim: -1, hostTo: HOST_HOME.clone() };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/monty-hall.json', 'The Monty Hall Problem');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.z = -0.8; root.add(gp); level.ground.push(gp);
  const rnd = seeded(1990);

  function drawTally() {
    const g = tally.userData.ctx; g.fillStyle = '#1b1a20'; g.fillRect(0, 0, 512, 320);
    g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#f2c14e'; g.font = 'bold 38px sans-serif'; g.fillText('CARS WON', 28, 50);
    g.font = '36px sans-serif'; g.fillStyle = '#f6efe0';
    const row = (label, [w, n], y) => { g.fillText(label, 28, y); g.fillText(`${w} / ${n}`, 250, y); g.fillStyle = '#3f8f86'; g.fillRect(28, y + 28, n ? (w / n) * 440 : 0, 12); g.fillStyle = '#f6efe0'; };
    row('Stayed', S.stats.stay, 130); row('Switched', S.stats.switch, 230);
    tally.needsUpdate = true;
  }
  drawTally();
  function setRound() {
    S.car = Math.floor(Math.random() * 3); S.pick = -1; S.opened = -1; S.final = -1;
    doors.forEach((d, i) => { d.goat.visible = i !== S.car; d.car.visible = i === S.car; });
  }
  setRound();

  // ---- the frog: behind the first door the host opens, next to the goat; it hops out and off the stage
  const frog = makeFrog(); root.add(frog);
  let cameo = { start() {}, update() {}, active: false, done: false };
  const frogFrom = (i) => { const x = DOOR_X[i]; cameo = frogCameo(frog, [[x + 0.6, DOOR_Z - 1.2], { face: [x + 0.6, 4] }, { wait: 1.6 }, [x + 1, DOOR_Z + 0.6], [x + 1.8, DOOR_Z + 2.2], [x + 2.6, DOOR_Z + 3.8], [x + 3.4, DOOR_Z + 5.4], [x + 4.4, DOOR_Z + 7]]); cameo.start(); level.__frog = cameo; };

  for (let i = 0; i < 3; i++) {
    interact.add({ pos: V(DOOR_X[i], 0, DOOR_Z + 1.4), radius: 1.3, height: 3.4,
      prompt: () => (S.phase === 'pick' ? `Choose door ${i + 1}` : i === S.pick ? `Stay with door ${i + 1}` : `Switch to door ${i + 1}`),
      enabled: () => S.phase === 'pick' || (S.phase === 'decide' && i !== S.opened),
      onUse: () => (S.phase === 'pick' ? pick(i) : decide(i)) });
  }
  async function pick(i) {
    S.pick = i; S.phase = 'host'; ctx.speak(host, `Door number ${i + 1}!`, { offset: [0, 2.6, 0] });
    const goats = [0, 1, 2].filter((k) => k !== i && k !== S.car);
    S.opened = goats[Math.floor(Math.random() * goats.length)];
    S.hostTo = V(DOOR_X[S.opened] + 1.2, 0, DOOR_Z + 1.2);
    if (S.round === 0) await voice.say('host_opens'); else await ctx.wait(2.2);
    doors[S.opened].open = 1;
    if (!level.__frogStarted) { level.__frogStarted = true; frogFrom(S.opened); }
    await ctx.wait(1.2);
    if (S.round === 0) await voice.say('ask');
    S.hostTo = HOST_HOME.clone(); S.phase = 'decide';
  }
  async function decide(i) {
    S.final = i; S.phase = 'reveal';
    const switched = i !== S.pick, won = i === S.car;
    const st = S.stats[switched ? 'switch' : 'stay']; st[1]++; if (won) st[0]++;
    doors.forEach((d) => (d.open = 1));
    await ctx.wait(1.2);
    ctx.speak(host, won ? 'A brand new car!' : 'A goat! Lovely animal.', { offset: [0, 2.6, 0] });
    audience.forEach((p) => (p.userData.cheer = won ? 1.5 : 0.4));
    drawTally();
    await voice.say(won ? 'car' : 'goat', { once: false });
    S.round++;
    if (S.round === 1) await voice.say('think');
    if (S.round === 2) await voice.say('hint');
    if (S.round === 3) await voice.say('sim_offer');
    await ctx.wait(1);
    doors.forEach((d) => (d.open = 0)); await ctx.wait(1.1);
    setRound(); S.phase = 'pick';
  }
  interact.add({ pos: BUTTON.clone().add(V(-1, 0, 0.4)), radius: 1.4, height: 1.8, prompt: 'Play it a hundred times', enabled: () => S.phase === 'pick' && S.round >= 3,
    onUse: async () => {
      S.phase = 'sim'; S.sim = 0; await voice.say('sim');
      for (let g = 0; g < 200; g++) {                         // a hundred games staying, a hundred switching
        const car = Math.floor(rnd() * 3), first = Math.floor(rnd() * 3), sw = g % 2 === 1;
        const st = S.stats[sw ? 'switch' : 'stay']; st[1]++; if (sw ? first !== car : first === car) st[0]++;
        S.simDoor = g % 3; if (g % 4 === 0) drawTally();
        await ctx.wait(0.035);
      }
      drawTally(); S.simDoor = -1;
      await voice.say('sim_result'); await ctx.wait(0.4); await voice.say('end'); await ctx.wait(1);
      save.complete('monty-hall');
      const [sw, sn] = S.stats.switch, [tw, tn] = S.stats.stay;
      ctx.gameOver({ title: 'Switching wins two times in three', text: `Stayed: ${tw} cars in ${tn}. Switched: ${sw} in ${sn}. Your first pick is right one time in three, and the host's goat never changes that. Switching wins whenever your first pick was wrong.` });
    } });

  talk(ctx, { who: host, radius: 1.8, offset: [0, 2.6, 0], enabled: () => S.phase === 'pick' || S.phase === 'decide', lines: ['Big smile for the cameras!', 'I know where the car is. I always know.', "Don't overthink it. Or do.", 'Nobody ever believes me about the goats.'] });
  audience.slice(0, 9).forEach((p, k) => talk(ctx, { who: p, radius: 1.5, offset: [0, 2.4, 0], enabled: () => S.phase === 'decide' || S.phase === 'pick', lines: (i) => (S.phase === 'decide' ? ['SWITCH!', 'STAY!', 'It is fifty-fifty now!', 'Go with your gut!'][(k + i) % 4] : ['Ooh, pick three!', 'I would have picked the red one.', 'My cousin won a goat once.'][(k + i) % 3]) }));
  doors.forEach((d) => talk(ctx, { who: d.goat, radius: 1.8, offset: [0, 2, 0], prompt: 'Say hello to the goat', enabled: () => d.goat.visible && d.open > 0.5 && S.phase !== 'sim', lines: ['Meh.', 'Mehhh.', '(It eats part of the door.)'] }));

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); await voice.say('pick'); S.phase = 'pick'; })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 1.8, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < 8 && z > DOOR_Z + 0.6 && z < 3.4,
    blockers: () => [{ x: host.position.x, z: host.position.z, r: 0.45 }, { x: BUTTON.x, z: BUTTON.z, r: 0.55 }],
    update(dt, t) {
      doors.forEach((d, i) => {
        const open = S.phase === 'sim' ? (S.simDoor === i ? 1 : 0.2) : d.open;
        d.hinge.rotation.y = lerp(d.hinge.rotation.y, -open * 1.7, 1 - Math.exp(-dt * (S.phase === 'sim' ? 20 : 5)));
        const picked = i === S.pick || i === S.final;
        d.bulbs.forEach((b, k) => b.material.color.set(picked && Math.sin(t * 10 + k) > 0 ? 0xffe066 : 0x8a7a5a));
        d.goat.userData.body.rotation.y = Math.sin(t * 0.8 + i) * 0.2;
      });
      // the host walks over to open a door, then back
      const hd = S.hostTo.clone().sub(host.position).setY(0);
      if (hd.length() > 0.2) { host.position.addScaledVector(hd.normalize(), dt * 3); host.rotation.y = Math.atan2(hd.x, hd.z); animatePerson(host, t * 2, { energy: 1 }); }
      else { host.rotation.y = lerp(host.rotation.y, Math.atan2(player.pos.x - host.position.x, player.pos.z - host.position.z), 0.05); animatePerson(host, t, { energy: 0.4 }); }
      audience.forEach((p, i) => { p.userData.cheer = Math.max(0, (p.userData.cheer ?? 0) - dt); animatePerson(p, t * (1 + (p.userData.cheer ?? 0)), { phase: i, energy: 0.3 + (p.userData.cheer ?? 0) }); p.userData.body.position.y -= 0.3; });
      button.material.color.set(S.round >= 3 && S.phase === 'pick' ? (Math.sin(t * 5) > 0 ? 0xff5a4a : 0xe0674f) : 0x8a4a42);
      level.__frog.update(dt);
    },
    camera(pl) {
      const look = V(pl.pos.x * 0.3, 1.8, -1.8);
      return { pos: look.clone().add(V(0, 5.2, 12.5)), look, stiffness: 2.2 };
    },
    dispose() { voice.stop(); },
  });
}
