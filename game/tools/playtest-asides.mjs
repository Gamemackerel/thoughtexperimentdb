// Playtest of the frog cameos and the side interactions (needs `npm run play`): node game/tools/playtest-asides.mjs [only-id]
// For each vignette: watch the frog's cameo from nearby (screenshots every second), then try every aside
// (talk / look) and screenshot its bubble or caption. Screenshots: build/asides-<id>-*.png
import puppeteer from 'puppeteer';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const only = process.argv[2];

// where to stand to watch the frog, and how to get the vignette to the moment it appears
const PLAN = {
  'trolley-problem': { wait: 7, watch: [-7.2, 3.8] },
  'brain-in-a-vat': { watch: [3, 5] },
  'ship-of-theseus': { watch: [18, 0.4], start: true },
  'grandfather-paradox': { watch: [-2, 5.5], start: true },
  'infinite-monkey': { watch: [5, 4], start: true },
  'simulation-argument': { watch: [2, 1.2], start: true },
  'fermi-paradox': { watch: [0, 6], start: true },
  'tragedy-of-the-commons': { watch: [-4.5, 16.5], start: true },
  'platos-cave': { cave: true },
};
const ASIDE = /^(Talk|Say hello|Look|Read the)/;

for (const [id, plan] of Object.entries(PLAN)) {
  if (only && only !== id) continue;
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:5173/game/?level=${id}`); await sleep(1.5); await p.click('#begin'); await sleep(2.5);
  const walk = (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z);
  let n = 0; const shot = (name) => p.screenshot({ path: `build/asides-${id}-${String(++n).padStart(2, '0')}-${name}.png` });

  if (plan.cave) {                 // get outside first (the frog lives by the pond)
    await sleep(16); await walk(10.5, 2); await sleep(4); await walk(10, 6); await sleep(2); await walk(14, 6); await sleep(2.5); await walk(17, 6); await sleep(10);
    await walk(300 - 5, -4); await sleep(3);
  } else {
    await sleep(plan.wait ?? 1);
    await walk(...plan.watch); await sleep(3);
    if (plan.start) await p.evaluate(() => window.__ted.level.__frog.start());
  }
  let frames = 0;
  for (let i = 0; i < 26 && frames < 26; i++) {
    const on = await p.evaluate(() => window.__ted.level.__frog.active);
    if (on) { await shot('frog'); frames++; } else if (frames) break;
    await sleep(0.9);
  }
  const frogDone = await p.evaluate(() => window.__ted.level.__frog.done);

  // every aside: stand next to it, use it, and screenshot what happens
  const asides = await p.evaluate((re) => window.__ted.interact.items.map((it, i) => {
    const pr = typeof it.prompt === 'function' ? it.prompt() : it.prompt;
    return new RegExp(re).test(pr) ? i : -1;
  }).filter((i) => i >= 0), ASIDE.source);
  const used = [];
  for (const i of asides.slice(0, 6)) {
    const info = await p.evaluate((i) => {
      const { interact, player } = window.__ted, it = interact.items[i];
      const q = (typeof it.pos === 'function' ? it.pos() : it.pos).clone();
      const d = player.pos.clone().sub(q).setY(0); if (d.length() < 0.01) d.set(0, 0, 1);
      const at = q.clone().add(d.normalize().multiplyScalar(Math.min(1.2, it.radius * 0.6)));
      player.place(at.x, at.z, Math.atan2(q.x - at.x, q.z - at.z));
      return { prompt: typeof it.prompt === 'function' ? it.prompt() : it.prompt };
    }, i);
    let ok = false;
    for (let k = 0; k < 24; k++) {
      ok = await p.evaluate((i) => window.__ted.interact.current === window.__ted.interact.items[i], i);
      if (ok) break; await sleep(0.25);
    }
    if (ok) { await p.keyboard.press('KeyE'); await sleep(1.2); await shot(info.prompt.replace(/\W+/g, '-').toLowerCase()); }
    used.push(`${info.prompt}${ok ? '' : ' (NOT REACHABLE)'}`);
    await sleep(ok && /Look|Read/.test(info.prompt) ? 5 : 0.5);
  }
  console.log(`${id.padEnd(24)} frog: ${frames} frames${frogDone ? ', finished' : ', NOT FINISHED'} | asides: ${used.join(', ') || 'none'} | ${errs.join(' | ') || 'no errors'}`);
  await p.close();
}
await b.close();
