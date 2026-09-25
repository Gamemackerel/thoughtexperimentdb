// The Trolley Room: once you've been through the trolley painting, it opens onto this room instead, a railway waiting
// room hung with four paintings, one for each version of the problem: the lever, the footbridge, the loop and the
// surgeon. A model railway runs round a table in the middle; the stationmaster is at the ticket window.
import { THREE, palette, css, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeTrack, makeTrolley, makeBench, makeLever } from '/engine/core.js';
import { paintScene, footbridgeScene, loopScene, transplantScene } from '../core/paint.js';
import { talk } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF = 10.5, BACK = -5.5, FRONT = 3.6;
const PAINTINGS = [
  { id: 'trolley-problem', name: 'The Trolley Problem', x: -6.9 },
  { id: 'footbridge', name: 'The Footbridge', x: -2.3, scene: footbridgeScene, cam: V(-6, 7.5, 16), look: V(4, 2, 0) },
  { id: 'loop-track', name: 'The Loop', x: 2.3, scene: loopScene, cam: V(-8, 14, 16), look: V(4, 0, -3) },
  { id: 'transplant', name: 'The Surgeon', x: 6.9, scene: transplantScene, cam: V(3, 6, 14), look: V(1, 1.2, -1) },
];
const PY = 3.4, PW = 3.6, PH = 2.03;

const tex = (url) => { const t = new THREE.TextureLoader().load(url); t.colorSpace = THREE.SRGBColorSpace; return t; };

export default function trolleyRoom(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 40, 120);

  // ---- a floating room: boards underfoot, green panelling, cream walls
  const slab = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 1.2, 11), clay(palette.groundEdge)); slab.position.set(0, -0.62, -0.9); root.add(slab);
  for (let i = 0; i < 22; i++) { const b = mesh(new THREE.BoxGeometry(0.96, 0.08, 10), clay(i % 2 ? 0xb89572 : 0xa7825f)); b.position.set(-HALF + 0.5 + i, -0.02, -0.9); b.receiveShadow = true; root.add(b); }
  const cream = clay(0xf2e6d4), green = clay(0x3f6b58);
  const back = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 8, 0.4), cream); back.position.set(0, 4, BACK - 0.2); root.add(back);
  const wains = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 1.5, 0.1), green); wains.position.set(0, 0.75, BACK + 0.05); root.add(wains);
  const rail = mesh(new THREE.BoxGeometry(HALF * 2 + 1, 0.12, 0.16), clay(0xc9a54c)); rail.position.set(0, 1.52, BACK + 0.1); root.add(rail);
  for (const sx of [-1, 1]) {
    const end = mesh(new THREE.BoxGeometry(0.4, 8, 10), cream); end.position.set(sx * (HALF + 0.3), 4, -0.9); root.add(end);
    const w2 = mesh(new THREE.BoxGeometry(0.1, 1.5, 10), green); w2.position.set(sx * (HALF + 0.05), 0.75, -0.9); root.add(w2);
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 11), new THREE.MeshBasicMaterial({ visible: false })); ground.rotation.x = -Math.PI / 2; ground.position.z = -0.9; root.add(ground);

  // ---- the four paintings (three painted live from little clay scenes)
  const gold = clay(0xc9a54c, { metalness: 0.45, roughness: 0.4 });
  const halos = [];
  for (const p of PAINTINGS) {
    const map = p.scene ? paintScene(stage.renderer, p.scene, { cam: p.cam, look: p.look }) : tex('/game/assets/paintings/trolley.jpg');
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map })); pic.position.set(p.x, PY, BACK + 0.02); root.add(pic);
    for (const [x, y, w, h] of [[0, PH / 2 + 0.13, PW + 0.5, 0.26], [0, -PH / 2 - 0.13, PW + 0.5, 0.26], [-PW / 2 - 0.12, 0, 0.26, PH + 0.5], [PW / 2 + 0.12, 0, 0.26, PH + 0.5]]) {
      const b = mesh(new THREE.BoxGeometry(w, h, 0.2), gold); b.position.set(p.x + x, PY + y, BACK + 0.07); root.add(b);
    }
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(PW + 1.2, PH + 1.2), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.set(p.x, PY, BACK - 0.01); root.add(halo); halos.push([halo, p.id]);
    const plate = mesh(new THREE.BoxGeometry(0.9, 0.22, 0.04), gold); plate.position.set(p.x, PY - PH / 2 - 0.6, BACK + 0.05); root.add(plate);
  }

  // ---- a station clock and a departures board
  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 40), new THREE.MeshBasicMaterial({ color: 0xfbf6ea })); clock.add(face);
  const rim = mesh(new THREE.TorusGeometry(0.58, 0.07, 10, 40), clay(palette.ink)); clock.add(rim);
  const hands = [0.4, 0.28].map((l, i) => { const h = mesh(new THREE.BoxGeometry(0.05, l, 0.02), clay(palette.ink)); h.geometry.translate(0, l / 2, 0); h.position.z = 0.02 + i * 0.01; clock.add(h); return h; });
  clock.position.set(0, 5.9, BACK + 0.05); root.add(clock);
  const boardTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#1f2a2e'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#f2c14e'; g.font = 'bold 30px monospace'; g.fillText('DEPARTURES', 24, 44);
    g.font = '24px monospace'; g.fillStyle = '#f6efe0';
    [['10:15', 'MAIN LINE', 'ON TIME'], ['10:20', 'SIDE TRACK', 'ON TIME'], ['10:25', 'THE LOOP', 'RETURNS'], ['10:40', 'FOOTBRIDGE', 'DELAYED'], ['--:--', 'RUNAWAY', 'NO DRIVER']]
      .forEach(([a, b, d], i) => { g.fillText(a, 24, 90 + i * 34); g.fillText(b, 130, 90 + i * 34); g.fillStyle = i === 4 ? '#e0674f' : '#f6efe0'; g.fillText(d, 350, 90 + i * 34); g.fillStyle = '#f6efe0'; });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.5), new THREE.MeshBasicMaterial({ map: boardTex })); board.position.set(HALF - 0.08, 3.6, -2.5); board.rotation.y = -Math.PI / 2; root.add(board);

  // ---- the model railway on a table in the middle: a little trolley going round and round (you can throw the points)
  const TABLE = V(0, 0, 0.9);
  const table = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(6.4, 0.2, 2.6), clay(0x4f8a55)); top.position.y = 0.95; table.add(top);
  for (const [x, z] of [[-3, -1.1], [3, -1.1], [-3, 1.1], [3, 1.1]]) { const l = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), clay(palette.wood)); l.position.set(x, 0.45, z); table.add(l); }
  table.position.copy(TABLE); root.add(table);
  const oval = new THREE.CurvePath();
  const R = 2.9, L = 7.6;                           // in the model's own units (it's built at full size, then shrunk)
  oval.add(new THREE.LineCurve3(V(-L, 0, R), V(L, 0, R)));
  oval.add(new THREE.CubicBezierCurve3(V(L, 0, R), V(L + R * 1.35, 0, R), V(L + R * 1.35, 0, -R), V(L, 0, -R)));
  oval.add(new THREE.LineCurve3(V(L, 0, -R), V(-L, 0, -R)));
  oval.add(new THREE.CubicBezierCurve3(V(-L, 0, -R), V(-L - R * 1.35, 0, -R), V(-L - R * 1.35, 0, R), V(-L, 0, R)));
  const toy = new THREE.Group(); toy.scale.setScalar(0.28); toy.position.copy(TABLE).setY(1.06); root.add(toy);
  toy.add(makeTrack(oval));
  const toyTrolley = makeTrolley(); toy.add(toyTrolley);
  const toyFolk = [0, 1, 2, 3, 4].map((i) => { const p = makePerson({ color: palette.many, hat: true, scale: 0.8 }); p.position.set(-3 + i * 1.5, 0, R + 1.6); p.rotation.y = Math.PI; toy.add(p); return p; });
  const toyLever = makeLever(); toyLever.scale.setScalar(0.35); toyLever.position.copy(TABLE).add(V(2.6, 1.05, 1.05)); root.add(toyLever);
  let toyDir = 1, toyS = 0;

  // ---- benches, the ticket window and the stationmaster
  for (const sx of [-1, 1]) { const b = makeBench(); b.position.set(sx * 7.6, 0, 2.4); b.rotation.y = Math.PI; root.add(b); }
  const booth = new THREE.Group();
  const bw = mesh(new THREE.BoxGeometry(0.2, 3.2, 2.4), clay(0x7a4a3a)); bw.position.set(0, 1.6, 0); booth.add(bw);
  const sign = mesh(new THREE.BoxGeometry(0.06, 0.4, 1.6), clay(0x1f2a2e)); sign.position.set(0.12, 3.1, 0); booth.add(sign);
  booth.position.set(-HALF + 0.1, 0, -2.4); root.add(booth);
  const master = makePerson({ color: 0x2f3f5a, hat: true }); master.position.set(-HALF + 0.9, 0, -2.4); master.rotation.y = Math.PI / 2; root.add(master);
  talk(ctx, { who: master, radius: 2.2, lines: [
    'All trains are running on time. Except the one without a driver.',
    'Each painting is a different day on the same line.',
    "Tickets? You don't need a ticket for a painting.",
    'People always ask me which one is the right answer. I just work here.'] });

  // ---- the way back: a door at the far end
  const door = new THREE.Group();
  const panel = mesh(new THREE.BoxGeometry(1.4, 2.9, 0.12), clay(palette.trolley)); panel.position.y = 1.45; door.add(panel);
  for (const [x, y, w, h] of [[-0.8, 1.55, 0.14, 3.2], [0.8, 1.55, 0.14, 3.2], [0, 3.1, 1.74, 0.14]]) { const b = mesh(new THREE.BoxGeometry(w, h, 0.3), cream); b.position.set(x, y, 0); door.add(b); }
  door.position.set(HALF + 0.05, 0, 1.4); door.rotation.y = -Math.PI / 2; root.add(door);

  // ---- portals
  let entering = null;
  const portals = [
    ...PAINTINGS.map((p) => ({ id: p.id, name: p.name, pos: V(p.x, 0, BACK + 1.3), labelAt: V(p.x, PY + PH / 2 + 0.55, BACK + 0.2), prompt: 'Step into the painting', painting: p })),
    { id: 'house', name: 'Back to the first room', pos: V(HALF - 0.8, 0, 1.4), labelAt: V(HALF - 0.4, 3.6, 1.4), prompt: 'Open the door', home: true },
  ];
  for (const p of portals) interact.add({ pos: p.pos, radius: 1.9, prompt: p.prompt, enabled: () => !entering, onUse: () => { entering = { t: 0, p }; ctx.player.enabled = false; if (p.home) ctx.goto('house'); } });
  interact.add({ pos: TABLE.clone().add(V(2.6, 0, 1.9)), radius: 1.3, prompt: 'Throw the lever', enabled: () => !entering, onUse: () => { toyDir *= -1; } });

  const from = PAINTINGS.find((p) => p.id === ctx.from);
  const blockers = [...[-2.5, -0.85, 0.85, 2.5].map((dx) => ({ x: TABLE.x + dx, z: TABLE.z, r: 1.1 })),
    { x: -7.6, z: 2.4, r: 1.2 }, { x: 7.6, z: 2.4, r: 1.2 }, { x: master.position.x, z: master.position.z, r: 0.5 }];

  return {
    root,
    ground: [ground],
    spawn: from ? { x: from.x, z: BACK + 2.2, rotY: 0 } : { x: 1.5, z: BACK + 2.4, rotY: 0 },
    walkable: (x, z) => Math.abs(x) < HALF - 0.5 && z > BACK + 0.6 && z < FRONT,
    blockers: () => blockers,
    start() { if (ctx.from === 'house') ctx.toast('The painting opens onto a room of trolley paintings.', 4.5); },
    camera(pl) {
      if (entering?.p.painting) {       // push into the painting
        const k = easeInOut(entering.t / 1.3), x = entering.p.painting.x;
        return { pos: V(x, PY, lerp(BACK + 5.5, BACK + 0.4, k)), look: V(x, PY, BACK), stiffness: 6 };
      }
      const look = V(clamp(pl.pos.x * 0.7, -4, 4), 2.3, -1.6);
      return { pos: look.clone().add(V(0, 4.6, 13.5)), look, stiffness: 2.4 };
    },
    update(dt, t) {
      const now = new Date(); hands[0].rotation.z = -((now.getMinutes() / 60) * Math.PI * 2); hands[1].rotation.z = -(((now.getHours() % 12) / 12) * Math.PI * 2);
      // the model trolley goes round (and back the other way when you throw the lever)
      toyS += dt * 5 * toyDir;
      const len = oval.getLength(), u = ((toyS % len) + len) % len / len;
      const pp = oval.getPointAt(u), tan = oval.getTangentAt(u).multiplyScalar(toyDir);
      toyTrolley.position.copy(pp); toyTrolley.rotation.y = Math.atan2(-tan.z, tan.x);
      toyLever.userData.pivot.rotation.z = lerp(toyLever.userData.pivot.rotation.z, toyDir > 0 ? 0.45 : -0.45, 1 - Math.exp(-dt * 10));
      toyFolk.forEach((p, i) => animatePerson(p, t, { phase: i }));
      animatePerson(master, t, { energy: 0.3 });
      halos.forEach(([h, id]) => (h.material.opacity = save.done.has(id) ? 0.22 + 0.08 * Math.sin(t * 2) : 0.06 + 0.05 * Math.sin(t * 2 + 1)));
      for (const p of portals) {
        const d = Math.hypot(ctx.player.pos.x - p.pos.x, ctx.player.pos.z - p.pos.z);
        const done = save.done.has(p.id) ? ' ✓' : '';
        ctx.ui.label('portal-' + p.id, entering ? 0 : clamp((5 - d) / 2.2), `<span class="dot" style="background:${css(p.home ? palette.rail : palette.agent)}"></span>${p.name}${done}`, p.labelAt);
      }
      if (entering && !entering.p.home) { entering.t += dt; if (entering.t > 1.3 && !entering.gone) { entering.gone = true; ctx.goto(entering.p.id); } }
    },
  };
}
