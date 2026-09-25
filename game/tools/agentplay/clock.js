// Injected before the game loads (agentplay): replaces the page's clocks with a virtual one, so the game is frozen
// between a playtester's actions and only moves when told to (window.__vt.advance). Timers, requestAnimationFrame,
// performance.now and Date.now all read virtual time; fetch and dynamic imports still resolve in real time.
// Audio is muted (Voice falls back to timing lines by their duration), and CSS transitions are instant.
(() => {
  const realST = window.setTimeout.bind(window);
  const t0 = performance.now(), epoch = Date.now();
  let vnow = t0, seq = 1;
  const timers = new Map(), rafs = new Map();
  performance.now = () => vnow;
  Date.now = () => epoch + (vnow - t0);
  window.setTimeout = (fn, ms = 0, ...args) => { const id = seq++; timers.set(id, { at: vnow + Math.max(0, +ms || 0), fn, args }); return id; };
  window.setInterval = (fn, ms = 0, ...args) => { const every = Math.max(1, +ms || 0); const id = seq++; timers.set(id, { at: vnow + every, fn, args, every }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestAnimationFrame = (fn) => { const id = seq++; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => { rafs.delete(id); };
  HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('muted by agentplay', 'NotAllowedError')); };
  const flush = () => new Promise((r) => realST(r, 0));   // lets promise chains (and real fetches) move on

  async function runTimers() {
    for (let guard = 0; guard < 500; guard++) {
      let best = null;
      for (const [id, t] of timers) if (t.at <= vnow && (!best || t.at < best[1].at)) best = [id, t];
      if (!best) return;
      const [id, t] = best;
      if (t.every) t.at += t.every; else timers.delete(id);
      try { typeof t.fn === 'function' ? t.fn(...t.args) : eval(t.fn); } catch (e) { console.error(e); }
      await flush();
    }
  }

  const css = document.createElement('style');
  css.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));

  // everything a player could read on screen right now
  function visible() {
    const out = [];
    const seen = (el) => el && !el.closest('[hidden]') && el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false
      && parseFloat(getComputedStyle(el).opacity) > 0.05;
    const txt = (el) => el.innerText.replace(/\s+/g, ' ').trim();
    for (const [k, sel] of [['title', '#title:not(.gone)'], ['caption', '#caption.on'], ['toast', '#toast.on'], ['prompt', '#prompt.on'],
      ['page', '#page'], ['notebook', '#notebook'], ['journal', '#journal']]) {
      const el = document.querySelector(sel); if (seen(el) && txt(el)) out.push([k, txt(el).slice(0, k === 'notebook' || k === 'journal' ? 4000 : 600)]);
    }
    const over = document.getElementById('over');
    if (over && !over.hidden) out.push(['gameover', `${over.querySelector('.kicker').textContent} | ${over.querySelector('h1').textContent} | ${over.querySelector('p').textContent} | journal question: ${over.querySelector('.ask').hidden ? '-' : over.querySelector('.ask .q').textContent} | your answer: "${document.getElementById('answer').value}"`]);
    for (const ta of document.querySelectorAll('#journal textarea')) if (seen(ta)) out.push(['journal answer box', ta.value || '(empty)']);
    for (const el of document.querySelectorAll('#ui .label, #ui .title-card, #ui .lower-third, #ui .card, #ui .quote, #ui .note, #ui .caption, #ui .rewind')) {
      if (seen(el) && txt(el)) out.push([el.classList.contains('speech') ? 'speech' : el.className.split(' ')[0], txt(el).slice(0, 300)]);
    }
    return out;
  }

  const log = [];
  let lastSeen = new Map(), lastPhase, lastLevel;
  function watch() {
    const t = ((vnow - t0) / 1000).toFixed(1);
    const now = new Map(visible().filter(([k]) => !['notebook', 'journal'].includes(k)).map(([k, v]) => [k + ':' + v, [k, v]]));
    for (const [key, [k, v]] of now) if (!lastSeen.has(key)) log.push(`${t}s  ${k}: ${v}`);
    lastSeen = now;
    const ted = window.__ted, lvl = ted?.level?.name, ph = ted?.level?.__S?.phase;
    if (lvl !== lastLevel) { if (lvl) log.push(`${t}s  [level loaded: ${lvl}]`); lastLevel = lvl; lastPhase = undefined; }
    if (ph !== undefined && ph !== lastPhase) { log.push(`${t}s  [phase: ${ph}]`); lastPhase = ph; }
  }

  window.__vt = {
    now: () => (vnow - t0) / 1000,
    visible,
    takeLog: () => log.splice(0),
    // advance the game by `sec` seconds of virtual time at `fps`; only the last frame is actually drawn
    // (`until`: stop early when this JS expression becomes true)
    async advance(sec, { fps = 30, until = null } = {}) {
      const n = Math.max(1, Math.round(sec * fps)), step = 1000 / fps;
      const stage = window.__ted?.ctx?.stage, render = stage?.render;
      let stopped = false;
      try {
        for (let i = 0; i < n; i++) {
          if (stage) stage.render = i === n - 1 ? render : () => {};
          vnow += step;
          await runTimers();
          const cbs = [...rafs.values()]; rafs.clear();
          for (const cb of cbs) { try { cb(vnow); } catch (e) { console.error(e); } }
          await flush();
          watch();
          if (until && (0, eval)(until)) { stopped = true; break; }
        }
      } finally { if (stage) stage.render = render; }
      if (stopped && stage) { const cbs = [...rafs.values()]; rafs.clear(); cbs.forEach((cb) => cb(vnow)); }
      return stopped;
    },
  };
})();
