// Thought Experiments — the game shell: levels (the House + vignettes), player, camera, prompts, voice, notebook, saves.
import { THREE, createStage, createUI } from '/engine/core.js';
import { Player } from './core/player.js';
import { Interact } from './core/interact.js';
import { Voice } from './core/voice.js';

const LEVELS = {
  house: () => import('./house/house.js'),
  'trolley-problem': () => import('./vignettes/trolley-problem.js'),
};

// ---------------------------------------------------------------- stage (full window, crisp on hi-dpi)
const canvas = document.getElementById('gl');
const stage = createStage(canvas, { width: innerWidth, height: innerHeight });
function resize() {
  const w = innerWidth, h = innerHeight;
  stage.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.renderer.setSize(w, h, false);
  stage.camera.aspect = w / h;
  // portrait screens keep most of the landscape horizontal view (same rule as the films)
  const landH = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35 / 2)) * (16 / 9));
  stage.camera.fov = h > w ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan((landH * 0.86) / 2) / (w / h))) : 35;
  stage.camera.updateProjectionMatrix();
  stage.width = w; stage.height = h;
}
addEventListener('resize', resize); resize();

const uiRoot = document.getElementById('ui');
let ui = createUI(uiRoot, stage);
const player = new Player();
const interact = new Interact(stage);
const voice = new Voice();

// ---------------------------------------------------------------- helpers exposed to levels
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
const flash = document.getElementById('flash'), toastEl = document.getElementById('toast'), nb = document.getElementById('notebook');
let toastTimer;
const save = {
  done: new Set(JSON.parse((() => { try { return localStorage.getItem('ted.done') || '[]'; } catch { return '[]'; } })())),
  complete(id) { this.done.add(id); try { localStorage.setItem('ted.done', JSON.stringify([...this.done])); } catch {} },
};
const ctx = {
  stage, get ui() { return ui; }, player, interact, voice, save, wait,
  goto: (name) => goto(name),
  toast(text, secs = 3) { toastEl.innerHTML = text; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), secs * 1000); },
  async flash(on) { flash.classList.toggle('on', on); await wait(0.6); },
};

// ---------------------------------------------------------------- levels
let level = null, busy = false;
const cam = { pos: new THREE.Vector3(0, 10, 20), look: new THREE.Vector3() };
async function goto(name) {
  if (busy) return; busy = true;
  await ctx.flash(true);
  if (level) { stage.scene.remove(level.root); level.dispose?.(); }
  interact.clear(); voice.stop(); nb.hidden = true;
  uiRoot.innerHTML = ''; ui = createUI(uiRoot, stage);        // fresh overlays for every level
  ctx.from = level?.name ?? null;                              // where we came from (e.g. to spawn by the right painting)
  const mod = await LEVELS[name]();
  level = mod.default(ctx);
  level.name = name;
  stage.scene.add(level.root);
  if (!player.obj.parent) stage.scene.add(player.obj);
  player.place(level.spawn.x, level.spawn.z, level.spawn.rotY ?? 0);
  player.enabled = true;
  const c = level.camera(player, 0, 0);
  cam.pos.copy(c.pos); cam.look.copy(c.look);
  time = 0;
  await ctx.flash(false);
  busy = false;
  level.start?.();
}

// ---------------------------------------------------------------- input: tap/click to walk, notebook, leave
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  if (!level || !player.enabled) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, stage.camera);
  const hit = ray.intersectObjects(level.ground ?? [], false)[0];
  if (hit && level.walkable(hit.point.x, hit.point.z)) player.target = hit.point.clone().setY(0);
});
addEventListener('keydown', (e) => {
  if (e.code === 'KeyN' && level?.notebook) {
    nb.innerHTML = `<div class="close">N · close</div>${level.notebook}`;
    nb.hidden = !nb.hidden;
  }
  if (e.code === 'Escape') {
    if (!nb.hidden) { nb.hidden = true; return; }
    if (level && level.name !== 'house' && confirm('Leave this vignette and return to the house?')) goto('house');
  }
});
nb.addEventListener('pointerdown', (e) => { if (e.target.classList.contains('close')) nb.hidden = true; });

// ---------------------------------------------------------------- loop
let time = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (level && !busy) {
    time += dt;
    level.update(dt, time);
    player.update(dt, time, level, stage.camera);
    interact.update(player);
    const c = level.camera(player, time, dt);
    const k = c.cut ? 1 : 1 - Math.exp(-dt * (c.stiffness ?? 3));
    cam.pos.lerp(c.pos, k); cam.look.lerp(c.look, k);
    stage.setCamera(cam.pos, cam.look);
  }
  stage.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ted = { ctx, player, interact, get level() { return level; } };   // debugging / automated playtests

// ---------------------------------------------------------------- title → house
const title = document.getElementById('title');
document.getElementById('begin').addEventListener('click', () => { title.classList.add('gone'); goto(new URLSearchParams(location.search).get('level') ?? 'house'); });
