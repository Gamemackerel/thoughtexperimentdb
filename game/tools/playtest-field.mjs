// Automated playtest of the field (after Van Gogh) and its nine vignettes (needs `npm run play`):
//   node game/tools/playtest-field.mjs [only-id] [alt]
// Plays one path through each to its ending (alt: another path). Screenshots to build/playtest-field-*.png.
import puppeteer from 'puppeteer';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const [only, alt] = process.argv.slice(2);

async function run(id, script) {
  if (only && only !== id) return;
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto(`http://localhost:5173/game/?level=${id}`); await sleep(1.5); await p.click('#begin'); await sleep(2);
  let n = 0;
  const t = {
    p, shot: (name) => p.screenshot({ path: `build/playtest-field-${id}-${String(++n).padStart(2, '0')}-${name}.png` }),
    walkTo: (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, P.pos.y, z); }, x, z),
    S: (k) => p.evaluate((k) => window.__ted.level.__S?.[k], k),
    until: async (fn, max = 60) => { for (let i = 0; i < max * 4; i++) { if (await fn()) return true; await sleep(0.25); } return false; },
    // walk to an interactable by its prompt text, then use it
    use: async (re, wait = 5, nth = 0) => {
      const ok = await p.evaluate((re, nth) => {
        const { interact, player } = window.__ted, r = new RegExp(re);
        const it = interact.items.filter((i) => i.enabled() && r.test(typeof i.prompt === 'function' ? i.prompt() : i.prompt))[nth]; if (!it) return false;
        const q = typeof it.pos === 'function' ? it.pos() : it.pos; player.target = q.clone().setY(player.pos.y); window.__want = it; return true;
      }, re, nth);
      if (!ok) throw new Error('no prompt ' + re);
      for (let i = 0; i < wait * 4; i++) { if (await p.evaluate(() => window.__ted.interact.current === window.__want)) break; await sleep(0.25); }
      await p.keyboard.press('KeyE'); await sleep(0.4);
    },
    over: () => p.evaluate(() => !document.getElementById('over').hidden),
  };
  try { await script(t); } catch (e) { errs.push('TEST ' + e.message); }
  const ended = await t.until(t.over, 60);
  await t.shot('end');
  console.log(id.padEnd(20), ended ? 'ENDED    ' : 'no ending', (await p.evaluate(() => document.querySelector('#over h1').textContent)).padEnd(36), errs.join(' | ') || 'no errors');
  await p.close();
}

await run('field', async (t) => { await sleep(2); await t.shot('arrive'); await t.walkTo(-6, 2); await sleep(5); await t.shot('west'); await t.walkTo(8, -6); await sleep(6); await t.shot('east'); });
await run('marys-room', async (t) => {
  await sleep(3); await t.shot('room'); await t.use('Read the books'); await sleep(6); await t.use('Watch the monitor'); await sleep(5); await t.shot('books');
  await t.until(async () => await t.S('asked'), 60); await sleep(1); await t.shot('unlocked');
  if (alt === 'stay') { await t.use('Sit back down'); return; }
  await t.walkTo(8.5, 0.2); await sleep(5); await t.shot('outside'); await sleep(3); await t.use('Look at the banana'); await sleep(4); await t.shot('garden'); await t.use('Look at the tomatoes', 10);
});
await run('omelas', async (t) => {
  await sleep(4); await t.shot('festival'); await t.use('Listen to the flute'); await sleep(3); await t.use('Open the cellar door', 15); await sleep(3); await t.shot('cellar');
  await t.until(async () => await t.S('seen'), 40); await sleep(1); await t.shot('child');
  if (alt === 'free') { await t.use('Take the child'); await sleep(6); await t.shot('drained'); return; }
  await t.use('Go back up'); await sleep(4); await t.shot('after');
  if (alt === 'dance') { await t.use('Join the dancing'); return; }
  await t.walkTo(0, -12); await sleep(6); await t.walkTo(0, -19); await sleep(5); await t.shot('gate');
});
await b.close();
