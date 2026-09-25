// The teal "you": keyboard / gamepad / tap-to-walk movement, simple collisions, walk animation.
import { THREE, palette, makePerson } from '/engine/core.js';

const UP = new THREE.Vector3(0, 1, 0);

export class Player {
  constructor() {
    this.obj = makePerson({ color: palette.agent });
    this.pos = this.obj.position;
    this.vel = new THREE.Vector3();
    this.target = null;          // tap-to-walk destination
    this.speed = 4.2;
    this.enabled = true;
    this.locked = false;         // scripted: ignores input, still walks to `target`
    this.walkT = 0;
    this.keys = new Set();
    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  place(x, z, rotY = 0) { this.pos.set(x, 0, z); this.obj.rotation.y = rotY; this.vel.set(0, 0, 0); this.target = null; }

  // raw input as a 2D vector (x right, y forward)
  input() {
    const k = this.keys, v = new THREE.Vector2();
    if (k.has('KeyW') || k.has('ArrowUp')) v.y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) v.y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) v.x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) v.x += 1;
    const pad = navigator.getGamepads?.()[0];
    if (pad) { const [ax, ay] = pad.axes; if (Math.hypot(ax, ay) > 0.18) { v.x += ax; v.y -= ay; } }
    return v.lengthSq() > 1 ? v.normalize() : v;
  }

  // level: { walkable(x,z), blockers(): [{x,z,r}] }; camera: THREE.Camera (movement is camera-relative)
  update(dt, t, level, camera) {
    const want = new THREE.Vector3();
    if (this.enabled) {
      const inp = this.locked ? new THREE.Vector2() : this.input();
      if (inp.lengthSq() > 0.01) {
        this.target = null;
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
        const right = new THREE.Vector3().crossVectors(fwd, UP);
        want.addScaledVector(fwd, inp.y).addScaledVector(right, inp.x);
      } else if (this.target) {
        want.subVectors(this.target, this.pos).setY(0);
        if (want.length() < 0.25) { this.target = null; want.set(0, 0, 0); } else want.normalize();
      }
    }
    const desired = want.multiplyScalar(this.speed);
    this.vel.lerp(desired, 1 - Math.exp(-dt * 10));
    const step = this.vel.clone().multiplyScalar(dt);
    if (step.lengthSq() > 1e-8) this.move(step, level);

    // face the direction of travel; walk bob
    const spd = this.vel.length() / this.speed;
    if (spd > 0.05) {
      const yaw = Math.atan2(this.vel.x, this.vel.z);
      let d = yaw - this.obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.obj.rotation.y += d * (1 - Math.exp(-dt * 12));
    }
    this.walkT += dt * (4 + 7 * spd);
    const body = this.obj.userData.body;
    body.position.y = Math.abs(Math.sin(this.walkT)) * (0.02 + 0.13 * spd);
    body.rotation.z = Math.sin(this.walkT) * 0.06 * spd;
    body.rotation.x = 0.08 * spd;
  }

  ok(x, z, level) {
    if (!level.walkable(x, z)) return false;
    for (const b of level.blockers?.() ?? []) if (Math.hypot(x - b.x, z - b.z) < b.r + 0.35) return false;
    return true;
  }

  move(step, level) {
    const p = this.pos;
    if (this.ok(p.x + step.x, p.z + step.z, level)) { p.x += step.x; p.z += step.z; return; }
    if (this.ok(p.x + step.x, p.z, level)) { p.x += step.x; this.vel.z *= 0.5; return; }
    if (this.ok(p.x, p.z + step.z, level)) { p.z += step.z; this.vel.x *= 0.5; return; }
    this.vel.multiplyScalar(0.3); this.target = null;
  }
}
