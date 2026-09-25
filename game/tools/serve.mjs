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

createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log(`Thought Experiments → http://localhost:${PORT}/game/`));
