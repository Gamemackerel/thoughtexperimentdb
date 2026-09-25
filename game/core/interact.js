// Proximity interactables (with an on-screen prompt) and one-shot area triggers.
//
// add({ pos, radius, prompt, onUse, enabled, height, terminal, aside })
//   pos       Vector3, or () => Vector3
//   terminal  it ends the vignette (or can't be undone): it loses ties to anything else in range
//   aside     a small curiosity (talk, look): it wins ties against bigger actions
// When several are in range, the one you're facing wins, then the nearest; terminal ones only win when they're the
// clear choice. Presses are ignored for a moment after a level loads (grace), and held keys don't repeat.
import { THREE } from '/game/engine/core.js';

export class Interact {
  constructor(stage) {
    this.stage = stage;
    this.items = [];
    this.triggers = [];
    this.current = null;
    this.graceUntil = 0;
    this.onUse = null;
    this.el = document.getElementById('prompt');
    this.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.use(); });
    addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) this.use(); }
    });
    this.padWas = false;
  }

  clear() { this.items = []; this.triggers = []; this.current = null; this.el.classList.remove('on'); }
  grace(secs) { this.graceUntil = performance.now() + secs * 1000; }

  add(item) { this.items.push({ radius: 2, height: 2.2, enabled: () => true, ...item }); return item; }

  // { pos | test(p), radius, once = true, when: () => bool, onEnter() }
  trigger(tr) { this.triggers.push({ once: true, fired: false, when: () => true, ...tr }); return tr; }

  use() {
    if (performance.now() < this.graceUntil) return;
    if (this.current && this.current.enabled()) { this.onUse?.(); this.current.onUse(); }
  }

  update(player) {
    const p = player.pos;
    const face = player.firstPerson ? player.viewDir().setY(0).normalize() : new THREE.Vector3(Math.sin(player.obj.rotation.y), 0, Math.cos(player.obj.rotation.y));
    let best = null, bestScore = Infinity;
    for (const it of this.items) {
      if (!it.enabled()) continue;
      const q = typeof it.pos === 'function' ? it.pos() : it.pos;
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
      if (d >= it.radius) continue;
      const facing = d > 0.05 ? (dx * face.x + dz * face.z) / d : 1;          // 1 ahead, -1 behind
      const score = d * (1.25 - 0.45 * facing) + (it.terminal ? 0.9 : 0) - (it.aside ? 0.35 : 0);
      if (score < bestScore) { best = it; bestScore = score; }
    }
    this.current = best;
    if (best) {
      const q = (typeof best.pos === 'function' ? best.pos() : best.pos).clone();
      q.y += best.height;
      const v = q.project(this.stage.camera);
      const text = typeof best.prompt === 'function' ? best.prompt() : best.prompt;
      const html = `<kbd>${matchMedia('(pointer: coarse)').matches ? 'Tap' : 'E'}</kbd>${text}`;
      if (this.el.innerHTML !== html) this.el.innerHTML = html;
      const off = v.z > 1 || Math.abs(v.x) > 0.95 || Math.abs(v.y) > 0.95;   // behind the camera or off screen: pin it low in the middle
      const x = off ? 0 : v.x, y = off ? -0.62 : Math.max(-0.7, v.y);
      this.el.style.left = ((x * 0.5 + 0.5) * innerWidth) + 'px';
      this.el.style.top = ((-y * 0.5 + 0.5) * innerHeight) + 'px';
    }
    this.el.classList.toggle('on', !!best);

    for (const tr of this.triggers) {
      if (tr.once && tr.fired) continue;
      const inside = tr.test ? tr.test(p) : Math.hypot(p.x - tr.pos.x, p.z - tr.pos.z) < tr.radius;
      if (inside && tr.when()) { tr.fired = true; tr.onEnter(); }
    }

    const pad = navigator.getGamepads?.()[0];
    const pressed = !!pad?.buttons?.[0]?.pressed;
    if (pressed && !this.padWas) this.use();
    this.padWas = pressed;
  }
}
