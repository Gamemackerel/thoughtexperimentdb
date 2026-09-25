// The House: a surreal hub (Escher + Dalí in clay). Paintings, books and doors lead into the vignettes.
import { THREE, palette, css, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeTree, makeTable, seeded } from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ROOM = 7.3;                               // walkable half-size
const PAINTING = V(1.5, 3.7, -7.72);
const BOOK = V(-4.2, 0, 1.2);
const FLOOR_WINDOW = { x: -1.4, z: 4.4, r: 1.35 };
const DESK = V(-2, 0, -6.9);                    // the journal

const tex = (url) => { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; return t; };

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// A clock face, drooped over an edge (Dalí): vertices beyond `edge` sag down and wrap.
function makeMeltingClock(r = 0.75, edge = 0.1, droop = 2.4) {
  const face = canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#f6efe0'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c9a54c'; g.lineWidth = 10; g.stroke();
    g.fillStyle = '#2b2a33';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(128 + Math.cos(a) * 96 - 4, 128 + Math.sin(a) * 96 - 4, 8, 8); }
    g.lineWidth = 8; g.lineCap = 'round'; g.strokeStyle = '#2b2a33';
    g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.moveTo(128, 128); g.lineTo(180, 150); g.stroke();
  });
  const geo = new THREE.CylinderGeometry(r, r, 0.06, 48, 1);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    if (v.x > edge) { const d = v.x - edge; v.y -= d * d * droop + d * 0.6; v.x = edge + d * 0.55; }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mats = [clay(0xc9a54c, { metalness: 0.3 }), new THREE.MeshStandardMaterial({ map: face, roughness: 0.7 }), clay(0xc9a54c)];
  return mesh(geo, mats);
}

function makeDoor({ panel = 0x7a5a8c, sky = false } = {}) {
  const g = new THREE.Group();
  const frameMat = clay(0xf2e6d4);
  const frame = [[-0.78, 1.55, 0.14, 3.2], [0.78, 1.55, 0.14, 3.2], [0, 3.1, 1.7, 0.14]];
  for (const [x, y, w, h] of frame) { const f = mesh(new THREE.BoxGeometry(w, h, 0.3), frameMat); f.position.set(x, y, 0); g.add(f); }
  let mat = clay(panel);
  if (sky) mat = new THREE.MeshStandardMaterial({ roughness: 0.8, map: canvasTexture(128, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fb3d9'); gr.addColorStop(1, '#dfe9f2'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; for (const [x, y, s] of [[40, 70, 22], [70, 60, 28], [95, 74, 20], [30, 170, 16], [58, 164, 22]]) { c.beginPath(); c.arc(x, y, s, 0, 7); c.fill(); }
  }) });
  const door = mesh(new THREE.BoxGeometry(1.42, 2.95, 0.12), mat);
  door.position.set(0, 1.5, 0);
  const knob = mesh(new THREE.SphereGeometry(0.08, 12, 8), clay(0xc9a54c, { metalness: 0.5 }));
  knob.position.set(0.52, 1.45, 0.1);
  g.add(door, knob);
  return g;
}

export default function house(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 40, 120);

  // ---- floating slab + checkered floor
  const slab = mesh(new THREE.BoxGeometry(17, 1.4, 17), clay(palette.groundEdge));
  slab.position.y = -0.72;
  root.add(slab);
  const tiles = [new THREE.InstancedMesh(new THREE.BoxGeometry(0.99, 0.08, 0.99), clay(0xf2e9d8), 128),
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.99, 0.08, 0.99), clay(0x4a4e5a), 128)];
  const m = new THREE.Matrix4(), counts = [0, 0];
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const k = (i + j) % 2;
    m.makeTranslation(-7.5 + i, -0.04, -7.5 + j);
    tiles[k].setMatrixAt(counts[k]++, m);
  }
  tiles.forEach((t) => { t.receiveShadow = true; root.add(t); });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ visible: false }));
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  // ---- cutaway walls
  const wallMat = clay(0xe9dcc3);
  const back = mesh(new THREE.BoxGeometry(16.4, 8, 0.4), wallMat); back.position.set(0, 4, -8.1);
  const left = mesh(new THREE.BoxGeometry(0.4, 8, 16.4), wallMat); left.position.set(-8.1, 4, 0);
  const trim = mesh(new THREE.BoxGeometry(16.4, 0.3, 0.5), clay(0xd6c4a3)); trim.position.set(0, 0.15, -7.9);
  root.add(back, left, trim);

  // ---- the painting (The Trolley Problem)
  const paint = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.6), new THREE.MeshStandardMaterial({ map: tex('/game/assets/paintings/trolley.jpg'), roughness: 0.9 }));
  paint.position.copy(PAINTING);
  const gold = clay(0xc9a54c, { metalness: 0.45, roughness: 0.4 });
  const frame = new THREE.Group();
  for (const [x, y, w, h] of [[0, 1.42, 5.0, 0.26], [0, -1.42, 5.0, 0.26], [-2.42, 0, 0.26, 3.1], [2.42, 0, 0.26, 3.1]]) {
    const b = mesh(new THREE.BoxGeometry(w, h, 0.22), gold); b.position.set(x, y, 0); frame.add(b);
  }
  frame.position.copy(PAINTING).add(V(0, 0, 0.05));
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.6), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.copy(PAINTING).add(V(0, 0, -0.08));
  root.add(paint, frame, halo);

  // ---- the book (Brain in a Vat): Descartes' Meditations open on a lectern
  const lectern = new THREE.Group();
  const post = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.3, 12), clay(palette.wood)); post.position.y = 0.65;
  const top = mesh(new THREE.BoxGeometry(1.5, 0.12, 1.1), clay(palette.wood)); top.position.y = 1.35; top.rotation.x = 0.35;
  lectern.add(post, top);
  const book = new THREE.Group();
  const pageL = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshStandardMaterial({ map: tex('/game/assets/paintings/biv-left.jpg'), roughness: 0.9 }));
  const pageR = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshStandardMaterial({ map: tex('/game/assets/paintings/biv-right.jpg'), roughness: 0.9 }));
  pageL.position.set(-0.35, 0, 0); pageL.rotation.y = 0.12; pageR.position.set(0.35, 0, 0); pageR.rotation.y = -0.12;
  const cover = mesh(new THREE.BoxGeometry(1.46, 0.72, 0.04), clay(palette.judge)); cover.position.z = -0.03;
  book.add(cover, pageL, pageR);
  book.position.set(0, 1.47, 0.02); book.rotation.x = -Math.PI / 2 + 0.35;
  lectern.add(book);
  lectern.position.copy(BOOK); lectern.rotation.y = 0.5;
  root.add(lectern);

  // ---- doors: one in the wall, one standing alone with sky for a panel, one upside down, one on the "ceiling"
  const wallDoor = makeDoor({ panel: 0x7a5a8c }); wallDoor.position.set(-7.88, 0, 3.4); wallDoor.rotation.y = Math.PI / 2;
  const skyDoor = makeDoor({ sky: true }); skyDoor.position.set(5.2, 0, 2.2); skyDoor.rotation.y = -0.5;
  const upDoor = makeDoor({ panel: 0x3f8f86 }); upDoor.position.set(-4.6, 7.9, -7.88); upDoor.rotation.z = Math.PI;
  const ceilDoor = makeDoor({ panel: 0xe0674f }); ceilDoor.position.set(2.5, 9.6, 1); ceilDoor.rotation.x = Math.PI / 2;
  root.add(wallDoor, skyDoor, upDoor, ceilDoor);
  // a rope ladder hangs from the ceiling door: the way up to the hall
  const ladder = new THREE.Group();
  for (const x of [-0.45, 0.45]) { const rail = mesh(new THREE.CylinderGeometry(0.05, 0.05, 9.4, 8), clay(0xc9a878)); rail.position.set(x, 4.7, 0); ladder.add(rail); }
  for (let y = 0.5; y < 9.4; y += 0.6) { const rung = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 8), clay(palette.wood)); rung.rotation.z = Math.PI / 2; rung.position.y = y; ladder.add(rung); }
  ladder.position.set(2.5, 0, 1.9); ladder.rotation.x = -0.08;
  root.add(ladder);

  // ---- Penrose stairs (an endless loop), with a small figure climbing forever
  const stairs = new THREE.Group();
  const stepMat = clay(0xdcd0bb), steps = [];
  for (let i = 0; i < 16; i++) {
    const side = Math.floor(i / 4), k = i % 4, h = 0.4 + i * 0.18;
    const along = -1.5 + k * 1, s = 1.9;
    const [x, z] = [[along, -s], [s, along], [-along, s], [-s, -along]][side];
    const st = mesh(new THREE.BoxGeometry(1, h, 1), stepMat); st.position.set(x, h / 2, z);
    stairs.add(st); steps.push({ x, z, h });
  }
  stairs.position.set(-5.2, 0, -5.2);
  const climber = makePerson({ color: 0x9aa0ab, scale: 0.42 });
  stairs.add(climber);
  root.add(stairs);

  // ---- Dalí: a spindly-legged table with a melting clock; a bare tree with another
  const tall = new THREE.Group();
  const tTop = mesh(new THREE.BoxGeometry(2, 0.14, 1.3), clay(palette.wood)); tTop.position.y = 4.4;
  tall.add(tTop);
  for (const [x, z] of [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.05, 4.4, 8), clay(palette.ink)); leg.position.set(x, 2.2, z); tall.add(leg);
  }
  const clock1 = makeMeltingClock(0.75, 0.2);
  clock1.position.set(0.7, 4.52, 0); tall.add(clock1);
  tall.position.set(4.6, 0, -4.8); tall.rotation.y = -0.4;
  root.add(tall);
  const tree = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.14, 0.22, 3.2, 10), clay(palette.trunk)); trunk.position.y = 1.6;
  const branch = mesh(new THREE.CylinderGeometry(0.06, 0.1, 2, 8), clay(palette.trunk)); branch.position.set(0.8, 2.9, 0); branch.rotation.z = -1.25;
  const clock2 = makeMeltingClock(0.55, 0.05, 3); clock2.position.set(1.2, 3.2, 0); clock2.rotation.y = 0.3;
  tree.add(trunk, branch, clock2);
  tree.position.set(6.2, 0, 5.6); tree.rotation.y = 2.4;
  root.add(tree);

  // ---- a window in the floor, looking down into sky
  const skyTex = canvasTexture(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#dfe9f2'); gr.addColorStop(1, '#8fb3d9');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [x, y, s] of [[80, 90, 26], [110, 80, 32], [140, 96, 22], [160, 170, 20], [185, 164, 26]]) { g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  });
  skyTex.wrapS = skyTex.wrapT = THREE.RepeatWrapping;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(FLOOR_WINDOW.r, 48), new THREE.MeshBasicMaterial({ map: skyTex }));
  hole.rotation.x = -Math.PI / 2; hole.position.set(FLOOR_WINDOW.x, 0.012, FLOOR_WINDOW.z);
  const rim = mesh(new THREE.TorusGeometry(FLOOR_WINDOW.r, 0.09, 10, 48), clay(0xf2e6d4)); rim.rotation.x = Math.PI / 2; rim.position.copy(hole.position);
  root.add(hole, rim);

  // ---- an upside-down armchair floating overhead; clouds drifting through the room
  const chair = new THREE.Group();
  const up = clay(0x8c4a4a);
  const seat = mesh(new THREE.BoxGeometry(1.4, 0.45, 1.3), up); seat.position.y = 0.5;
  const cback = mesh(new THREE.BoxGeometry(1.4, 1.4, 0.3), up); cback.position.set(0, 1.2, -0.5);
  chair.add(seat, cback); chair.rotation.z = Math.PI; chair.position.set(-1.5, 7.2, -3);
  root.add(chair);
  const cloudMat = clay(0xffffff, { roughness: 1 });
  const clouds = [0, 1, 2].map((i) => {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) { const b = mesh(new THREE.SphereGeometry(0.5 + (k % 2) * 0.2, 16, 12), cloudMat); b.position.set(k * 0.55 - 0.8, (k % 2) * 0.15, 0); b.castShadow = false; c.add(b); }
    root.add(c); return c;
  });

  // ---- a writing desk with your journal lying open on it (answers + what to read next)
  let bookGlow;
  {
    const desk = makeTable({ w: 1.9, d: 0.95, h: 1.15, color: palette.wood }); desk.position.copy(DESK); root.add(desk);
    const pageTex = canvasTexture(256, 160, (g, w, h) => {
      g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#1f3d6b'; g.lineWidth = 3; g.globalAlpha = 0.55;
      for (let y = 26; y < h - 10; y += 18) for (const [a, b] of [[14, 118], [138, 242]]) { g.beginPath(); g.moveTo(a, y); g.lineTo(a + (b - a) * (0.55 + 0.45 * Math.abs(Math.sin(y * 7 + a))), y); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = '#d9cdb6'; g.fillRect(126, 0, 4, h);
    });
    const journalBook = new THREE.Group();
    const cover = mesh(new THREE.BoxGeometry(1.08, 0.04, 0.72), clay(0x3f5f8a)); journalBook.add(cover);
    const pages = mesh(new THREE.BoxGeometry(1.02, 0.05, 0.66), [clay(0xf6f0e2), clay(0xf6f0e2), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 }), clay(0xf6f0e2), clay(0xf6f0e2), clay(0xf6f0e2)]);
    pages.position.y = 0.045; journalBook.add(pages);
    journalBook.position.copy(DESK).add(V(-0.2, 1.3, 0.05)); journalBook.rotation.y = 0.12; root.add(journalBook);
    const pot = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.16, 12), clay(palette.ink)); pot.position.copy(DESK).add(V(0.6, 1.34, -0.2));
    const quill = mesh(new THREE.ConeGeometry(0.05, 0.75, 6), clay(0xf6f0e2)); quill.position.copy(DESK).add(V(0.66, 1.62, -0.2)); quill.rotation.set(0.2, 0, -0.45);
    root.add(pot, quill);
    bookGlow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    bookGlow.rotation.x = -Math.PI / 2; bookGlow.position.copy(journalBook.position).add(V(0, 0.08, 0)); root.add(bookGlow);
  }
  interact.add({ pos: DESK.clone().add(V(0, 0, 1.1)), radius: 1.6, prompt: 'Read your journal', enabled: () => !ctx.journalOpen, onUse: () => ctx.openJournal() });

  // ---- portals
  const portals = [
    { id: 'trolley-problem', name: 'The Trolley Problem', pos: V(PAINTING.x, 0, -6.4), labelAt: PAINTING.clone().add(V(0, 1.75, 0.2)), prompt: 'Step into the painting', open: true },
    { id: 'brain-in-a-vat', name: 'Brain in a Vat', pos: BOOK.clone(), labelAt: BOOK.clone().add(V(0, 2.2, 0)), prompt: 'Open the book', open: true },
    { id: 'platos-cave', name: "Plato's Cave", pos: V(-7, 0, 3.4), labelAt: V(-7.7, 3.7, 3.4), prompt: 'Open the door', open: true },
    { id: 'hall', name: 'Up to the hall', pos: V(2.5, 0, 2.6), labelAt: V(2.5, 5.2, 1.9), prompt: 'Climb the ladder', open: true },
    { id: 'ship-of-theseus', name: 'Ship of Theseus', pos: V(5.2, 0, 3.1), labelAt: V(5.2, 3.7, 2.2), prompt: 'Open the door', open: true },
  ];
  // soft glows behind the book and the doors (brighter once you've been through)
  const glowMat = () => new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const glows = [
    [new THREE.Mesh(new THREE.CircleGeometry(1.1, 32), glowMat()), 'brain-in-a-vat', BOOK.clone().add(V(0, 1.6, 0)), [-Math.PI / 2 + 0.35, 0, 0]],
    [new THREE.Mesh(new THREE.PlaneGeometry(2, 3.6), glowMat()), 'platos-cave', V(-7.7, 1.55, 3.4), [0, Math.PI / 2, 0]],
    [new THREE.Mesh(new THREE.PlaneGeometry(2, 3.6), glowMat()), 'ship-of-theseus', V(5.35, 1.55, 2.35), [0, -0.5, 0]],
  ].map(([m, id, pos, rot]) => { m.position.copy(pos); m.rotation.set(...rot); root.add(m); return [m, id]; });
  let entering = null;
  for (const p of portals) {
    interact.add({
      pos: p.pos, radius: 2.3, prompt: p.prompt, enabled: () => !entering,
      onUse: () => {
        if (!p.open) return ctx.toast(`<b>${p.name}</b> — not yet. This one is still being made.`);
        entering = { t: 0, portal: p };
        ctx.player.enabled = false;
        if (p.id !== 'trolley-problem') entering.t = 0.9;   // books and doors: straight through
      },
    });
  }

  const blockers = [
    { x: DESK.x - 0.6, z: DESK.z, r: 0.55 }, { x: DESK.x + 0.6, z: DESK.z, r: 0.55 },
    { x: 2.5, z: 1.7, r: 0.35 },
    { x: BOOK.x, z: BOOK.z, r: 0.75 }, { x: 4.6, z: -4.8, r: 1.2 }, { x: -5.2, z: -5.2, r: 2.6 },
    { x: 5.2, z: 2.2, r: 0.85 }, { x: 6.2, z: 5.6, r: 0.45 },
  ];

  let t = 0;
  return {
    root,
    ground: [ground],
    // come back out next to the portal you went through
    spawn: ({ 'trolley-problem': { x: PAINTING.x, z: -5.2, rotY: 0 }, 'brain-in-a-vat': { x: -2.6, z: 2.8, rotY: 0.6 },
      'platos-cave': { x: -5.6, z: 3.4, rotY: Math.PI / 2 }, hall: { x: 2.5, z: 3.4, rotY: 0 }, 'ship-of-theseus': { x: 4.2, z: 4.6, rotY: -0.4 } })[ctx.from] ?? { x: 0, z: 5.5, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < ROOM && Math.abs(z) < ROOM && Math.hypot(x - FLOOR_WINDOW.x, z - FLOOR_WINDOW.z) > FLOOR_WINDOW.r + 0.2,
    blockers: () => blockers,
    start() { if (!save.done.size) ctx.toast('Look around. Some things here lead elsewhere.', 5); },
    camera(player) {
      if (entering && entering.portal.id === 'trolley-problem') {
        const k = easeInOut(entering.t / 1.3);
        return { pos: V(PAINTING.x, 3.7, lerp(-1.2, -6.9, k)), look: PAINTING.clone(), stiffness: 6 };
      }
      // follow you, but lean towards the middle of the room so the walls and portals stay in frame
      const look = player.pos.clone().lerp(V(0, 0, -2.5), 0.45).add(V(0, 2.2, 0));
      return { pos: look.clone().add(V(1.2 + player.pos.x * 0.15, 10.5, 16)), look };
    },
    update(dt, time) {
      t = time;
      // the climber walks the endless stairs
      const u = (time * 0.35) % 16, i = Math.floor(u), f = u - i, a = steps[i], b = steps[(i + 1) % 16];
      const hop = Math.sin(Math.PI * f) * 0.15;
      climber.position.set(lerp(a.x, b.x, f), (i === 15 ? lerp(a.h, b.h + (a.h - b.h), f) : lerp(a.h, b.h, f)) + hop, lerp(a.z, b.z, f));
      climber.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      animatePerson(climber, time * 2, { energy: 0.6 });
      chair.position.y = 7.2 + Math.sin(time * 0.6) * 0.25; chair.rotation.y = time * 0.08;
      clouds.forEach((c, k) => { c.position.set(((time * 0.4 + k * 7) % 22) - 11, 7.4 + k * 0.7, -6.4 + k * 0.4); });   // high, along the back wall
      skyTex.offset.x = time * 0.01;
      halo.material.opacity = save.done.has('trolley-problem') ? 0.22 + 0.08 * Math.sin(time * 2) : 0.1 + 0.08 * Math.sin(time * 2);
      glows.forEach(([m, id]) => (m.material.opacity = save.done.has(id) ? 0.3 + 0.1 * Math.sin(time * 2) : 0.08 + 0.06 * Math.sin(time * 2 + 1)));
      bookGlow.material.opacity = save.done.size ? 0.22 + 0.08 * Math.sin(time * 2.4) : 0;
      { const d = Math.hypot(ctx.player.pos.x - DESK.x, ctx.player.pos.z - DESK.z - 1.1);
        ctx.ui.label('journal', ctx.journalOpen ? 0 : clamp((5 - d) / 2), `<span class="dot" style="background:${css(0x5b7fa6)}"></span>Your journal`, DESK.clone().add(V(0, 2.3, 0))); }
      // names appear as you approach
      for (const p of portals) {
        const d = Math.hypot(ctx.player.pos.x - p.pos.x, ctx.player.pos.z - p.pos.z);
        const o = clamp((6 - d) / 2.5);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering || ctx.journalOpen ? 0 : o, `<span class="dot" style="background:${css(p.open ? palette.agent : palette.rail)}"></span>${p.name}${done}`, p.labelAt);
      }
      if (entering) {
        entering.t += dt;
        if (entering.t > 1.3 && !entering.gone) { entering.gone = true; ctx.goto(entering.portal.id); }
      }
    },
  };
}
