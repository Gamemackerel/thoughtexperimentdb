// Smoke test (needs `npm run play`): load every room and vignette, let it run a few seconds, report page errors and
// failed requests. node game/tools/smoke.mjs
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const levels = [...fs.readFileSync(new URL('../main.js', import.meta.url), 'utf8').matchAll(/^\s+'?([a-z-]+)'?: \(\) => import\(/gm)].map((m) => m[1]);
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
let bad = 0;
for (const id of levels) {
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  await p.goto(`http://localhost:5173/game/?level=${id}`); await sleep(1); await p.click('#begin'); await sleep(4);
  const name = await p.evaluate(() => window.__ted?.level?.name);
  if (name !== id) errs.push(`loaded ${name}`);
  if (errs.length) bad++;
  console.log(id.padEnd(24), errs.join(' | ') || 'ok');
  await p.close();
}
await b.close();
console.log(bad ? `${bad} level(s) with problems` : `all ${levels.length} levels load cleanly`);
process.exit(bad ? 1 : 0);
