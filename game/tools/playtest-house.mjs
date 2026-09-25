// Automated playtest (needs `npm run play` running): node game/tools/playtest-house.mjs
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5173/game/'); await new Promise((r) => setTimeout(r, 1500)); await p.click('#begin');
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const walkTo = (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z);
const press = async () => { for (let i = 0; i < 40; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); };
const lvl = () => p.evaluate(() => window.__ted.level?.name);
for (const [x, z, name] of [[-3.4, 2.4, 'book'], [-6.6, 3.4, 'cave door'], [4.5, 3.8, 'sky door']]) {
  await sleep(2.5); await walkTo(x, z); await sleep(3); await press(); await sleep(3.5);
  console.log(name, '→', await lvl());
  await p.screenshot({ path: `build/playtest-house-${name.replace(' ', '')}.png` });
  await p.evaluate(() => window.__ted.ctx.goto('house')); await sleep(2);
  console.log('  back in', await lvl(), 'at', await p.evaluate(() => window.__ted.player.pos.toArray().map((v) => v.toFixed(1)).join(',')));
}
await p.screenshot({ path: 'build/playtest-house-final.png' });
console.log(errs.join('\n') || 'no errors');
await b.close();
