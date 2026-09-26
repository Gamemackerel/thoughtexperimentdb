// Automated playtest of the hall and its five vignettes (needs `npm run play` running): node game/tools/playtest-hall.mjs [only-id]
// For each vignette: load it, act out one path to an ending, screenshot along the way (build/playtest-hall-*.png).
import puppeteer from 'puppeteer';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const only = process.argv[2];

async function run(id, script) {
  if (only && only !== id) return;
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto(`http://localhost:5173/game/?level=${id}`); await sleep(1.5); await p.click('#begin'); await sleep(2);
  let n = 0;
  const t = {
    p,
    shot: (name) => p.screenshot({ path: `build/playtest-hall-${id}-${String(++n).padStart(2, '0')}-${name}.png` }),
    walkTo: (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z),
    press: async () => { for (let i = 0; i < 60; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); },
    at: async (x, z, wait = 3) => { await t.walkTo(x, z); await sleep(wait); await t.press(); },
    over: () => p.evaluate(() => !document.getElementById('over').hidden),
    waitOver: async (max = 60) => { for (let i = 0; i < max * 4; i++) { if (await t.over()) return true; await sleep(0.25); } return false; },
    key: (k) => p.keyboard.press(k),
  };
  try { await script(t); } catch (e) { errs.push('TEST ' + e.message); }
  console.log(id.padEnd(24), (await t.over()) ? 'ENDED    ' : 'no ending', errs.join(' | ') || 'no errors');
  await p.close();
}

await run('hall', async (t) => { await sleep(2); await t.shot('hall'); await t.walkTo(0, 0); await sleep(3); await t.shot('middle'); await t.walkTo(10, 0); await sleep(4); await t.shot('east'); });
await run('grandfather-paradox', async (t) => {
  await t.shot('arrive'); await t.at(-14.1, 7.3, 4); await t.shot('pistol');   // take the pistol from the crate
  await t.at(-5, -2, 5); await t.shot('gate');                                     // close the gate before he gets there
  for (let i = 0; i < 80; i++) { if (await t.p.evaluate(() => window.__ted.level.__S.seg >= 2)) break; await sleep(0.5); }
  await t.key('KeyE'); await sleep(2); await t.shot('fired');                      // fire (it jams)
  await t.at(3, 0.4, 5); await t.shot('sign');                                     // turn the signpost
  for (let i = 0; i < 200; i++) { if (await t.p.evaluate(() => window.__ted.level.__S.walk >= 2)) break; await sleep(0.5); }
  await t.shot('again'); await t.at(-14.8, 9.2, 6);                                // then go home
  await t.waitOver(40); await t.shot('end');
});
await run('infinite-monkey', async (t) => {
  await sleep(6); await t.shot('arrive'); await t.at(0, 7.4); await sleep(1); await t.shot('page0'); await t.key('KeyE');
  for (let i = 0; i < 3; i++) { await t.at(6, 7.2); await sleep(4); await t.at(0, 7.4); await sleep(1.5); await t.shot('page' + (i + 1)); if (i < 2) await t.key('KeyE'); }
  await t.waitOver(20); await t.shot('end');
});
await run('simulation-argument', async (t) => {
  await t.shot('arrive'); await t.at(0.6, -1.6); await sleep(6); await t.shot('zoom');
  await sleep(4); await t.at(-1.4, -1.8); await sleep(5); await t.shot('shelves'); await sleep(4); await t.shot('reveal');
  await sleep(4); await t.at(1.4, -1.8); await sleep(3); await t.shot('off'); await t.waitOver(20); await t.shot('end');
});
await run('fermi-paradox', async (t) => {
  await sleep(2); await t.shot('arrive'); await t.at(-3.5, 1.7); await sleep(12); await t.shot('listened');
  await t.at(8.5, 1.7); await sleep(3); await t.shot('send'); await t.waitOver(20); await t.shot('end');
});
await run('tragedy-of-the-commons', async (t) => {
  await sleep(4); await t.shot('arrive');
  for (let i = 0; i < 3; i++) { await t.at(3.4, 12.4, 2); await sleep(3.5); }
  await t.shot('crowded'); await sleep(15); await t.shot('thin'); await t.waitOver(80); await t.shot('end');
});
await b.close();
