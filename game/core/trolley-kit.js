// Shared pieces for the trolley vignettes (the footbridge and the loop): a steady framing camera, the toy-like
// knock-away and its rewind, and the stretched speech of people in slowed time.
import { THREE, easeOut, clamp } from '/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

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
