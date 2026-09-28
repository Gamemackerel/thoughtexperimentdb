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
  const S = (k) => t.p.evaluate((k) => window.__ted.level.__S[k], k);
  await t.shot('arrive'); await t.at(-14.1, 7.3, 4); await t.shot('pistol');         // take the pistol from the crate
  await t.at(-5, -2, 5); await sleep(1); await t.shot('locked');                          // close and lock the gate before he gets there
  for (let i = 0; i < 80; i++) { if (await S('seg') >= 2) break; await sleep(0.5); }
  await t.key('KeyE'); await sleep(2); await t.shot('fired');                              // fire (it jams)
  for (let i = 0; i < 60; i++) { if (await S('fall') > 0.3) break; await sleep(0.5); }
  await sleep(1); await t.shot('fence-down');                                              // the rotten fence gives way
  await t.at(3, 0.4, 5); await t.shot('sign');                                            // turn the signpost
  // stand in his way, further on, and keep still
  for (let i = 0; i < 80; i++) { if (await S('seg') >= 5) break; await sleep(0.5); }
  await t.walkTo(9, 1.1); for (let i = 0; i < 40; i++) { if (await S('detour')) break; await sleep(0.25); }
  await sleep(1.2); await t.shot('around');
  await t.waitOver(60); await t.shot('end');
});
await run('infinite-monkey', async (t) => {
  await sleep(6); await t.shot('arrive'); await t.at(0, 7.4); await sleep(1); await t.shot('page0'); await t.key('KeyE');
  for (let i = 0; i < 3; i++) { await t.at(6, 7.2); await sleep(4); await t.at(0, 7.4); await sleep(1.5); await t.shot('page' + (i + 1)); if (i < 2) await t.key('KeyE'); }
  await t.waitOver(20); await t.shot('end');
});
await run('simulation-argument', async (t) => {
  await t.shot('arrive'); await t.at(0.6, -1.6); await sleep(6); await t.shot('zoom');
  await sleep(4); await t.at(-1.4, -1.8); await sleep(5); await t.shot('shelves'); await sleep(4); await t.shot('reveal');
  await sleep(6); await t.at(1.4, -1.8); await sleep(9); await t.shot('off'); await sleep(8); await t.shot('giant'); await t.waitOver(40); await t.shot('end');
});
await run('fermi-paradox', async (t) => {
  const open = async () => { for (let i = 0; i < 120; i++) { if (await t.p.evaluate(() => window.__ted.level.__S.open)) return; await sleep(0.5); } };
  await sleep(2); await t.shot('arrive'); await t.at(-5.6, 1.7); await sleep(3); await t.shot('logbook');
  await t.at(-3.5, 1.7); await open(); await sleep(2); await t.shot('listened');
  if (process.env.FERMI === 'listen') { await t.at(0.8, 4.3); await sleep(6); await t.shot('lapse'); await sleep(8); await t.shot('years'); }
  else { await t.at(6.6, 1.3); await sleep(2); await t.shot('send'); await sleep(3); await t.shot('beam'); await sleep(6); await t.shot('lapse'); }
  await t.waitOver(40); await t.shot('end');
});
await run('tragedy-of-the-commons', async (t) => {
  // COMMONS= (agree: let sheep out, try the bell early, ring it after the hint) | idle (held back) | back (bring one in,
  // then nothing: took back) | greedy (let three out, then nothing: the grass is gone)
  const S = () => t.p.evaluate(() => { const s = window.__ted.level.__S; return { grass: s.grass, phase: s.phase, bellOpen: s.bellOpen, adds: s.adds, tookBack: s.tookBack }; });
  const prompt = () => t.p.evaluate(() => document.getElementById('prompt').textContent);
  const mode = process.env.COMMONS ?? 'agree';
  await sleep(4); await t.shot('arrive');
  await t.walkTo(2.2, 14.4); await sleep(2.5); console.log('  at pen gate:', await prompt()); await t.shot('pen-gate');
  await t.walkTo(2.8, 11.5); await sleep(2.5); console.log('  at common gate:', await prompt()); await t.shot('common-gate');
  if (mode === 'idle') { await sleep(30); await t.shot('neighbour'); await sleep(40); await t.shot('thin'); await t.waitOver(120); await t.shot('end'); console.log('  ', await S()); return; }
  if (mode === 'back') { await t.press(); await sleep(3); await t.shot('brought-in'); await sleep(4); await t.shot('in-pen'); await t.waitOver(150); await t.shot('end'); console.log('  ', await S()); return; }
  for (let i = 0; i < (mode === 'greedy' ? 3 : 1); i++) { await t.at(2.2, 14.4, 2); await sleep(2); }
  await sleep(1); await t.shot('let-out');
  if (mode === 'greedy') { await t.walkTo(0, 15.5); await t.waitOver(150); await t.shot('end'); console.log('  ', await S()); return; }
  await t.walkTo(-3.6, 14.8); await sleep(3); console.log('  bell before hint:', await prompt()); await t.press(); await sleep(2); console.log('  ', await S());
  for (let i = 0; i < 300; i++) { if ((await S()).bellOpen) break; await sleep(0.5); }
  console.log('  bell after hint:', await prompt(), await S());
  await t.shot('thin'); await t.press(); await sleep(7); await t.shot('meeting'); await sleep(7); await t.shot('agreed'); await t.waitOver(40); await t.shot('end');
});
await b.close();
