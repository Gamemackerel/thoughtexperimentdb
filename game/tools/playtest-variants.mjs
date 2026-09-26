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
  if (!alt) { await t.walkTo(2.25, 0.2); await sleep(2.5); await t.shot('by-him'); await t.press(); }
  await t.until(async () => (await t.phase()) === 'go', 60); await sleep(2.5); await t.shot('run');
  await t.until(async () => (await t.phase()) === 'rewind', 30); await sleep(0.8); await t.shot('rewind');
}, '&fast=3');
await run('loop-track', async (t) => {
  await t.until(async () => (await t.phase()) === 'slow', 30); await sleep(1); await t.shot('slow');
  if (!alt) { await t.walkTo(-7.2, 3.9); await sleep(4); await t.press(); await sleep(1); await t.shot('pulled'); }
  await t.until(async () => (await t.phase()) === 'go', 60); await sleep(3); await t.shot('run');
  if (!alt) { await t.until(async () => (await t.phase()) === 'ghost', 40); await sleep(4); await t.shot('ghost'); }
}, '&fast=3');
await run('transplant', async (t) => {
  // alt: home (send him home) | pall (palliative care) | wake (into theatre, then stand there) | default: into theatre and begin
  await sleep(3); await t.shot('ward'); await t.walkTo(9, -1.2); await sleep(12); await t.shot('visitor'); await t.until(() => t.p.evaluate(() => window.__ted.ctx.voice.said.has('ask')), 30); await sleep(3);
  if (alt === 'pall') { await t.walkTo(6.3, -4); await sleep(4); await t.press(); await sleep(9); await t.shot('wheeled'); return; }
  await t.walkTo(alt === 'home' ? 10.4 : 9.1, alt === 'home' ? -2.6 : -2.9); await sleep(2.5); await t.press(); await sleep(6); await t.shot('choice');
  if (alt === 'home') return;
  await t.until(() => t.p.evaluate(() => window.__ted.level.__S.ready), 40); await sleep(1); await t.shot('theatre');
  if (alt === 'wake') { await sleep(34); await t.shot('asks'); return; }
  await t.walkTo(70.5, 0.9); await sleep(2); await t.press(); await sleep(5); await t.shot('after');
});
await b.close();
