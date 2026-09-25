// Paintings rendered from little clay scenes (so every painting in the house shares the films' look).
// paintScene(renderer, build, { cam, look, w, h, bg }) → a texture you can put in a frame.
import { THREE, palette, clay, mesh, makeTrack, makeTrolley, makePerson, makeTunnel } from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function paintScene(renderer, build, { cam, look, w = 1024, h = 576, bg = palette.sky, fov = 32 } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xb8a78c, 1.7));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.2); sun.position.set(8, 14, 10); scene.add(sun);
  build(scene);
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 400);
  camera.position.copy(cam); camera.lookAt(look);
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const prevTarget = renderer.getRenderTarget(), prevShadow = renderer.shadowMap.enabled;
  renderer.shadowMap.enabled = false;
  renderer.setRenderTarget(rt); renderer.render(scene, camera); renderer.setRenderTarget(prevTarget);
  renderer.shadowMap.enabled = prevShadow;
  scene.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  return rt.texture;
}

const ground = (s, color = palette.ground) => { const g = mesh(new THREE.CylinderGeometry(60, 60, 0.4, 64), clay(color)); g.position.y = -0.2; s.add(g); };
const hill = (s, x, z, sx = 9, sy = 5, sz = 7) => { const h = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), clay(palette.grass)); h.scale.set(sx, sy, sz); h.position.set(x, 0, z); s.add(h); };
const worker = (s, x, z, color = palette.many, big = 1) => { const p = makePerson({ color, hat: true, scale: big }); p.position.set(x, 0, z); p.rotation.y = 0.4; s.add(p); return p; };

// the footbridge: a trolley coming, five on the track beyond, and two people on a bridge above it
export function footbridgeScene(s) {
  ground(s); hill(s, -14, -12, 12, 6, 8);
  s.add(makeTrack(new THREE.LineCurve3(V(-40, 0, 0), V(30, 0, 0))));
  const t = makeTrolley(); t.position.set(-9, 0, 0); s.add(t);
  for (let i = 0; i < 5; i++) worker(s, 8 + i * 1.4, (i % 2 ? 0.3 : -0.3));
  const deckY = 4.2, bridge = new THREE.Group(), stone = clay(0xcfc3ad);
  const deck = mesh(new THREE.BoxGeometry(2.2, 0.3, 10), stone); deck.position.y = deckY; bridge.add(deck);
  for (const z of [-4.2, 4.2]) { const pier = mesh(new THREE.BoxGeometry(1.6, deckY, 1.2), stone); pier.position.set(0, deckY / 2, z); bridge.add(pier); }
  for (const x of [-1.05, 1.05]) { const rail = mesh(new THREE.BoxGeometry(0.1, 0.9, 10), clay(0x8a6b52)); rail.position.set(x, deckY + 0.6, 0); bridge.add(rail); }
  bridge.position.x = 2; s.add(bridge);
  const you = makePerson({ color: palette.agent }); you.position.set(2, deckY + 0.15, 1.2); you.rotation.y = -1.2; s.add(you);
  const big = makePerson({ color: palette.one, hat: true, scale: 1.45 }); big.position.set(2.3, deckY + 0.15, -0.6); big.rotation.y = -1.4; s.add(big);
}

// the loop: the side track curls round and rejoins the main line before the five; one big man on the loop
export function loopScene(s) {
  ground(s); hill(s, 16, -14, 12, 6, 8);
  s.add(makeTrack(new THREE.LineCurve3(V(-40, 0, 0), V(30, 0, 0))));
  const loop = new THREE.CurvePath();
  loop.add(new THREE.CubicBezierCurve3(V(-6, 0, 0), V(-2, 0, 0), V(-1, 0, -9), V(4, 0, -9)));
  loop.add(new THREE.CubicBezierCurve3(V(4, 0, -9), V(9, 0, -9), V(10, 0, 0), V(13, 0, 0)));
  s.add(makeTrack(loop));
  const t = makeTrolley(); t.position.set(-13, 0, 0); s.add(t);
  for (let i = 0; i < 5; i++) worker(s, 16 + i * 1.4, (i % 2 ? 0.3 : -0.3));
  worker(s, 4, -9, palette.one, 1.45);
}

// transplant: five patients in beds, each waiting; one healthy visitor in for a check-up
export function transplantScene(s) {
  const floor = mesh(new THREE.BoxGeometry(40, 0.2, 20), clay(0xe6ece8)); floor.position.y = -0.1; s.add(floor);
  const wall = mesh(new THREE.BoxGeometry(40, 8, 0.3), clay(0xd8e4e0)); wall.position.set(0, 4, -4); s.add(wall);
  for (let i = 0; i < 5; i++) {
    const x = -8 + i * 3.4, bed = new THREE.Group();
    const frame = mesh(new THREE.BoxGeometry(1.4, 0.6, 2.6), clay(0xf6f6f2)); frame.position.y = 0.7; bed.add(frame);
    const blanket = mesh(new THREE.BoxGeometry(1.45, 0.2, 1.7), clay(0x9cc0d0)); blanket.position.set(0, 1.05, 0.35); bed.add(blanket);
    const pillow = mesh(new THREE.BoxGeometry(1, 0.2, 0.5), clay(0xffffff)); pillow.position.set(0, 1.08, -0.95); bed.add(pillow);
    const head = mesh(new THREE.SphereGeometry(0.3, 16, 12), clay(palette.skin ?? 0xf1d7bd)); head.position.set(0, 1.3, -0.8); bed.add(head);
    bed.position.set(x, 0, -2.2); s.add(bed);
  }
  const visitor = makePerson({ color: palette.one }); visitor.position.set(9.5, 0, 1.2); visitor.rotation.y = -0.6; s.add(visitor);
  const you = makePerson({ color: palette.agent }); you.position.set(5.5, 0, 1.8); you.rotation.y = 0.9; s.add(you);
}
