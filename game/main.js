// Thought Experiments — the game shell: levels (the House + vignettes), player, camera, prompts, voice, notebook, saves.
import { THREE, createStage, createUI } from '/engine/core.js';
import { Player } from './core/player.js';
import { Interact } from './core/interact.js';
import { Voice } from './core/voice.js';
import { Journal } from './core/journal.js';

const LEVELS = {
  house: () => import('./house/house.js'),
  'trolley-problem': () => import('./vignettes/trolley-problem.js'),
  'brain-in-a-vat': () => import('./vignettes/brain-in-a-vat.js'),
  'platos-cave': () => import('./vignettes/platos-cave.js'),
  'ship-of-theseus': () => import('./vignettes/ship-of-theseus.js'),
  hall: () => import('./house/hall.js'),
  'grandfather-paradox': () => import('./vignettes/grandfather-paradox.js'),
  'infinite-monkey': () => import('./vignettes/infinite-monkey.js'),
  'simulation-argument': () => import('./vignettes/simulation-argument.js'),
  'fermi-paradox': () => import('./vignettes/fermi-paradox.js'),
  'tragedy-of-the-commons': () => import('./vignettes/tragedy-of-the-commons.js'),
};

// ---------------------------------------------------------------- stage (full window, crisp on hi-dpi)
const canvas = document.getElementById('gl');
const stage = createStage(canvas, { width: innerWidth, height: innerHeight });
let baseFov = 35;
function resize() {
  const w = innerWidth, h = innerHeight;
  stage.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.renderer.setSize(w, h, false);
  stage.camera.aspect = w / h;
  // portrait screens keep most of the landscape horizontal view (same rule as the films)
  const landH = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35 / 2)) * (16 / 9));
  baseFov = h > w ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan((landH * 0.86) / 2) / (w / h))) : 35;
  stage.camera.fov = baseFov;
  stage.camera.updateProjectionMatrix();
  stage.width = w; stage.height = h;
}
addEventListener('resize', resize); resize();

const uiRoot = document.getElementById('ui');
let ui = createUI(uiRoot, stage);
const player = new Player();
const interact = new Interact(stage);
const voice = new Voice();
const journal = new Journal();

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
  // a typewritten page held up to the camera (closes with E / Space / tap)
  page(html) { pageEl.innerHTML = html + '<div class="hint">E · put it down</div>'; pageEl.hidden = false; },
  get pageOpen() { return !pageEl.hidden; },
  // ends a vignette: a quiet card with "play again" / "back to the house"
  // ends a vignette: the card also asks the journal question and takes a note for the builder
  gameOver({ kicker = 'Game over', title, text = '' }) {
    player.enabled = false;
    over.querySelector('.kicker').textContent = kicker;
    over.querySelector('h1').textContent = title;
    over.querySelector('p').textContent = text;
    const id = level.name, q = journal.question(id);
    over.querySelector('.ask').hidden = !q;
    over.querySelector('.ask .q').textContent = q;
    answerEl.value = journal.answer(id); feedbackEl.value = '';
    journal.write(id, { ending: title });
    over.hidden = false;
  },
  // the journal on the desk in the first room
  openJournal() {
    journalEl.innerHTML = journal.render(save.done);
    journalEl.hidden = false; player.enabled = false;
    for (const ta of journalEl.querySelectorAll('textarea')) { fit(ta); ta.addEventListener('input', () => { fit(ta); journal.write(ta.dataset.id, { answer: ta.value }); }); }
  },
  get journalOpen() { return !journalEl.hidden; },
};
const over = document.getElementById('over');
const pageEl = document.getElementById('page');
pageEl.addEventListener('pointerdown', () => (pageEl.hidden = true));
addEventListener('keydown', (e) => { if (!pageEl.hidden && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Escape')) { e.stopImmediatePropagation(); pageEl.hidden = true; } }, true);
const answerEl = document.getElementById('answer'), feedbackEl = document.getElementById('feedback');
const journalEl = document.getElementById('journal');
const fit = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
function closeJournal() { journalEl.hidden = true; player.enabled = true; }
journalEl.addEventListener('click', (e) => { if (e.target.classList.contains('close')) closeJournal(); });
// typing in a text box must not walk, interact or open the notebook
for (const el of [over, journalEl]) for (const t of ['keydown', 'keyup']) el.addEventListener(t, (e) => {
  if (e.target.tagName !== 'TEXTAREA') return;
  if (e.code === 'Escape') { e.target.blur(); if (el === journalEl) closeJournal(); }
  e.stopPropagation();
});
answerEl.addEventListener('input', () => journal.write(level.name, { answer: answerEl.value }));
// playtest feedback goes to feedback.txt at the repo root (via the dev server), with enough context to reproduce
function sendFeedback() {
  const text = feedbackEl.value.trim(); if (!text) return;
  const state = {};
  for (const [k, v] of Object.entries(level.__S ?? {})) if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) state[k] = v;
  fetch('/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
    level: level.name, ending: over.querySelector('h1').textContent, text, answer: answerEl.value.trim(), state,
    time: Math.round(time), player: { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2) },
    screen: `${innerWidth}x${innerHeight}`, ua: navigator.userAgent,
  }) }).catch(() => {});
}
over.addEventListener('click', (e) => {
  const act = e.target.dataset?.act; if (!act) return;
  sendFeedback();
  over.hidden = true;
  goto(act === 'again' ? level.name : 'house');
});

// ---------------------------------------------------------------- levels
let level = null, busy = false;
const cam = { pos: new THREE.Vector3(0, 10, 20), look: new THREE.Vector3() };
async function goto(name) {
  if (busy) return; busy = true;
  await ctx.flash(true);
  over.hidden = true;
  if (level) { stage.scene.remove(level.root); level.dispose?.(); }
  interact.clear(); voice.stop(); nb.hidden = true; pageEl.hidden = true; journalEl.hidden = true;
  uiRoot.innerHTML = ''; ui = createUI(uiRoot, stage);        // fresh overlays for every level
  ctx.from = level?.name ?? null;                              // where we came from (e.g. to spawn by the right painting)
  // every level starts from the default light; levels may dim or tint it
  stage.hemi.intensity = 1.6; stage.sun.intensity = 2.4; stage.hemi.color.set(0xfff6e8); stage.sun.color.set(0xfff1dc);
  stage.renderer.toneMappingExposure = 1.05;
  player.sit(false); player.locked = false; player.obj.visible = true;
  player.firstPerson = false; player.pitch = 0; player.yawLimit = null;
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
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture?.(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
  if (player.firstPerson && player.enabled) player.look(-dx * 0.005, -dy * 0.004);   // drag to look around
});
canvas.addEventListener('pointerup', (e) => {
  const tap = drag && drag.moved < 8; drag = null;
  if (!tap || !level || !player.enabled) return;
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
    if (!journalEl.hidden) { closeJournal(); return; }
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
    // a level may ask for a different lens (first person wants a wider one)
    const fov = c.fov ? (innerHeight > innerWidth ? c.fov * 1.35 : c.fov) : baseFov;
    if (Math.abs(stage.camera.fov - fov) > 0.05) { stage.camera.fov += (fov - stage.camera.fov) * (c.cut ? 1 : 1 - Math.exp(-dt * 4)); stage.camera.updateProjectionMatrix(); }
  }
  stage.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__ted = { ctx, player, interact, get level() { return level; } };   // debugging / automated playtests

// ---------------------------------------------------------------- title → house
const title = document.getElementById('title');
document.getElementById('begin').addEventListener('click', () => { title.classList.add('gone'); goto(new URLSearchParams(location.search).get('level') ?? 'house'); });
