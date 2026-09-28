// Automated playtest of the trolley room and its three variants (needs `npm run play`):
//   node game/tools/playtest-variants.mjs [only-id] [alt]
// Plays one path through each to its ending (alt: the other path), screenshots to build/playtest-var-*.png.
import puppeteer from 'puppeteer';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const [only, alt] = process.argv.slice(2);

async function run(id, script, query = '') {
  if (only && only !== id) return;
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto(`http://localhost:5173/game/?level=${id}${query}`); await sleep(1.5); await p.click('#begin'); await sleep(2);
  let n = 0;
  const t = {
    p, shot: (name) => p.screenshot({ path: `build/playtest-var-${id}-${String(++n).padStart(2, '0')}-${name}.png` }),
    walkTo: (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, P.pos.y, z); }, x, z),
    phase: () => p.evaluate(() => window.__ted.level.__S?.phase),
    until: async (fn, max = 60) => { for (let i = 0; i < max * 4; i++) { if (await fn()) return true; await sleep(0.25); } return false; },
    press: async () => { for (let i = 0; i < 60; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); },
    over: () => p.evaluate(() => !document.getElementById('over').hidden),
  };
  try { await script(t); } catch (e) { errs.push('TEST ' + e.message); }
  const ended = await t.until(t.over, 90);
  await t.shot('end');
  console.log(id.padEnd(16), ended ? 'ENDED    ' : 'no ending', (await p.evaluate(() => document.querySelector('#over h1').textContent)).padEnd(34), errs.join(' | ') || 'no errors');
  await p.close();
}

await run('trolley-room', async (t) => { await sleep(2); await t.shot('room'); await t.walkTo(-2.3, -4.2); await sleep(3); await t.shot('at-footbridge'); await t.press(); await sleep(4); await t.shot('entered'); });
await run('footbridge', async (t) => {
  await t.until(async () => (await t.phase()) === 'slow', 30); await sleep(1); await t.shot('slow');
  // default: push him (the struggle, the fall over the rail, the trolley stopping against him) | alt: don't push
  if (!alt) {
    await t.walkTo(2.3, -0.4); await sleep(1.5); await t.shot('behind-him'); await t.press();
    for (const k of ['shove1', 'resist', 'shove2', 'shove3', 'tip', 'falling', 'landed']) { await sleep(k === 'falling' ? 0.3 : 0.45); await t.shot(k); }
  }
  await t.until(async () => (await t.phase()) === 'go', 60); await sleep(1.2); await t.shot('run'); await sleep(1.2); await t.shot('run2');
  await t.until(async () => (await t.phase()) === 'over', 30); await sleep(0.5); await t.shot('stopped');
}, '&fast=3');
await run('loop-track', async (t) => {
  // default: pull the lever (into him) | alt: leave it (into the five). First, a ghost down each track.
  await t.until(() => t.p.evaluate(() => window.__ted.level.__S.ghostRoute === 'main'), 40); await sleep(1.2); await t.shot('ghost-main');
  await t.until(() => t.p.evaluate(() => window.__ted.level.__S.ghostRoute === 'loop'), 30); await sleep(1.5); await t.shot('ghost-loop');
  await t.until(async () => (await t.phase()) === 'slow', 30); await sleep(1); await t.shot('slow');
  if (!alt) { await t.walkTo(-7.2, 3.9); await sleep(1.8); await t.press(); await sleep(0.5); await t.shot('pulled'); }
  await t.until(async () => (await t.phase()) === 'go', 60); await sleep(1.5); await t.shot('run'); await sleep(1.2); await t.shot('run2');
  await t.until(async () => (await t.phase()) === 'over', 30); await sleep(0.5); await t.shot('stopped');
}, '&fast=3');
await run('transplant', async (t) => {
  // alt: home (send him home) | pall (palliative care) | wake (into theatre, then stand there) | default: into theatre and begin
  await sleep(3); await t.shot('ward'); await t.walkTo(9, -1.2); await sleep(12); await t.shot('visitor'); await t.until(() => t.p.evaluate(() => window.__ted.ctx.voice.said.has('ask')), 30); await sleep(3);
  if (alt === 'pall') { await t.walkTo(6.3, -4); await sleep(4); await t.press(); await sleep(9); await t.shot('wheeled'); return; }
  await t.walkTo(alt === 'home' ? 10.4 : -11.3, alt === 'home' ? -2.6 : 0.1); await sleep(alt === 'home' ? 2.5 : 6); await t.press(); await sleep(6); await t.shot('choice');
  if (alt === 'home') return;
  await t.until(() => t.p.evaluate(() => window.__ted.level.__S.ready), 40); await sleep(1); await t.shot('theatre');
  if (alt === 'wake') { await sleep(34); await t.shot('asks'); return; }
  await t.walkTo(70.5, 0.9); await sleep(2); await t.press(); await sleep(5); await t.shot('after');
});
await b.close();
