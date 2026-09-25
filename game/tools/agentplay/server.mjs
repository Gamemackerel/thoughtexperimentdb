#!/usr/bin/env node
// agentplay session daemon: one headless browser playing the game on a virtual clock, driven over HTTP by play.mjs.
// Started automatically by `play.mjs <session> open`. Needs the game server (`npm run play`) running.
import puppeteer from 'puppeteer';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [session, dir] = process.argv.slice(2);
const GAME = process.env.GAME_URL ?? 'http://localhost:5173/game/';
fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });

const args = ['--no-sandbox', '--ignore-gpu-blocklist', '--force-color-profile=srgb'];
args.push(...(process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']));
const browser = await puppeteer.launch({ headless: true, args, userDataDir: path.join(dir, 'profile') });
let page, errors = [], dialogs = [], lastLong = new Map();
let shotN = Math.max(0, ...fs.readdirSync(path.join(dir, 'shots')).map((f) => parseInt(f) || 0));   // never overwrite earlier shots
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newPage(w, h, mobile) {
  if (page) await page.close();
  page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(fs.readFileSync(path.join(HERE, 'clock.js'), 'utf8'));
  // web fonts come through curl (which trusts this machine's proxy CA when the browser's store doesn't), cached on disk
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (!/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) return req.continue();
    try {
      const f = path.join(dir, '..', '.fontcache', createHash('sha1').update(u).digest('hex'));
      if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, execFileSync('curl', ['-sSfL', '-A', 'Mozilla/5.0 Chrome/140', u])); }
      req.respond({ status: 200, contentType: u.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(f) });
    } catch { req.continue(); }
  });
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));
  page.on('console', (m) => { if (['error', 'warn'].includes(m.type()) && !/muted by agentplay|GPU stall|WebGL|Failed to load resource/.test(m.text())) errors.push(`console.${m.type()}: ${m.text()}`); });
  page.on('dialog', async (d) => { dialogs.push(`dialog "${d.message()}" → accepted`); await d.accept(); });
}

const adv = (sec, until) => page.evaluate((s, u) => window.__vt.advance(s, { until: u }), sec, until ?? null);
const loaded = () => page.evaluate(() => !!window.__ted?.level && document.getElementById('flash') && !document.getElementById('flash').classList.contains('on'));
async function settle(max = 6) {           // wait for a level to finish loading (imports are real-time, the flash is virtual)
  for (let i = 0; i < max * 10; i++) { if (await loaded()) { await adv(0.7); return true; } await adv(0.1); await sleep(30); }   // (+0.7 s: the fade-in after the flash)
  return false;
}

async function status({ full = false } = {}) {
  const s = await page.evaluate((full) => {
    const T = window.__ted, P = T?.player, L = T?.level;
    const r = { t: window.__vt.now().toFixed(1), level: L?.name ?? '(title screen)', visible: window.__vt.visible(), log: window.__vt.takeLog() };
    if (P) { r.pos = `(${P.pos.x.toFixed(1)}, ${P.pos.z.toFixed(1)})`; r.moving = P.vel.length() > 0.6 ? 'moving' : P.target ? 'trying to walk to a target but not getting closer' : ''; r.canMove = P.enabled && !P.locked && !P.sitting; r.firstPerson = P.firstPerson; }
    if (L?.__S) { r.state = {}; for (const [k, v] of Object.entries(L.__S)) if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) r.state[k] = typeof v === 'number' ? +v.toFixed(2) : v; }
    if (full && T) {
      r.interactables = T.interact.items.map((it, i) => {
        const q = typeof it.pos === 'function' ? it.pos() : it.pos;
        let prompt = '?'; try { prompt = typeof it.prompt === 'function' ? it.prompt() : it.prompt; } catch {}
        let en = '?'; try { en = it.enabled(); } catch {}
        return `#${i} "${prompt}" at (${q.x.toFixed(1)}, ${q.z.toFixed(1)}) radius ${it.radius} dist ${Math.hypot(P.pos.x - q.x, P.pos.z - q.z).toFixed(1)}${en ? '' : ' [disabled]'}`;
      });
      r.triggers = T.interact.triggers.map((tr, i) => `#${i} ${tr.pos ? `at (${tr.pos.x.toFixed(1)}, ${tr.pos.z.toFixed(1)}) r ${tr.radius}` : 'custom test'} ${tr.fired ? 'fired' : 'not fired'}`);
      r.spawn = L.spawn; r.voiceBusy = T.ctx.voice.busy;
    }
    return r;
  }, full);
  const lines = [`t=${s.t}s  level=${s.level}${s.pos ? `  you at ${s.pos}${s.moving ? ` (${s.moving})` : ''}${s.canMove === false ? '  [controls locked/seated]' : ''}${s.firstPerson ? '  [first person]' : ''}` : ''}`];
  if (s.state) lines.push('level state: ' + JSON.stringify(s.state));
  if (s.log.length) lines.push('what happened:', ...s.log.map((l) => '  ' + l));
  // long panels (notebook, journal) are printed in full only when they change
  const vis = s.visible.map(([k, v]) => {
    if (!['notebook', 'journal'].includes(k)) return `  [${k}] ${v}`;
    if (lastLong.get(k) === v) return `  [${k}] (open; same text as shown before)`;
    lastLong.set(k, v); return `  [${k}] ${v}`;
  });
  for (const k of lastLong.keys()) if (!s.visible.some(([kk]) => kk === k)) lastLong.delete(k);
  lines.push('on screen now:', ...(vis.length ? vis : ['  (no text)']));
  if (s.interactables) lines.push('interactables:', ...s.interactables.map((l) => '  ' + l), 'triggers:', ...s.triggers.map((l) => '  ' + l), `spawn: ${JSON.stringify(s.spawn)}  voice busy: ${s.voiceBusy}`);
  if (dialogs.length) lines.push(...dialogs.splice(0));
  if (errors.length) lines.push('ERRORS:', ...errors.splice(0).slice(0, 20).map((e) => '  ' + e));
  return lines.join('\n');
}

async function shot(label = '') {
  const f = path.join(dir, 'shots', `${String(++shotN).padStart(3, '0')}${label ? '-' + label.replace(/\W+/g, '-').slice(0, 30) : ''}.jpg`);
  await sleep(60);
  await page.screenshot({ path: f, type: 'jpeg', quality: 80 });
  return f;
}

const KEY = { w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', e: 'KeyE', n: 'KeyN', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  space: 'Space', enter: 'Enter', esc: 'Escape', escape: 'Escape' };
const key = (k) => KEY[k.toLowerCase()] ?? k;

const commands = {
  async open(level = 'house', size = '1280x720') {
    const [w, h] = size.split('x').map(Number);
    await newPage(w, h, h > w);
    await page.goto(GAME + (level === 'title' || level === 'house' ? '' : `?level=${level}`), { waitUntil: 'networkidle0' });
    await adv(0.5);
    let out = '';
    if (level !== 'title') { await page.click('#begin'); if (!(await settle(8))) out = 'WARNING: level did not finish loading\n'; await adv(0.2); }
    return out + (await status()) + '\nscreenshot: ' + (await shot('open'));
  },
  async look(label) { await adv(1 / 30); return (await status()) + '\nscreenshot: ' + (await shot(label)); },
  async status() { return status(); },
  async debug() { return status({ full: true }); },
  // advance time; with shots=k, take k evenly spaced screenshots along the way (to watch a scene play out)
  async wait(sec = '2', shots = '0') {
    const n = +shots, files = [];
    if (n > 0) for (let i = 0; i < n; i++) { await adv(+sec / n); files.push(await shot(`t${await page.evaluate(() => window.__vt.now().toFixed(0))}`)); }
    else await adv(+sec);
    return (await status()) + (files.length ? '\nscreenshots:\n' + files.map((f) => '  ' + f).join('\n') : '');
  },
  // walk to world (x, z) with tap-to-walk steering; stops on arrival, when stuck, or after `max` seconds
  async walk(x, z, max = '15') {
    await page.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, +x, +z);
    await adv(+max, 'window.__ted.player.target === null || !window.__ted.player.enabled');
    const r = await page.evaluate((x, z) => { const P = window.__ted.player; return { d: Math.hypot(P.pos.x - x, P.pos.z - z), stopped: P.target !== null }; }, +x, +z);
    return (r.d < 0.6 ? 'arrived' : `did not arrive (still ${r.d.toFixed(1)} away${r.stopped ? ', still walking at timeout' : ', blocked or stopped'})`) + '\n' + (await status());
  },
  // hold keys (e.g. "w" or "w+d") for `sec` seconds of game time — real keyboard movement, for collisions and feel
  async hold(keys, sec = '1') {
    const ks = keys.split('+').map(key);
    for (const k of ks) await page.keyboard.down(k);
    await adv(+sec);
    for (const k of ks) await page.keyboard.up(k);
    await adv(0.2);
    return status();
  },
  // let time pass until something happens: `phase` (the level's phase changes), a phase name, `caption` (a new narration
  // line), `prompt` (an interaction prompt appears), `over` (the game-over card), `level` (a level loads), or any JS condition
  async until(what = 'phase', max = '60') {
    const cond = {
      phase: `window.__ted?.level?.__S?.phase !== ${JSON.stringify(await page.evaluate(() => window.__ted?.level?.__S?.phase ?? null))}`,
      caption: `(() => { const c = document.querySelector('#caption.on'); const t = c ? c.innerText : ''; const r = t && t !== window.__lastCap; window.__lastCap = t; return r; })()`,
      prompt: `document.getElementById('prompt').classList.contains('on')`,
      over: `!document.getElementById('over').hidden`,
      level: `window.__ted?.level?.name !== ${JSON.stringify(await page.evaluate(() => window.__ted?.level?.name ?? null))}`,
    }[what] ?? (/^[\w-]+$/.test(what) ? `window.__ted?.level?.__S?.phase === ${JSON.stringify(what)}` : what);
    if (what === 'caption') await page.evaluate(() => { const c = document.querySelector('#caption.on'); window.__lastCap = c ? c.innerText : ''; });
    const hit = await adv(+max, cond);
    return (hit ? `condition met` : `condition NOT met within ${max}s`) + '\n' + (await status());
  },
  // walk up to the interactable whose prompt contains `text` (case-insensitive) and use it once its prompt shows
  async use(...words) {
    const text = words.join(' ').toLowerCase();
    const found = await page.evaluate((text) => {
      const { interact, player } = window.__ted;
      const pr = (it) => { try { return String(typeof it.prompt === 'function' ? it.prompt() : it.prompt); } catch { return ''; } };
      const cands = interact.items.map((it, i) => ({ it, i, p: pr(it) })).filter((c) => c.p.toLowerCase().includes(text));
      if (!cands.length) return { err: 'no interactable matches; prompts are: ' + interact.items.map(pr).join(' | ') };
      const q = (c) => (typeof c.it.pos === 'function' ? c.it.pos() : c.it.pos);
      const en = (c) => { try { return c.it.enabled() ? 0 : 1; } catch { return 1; } };
      cands.sort((a, b) => en(a) - en(b) || q(a).distanceTo(player.pos) - q(b).distanceTo(player.pos));   // enabled first, then nearest
      const c = cands[0], at = q(c), d = player.pos.clone().sub(at).setY(0);
      if (d.length() > c.it.radius * 0.6) { d.setLength(c.it.radius * 0.6); player.target = at.clone().add(d).setY(0); }
      window.__useIdx = c.i;
      return { prompt: c.p, enabled: c.it.enabled() };
    }, text);
    if (found.err) return found.err;
    const ok = await adv(20, 'window.__ted.interact.current === window.__ted.interact.items[window.__useIdx]');
    if (!ok) return `could not get the "${found.prompt}" prompt within 20s${found.enabled ? '' : ' (it is disabled right now)'}\n` + (await status());
    await page.keyboard.press('KeyE'); await adv(0.3);
    return `used "${found.prompt}"\n` + (await status());
  },
  async press(k = 'e') { await page.keyboard.press(key(k)); await adv(0.2); return status(); },
  // click/tap at screen pixel (x, y) of the screenshot: walks there if it's ground, or presses what's under it
  async click(x, y) { await page.mouse.click(+x, +y); await adv(0.2); return status(); },
  async clicksel(sel) { await page.click(sel); await adv(0.3); await settle(4); return status(); },
  async type(...words) { await page.keyboard.type(words.join(' ')); return status(); },
  async drag(dx, dy) {   // drag across the canvas (first-person look)
    await page.mouse.move(640, 360); await page.mouse.down(); await page.mouse.move(640 + +dx, 360 + +dy, { steps: 12 }); await page.mouse.up(); await adv(0.2); return status();
  },
  async teleport(level) {
    for (let i = 0; i < 40; i++) {
      if (await page.evaluate((l) => window.__ted.level?.name === l, level) && await loaded()) break;
      if (i % 10 === 0) await page.evaluate((l) => { window.__ted.ctx.goto(l); }, level);   // (goto is ignored while another is in progress)
      await adv(0.25); await sleep(30);
    }
    await settle(8); return status();
  },
  async walkable(x, z) { return String(await page.evaluate((x, z) => window.__ted.level.walkable(x, z), +x, +z)); },
  // where a world point (x, y, z) appears on screen, and whether it's in frame
  async onscreen(x, y, z) {
    return page.evaluate((x, y, z) => {
      const cam = window.__ted.ctx.stage.camera, v = new cam.position.constructor(x, y, z);
      const behind = v.clone().sub(cam.position).dot(cam.getWorldDirection(v.clone())) < 0;
      v.project(cam);
      const px = Math.round((v.x * 0.5 + 0.5) * innerWidth), py = Math.round((-v.y * 0.5 + 0.5) * innerHeight);
      const inFrame = !behind && px >= 0 && px <= innerWidth && py >= 0 && py <= innerHeight;
      return `(${x}, ${y}, ${z}) → screen (${px}, ${py}) of ${innerWidth}x${innerHeight}: ${inFrame ? 'IN FRAME' : behind ? 'behind the camera' : 'OFF SCREEN'}`;
    }, +x, +y, +z);
  },
  // (a promise result isn't awaited: the clock is frozen, so it might never settle)
  async eval(...code) { const r = await page.evaluate((c) => { const v = (0, eval)(c); return v && typeof v.then === 'function' ? '(a promise: not awaited, since the clock is frozen; advance time to let it run)' : v; }, code.join(' ')); await adv(1 / 30); return JSON.stringify(r, null, 1)?.slice(0, 6000) ?? 'undefined'; },
  async quit() { setTimeout(async () => { await browser.close(); process.exit(0); }, 100); return 'bye'; },
};

let queue = Promise.resolve();
const srv = createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => {
    queue = queue.then(async () => {
      let out;
      try {
        const { cmd, args } = JSON.parse(body);
        if (!commands[cmd]) out = `unknown command "${cmd}". Commands: ${Object.keys(commands).join(', ')}`;
        else if (!page && cmd !== 'open' && cmd !== 'quit') out = 'no game open yet: run `open [level]` first';
        else out = await Promise.race([commands[cmd](...args), sleep(240000).then(() => { throw new Error('timed out after 240 s real time (the session may be stuck: try `open` to restart it)'); })]);
      } catch (e) { out = 'COMMAND FAILED: ' + e.message; }
      res.end(out);
    });
  });
});
srv.listen(0, '127.0.0.1', () => { fs.writeFileSync(path.join(dir, 'port'), String(srv.address().port)); console.log(`agentplay ${session} on ${srv.address().port}`); });
