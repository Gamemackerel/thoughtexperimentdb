#!/usr/bin/env node
// Local dev server for the game:  node game/tools/serve.mjs  →  http://localhost:5173/game/
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = +(process.env.PORT ?? 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };

// Playtest notes from the game-over card are appended here, newest last, for the next iteration.
const FEEDBACK = path.join(ROOT, 'feedback.txt');
function feedback(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy(); });
  req.on('end', () => {
    try {
      const f = JSON.parse(body);
      const entry = [`## ${new Date().toISOString()}  ${f.level}  (ending: ${f.ending})`, '', f.text, '',
        f.answer ? `journal answer: ${f.answer}` : null,
        `context: t=${f.time}s player=(${f.player?.x}, ${f.player?.z}) screen=${f.screen}`,
        `state: ${JSON.stringify(f.state)}`, `browser: ${f.ua}`, '', ''].filter((l) => l !== null).join('\n');
      fs.appendFileSync(FEEDBACK, entry);
      console.log(`feedback (${f.level}): ${f.text.slice(0, 80)}`);
      res.writeHead(204); res.end();
    } catch { res.writeHead(400); res.end(); }
  });
}

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/feedback') return feedback(req, res);
  let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`Thought Experiments → http://localhost:${PORT}/game/`));
