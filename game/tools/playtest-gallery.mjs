// Automated playtest of the Picasso gallery and its six vignettes (needs `npm run play`):
//   node game/tools/playtest-gallery.mjs [only-id] [alt]
// Plays one path through each to its ending (alt: another path). Screenshots to build/playtest-gal-*.png.
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
    p, shot: (name) => p.screenshot({ path: `build/playtest-gal-${id}-${String(++n).padStart(2, '0')}-${name}.png` }),
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

await run('gallery', async (t) => { await sleep(2); await t.shot('arrive'); await t.walkTo(0, 0); await sleep(4); await t.shot('middle'); await t.walkTo(12, 0); await sleep(5); await t.shot('east'); });
await run('ring-of-gyges', async (t) => {
  await sleep(2); await t.shot('arrive'); await t.walkTo(-7, 1); await sleep(5); await t.until(() => t.p.evaluate(() => window.__ted.ctx.voice.said.has('horse')), 10); await sleep(4);
  await t.use('Reach into'); await sleep(3); await t.p.keyboard.press('KeyR'); await sleep(2); await t.shot('invisible');
  if (!alt) { await t.use('Take an apple'); await sleep(2); await t.use('Take the coins'); await sleep(2); await t.shot('took'); await t.walkTo(11.5, -5); await sleep(5); await t.use("king's gold"); await sleep(2); await t.shot('gold'); }
  await sleep(4); await t.use(alt ? 'into the hills' : 'Throw the ring', 20);
});
await run('prisoners-dilemma', async (t) => {
  await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.shot('choose');
  for (const c of alt ? ['Say nothing', 'Say nothing', 'Say nothing'] : ['Sign', 'Say nothing', 'Say nothing']) { await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.use(c); await sleep(3); await t.shot('round'); }
});
await run('newcombs-paradox', async (t) => {
  await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.shot('choose');
  await t.use(alt ? 'both' : 'only the closed'); await sleep(3); await t.shot('opened');
  await t.until(async () => (await t.S('phase')) === 'choose', 40); await t.use(alt ? 'only the closed' : 'both');
});
await run('utility-monster', async (t) => {
  await t.until(async () => (await t.S('phase')) === 'serve', 40); await t.shot('serve');
  for (let i = 0; i < 8; i++) { await t.use('Take a slice'); await sleep(0.5); await t.walkTo(-1, 3.4); await sleep(2.5); await t.use(alt ? (i < 6 ? 'Give them' : 'monster') : 'monster', 8); await t.walkTo(-3, 3.4); await sleep(2.5); await sleep(1); if (i === 1) await t.shot('fed'); }
});
await run('chinese-room', async (t) => {
  await t.until(async () => (await t.S('phase')) === 'play', 40); await sleep(3); await t.shot('card');
  if (alt) { await sleep(6); await t.use('Stop answering', 10); return; }
  const answers = ['我很好，谢谢。', '喜欢，尤其是绿茶。', '今天天气很好。'];
  for (let r = 0; r < 3; r++) {
    await t.until(async () => (await t.S('phase')) === 'play', 20); await sleep(1.5); await t.use('Take the card'); await sleep(0.5); await t.use('rulebook'); await sleep(1); if (r === 0) await t.shot('rule'); await t.p.keyboard.press('KeyE'); await sleep(0.4);
    // the matching pigeonhole (the test knows the answer; a player compares the shapes)
    const holes = ['今天天气很好。', '我很好，谢谢。', '我不知道。', '喜欢，尤其是绿茶。'];
    await t.use('Pick up this card', 6, holes.indexOf(answers[r]));
    await t.use('Post it'); await sleep(3);
    if (process.env.DEBUG) console.log('round', r, await t.S('round'), await t.S('wrong'), await t.S('phase'));
  }
  await sleep(4); await t.shot('reveal');
});
await run('monty-hall', async (t) => {
  await t.until(async () => (await t.S('phase')) === 'pick', 40); await t.shot('doors');
  for (let r = 0; r < 3; r++) {
    await t.until(async () => (await t.S('phase')) === 'pick', 40); await t.use('Choose door ' + (1 + (r % 3)));
    await t.until(async () => (await t.S('phase')) === 'decide', 40); await sleep(0.5); if (r === 0) await t.shot('goat');
    await t.use(r % 2 ? 'Stay' : 'Switch'); await sleep(2); if (r === 0) await t.shot('reveal');
  }
  await t.until(async () => (await t.S('phase')) === 'pick', 40); await t.use('hundred'); await sleep(5); await t.shot('sim');
});
await b.close();
