// Automated playtest (needs `npm run play` running): node game/tools/playtest-platos-cave.mjs
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5173/game/?level=platos-cave'); await new Promise((r) => setTimeout(r, 1500)); await p.click('#begin');
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const shot = (n) => { console.log('step', n); return p.screenshot({ path: `build/playtest-cave-${n}.png` }); };
const walkTo = (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z);
const press = async () => { for (let i = 0; i < 40; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); };
const S = () => p.evaluate(() => window.__ted.level?.__S?.phase + '/' + window.__ted.level?.__S?.where);
await sleep(4); await shot('01-chained');
await sleep(14); await shot('02-loose'); console.log(await S());
await walkTo(10.5, 2); await sleep(4); await walkTo(10, 6); await sleep(2); await shot('03-fire');
await walkTo(14, 6); await sleep(2.5); await shot('04-mouth');
await walkTo(17, 6); await sleep(4); await shot('05-outside'); console.log(await S());
await sleep(6); await walkTo(300 - 5, -6); await sleep(4); await shot('06-pond');
if (process.argv[2] === 'stay') { await walkTo(300 + 5, -1.8); await sleep(4); await press(); await sleep(7); await shot('07-stay'); }
else {
  await walkTo(300 - 7.5, 6); await sleep(5); await press(); await sleep(3); await shot('07-back');
  await walkTo(1, -1.2); await sleep(8); await shot('08-toprisoners'); await press(); await sleep(8); await shot('09-told');
}
console.log(errs.join('\n') || 'no errors', await S());
await b.close();
