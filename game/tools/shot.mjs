// Quick look at a level (needs `npm run play`): node game/tools/shot.mjs <level> <name> [x z]...
// Screenshots on arrival and after walking to each point: build/shot-<name>-<n>.png. Prints page errors.
import puppeteer from 'puppeteer';
const [level, name, ...xs] = process.argv.slice(2);
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(`http://localhost:5173/game/?level=${level}`); await sleep(1.5); await p.click('#begin'); await sleep(3.5);
await p.screenshot({ path: `build/shot-${name}-0.png` });
for (let i = 0; i < xs.length; i += 2) {
  await p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, +xs[i], +xs[i + 1]); await sleep(4.5);
  await p.screenshot({ path: `build/shot-${name}-${i / 2 + 1}.png` });
}
console.log(errs.join('\n') || 'no errors');
await b.close();
