// Automated playtest of the Ship of Theseus's voyage and the museum (needs `npm run play`):
//   node game/tools/playtest-voyage.mjs [plain]
// Boards the repaired ship, presses S at "sail forth", sails (and tacks), lands at the lighthouse, wins the fight, takes
// the chest from the cellar, visits North Sentinel (leaves the sweets), the frogs and the palm island, ties up at the
// harbour again (talks to the fisherman, boards), checks unvisited islands are "?", tacks upwind to the house island,
// goes in at the palace's front door, checks the end card comes (and the chest is saved), goes back to the first room
// from the card and checks the museum shows the chest. `plain`: don't press S, and check the end card still comes.
// Screenshots to build/playtest-voyage-*.png.
import puppeteer from 'puppeteer';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const plain = process.argv[2] === 'plain';
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:5173/game/?level=ship-of-theseus'); await sleep(1.5);
await p.evaluate(() => { try { localStorage.removeItem('ted.items'); } catch {} });
await p.click('#begin'); await sleep(2.5);
let n = 0;
const shot = (name) => { console.log('  shot', name); return p.screenshot({ path: `build/playtest-voyage-${String(++n).padStart(2, '0')}-${name}.png` }); };
const VS = (k) => p.evaluate((k) => window.__ted.level.__V?.S[k], k);
const lvl = () => p.evaluate(() => window.__ted.level?.name);
const until = async (fn, max = 60) => { for (let i = 0; i < max * 4; i++) { if (await fn()) return true; await sleep(0.25); } return false; };
const check = (ok, what) => { console.log(ok ? 'ok  ' : 'FAIL', what); if (!ok) errs.push('CHECK ' + what); };
// walk to an interactable by its prompt text, then use it
const use = async (re, wait = 8) => {
  const ok = await p.evaluate((re) => {
    const { interact, player } = window.__ted, r = new RegExp(re);
    const it = interact.items.find((i) => i.enabled() && r.test(typeof i.prompt === 'function' ? i.prompt() : i.prompt)); if (!it) return false;
    const q = typeof it.pos === 'function' ? it.pos() : it.pos; if (player.enabled) player.target = q.clone().setY(0); window.__want = it; return true;
  }, re);
  if (!ok) throw new Error('no prompt ' + re);
  for (let i = 0; i < wait * 4; i++) { if (await p.evaluate(() => window.__ted.interact.current === window.__want)) break; await sleep(0.25); }
  await p.keyboard.press('KeyE'); await sleep(0.5);
};
// an autopilot in the page: steers (holding the arrow keys) towards a point, tacking when it's upwind
const sailTo = async (id, max = 150) => {
  await p.evaluate((id) => {
    const V = window.__ted.level.__V, isle = V.isles.find((i) => i.id === id), keys = window.__ted.player.keys;
    clearInterval(window.__autoI); window.__tack = 0;
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    window.__autoI = setInterval(() => {
      const S = V.S, dx = isle.moor.x - S.x, dz = isle.moor.z - S.z;
      const brg = Math.atan2(-dz, dx), UP = -Math.PI / 2, off = Math.abs(wrap(brg - UP));
      let want = brg;
      if (off < 0.95) {                                                  // too close to the wind: tack
        if (!window.__tack) window.__tack = wrap(S.h - UP) > 0 ? 1 : -1;
        want = UP + window.__tack * 0.95;
        if (window.__tack * wrap(brg - UP) < -0.3) window.__tack *= -1;   // past the lay line: go about
      } else window.__tack = 0;
      const d = wrap(want - S.h);
      keys.delete('ArrowLeft'); keys.delete('ArrowRight'); keys.add('ArrowUp');
      if (d > 0.04) keys.add('ArrowLeft'); else if (d < -0.04) keys.add('ArrowRight');
    }, 50);
  }, id);
  const t0 = Date.now();
  const ok = await until(() => p.evaluate((id) => { const V = window.__ted.level.__V, i = V.isles.find((q) => q.id === id), c = window.__ted.interact.current;
    return /ashore/.test(c?.prompt ?? '') && Math.hypot(V.S.x - i.moor.x, V.S.z - i.moor.z) < 12; }, id), max);
  await p.evaluate(() => { clearInterval(window.__autoI); const k = window.__ted.player.keys; ['ArrowLeft', 'ArrowRight', 'ArrowUp'].forEach((c) => k.delete(c)); });
  console.log(`  sailed to ${id}: ${ok ? 'arrived' : 'gave up'} in ${((Date.now() - t0) / 1000).toFixed(0)}s, ${await VS('flips')} sail flips`);
  return ok;
};

try {
  // board the repaired ship (skip the repairs: straight to the choice)
  await p.evaluate(() => { window.__ted.level.__S.phase = 'choose'; const P = window.__ted.player; P.target = P.pos.clone().set(17, 0, -1.1); });
  await sleep(3); await use('Board the repaired');
  const offered = await until(() => p.evaluate(() => document.getElementById('toast').classList.contains('on') && /sail forth/.test(document.getElementById('toast').textContent)), 40);
  check(offered, 'the "sail forth" toast appears');
  await shot('offer');
  if (plain) {
    const over = await until(() => p.evaluate(() => !document.getElementById('over').hidden), 20);
    check(over, 'without S, the end card appears: ' + (await p.evaluate(() => document.querySelector('#over h1').textContent)));
    await shot('card');
  } else {
    await p.keyboard.press('KeyS'); await sleep(0.5);
    check((await p.evaluate(() => window.__ted.level.__S.phase)) === 'voyage', 'S starts the voyage');
    check(await p.evaluate(() => JSON.parse(localStorage.getItem('ted.done') || '[]').includes('ship-of-theseus')), 'the vignette is marked complete');
    await sleep(4); await shot('sailing');
    await sleep(6); check((await p.evaluate(() => document.getElementById('over').hidden)), 'no end card');
    // speed depends on the angle to the wind; turn up into it and through it (a tack): the sail swings across
    const v0 = await VS('v'), side0 = await VS('side'), flips0 = await VS('flips');
    await p.keyboard.down('ArrowRight'); await sleep(1.6);
    await shot('head-to-wind'); console.log('  angle off the wind', (await VS('a')).toFixed(0), 'speed', (await VS('v')).toFixed(2), '(was', v0.toFixed(2) + ')');
    await sleep(2.6); await p.keyboard.up('ArrowRight'); await sleep(3);
    check((await VS('flips')) > flips0 && (await VS('side')) !== side0, 'tacking flips the sail to the other side');
    await shot('other-tack');
    // to the lighthouse
    check(await sailTo('lighthouse', 90), 'sailed to the lighthouse');
    await p.keyboard.press('KeyE'); await sleep(2.5);
    check((await VS('mode')) === 'land', 'landed at the lighthouse');
    await shot('lighthouse');
    await p.evaluate(() => { const V = window.__ted.level.__V, P = window.__ted.player; P.target = V.K.p.clone().setY(0).lerp(P.pos, 0.3); });
    check(await until(async () => (await VS('fight')) === 'on', 25), 'the watcher talks, then fights');
    await shot('fight-start');
    // fight: step aside when he crouches, strike while he's dizzy
    await p.evaluate(() => {
      const V = window.__ted.level.__V, P = window.__ted.player;
      window.__fightI = setInterval(() => {
        const S = V.S, K = V.K; if (S.fight !== 'on') return;
        const d = K.p.clone().sub(P.pos).setY(0), dist = d.length();
        if (S.k === 'windup' && !window.__dodge) {
          const perp = { x: -K.dir.z, z: K.dir.x };
          for (const s of [1, -1]) { const x = P.pos.x + perp.x * s * 3, z = P.pos.z + perp.z * s * 3; if (V.walkable(x, z)) { P.target = P.pos.clone().set(x, 0, z); break; } }
          window.__dodge = true;
        } else if (S.k === 'dizzy' || S.k === 'hurt') {
          window.__dodge = false;
          if (S.k === 'dizzy') { if (dist > 2.2) P.target = K.p.clone().setY(0).addScaledVector(d.normalize(), -1.8); else { P.target = null; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); } }
        } else if (S.k === 'approach') window.__dodge = false;
      }, 60);
    });
    let shotFight = false;
    const won = await until(async () => { if (!shotFight && (await VS('k')) === 'windup') { shotFight = true; await shot('fight-lunge'); } if ((await VS('khp')) === 1 && shotFight !== 2) { shotFight = 2; await shot('fight-dizzy'); } return (await VS('fight')) === 'won'; }, 90);
    await p.evaluate(() => clearInterval(window.__fightI));
    check(won, `won the fight (your hearts: ${await VS('hp')})`);
    await sleep(3); await shot('won');
    await use('Go down into the cellar'); await sleep(2);
    check((await VS('mode')) === 'cellar', 'down in the cellar'); await shot('cellar');
    await use('Take the chest'); await sleep(0.6); check((await VS('chest')) === 'hand', 'took the chest'); await shot('chest');
    await use('Climb back up'); await sleep(2);
    await use('Board the ship', 15); await sleep(1);
    check((await VS('chest')) === 'ship' && (await VS('mode')) === 'sail', 'the chest is on deck');
    await shot('chest-on-deck');
    // North Sentinel: warned off; leave the sweets; go
    await p.evaluate(() => window.__ted.level.__V.teleport('sentinel')); await sleep(2.5);
    await shot('sentinel-approach');
    await p.keyboard.press('KeyE'); await sleep(2.5); await shot('sentinel-beach');
    await use('Leave a bag of sweets'); await sleep(1.5); await shot('sentinel-sweets');
    check(await until(async () => (await VS('mode')) === 'sail', 12), 'you leave North Sentinel after the sweets');
    // the frogs, and the palm island
    await p.evaluate(() => window.__ted.level.__V.teleport('frogs')); await sleep(2.5); await p.keyboard.press('KeyE'); await sleep(2.5);
    await p.evaluate(() => { const V = window.__ted.level.__V, P = window.__ted.player, i = V.isles.find((q) => q.id === 'frogs'); P.target = i.c.clone().lerp(i.land, 0.45); }); await sleep(3);
    await shot('frogs'); await use('Board the ship', 12);
    await p.evaluate(() => window.__ted.level.__V.teleport('palm')); await sleep(2.5); await p.keyboard.press('KeyE'); await sleep(2.5);
    await use('Read the note'); await sleep(0.5); await shot('palm-bottle'); await use('Board the ship', 12);
    // back to the harbour you set out from: tie up, walk the dock, talk to the fisherman, board again
    await p.evaluate(() => window.__ted.level.__V.teleport('harbour')); await sleep(2.5); await shot('harbour-approach');
    await p.keyboard.press('KeyE'); await sleep(2.5);
    check((await VS('mode')) === 'land' && (await VS('at')) === 'harbour', 'tied up at the harbour');
    await p.evaluate(() => { const P = window.__ted.player; P.target = P.pos.clone().set(23.2, 0, 0.6); }); await sleep(4);
    await use('Talk', 4); await sleep(1); await shot('harbour-fisherman');
    await use('Board the ship', 15); await sleep(1); check((await VS('mode')) === 'sail', 'boarded again at the harbour');
    // island names: only the ones you've landed on (the house's isn't known yet)
    const names = await p.evaluate(() => [...document.querySelectorAll('.label')].map((l) => l.textContent));
    check(!names.includes('The house') && names.includes('?'), 'unvisited islands are labelled "?"');
    // home: upwind, so tack all the way
    const home = await sailTo('house', 240);                            // (from the harbour: a long beat upwind)
    check(home, 'tacked upwind to the house island');
    if (!home) { await p.evaluate(() => window.__ted.level.__V.teleport('house')); await sleep(2.5); }
    await shot('house-from-sea');
    await p.keyboard.press('KeyE'); await sleep(2.5); await shot('house-island');
    check(await p.evaluate(() => window.__ted.level.__V.S.visited.includes('house')), 'the house island is named once you land');
    await use('Go in at the front door', 12); await sleep(2.5); await shot('house-door');
    const card = await until(() => p.evaluate(() => !document.getElementById('over').hidden), 15);
    check(card, 'going in at the front door ends on the card: ' + (await p.evaluate(() => document.querySelector('#over h1').textContent)));
    check(await p.evaluate(() => JSON.parse(localStorage.getItem('ted.items') || '[]').includes('chest-of-gold')), 'the chest is saved for the museum');
    await shot('home-card');
    await p.click('#over [data-act="home"]');
    await until(async () => (await lvl()) === 'house', 10); await sleep(2);
    check((await lvl()) === 'house', '"Back to the first room" from the card');
    await shot('home');
    await sleep(1); await use('Go into the museum', 12);
    await until(async () => (await lvl()) === 'museum', 10); await sleep(2.5);
    check((await p.evaluate(() => window.__ted.level.__S.items)) === 1, 'the museum shows the chest');
    await p.evaluate(() => { const P = window.__ted.player; P.target = P.pos.clone().set(-5.6, 0, 0); }); await sleep(3.5);
    await shot('museum');
    await use('Back to the first room', 12); await until(async () => (await lvl()) === 'house', 10); await sleep(1.5);
    check((await lvl()) === 'house', 'back from the museum to the first room');
  }
} catch (e) { errs.push('TEST ' + e.message); }
console.log(errs.join('\n') || 'no errors');
await b.close();
