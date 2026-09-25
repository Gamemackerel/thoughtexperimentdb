// The Hall: the house's second room, up through the ceiling door. A long corridor dressed after Magritte and Escher
// (a table hanging from the ceiling, day above night in one window, floating hats and apples, stairs that climb into
// the ceiling). Five portals line the back wall.
import { THREE, palette, css, clamp, lerp, clay, mesh, makePerson, animatePerson, makeTable } from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 17.5, DEPTH = 3.2;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function hall(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 40, 120);

  // ---- floor, back wall, and a ceiling you can see from below (it's where the furniture lives)
  const slab = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 1.2, 10), clay(palette.groundEdge)); slab.position.set(0, -0.62, -0.5); root.add(slab);
  const tiles = [new THREE.InstancedMesh(new THREE.BoxGeometry(0.99, 0.08, 0.99), clay(0xf2e9d8), 200), new THREE.InstancedMesh(new THREE.BoxGeometry(0.99, 0.08, 0.99), clay(0x7a5a8c), 200)];
  const m = new THREE.Matrix4(), counts = [0, 0];
  for (let i = 0; i < 36; i++) for (let j = 0; j < 9; j++) { const k = (i + j) % 2; m.makeTranslation(-HALF + 0.5 + i, -0.04, -4.5 + 0.5 + j); tiles[k].setMatrixAt(counts[k]++, m); }
  tiles.forEach((t) => { t.count = counts[tiles.indexOf(t)]; t.receiveShadow = true; root.add(t); });
  const back = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 9, 0.4), clay(0xe3d6bd)); back.position.set(0, 4.5, -4.7); root.add(back);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 10), new THREE.MeshBasicMaterial({ visible: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -0.5; root.add(ground);

  // ---- Magritte: a dining table and chandelier hanging upside down from the ceiling
  const upside = new THREE.Group();
  const tbl = makeTable({ w: 3, d: 1.6, h: 1.4, color: palette.wood }); upside.add(tbl);
  for (const x of [-1, 1]) { const c = mesh(new THREE.BoxGeometry(0.6, 1, 0.6), clay(0x8c4a4a)); c.position.set(x, 0.5, 1.1); upside.add(c); }
  const chand = new THREE.Group();
  const rod = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), clay(0xc9a54c)); rod.position.y = 0.6; chand.add(rod);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const cn = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), clay(0xfff6e6)); cn.position.set(Math.cos(a) * 0.6, 1.25, Math.sin(a) * 0.6); chand.add(cn); }
  chand.position.set(0, 1.5, 0); upside.add(chand);
  upside.rotation.z = Math.PI; upside.position.set(-3.5, 9.5, -1.5);
  root.add(upside);

  // ---- Magritte's Empire of Light: a daytime sky above a night-time street, in one window
  const empire = canvasTexture(256, 320, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, '#7fa8d6'); sky.addColorStop(1, '#cfe0ee'); g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.55);
    g.fillStyle = '#fff'; for (const [x, y, s] of [[60, 60, 22], [90, 52, 28], [120, 64, 20], [180, 110, 18], [200, 104, 24]]) { g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
    g.fillStyle = '#1c2230'; g.fillRect(0, h * 0.5, w, h * 0.5);
    g.fillStyle = '#2c2a33'; g.fillRect(20, h * 0.42, 80, h * 0.58); g.fillRect(150, h * 0.46, 90, h * 0.54);
    g.fillStyle = '#ffd98a'; g.fillRect(40, h * 0.6, 14, 18); g.fillRect(175, h * 0.66, 14, 18);
    g.fillStyle = '#444'; g.fillRect(126, h * 0.62, 4, h * 0.3);
    const lamp = g.createRadialGradient(128, h * 0.62, 2, 128, h * 0.62, 40); lamp.addColorStop(0, 'rgba(255,230,160,0.95)'); lamp.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = lamp; g.beginPath(); g.arc(128, h * 0.62, 40, 0, 7); g.fill();
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), new THREE.MeshBasicMaterial({ map: empire })); win.position.set(-16, 4.2, -4.48);
  const winFrame = mesh(new THREE.BoxGeometry(2.7, 3.3, 0.15), clay(0xf2e6d4)); winFrame.position.set(-16, 4.2, -4.56);
  root.add(winFrame, win);

  // ---- Escher: stairs that climb up into the ceiling; a small figure walks them forever
  const stairs = new THREE.Group(); const steps = [];
  for (let i = 0; i < 12; i++) { const st = mesh(new THREE.BoxGeometry(1.2, 0.3, 0.9), clay(0xdcd0bb)); st.position.set(-12 + i * 0.75, 0.5 + i * 0.72, -3.9); stairs.add(st); steps.push(st.position.clone()); }
  const walker = makePerson({ color: 0x9aa0ab, scale: 0.42 }); stairs.add(walker);
  root.add(stairs);

  // ---- floating bowler hats and green apples
  const floaters = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    if (i % 2) { const b = mesh(new THREE.SphereGeometry(0.28, 16, 12), clay(0x6cbf4a)); const leaf = mesh(new THREE.SphereGeometry(0.08, 8, 6), clay(0x3f7a3a)); leaf.scale.set(1.6, 0.4, 0.8); leaf.position.set(0.1, 0.3, 0); g.add(b, leaf); }
    else { const crown = mesh(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(palette.ink)); crown.scale.y = 1.2; const brim = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 20), clay(palette.ink)); g.add(crown, brim); }
    root.add(g); floaters.push({ g, x: -15 + i * 5, y: 6 + (i % 3) * 0.7, ph: i * 1.3 });
  }

  // ---- the five portals
  // grandfather clock
  const clock = new THREE.Group();
  const case_ = mesh(new THREE.BoxGeometry(1.1, 3.6, 0.7), clay(0x6b4a33)); case_.position.y = 1.8; clock.add(case_);
  const hood = mesh(new THREE.BoxGeometry(1.3, 0.3, 0.8), clay(0x5a3d29)); hood.position.y = 3.7; clock.add(hood);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), new THREE.MeshStandardMaterial({ map: canvasTexture(128, 128, (g) => { g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#2b2a33'; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(64 + Math.cos(a) * 50 - 3, 64 + Math.sin(a) * 50 - 3, 6, 6); } g.lineWidth = 6; g.strokeStyle = '#2b2a33'; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke(); }) }));
  face.position.set(0, 3.1, 0.36); clock.add(face);
  const pend = new THREE.Group(); const bob = mesh(new THREE.SphereGeometry(0.14, 12, 10), clay(0xc9a54c)); bob.position.y = -1.2; const prod = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), clay(0xc9a54c)); prod.position.y = -0.6; pend.add(prod, bob);
  pend.position.set(0, 2.6, 0.37); clock.add(pend);
  clock.position.set(-10, 0, -3.9); root.add(clock);
  // typewriter on a desk
  const tdesk = makeTable({ w: 2, d: 1.1, h: 1.2, color: palette.wood }); tdesk.position.set(-5, 0, -3.5); root.add(tdesk);
  const tw = new THREE.Group(); const tbody = mesh(new THREE.BoxGeometry(0.9, 0.3, 0.6), clay(palette.ink)); tw.add(tbody);
  const paper = mesh(new THREE.BoxGeometry(0.6, 0.6, 0.02), clay(0xfbf6ea)); paper.position.set(0, 0.4, -0.2); paper.rotation.x = -0.2; tw.add(paper);
  tw.position.set(-5, 1.46, -3.5); root.add(tw);
  // a glowing monitor with a tiny room inside
  const mdesk = makeTable({ w: 2, d: 1.1, h: 1.2, color: palette.wood }); mdesk.position.set(0, 0, -3.5); root.add(mdesk);
  const mon = mesh(new THREE.BoxGeometry(1.2, 1, 0.8), clay(0xdcd6cb)); mon.position.set(0, 1.85, -3.6); root.add(mon);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: canvasTexture(128, 96, (g) => { g.fillStyle = '#16302c'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#6fe0b8'; g.fillRect(30, 50, 68, 30); g.fillStyle = '#f2e6d4'; g.fillRect(44, 30, 40, 24); g.fillStyle = '#c9705a'; g.beginPath(); g.moveTo(40, 30); g.lineTo(64, 14); g.lineTo(88, 30); g.fill(); g.fillStyle = '#3f8f86'; g.fillRect(60, 60, 6, 12); }) }));
  scr.position.set(0, 1.9, -3.19); root.add(scr);
  // a brass telescope at a window full of stars
  const stars = canvasTexture(256, 320, (g, w, h) => { g.fillStyle = '#131a2e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 180; i++) { g.fillStyle = `rgba(255,255,240,${0.4 + Math.random() * 0.6})`; const s = Math.random() * 2.2; g.fillRect(Math.random() * w, Math.random() * h, s, s); } });
  const swin = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshBasicMaterial({ map: stars })); swin.position.set(6.2, 4.4, -4.48);
  const sframe = mesh(new THREE.BoxGeometry(2.5, 3.1, 0.15), clay(0xf2e6d4)); sframe.position.set(6.2, 4.4, -4.56);
  const scope = new THREE.Group(); const tube = mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.8, 16), clay(0xc9a54c, { metalness: 0.5, roughness: 0.35 })); tube.rotation.x = -1.0; tube.position.y = 1.7; scope.add(tube);
  for (const a of [0, 2.1, 4.2]) { const leg = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), clay(palette.wood)); leg.position.set(Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); scope.add(leg); }
  scope.position.set(6.2, 0, -2.8); root.add(sframe, swin, scope);
  // a green garden gate, grass pushing through the floor around it
  const gate = new THREE.Group(); const gmat = clay(0x4f8a55);
  for (const x of [-0.8, 0.8]) { const post = mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), gmat); post.position.set(x, 1.1, 0); gate.add(post); }
  for (let i = 0; i < 6; i++) { const bar = mesh(new THREE.BoxGeometry(0.08, 1.6, 0.08), gmat); bar.position.set(-0.55 + i * 0.22, 0.95, 0); gate.add(bar); }
  const rail = mesh(new THREE.BoxGeometry(1.7, 0.1, 0.1), gmat); rail.position.y = 1.7; gate.add(rail);
  const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(0.06, 0.4, 5), clay(0x7fb069), 60);
  for (let i = 0; i < 60; i++) { m.makeTranslation((Math.random() - 0.5) * 3, 0.15, (Math.random() - 0.5) * 1.6); tufts.setMatrixAt(i, m); }
  gate.add(tufts); gate.position.set(11.5, 0, -3.6); root.add(gate);

  // the way back down: a round hatch in the floor
  const hatch = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 32), clay(palette.wood)); hatch.position.set(-15, 0.02, 1.4); root.add(hatch);
  const ring = mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), clay(0xc9a54c)); ring.rotation.x = Math.PI / 2; ring.position.set(-15, 0.07, 1.4); root.add(ring);

  const portals = [
    { id: 'grandfather-paradox', name: 'Grandfather Paradox', pos: V(-10, 0, -2.4), labelAt: V(-10, 4.4, -3.9), prompt: 'Open the clock' },
    { id: 'infinite-monkey', name: 'Infinite Monkey Theorem', pos: V(-5, 0, -2.2), labelAt: V(-5, 2.6, -3.5), prompt: 'Sit at the typewriter' },
    { id: 'simulation-argument', name: 'Simulation Argument', pos: V(0, 0, -2.2), labelAt: V(0, 3, -3.6), prompt: 'Look into the screen' },
    { id: 'fermi-paradox', name: 'Fermi Paradox', pos: V(6.2, 0, -1.8), labelAt: V(6.2, 3, -2.8), prompt: 'Look through the telescope' },
    { id: 'tragedy-of-the-commons', name: 'Tragedy of the Commons', pos: V(11.5, 0, -2.2), labelAt: V(11.5, 2.6, -3.6), prompt: 'Open the gate' },
    { id: 'house', name: 'Down to the first room', pos: V(-15, 0, 1.4), labelAt: V(-15, 1.6, 1.4), prompt: 'Climb down', home: true },
  ];
  let entering = null;
  for (const p of portals) interact.add({ pos: p.pos, radius: 2.2, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = p; ctx.player.enabled = false; ctx.goto(p.id); } });

  const spawnAt = { 'grandfather-paradox': [-10, -1.4], 'infinite-monkey': [-5, -1.2], 'simulation-argument': [0, -1.2], 'fermi-paradox': [6.2, -0.6], 'tragedy-of-the-commons': [11.5, -1.2] }[ctx.from];
  const blockers = [{ x: -10, z: -3.9, r: 0.8 }, { x: -5, z: -3.5, r: 1 }, { x: 0, z: -3.5, r: 1 }, { x: 6.2, z: -2.8, r: 0.6 }, { x: 11.5, z: -3.6, r: 0.6 }];

  return {
    root,
    ground: [ground],
    spawn: spawnAt ? { x: spawnAt[0], z: spawnAt[1], rotY: 0 } : { x: -13.5, z: 1.4, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.abs(x) < HALF - 0.6 && z > -4.1 && z < DEPTH,
    blockers: () => blockers,
    start() { if (ctx.from === 'house') ctx.toast('A long hall. More doors, of a sort.', 4); },
    camera(pl) {
      const look = V(clamp(pl.pos.x, -HALF + 7, HALF - 7), 2.4, -1.6);
      return { pos: look.clone().add(V(0, 5.5, 15)), look, stiffness: 2.4 };
    },
    update(dt, t) {
      pend.rotation.z = Math.sin(t * 2.2) * 0.35;
      const u = (t * 0.3) % 12, i = Math.floor(u), f = u - i, a = steps[i], b = steps[(i + 1) % 12];
      walker.position.set(lerp(a.x, i === 11 ? a.x + 0.75 : b.x, f), lerp(a.y, i === 11 ? a.y + 0.72 : b.y, f) + 0.15 + Math.sin(Math.PI * f) * 0.12, a.z);
      walker.rotation.y = Math.PI / 2; animatePerson(walker, t * 2, { energy: 0.6 });
      walker.visible = i < 11;
      for (const fl of floaters) { fl.g.position.set(fl.x + Math.sin(t * 0.3 + fl.ph) * 0.8, fl.y + Math.sin(t * 0.7 + fl.ph) * 0.3, -2.8 + Math.cos(t * 0.4 + fl.ph) * 0.5); fl.g.rotation.y = t * 0.3 + fl.ph; }
      for (const p of portals) {
        const d = Math.hypot(ctx.player.pos.x - p.pos.x, ctx.player.pos.z - p.pos.z);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering ? 0 : clamp((5 - d) / 2.2), `<span class="dot" style="background:${css(p.home ? palette.rail : palette.agent)}"></span>${p.name}${done}`, p.labelAt);
      }
    },
  };
}
