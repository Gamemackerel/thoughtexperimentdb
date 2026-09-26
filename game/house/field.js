// The Field: through the door at the end of the gallery, outside, and into a painting after Van Gogh. A wheat field
// under a starry, swirling sky, with a crescent moon wrapped in orange light; flame-shaped cypresses; a village with a
// church spire below the hill; a café terrace under a yellow awning and a lamp; sunflowers; crows over the wheat; a
// rush-seated yellow chair with a pipe on it; and a painter in a straw hat at his easel. All of it in thick strokes.
// Nine portals stand in the field, and a lane runs up to a red barn (the Gettier cases, after Grant Wood).
import { THREE, palette, css, clamp, lerp, seeded, clay, mesh, makePerson, animatePerson, makeHouse } from '/game/engine/core.js';
import { talk } from '../core/extras.js';
import { canvasTexture, strokes, strokeTexture, starrySky } from '../core/brush.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const R = 25;                                                      // the hilltop's radius

// a cypress: a tall dark flame, twisting as it goes up
function makeCypress(h = 7, rnd = Math.random) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new THREE.Vector2(Math.max(0.02, Math.sin(Math.PI * Math.pow(u, 0.7)) * (1 - u * 0.55) * 1.1 + Math.sin(u * 19) * 0.08), u * h)); }
  const g = new THREE.Group();
  const flame = mesh(new THREE.LatheGeometry(pts, 10), clay(0x1f4a35, { flatShading: true })); g.add(flame);
  const flame2 = mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p.x * 0.8, p.y * 0.96)), 7), clay(0x2f6a45, { flatShading: true })); flame2.position.set(0.25, 0.3, 0.3); flame2.rotation.y = 1; g.add(flame2);
  g.rotation.z = (rnd() - 0.5) * 0.08;
  return g;
}

export default function field(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0x1d3a78);
  stage.scene.fog = new THREE.Fog(0x2a4f8f, 60, 190);
  stage.hemi.color.set(0xd6e0ff); stage.hemi.intensity = 1.35; stage.sun.color.set(0xffe6b0); stage.sun.intensity = 2.1;
  const rnd = seeded(1888);

  // ---- the sky: a painted sphere
  const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 48, 24), new THREE.MeshBasicMaterial({ map: starrySky(), side: THREE.BackSide, fog: false }));
  sky.rotation.y = -Math.PI / 2 - 0.35; root.add(sky);

  // ---- the hilltop, painted in short strokes of ochre, green and gold
  const groundTex = strokeTexture({ base: '#b89a4a', colors: ['#d9b44a', '#c79a3a', '#8a9a4a', '#6f8a45', '#e6c65a', '#a88a3a'], count: 2200, len: [10, 20], width: [4, 7], dir: () => -0.4 }, { repeat: [7, 7] });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.6, 96), [new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 1 }), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }), new THREE.MeshStandardMaterial({ color: 0x8a6a3a })]);
  top.position.y = -0.3; top.receiveShadow = true; root.add(top);
  const base = mesh(new THREE.CylinderGeometry(R - 0.2, R - 4, 6, 96), clay(0x6b5a3a)); base.position.y = -3.6; root.add(base);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp);

  // ---- the village in the valley below: small houses, and a church with a thin spire
  const village = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const h = makeHouse({ color: [0xe6d3ad, 0xcfd6e2, 0xd9bf8c][i % 3], roof: [0x3f5a8c, 0x2c3f6a, 0x5b6f86][i % 3] });
    const a = -2.2 + (i / 15) * 1.5 + (rnd() - 0.5) * 0.08, d = 44 + rnd() * 10; h.position.set(Math.cos(a) * d, -9, Math.sin(a) * d); h.rotation.y = rnd() * 6; h.scale.setScalar(1.5); village.add(h);
  }
  const church = new THREE.Group(); const nave = mesh(new THREE.BoxGeometry(3, 3, 6), clay(0x5b6f86)); nave.position.y = 1.5; church.add(nave);
  const spire = mesh(new THREE.ConeGeometry(0.9, 9, 6), clay(0x2c3f6a)); spire.position.set(0, 7, 2.4); church.add(spire);
  church.position.set(-26, -9, -44); church.scale.setScalar(1.5); village.add(church);
  const valley = mesh(new THREE.CylinderGeometry(70, 70, 1, 64), clay(0x3f5a6a)); valley.position.y = -9.6; root.add(valley, village);
  for (let i = 0; i < 40; i++) { const lit = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd76a })); const h = village.children[i % 16]; lit.position.copy(h.position).add(V((rnd() - 0.5) * 3, 1.8 + rnd(), 2.2)); lit.lookAt(0, 0, 0); root.add(lit); }

  // ---- the wheat: gold stalks everywhere except around the portals and the painter; they lean away as you pass
  const clearings = [];
  const inClearing = (x, z) => clearings.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr);
  const wheatGeo = new THREE.ConeGeometry(0.05, 1.3, 4); wheatGeo.translate(0, 0.65, 0);
  const WHEAT = 2600;
  const wheat = new THREE.InstancedMesh(wheatGeo, clay(0xe2b33b, { flatShading: true }), WHEAT);
  const wheatAt = [];
  root.add(wheat);

  // ---- cypresses, a patch of sunflowers, the café terrace, the chair
  for (const [x, z, h] of [[-18, -8, 8], [-16.5, -6.5, 6], [15, 12, 7], [20, 2, 6.5], [-21, 7, 7.5], [3, -19, 6]]) { const c = makeCypress(h, rnd); c.position.set(x, 0, z); root.add(c); clearings.push([x, z, 1.6]); }
  const sunflower = () => {
    const g = new THREE.Group(); const stem = mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6), clay(0x5d7a3a)); stem.position.y = 0.9; g.add(stem);
    const head = new THREE.Group(); head.position.y = 1.85; head.rotation.x = 0.5;
    for (let k = 0; k < 12; k++) { const pet = mesh(new THREE.ConeGeometry(0.09, 0.4, 4), clay(0xf2b31c)); pet.rotation.z = (k / 12) * 6.28; pet.position.set(Math.sin((k / 12) * 6.28) * -0.3, Math.cos((k / 12) * 6.28) * 0.3, 0); head.add(pet); }
    const disc = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), clay(0x7a4a1c)); disc.rotation.x = Math.PI / 2; head.add(disc);
    g.add(head); return g;
  };
  for (let i = 0; i < 14; i++) { const s = sunflower(); s.position.set(-15 + (i % 5) * 0.9 + rnd() * 0.3, 0, 12 + Math.floor(i / 5) * 0.9); s.rotation.y = rnd() - 0.2; s.scale.setScalar(0.8 + rnd() * 0.4); root.add(s); }
  clearings.push([-13.2, 13, 2.8]);
  const cafe = new THREE.Group();
  const cfloor = mesh(new THREE.BoxGeometry(6, 0.12, 4), clay(0xc9a26b)); cfloor.position.y = 0.06; cafe.add(cfloor);
  const wall = mesh(new THREE.BoxGeometry(6, 4.4, 0.3), clay(0x3f5a8c)); wall.position.set(0, 2.2, -2); cafe.add(wall);
  const awning = mesh(new THREE.BoxGeometry(6.2, 0.2, 2.4), clay(0xf2c14e)); awning.position.set(0, 3.7, -0.8); awning.rotation.x = -0.25; cafe.add(awning);
  const glow = new THREE.PointLight(0xffc24a, 30, 9, 1.4); glow.position.set(0, 3, 0); cafe.add(glow);
  const lamp = mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), clay(0xfff0a0)); lamp.position.set(-2.4, 3.2, 0.2); cafe.add(lamp);
  for (let i = 0; i < 3; i++) { const tb = new THREE.Group(); const t = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16), clay(0xf6efe0)); t.position.y = 0.9; tb.add(t); const l = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), clay(0x2b2a33)); l.position.y = 0.45; tb.add(l); tb.position.set(-1.8 + i * 1.8, 0.1, 0.4); cafe.add(tb); }
  cafe.position.set(-15, 0, -13); cafe.rotation.y = 0.7; root.add(cafe); clearings.push([-15, -13, 4.5]);
  const chair = new THREE.Group(); const cy = clay(0xe8b83a);
  const cseat = mesh(new THREE.BoxGeometry(0.8, 0.1, 0.75), clay(0xd9b44a)); cseat.position.y = 0.6; chair.add(cseat);
  for (const [x, z, h] of [[-0.35, -0.33, 1.6], [0.35, -0.33, 1.6], [-0.35, 0.33, 0.6], [0.35, 0.33, 0.6]]) { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 6), cy); l.position.set(x, h / 2, z); chair.add(l); }
  for (const y of [1.05, 1.4]) { const bar = mesh(new THREE.BoxGeometry(0.72, 0.06, 0.05), cy); bar.position.set(0, y, -0.33); chair.add(bar); }
  const pipe = mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.35, 6), clay(0x5a3d29)); pipe.rotation.z = Math.PI / 2; pipe.position.set(0.05, 0.68, 0.05); chair.add(pipe);
  const bowl = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 8), clay(0x5a3d29)); bowl.position.set(0.22, 0.72, 0.05); chair.add(bowl);
  chair.position.set(-2.4, 0, 11.4); chair.rotation.y = 0.5; root.add(chair); clearings.push([-2.4, 11.4, 1.2]);

  // ---- the painter: straw hat, orange beard, blue coat, at his easel
  const painter = makePerson({ color: 0x3f5a8c });
  const beard = mesh(new THREE.SphereGeometry(0.22, 12, 8), clay(0xd9702a)); beard.scale.set(1, 0.8, 0.7); beard.position.set(0, 1.52, 0.2); painter.userData.body.add(beard);
  const hatBrim = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 20), clay(0xf2d27a)); hatBrim.position.y = 1.98; painter.userData.body.add(hatBrim);
  const hatTop = mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.26, 16), clay(0xf2d27a)); hatTop.position.y = 2.12; painter.userData.body.add(hatTop);
  painter.position.set(3.6, 0, 5.2); painter.rotation.y = -2.3; root.add(painter);
  const easel = new THREE.Group(); for (const [x, rz] of [[-0.4, -0.08], [0.4, 0.08]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.6, 6), clay(palette.wood)); l.position.set(x, 1.3, 0); l.rotation.z = rz; easel.add(l); }
  const canvasTex = canvasTexture(256, 200, (g, w, h) => { strokes(g, w, h * 0.55, { base: '#2c5aa0', colors: ['#3f73b8', '#8fb5d9', '#1d3a78', '#f6e27a'], count: 500, len: [8, 16], width: [3, 5], dir: (x, y) => Math.sin(x / 30) }); g.save(); g.translate(0, h * 0.55); strokes(g, w, h * 0.45, { base: '#d9b44a', colors: ['#e6c65a', '#c79a3a', '#8a9a4a'], count: 400, len: [8, 14], width: [3, 5], dir: () => -1.2 }); g.restore(); });
  const cnv = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.95), new THREE.MeshBasicMaterial({ map: canvasTex })); cnv.position.set(0, 1.75, 0.08); easel.add(cnv);
  const cback = mesh(new THREE.BoxGeometry(1.24, 0.99, 0.05), clay(0xf6efe0)); cback.position.set(0, 1.75, 0.03); easel.add(cback);
  easel.position.set(2.6, 0, 4.2); easel.rotation.y = 0.85; root.add(easel);
  clearings.push([3.1, 4.7, 2]);
  talk(ctx, { who: painter, lines: [
    'I dream of painting, and then I paint my dream.',
    'The night is more alive and more richly coloured than the day.',
    'Look at the stars! They are going round.',
    "I sold one painting, you know. One.",
    'Go on, go in. Every one of these is a question someone painted.'] });

  // ---- crows over the wheat
  const crows = [...Array(9)].map((_, i) => {
    const c = new THREE.Group(); const cm = clay(0x1a1a22);
    for (const s of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(0.6, 0.03, 0.22), cm); w.position.x = 0.3 * s; w.userData.s = s; c.add(w); }
    const b = mesh(new THREE.SphereGeometry(0.1, 8, 6), cm); b.scale.z = 1.8; c.add(b);
    c.userData = { a: rnd() * 6.28, r: 8 + rnd() * 10, h: 7 + rnd() * 4, sp: 0.1 + rnd() * 0.08, ph: rnd() * 6 };
    root.add(c); return c;
  });

  // ---- the portals
  const P = {
    'marys-room': V(-9, 0, 8.5), puddle: V(-4.2, 0, 5.4), paperclip: V(7.6, 0, 9), 'experience-machine': V(11.5, 0, 2.6),
    'veil-of-ignorance': V(-12, 0, 0.5), turtles: V(-7.5, 0, -5.2), watchmaker: V(3.4, 0, -2.4), omelas: V(-2, 0, -11.5), swampman: V(10.5, 0, -8.5),
    barn: V(16.5, 0, -15.5), gallery: V(0, 0, 15.5),
  };
  for (const [k, p] of Object.entries(P)) clearings.push([p.x, p.z, k === 'barn' ? 5 : k === 'omelas' ? 3.6 : 3]);

  // Mary's Room: a little hut with no colour at all
  const hut = new THREE.Group();
  const hutBody = mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), clay(0xb8b8b8)); hutBody.position.y = 1.1; hut.add(hutBody);
  const hutRoof = mesh(new THREE.ConeGeometry(2, 1.2, 4), clay(0x4a4a4a)); hutRoof.position.y = 2.8; hutRoof.rotation.y = Math.PI / 4; hut.add(hutRoof);
  const hutDoor = mesh(new THREE.BoxGeometry(0.8, 1.5, 0.08), clay(0x2b2b2b)); hutDoor.position.set(0, 0.75, 1.13); hut.add(hutDoor);
  const hutWin = mesh(new THREE.BoxGeometry(0.6, 0.5, 0.06), clay(0xeeeeee)); hutWin.position.set(0.75, 1.5, 1.12); hut.add(hutWin);
  hut.position.copy(P['marys-room']).add(V(0, 0, -1.4)); hut.rotation.y = 0.35; root.add(hut);
  // a puddle in the path, holding a piece of the sky
  const puddleTex = canvasTexture(256, 256, (g, w, h) => { strokes(g, w, h, { base: '#2c5aa0', colors: ['#3f73b8', '#8fb5d9', '#1d3a78', '#b9d2ea'], count: 600, len: [8, 16], width: [3, 5], dir: (x, y) => Math.atan2(y - 128, x - 128) + 1.57 }); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(160, 100, 10, 0, 7); g.fill(); });
  const puddleShape = new THREE.Shape(); for (let i = 0; i <= 24; i++) { const a = (i / 24) * 6.28, rr = 1.1 + Math.sin(a * 3) * 0.2 + Math.cos(a * 2) * 0.15; i ? puddleShape.lineTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr) : puddleShape.moveTo(Math.cos(a) * rr * 1.3, Math.sin(a) * rr); }
  const puddleM = new THREE.Mesh(new THREE.ShapeGeometry(puddleShape), new THREE.MeshStandardMaterial({ map: puddleTex, roughness: 0.15, metalness: 0.1 }));
  puddleM.rotation.x = -Math.PI / 2; puddleM.position.copy(P.puddle).add(V(0, 0.03, -0.8)); root.add(puddleM);
  // a paperclip as tall as a person, standing in the wheat
  const clipCurve = new THREE.CurvePath(); const cp = [[-0.35, 0], [-0.35, 2.4], [0.35, 2.4], [0.35, 0.35], [-0.15, 0.35], [-0.15, 1.9], [0.15, 1.9], [0.15, 0.8]];
  for (let i = 0; i < cp.length - 1; i++) clipCurve.add(new THREE.LineCurve3(V(cp[i][0], cp[i][1], 0), V(cp[i + 1][0], cp[i + 1][1], 0)));
  const clipPts = new THREE.CatmullRomCurve3(clipCurve.getSpacedPoints(80), false, 'catmullrom', 0.2);
  const clip = mesh(new THREE.TubeGeometry(clipPts, 200, 0.06, 8), clay(0xc9ccd1, { metalness: 0.7, roughness: 0.3 }));
  clip.position.copy(P.paperclip).add(V(0, 0.2, -1)); clip.rotation.z = 0.12; clip.scale.setScalar(1.1); root.add(clip);
  // the experience machine: a reclining chair, a helmet, and a bundle of wires
  const em = new THREE.Group();
  const recl = mesh(new THREE.BoxGeometry(0.9, 0.2, 1.8), clay(0xf6efe0)); recl.position.set(0, 0.7, 0); recl.rotation.x = -0.25; em.add(recl);
  const emBase = mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.6, 12), clay(0x8b909a)); emBase.position.y = 0.3; em.add(emBase);
  const helmet = mesh(new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xc9ccd1, { metalness: 0.5 })); helmet.position.set(0, 1.55, -0.9); helmet.rotation.x = -0.9; em.add(helmet);
  const post = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), clay(0x8b909a)); post.position.set(0, 0.9, -1.2); em.add(post);
  const emLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7cf0c4 })); emLight.position.set(0, 1.85, -1.2); em.add(emLight);
  em.position.copy(P['experience-machine']).add(V(0.4, 0, -1.2)); em.rotation.y = -0.6; root.add(em);
  // the veil: a pale cloth hung between two poles, moving in the wind
  const veilGeo = new THREE.PlaneGeometry(3.2, 2.6, 16, 10);
  const veil = new THREE.Mesh(veilGeo, new THREE.MeshStandardMaterial({ color: 0xf6f1e7, transparent: true, opacity: 0.72, side: THREE.DoubleSide, roughness: 1 }));
  veil.position.copy(P['veil-of-ignorance']).add(V(0, 1.7, -1.2)); veil.rotation.y = 0.5; root.add(veil);
  for (const s of [-1, 1]) { const pole = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.3, 6), clay(palette.wood)); pole.position.copy(veil.position).add(V(Math.cos(0.5) * 1.65 * s, -0.05, -Math.sin(0.5) * 1.65 * s)); root.add(pole); }
  const veilBase = veilGeo.attributes.position.array.slice();
  // a tortoise with a little flat world on its back
  const tort = new THREE.Group();
  const shell = mesh(new THREE.SphereGeometry(0.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0x6b7a3a, { flatShading: true })); shell.scale.set(1.2, 0.8, 1.4); shell.position.y = 0.35; tort.add(shell);
  const thead = mesh(new THREE.SphereGeometry(0.28, 12, 8), clay(0x8a9a5a)); thead.position.set(0, 0.5, 1.45); tort.add(thead);
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) { const l = mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.4, 8), clay(0x8a9a5a)); l.position.set(x, 0.2, z); tort.add(l); }
  const disc = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 24), clay(0x7cc04e)); disc.position.y = 1.12; tort.add(disc);
  const tinyHouse = makeHouse(); tinyHouse.scale.setScalar(0.12); tinyHouse.position.set(0.2, 1.16, 0); tort.add(tinyHouse);
  tort.position.copy(P.turtles).add(V(0, 0, -1.3)); tort.rotation.y = 0.6; root.add(tort);
  // the watch, lying on a patch of heath
  const heath = mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 20), clay(0x8a5a7a, { flatShading: true })); heath.position.copy(P.watchmaker).add(V(0, 0.05, -0.9)); root.add(heath);
  const watch = new THREE.Group(); const wcase = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 24), clay(0xe2b53b, { metalness: 0.7, roughness: 0.3 })); watch.add(wcase);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.23, 24), new THREE.MeshBasicMaterial({ color: 0xfbf6ea })); face.rotation.x = -Math.PI / 2; face.position.y = 0.045; watch.add(face);
  const hand = mesh(new THREE.BoxGeometry(0.02, 0.01, 0.18), clay(0x2b2a33)); hand.position.set(0, 0.055, -0.06); watch.add(hand);
  const chain = mesh(new THREE.TorusGeometry(0.3, 0.015, 6, 20, 3), clay(0xe2b53b, { metalness: 0.7 })); chain.rotation.x = Math.PI / 2; chain.position.set(0.3, 0.02, 0.2); watch.add(chain);
  watch.position.copy(P.watchmaker).add(V(0, 0.14, -0.9)); root.add(watch);
  // Omelas: a white arch hung with pennants, towers beyond
  const arch = new THREE.Group(); const stone = clay(0xf6f1e7);
  for (const s of [-1, 1]) { const col = mesh(new THREE.BoxGeometry(0.6, 3.6, 0.6), stone); col.position.set(s * 1.4, 1.8, 0); arch.add(col); }
  const lintel = mesh(new THREE.BoxGeometry(3.6, 0.6, 0.7), stone); lintel.position.y = 3.8; arch.add(lintel);
  for (let i = 0; i < 7; i++) { const pen = mesh(new THREE.ConeGeometry(0.16, 0.5, 3), clay([0xe0674f, 0xf2c14e, 0x3f8f86, 0x5b7fa6][i % 4])); pen.rotation.x = Math.PI; pen.position.set(-1.5 + i * 0.5, 3.3, 0.4); arch.add(pen); }
  for (const [x, z, h] of [[-2.2, -3, 5], [0.8, -4, 6.5], [2.8, -2.6, 4.5]]) { const tw = mesh(new THREE.CylinderGeometry(0.6, 0.7, h, 12), stone); tw.position.set(x, h / 2, z); arch.add(tw); const cap = mesh(new THREE.ConeGeometry(0.8, 1.4, 12), clay(0xe2b33b)); cap.position.set(x, h + 0.7, z); arch.add(cap); }
  arch.position.copy(P.omelas).add(V(0, 0, -1.4)); root.add(arch);
  // the swamp: a dead tree in a small bog, and a thundercloud of its own
  const bog = mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.06, 20), clay(0x3a4a3a, { roughness: 0.4 })); bog.position.copy(P.swampman).add(V(0, 0.04, -1.4)); root.add(bog);
  const dead = new THREE.Group(); const dt0 = mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.6, 7), clay(0x5a4a3c)); dt0.position.y = 1.3; dead.add(dt0);
  for (const [y, rz, ry] of [[1.9, 0.9, 0], [2.2, -0.8, 1], [1.5, 1.1, 2.4]]) { const br = mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.2, 5), clay(0x5a4a3c)); br.position.set(Math.sin(ry) * 0.3, y + 0.3, Math.cos(ry) * 0.3); br.rotation.set(0, ry, rz); dead.add(br); }
  dead.position.copy(bog.position).setY(0); root.add(dead);
  const cloud = new THREE.Group(); for (let i = 0; i < 5; i++) { const c = mesh(new THREE.SphereGeometry(0.45 + rnd() * 0.25, 12, 8), clay(0x7a8296)); c.position.set((i - 2) * 0.45, rnd() * 0.2, rnd() * 0.3); cloud.add(c); }
  cloud.position.copy(bog.position).add(V(0, 5, 0)); root.add(cloud);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 5, 5), new THREE.MeshBasicMaterial({ color: 0xfff6c0 })); bolt.position.copy(bog.position).add(V(0.2, 3.1, 0)); bolt.scale.y = 0.75; bolt.rotation.z = 0.15; bolt.visible = false; root.add(bolt);
  // the barn, up the lane: red, white trim, a round-topped roof
  const barn = new THREE.Group();
  const bbody = mesh(new THREE.BoxGeometry(6, 4, 7), clay(0xa8322a)); bbody.position.y = 2; barn.add(bbody);
  const broof = mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.2, 20, 1, false, 0, Math.PI), clay(0x5a5a62)); broof.rotation.set(Math.PI / 2, 0, Math.PI / 2); broof.position.y = 4; barn.add(broof);
  const bdoor = mesh(new THREE.BoxGeometry(2.4, 2.8, 0.1), clay(0x8a2a24)); bdoor.position.set(0, 1.4, 3.52); barn.add(bdoor);
  for (const [a, b] of [[0.9, 1], [-0.9, 1]]) { const x = mesh(new THREE.BoxGeometry(0.12, 3.3, 0.04), clay(0xf6f1e7)); x.position.set(0, 1.4, 3.58); x.rotation.z = a; barn.add(x); }
  const loft = mesh(new THREE.BoxGeometry(1.1, 1.2, 0.1), clay(0xf6f1e7)); loft.position.set(0, 4.6, 3.55); barn.add(loft);
  barn.position.copy(P.barn).add(V(0.5, 0, -3.6)); barn.rotation.y = -0.5; root.add(barn);
  // the way back: a door standing on its own in the wheat, open onto the gallery's ochre light
  const back = new THREE.Group();
  for (const [x, y, w, h] of [[-0.8, 1.6, 0.16, 3.2], [0.8, 1.6, 0.16, 3.2], [0, 3.2, 1.76, 0.16]]) { const f = mesh(new THREE.BoxGeometry(w, h, 0.3), clay(0xf2e6d4)); f.position.set(x, y, 0); back.add(f); }
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 3.12), new THREE.MeshBasicMaterial({ color: 0xd9bf8c })); inside.position.set(0, 1.56, -0.05); back.add(inside);
  back.position.copy(P.gallery).add(V(0, 0, 1.2)); root.add(back);

  // now the wheat can grow around all of that
  for (let i = 0, tries = 0; i < WHEAT && tries < 20000; tries++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * (R - 1);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (inClearing(x, z)) continue;
    wheatAt.push([x, z, 0.7 + rnd() * 0.5, rnd() * 6.28]); i++;
  }
  wheat.count = wheatAt.length;

  const portals = [
    { id: 'marys-room', name: "Mary's Room", pos: P['marys-room'], labelAt: V(-9, 3.8, 7.1), prompt: 'Open the grey door' },
    { id: 'puddle', name: "The Puddle", pos: P.puddle, labelAt: V(-4.2, 1.4, 4.6), prompt: 'Look into the puddle' },
    { id: 'paperclip', name: 'The Paperclip Maximiser', pos: P.paperclip, labelAt: V(7.6, 3.4, 8), prompt: 'Touch the paperclip' },
    { id: 'experience-machine', name: 'The Experience Machine', pos: P['experience-machine'], labelAt: V(11.9, 2.6, 1.4), prompt: 'Sit in the chair' },
    { id: 'veil-of-ignorance', name: 'The Veil of Ignorance', pos: P['veil-of-ignorance'], labelAt: V(-12, 3.4, -0.7), prompt: 'Step behind the veil' },
    { id: 'turtles', name: 'Turtles All the Way Down', pos: P.turtles, labelAt: V(-7.5, 2.4, -6.5), prompt: 'Climb onto the tortoise' },
    { id: 'watchmaker', name: 'The Watchmaker', pos: P.watchmaker, labelAt: V(3.4, 1.4, -3.3), prompt: 'Pick up the watch' },
    { id: 'omelas', name: 'Omelas', pos: P.omelas, labelAt: V(-2, 4.8, -12.9), prompt: 'Go through the arch' },
    { id: 'swampman', name: 'Swampman', pos: P.swampman, labelAt: V(10.5, 3.6, -9.9), prompt: 'Wade into the swamp' },
    { id: 'barn', name: 'The barn', pos: P.barn, labelAt: V(17, 6.4, -19), prompt: 'Go into the barn', room: true },
    { id: 'gallery', name: 'Back to the gallery', pos: P.gallery, labelAt: V(0, 3.8, 16.7), prompt: 'Go back inside', home: true },
  ];
  let entering = null;
  for (const p of portals) interact.add({ pos: p.pos, radius: 1.9, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = p; ctx.player.enabled = false; ctx.goto(p.id); } });

  const from = portals.find((p) => p.id === ctx.from);
  const blockers = [
    { x: hut.position.x, z: hut.position.z, w: 2.6, d: 2.4, rot: 0.35 }, { x: clip.position.x, z: clip.position.z, r: 0.5 }, { x: em.position.x, z: em.position.z, r: 1 },
    { x: tort.position.x, z: tort.position.z, r: 1.3 }, { x: arch.position.x - 1.4, z: arch.position.z, r: 0.5 }, { x: arch.position.x + 1.4, z: arch.position.z, r: 0.5 },
    { x: dead.position.x, z: dead.position.z, r: 0.4 }, { x: barn.position.x, z: barn.position.z, w: 6.2, d: 7.2, rot: -0.5 }, { x: painter.position.x, z: painter.position.z, r: 0.45 },
    { x: easel.position.x, z: easel.position.z, r: 0.5 }, { x: chair.position.x, z: chair.position.z, r: 0.5 }, { x: cafe.position.x, z: cafe.position.z, w: 6, d: 4.2, rot: 0.7 },
    { x: back.position.x, z: back.position.z, w: 1.9, d: 0.4 },
    ...[[-18, -8], [-16.5, -6.5], [15, 12], [20, 2], [-21, 7], [3, -19]].map(([x, z]) => ({ x, z, r: 1 })),
  ];

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V(1, 1, 1), pos = V();
  return {
    root,
    ground: [gp],
    spawn: from && !from.home ? { x: from.pos.x, z: from.pos.z + 0.9, rotY: 0 } : { x: 0, z: 13.4, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < R - 1.2,
    blockers: () => blockers,
    start() { if (ctx.from === 'gallery') ctx.toast('Outside, the paint is still wet.', 4); },
    camera(pl) {
      const look = V(clamp(pl.pos.x, -14, 14) * 0.85, 1.8, clamp(pl.pos.z, -16, 12) - 1.6);
      return { pos: look.clone().add(V(0, 6.2, 16)), look: look.clone().add(V(0, 2.4, 0)), stiffness: 2.2 };
    },
    update(dt, t) {
      // wheat sways, and leans away from you
      const px = ctx.player.pos.x, pz = ctx.player.pos.z;
      wheatAt.forEach(([x, z, h, ph], i) => {
        const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz), push = d < 1.4 ? (1.4 - d) * 0.6 : 0;
        e.set(Math.sin(t * 1.3 + ph + x * 0.2) * 0.12 + (d > 0 ? (dz / d) * push : 0), 0, Math.cos(t * 1.1 + ph) * 0.06 - (d > 0 ? (dx / d) * push : 0));
        q.setFromEuler(e); sc.set(1, h, 1); pos.set(x, 0, z); m4.compose(pos, q, sc); wheat.setMatrixAt(i, m4);
      });
      wheat.instanceMatrix.needsUpdate = true;
      // the veil moves in the wind
      const va = veilGeo.attributes.position;
      for (let i = 0; i < va.count; i++) { const x = veilBase[i * 3], y = veilBase[i * 3 + 1]; va.setZ(i, Math.sin(t * 1.6 + x * 1.3 + y * 0.6) * 0.12 * (1.3 - y / 2.6)); }
      va.needsUpdate = true;
      crows.forEach((c) => { const u = c.userData; u.a += dt * u.sp; c.position.set(Math.cos(u.a) * u.r, u.h + Math.sin(t + u.ph) * 0.6, Math.sin(u.a) * u.r - 4); c.rotation.y = -u.a; c.children.forEach((w) => { if (w.userData.s) w.rotation.z = Math.sin(t * 8 + u.ph) * 0.5 * w.userData.s; }); });
      bolt.visible = (t % 5) < 0.12 || ((t % 5) > 0.2 && (t % 5) < 0.28);
      emLight.material.color.setHSL(0.45, 0.8, 0.55 + Math.sin(t * 3) * 0.15);
      watch.rotation.y = Math.sin(t * 0.5) * 0.1; hand.rotation.y = -t;
      tort.position.y = Math.abs(Math.sin(t * 0.8)) * 0.02; thead.position.z = 1.45 + Math.sin(t * 0.6) * 0.06;
      animatePerson(painter, t, { energy: 0.35 });
      for (const p of portals) {
        const d = Math.hypot(px - p.pos.x, pz - p.pos.z);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering ? 0 : clamp((5.5 - d) / 2.2), `<span class="dot" style="background:${css(p.home || p.room ? palette.rail : palette.agent)}"></span>${p.name}${done}`, p.labelAt);
      }
    },
  };
}
