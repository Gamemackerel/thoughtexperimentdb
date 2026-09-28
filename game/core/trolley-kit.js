// Shared pieces for the three trolley vignettes (the lever, the footbridge and the loop): the trolley's ride (bounce,
// sway, wheels, sparks and dust), a steady framing camera, the toy-like knock-away and its rewind, and the stretched
// speech of people in slowed time.
import { THREE, clamp, easeOut, clay, makeEmitter } from '/game/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Put a trolley (or its ghost) s units along a route: a little bounce and sway that grow with speed (spd: 0..1 of full
// speed), wheels turning with the distance travelled. Hidden while it's still deep in the tunnel.
export function placeTrolley(obj, curve, s, spd, portal = -50) {
  const u = clamp(s / curve.getLength(), 0, 1);
  const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
  obj.position.set(p.x, 0.05 * Math.abs(Math.sin(s * 2.6)) * spd, p.z);
  obj.rotation.set(Math.sin(s * 2.1) * 0.018 * spd, Math.atan2(-tan.z, tan.x), 0.012 * spd);
  obj.visible = p.x > portal - 12;
  obj.userData.wheels?.forEach((w) => w.isObject3D && (w.rotation.z = -s / 0.34));
  return p;
}

// The trolley's ride: placement plus sparks off the wheels and dust behind. Both run on the trolley's own travel clock
// (distance / fast), so they freeze when it creeps in slowed time and run backwards when it rewinds.
// ride(route, s, speed) each frame.
export function makeRide(root, trolley, { fast = 9, portal = -50 } = {}) {
  let curve = null;
  const posAt = (s) => curve.getPointAt(clamp(s / curve.getLength(), 0, 1));
  const sparks = makeEmitter({
    rate: 60, life: 0.4, max: 48, seed: 1, geometry: new THREE.BoxGeometry(1, 1, 1),
    material: new THREE.MeshStandardMaterial({ color: 0xffd07a, emissive: 0xff9a3d, emissiveIntensity: 3 }),
    spawn: (n, b, age, r) => {
      const T = posAt(b * fast); if (T.x < portal + 1) return null;
      const wz = r() < 0.5 ? -0.7 : 0.7, vx = -1.5 - r() * 4, vy = 1.5 + r() * 3, vz = wz * (1 + r() * 3);
      const y = 0.15 + vy * age - 4.9 * age * age; if (y < 0) return null;
      return { x: T.x + (r() < 0.5 ? -1.4 : 1.4) + vx * age, y, z: T.z + wz + vz * age, s: 0.06, sx: 4, ry: Math.atan2(-vz, vx) };
    },
  });
  const dust = makeEmitter({
    rate: 26, life: 1.4, max: 40, seed: 2, geometry: new THREE.SphereGeometry(1, 12, 8), material: clay(0xf4ecdf, { roughness: 1 }),
    spawn: (n, b, age, r) => {
      const T = posAt(b * fast); if (T.x < portal + 1) return null;
      const d = (1 - Math.exp(-2.2 * age)) / 2.2, k = age / 1.4;
      return { x: T.x - 1.6 - (1.5 + r() * 2) * d, y: 0.25 + (0.8 + r()) * d, z: T.z + (r() - 0.5) * 2.2, s: (0.13 + k * 0.45) * (1 - k * k) };
    },
  });
  root.add(sparks, dust);
  return (route, s, speed) => {
    curve = route;
    const p = placeTrolley(trolley, route, s, speed / fast, portal);
    const clock = Math.max(0, s / fast);
    sparks.userData.update(clock, 1);
    dust.userData.update(clock, 1);
    return p;
  };
}

// Fit a set of points on screen from one fixed viewing direction (tracks run across the wide screen).
export function makeFrameAll(stage, view = V(-0.16, 0.62, 0.77)) {
  const VIEW = view.clone().normalize();
  const RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), VIEW).normalize();
  const UPV = new THREE.Vector3().crossVectors(VIEW, RIGHT).normalize();
  const box = new THREE.Box3();
  return (points, { margin = 1.1, min = 16, max = 80, pad = 2.2, y = 1 } = {}) => {
    box.makeEmpty(); points.forEach((p) => box.expandByPoint(p));
    const c = box.getCenter(V()).setY(y);
    const cam = stage.camera, tv = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / margin, th = tv * cam.aspect;
    let d = min;
    for (const p of points) {
      const q = p.clone().sub(c);
      d = Math.max(d, q.dot(VIEW) + (Math.abs(q.dot(RIGHT)) + pad) / th, q.dot(VIEW) + (Math.abs(q.dot(UPV)) + pad) / tv);
    }
    return { pos: c.clone().addScaledVector(VIEW, Math.min(d, max)), look: c };
  };
}

// knocked away like a toy: up, over and to the side; h is time since the hit (rewinding just runs h backwards)
export function knockPose(v, h, { along = 4.5, side = 3.4 } = {}) {
  if (!v.base) v.base = { p: v.obj.position.clone(), r: v.obj.rotation.clone() };
  const k = easeOut(h / 0.5), m = easeOut(h / 0.9);
  v.obj.position.set(v.base.p.x + along * m, v.base.p.y + 1.9 * Math.sin(Math.PI * clamp(h / 0.7)) + 0.34 * k, v.base.p.z + v.side * side * m);
  v.obj.rotation.set(v.side * (Math.PI / 2) * k, v.base.r.y + 1.4 * k * v.side, 0);
}
export function restore(v) { if (v.base) { v.obj.position.copy(v.base.p); v.obj.rotation.copy(v.base.r); } v.base = null; v.hitT = null; }

// how people sound in slowed time
export const slowly = (t) => t.replace(/([aeiouy])/gi, '$1$1$1').replace(/\.$/, '…');
