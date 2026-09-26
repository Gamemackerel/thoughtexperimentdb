// Playtest of the journal loop (needs `npm run play`): finish a vignette, answer the question, leave feedback,
// then read the journal at the desk in the first room. Screenshots to build/playtest-journal-*.png.
import puppeteer from 'puppeteer';
import fs from 'node:fs';

const b = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const before = fs.existsSync('feedback.txt') ? fs.readFileSync('feedback.txt', 'utf8').length : 0;
await p.goto('http://localhost:5173/game/?level=fermi-paradox'); await sleep(1.5); await p.click('#begin'); await sleep(3);
// the quickest ending: listen, then send
const walk = (x, z) => p.evaluate((x, z) => { const P = window.__ted.player; P.target = P.pos.clone().set(x, 0, z); }, x, z);
const press = async () => { for (let i = 0; i < 80; i++) { if (await p.evaluate(() => document.getElementById('prompt').classList.contains('on'))) break; await sleep(0.25); } await p.keyboard.press('KeyE'); };
await walk(-3.5, 1.7); await sleep(3); await press();
for (let i = 0; i < 120 && !(await p.evaluate(() => window.__ted.level.__S.open)); i++) await sleep(0.5);
await walk(6.6, 1.3); await sleep(4); await press();
for (let i = 0; i < 200 && await p.evaluate(() => document.getElementById('over').hidden); i++) await sleep(0.25);
// typing E, N, WASD in the boxes must not trigger the game
await p.click('#answer'); await p.keyboard.type('Yes. Even if nobody hears it, saying we were here seems worth it.');
await p.click('#feedback'); await p.keyboard.type('[automated test] the beam from the dish is hard to see');
await p.screenshot({ path: 'build/playtest-journal-1-over.png' });
const leaked = await p.evaluate(() => !document.getElementById('notebook').hidden);
await p.click('#over [data-act="home"]'); await sleep(4);                 // back to the hall (Fermi's room)
await p.evaluate(() => window.__ted.ctx.goto('house')); await sleep(4);     // then down to the first room, where the desk is
await walk(-2, -5.8); await sleep(5); await press(); await sleep(1);
await p.screenshot({ path: 'build/playtest-journal-2-journal.png' });
const text = await p.evaluate(() => { const j = document.getElementById('journal'); return j.innerText + [...j.querySelectorAll('textarea')].map((t) => t.value).join(' '); });
const after = fs.existsSync('feedback.txt') ? fs.readFileSync('feedback.txt', 'utf8') : '';
console.log('journal open:', text.includes('Fermi'), '| answer kept:', text.includes('saying we were here'), '| todo shown:', text.includes('Kurzgesagt'));
console.log('feedback written:', after.length > before, '| keys leaked to notebook:', leaked, '| errors:', errs.join(' | ') || 'none');
await b.close();
