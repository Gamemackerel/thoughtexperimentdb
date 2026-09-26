// The Penrose staircase: a staircase that climbs for ever round a square. It can only exist as a picture, so that's what
// this is. A real spiral of steps is rendered each frame from one fixed, straight-on (orthographic) angle, the one angle
// from which its top step lands exactly on its bottom step, into a texture on a board that always turns to face the
// camera. A small figure climbs it forever.
import { THREE, makePerson, animatePerson, lerp } from '/game/engine/core.js';

export function makePenrose(renderer, { size = 4.6, foot = 0.8 } = {}) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7a66, 1.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(-4, 10, 6); scene.add(key);
  // Penrose's own construction: two long sides (5 steps) and two short ones (2 steps), every step one tread along and
  // one rise up. Seen from D, the three extra steps along each long side exactly undo the rise of the whole loop, so
  // on screen it closes, while every single step still visibly climbs.
  const D = V(1, 1.2, 1).normalize();
  const LONG = 5, SHORT = 2, steps = 2 * (LONG + SHORT);
  const rise = ((LONG - SHORT) * foot * D.y) / (steps * D.x);          // (3 treads, N rises) must lie along D
  const dirs = [...Array(LONG).fill([1, 0]), ...Array(LONG).fill([0, 1]), ...Array(SHORT).fill([-1, 0]), ...Array(SHORT).fill([0, -1])];
  const pts = [V(0, 0, 0)];
  dirs.forEach(([dx, dz], i) => pts.push(pts[i].clone().add(V(dx * foot, rise, dz * foot))));
  const loop = pts[steps].clone().sub(pts[0]);                           // one full turn: straight along D
  const at = (i) => { const k = Math.floor(i / steps), j = ((i % steps) + steps) % steps; return pts[j].clone().addScaledVector(loop, k); };
  const half = 3.1;
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100);
  // strong Escher contrast: pale treads, a mid face, a dark face
  const mats = (() => { const tread = new THREE.MeshStandardMaterial({ color: 0xf4ecdc, roughness: 0.9 }), a = new THREE.MeshStandardMaterial({ color: 0xb8a88c, roughness: 0.9 }), b = new THREE.MeshStandardMaterial({ color: 0x6f6454, roughness: 0.9 }); return [a, a, tread, b, b, b]; })();
  const edge = new THREE.LineBasicMaterial({ color: 0x3a3228 });
  const geo = new THREE.BoxGeometry(foot, foot * 1.4, foot), edges = new THREE.EdgesGeometry(geo);
  for (let i = 0; i < steps; i++) {
    const p = at(i), m = new THREE.Mesh(geo, mats); m.position.set(p.x, p.y - foot * 0.7, p.z);
    m.add(new THREE.LineSegments(edges, edge)); scene.add(m);
  }
  // centre the picture on the loop
  const mid = V(); for (let i = 0; i < steps; i++) mid.add(at(i)); mid.divideScalar(steps).add(V(0, 0.2, 0));   // the middle of the loop
  cam.position.copy(mid).addScaledVector(D, 40); cam.lookAt(mid);
  const climber = makePerson({ color: 0x5b6070, scale: 0.4 }); scene.add(climber);

  const rt = new THREE.WebGLRenderTarget(768, 768, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, depthWrite: false }));
  board.renderOrder = 1;
  const clear = new THREE.Color();
  let frame = 0;
  return {
    board,
    update(t, camera) {
      // the climber goes round and round, always going up
      const u = (t * 0.45) % steps, i = Math.floor(u), f = u - i, a = at(i), b = at(i + 1);
      climber.position.set(lerp(a.x, b.x, f), lerp(a.y, b.y, f) + Math.sin(Math.PI * f) * 0.12, lerp(a.z, b.z, f));
      climber.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      animatePerson(climber, t * 2, { energy: 0.6 });
      // the picture turns to face you (upright)
      board.rotation.y = Math.atan2(camera.position.x - board.position.x, camera.position.z - board.position.z);
      if (frame++ % 2) return;                                           // 30 fps is plenty for a picture
      renderer.getClearColor(clear); const alpha = renderer.getClearAlpha(), prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear();
      renderer.render(scene, cam);
      renderer.setRenderTarget(prev); renderer.setClearColor(clear, alpha);
    },
  };
}
