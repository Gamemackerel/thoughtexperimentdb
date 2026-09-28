// Automated playtest of the trolley vignette (needs `npm run play` running). Usage: node game/tools/playtest-trolley.mjs [self|stay|back|stood]
// Automated playthrough: run 1 pull (arg "back": pull, then put it back at once; arg "stood": don't pull, stand on the
// main line with the five → that ending), then the rewind and the third track, run 2 either self (arg "self") or stay →
// game over, with no rewind and no third run. Screenshots along the way; prints the captions heard.
import puppeteer from 'puppeteer';
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:5173/game/?level=trolley-problem&fast=1.1'); await new Promise((r) => setTimeout(r, 1500)); await p.click('#begin');
await p.evaluate(() => { window.__caps = []; const c = document.getElementById('caption'); new MutationObserver(() => { const t = c.textContent.trim(); if (t && window.__caps.at(-1) !== t) window.__caps.push(t); }).observe(c, { childList: true, subtree: true, characterData: true }); });
const mode = process.argv[2];
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const shot = (n) => p.screenshot({ path: `build/playtest-${n}.png` });
const phase = () => p.evaluate(() => window.__ted.level && window.__ted.level.__S?.phase);
const walkTo = async (x, z) => p.evaluate((x, z) => { window.__ted.player.target = new window.__ted.player.pos.constructor(x, 0, z); }, x, z);
const waitPhase = async (ph, max = 60) => { for (let i = 0; i < max * 4; i++) { if ((await phase()) === ph) return true; await sleep(0.25); } return false; };
await sleep(2); await shot('01-arrive');
if (mode === 'stood') {
  await waitPhase('slow'); await walkTo(7.5, 0.2); await sleep(8); await shot('02-stood');
  await p.waitForFunction(() => !document.getElementById('over').hidden, { timeout: 90000 }).catch(() => {}); await sleep(1); await shot('03-over');
  console.log(errs.slice(0, 10).join('\n') || 'no errors', '| captions:', JSON.stringify(await p.evaluate(() => window.__caps)), '|', await p.evaluate(() => document.getElementById('over').hidden ? 'no ending' : 'ENDED ' + document.querySelector('#over h1').textContent));
  await b.close(); process.exit(0);
}
await walkTo(-7.2, 4.2); await waitPhase('slow'); await sleep(3); await shot('02-at-lever');
await p.keyboard.press('KeyE'); await sleep(mode === 'back' ? 0.25 : 0.5);
if (mode === 'back') { await p.keyboard.press('KeyE'); await sleep(0.25); }
await shot('03-pulled');
console.log('after pull: route', await p.evaluate(() => window.__ted.level.__S.route), 'speed', (await p.evaluate(() => window.__ted.level.__S.speed)).toFixed(2));
await waitPhase('go'); await sleep(1.6); await shot('04-go');
await waitPhase('aftermath'); await sleep(0.8); await shot('05-aftermath');
await waitPhase('rewind'); await sleep(1.0); await shot('06-rewind');
await waitPhase('twist'); await sleep(3); await shot('07-twist');
await waitPhase('slow'); await sleep(0.5); await shot('08-slow2');
if (mode === 'self') {
  await walkTo(18, 10.6); await sleep(6); await shot('09-selflever');
  await p.keyboard.press('KeyE'); await sleep(2); await shot('10-onTrack');
  await waitPhase('go'); await sleep(1.8); await shot('11-go-self');
  await p.waitForFunction(() => !document.getElementById('over').hidden, { timeout: 60000 }).catch(() => {}); await sleep(1); await shot('12-over');
} else {
  await waitPhase('go'); await sleep(1.6); await shot('09-go2');
  await waitPhase('over', 60); await sleep(1); await shot('10-held');
  await p.waitForFunction(() => !document.getElementById('over').hidden, { timeout: 60000 }); await sleep(1); await shot('11-end');
}
console.log('captions:', JSON.stringify(await p.evaluate(() => window.__caps)));
console.log(errs.slice(0, 10).join('\n') || 'no errors', '| final phase:', await phase(), '| runs:', await p.evaluate(() => window.__ted.level.__S.runs), '|', await p.evaluate(() => document.getElementById('over').hidden ? 'no ending' : 'ENDED ' + document.querySelector('#over h1').textContent));
await b.close();
