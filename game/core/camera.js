// Framing camera: fits a set of points exactly on screen (horizontally and vertically) from a fixed view direction.
import { THREE, clamp } from '/engine/core.js';

export function makeFramer(stage, view = [-0.16, 0.62, 0.77]) {
  const VIEW = new THREE.Vector3(...view).normalize();
  const RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), VIEW).normalize();
  const UP = new THREE.Vector3().crossVectors(VIEW, RIGHT).normalize();
  const box = new THREE.Box3();
  return function frame(points, { margin = 1.1, min = 12, max = 80, pad = 2, lift = 1 } = {}) {
    box.makeEmpty(); points.forEach((p) => box.expandByPoint(p));
    const c = box.getCenter(new THREE.Vector3()); c.y = Math.max(c.y, lift);
    const cam = stage.camera, tv = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / margin, th = tv * cam.aspect;
    let d = min;
    for (const p of points) {
      const q = p.clone().sub(c);
      d = Math.max(d, q.dot(VIEW) + (Math.abs(q.dot(RIGHT)) + pad) / th, q.dot(VIEW) + (Math.abs(q.dot(UP)) + pad) / tv);
    }
    return { pos: c.clone().addScaledVector(VIEW, clamp(d, min, max)), look: c };
  };
}
