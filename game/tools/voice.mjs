#!/usr/bin/env node
// Render a vignette's narration lines with Kokoro → game/assets/voice/<id>/<line>.mp3 + manifest.json
//   node game/tools/voice.mjs trolley-problem
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const id = process.argv[2];
if (!id) { console.error('usage: voice.mjs <vignette-id>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/lines', `${id}.json`), 'utf8'));
const out = path.join(ROOT, 'game/assets/voice', id);
fs.mkdirSync(out, { recursive: true });
const voice = { name: 'bm_fable', speed: 0.9, lang: 'en-gb', ...spec.voice };
const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05';
const manifest = {};

for (const [key, raw] of Object.entries(spec.lines)) {
  const line = typeof raw === 'string' ? { text: raw } : raw;
  let spoken = line.text;
  for (const [a, b] of Object.entries(spec.pronounce ?? {})) spoken = spoken.replaceAll(a, b);
  const speed = line.speed ?? voice.speed;
  const hash = createHash('sha1').update(JSON.stringify([voice, speed, spoken])).digest('hex').slice(0, 8);
  const file = `${key}-${hash}.mp3`;
  const dest = path.join(out, file);
  if (!fs.existsSync(dest)) {
    const wav = path.join(out, `${key}.raw.wav`);
    execFileSync(path.join(ROOT, 'tools/kokoro-venv/bin/python'), [path.join(ROOT, 'tools/kokoro/speak.py'), voice.name, String(speed), voice.lang, wav],
      { input: spoken, stdio: ['pipe', 'ignore', 'inherit'] });
    execFileSync('ffmpeg', ['-y', '-nostdin', '-v', 'error', '-i', wav, '-af', `${trim},areverse,${trim},areverse,loudnorm=I=-16:TP=-1.5`,
      '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '96k', dest]);
    fs.unlinkSync(wav);
  }
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dest]).toString());
  manifest[key] = { file, text: line.text, dur: +dur.toFixed(2) };
}
// remove stale renders
const keep = new Set(Object.values(manifest).map((m) => m.file));
for (const f of fs.readdirSync(out)) if (f.endsWith('.mp3') && !keep.has(f)) fs.unlinkSync(path.join(out, f));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`${Object.keys(manifest).length} lines → game/assets/voice/${id}/`);
