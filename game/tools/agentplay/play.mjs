#!/usr/bin/env node
// agentplay: play the game one command at a time, on a frozen clock (for AI playtesters, or a human at a terminal).
//   node game/tools/agentplay/play.mjs <session> <command> [args...]      (see README.md in this folder)
// Each session is its own headless browser (own saves) in build/agentplay/<session>/, screenshots in .../shots/.
// Needs the game server: npm run play
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const [session, cmd, ...args] = process.argv.slice(2);
if (!session || !cmd) { console.log(fs.readFileSync(path.join(HERE, 'README.md'), 'utf8')); process.exit(1); }
const dir = path.join(ROOT, 'build/agentplay', session);
const portFile = path.join(dir, 'port');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(port) {
  const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', body: JSON.stringify({ cmd, args }), signal: AbortSignal.timeout(600000) });
  return r.text();
}

async function main() {
  let port = fs.existsSync(portFile) ? fs.readFileSync(portFile, 'utf8') : null;
  if (port) { try { console.log(await send(port)); return; } catch (e) { if (e.name === 'TimeoutError') throw e; port = null; } }
  if (cmd === 'quit') return console.log('not running');
  fs.mkdirSync(dir, { recursive: true }); fs.rmSync(portFile, { force: true });
  const log = fs.openSync(path.join(dir, 'server.log'), 'a');
  spawn(process.execPath, [path.join(HERE, 'server.mjs'), session, dir], { detached: true, stdio: ['ignore', log, log] }).unref();
  for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) await sleep(200);
  if (!fs.existsSync(portFile)) throw new Error('session did not start; see ' + path.join(dir, 'server.log'));
  console.log(await send(fs.readFileSync(portFile, 'utf8')));
}
main().catch((e) => { console.error('agentplay:', e.message); process.exit(1); });
