// Automated playtest (needs `npm run play` running): node game/tools/playtest-ship-of-theseus.mjs
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5173/game/?level=ship-of-theseus'); await new Promise((r) => setTimeout(r, 1500)); await p.click('#begin');
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const shot = (n) => { console.log('step', n); return p.screenshot({ path: `build/playtest-ship-${n}.png` }); };
const walkTo = (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z);
const press = async () => { for (let i = 0; i < 40; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); };
await sleep(3); await shot('01-arrive');
for (let k = 0; k < 6; k++) {
  await walkTo(7.6, 0.1); await sleep(k === 0 ? 4 : 2.5); await press(); await sleep(0.4);
  if (k === 0) await shot('02-carry');
  await walkTo(16, -0.6); await sleep(2.5); await press(); await sleep(2.2);
  if (k === 0 || k === 2) await shot(`03-swap${k + 1}`);
}
await sleep(6); await shot('04-rebuild'); await sleep(8); await shot('05-choose');
if (process.argv[2] === 'old') { await walkTo(16, 0.8); } else { await walkTo(16, -0.6); }
await sleep(2); await press(); await sleep(4); await shot('06-sail'); await sleep(6); await shot('07-over');
console.log(errs.join('\n') || 'no errors', await p.evaluate(() => JSON.stringify({ ph: window.__ted.level.__S.phase, swaps: window.__ted.level.__S.swaps })));
await b.close();
