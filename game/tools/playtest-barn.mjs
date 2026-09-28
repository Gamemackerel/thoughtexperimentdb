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
  await t.use('Look up at the clock'); await sleep(5); await t.shot('believed');
  await t.until(async () => (await t.S('phase')) === 'go', 30);
  if (alt !== 'idle') await t.use('Hurry to the station');   // (alt idle: stand there until you set off anyway)
  await sleep(1.2); await t.shot('run');
  await t.until(async () => (await t.S('where')) === 'station', 45); await sleep(1); await t.shot('forecourt'); await sleep(4); await t.shot('station');
  await t.until(async () => (await t.S('cam')) === 'platform', 30); await sleep(0.8); await t.shot('platform'); await sleep(1.2); await t.shot('aboard'); await sleep(3); await t.shot('train');
  await t.until(async () => (await t.S('lapse')) > 0, 30); for (const s of [1.2, 3.5, 4, 5]) { await sleep(s); await t.shot('night'); }
});
await run('ten-coins', async (t) => {
  await sleep(7.5); await t.shot('president'); await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.shot('coins');
  await t.use(alt === 'wait' ? 'wait your turn' : 'two and two');
  if (alt !== 'wait') { await t.until(async () => (await t.S('phase')) === 'bet', 30); if (alt !== 'idle') await t.use('Bet Jones'); await sleep(3); await t.shot('bet'); }   // (alt idle: sit on it until Jones notices)
  await t.until(async () => (await t.S('phase')) === 'pockets', 60); await sleep(1); await t.shot('office');
  await t.use('Empty your pockets'); await sleep(5); await t.shot('pockets'); await sleep(6); await t.shot('settle');
});
await run('sheep-field', async (t) => {
  await sleep(3); await t.shot('lane'); await t.use('Look in through the gate'); await t.until(async () => (await t.S('phase')) === 'shut', 30); await t.shot('believed');
  if (alt !== 'idle') { await t.use('Shut the gate'); await sleep(3.2); await t.shot('shutting'); }   // (alt idle: leave it open until the farmer asks, then you shut it anyway)
  await t.until(async () => (await t.S('phase')) === 'choose', 60); await t.shot('shut');
  await t.use(alt === 'lane' ? 'Walk on' : 'Climb over'); await sleep(6); await t.shot('dog'); await sleep(8); await t.shot('real');
});
await run('fake-barns', async (t) => {
  await sleep(4); await t.shot('road'); await t.use('Look at the tyre'); await sleep(3);
  await t.walkTo(-9, -3); await sleep(4); await t.shot('row-west'); await t.walkTo(9, -3); await sleep(6); await t.shot('row-east'); await t.walkTo(2.8, 4); await sleep(5);   // (from the road, every barn looks the same)
  if (alt === 'idle') await t.until(async () => (await t.S('phase')) !== 'road', 50);   // (alt idle: stand there until you look anyway, then stand in the rain)
  else await t.use('Look at the barn');
  await sleep(4); await t.shot('barn'); await sleep(3); await t.shot('row');
  await t.until(async () => (await t.S('phase')) === 'storm', 40); await sleep(1); await t.shot('storm');
  if (alt !== 'idle') await t.use('Run into the barn');   // (alt idle: stand in the rain until you run for it anyway)
  await t.until(async () => (await t.S('cam')) === 'inside', 45); await sleep(1.5); await t.shot('inside');
  await t.until(async () => (await t.S('cam')) === 'behind', 20); await sleep(3); await t.shot('behind');
});
await run('mirage', async (t) => {
  await sleep(3); await t.shot('desert'); await t.walkTo(0, 7); await sleep(4); await t.shot('shimmer');
  await t.until(async () => (await t.S('phase')) === 'lead', 20); await t.walkTo(0, 2); await sleep(2);   // (you can't go on without the camel)
  if (alt !== 'idle') await t.use('Lead the camel');   // (alt idle: wait until the camel nudges you on)
  await sleep(3); await t.shot('leading');
  await t.until(async () => (await t.S('phase')) === 'choose', 60); await sleep(1); await t.shot('gone');
  await t.use(alt === 'back' ? 'turn back' : 'Lift the rock'); await sleep(5); await t.shot('water');
});
await b.close();
