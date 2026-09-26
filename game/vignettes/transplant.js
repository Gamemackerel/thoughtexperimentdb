// Vignette: The Transplant Surgeon.
// You're a surgeon. Five patients on the ward will die without a transplant: a heart, a liver, two lungs, a kidney, a
// pancreas. In the waiting room, a healthy young man is in for a check-up, and he would be a match for all five.
// Send him home; call the palliative care team (the five are wheeled away to be kept comfortable, and he never knows);
// or take him to theatre, where he lies asleep, everything is ready, and it's your hands now (begin, or wake him up).
// Nothing is shown.
import {
  THREE, palette, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 13, BACK = -5.5, FRONT = 3.4;
const THEATRE = V(-HALF + 0.6, 0, -1.2);
const EXIT = V(HALF - 0.6, 0, 1.6);
const SEAT = V(10.4, 0, -3.9);
const PHONE = V(6.3, 0, BACK);
const TH = V(70, 0, 0);                            // the operating theatre, a room of its own off to the side
const NEEDS = ['a heart', 'a liver', 'lungs', 'a kidney', 'a pancreas'];

function makeBed() {
  const g = new THREE.Group();
  const frame = mesh(new THREE.BoxGeometry(1.5, 0.55, 2.7), clay(0xf6f6f2)); frame.position.y = 0.62; g.add(frame);
  for (const z of [-1.35, 1.35]) { const end = mesh(new THREE.BoxGeometry(1.6, z < 0 ? 1.4 : 0.9, 0.1), clay(0xb8c7c2)); end.position.set(0, z < 0 ? 0.7 : 0.45, z); g.add(end); }
  const blanket = mesh(new THREE.BoxGeometry(1.52, 0.18, 1.8), clay(0x9cc0d0)); blanket.position.set(0, 0.98, 0.4); g.add(blanket);
  const pillow = mesh(new THREE.BoxGeometry(1, 0.2, 0.5), clay(0xffffff)); pillow.position.set(0, 1, -0.95); g.add(pillow);
  return g;
}

export default function transplant(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xeef2f0);
  stage.scene.fog = new THREE.Fog(0xeef2f0, 40, 120);
  voice.load('transplant');
  const frame = makeFramer(stage);

  // ---- the ward: pale green walls, a long window, five beds; a waiting area; the theatre doors
  const slab = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 1.2, 10.5), clay(0xc9d3cf)); slab.position.set(0, -0.62, -1); root.add(slab);
  const floor = mesh(new THREE.BoxGeometry(HALF * 2, 0.06, 9.4), clay(0xe6ece8)); floor.position.set(0, 0.0, -1); floor.receiveShadow = true; root.add(floor);
  const wallM = clay(0xd8e4e0);
  const back = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 7, 0.4), wallM); back.position.set(0, 3.5, BACK - 0.2); root.add(back);
  const left = mesh(new THREE.BoxGeometry(0.4, 7, 10), wallM); left.position.set(-(HALF + 0.2), 3.5, -1); root.add(left);
  // the right wall has the way out in it (EXIT.z ± 0.95), wide enough for a bed
  for (const [z0, z1] of [[-6, EXIT.z - 0.95], [EXIT.z + 0.95, 4]]) { const e = mesh(new THREE.BoxGeometry(0.4, 7, z1 - z0), wallM); e.position.set(HALF + 0.2, 3.5, (z0 + z1) / 2); root.add(e); }
  const lintel = mesh(new THREE.BoxGeometry(0.4, 7 - 2.7, 1.9), wallM); lintel.position.set(HALF + 0.2, 2.7 + (7 - 2.7) / 2, EXIT.z); root.add(lintel);
  const stripe = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 0.2, 0.06), clay(0x3f8f86)); stripe.position.set(0, 1.4, BACK + 0.02); root.add(stripe);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.8), new THREE.MeshBasicMaterial({ color: 0xcfe4f0 })); win.position.set(-2, 4.1, BACK + 0.02); root.add(win);
  for (let i = 0; i <= 6; i++) { const m = mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), clay(0xf6f6f2)); m.position.set(-6.5 + i * 1.5, 4.1, BACK + 0.05); root.add(m); }
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 10), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.z = -1; root.add(gp);

  // five beds, each with its patient and drip (a unit, so it can be wheeled away)
  const patients = [], beds = [];
  for (let i = 0; i < 5; i++) {
    const x = -8.4 + i * 3.1, bed = new THREE.Group(); bed.add(makeBed()); bed.position.set(x, 0, BACK + 1.7); root.add(bed); beds.push(bed);
    const p = makePerson({ color: 0xcfe0ee }); p.position.set(0, 0.72, 1.05); p.rotation.x = -1.25; p.userData.body.position.y = 0; bed.add(p); patients.push(p);
    const drip = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), clay(0xb8c7c2)); drip.position.set(1, 1.1, -0.7); bed.add(drip);
    const bag = mesh(new THREE.BoxGeometry(0.22, 0.32, 0.08), clay(0xe7f1f4)); bag.position.set(1, 2.1, -0.7); bed.add(bag);
  }
  // on the wall by the waiting area, the phone to the palliative care team
  const phone = new THREE.Group();
  const plate = mesh(new THREE.BoxGeometry(0.7, 0.9, 0.08), clay(0xf6f6f2)); plate.position.set(0, 1.6, 0.04); phone.add(plate);
  const handset = mesh(new THREE.BoxGeometry(0.14, 0.55, 0.12), clay(0x2b2a33)); handset.position.set(-0.12, 1.62, 0.14); phone.add(handset);
  const keys = mesh(new THREE.BoxGeometry(0.2, 0.3, 0.04), clay(0x8b909a)); keys.position.set(0.14, 1.6, 0.1); phone.add(keys);
  const pSign = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#3f8f86'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#f6efe0'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('PALLIATIVE', 128, 40); g.fillText('CARE TEAM', 128, 74); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const psign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: pSign })); psign.position.set(0, 2.35, 0.03); phone.add(psign);
  phone.position.copy(PHONE); root.add(phone);
  // the waiting area: chairs, a plant, a magazine table; the healthy visitor
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group(); const seat = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), clay(0x3f8f86)); seat.position.y = 0.5; c.add(seat);
    const bk = mesh(new THREE.BoxGeometry(0.7, 0.7, 0.1), clay(0x3f8f86)); bk.position.set(0, 0.85, -0.32); c.add(bk);
    for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), clay(0x8b909a)); l.position.set(x, 0.25, z); c.add(l); }
    c.position.set(9.2 + i * 1.2, 0, SEAT.z); root.add(c);
  }
  const plant = new THREE.Group(); const pot = mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 12), clay(0xc9705a)); pot.position.y = 0.3; plant.add(pot);
  for (let i = 0; i < 5; i++) { const lf = mesh(new THREE.SphereGeometry(0.3, 10, 8), clay(0x6f9a4f)); lf.scale.set(0.5, 1.4, 0.5); lf.position.set(Math.cos(i * 1.3) * 0.2, 1, Math.sin(i * 1.3) * 0.2); lf.rotation.z = Math.cos(i * 1.3) * 0.4; plant.add(lf); }
  plant.position.set(12.6, 0, -4.4); root.add(plant);
  const visitor = makePerson({ color: palette.one }); visitor.position.copy(SEAT); visitor.userData.body.position.y = -0.42; root.add(visitor);
  const mag = mesh(new THREE.BoxGeometry(0.5, 0.36, 0.04), clay(0xe0674f)); mag.position.set(0, 1.25, 0.42); mag.rotation.x = -0.4; visitor.userData.body.add(mag);
  // the theatre doors
  const doors = [];
  for (const s of [-1, 1]) {
    const d = new THREE.Group(); const panel = mesh(new THREE.BoxGeometry(0.1, 2.6, 1), clay(0xb8c7c2)); panel.position.set(0, 1.3, s * 0.5); d.add(panel);
    const port = new THREE.Mesh(new THREE.CircleGeometry(0.18, 20), new THREE.MeshBasicMaterial({ color: 0x9cc0d0 })); port.position.set(0.06, 1.8, s * 0.5); port.rotation.y = Math.PI / 2; d.add(port);
    d.position.set(-HALF + 0.05, 0, THEATRE.z + s * 0.02); root.add(d); doors.push({ d, s });
  }
  const theatreSign = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2b2a33'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#f6efe0'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('THEATRE', 128, 45); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const tsign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: theatreSign })); tsign.position.set(-HALF + 0.06, 3, THEATRE.z); tsign.rotation.y = Math.PI / 2; root.add(tsign);
  const inUse = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0x5a3030 })); inUse.position.set(-HALF + 0.06, 3.4, THEATRE.z + 0.9); inUse.rotation.y = Math.PI / 2; root.add(inUse);
  const exitDoor = new THREE.Group(); const exitPanel = mesh(new THREE.BoxGeometry(0.1, 2.6, 1.8), clay(0x3f8f86)); exitPanel.position.set(0, 1.3, 0.9); exitDoor.add(exitPanel);
  exitDoor.position.set(HALF + 0.05, 0, EXIT.z - 0.9); root.add(exitDoor);

  // ---- the operating theatre: a table under a round lamp, a man asleep under a sheet, the anaesthetist at his head,
  // a nurse, and a trolley with five cool boxes. Nothing else.
  const th = new THREE.Group(); th.position.copy(TH); root.add(th);
  const thFloor = mesh(new THREE.BoxGeometry(10, 0.06, 8), clay(0xdfe8e6)); thFloor.receiveShadow = true; th.add(thFloor);
  const thSlab = mesh(new THREE.BoxGeometry(10.6, 1.2, 8.6), clay(0xc9d3cf)); thSlab.position.y = -0.62; th.add(thSlab);
  const thWallM = clay(0xcfe0dc);
  const thBack = mesh(new THREE.BoxGeometry(10.6, 6, 0.3), thWallM); thBack.position.set(0, 3, -4.15); th.add(thBack);
  for (const sx of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.3, 6, 8.3), thWallM); e.position.set(sx * 5.15, 3, 0); th.add(e); }
  const table = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(2.4, 0.16, 0.8), clay(0x9aa6ab)); top.position.y = 0.95; table.add(top);
  const col = mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.9, 12), clay(0x8b909a)); col.position.y = 0.45; table.add(col);
  table.position.set(0, 0, -0.6); th.add(table);
  const sleeper = makePerson({ color: palette.one }); sleeper.rotation.z = Math.PI / 2; sleeper.position.set(1.05, 1.18, -0.6); th.add(sleeper);
  const sheet = mesh(new THREE.BoxGeometry(1.5, 0.3, 0.86), clay(0x9cc0d0)); sheet.position.set(0.35, 1.2, -0.6); th.add(sheet);
  const lamp = new THREE.Group(); const disc = mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.22, 24), clay(0xe7ecee)); lamp.add(disc);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: 0xfff8e6 })); glow.rotation.x = Math.PI / 2; glow.position.y = -0.12; lamp.add(glow);
  const arm = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), clay(0x8b909a)); arm.position.y = 1.2; lamp.add(arm);
  lamp.position.set(0, 3.4, -0.6); th.add(lamp);
  const thLight = new THREE.SpotLight(0xfff4e0, 30, 8, 0.7, 0.6, 1.2); thLight.position.set(0, 3.3, -0.6); thLight.target.position.set(0, 0, -0.6); th.add(thLight, thLight.target);
  const scrubs = 0x5f9e8f;
  const anaes = makePerson({ color: scrubs }); anaes.position.set(-2, 0, -0.9); anaes.rotation.y = Math.PI / 2; th.add(anaes);
  const nurse = makePerson({ color: scrubs }); nurse.position.set(0.7, 0, -2.1); th.add(nurse);
  const mcvs = document.createElement('canvas'); mcvs.width = 256; mcvs.height = 128; const mg = mcvs.getContext('2d'); const mTex = new THREE.CanvasTexture(mcvs);
  const monitor = new THREE.Group(); const mpole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), clay(0x8b909a)); mpole.position.y = 0.8; monitor.add(mpole);
  const mbox = mesh(new THREE.BoxGeometry(0.8, 0.5, 0.2), clay(0x5d6470)); mbox.position.y = 1.8; monitor.add(mbox);
  const mscr = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.36), new THREE.MeshBasicMaterial({ map: mTex })); mscr.position.set(0, 1.8, 0.11); monitor.add(mscr);
  monitor.position.set(-2.6, 0, -2); monitor.rotation.y = 0.5; th.add(monitor);
  const trolley = new THREE.Group(); const ttop = mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), clay(0xb8c7c2)); ttop.position.y = 0.85; trolley.add(ttop);
  for (const [x, z] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), clay(0x8b909a)); l.position.set(x, 0.42, z); trolley.add(l); }
  for (let i = 0; i < 5; i++) {
    const cb = mesh(new THREE.BoxGeometry(0.3, 0.32, 0.4), clay(0xf6f6f2)); cb.position.set(-0.68 + i * 0.34, 1.05, 0); trolley.add(cb);
    const lid = mesh(new THREE.BoxGeometry(0.31, 0.06, 0.41), clay(0x4a7fb0)); lid.position.set(-0.68 + i * 0.34, 1.24, 0); trolley.add(lid);
  }
  trolley.position.set(2.7, 0, -1.9); th.add(trolley);
  const thAt = (x, z) => TH.clone().add(V(x, 0, z));

  // the frog comes to the waiting room, takes the chair next to him, waits its turn a while, and gives up
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const cameo = frogCameo(frog, [[HALF - 1, 3.2], [11.6, 1.6], [11.2, 0], [11, -1.8], { at: [11.6, SEAT.z + 0.1], y: 0.55, height: 1 }, { face: [11.6, 3] },
    { wait: 3.2, act: (f, u, t) => (f.userData.body.rotation.z = u > 0.6 ? Math.sin(t * 3) * 0.08 : 0) }, { at: [12.2, -2], y: 0, height: 0.9 }, [12.6, -0.2], [12.4, 1.8], [HALF - 0.5, 3.4]]);

  // ---- state
  const S = { phase: 'ward', pt: 0, choice: null, fade: 0, dark: false, inTheatre: false, thT: 0 };
  const level = { root, ground: [gp], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/transplant.json', 'The Transplant Surgeon');
  const canChoose = () => S.phase === 'ward' && voice.said.has('ask');

  const PLEAS = [
    ['My heart gives out if I climb the stairs.', 'They say I need a new one. Soon.'],
    ["It's my liver. Nobody's on the list for my type.", 'I just want to see my granddaughter start school.'],
    ['Lungs. Both of them. I can hear myself breathing.', "Don't worry about me, doctor."],
    ['Kidney. Dialysis three times a week. It wears you out.', 'I used to run marathons.'],
    ['Pancreas. The waiting is the worst part.', 'Any news, doctor?'],
  ];
  patients.forEach((p, k) => talk(ctx, { who: p, radius: 2.2, offset: [0, 1.9, 0], prompt: 'Talk to your patient', enabled: () => S.phase === 'ward',
    lines: (i) => (S.fade > 0 ? 'I feel… better.' : PLEAS[k][i % PLEAS[k].length]) }));
  talk(ctx, { who: visitor, radius: 2, offset: [0, 2.6, 0], enabled: () => S.phase === 'ward' && !voice.said.has('ask'),
    lines: ["Just a check-up. Never been ill a day in my life.", 'The magazines here are ancient.', 'Is it my turn yet?'] });
  look(ctx, { pos: V(-2, 0, BACK + 3.4), radius: 1.6, height: 4.4, prompt: 'Look out of the window', lines: ['window'], enabled: () => S.phase === 'ward' });

  interact.add({ pos: () => SEAT.clone().add(V(0, 0, 1.3)), radius: 1.7, height: 2.6, prompt: 'Tell him he\'s healthy', enabled: canChoose,
    onUse: async () => {
      S.phase = 'letgo'; S.choice = 'letgo'; player.enabled = false;
      ctx.speak(visitor, 'Thanks, doctor! See you next year.');
      visitor.userData.body.position.y = 0; S.walker = { who: visitor, path: [V(10.4, 0, -1.4), EXIT.clone().add(V(0.8, 0, 0))] };
      await ctx.wait(4); await voice.say('letgo_1'); await ctx.wait(0.6); await voice.say('letgo_2'); await ctx.wait(1.2);
      save.complete('transplant');
      ctx.gameOver({ title: 'You sent him home', text: 'He walked out into the sunshine. Five of your patients will die waiting. It is the lever\'s arithmetic, and almost nobody would do otherwise.' });
    } });
  interact.add({ pos: () => SEAT.clone().add(V(-1.3, 0, 1)), radius: 1.5, height: 2.6, prompt: 'Take him to theatre', enabled: canChoose, terminal: true,
    onUse: async () => {
      S.phase = 'escort'; S.choice = 'operate'; player.enabled = false;
      ctx.speak(visitor, 'Oh! Right now? All right.');
      visitor.userData.body.position.y = 0; S.walker = { who: visitor, path: [V(8.6, 0, -0.6), V(-9, 0, -0.6), THEATRE.clone().add(V(-0.8, 0, 0))] };   // down the aisle, not through the beds
      player.locked = true; player.enabled = true; player.target = THEATRE.clone().add(V(0.9, 0, 1.4));
      await ctx.wait(11);
      // through the doors: the theatre
      S.dark = true; await ctx.wait(1.1);
      player.locked = false; S.inTheatre = true; S.phase = 'theatre'; S.thT = 0; player.place(TH.x + 0.3, TH.z + 2.7, Math.PI);
      S.dark = false; await ctx.wait(1);
      await voice.say('theatre_1'); await ctx.wait(0.4); await voice.say('theatre_2'); S.ready = true; S.thT = 0;
    } });
  // in the theatre: begin, or wake him up (and if you just stand there, the anaesthetist asks, and then wakes him)
  interact.add({ pos: thAt(0.5, 0.3), radius: 1.3, height: 2.2, prompt: 'Begin', terminal: true, enabled: () => S.phase === 'theatre' && S.ready,
    onUse: async () => {
      S.phase = 'begin'; player.enabled = false; S.dark = true;
      await ctx.wait(2.4);
      S.inTheatre = false; player.place(THEATRE.x + 1.2, THEATRE.z + 1.4, Math.PI / 2); player.enabled = false;
      patients.forEach((p) => { p.rotation.x = -0.35; });       // back on the ward: they sit up, well
      await voice.say('operate_1'); S.dark = false; S.phase = 'after';
      await ctx.wait(2.2); await voice.say('operate_2'); await ctx.wait(1.2);
      save.complete('transplant');
      ctx.gameOver({ title: 'You operated', text: 'Five people will go home. One healthy man came in for a check-up and never left. The numbers are the lever\'s; almost everyone calls this murder.' });
    } });
  async function wake() {
    if (S.phase !== 'theatre') return;
    S.phase = 'wake'; player.enabled = false;
    await voice.say('wake_1', { urgent: true });
    sheet.visible = false; S.sitUp = 0; await ctx.wait(1.5);
    ctx.speak(sleeper, 'Is that it? All clear?', { offset: [0, 2.4, 0] });
    await ctx.wait(2); await voice.say('wake_2'); await ctx.wait(1.2);
    save.complete('transplant');
    ctx.gameOver({ title: 'You stopped', text: 'You got as far as the theatre. He went home knowing nothing, and five of your patients will die waiting.' });
  }
  interact.add({ pos: thAt(-2.2, 0.4), radius: 1.2, height: 2.4, prompt: 'Wake him up', terminal: true, enabled: () => S.phase === 'theatre' && S.ready, onUse: wake });

  // the phone: let them die (kept comfortable) rather than kill him
  interact.add({ pos: PHONE.clone().add(V(0, 0, 1.3)), radius: 1.4, height: 2.8, prompt: 'Request the palliative care team', enabled: canChoose, terminal: true,
    onUse: async () => {
      S.phase = 'palliative'; S.choice = 'palliative'; player.enabled = false;
      await voice.say('palliative_1', { urgent: true });
      S.wheel = beds.map((b, i) => ({ b, delay: (4 - i) * 1.8, path: [V(b.position.x, 0, -0.6), V(EXIT.x - 1.5, 0, -0.6), V(EXIT.x - 1.5, 0, EXIT.z), V(HALF + 4, 0, EXIT.z)] }));
      S.wheelT = 0;                                                       // (the bed nearest the door goes first)
      await ctx.wait(13);
      ctx.speak(visitor, 'Is it my turn yet?', { offset: [0, 2.6, 0] });
      await ctx.wait(1.5); await voice.say('palliative_2'); await ctx.wait(1.2);
      save.complete('transplant');
      ctx.gameOver({ title: 'You called palliative care', text: 'Your five patients were moved to palliative care, to be kept comfortable for the time they have. He finished his magazine, and went home.' });
    } });
  interact.trigger({ pos: SEAT, radius: 5, when: () => S.phase === 'ward', onEnter: async () => { await voice.say('visitor'); await voice.say('match'); await ctx.wait(0.6); await voice.say('ask'); } });

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); await ctx.wait(0.5); await voice.say('five'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -6, z: 1.6, rotY: Math.PI },
    walkable: (x, z) => (S.inTheatre ? Math.abs(x - TH.x) < 4.5 && z > TH.z - 3.5 && z < TH.z + 3.6 : Math.abs(x) < HALF - 0.4 && z > BACK + 0.5 && z < FRONT),
    blockers: () => (S.inTheatre
      ? [{ x: TH.x, z: TH.z - 0.6, w: 2.6, d: 1 }, { x: TH.x - 2, z: TH.z - 0.9, r: 0.5 }, { x: TH.x + 0.7, z: TH.z - 2.1, r: 0.5 }, { x: TH.x + 2.7, z: TH.z - 1.9, w: 2, d: 0.9 }, { x: TH.x - 2.6, z: TH.z - 2, r: 0.4 }]
      : [...beds.map((b) => ({ x: b.position.x, z: b.position.z, r: 1.3 })), { x: 10.4, z: SEAT.z, r: 1.4 }, { x: 12.6, z: -4.4, r: 0.4 }]),
    update(dt, t) {
      S.pt += dt;
      // someone walking somewhere (him, out of one door or the other)
      if (S.walker) {
        const w = S.walker, d = w.path[0].clone().sub(w.who.position).setY(0);
        if (d.length() > 0.2) { w.who.position.addScaledVector(d.normalize(), dt * 1.8); w.who.rotation.y = Math.atan2(d.x, d.z); animatePerson(w.who, t * 2, { energy: 1 }); }
        else if (w.path.length > 1) w.path.shift();
        else w.who.visible = false;
        mag.visible = false;
      } else animatePerson(visitor, t * 0.5, { energy: 0.2 });
      patients.forEach((p, i) => { p.userData.body.rotation.z = Math.sin(t * 0.8 + i) * 0.02; });
      // the beds wheeled away, one after another, out through the door
      if (S.wheel) {
        S.wheelT += dt;
        exitDoor.rotation.y = lerp(exitDoor.rotation.y, -1.4, 1 - Math.exp(-dt * 3));
        for (const w of S.wheel) {
          if (S.wheelT < w.delay || !w.path.length) continue;
          const d = w.path[0].clone().sub(w.b.position).setY(0);
          if (d.length() < 0.15) { w.path.shift(); if (!w.path.length) w.b.visible = false; continue; }
          w.b.position.addScaledVector(d.normalize(), dt * Math.min(2.4, 0.8 + (S.wheelT - w.delay)));
          w.b.rotation.y = lerp(w.b.rotation.y, Math.abs(d.x) > Math.abs(d.z) ? Math.PI / 2 : 0, 1 - Math.exp(-dt * 5));
        }
      }
      // the theatre: his heartbeat on the monitor; the anaesthetist waits, then asks
      if (S.inTheatre || S.phase === 'wake') {
        mg.fillStyle = '#0f2a2b'; mg.fillRect(0, 0, 256, 128); mg.strokeStyle = '#6fe0b8'; mg.lineWidth = 3; mg.beginPath();
        for (let x = 0; x < 256; x += 2) { const ph = ((x / 256) * 3 + t * 1.1) % 1, y = 70 - (ph > 0.46 && ph < 0.5 ? 46 : ph > 0.5 && ph < 0.53 ? -16 : 0); x === 0 ? mg.moveTo(x, y) : mg.lineTo(x, y); }
        mg.stroke(); mTex.needsUpdate = true;
        if (S.phase === 'theatre' && S.ready) {
          S.thT += dt;
          if (S.thT > 30 && !S.asked) { S.asked = true; ctx.speak(anaes, 'Doctor? Shall I wake him?'); }
          if (S.thT > 48) wake();
        }
        animatePerson(anaes, t * 0.4, { energy: 0.15 }); animatePerson(nurse, t * 0.4 + 1, { energy: 0.15 });
      }
      if (S.sitUp !== undefined) { S.sitUp = Math.min(1, S.sitUp + dt * 0.8); sleeper.rotation.z = lerp(Math.PI / 2, 0.35, easeInOut(S.sitUp)); sleeper.position.y = lerp(1.18, 0.9, S.sitUp); }
      // the theatre: the doors swing shut, the light goes on, the lights go down
      const shut = S.inTheatre || S.phase === 'after';
      doors.forEach(({ d, s }) => (d.rotation.y = lerp(d.rotation.y, shut || S.phase !== 'escort' ? 0 : s * 1.2, 1 - Math.exp(-dt * 4))));
      inUse.material.color.set(shut ? 0xff4a3d : 0x5a3030);
      S.fade = clamp(S.fade + (S.dark ? dt / 0.8 : -dt / 1.2));
      ctx.ui.fade(S.fade * 0.96, '#141318');
      if (S.phase === 'ward' && player.pos.x > 5) cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      if (S.inTheatre) return { ...frame([pl.pos.clone(), thAt(-2.8, -2.4).setY(2), thAt(3.4, -2.2).setY(1.5), thAt(0, 0).setY(3.4)], { min: 9, max: 30 }), stiffness: 2.2 };
      const pts = [pl.pos.clone(), V(-9, 2, BACK + 1), V(9, 2, BACK + 1), SEAT.clone().add(V(0, 2, 0))];
      if (S.phase === 'escort' || S.phase === 'begin' || S.phase === 'after') pts.push(THEATRE.clone().add(V(0, 3, 0)));
      if (S.phase === 'palliative') pts.push(EXIT.clone().add(V(0, 2, 0)));
      if (S.phase === 'letgo') pts.push(EXIT.clone().add(V(0, 2, 0)));
      return { ...frame(pts, { min: 14, max: 40 }), stiffness: 2.2 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); player.locked = false; },
  });
}
