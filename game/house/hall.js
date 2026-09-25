// The Hall: the house's second room, up through the ceiling door. A long corridor built after Magritte: its walls are
// painted sky, it's framed like a stage by red curtains, and it's full of his things: a table and chandelier hanging from
// the ceiling, day above night in one window, a painting on an easel that is exactly the view behind it, bowler-hatted
// men falling like rain outside, a steam train coming out of the fireplace, a room filled by one green apple, a mirror
// that shows the back of your head, a pipe that is not a pipe, a door with a hole in it, and a man whose face is hidden
// by an apple. Escher's stairs climb into the ceiling. Five portals line the back wall.
import { THREE, palette, css, clamp, lerp, clay, mesh, makePerson, animatePerson, makeTable, makeTrolley } from '/engine/core.js';
import { talk } from '../core/extras.js';

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
  // the walls are painted sky (a wallpaper of blue and cloud); the back wall is built around the mirror's opening
  const skyPaper = canvasTexture(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fb5dd'); gr.addColorStop(1, '#c9dcee'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.93)';
    for (const [x, y, s] of [[70, 90, 30], [110, 76, 40], [150, 92, 28], [330, 200, 26], [370, 186, 36], [410, 204, 24], [180, 380, 30], [220, 366, 42], [262, 384, 28], [460, 430, 22], [30, 300, 20]]) {
      for (const dx of [-512, 0, 512]) for (const dy of [-512, 0, 512]) { g.beginPath(); g.arc(x + dx, y + dy, s, 0, 7); g.fill(); }
    }
  });
  skyPaper.wrapS = skyPaper.wrapT = THREE.RepeatWrapping;
  const wallMat = (w, h) => { const t = skyPaper.clone(); t.needsUpdate = true; t.repeat.set(w / 6, h / 6); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); };
  const MIRROR = V(8.8, 0, -4.5), MW = 1.7, MH = 2.9;
  for (const [x0, x1] of [[-HALF - 0.5, MIRROR.x - MW / 2], [MIRROR.x + MW / 2, HALF + 0.5]]) {
    const w = x1 - x0, seg = mesh(new THREE.BoxGeometry(w, 9, 0.4), wallMat(w, 9)); seg.position.set((x0 + x1) / 2, 4.5, -4.7); root.add(seg);
  }
  const over = mesh(new THREE.BoxGeometry(MW, 9 - MH, 0.4), wallMat(MW, 9 - MH)); over.position.set(MIRROR.x, MH + (9 - MH) / 2, -4.7); root.add(over);
  const skirting = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 0.35, 0.08), clay(0xf2e6d4)); skirting.position.set(0, 0.17, -4.48); root.add(skirting);
  for (const sx of [-1, 1]) { const end = mesh(new THREE.BoxGeometry(0.4, 9, 9.4), wallMat(9.4, 9)); end.position.set(sx * (HALF + 0.3), 4.5, -0.3); root.add(end); }

  // stage curtains at both ends: the whole hall is a stage set
  const velvet = clay(0x9c2f35, { roughness: 0.8 });
  const curtain = (w, h) => {
    const geo = new THREE.PlaneGeometry(w, h, 24, 1), pp = geo.attributes.position;
    for (let k = 0; k < pp.count; k++) pp.setZ(k, Math.sin((pp.getX(k) / w) * Math.PI * 7) * 0.22);
    geo.computeVertexNormals(); return mesh(geo, new THREE.MeshStandardMaterial({ color: 0x9c2f35, roughness: 0.8, side: THREE.DoubleSide }));
  };
  for (const sx of [-1, 1]) { const c = curtain(2.6, 9); c.position.set(sx * (HALF - 0.9), 4.5, 3.2); root.add(c); }
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

  // ---- a bowler hat (Magritte's men wear them)
  const bowler = (s = 1) => {
    const g = new THREE.Group(), ink = clay(0x24232a);
    const crown = mesh(new THREE.SphereGeometry(0.3 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), ink); crown.scale.y = 1.15; g.add(crown);
    const brim = mesh(new THREE.CylinderGeometry(0.45 * s, 0.45 * s, 0.04 * s, 20), ink); g.add(brim);
    return g;
  };

  // ---- The Human Condition: an easel in front of the Empire of Light window, its canvas painted with exactly the
  // part of the window it hides (worked out from where the camera usually stands)
  const easel = new THREE.Group();
  for (const [x, rz, rx] of [[-0.55, -0.08, 0.05], [0.55, 0.08, 0.05], [0, 0, -0.28]]) { const leg = mesh(new THREE.CylinderGeometry(0.04, 0.05, 5.3, 6), clay(palette.wood)); leg.position.set(x, 2.6, rx < 0 ? -0.6 : 0); leg.rotation.set(rx, 0, rz); easel.add(leg); }
  const ledge = mesh(new THREE.BoxGeometry(1.6, 0.08, 0.2), clay(palette.wood)); ledge.position.set(0, 3.5, 0.08); easel.add(ledge);
  const hcTex = empire.clone(); hcTex.needsUpdate = true; hcTex.repeat.set(0.583, 0.466); hcTex.offset.set(0.2125, 0.172);
  const hc = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: hcTex })); hc.position.set(0, 4.2, 0.14); easel.add(hc);
  const hcEdge = mesh(new THREE.BoxGeometry(1.34, 1.34, 0.05), clay(0xf6f0e2)); hcEdge.position.set(0, 4.2, 0.1); easel.add(hcEdge);
  easel.position.set(-15.6, 0, -3.34); root.add(easel);

  // ---- a pipe that is not a pipe
  const pipeArt = canvasTexture(384, 256, (g, w, h) => {
    g.fillStyle = '#efe4c8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#6b3f22'; g.beginPath(); g.ellipse(260, 100, 42, 50, 0, 0, 7); g.fill();
    g.fillStyle = '#2b1a10'; g.beginPath(); g.ellipse(260, 62, 30, 10, 0, 0, 7); g.fill();
    g.strokeStyle = '#6b3f22'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(228, 118); g.quadraticCurveTo(160, 150, 70, 116); g.stroke();
    g.strokeStyle = '#1c1c1c'; g.lineWidth = 12; g.beginPath(); g.moveTo(96, 124); g.lineTo(62, 112); g.stroke();
    g.fillStyle = '#2b2a33'; g.font = 'italic 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('Ceci n’est pas une pipe.', w / 2, 222);
  });
  const pipePic = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: pipeArt, roughness: 0.9 })); pipePic.position.set(-2.5, 5.5, -4.46);
  const pipeFrame = mesh(new THREE.BoxGeometry(2.7, 1.9, 0.12), clay(0xc9a54c, { metalness: 0.4, roughness: 0.45 })); pipeFrame.position.set(-2.5, 5.5, -4.53);
  root.add(pipeFrame, pipePic);

  // ---- The Listening Room: a small room built out from the wall, completely filled by one green apple
  const LR = V(3.2, 0, -3.5);
  const lroom = new THREE.Group(); const cream = clay(0xf2e6d4), lwall = clay(0xe3d6bd);
  const lfloor = mesh(new THREE.BoxGeometry(2.3, 0.1, 2), clay(0x9a7453)); lfloor.position.y = 0.05; lroom.add(lfloor);
  for (const sx of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.1, 2.5, 2), lwall); w.position.set(sx * 1.15, 1.25, 0); lroom.add(w); }
  const lceil = mesh(new THREE.BoxGeometry(2.4, 0.12, 2.1), cream); lceil.position.y = 2.52; lroom.add(lceil);
  const lwin = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshBasicMaterial({ color: 0xcfe0ee })); lwin.position.set(-1.21, 1.5, -0.2); lwin.rotation.y = -Math.PI / 2; lroom.add(lwin);
  const apple = mesh(new THREE.SphereGeometry(1.12, 40, 28), clay(0x7cc04e, { roughness: 0.45 })); apple.scale.set(1, 0.95, 0.9); apple.position.y = 1.2; lroom.add(apple);
  const stem = mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 8), clay(0x6b4a33)); stem.position.set(0.05, 2.35, 0); stem.rotation.z = 0.2; lroom.add(stem);
  const leaf = mesh(new THREE.SphereGeometry(0.16, 10, 8), clay(0x3f7a3a)); leaf.scale.set(1.8, 0.35, 0.9); leaf.position.set(0.28, 2.35, 0); lroom.add(leaf);
  lroom.position.copy(LR); root.add(lroom);

  // ---- Not to be Reproduced: a tall mirror that shows the back of your head. It's really an opening into a little
  // room behind the wall, where a second "you" copies you, facing the same way you do.
  const mroom = new THREE.Group();
  const chk = canvasTexture(128, 128, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#7a5a8c' : '#f2e9d8'; g.fillRect(i * 32, j * 32, 32, 32); } });
  chk.wrapS = chk.wrapT = THREE.RepeatWrapping; chk.repeat.set(1.5, 2); chk.magFilter = THREE.NearestFilter;
  const mfloor = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.9 })); mfloor.rotation.x = -Math.PI / 2; mfloor.position.set(0, 0.001, -4); mroom.add(mfloor);
  for (const sx of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat(8, 4)); w.position.set(sx * 3, 2, -4); mroom.add(w); }
  const mback = mesh(new THREE.BoxGeometry(6, 4, 0.2), wallMat(6, 4)); mback.position.set(0, 2, -8); mroom.add(mback);
  const mceil = mesh(new THREE.BoxGeometry(6, 0.2, 8), clay(0xe3d6bd)); mceil.position.set(0, 3.2, -4); mroom.add(mceil);
  mroom.position.set(MIRROR.x, 0, MIRROR.z - 0.4); root.add(mroom);
  const mframe = new THREE.Group(); const gilt = clay(0xc9a54c, { metalness: 0.45, roughness: 0.4 });
  for (const [x, y, w, h] of [[0, MH + 0.1, MW + 0.4, 0.2], [-MW / 2 - 0.1, MH / 2, 0.2, MH + 0.2], [MW / 2 + 0.1, MH / 2, 0.2, MH + 0.2]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.18), gilt); b.position.set(x, y, 0); mframe.add(b); }
  mframe.position.set(MIRROR.x, 0, MIRROR.z + 0.05); root.add(mframe);
  const twin = makePerson({ color: palette.agent }); root.add(twin);

  // ---- Golconda: out of a high window, men in bowler hats hang in the air like rain
  const golSky = canvasTexture(512, 288, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9dbbd6'); gr.addColorStop(1, '#dfe9f2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8d9c0'; g.fillRect(0, h * 0.62, w * 0.45, h * 0.38); g.fillStyle = '#d9c6a6'; g.fillRect(w * 0.55, h * 0.55, w * 0.45, h * 0.45);
    g.fillStyle = '#b5654e'; g.fillRect(0, h * 0.58, w * 0.45, 12); g.fillRect(w * 0.55, h * 0.51, w * 0.45, 12);
    g.fillStyle = '#6d7684'; for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { g.fillRect(14 + c * 34, h * 0.68 + r * 26, 14, 16); g.fillRect(w * 0.58 + c * 34, h * 0.62 + r * 26, 14, 16); }
  });
  const golMen = canvasTexture(256, 256, (g) => {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const x = 20 + c * 42 + (r % 2) * 21, y = 20 + r * 50, s = 0.8 + ((r * 7 + c * 3) % 5) * 0.08;
      g.fillStyle = '#26252c'; g.fillRect(x - 6 * s, y, 12 * s, 26 * s);
      g.fillStyle = '#e9cfb2'; g.beginPath(); g.arc(x, y - 4 * s, 5 * s, 0, 7); g.fill();
      g.fillStyle = '#1b1a20'; g.fillRect(x - 8 * s, y - 10 * s, 16 * s, 2.5 * s); g.beginPath(); g.arc(x, y - 10 * s, 5 * s, Math.PI, 0); g.fill();
    }
  });
  golMen.wrapS = golMen.wrapT = THREE.RepeatWrapping; golMen.repeat.set(1.1, 0.7);
  const GOL = V(11, 6.3, -4.46);
  const golBg = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: golSky })); golBg.position.copy(GOL);
  const golFg = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.5), new THREE.MeshBasicMaterial({ map: golMen, transparent: true })); golFg.position.copy(GOL).add(V(0, 0, 0.01));
  const golFrame = mesh(new THREE.BoxGeometry(4.7, 2.8, 0.15), cream); golFrame.position.copy(GOL).add(V(0, 0, -0.08));
  const golBar = mesh(new THREE.BoxGeometry(0.1, 2.5, 0.06), cream); golBar.position.copy(GOL).add(V(0, 0, 0.03));
  root.add(golFrame, golBg, golFg, golBar);

  // ---- Time Transfixed: a steam engine coming out of the fireplace, smoke going up the chimney
  const FIRE = V(14.9, 0, -4.2);
  const fire = new THREE.Group(); const marble = clay(0xf1ece2);
  for (const sx of [-1, 1]) { const jamb = mesh(new THREE.BoxGeometry(0.45, 1.7, 0.6), marble); jamb.position.set(sx * 0.95, 0.85, 0); fire.add(jamb); }
  const mantel = mesh(new THREE.BoxGeometry(2.7, 0.2, 0.8), marble); mantel.position.set(0, 1.8, 0.05); fire.add(mantel);
  const lintel2 = mesh(new THREE.BoxGeometry(1.5, 0.4, 0.6), marble); lintel2.position.set(0, 1.5, 0); fire.add(lintel2);
  const hearth = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.3), new THREE.MeshBasicMaterial({ color: 0x1b1a20 })); hearth.position.set(0, 0.65, 0.05); fire.add(hearth);
  const clk = mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), clay(0x2b2a33)); clk.position.set(0, 2.2, 0); fire.add(clk);
  const clkFace = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: 0xf6efe0 })); clkFace.position.set(0, 2.25, 0.13); fire.add(clkFace);
  for (const sx of [-1, 1]) { const cs = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 10), clay(0xc9a54c, { metalness: 0.5 })); cs.position.set(sx * 0.95, 2.15, 0); fire.add(cs); }
  const loco = new THREE.Group(); const black = clay(0x1f1f24, { roughness: 0.5 });
  const boiler = mesh(new THREE.CylinderGeometry(0.26, 0.26, 1, 20), black); boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 0.62, 0); loco.add(boiler);
  const front = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 20), clay(0x3a3a42)); front.rotation.x = Math.PI / 2; front.position.set(0, 0.62, 0.5); loco.add(front);
  const stack = mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.36, 12), black); stack.position.set(0, 1.0, 0.3); loco.add(stack);
  const lamp = mesh(new THREE.SphereGeometry(0.06, 10, 8), clay(0xffe9a0)); lamp.position.set(0, 0.82, 0.52); loco.add(lamp);
  const buffer = mesh(new THREE.BoxGeometry(0.6, 0.08, 0.06), clay(0x8c4a4a)); buffer.position.set(0, 0.36, 0.54); loco.add(buffer);
  for (const sx of [-1, 1]) for (const z of [-0.15, 0.25]) { const wh = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 14), black); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 0.27, 0.3, z); loco.add(wh); }
  loco.position.set(0, 0, 0.35); fire.add(loco);
  fire.position.copy(FIRE); root.add(fire);
  const puffs = Array.from({ length: 4 }, () => { const p = mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 1, transparent: true, depthWrite: false })); p.castShadow = false; root.add(p); return p; });

  // ---- The Unexpected Answer: a door in the far wall with a hole broken through it, the shape of nothing in particular
  const holeShape = new THREE.Shape(); holeShape.moveTo(-0.72, 0); holeShape.lineTo(0.72, 0); holeShape.lineTo(0.72, 2.95); holeShape.lineTo(-0.72, 2.95);
  const hole = new THREE.Path(); hole.moveTo(-0.3, 0.9); hole.bezierCurveTo(-0.5, 1.3, -0.1, 1.5, -0.2, 1.9); hole.bezierCurveTo(-0.1, 2.3, 0.35, 2.2, 0.3, 1.8); hole.bezierCurveTo(0.45, 1.4, 0.1, 1.2, 0.25, 0.85); hole.bezierCurveTo(0.1, 0.6, -0.2, 0.7, -0.3, 0.9);
  holeShape.holes.push(hole);
  const udoor = mesh(new THREE.ExtrudeGeometry(holeShape, { depth: 0.1, bevelEnabled: false }), clay(0x8c4a4a));
  const udark = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.9), new THREE.MeshBasicMaterial({ color: 0x141318 })); udark.position.set(0, 1.47, -0.02);
  const uframe = new THREE.Group(); for (const [x, y, w, h] of [[-0.82, 1.55, 0.14, 3.2], [0.82, 1.55, 0.14, 3.2], [0, 3.1, 1.78, 0.14]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.2), cream); b.position.set(x, y, 0); uframe.add(b); }
  const unexp = new THREE.Group(); unexp.add(udark, udoor, uframe); unexp.position.set(-HALF + 0.12, 0, -1.2); unexp.rotation.y = Math.PI / 2; root.add(unexp);

  // ---- The Son of Man: a gentleman in a bowler hat, his face hidden by a hovering green apple
  const gent = makePerson({ color: 0x33343d }); gent.position.set(14.4, 0, 1.3); gent.rotation.y = -0.25; root.add(gent);
  const gHat = bowler(1.05); gHat.position.set(0, 2.02, 0); gent.userData.body.add(gHat);
  const gApple = mesh(new THREE.SphereGeometry(0.26, 18, 14), clay(0x7cc04e, { roughness: 0.45 })); root.add(gApple);
  const gLeaf = mesh(new THREE.SphereGeometry(0.07, 8, 6), clay(0x3f7a3a)); gLeaf.scale.set(1.6, 0.4, 0.8); root.add(gLeaf);
  talk(ctx, { who: gent, lines: ['Good afternoon.', '(The apple stays exactly in front of his face.)', 'Everything we see hides another thing, you know.', 'We always want to see what is hidden by what we see.', 'The hats? Oh, they come and go.'] });

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
    { id: 'gallery', name: 'Up the stairs', pos: V(-12.2, 0, -2.6), labelAt: V(-12, 2.4, -3.9), prompt: 'Climb the stairs' },
    { id: 'house', name: 'Down to the first room', pos: V(-15, 0, 1.4), labelAt: V(-15, 1.6, 1.4), prompt: 'Climb down', home: true },
  ];
  let entering = null;
  for (const p of portals) interact.add({ pos: p.pos, radius: 2.2, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = p; ctx.player.enabled = false; ctx.goto(p.id); } });

  const spawnAt = { 'grandfather-paradox': [-10, -1.4], 'infinite-monkey': [-5, -1.2], 'simulation-argument': [0, -1.2], 'fermi-paradox': [6.2, -0.6], 'tragedy-of-the-commons': [11.5, -1.2], gallery: [-12.2, -1.6] }[ctx.from];
  const blockers = [{ x: LR.x - 0.6, z: LR.z, r: 0.9 }, { x: LR.x + 0.6, z: LR.z, r: 0.9 }, { x: -15.6, z: -3.4, r: 0.6 }, { x: FIRE.x, z: FIRE.z + 0.5, r: 1.1 }, { x: 14.4, z: 1.3, r: 0.5 }, { x: -10, z: -3.9, r: 0.8 }, { x: -5, z: -3.5, r: 1 }, { x: 0, z: -3.5, r: 1 }, { x: 6.2, z: -2.8, r: 0.6 }, { x: 11.5, z: -3.6, r: 0.6 }];

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
      // the mirror: your twin stands where your reflection would be, but facing the same way you do
      const P = ctx.player, near = Math.abs(P.pos.x - MIRROR.x) < 4.5;
      twin.visible = near;
      if (near) {
        twin.position.set(P.pos.x, 0, 2 * MIRROR.z - P.pos.z - 0.2); twin.rotation.y = P.obj.rotation.y;
        const pb = P.obj.userData.body, tb = twin.userData.body; tb.position.copy(pb.position); tb.rotation.copy(pb.rotation); tb.scale.copy(pb.scale);
      }
      golMen.offset.y = (t * 0.015) % 1;
      // the train's smoke, going up the chimney it came out of
      puffs.forEach((p, k) => { const u = ((t * 0.5 + k / puffs.length) % 1); p.position.set(FIRE.x + Math.sin(k * 2.3 + t) * 0.1 * u, 1.05 + u * 1.2, FIRE.z + 0.65 - u * 0.5); p.scale.setScalar(0.6 + u * 1.6); p.material.opacity = 0.85 * (1 - u); });
      // the apple hovers in front of the gentleman's face
      const gf = V(0, 1.72 + Math.sin(t * 1.3) * 0.03, 0.55).applyAxisAngle(V(0, 1, 0), gent.rotation.y).add(gent.position);
      gApple.position.copy(gf); gLeaf.position.copy(gf).add(V(0.08, 0.26, 0));
      animatePerson(gent, t, { energy: 0.2 });
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
