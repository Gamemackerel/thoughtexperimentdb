// The museum: a long gallery off the first room, after the Louvre's Grande Galerie (arched bays, pale columns, skylights,
// a parquet floor, a red velvet bench), in clay. Things you bring home from the vignettes stand on its plinths, each
// under a soft beam of light with a brass plaque. For now there is one: the chest of gold from the lighthouse cellar
// (Ship of Theseus, if you sail forth). The other plinths wait. An arch leads back to the first room.
import { THREE, palette, css, clamp, clay, mesh, makePerson, animatePerson } from '/game/engine/core.js';
import { textTexture } from '../core/props.js';
import { makeChest } from '../vignettes/voyage.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HALF_X = 9, HALF_Z = 4.6;
const ARCH = V(-9.2, 0, 1.2);
// what can go in the museum (in order along the gallery); ids are what save.keep() stores
const ITEMS = [
  { id: 'chest-of-gold', name: 'A chest of gold', from: 'From the cellar under the lighthouse. Sailed home.', make: () => { const c = makeChest(); c.scale.setScalar(0.9); return c; } },
];
const PLINTHS = [-5.6, -2.8, 0, 2.8, 5.6].map((x) => V(x, 0, -1.6));

export default function museum(ctx) {
  const { stage, interact, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(palette.sky);
  stage.scene.fog = new THREE.Fog(palette.sky, 40, 120);

  // ---- floor: a slab, and parquet in two woods
  const slab = mesh(new THREE.BoxGeometry(HALF_X * 2 + 1.2, 1.4, HALF_Z * 2 + 1.2), clay(palette.groundEdge)); slab.position.y = -0.72; root.add(slab);
  const woods = [clay(0xb8895a), clay(0xa77a4d)];
  const boards = woods.map((m) => new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.06, 0.4), m, 400));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), counts = [0, 0];
  for (let i = 0; i < 15; i++) for (let j = 0; j < 23; j++) {
    const k = (i + j) % 2, x = -HALF_X + 0.6 + i * 1.2, z = -HALF_Z + 0.2 + j * 0.4;
    if (x > HALF_X || z > HALF_Z) continue;
    q.setFromAxisAngle(V(0, 1, 0), 0); m4.compose(V(x, -0.03, z), q, V(1, 1, 1)); boards[k].setMatrixAt(counts[k]++, m4);
  }
  boards.forEach((b, k) => { b.count = counts[k]; b.receiveShadow = true; root.add(b); });
  const runner = mesh(new THREE.BoxGeometry(HALF_X * 2 - 1, 0.02, 1.3), clay(0x9c3b36)); runner.position.set(0, 0.012, 1.6); runner.castShadow = false; root.add(runner);   // proud of the parquet

  // ---- walls: the back wall in arched bays between paired columns, skylights painted along the top; the left wall
  // with the arch home
  const wallMat = clay(0xece2d0), stone = clay(0xf4eee2), gold = clay(0xc9a54c, { metalness: 0.4, roughness: 0.45 });
  const back = mesh(new THREE.BoxGeometry(HALF_X * 2 + 0.8, 8, 0.4), wallMat); back.position.set(0, 4, -HALF_Z - 0.4); root.add(back);
  const left = mesh(new THREE.BoxGeometry(0.4, 8, HALF_Z * 2 + 0.8), wallMat); left.position.set(-HALF_X - 0.4, 4, 0); root.add(left);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xcfe0ee });
  for (let i = 0; i < 6; i++) {
    const x = -HALF_X + 1.5 + i * 3;
    for (const dx of [-0.35, 0.35]) { const col = mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.6, 14), stone); col.position.set(x + dx, 2.8, -HALF_Z - 0.05); root.add(col); }
    const capital = mesh(new THREE.BoxGeometry(1.2, 0.25, 0.5), stone); capital.position.set(x, 5.7, -HALF_Z - 0.05); root.add(capital);
    if (i < 5) {
      const bx = x + 1.5;
      const niche = mesh(new THREE.BoxGeometry(1.8, 3.4, 0.06), clay(0xe3d6bf)); niche.position.set(bx, 2.9, -HALF_Z - 0.17); root.add(niche);
      const top = mesh(new THREE.CircleGeometry(0.9, 24, 0, Math.PI), clay(0xe3d6bf)); top.position.set(bx, 4.6, -HALF_Z - 0.14); root.add(top);
      const sky = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24, 0, Math.PI), skyMat); sky.position.set(bx, 6.4, -HALF_Z - 0.16); root.add(sky);
    }
  }
  const cornice = mesh(new THREE.BoxGeometry(HALF_X * 2 + 0.8, 0.3, 0.7), stone); cornice.position.set(0, 7.3, -HALF_Z - 0.2); root.add(cornice);
  const skirting = mesh(new THREE.BoxGeometry(HALF_X * 2 + 0.8, 0.3, 0.5), clay(0xd6c4a3)); skirting.position.set(0, 0.15, -HALF_Z - 0.1); root.add(skirting);
  // the arch back to the first room: a stone surround, and the room's checkered floor glimpsed through it
  {
    const a = new THREE.Group(); a.position.copy(ARCH); a.rotation.y = Math.PI / 2; root.add(a);
    for (const x of [-1.05, 1.05]) { const p = mesh(new THREE.BoxGeometry(0.4, 3.2, 0.5), stone); p.position.set(x, 1.6, 0.05); a.add(p); }
    const ring = mesh(new THREE.TorusGeometry(1.05, 0.2, 10, 28, Math.PI), stone); ring.position.set(0, 3.2, 0.05); a.add(ring);
    const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d');
    g.fillStyle = '#e9dcc3'; g.fillRect(0, 0, 128, 192);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 5; j++) { g.fillStyle = (i + j) % 2 ? '#4a4e5a' : '#f2e9d8'; g.fillRect(i * 16, 112 + j * 16, 16, 16); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const through = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.2), new THREE.MeshBasicMaterial({ map: t })); through.position.set(0, 1.6, 0.06); a.add(through);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.85, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xe9dcc3 })); top.position.set(0, 3.2, 0.06); a.add(top);
  }

  // ---- plinths, each with a beam of soft light and a brass plaque
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.13, depthWrite: false, blending: THREE.AdditiveBlending });
  const shown = PLINTHS.map((at, i) => {
    const item = ITEMS[i], has = !!item && save.items.has(item.id);
    const base = mesh(new THREE.BoxGeometry(1.4, 0.2, 1.4), stone); base.position.copy(at).setY(0.1); root.add(base);
    const body = mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), clay(0xf7f3ea)); body.position.copy(at).setY(0.75); root.add(body);
    const cap = mesh(new THREE.BoxGeometry(1.3, 0.12, 1.3), stone); cap.position.copy(at).setY(1.36); root.add(cap);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 6, 24, 1, true), beamMat); beam.position.copy(at).setY(4.4); root.add(beam);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: has ? 0.35 : 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.copy(at).setY(1.43); root.add(pool);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), new THREE.MeshStandardMaterial({ map: textTexture(has ? [item.name] : ['—'], { w: 256, h: 124, bg: '#c9a54c', fg: '#3a2e1a', font: 'italic 30px serif' }), metalness: 0.3, roughness: 0.5 }));
    plaque.position.copy(at).add(V(0, 0.95, 0.56)); root.add(plaque);
    let obj = null;
    if (has) { obj = item.make(); obj.position.copy(at).setY(1.42); obj.rotation.y = 0.3; root.add(obj); }
    return { at, item, has, obj };
  });
  // a red velvet bench to sit and look from, and an attendant
  const bench = new THREE.Group();
  { const seat = mesh(new THREE.BoxGeometry(2.6, 0.3, 0.8), clay(0x9c3b36)); seat.position.y = 0.55; bench.add(seat);
    for (const x of [-1.1, 1.1]) for (const z of [-0.3, 0.3]) { const leg = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 8), gold); leg.position.set(x, 0.21, z); bench.add(leg); } }
  bench.position.set(1.4, 0, 2.6); root.add(bench);
  const attendant = makePerson({ color: 0x2f3f5c, hat: false }); attendant.position.set(7.8, 0, -3.4); attendant.rotation.y = -0.6; attendant.userData.body.position.y = -0.42; root.add(attendant);
  const chair = mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), clay(0x5a3d29)); chair.position.set(7.8, 0.25, -3.5); root.add(chair);
  const count = () => shown.filter((s) => s.has).length;
  let said = 0;
  interact.add({ pos: V(7, 0, -2.4), radius: 1.8, prompt: 'Talk', aside: true, onUse: () => {
    const lines = count() ? ['Nobody has tried to take it. Yet.', 'Where did you find it? No, do not tell me. Put it on the form.', 'More plinths than things. That is a good sign, in a museum.']
      : ['Nothing in yet. Plenty of room.', 'Bring back something special, and it goes on a plinth.', 'Very quiet today. Every day, so far.'];
    ctx.speak(attendant, lines[said++ % lines.length], { offset: [0, 2.6, 0] });
  } });
  shown.forEach((s) => interact.add({ pos: s.at.clone().add(V(0, 0, 1.3)), radius: 1.2, height: 2.2, prompt: 'Read the plaque', aside: true,
    onUse: () => ctx.toast(s.has ? `<b>${s.item.name}</b><br><span style="font-size:18px">${s.item.from}</span>` : 'Nothing here yet.', 4) }));
  // the way home
  let leaving = false;
  interact.add({ pos: ARCH.clone().add(V(1, 0, 0)), radius: 1.8, height: 3.6, prompt: 'Back to the first room', enabled: () => !leaving, onUse: () => { leaving = true; ctx.goto('house'); } });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2), new THREE.MeshBasicMaterial({ visible: false })); ground.rotation.x = -Math.PI / 2; root.add(ground);
  const blockers = [...PLINTHS.map((p) => ({ x: p.x, z: p.z, r: 0.75 })), { x: 1.4, z: 2.6, w: 2.7, d: 0.9 }, { x: 7.8, z: -3.4, r: 0.6 }];

  return {
    root, ground: [ground], __S: { items: count() },
    spawn: { x: -7.6, z: 1.2, rotY: Math.PI / 2 },
    walkable: (x, z) => Math.abs(x) < HALF_X - 0.5 && Math.abs(z) < HALF_Z - 0.4,
    blockers: () => blockers,
    camera(pl) {
      const look = pl.pos.clone().lerp(V(0, 0, -1.2), 0.6).add(V(0, 1.6, 0));
      return { pos: look.clone().add(V(pl.pos.x * 0.1, 8, 17)), look };
    },
    update(dt, t) {
      animatePerson(attendant, t, { energy: 0.3 }); attendant.userData.body.position.y -= 0.42;
      shown.forEach((s, i) => {
        if (s.obj) s.obj.rotation.y = 0.3 + Math.sin(t * 0.4) * 0.15;
        const d = Math.hypot(ctx.player.pos.x - s.at.x, ctx.player.pos.z - s.at.z);
        ctx.ui.label('plinth-' + i, clamp((4.5 - d) / 1.5) * (s.has ? 1 : 0.8), s.has ? `<span class="dot" style="background:${css(0xc9a54c)}"></span>${s.item.name}` : '<i>waiting</i>', s.at.clone().setY(s.has ? 2.9 : 2));
      });
      const d = Math.hypot(ctx.player.pos.x - ARCH.x, ctx.player.pos.z - ARCH.z);
      ctx.ui.label('arch', clamp((6 - d) / 2.5), `<span class="dot" style="background:${css(palette.agent)}"></span>The first room`, ARCH.clone().add(V(0.4, 4, 0)));
    },
  };
}
