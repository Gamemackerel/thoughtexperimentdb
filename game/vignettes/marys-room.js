// Vignette: Mary's Room.
// You're Mary: a scientist who has lived her whole life in a black-and-white room, and who knows every physical fact
// about colour. The whole picture is black and white (a greyscale filter on the canvas). Read the books, watch the
// tomato on the monitor. Then the door is unlocked. Step outside, and the colour floods in; look at the ripe tomatoes
// and see red for the first time. Or sit back down at your desk. (A gardener offers you a banana painted blue.)
import { THREE, palette, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeFrog, makeTable, makeTree } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { textTexture } from '../core/props.js';
import { canvasTexture } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const W = 6, BACK = -4, FRONT = 2.8;                 // the room: |x| < W
const DOOR_Z = 0.2;                                   // the doorway in the right-hand wall
const TOMATOES = V(12.2, 0, -1.4);
const DESK = V(-3.6, 0, -2.6);
const IDLE_LIMIT = 55;

export default function marysRoom(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0x9fc7e8);
  stage.scene.fog = new THREE.Fog(0x9fc7e8, 40, 120);
  voice.load('marys-room');
  const canvas = document.getElementById('gl');
  const grey = (g) => { canvas.style.filter = g > 0.001 ? `grayscale(${g.toFixed(3)})` : ''; };
  grey(1);

  // ---- the room: grey floor, white walls, black skirting; everything in it black, white or grey
  const slab = mesh(new THREE.BoxGeometry(W * 2 + 0.6, 1, 8), clay(0x8a8a8a)); slab.position.set(0, -0.5, -0.6); root.add(slab);
  const tiles = canvasTexture(256, 256, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#dcdcdc' : '#4a4a4a'; g.fillRect(x * 32, y * 32, 32, 32); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(3, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, 6.6), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.01, -0.6); floor.receiveShadow = true; root.add(floor);
  const wallM = clay(0xf0f0f0);
  const back = mesh(new THREE.BoxGeometry(W * 2 + 0.6, 5, 0.3), wallM); back.position.set(0, 2.5, BACK - 0.15); root.add(back);
  const left = mesh(new THREE.BoxGeometry(0.3, 5, 6.8), wallM); left.position.set(-W - 0.15, 2.5, -0.6); root.add(left);
  for (const [z0, z1] of [[BACK, DOOR_Z - 0.75], [DOOR_Z + 0.75, FRONT]]) { const w = mesh(new THREE.BoxGeometry(0.3, 5, z1 - z0), wallM); w.position.set(W + 0.15, 2.5, (z0 + z1) / 2); root.add(w); }
  const lintel = mesh(new THREE.BoxGeometry(0.3, 2.6, 1.5), wallM); lintel.position.set(W + 0.15, 3.7, DOOR_Z); root.add(lintel);
  const skirt = mesh(new THREE.BoxGeometry(W * 2, 0.2, 0.06), clay(0x2b2b2b)); skirt.position.set(0, 0.1, BACK + 0.03); root.add(skirt);
  // the door (it swings out when it's unlocked)
  const doorPivot = new THREE.Group(); doorPivot.position.set(W + 0.15, 0, DOOR_Z - 0.72); root.add(doorPivot);
  const door = mesh(new THREE.BoxGeometry(0.1, 2.35, 1.44), clay(0x2b2b2b)); door.position.set(0, 1.18, 0.72); doorPivot.add(door);
  const knob = mesh(new THREE.SphereGeometry(0.07, 10, 8), clay(0xdcdcdc)); knob.position.set(-0.1, 1.15, 1.25); doorPivot.add(knob);

  // the desk, the monitor showing a tomato in grey, the books, the chalkboard, the bed
  const desk = makeTable({ w: 2.2, d: 1, h: 1, color: 0x3a3a3a }); desk.position.copy(DESK); root.add(desk);
  const chair = new THREE.Group(); const cseat = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), clay(0x2b2b2b)); cseat.position.y = 0.55; chair.add(cseat);
  const cback = mesh(new THREE.BoxGeometry(0.6, 0.7, 0.08), clay(0x2b2b2b)); cback.position.set(0, 0.95, 0.3); chair.add(cback);
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), clay(0x6a6a6a)); l.position.set(x, 0.27, z); chair.add(l); }
  chair.position.copy(DESK).add(V(0, 0, 0.95)); root.add(chair);
  const tv = mesh(new THREE.BoxGeometry(1.1, 0.8, 0.6), clay(0x2b2b2b)); tv.position.copy(DESK).add(V(0.2, 1.42, -0.1)); root.add(tv);
  const tomatoPic = canvasTexture(256, 192, (g, w, h) => {
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d23a2a'; g.beginPath(); g.arc(128, 104, 58, 0, 7); g.fill();
    g.fillStyle = '#3f8a3a'; for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; g.beginPath(); g.ellipse(128 + Math.cos(a) * 14, 50 + Math.sin(a) * 6, 16, 5, a, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(106, 84, 12, 7, -0.6, 0, 7); g.fill();
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.62), new THREE.MeshBasicMaterial({ map: tomatoPic })); screen.position.copy(tv.position).add(V(0, 0, 0.31)); root.add(screen);
  const books = new THREE.Group();
  const shelf = mesh(new THREE.BoxGeometry(2.6, 3.2, 0.5), clay(0x5a5a5a)); shelf.position.y = 1.6; books.add(shelf);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const b = mesh(new THREE.BoxGeometry(0.2, 0.55 + ((i * 7 + r) % 3) * 0.08, 0.36), clay([0x2b2b2b, 0xdcdcdc, 0x8a8a8a, 0x5a5a5a][(i + r) % 4])); b.position.set(-1.05 + i * 0.26, 0.3 + r * 0.78 + b.geometry.parameters.height / 2, 0.1); books.add(b); }
  books.position.set(1.2, 0, BACK + 0.3); root.add(books);
  const boardTex = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#2b2b2b'; g.fillRect(0, 0, w, h); g.strokeStyle = '#eeeeee'; g.fillStyle = '#eeeeee'; g.lineWidth = 3; g.font = '22px sans-serif';
    for (let i = 0; i < 7; i++) { g.globalAlpha = 0.25 + i * 0.1; g.fillRect(40 + i * 60, 40, 56, 60); } g.globalAlpha = 1;
    g.fillText('400', 40, 125); g.fillText('550', 220, 125); g.fillText('700 nm', 400, 125);
    g.beginPath(); for (let x = 0; x < 440; x += 4) { const y = 190 - Math.exp(-(((x - 330) / 60) ** 2)) * 50; x ? g.lineTo(40 + x, y) : g.moveTo(40 + x, y); } g.stroke();
    g.fillText('L-cones', 360, 225);
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: boardTex })); board.position.set(-W + 0.05, 2.6, -1.4); board.rotation.y = Math.PI / 2; root.add(board);
  const bed = new THREE.Group(); const bframe = mesh(new THREE.BoxGeometry(1.3, 0.5, 2.4), clay(0x5a5a5a)); bframe.position.y = 0.25; bed.add(bframe);
  const blanket = mesh(new THREE.BoxGeometry(1.32, 0.14, 1.6), clay(0xdcdcdc)); blanket.position.set(0, 0.54, 0.35); bed.add(blanket);
  bed.position.set(4.4, 0, BACK + 1.4); root.add(bed);

  // ---- outside: grass, a blue sky, a rose bush, an apple tree, a table of ripe tomatoes, and a gardener
  const garden = new THREE.Group(); root.add(garden);
  const lawn = mesh(new THREE.BoxGeometry(12, 1, 10), clay(0x7cc04e)); lawn.position.set(W + 6.4, -0.5, -0.6); garden.add(lawn);
  const edge = mesh(new THREE.CylinderGeometry(7, 5, 3, 24), clay(palette.groundEdge)); edge.position.set(W + 6.4, -2.4, -0.6); edge.scale.z = 0.8; garden.add(edge);
  const gtable = makeTable({ w: 1.6, d: 0.9, h: 0.95, color: 0xf6efe0 }); gtable.position.copy(TOMATOES); garden.add(gtable);
  const toms = [];
  for (let i = 0; i < 7; i++) { const t = mesh(new THREE.SphereGeometry(0.17, 16, 12), clay(0xd23a2a, { roughness: 0.35 })); t.scale.y = 0.85; t.position.copy(TOMATOES).add(V(-0.5 + (i % 4) * 0.33, 1.1, -0.15 + Math.floor(i / 4) * 0.3)); garden.add(t); toms.push(t); const st = mesh(new THREE.ConeGeometry(0.06, 0.08, 5), clay(0x3f8a3a)); st.position.copy(t.position).add(V(0, 0.15, 0)); garden.add(st); }
  const rose = new THREE.Group(); const rb = mesh(new THREE.SphereGeometry(0.7, 12, 10), clay(0x3f7a35, { flatShading: true })); rb.position.y = 0.6; rose.add(rb);
  for (let i = 0; i < 6; i++) { const f = mesh(new THREE.SphereGeometry(0.12, 10, 8), clay(0xc0182a)); const a = i * 1.1; f.position.set(Math.cos(a) * 0.55, 0.7 + Math.sin(i) * 0.3, Math.sin(a) * 0.55); rose.add(f); }
  rose.position.set(W + 3, 0, -3.6); garden.add(rose);
  for (let i = 0; i < 40; i++) {                                    // a bed of flowers along the wall, every colour at once
    const x = W + 1.4 + (i % 20) * 0.5 + Math.sin(i * 7.1) * 0.12, z = 2.3 + Math.floor(i / 20) * 0.45 + Math.cos(i * 3.3) * 0.1;
    const stem = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), clay(0x3f7a35)); stem.position.set(x, 0.25, z); garden.add(stem);
    const f = mesh(new THREE.SphereGeometry(0.11, 10, 8), clay([0xe0674f, 0xf2c14e, 0x5b7fa6, 0xc0182a, 0xe8435a, 0x9a5ab8, 0xf6efe0][i % 7])); f.position.set(x, 0.55, z); garden.add(f);
  }
  const tree = makeTree(1.3); tree.position.set(W + 9.8, 0, -4); garden.add(tree);
  for (let i = 0; i < 5; i++) { const ap = mesh(new THREE.SphereGeometry(0.12, 10, 8), clay(0xd9342a)); ap.position.set(W + 9.8 + Math.cos(i * 1.3) * 0.9, 2.4 + Math.sin(i * 2) * 0.4, -4 + Math.sin(i * 1.3) * 0.9); garden.add(ap); }
  const gardener = makePerson({ color: 0x5b7fa6, hat: true }); gardener.position.set(W + 3.2, 0, 1.6); gardener.rotation.y = -1.2; garden.add(gardener);
  const banana = mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16, 2.2), clay(0x3f6fd8)); banana.position.set(0.42, 1.15, 0.25); banana.rotation.set(0, 0, 2.2); gardener.userData.body.add(banana);

  // ---- the frog, grey like everything in here, sits on the desk and watches the tomato on the screen; then it goes and
  // waits by the door (it has never seen outside either)
  const frog = makeFrog({ scale: 0.55 }); root.add(frog);
  const top = 1.0;
  const cameo = frogCameo(frog, [[-5.2, 1.8], [-4.6, 0.8], { at: [-4.2, DESK.z + 0.2], y: top, height: 1 }, { face: [-3.4, DESK.z - 2] },
    { wait: 3.6, act: (f, u) => (f.userData.body.rotation.x = -0.15 * Math.sin(Math.PI * u)) }, { at: [-3, 0.6], y: 0, height: 1 }, [-0.8, 0.6], [1.6, 0.5], [3.8, 0.3], [5.1, DOOR_Z],
    { face: [9, DOOR_Z] }, { wait: 2.4 }, [3.6, 1.4], [1.6, 2.2], [-0.8, 2.6]]);

  // ---- state
  const S = { phase: 'room', unlocked: false, outside: false, colorT: -1, idle: 0, door: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/marys-room.json', "Mary's Room");
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.x = 5; root.add(gp); level.ground.push(gp);

  async function unlock() {
    if (S.unlocked) return;
    S.unlocked = true; S.idle = 0;
    await voice.say('door'); await ctx.wait(0.8); await voice.say('ask'); S.asked = true; cameo.start();
  }
  // stepping through the door: the colour comes in
  interact.trigger({ test: (p) => p.x > W + 0.4, when: () => S.unlocked, onEnter: async () => {
    S.outside = true; S.colorT = 0; S.idle = 0;
    await ctx.wait(1.8); await voice.say('outside', { urgent: true });
  } });
  interact.add({ pos: TOMATOES.clone().add(V(-0.2, 0, 1.2)), radius: 1.6, height: 1.8, prompt: 'Look at the tomatoes', terminal: true, enabled: () => S.phase === 'room' && S.outside && S.colorT > 2,
    onUse: async () => {
      S.phase = 'over'; player.enabled = false;
      await voice.say('learn_1', { urgent: true }); await ctx.wait(1.6); await voice.say('learn_2'); await ctx.wait(1.4);
      save.complete('marys-room');
      ctx.gameOver({ title: 'You saw red', text: 'You knew every fact there was about red: the light, the eye, the brain. Then you saw it. Whether that was a new fact, a new ability, or an old fact met in a new way, people still argue.' });
    } });
  async function stay(idle) {
    S.phase = 'over'; player.enabled = false;
    if (!idle) { player.place(DESK.x, DESK.z + 0.95, Math.PI); player.sit(true); player.pos.y = 0; }
    S.door = 0;
    await voice.say(idle ? 'stay_idle' : 'stay_1', { urgent: true }); await ctx.wait(1); await voice.say('stay_2'); await ctx.wait(1.4);
    save.complete('marys-room');
    ctx.gameOver({ title: 'You stayed inside', text: 'You know everything about red that can be written down, and you never saw it. Maybe that is all there is to know about red. Maybe not.' });
  }
  interact.add({ pos: DESK.clone().add(V(0.9, 0, 1.3)), radius: 1.3, height: 2.2, prompt: () => (S.unlocked ? 'Sit back down at your desk' : 'Sit at your desk'), terminal: true,
    enabled: () => S.phase === 'room' && !S.outside,
    onUse: () => (S.asked ? stay(false) : voice.say('desk_early', { urgent: true })) });
  interact.add({ pos: V(W - 0.8, 0, DOOR_Z), radius: 1.2, height: 2.4, prompt: 'Try the door', enabled: () => S.phase === 'room' && !S.unlocked,
    onUse: () => voice.say('locked', { urgent: true, once: false }) });

  // asides: the books, the chalkboard, the monitor; outside, the gardener with a blue banana
  look(ctx, { pos: V(1.2, 0, BACK + 1.5), radius: 1.6, height: 3.6, prompt: 'Read the books', lines: ['books_1', 'books_2'], enabled: () => S.phase === 'room' });
  look(ctx, { pos: V(-W + 1.2, 0, -1.4), radius: 1.5, height: 3.4, prompt: 'Look at the chalkboard', lines: ['board'], enabled: () => S.phase === 'room' });
  look(ctx, { pos: DESK.clone().add(V(-0.7, 0, 1.2)), radius: 1.2, height: 2.4, prompt: 'Watch the monitor', lines: ['tomato'], enabled: () => S.phase === 'room' });
  talk(ctx, { who: gardener, enabled: () => S.phase === 'room' && S.outside, lines: ['Welcome out! Here, have a banana.', 'What colour is it? Go on, say.', "Ha! Worth a try. You're too clever for me."] });
  look(ctx, { pos: () => gardener.getWorldPosition(V()).add(V(0.4, 0, 1)), radius: 1.6, height: 2.2, prompt: 'Look at the banana', lines: ['banana'], enabled: () => S.phase === 'room' && S.outside });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('scientist');
    await ctx.wait(18); unlock();                                     // the door opens whether or not you've read it all
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: -0.5, z: 1.4, rotY: Math.PI },
    walkable: (x, z) => (Math.abs(x) < W - 0.4 && z > BACK + 0.5 && z < FRONT - 0.2)
      || (S.unlocked && x >= W - 0.5 && x < W + 1 && Math.abs(z - DOOR_Z) < 0.55)
      || (S.unlocked && x >= W + 0.9 && x < W + 11.6 && z > -4.8 && z < 3.4),
    blockers: () => [{ x: DESK.x, z: DESK.z, w: 2.3, d: 1.1 }, { x: DESK.x, z: DESK.z + 0.95, r: 0.4 }, { x: 1.2, z: BACK + 0.4, w: 2.7, d: 0.7 }, { x: 4.4, z: BACK + 1.4, w: 1.4, d: 2.5 },
      { x: TOMATOES.x, z: TOMATOES.z, w: 1.7, d: 1 }, { x: W + 3, z: -3.6, r: 0.8 }, { x: W + 9.8, z: -4, r: 0.4 }, { x: gardener.position.x, z: gardener.position.z, r: 0.45 }],
    update(dt, t) {
      // the colour comes in over a few seconds once you're through the door (and goes again if you're back at your desk)
      if (S.colorT >= 0) { S.colorT += dt; grey(1 - easeInOut(clamp(S.colorT / 4))); }
      S.door = lerp(S.door, S.unlocked && S.phase === 'room' ? 1 : 0, 1 - Math.exp(-dt * 2));
      doorPivot.rotation.y = -S.door * 1.4;
      // after the question, doing nothing is staying
      if (S.asked && S.phase === 'room' && !S.outside) {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > 25 && !S.nudged) { S.nudged = true; voice.say('nudge'); }
        if (S.idle > IDLE_LIMIT) stay(true);
      }
      animatePerson(gardener, t, { energy: 0.4 });
      toms.forEach((m, i) => (m.rotation.y = t * 0.1 + i));
      cameo.update(dt);
    },
    camera(pl) {
      const look = V(clamp(pl.pos.x, -1.5, 11), 1.6, -0.6);
      return { pos: look.clone().add(V(0, 5.6, 11.5)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); grey(0); player.sit(false); },
  });
}
