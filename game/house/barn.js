// The Barn: up the lane from the field, a red barn after Grant Wood. Inside: scrubbed plank walls, hay bales, a lantern,
// a ladder to the loft. At the far end, a pointed Gothic window, and under it a farmer with a pitchfork and a woman in an
// apron, standing very straight (American Gothic). The farmer's pitchfork has three prongs, and he'll tell you what
// they are: belief, truth and a good reason, which is what knowing was, until the cases on these walls. Through the big
// doors: round green hills in neat rows, and trees like lollipops. Five portals, one for each Gettier case.
import { THREE, palette, css, clamp, lerp, seeded, clay, mesh, makePerson, animatePerson } from '/game/engine/core.js';
import { talk } from '../core/extras.js';
import { textTexture } from '../core/props.js';
import { canvasTexture, strokes } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 13, BACK = -5, FRONT = 3.4;

// A Grant Wood hill: a smooth round dome striped with crop rows.
function makeHill(r, h, color, rows, rnd) {
  const tex = canvasTexture(256, 256, (g, w, hh) => {
    g.fillStyle = color; g.fillRect(0, 0, w, hh);
    g.strokeStyle = 'rgba(40,60,20,0.28)'; g.lineWidth = 4;
    for (let i = 0; i < rows; i++) { g.beginPath(); const y = (i / rows) * hh; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 18, w * 0.7, y - 18, w, y); g.stroke(); }
  });
  const m = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  m.scale.set(r, h, r * (0.7 + rnd() * 0.4));
  return m;
}

export default function barn(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xe9eef0);
  stage.scene.fog = new THREE.Fog(0xe9eef0, 50, 140);
  stage.hemi.intensity = 1.5; stage.sun.intensity = 2.2; stage.sun.color.set(0xfff4e0);
  const rnd = seeded(1930);

  // ---- the barn: plank floor, plank walls, beams
  const planks = (base, dark, vertical) => canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = dark; g.lineWidth = 3;
    for (let i = 0; i <= 16; i++) { const p = (i / 16) * (vertical ? w : h); g.beginPath(); vertical ? (g.moveTo(p, 0), g.lineTo(p, h)) : (g.moveTo(0, p), g.lineTo(w, p)); g.stroke(); }
    strokes(g, w, h, { colors: ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.05)'], count: 900, len: [20, 60], width: [1, 2], dir: () => (vertical ? Math.PI / 2 : 0) });
  });
  const floorTex = planks('#c9a26b', '#8a6a3a', false); floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 1);
  const floor = mesh(new THREE.BoxGeometry(HALF * 2 + 0.8, 0.4, 9.6), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 })); floor.position.set(0, -0.2, -0.8); floor.receiveShadow = true; root.add(floor);
  const wallTex = planks('#a8322a', '#7a2420', true); wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(4, 1);
  const wallM = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
  // the back wall, with the big doorway in the middle (DOOR wide)
  const DOOR = 4.2;
  for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(HALF - DOOR / 2 + 0.4, 7, 0.3), wallM); w.position.set(s * (DOOR / 2 + (HALF - DOOR / 2 + 0.4) / 2), 3.5, BACK - 0.15); root.add(w); }
  const over = mesh(new THREE.BoxGeometry(DOOR, 7 - 4.2, 0.3), wallM); over.position.set(0, 4.2 + (7 - 4.2) / 2, BACK - 0.15); root.add(over);
  for (const s of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.3, 7, 5), wallM); e.position.set(s * (HALF + 0.25), 3.5, BACK + 2.4); root.add(e); }   // short, so they never come between you and the camera
  const trim = clay(0xf6f1e7);
  for (const s of [-1, 1]) { const j = mesh(new THREE.BoxGeometry(0.25, 4.3, 0.36), trim); j.position.set(s * DOOR / 2, 2.15, BACK); root.add(j); }
  const head = mesh(new THREE.BoxGeometry(DOOR + 0.5, 0.25, 0.36), trim); head.position.set(0, 4.3, BACK); root.add(head);
  // the doors, slid open
  for (const s of [-1, 1]) { const d = mesh(new THREE.BoxGeometry(DOOR / 2, 4.1, 0.14), clay(0x8a2a24)); d.position.set(s * (DOOR / 2 + DOOR / 4 + 0.2), 2.05, BACK + 0.12); root.add(d); const x = mesh(new THREE.BoxGeometry(0.1, 4.4, 0.03), trim); x.position.copy(d.position).add(V(0, 0, 0.09)); x.rotation.z = s * 0.45; root.add(x); }
  for (let i = 0; i < 5; i++) { const beam = mesh(new THREE.BoxGeometry(0.3, 0.3, 5), clay(0x6b4a33)); beam.position.set(-HALF + 1.5 + i * (HALF * 2 - 3) / 4, 6.2, BACK + 2.4); root.add(beam); }

  // ---- outside the doors: round hills in rows, lollipop trees, a white farmhouse, a pale sky
  const land = new THREE.Group();
  const greens = ['#8fb36a', '#a9c77a', '#c7b562', '#7aa05a', '#b8c98a'];
  for (let i = 0; i < 9; i++) { const hl = makeHill(8 + rnd() * 8, 3 + rnd() * 4, greens[i % 5], 10 + Math.floor(rnd() * 8), rnd); hl.position.set((rnd() - 0.5) * 50, -0.4, -16 - rnd() * 30); land.add(hl); }
  for (let i = 0; i < 16; i++) {
    const t = new THREE.Group(); const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), clay(0x6b4a33)); trunk.position.y = 0.7; t.add(trunk);
    const ball = mesh(new THREE.SphereGeometry(0.9, 16, 12), clay([0x4f7a3a, 0x5d8a45, 0x3f6a35][i % 3])); ball.position.y = 1.9; t.add(ball);
    t.position.set((rnd() - 0.5) * 36, 0, -11 - rnd() * 18); t.scale.setScalar(0.8 + rnd() * 0.6); land.add(t);
  }
  const farmhouse = new THREE.Group(); const fh = mesh(new THREE.BoxGeometry(3, 3, 2.6), clay(0xf6f1e7)); fh.position.y = 1.5; farmhouse.add(fh);
  const fr = mesh(new THREE.ConeGeometry(2.3, 2, 4), clay(0x5a5a62)); fr.position.y = 4; fr.rotation.y = Math.PI / 4; farmhouse.add(fr);
  farmhouse.position.set(7, 0, -22); land.add(farmhouse);
  const meadow = mesh(new THREE.BoxGeometry(80, 0.4, 40), clay(0x9aba72)); meadow.position.set(0, -0.3, -25); land.add(meadow);
  root.add(land);

  // ---- hay, a lantern, the loft ladder
  for (const [x, z, y] of [[-11.6, -3.8, 0], [-10.2, -3.8, 0], [-11, -3.8, 1], [-11.8, -2.4, 0]]) { const b = mesh(new THREE.BoxGeometry(1.3, 0.9, 0.9), clay(0xe6c65a)); b.position.set(x, 0.45 + y * 0.9, z); b.rotation.y = rnd() * 0.2; root.add(b); }
  const lantern = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 8), clay(0xfff0a0)); lantern.position.set(-6, 4.6, -0.8); root.add(lantern);
  const lglow = new THREE.PointLight(0xffd27a, 14, 10, 1.4); lglow.position.copy(lantern.position); root.add(lglow);
  const ladder = new THREE.Group(); for (const x of [-0.35, 0.35]) { const r = mesh(new THREE.BoxGeometry(0.08, 6, 0.08), clay(palette.wood)); r.position.set(x, 3, 0); ladder.add(r); }
  for (let i = 0; i < 9; i++) { const r = mesh(new THREE.BoxGeometry(0.7, 0.06, 0.08), clay(palette.wood)); r.position.set(0, 0.4 + i * 0.65, 0); ladder.add(r); }
  ladder.position.set(-HALF + 0.35, 0, BACK + 3.6); ladder.rotation.z = -0.12; root.add(ladder);

  // ---- American Gothic: a pointed window, the farmer and his pitchfork, the woman beside him
  const gw = new THREE.Group();
  const gShape = new THREE.Shape(); gShape.moveTo(-0.7, 0); gShape.lineTo(0.7, 0); gShape.lineTo(0.7, 1.4); gShape.quadraticCurveTo(0.7, 2.2, 0, 2.8); gShape.quadraticCurveTo(-0.7, 2.2, -0.7, 1.4); gShape.closePath();
  const gFrame = mesh(new THREE.ExtrudeGeometry(gShape, { depth: 0.12, bevelEnabled: false }), trim); gw.add(gFrame);
  const gGlass = new THREE.Mesh(new THREE.ShapeGeometry(gShape), new THREE.MeshBasicMaterial({ color: 0x5b6f86 })); gGlass.scale.setScalar(0.85); gGlass.position.set(0, 0.2, 0.14); gw.add(gGlass);
  const mull = mesh(new THREE.BoxGeometry(0.06, 2.3, 0.04), trim); mull.position.set(0, 1.3, 0.17); gw.add(mull);
  gw.position.set(11.2, 3.3, BACK + 0.02); root.add(gw);
  const farmer = makePerson({ color: 0x2b2a33 });
  const overalls = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.5, 16), clay(0x3f5a8c)); overalls.position.y = 0.95; farmer.userData.body.add(overalls);
  for (const x of [-0.11, 0.11]) { const lens = mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), clay(0x2b2a33)); lens.position.set(x, 1.77, 0.31); farmer.userData.body.add(lens); }
  const bald = mesh(new THREE.SphereGeometry(0.33, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), clay(0xf6e4cf)); bald.position.y = 1.74; farmer.userData.body.add(bald);
  farmer.position.set(11.8, 0, BACK + 1.6); farmer.rotation.y = -0.1; root.add(farmer);
  // the pitchfork, three prongs, each with a label
  const fork = new THREE.Group();
  const handle = mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 8), clay(palette.wood)); handle.position.y = 1.5; fork.add(handle);
  const crossbar = mesh(new THREE.BoxGeometry(0.62, 0.05, 0.05), clay(0x8b909a, { metalness: 0.5 })); crossbar.position.y = 3; fork.add(crossbar);
  const prongs = ['BELIEF', 'TRUTH', 'REASON'].map((w, i) => {
    const pr = mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.8, 6), clay(0x8b909a, { metalness: 0.5 })); pr.position.set(-0.28 + i * 0.28, 3.4, 0); fork.add(pr);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), new THREE.MeshBasicMaterial({ map: textTexture(w, { w: 160, h: 50, font: 'bold 28px Figtree, sans-serif', bg: '#fbf6ea' }), side: THREE.DoubleSide }));
    tag.position.set(-0.28 + i * 0.28, 3.95 + (i % 2) * 0.2, 0.02); fork.add(tag); return pr;
  });
  fork.position.set(-0.45, 0, 0.2); farmer.add(fork);
  const wife = makePerson({ color: 0x2b2a33 });
  const apron = mesh(new THREE.CylinderGeometry(0.37, 0.4, 0.8, 16, 1, true, -0.9, 1.8), clay(0xc9705a)); apron.position.y = 0.72; wife.userData.body.add(apron);
  const collar = mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16), clay(0xfbf6ea)); collar.rotation.x = Math.PI / 2; collar.position.y = 1.43; wife.userData.body.add(collar);
  const brooch = mesh(new THREE.SphereGeometry(0.05, 10, 8), clay(0xe2b53b)); brooch.position.set(0, 1.42, 0.22); wife.userData.body.add(brooch);
  const hair = mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), clay(0x7a5a3a)); hair.position.set(0, 1.74, -0.03); wife.userData.body.add(hair);
  wife.position.set(10.6, 0, BACK + 1.4); wife.rotation.y = 0.1; root.add(wife);
  talk(ctx, { who: farmer, lines: [
    'Three prongs. You believe it, it is true, and you have good reason. That is knowing.',
    'Worked for two thousand years, that did.',
    'Then a fellow wrote three pages, in nineteen sixty-three.',
    'Every one of these cases has all three prongs. And still, something is missing.'] });
  talk(ctx, { who: wife, lines: [
    "Don't get him started on the barns down the road.",
    'Mind the clock. It has been two o\'clock for a long while.',
    'He counts his coins every night. Just in case.'] });

  // ---- the five portals, and the way out
  const P = { coins: -10, clock: -6.6, gate: -3.6, barns: 4.2, mirage: 7.8 };
  const Z = BACK + 0.6;
  // a HELP WANTED notice on a post, and a jar of coins
  const notice = new THREE.Group();
  const npost = mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), clay(palette.wood)); npost.position.y = 1.1; notice.add(npost);
  const nboard = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.7), new THREE.MeshBasicMaterial({ map: textTexture(['HELP', 'WANTED', 'apply within'], { w: 256, h: 180, font: 'bold 44px Newsreader, serif', bg: '#fbf6ea', lineH: 1.1 }) })); nboard.position.set(0, 1.9, 0.12); notice.add(nboard);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.1 })); jar.position.set(0.5, 0.2, 0.3); notice.add(jar);
  for (let i = 0; i < 10; i++) { const c = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), clay(0xc9a54c, { metalness: 0.6 })); c.position.set(0.5 + (rnd() - 0.5) * 0.12, 0.03 + i * 0.022, 0.3 + (rnd() - 0.5) * 0.12); notice.add(c); }
  notice.position.set(P.coins, 0, Z); root.add(notice);
  // a wall clock that says two
  const clockTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.strokeStyle = '#2b2a33'; g.lineWidth = 8; g.stroke();
    g.font = 'bold 30px Newsreader, serif'; g.fillStyle = '#2b2a33'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * 6.28 - 1.57; g.fillText(String(i), 128 + Math.cos(a) * 95, 128 + Math.sin(a) * 95); }
    g.lineCap = 'round'; g.lineWidth = 9; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos((2 / 12) * 6.28 - 1.57) * 55, 128 + Math.sin((2 / 12) * 6.28 - 1.57) * 55); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 42); g.stroke();
  });
  const clockM = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ map: clockTex })); clockM.position.set(P.clock, 3, BACK + 0.08); root.add(clockM);
  const clockRim = mesh(new THREE.TorusGeometry(0.78, 0.07, 8, 32), clay(0x6b4a33)); clockRim.position.copy(clockM.position); root.add(clockRim);
  // a five-bar gate
  const gate = new THREE.Group(); const gwood = clay(0xd9d2c0);
  for (const x of [-1.3, 1.3]) { const p = mesh(new THREE.BoxGeometry(0.18, 1.5, 0.18), gwood); p.position.set(x, 0.75, 0); gate.add(p); }
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(2.6, 0.08, 0.06), gwood); b.position.set(0, 0.3 + i * 0.25, 0); gate.add(b); }
  const brace = mesh(new THREE.BoxGeometry(0.08, 1.5, 0.06), gwood); brace.position.set(0, 0.75, 0.05); brace.rotation.z = 1.0; gate.add(brace);
  gate.position.set(P.gate, 0, Z + 0.3); root.add(gate);
  const tinySheep = new THREE.Group(); for (const [x, y, s] of [[0, 0.3, 0.3], [0.2, 0.35, 0.26], [-0.2, 0.32, 0.24]]) { const b = mesh(new THREE.SphereGeometry(s, 10, 8), clay(0xf7f3ea)); b.position.set(x, y, 0); tinySheep.add(b); }
  tinySheep.position.set(P.gate + 0.6, 0, Z - 0.6); root.add(tinySheep);
  // a barn that is only a front, propped up from behind
  const facade = new THREE.Group();
  const fShape = new THREE.Shape(); fShape.moveTo(-1.3, 0); fShape.lineTo(1.3, 0); fShape.lineTo(1.3, 1.8); fShape.lineTo(0.7, 2.6); fShape.lineTo(-0.7, 2.6); fShape.lineTo(-1.3, 1.8); fShape.closePath();
  const fFront = mesh(new THREE.ExtrudeGeometry(fShape, { depth: 0.06, bevelEnabled: false }), clay(0xa8322a)); facade.add(fFront);
  const fDoor = mesh(new THREE.BoxGeometry(1, 1.3, 0.03), clay(0xf6f1e7)); fDoor.position.set(0, 0.65, 0.08); facade.add(fDoor);
  const fDoorIn = mesh(new THREE.BoxGeometry(0.86, 1.16, 0.03), clay(0x8a2a24)); fDoorIn.position.set(0, 0.65, 0.1); facade.add(fDoorIn);
  for (const x of [-0.8, 0.8]) { const prop = mesh(new THREE.BoxGeometry(0.06, 2, 0.06), clay(palette.wood)); prop.position.set(x, 1, -0.6); prop.rotation.x = -0.5; facade.add(prop); }
  facade.position.set(P.barns, 0, Z); facade.rotation.y = -0.35; root.add(facade);
  // a painting of the desert, with water shimmering in the distance
  const desert = canvasTexture(384, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2dfb8'); gr.addColorStop(0.45, '#fbf1d8'); gr.addColorStop(0.46, '#e6c68a'); gr.addColorStop(1, '#c9a26b'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8fb5d9'; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(210, 128, 90, 9, 0, 0, 7); g.fill(); g.globalAlpha = 0.5; g.beginPath(); g.ellipse(200, 136, 60, 5, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    g.fillStyle = '#9a7a55'; for (const [x, y, s] of [[60, 190, 30], [300, 215, 22]]) { g.beginPath(); g.ellipse(x, y, s, s * 0.5, 0, 0, 7); g.fill(); }
  });
  const dPic = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.4), new THREE.MeshBasicMaterial({ map: desert })); dPic.position.set(P.mirage, 2.6, BACK + 0.1); root.add(dPic);
  const dFrame = mesh(new THREE.BoxGeometry(2.4, 1.7, 0.1), clay(0xc9a54c, { metalness: 0.4 })); dFrame.position.set(P.mirage, 2.6, BACK + 0.03); root.add(dFrame);

  const portals = [
    { id: 'ten-coins', name: 'Ten Coins', pos: V(P.coins, 0, Z + 1.4), labelAt: V(P.coins, 2.8, Z), prompt: 'Read the notice' },
    { id: 'stopped-clock', name: 'The Stopped Clock', pos: V(P.clock, 0, Z + 1.2), labelAt: V(P.clock, 4.2, BACK + 0.2), prompt: 'Look at the clock' },
    { id: 'sheep-field', name: 'The Sheep in the Field', pos: V(P.gate, 0, Z + 1.5), labelAt: V(P.gate, 2.2, Z + 0.3), prompt: 'Lean on the gate' },
    { id: 'fake-barns', name: 'Barn Façade County', pos: V(P.barns, 0, Z + 1.5), labelAt: V(P.barns, 3.3, Z), prompt: 'Look at the barn' },
    { id: 'mirage', name: "Dharmottara's Mirage", pos: V(P.mirage, 0, Z + 1.3), labelAt: V(P.mirage, 3.8, BACK + 0.2), prompt: 'Look at the painting' },
    { id: 'field', name: 'Out to the field', pos: V(0, 0, BACK + 1.2), labelAt: V(0, 4.8, BACK + 0.2), prompt: 'Go back out', home: true },
  ];
  let entering = null;
  for (const p of portals) interact.add({ pos: p.pos, radius: 1.7, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = p; ctx.player.enabled = false; ctx.goto(p.id); } });
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 10), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.z = -0.8; root.add(gp);

  const from = portals.find((p) => p.id === ctx.from && !p.home);
  const blockers = [
    { x: -11, z: -3.4, w: 3, d: 2.2 }, { x: farmer.position.x, z: farmer.position.z, r: 0.5 }, { x: wife.position.x, z: wife.position.z, r: 0.5 },
    { x: P.coins, z: Z, r: 0.5 }, { x: P.gate, z: Z + 0.3, w: 2.8, d: 0.4 }, { x: P.barns, z: Z, w: 2.8, d: 1.4, rot: -0.35 }, { x: -HALF + 0.35, z: BACK + 3.6, r: 0.5 },
  ];
  return {
    root,
    ground: [gp],
    spawn: from ? { x: from.pos.x, z: from.pos.z + 0.6, rotY: 0 } : { x: 0, z: BACK + 2.4, rotY: 0 },
    walkable: (x, z) => Math.abs(x) < HALF - 0.6 && z > BACK + 0.7 && z < FRONT,
    blockers: () => blockers,
    start() { if (ctx.from === 'field') ctx.toast('It smells of hay, and certainty.', 4); },
    camera(pl) {
      const look = V(clamp(pl.pos.x, -HALF + 8.5, HALF - 8.5), 2.4, -1.4);
      return { pos: look.clone().add(V(0, 4.6, 14.5)), look, stiffness: 2.4 };
    },
    update(dt, t) {
      animatePerson(wife, t, { energy: 0.15, phase: 1 }); animatePerson(farmer, t, { energy: 0.15 });
      lglow.intensity = 14 + Math.sin(t * 7) * 0.8;
      for (const p of portals) {
        const d = Math.hypot(ctx.player.pos.x - p.pos.x, ctx.player.pos.z - p.pos.z);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering ? 0 : clamp((5 - d) / 2.2), `<span class="dot" style="background:${css(p.home ? palette.rail : palette.agent)}"></span>${p.name}${done}`, p.labelAt);
      }
    },
  };
}
