// Proximity interactables (with an on-screen prompt) and one-shot area triggers.
import { THREE } from '/game/engine/core.js';

export class Interact {
  constructor(stage) {
    this.stage = stage;
    this.items = [];
    this.triggers = [];
    this.current = null;
    this.el = document.getElementById('prompt');
    this.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.use(); });
    addEventListener('keydown', (e) => { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.use(); } });
    this.padWas = false;
  }

  clear() { this.items = []; this.triggers = []; this.current = null; }

  // { pos: Vector3 | () => Vector3, radius, prompt: string | () => string, onUse(), enabled: () => bool, height }
  add(item) { this.items.push({ radius: 2, height: 2.2, enabled: () => true, ...item }); return item; }

  // { pos | test(p), radius, once = true, when: () => bool, onEnter() }
  trigger(tr) { this.triggers.push({ once: true, fired: false, when: () => true, ...tr }); return tr; }

  use() { if (this.current && this.current.enabled()) this.current.onUse(); }

  update(player) {
    const p = player.pos;
    let best = null, bestD = Infinity;
    for (const it of this.items) {
      if (!it.enabled()) continue;
      const q = typeof it.pos === 'function' ? it.pos() : it.pos;
      const d = Math.hypot(p.x - q.x, p.z - q.z);
      if (d < it.radius && d < bestD) { best = it; bestD = d; }
    }
    this.current = best;
    if (best) {
      const q = (typeof best.pos === 'function' ? best.pos() : best.pos).clone();
      q.y += best.height;
      const v = q.project(this.stage.camera);
      const text = typeof best.prompt === 'function' ? best.prompt() : best.prompt;
      const html = `<kbd>E</kbd>${text}`;
      if (this.el.innerHTML !== html) this.el.innerHTML = html;
      this.el.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
      this.el.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
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
