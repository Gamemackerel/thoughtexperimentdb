// The Gallery: up Escher's stairs from the hall, a long room built after Picasso. The walls are broken into tilted,
// overlapping planes (cubism); the floor is cut into facets; one end is washed blue (the blue period) where an old man
// plays guitar; harlequin diamonds frame the doors; a grey mural of a bull, a horse and a lamp runs along the top; a
// sheet-metal guitar stands on a plinth; a weeping woman hangs in a frame with both eyes on one side of her face.
// Six portals: a ring under glass, a cell door, two boxes, a cake, a door with a slot, and three doors; and at the far
// end, a door out to the field.
import { THREE, palette, css, clamp, lerp, easeInOut, seeded, clay, mesh, makePerson, animatePerson, makeTable } from '/game/engine/core.js';
import { talk } from '../core/extras.js';
import { textTexture } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 17.5, BACK = -4.6, FRONT = 3.2;
const OCHRE = [0xc9a26b, 0xb88a52, 0xd9bf8c, 0x9a7a55, 0x8b8f94, 0x6d7684, 0xe6d3ad, 0x5b6f86];

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function gallery(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xefe4cf);
  stage.scene.fog = new THREE.Fog(0xefe4cf, 40, 120);
  const rnd = seeded(1907);

  // ---- floor: a slab cut into facets
  const slab = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 1.2, 10), clay(0x9a7a55)); slab.position.set(0, -0.62, -0.7); root.add(slab);
  const facets = canvasTexture(1024, 256, (g, w, h) => {
    const r = seeded(4), pts = [];
    for (let i = 0; i < 70; i++) pts.push([r() * w, r() * h]);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      let best = 0, bd = 1e9; pts.forEach(([px, py], k) => { const d = (px - x) ** 2 + ((py - y) * 1.6) ** 2; if (d < bd) { bd = d; best = k; } });
      g.fillStyle = ['#d9bf8c', '#c9a26b', '#b88a52', '#e6d3ad', '#a9aca8', '#c7b79a'][best % 6]; g.fillRect(x, y, 2, 2);
    }
    g.strokeStyle = 'rgba(40,30,20,0.18)'; g.lineWidth = 2;
    for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.stroke(); }
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 9), new THREE.MeshStandardMaterial({ map: facets, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.005, -0.7); floor.receiveShadow = true; root.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 10), new THREE.MeshBasicMaterial({ visible: false })); ground.rotation.x = -Math.PI / 2; ground.position.z = -0.7; root.add(ground);

  // ---- the back wall, broken into tilted overlapping planes with dark edges
  const outline = new THREE.LineBasicMaterial({ color: 0x2b2a33 });
  for (let i = 0; i < 26; i++) {
    const w = 2.2 + rnd() * 3.4, h = 3 + rnd() * 5.5, x = -HALF + (i / 25) * HALF * 2 + (rnd() - 0.5) * 1.2, y = 1 + rnd() * 5.5;
    const plane = mesh(new THREE.BoxGeometry(w, h, 0.12), clay(OCHRE[Math.floor(rnd() * OCHRE.length)], { roughness: 0.95 }));
    plane.position.set(x, y + h / 2 - 1, BACK - 0.3 - rnd() * 0.5); plane.rotation.set((rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.35, (rnd() - 0.5) * 0.5);
    plane.add(new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry), outline));
    root.add(plane);
  }
  const backing = mesh(new THREE.BoxGeometry(HALF * 2 + 2, 10, 0.3), clay(0xd9bf8c)); backing.position.set(0, 5, BACK - 1.1); root.add(backing);
  for (const sx of [-1, 1]) { const end = mesh(new THREE.BoxGeometry(0.4, 10, 9.5), clay(sx < 0 ? 0x5b6f86 : 0xc9a26b)); end.position.set(sx * (HALF + 0.3), 5, -0.6); end.rotation.z = sx * 0.04; root.add(end); }

  // ---- the blue period: the left end is washed in blue, and an old man plays guitar there
  const blue = new THREE.PointLight(0x5b7fd6, 45, 14, 1.6); blue.position.set(-HALF + 2.5, 4, 0); root.add(blue);
  const oldMan = new THREE.Group();
  const cloak = mesh(new THREE.ConeGeometry(0.8, 2.2, 12), clay(0x3d5a8c)); cloak.position.y = 1.1; oldMan.add(cloak);
  const head = mesh(new THREE.SphereGeometry(0.3, 16, 12), clay(0x9fb2d0)); head.position.set(0.1, 2.25, 0.25); oldMan.add(head);
  const gbody = mesh(new THREE.SphereGeometry(0.4, 16, 12), clay(0x8b6a3c)); gbody.scale.set(1, 0.4, 1.3); gbody.position.set(0.1, 1.3, 0.7); gbody.rotation.x = -0.4; oldMan.add(gbody);
  const neckG = mesh(new THREE.BoxGeometry(0.1, 0.06, 1), clay(0x5a3d29)); neckG.position.set(0.4, 1.6, 0.8); neckG.rotation.set(0, 0.6, 0.5); oldMan.add(neckG);
  oldMan.position.set(-HALF + 1.8, 0, -3); oldMan.rotation.y = 0.5; root.add(oldMan);

  // ---- a grey mural along the top: a bull, a horse crying out, a lamp like an eye, a broken sword
  const mural = canvasTexture(2048, 256, (g, w, h) => {
    g.fillStyle = '#e8e6e1'; g.fillRect(0, 0, w, h);
    const tone = ['#1f1f22', '#55565a', '#8b8c90', '#bdbdbd', '#f4f4f2'];
    const r = seeded(37);
    for (let i = 0; i < 60; i++) { g.fillStyle = tone[Math.floor(r() * 5)]; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 3; k++) g.lineTo(x + (r() - 0.5) * 260, y + (r() - 0.5) * 200); g.fill(); }
    g.strokeStyle = '#1f1f22'; g.lineWidth = 5; g.fillStyle = '#f4f4f2';
    // bull
    g.beginPath(); g.moveTo(180, 200); g.lineTo(230, 80); g.lineTo(300, 70); g.lineTo(330, 120); g.lineTo(300, 200); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(230, 80); g.quadraticCurveTo(200, 20, 240, 30); g.moveTo(300, 70); g.quadraticCurveTo(330, 10, 350, 40); g.stroke();
    g.beginPath(); g.arc(255, 110, 8, 0, 7); g.arc(300, 105, 8, 0, 7); g.fillStyle = '#1f1f22'; g.fill();
    // horse, mouth open
    g.fillStyle = '#bdbdbd'; g.beginPath(); g.moveTo(900, 230); g.lineTo(960, 90); g.lineTo(1040, 40); g.lineTo(1090, 70); g.lineTo(1060, 120); g.lineTo(1000, 130); g.lineTo(980, 230); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f4f4f2'; g.beginPath(); g.moveTo(1060, 80); g.lineTo(1110, 60); g.lineTo(1090, 95); g.closePath(); g.fill(); g.stroke();
    // lamp like an eye
    g.fillStyle = '#f4f4f2'; g.beginPath(); g.ellipse(1400, 60, 90, 36, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f2e6a0'; g.beginPath(); g.arc(1400, 60, 20, 0, 7); g.fill(); g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28; g.beginPath(); g.moveTo(1400 + Math.cos(a) * 26, 60 + Math.sin(a) * 26); g.lineTo(1400 + Math.cos(a) * 40, 60 + Math.sin(a) * 24); g.stroke(); }
    // broken sword and a flower
    g.beginPath(); g.moveTo(1650, 220); g.lineTo(1760, 180); g.moveTo(1770, 176); g.lineTo(1840, 150); g.stroke();
    g.fillStyle = '#f4f4f2'; g.beginPath(); g.arc(1800, 120, 14, 0, 7); g.fill(); g.stroke();
  });
  const muralM = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.25), new THREE.MeshStandardMaterial({ map: mural, roughness: 0.95 })); muralM.position.set(1.5, 7.3, BACK - 0.05); root.add(muralM);

  // ---- a weeping woman: both eyes on one side, a hat with a flower, bright planes of colour
  const weeping = canvasTexture(384, 480, (g, w, h) => {
    g.fillStyle = '#f2c14e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0674f'; g.fillRect(0, 0, w, 120);
    g.fillStyle = '#5b7fa6'; g.beginPath(); g.moveTo(40, 110); g.lineTo(340, 90); g.lineTo(300, 150); g.lineTo(70, 160); g.closePath(); g.fill();
    g.fillStyle = '#e8435a'; g.beginPath(); g.arc(300, 95, 22, 0, 7); g.fill();
    g.fillStyle = '#f6efe0'; g.beginPath(); g.moveTo(110, 160); g.lineTo(280, 160); g.lineTo(300, 330); g.lineTo(200, 420); g.lineTo(100, 330); g.closePath(); g.fill();
    g.fillStyle = '#7cc04e'; g.beginPath(); g.moveTo(200, 160); g.lineTo(280, 160); g.lineTo(300, 330); g.lineTo(200, 300); g.closePath(); g.fill();
    g.strokeStyle = '#1f1f22'; g.lineWidth = 5; g.fillStyle = '#fff';
    for (const [x, y] of [[150, 220], [205, 205]]) { g.beginPath(); g.ellipse(x, y, 26, 14, -0.3, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1f1f22'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = '#fff'; }
    g.beginPath(); g.moveTo(130, 240); g.lineTo(125, 280); g.moveTo(215, 225); g.lineTo(222, 262); g.stroke();
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(140, 330); g.lineTo(260, 320); g.lineTo(250, 370); g.lineTo(150, 375); g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(150 + i * 18, 335); g.lineTo(150 + i * 18, 370); g.stroke(); }
  });
  const wpic = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.4), new THREE.MeshStandardMaterial({ map: weeping, roughness: 0.9 })); wpic.position.set(4.9, 5, BACK + 0.2); wpic.rotation.z = 0.04; root.add(wpic);
  const wframe = mesh(new THREE.BoxGeometry(2.2, 2.7, 0.12), clay(0x2b2a33)); wframe.position.set(4.9, 5, BACK + 0.12); wframe.rotation.z = 0.04; root.add(wframe);

  // ---- a guitar in sheet metal and card, on a plinth in the room
  const guitar = new THREE.Group();
  const plinth = mesh(new THREE.BoxGeometry(1, 1.1, 1), clay(0xf1ece2)); plinth.position.y = 0.55; guitar.add(plinth);
  const gp1 = mesh(new THREE.BoxGeometry(1.1, 1.4, 0.06), clay(0xb88a52)); gp1.position.set(-0.1, 1.9, 0); gp1.rotation.z = 0.15; guitar.add(gp1);
  const gp2 = mesh(new THREE.BoxGeometry(0.8, 1, 0.06), clay(0x6d7684)); gp2.position.set(0.25, 2.2, 0.08); gp2.rotation.z = -0.2; guitar.add(gp2);
  const hole = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 20, 1, true), clay(0x2b2a33, { side: THREE.DoubleSide })); hole.rotation.x = Math.PI / 2; hole.position.set(0.05, 2, 0.3); guitar.add(hole);
  const gneck = mesh(new THREE.BoxGeometry(0.18, 1.4, 0.06), clay(0x5a3d29)); gneck.position.set(0.05, 3.1, 0.05); guitar.add(gneck);
  for (let i = 0; i < 4; i++) { const s = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.1, 4), clay(0xf6f0e2)); s.position.set(-0.04 + i * 0.03, 2.6, 0.14); guitar.add(s); }
  guitar.position.set(-10, 0, 1.2); guitar.rotation.y = 0.4; root.add(guitar);

  // ---- a painter in a striped shirt
  const painter = makePerson({ color: 0xf6f1e7 });
  for (let i = 0; i < 4; i++) { const st = mesh(new THREE.CylinderGeometry(0.352, 0.352, 0.06, 20), clay(0x2f3f5a)); st.position.y = 0.55 + i * 0.18; painter.userData.body.add(st); }
  painter.position.set(9.8, 0, 1.4); painter.rotation.y = -0.6; root.add(painter);
  const easel = new THREE.Group(); for (const [x, rz] of [[-0.4, -0.08], [0.4, 0.08]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.8, 6), clay(palette.wood)); l.position.set(x, 1.4, 0); l.rotation.z = rz; easel.add(l); }
  const canvas = mesh(new THREE.BoxGeometry(1.1, 1.3, 0.05), clay(0xfbf6ea)); canvas.position.set(0, 1.9, 0.05); easel.add(canvas);
  const daub = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: weeping })); daub.position.set(0, 1.9, 0.09); easel.add(daub);
  easel.position.set(11, 0, 0.8); easel.rotation.y = -0.9; root.add(easel);
  talk(ctx, { who: painter, lines: [
    'Why paint a face from one side, when you can paint it from every side at once?',
    'I paint things as I think them, not only as I see them.',
    'Blue, this year. Pink next year, perhaps.',
    "Everyone wants to understand a painting. Nobody tries to understand the birds singing."] });

  // ---- harlequin diamonds (for framing the portals)
  const harlequin = canvasTexture(128, 256, (g, w, h) => {
    const cols = ['#e0674f', '#f2c14e', '#3f8f86', '#5b7fa6', '#f6efe0'];
    for (let r = -1; r < 9; r++) for (let c = -1; c < 4; c++) {
      g.fillStyle = cols[(r * 3 + c * 2 + 10) % 5]; g.beginPath();
      const x = c * 42 + (r % 2 ? 21 : 0), y = r * 32; g.moveTo(x, y - 32); g.lineTo(x + 21, y); g.lineTo(x, y + 32); g.lineTo(x - 21, y); g.closePath(); g.fill();
      g.strokeStyle = '#1f1f22'; g.lineWidth = 2; g.stroke();
    }
  });
  const pillar = (x, z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.2, 0.45), new THREE.MeshStandardMaterial({ map: harlequin, roughness: 0.8 })); p.position.set(x, 2.1, z); root.add(p); };

  // ---- the six portals
  const P = { gyges: -12.5, pd: -7.5, newcomb: -2.5, monster: 2.5, chinese: 7.5, monty: 12.5 };
  const Z = BACK + 0.9;
  for (const x of Object.values(P)) { pillar(x - 1.9, BACK + 0.4); }
  pillar(P.monty + 1.9, BACK + 0.4);
  // a gold ring under a glass dome
  const ringPl = mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.1, 16), clay(0xf1ece2)); ringPl.position.set(P.gyges, 0.55, Z); root.add(ringPl);
  const ring = mesh(new THREE.TorusGeometry(0.16, 0.045, 12, 30), clay(0xe2b53b, { metalness: 0.7, roughness: 0.25 })); ring.position.set(P.gyges, 1.35, Z); root.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.05 })); dome.position.set(P.gyges, 1.1, Z); root.add(dome);
  // a cell door
  const cell = new THREE.Group();
  const cframe = mesh(new THREE.BoxGeometry(1.8, 3.2, 0.3), clay(0x6d7684)); cframe.position.y = 1.6; cell.add(cframe);
  const cdoor = mesh(new THREE.BoxGeometry(1.4, 2.8, 0.34), clay(0x3a3a42)); cdoor.position.y = 1.45; cell.add(cdoor);
  for (let i = 0; i < 4; i++) { const bar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), clay(0xb8bcc2, { metalness: 0.6 })); bar.position.set(-0.3 + i * 0.2, 2.25, 0.2); cell.add(bar); }
  cell.position.set(P.pd, 0, BACK + 0.2); root.add(cell);
  // two boxes on a table: one glass (with money), one closed
  const ntable = makeTable({ w: 2.2, d: 1.1, h: 1.1, color: 0x6b4a33 }); ntable.position.set(P.newcomb, 0, Z); root.add(ntable);
  const boxA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05 })); boxA.position.set(P.newcomb - 0.5, 1.51, Z); root.add(boxA);
  const notes = mesh(new THREE.BoxGeometry(0.4, 0.16, 0.22), clay(0x7cc04e)); notes.position.set(P.newcomb - 0.5, 1.3, Z); root.add(notes);
  const boxB = mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), clay(0x2b2a33)); boxB.position.set(P.newcomb + 0.5, 1.51, Z); root.add(boxB);
  // a cake on a stand, with one enormous fork
  const stand = mesh(new THREE.CylinderGeometry(0.7, 0.3, 1.1, 20), clay(0xf6f0e2)); stand.position.set(P.monster, 0.55, Z); root.add(stand);
  const cake = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 24), clay(0xf2a38f)); cake.position.set(P.monster, 1.35, Z); root.add(cake);
  const icing = mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.1, 24), clay(0xfbf6ea)); icing.position.set(P.monster, 1.62, Z); root.add(icing);
  const fork = mesh(new THREE.BoxGeometry(0.12, 2.4, 0.06), clay(0xc9ccd1, { metalness: 0.6 })); fork.position.set(P.monster + 0.95, 1.4, Z); fork.rotation.z = -0.2; root.add(fork);
  // a door with a slot and a sign in Chinese
  const cdoor2 = new THREE.Group();
  const cdp = mesh(new THREE.BoxGeometry(1.4, 2.9, 0.14), clay(0x8c4a4a)); cdp.position.y = 1.45; cdoor2.add(cdp);
  const slot = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.2), clay(0x1f1f22)); slot.position.set(0, 1.3, 0.05); cdoor2.add(slot);
  const csign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), new THREE.MeshBasicMaterial({ map: textTexture('房间', { w: 256, h: 100, font: '64px sans-serif' }) })); csign.position.set(0, 2.45, 0.08); cdoor2.add(csign);
  cdoor2.position.set(P.chinese, 0, BACK + 0.25); root.add(cdoor2);
  // three little doors
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.BoxGeometry(0.9, 2, 0.12), clay([0xe0674f, 0xf2c14e, 0x5b7fa6][i])); d.position.set(P.monty - 1.1 + i * 1.1, 1, BACK + 0.25); root.add(d);
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: textTexture(String(i + 1), { w: 64, h: 64, font: 'bold 44px sans-serif', bg: '#fbf6ea' }) })); n.position.set(P.monty - 1.1 + i * 1.1, 1.5, BACK + 0.32); root.add(n);
  }
  // the way down: the top of Escher's stairs, coming up through the floor
  const stairTop = new THREE.Group();
  for (let i = 0; i < 4; i++) { const st = mesh(new THREE.BoxGeometry(1.2, 0.3, 0.9), clay(0xdcd0bb)); st.position.set(-i * 0.75, -0.15 - i * 0.72, 0); stairTop.add(st); }
  const holeM = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.4), new THREE.MeshBasicMaterial({ color: 0x3a3228 })); holeM.rotation.x = -Math.PI / 2; holeM.position.set(-1.2, 0.01, 0); stairTop.add(holeM);
  stairTop.position.set(-HALF + 3.2, 0, 2); root.add(stairTop);

  // the far end: a door out, with daylight, wheat and a swirl of blue sky showing round its edges
  const outDoor = new THREE.Group();
  for (const [z, y, w, h] of [[-0.8, 1.6, 0.16, 3.2], [0.8, 1.6, 0.16, 3.2], [0, 3.2, 1.76, 0.16]]) { const f = mesh(new THREE.BoxGeometry(0.3, h, w), clay(0xf1ece2)); f.position.set(0, y, z); outDoor.add(f); }
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 3.1), new THREE.MeshBasicMaterial({ map: canvasTexture(128, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d3a78'); gr.addColorStop(0.55, '#5d8fca'); gr.addColorStop(0.56, '#e2b33b'); gr.addColorStop(1, '#c79a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#b9d2ea'; g.lineWidth = 5; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(40 + i * 12, 60 + i * 9, 18 + i * 6, 0, 4); g.stroke(); }
    g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(98, 30, 9, 0, 7); g.fill();
  }) }));
  outside.rotation.y = -Math.PI / 2; outside.position.set(0.02, 1.55, 0); outDoor.add(outside);
  outDoor.position.set(HALF + 0.05, 0, 0.6); root.add(outDoor);

  const portals = [
    { id: 'ring-of-gyges', name: 'Ring of Gyges', pos: V(P.gyges, 0, BACK + 2.2), labelAt: V(P.gyges, 2.6, Z), prompt: 'Lift the glass' },
    { id: 'prisoners-dilemma', name: "Prisoner's Dilemma", pos: V(P.pd, 0, BACK + 2), labelAt: V(P.pd, 3.8, BACK + 0.4), prompt: 'Open the cell' },
    { id: 'newcombs-paradox', name: "Newcomb's Paradox", pos: V(P.newcomb, 0, BACK + 2.3), labelAt: V(P.newcomb, 2.6, Z), prompt: 'Look at the boxes' },
    { id: 'utility-monster', name: 'The Utility Monster', pos: V(P.monster, 0, BACK + 2.2), labelAt: V(P.monster, 2.7, Z), prompt: 'Cut the cake' },
    { id: 'chinese-room', name: 'The Chinese Room', pos: V(P.chinese, 0, BACK + 2), labelAt: V(P.chinese, 3.6, BACK + 0.4), prompt: 'Knock on the door' },
    { id: 'monty-hall', name: 'The Monty Hall Problem', pos: V(P.monty, 0, BACK + 2), labelAt: V(P.monty, 2.8, BACK + 0.4), prompt: 'Pick a door' },
    { id: 'field', name: 'Outside', pos: V(HALF - 1.4, 0, 0.6), labelAt: V(HALF - 0.2, 3.8, 0.6), prompt: 'Step outside', home: true },
    { id: 'hall', name: 'Down to the hall', pos: V(-HALF + 3.2, 0, 2), labelAt: V(-HALF + 3.2, 1.8, 2), prompt: 'Go down the stairs', home: true },
  ];
  let entering = null;
  for (const p of portals) interact.add({ pos: p.pos, radius: 1.9, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = p; ctx.player.enabled = false; ctx.goto(p.id); } });

  const from = portals.find((p) => p.id === ctx.from && (!p.home || p.id === 'field'));
  const blockers = [{ x: -10, z: 1.2, r: 0.8 }, { x: painter.position.x, z: painter.position.z, r: 0.45 }, { x: 11, z: 0.8, r: 0.5 }, { x: oldMan.position.x, z: oldMan.position.z, r: 0.9 },
    { x: P.gyges, z: Z, r: 0.6 }, { x: P.newcomb, z: Z, r: 1.1 }, { x: P.monster, z: Z, r: 0.8 }, { x: -HALF + 2.4, z: 2, r: 1.2 }];

  return {
    root,
    ground: [ground],
    spawn: from ? (from.id === 'field' ? { x: from.pos.x - 0.8, z: from.pos.z, rotY: -Math.PI / 2 } : { x: from.pos.x, z: from.pos.z + 0.6, rotY: 0 }) : { x: -HALF + 5.4, z: 2, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.abs(x) < HALF - 0.6 && z > BACK + 1 && z < FRONT,
    blockers: () => blockers,
    start() { if (ctx.from === 'hall') ctx.toast('The stairs come out somewhere else entirely.', 4); },
    camera(pl) {
      const look = V(clamp(pl.pos.x, -HALF + 7, HALF - 7), 2.6, -1.4);
      return { pos: look.clone().add(V(0, 5.2, 15)), look, stiffness: 2.4 };
    },
    update(dt, t) {
      ring.rotation.y = t * 0.8; ring.position.y = 1.35 + Math.sin(t * 1.4) * 0.03;
      animatePerson(painter, t, { energy: 0.4 });
      oldMan.rotation.z = Math.sin(t * 0.7) * 0.02; neckG.rotation.x = Math.sin(t * 5) * 0.02;
      for (const p of portals) {
        const d = Math.hypot(ctx.player.pos.x - p.pos.x, ctx.player.pos.z - p.pos.z);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering ? 0 : clamp((5 - d) / 2.2), `<span class="dot" style="background:${css(p.home ? palette.rail : palette.agent)}"></span>${p.name}${done}`, p.labelAt);
      }
    },
  };
}
