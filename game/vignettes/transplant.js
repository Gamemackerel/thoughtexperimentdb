// Vignette: The Transplant Surgeon.
// You're a surgeon. Five patients on the ward will die without a transplant: a heart, a liver, two lungs, a kidney, a
// pancreas. In the waiting room, a healthy young man is in for a check-up, and he would be a match for all five.
// Send him home, or take him to theatre (the doors close; nothing is shown). One choice, then it ends.
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
  for (const sx of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.4, 7, 10), wallM); e.position.set(sx * (HALF + 0.2), 3.5, -1); root.add(e); }
  const stripe = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 0.2, 0.06), clay(0x3f8f86)); stripe.position.set(0, 1.4, BACK + 0.02); root.add(stripe);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.8), new THREE.MeshBasicMaterial({ color: 0xcfe4f0 })); win.position.set(-2, 4.1, BACK + 0.02); root.add(win);
  for (let i = 0; i <= 6; i++) { const m = mesh(new THREE.BoxGeometry(0.08, 1.9, 0.08), clay(0xf6f6f2)); m.position.set(-6.5 + i * 1.5, 4.1, BACK + 0.05); root.add(m); }
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 10), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.z = -1; root.add(gp);

  const patients = [], beds = [];
  for (let i = 0; i < 5; i++) {
    const x = -8.4 + i * 3.1, bed = makeBed(); bed.position.set(x, 0, BACK + 1.7); root.add(bed); beds.push(bed);
    const p = makePerson({ color: 0xcfe0ee }); p.position.set(x, 0.72, BACK + 2.75); p.rotation.x = -1.25; p.userData.body.position.y = 0; root.add(p); patients.push(p);
    const drip = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), clay(0xb8c7c2)); drip.position.set(x + 1, 1.1, BACK + 1); root.add(drip);
    const bag = mesh(new THREE.BoxGeometry(0.22, 0.32, 0.08), clay(0xe7f1f4)); bag.position.set(x + 1, 2.1, BACK + 1); root.add(bag);
  }
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
  const exitDoor = mesh(new THREE.BoxGeometry(0.1, 2.6, 1.3), clay(0x3f8f86)); exitDoor.position.set(HALF + 0.02, 1.3, EXIT.z); root.add(exitDoor);

  // the frog comes to the waiting room, takes the chair next to him, waits its turn a while, and gives up
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const cameo = frogCameo(frog, [[HALF - 1, 3.2], [11.6, 1.6], [11.2, 0], [11, -1.8], { at: [11.6, SEAT.z + 0.1], y: 0.55, height: 1 }, { face: [11.6, 3] },
    { wait: 3.2, act: (f, u, t) => (f.userData.body.rotation.z = u > 0.6 ? Math.sin(t * 3) * 0.08 : 0) }, { at: [12.2, -2], y: 0, height: 0.9 }, [12.6, -0.2], [12.4, 1.8], [HALF - 0.5, 3.4]]);

  // ---- state
  const S = { phase: 'ward', pt: 0, choice: null, fade: 0 };
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
  patients.forEach((p, k) => talk(ctx, { who: p, radius: 2.2, offset: [0, 1.9, 0], prompt: 'Talk to your patient', enabled: () => S.phase === 'ward' && S.choice !== 'operate',
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
  interact.add({ pos: () => SEAT.clone().add(V(-1.3, 0, 1)), radius: 1.5, height: 2.6, prompt: 'Take him to theatre', enabled: canChoose,
    onUse: async () => {
      S.phase = 'escort'; S.choice = 'operate'; player.enabled = false;
      ctx.speak(visitor, 'Oh! Right now? All right.');
      visitor.userData.body.position.y = 0; S.walker = { who: visitor, path: [V(8.6, 0, -0.6), V(-9, 0, -0.6), THEATRE.clone().add(V(-0.8, 0, 0))] };   // down the aisle, not through the beds
      player.locked = true; player.enabled = true; player.target = THEATRE.clone().add(V(0.9, 0, 1.4));
      await ctx.wait(11);
      S.phase = 'dark'; S.pt = 0; await ctx.wait(2.4);
      await voice.say('operate_1');
      patients.forEach((p) => { p.rotation.x = -0.35; });       // they sit up, well
      S.phase = 'after'; S.pt = 0; await ctx.wait(2.2);
      await voice.say('operate_2'); await ctx.wait(1.2);
      save.complete('transplant');
      ctx.gameOver({ title: 'You operated', text: 'Five people will go home. One healthy man came in for a check-up and never left. The numbers are the lever\'s; almost everyone calls this murder.' });
    } });
  interact.trigger({ pos: SEAT, radius: 5, when: () => S.phase === 'ward', onEnter: async () => { await voice.say('visitor'); await voice.say('match'); await ctx.wait(0.6); await voice.say('ask'); } });

  (async () => { await ctx.wait(0.9); await voice.say('arrive'); await ctx.wait(0.5); await voice.say('five'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -6, z: 1.6, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < HALF - 0.4 && z > BACK + 0.5 && z < FRONT,
    blockers: () => [...beds.map((b) => ({ x: b.position.x, z: b.position.z, r: 1.3 })), { x: 10.4, z: SEAT.z, r: 1.4 }, { x: 12.6, z: -4.4, r: 0.4 }],
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
      // the theatre: the doors swing shut, the light goes on, the lights go down
      const shut = S.phase === 'dark' || S.phase === 'after';
      doors.forEach(({ d, s }) => (d.rotation.y = lerp(d.rotation.y, shut || S.phase !== 'escort' ? 0 : s * 1.2, 1 - Math.exp(-dt * 4))));
      inUse.material.color.set(shut ? 0xff4a3d : 0x5a3030);
      S.fade = S.phase === 'dark' ? clamp(S.pt / 0.8) : S.phase === 'after' ? 1 - clamp(S.pt / 1.5) : 0;
      ctx.ui.fade(S.fade * 0.96, '#141318');
      if (S.phase === 'ward' && player.pos.x > 5) cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      const pts = [pl.pos.clone(), V(-9, 2, BACK + 1), V(9, 2, BACK + 1), SEAT.clone().add(V(0, 2, 0))];
      if (S.phase === 'escort' || S.phase === 'dark' || S.phase === 'after') pts.push(THEATRE.clone().add(V(0, 3, 0)));
      if (S.phase === 'letgo') pts.push(EXIT.clone().add(V(0, 2, 0)));
      return { ...frame(pts, { min: 14, max: 40 }), stiffness: 2.2 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); player.locked = false; },
  });
}
