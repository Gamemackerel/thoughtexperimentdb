// Automated playtest of the barn (after Grant Wood) and its five Gettier cases (needs `npm run play`):
//   node game/tools/playtest-barn.mjs [only-id] [alt]
// Plays one path through each to its ending (alt: another path). Screenshots to build/playtest-barn-*.png.
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
    p, shot: (name) => p.screenshot({ path: `build/playtest-barn-${id}-${String(++n).padStart(2, '0')}-${name}.png` }),
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

await run('barn', async (t) => { await sleep(2); await t.shot('arrive'); await t.walkTo(-8, -3); await sleep(4); await t.shot('west'); await t.walkTo(8, -3); await sleep(5); await t.shot('east'); });
await run('stopped-clock', async (t) => {
  await sleep(3); await t.shot('square'); await t.use('Read the notice board'); await sleep(4);
  await t.use(alt === 'postman' ? 'Ask the postman' : 'Look up at the clock'); await sleep(5); await t.shot('believed'); await sleep(8); await t.shot('lapse');
});
await run('ten-coins', async (t) => {
  await sleep(3); await t.shot('room'); await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.shot('coins');
  await t.use(alt === 'wait' ? 'wait your turn' : 'two and two'); await t.until(async () => (await t.S('phase')) === 'pockets', 30); await sleep(1); await t.shot('office');
  await t.use('Empty your pockets'); await sleep(5); await t.shot('pockets');
});
await b.close();
