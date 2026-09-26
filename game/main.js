// Thought Experiments — the game shell: levels (the House + vignettes), player, camera, prompts, voice, notebook, saves.
import { THREE, createStage, createUI } from '/game/engine/core.js';
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
  'trolley-room': () => import('./house/trolley-room.js'),
  footbridge: () => import('./vignettes/footbridge.js'),
  'loop-track': () => import('./vignettes/loop-track.js'),
  transplant: () => import('./vignettes/transplant.js'),
  gallery: () => import('./house/gallery.js'),
  'ring-of-gyges': () => import('./vignettes/ring-of-gyges.js'),
  'prisoners-dilemma': () => import('./vignettes/prisoners-dilemma.js'),
  'newcombs-paradox': () => import('./vignettes/newcombs-paradox.js'),
  'utility-monster': () => import('./vignettes/utility-monster.js'),
  'chinese-room': () => import('./vignettes/chinese-room.js'),
  'monty-hall': () => import('./vignettes/monty-hall.js'),
};
// rooms of the house (hubs), and which room each vignette belongs to (where "back" goes)
const HUBS = new Set(['house', 'hall', 'trolley-room', 'gallery']);
const HOME_ROOM = {
  'grandfather-paradox': 'hall', 'infinite-monkey': 'hall', 'simulation-argument': 'hall', 'fermi-paradox': 'hall', 'tragedy-of-the-commons': 'hall',
  footbridge: 'trolley-room', 'loop-track': 'trolley-room', transplant: 'trolley-room',
  'ring-of-gyges': 'gallery', 'prisoners-dilemma': 'gallery', 'newcombs-paradox': 'gallery', 'utility-monster': 'gallery', 'chinese-room': 'gallery', 'monty-hall': 'gallery',
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
interact.onUse = () => { player.target = null; };               // using something stops a tap-to-walk
const voice = new Voice();
const journal = new Journal();

// ---------------------------------------------------------------- helpers exposed to levels
// Every level change bumps `gen`. A level's pending waits (and voice lines) from before the change never resolve, so its
// scripts stop where they are instead of running on into the next level (ending it, or opening its card over the house).
let gen = 0;
const wait = (s) => { const g = gen; return new Promise((r) => setTimeout(() => { if (g === gen) r(); }, s * 1000)); };
const ROOM_NAME = { house: 'the first room', hall: 'the hall', 'trolley-room': 'the trolley room', gallery: 'the gallery' };
const flash = document.getElementById('flash'), toastEl = document.getElementById('toast'), nb = document.getElementById('notebook');
let toastTimer;
const save = {
  done: new Set(JSON.parse((() => { try { return localStorage.getItem('ted.done') || '[]'; } catch { return '[]'; } })())),
  complete(id) { this.done.add(id); try { localStorage.setItem('ted.done', JSON.stringify([...this.done])); } catch {} },
};
const ctx = {
  stage, get ui() { return ui; }, player, interact, voice, save, wait,
  goto: (name) => goto(name),
  hub: 'house',                // the room of the house you last came from (where "back" goes)
  toast(text, secs = 3) { toastEl.innerHTML = text; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), secs * 1000); },
  async flash(on) { flash.classList.toggle('on', on); await wait(0.6); },
  // a speech bubble over someone (or something) for a few seconds; one at a time per speaker
  speak(target, text, { secs = Math.max(2.6, text.length / 14), offset = [0, 2.3, 0] } = {}) {
    const id = target.uuid ?? target, old = bubbles.get(id);
    if (old) ui.label('speech-' + old.key, 0, old.text, old.target, old.offset, 'speech');   // never leave the old one stuck
    bubbles.set(id, { target, text, t: 0, secs, offset, key: bubbleKey++ });
  },
  // a typewritten page held up to the camera (closes with E / Space / tap)
  page(html) { pageEl.innerHTML = html + '<div class="hint">E · put it down</div>'; pageEl.hidden = false; },
  get pageOpen() { return !pageEl.hidden; },
  // ends a vignette: a quiet card with "play again" / "back to <the room>". It also asks the journal question and takes a
  // note for the builder. If you've been here before, the narrator notices whether it ended the same way.
  async gameOver({ kicker = 'The end', title, text = '' }) {
    if (busy || !level || HUBS.has(level.name)) return;
    const g = gen, id = level.name;
    player.enabled = false; player.target = null;
    const before = journal.endings(id);
    journal.reach(id, title);
    if (before.length) {
      await voice.say(before[before.length - 1] === title ? 'again_same' : 'again_diff', { common: true, once: false });
      if (g !== gen) return;
    }
    clearBubbles();
    over.querySelector('.kicker').textContent = kicker;
    over.querySelector('h1').textContent = title;
    over.querySelector('p').textContent = text;
    const q = journal.question(id, title), prev = journal.lastAnswer(id);
    over.querySelector('.ask').hidden = !q;
    over.querySelector('.ask .q').textContent = q;
    const prevEl = over.querySelector('.prev');
    prevEl.hidden = !prev; prevEl.textContent = prev ? `Last time you wrote: “${prev.text}”` : '';
    answerEl.value = ''; feedbackEl.value = '';
    over.querySelector('[data-act="home"]').textContent = `Back to ${ROOM_NAME[ctx.hub] ?? 'the house'}`;
    over.hidden = false;
  },
  // the journal on the desk in the first room
  openJournal() {
    journalEl.innerHTML = journal.render(save.done);
    journalEl.hidden = false; player.enabled = false;
    for (const ta of journalEl.querySelectorAll('textarea')) { fit(ta); ta.addEventListener('input', () => { fit(ta); journal.edit(ta.dataset.id, +ta.dataset.i, ta.value); }); }
  },
  get journalOpen() { return !journalEl.hidden; },
};
const bubbles = new Map(); let bubbleKey = 0;
function clearBubbles() { for (const b of bubbles.values()) ui.label('speech-' + b.key, 0, b.text, b.target, b.offset, 'speech'); bubbles.clear(); }
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
// the answer is kept with the ending it was written after (every answer, not just the latest)
function keepAnswer() { const t = answerEl.value.trim(); if (t && level) journal.answer(level.name, over.querySelector('h1').textContent, t); }
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
function leaveCard(act) { keepAnswer(); sendFeedback(); over.hidden = true; goto(act === 'again' ? level.name : ctx.hub); }
over.addEventListener('click', (e) => { const act = e.target.dataset?.act; if (act) leaveCard(act); });

// the way home, always in view in a vignette (and Esc): a small pill, then a quiet "are you sure"
const homeBtn = document.getElementById('home'), leaveEl = document.getElementById('leave');
homeBtn.addEventListener('click', () => askLeave());
function askLeave() {
  if (!level || HUBS.has(level.name) || busy) return;
  leaveEl.querySelector('.q').textContent = `Leave, and go back to ${ROOM_NAME[ctx.hub] ?? 'the house'}?`;
  leaveEl.hidden = false; player.enabled = false;
}
leaveEl.addEventListener('click', (e) => {
  const act = e.target.dataset?.act; if (!act) return;
  leaveEl.hidden = true;
  if (act === 'leave') goto(ctx.hub); else player.enabled = true;
});

// ---------------------------------------------------------------- levels
let level = null, busy = false, pendingStart = null;
const cam = { pos: new THREE.Vector3(0, 10, 20), look: new THREE.Vector3() };
async function goto(name) {
  if (busy) return; busy = true;
  gen++; voice.abandon();                                      // the old level's scripts stop here
  player.enabled = false; player.target = null;
  await ctx.flash(true);
  over.hidden = true; leaveEl.hidden = true;
  if (level) { stage.scene.remove(level.root); level.dispose?.(); voice.abandon(); }
  interact.clear(); clearBubbles(); nb.hidden = true; pageEl.hidden = true; journalEl.hidden = true;
  toastEl.classList.remove('on');
  uiRoot.innerHTML = ''; ui = createUI(uiRoot, stage);        // fresh overlays for every level
  ctx.from = level?.name ?? null;                              // where we came from (e.g. to spawn by the right painting)
  if (HUBS.has(name)) ctx.hub = name;
  else if (!HUBS.has(ctx.from)) ctx.hub = HOME_ROOM[name] ?? 'house';
  // every level starts from the default light; levels may dim or tint it
  stage.hemi.intensity = 1.6; stage.sun.intensity = 2.4; stage.hemi.color.set(0xfff6e8); stage.sun.color.set(0xfff1dc);
  stage.renderer.toneMappingExposure = 1.05;
  player.sit(false); player.locked = false; player.obj.visible = true;
  player.firstPerson = false; player.pitch = 0; player.yawLimit = null; player.speed = 4.2;
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
  homeBtn.hidden = HUBS.has(name);
  homeBtn.textContent = `← ${ROOM_NAME[ctx.hub] ?? 'the house'}`;
  await ctx.flash(false);
  busy = false;
  interact.grace(0.8);                                          // a key held from the last scene doesn't act in this one
  if (document.getElementById('title').classList.contains('gone')) level.start?.(); else pendingStart = () => level.start?.();
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
  if (!hit) return;
  const spot = player.freeNear(hit.point.x, hit.point.z, level);          // a tap on furniture walks you up to it
  if (spot) player.target = new THREE.Vector3(spot.x, 0, spot.z);
});
addEventListener('keydown', (e) => {
  if (e.code === 'KeyN' && level?.notebook) {
    nb.innerHTML = `<div class="close">N · close</div>${level.notebook}`;
    nb.hidden = !nb.hidden;
  }
  if (e.code === 'Escape') {
    if (!nb.hidden) { nb.hidden = true; return; }
    if (!journalEl.hidden) { closeJournal(); return; }
    if (!leaveEl.hidden) { leaveEl.hidden = true; player.enabled = true; return; }
    if (!over.hidden) { leaveCard('home'); return; }            // on the card, Esc just goes back
    askLeave();
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
    for (const [k, b] of bubbles) {
      b.t += dt;
      const o = b.t > b.secs ? 0 : Math.min(1, b.t / 0.2, (b.secs - b.t) / 0.4);
      ui.label('speech-' + b.key, Math.max(0, o), b.text, b.target, b.offset, 'speech');
      if (b.t > b.secs) bubbles.delete(k);
    }
    // world labels (portal names, counters) hide under the page, notebook, journal and card
    document.body.classList.toggle('overlaid', !pageEl.hidden || !nb.hidden || !over.hidden || !journalEl.hidden || !leaveEl.hidden);
    document.body.classList.toggle('carded', !over.hidden);
    document.body.classList.toggle('fp', player.firstPerson);            // first person: captions go to the top                // no captions over the game-over card
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
const startLevel = new URLSearchParams(location.search).get('level');
if (!startLevel) goto('house').then(() => { if (!title.classList.contains('gone')) player.enabled = false; });   // the house is already there, behind the title
document.getElementById('begin').addEventListener('click', () => { title.classList.add('gone'); if (startLevel) goto(startLevel); else { player.enabled = true; time = 0; pendingStart?.(); pendingStart = null; } });
