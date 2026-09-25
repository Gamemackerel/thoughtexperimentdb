// Automated playtest of the trolley vignette (needs `npm run play` running). Usage: node game/tools/playtest-trolley.mjs [self|stay]
// Automated playthrough: run 1 pull, run 2 stay, run 3 either self (arg "self") or stay → game over. Screenshots along the way.
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5173/game/?level=trolley-problem&fast=1.1'); await new Promise((r) => setTimeout(r, 1500)); await p.click('#begin');
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const shot = (n) => p.screenshot({ path: `build/playtest-${n}.png` });
const phase = () => p.evaluate(() => window.__ted.level && window.__ted.level.__S?.phase);
const walkTo = async (x, z) => p.evaluate((x, z) => { window.__ted.player.target = new window.__ted.player.pos.constructor(x, 0, z); }, x, z);
const waitPhase = async (ph, max = 60) => { for (let i = 0; i < max * 4; i++) { if ((await phase()) === ph) return true; await sleep(0.25); } return false; };
await sleep(2); await shot('01-arrive');
await walkTo(-7.2, 4.2); await waitPhase('slow'); await sleep(3); await shot('02-at-lever');
await p.keyboard.press('KeyE'); await sleep(0.5); await shot('03-pulled');
await waitPhase('go'); await sleep(1.6); await shot('04-go');
await waitPhase('aftermath'); await sleep(0.8); await shot('05-aftermath');
await waitPhase('rewind'); await sleep(1.0); await shot('06-rewind');
await waitPhase('twist'); await sleep(3); await shot('07-twist');
await waitPhase('slow'); await sleep(0.5); await shot('08-slow2');
if (process.argv[2] === 'self') {
  await walkTo(18, 10.6); await sleep(6); await shot('09-selflever');
  await p.keyboard.press('KeyE'); await sleep(2); await shot('10-onTrack');
  await waitPhase('go'); await sleep(1.8); await shot('11-go-self');
  await sleep(9); await shot('12-over');
} else {
  await waitPhase('go'); await waitPhase('slow'); await sleep(0.5); await shot('09-slow3');
  await waitPhase('go'); await waitPhase('over', 90); await sleep(3); await shot('10-end');
}
console.log(errs.slice(0, 10).join('\n') || 'no errors', '| final phase:', await phase());
await b.close();
