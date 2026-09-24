#!/usr/bin/env node
// Render a thought-experiment film. Everything lands in experiments/<id>/output/:
//   node engine/render.mjs trolley-problem            both videos (16:9 + 9:16), captions, thumbnails, description
//   node engine/render.mjs trolley-problem --preview  build narration + timeline, serve an interactive player
//   node engine/render.mjs trolley-problem --stills 5,20,42   dump PNG frames at those times (for review)
//   node engine/render.mjs trolley-problem --thumbs   thumbnails + description only (no video)
//   options: --format landscape|vertical|both  --fps 30  --from 0 --to 30  --scale 0.5 (draft)
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const exp = args.find((a) => !a.startsWith('--') && !/^[\d.,]+$/.test(a));
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i < 0 ? dflt : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
if (!exp) { console.error('usage: render.mjs <experiment-id> [--preview] [--stills t1,t2] [--fps 30] [--from s] [--to s] [--scale 1]'); process.exit(1); }

const expDir = path.join(ROOT, 'experiments', exp);
const buildDir = path.join(ROOT, 'build', exp);
fs.mkdirSync(buildDir, { recursive: true });
const outDir = path.join(expDir, 'output');
fs.mkdirSync(path.join(outDir, 'thumbnails'), { recursive: true });
const script = JSON.parse(fs.readFileSync(path.join(expDir, 'script.json'), 'utf8'));

// ------------------------------------------------------------ narration
const voice = script.voice ?? { engine: 'say', name: 'Daniel', rate: 172 };
const probe = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

function speak(text, out, speed) {
  // Pronunciation hints (e.g. names) apply to speech only, never to captions.
  let spoken = text;
  for (const [k, v] of Object.entries(script.pronounce ?? {})) spoken = spoken.replaceAll(k, v);
  const raw = out.replace(/\.wav$/, voice.engine === 'say' ? '.aiff' : '.raw.wav');
  if (voice.engine === 'say') {
    execFileSync('say', ['-v', voice.name, '-r', String(Math.round(voice.rate * speed)), '-o', raw, spoken]);
  } else if (voice.engine === 'kokoro') {
    // local Kokoro-82M (ONNX) — see tools/kokoro; voices: https://huggingface.co/hexgrad/Kokoro-82M
    execFileSync(path.join(ROOT, 'tools/kokoro-venv/bin/python'), [path.join(ROOT, 'tools/kokoro/speak.py'), voice.name, String(speed), voice.lang ?? 'en-us', raw],
      { input: spoken, stdio: ['pipe', 'ignore', 'inherit'] });
  } else throw new Error('unsupported TTS engine ' + voice.engine);
  // trim leading/trailing silence so segment timing (and anything synced to it) is tight
  const trim = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05';
  execFileSync('ffmpeg', ['-y', '-nostdin', '-v', 'error', '-i', raw, '-af', `${trim},areverse,${trim},areverse`, '-ar', '48000', '-ac', '1', out]);
  fs.unlinkSync(raw);
}

// Inline markers in narration text:  [[name]] marks a cue (scenes read it with tl.cue(id, name)),
// [[0.6]] inserts a pause, [[name 0.6]] does both. Each stretch between markers is voiced separately,
// so cue times are exact and captions switch at the same boundaries.
const MARK = /\[\[\s*([A-Za-z]\w*)?\s*([\d.]+)?\s*\]\]/g;
const stripMarks = (t) => t.replace(MARK, ' ').replace(/\s+/g, ' ').trim();
function parseParts(text) {
  const parts = [];
  let last = 0, cue = null, pause = 0;
  for (const m of text.matchAll(MARK)) {
    const chunk = text.slice(last, m.index).trim();
    if (chunk) { parts.push({ text: chunk, cue, pause }); cue = null; pause = 0; }
    cue = m[1] ?? cue; pause += parseFloat(m[2] ?? 0) || 0;
    last = m.index + m[0].length;
  }
  const rest = text.slice(last).trim();
  if (rest) parts.push({ text: rest, cue, pause });
  return parts;
}

let cursor = script.lead ?? 1.0;
const segments = [];
for (const [i, seg] of script.segments.entries()) {
  const speed = seg.speed ?? voice.speed ?? 1;
  const parts = parseParts(seg.text).map((p, j) => {
    const hash = createHash('sha1').update(JSON.stringify(['trim1', voice, speed, p.text, script.pronounce])).digest('hex').slice(0, 10);
    const wav = path.join(buildDir, `part-${String(i).padStart(2, '0')}-${j}-${hash}.wav`);
    if (!fs.existsSync(wav)) speak(p.text, wav, speed);
    return { ...p, wav, dur: probe(wav) };
  });
  // join the parts (with their pauses) into one clip for the segment
  const wav = path.join(buildDir, `seg-${String(i).padStart(2, '0')}.wav`);
  const inputs = parts.flatMap((p) => (p.pause > 0 ? ['-f', 'lavfi', '-t', String(p.pause), '-i', 'anullsrc=r=48000:cl=mono', '-i', p.wav] : ['-i', p.wav]));
  const n = parts.reduce((a, p) => a + (p.pause > 0 ? 2 : 1), 0);
  execFileSync('ffmpeg', ['-y', '-nostdin', '-v', 'error', ...inputs, '-filter_complex', `${[...Array(n).keys()].map((k) => `[${k}]`).join('')}concat=n=${n}:v=0:a=1[o]`, '-map', '[o]', wav]);
  cursor += seg.before ?? 0;
  const start = cursor, cues = {}, spans = [];
  let t = start;
  for (const p of parts) {
    t += p.pause;
    if (p.cue) cues[p.cue] = +t.toFixed(3);
    spans.push({ text: p.text, start: +t.toFixed(3), end: +(t + p.dur).toFixed(3) });
    t += p.dur;
  }
  const dur = probe(wav);
  segments.push({ id: seg.id, text: stripMarks(seg.text), caption: seg.caption, start: +start.toFixed(3), end: +(start + dur).toFixed(3), cues, parts: seg.caption ? undefined : spans, wav });
  cursor += dur + (seg.after ?? script.gap ?? 0.6);
}
const duration = +(cursor + (script.tail ?? 4)).toFixed(3);
fs.writeFileSync(path.join(buildDir, 'timeline.json'), JSON.stringify({ id: exp, title: script.title, duration, segments: segments.map(({ wav, ...s }) => s) }, null, 2));

// ------------------------------------------------------------ soundtrack (synthesised; see tools/sfx.py)
// script.soundtrack = { hits: [{ sfx: 'braam', at: { seg, offset }, gain }], bed: { sfx: 'pad', from: { seg, offset }, gain } }
const segById = Object.fromEntries(segments.map((s) => [s.id, s]));
const atTime = (a) => (typeof a === 'number' ? a : (a.cue ? segById[a.seg].cues[a.cue] : segById[a.seg].start) + (a.offset ?? 0));
const music = [];
{
  const st = script.soundtrack ?? {};
  const py = path.join(ROOT, 'tools/kokoro-venv/bin/python'), sfxTool = path.join(ROOT, 'tools/sfx.py');
  fs.mkdirSync(path.join(ROOT, 'build/sfx'), { recursive: true });
  const cached = (name, args) => {
    const f = path.join(ROOT, 'build/sfx', name);
    if (!fs.existsSync(f)) execFileSync(py, [sfxTool, ...args, f], { stdio: ['ignore', 'ignore', 'inherit'] });
    return f;
  };
  for (const h of st.hits ?? []) music.push({ file: cached(`${h.sfx}.wav`, [h.sfx]), start: atTime(h.at), gain: h.gain ?? -12 });
  if (st.bed) {
    const from = atTime(st.bed.from ?? 0), len = +(duration - from).toFixed(2);
    music.push({ file: cached(`${st.bed.sfx}-${len}.wav`, [st.bed.sfx, String(len)]), start: from, gain: st.bed.gain ?? -30 });
  }
}

// mix narration clips + music at their offsets on a silent bed of the exact film length
const narration = path.join(buildDir, 'narration.m4a');
{
  const clips = [...segments.map((s) => ({ file: s.wav, start: s.start, gain: 0 })), ...music];
  const inputs = ['-f', 'lavfi', '-t', String(duration), '-i', 'anullsrc=r=48000:cl=mono', ...clips.flatMap((c) => ['-i', c.file])];
  const delays = clips.map((c, i) => `[${i + 1}]aresample=48000,volume=${c.gain}dB,adelay=${Math.round(c.start * 1000)}:all=1[a${i}]`).join(';');
  const mix = '[0]' + clips.map((_, i) => `[a${i}]`).join('') + `amix=inputs=${clips.length + 1}:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]`;
  execFileSync('ffmpeg', ['-y', '-nostdin', '-v', 'error', ...inputs, '-filter_complex', `${delays};${mix}`, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', narration]);
}

// captions sidecar (WebVTT) for the database / accessibility
{
  const ts = (t) => new Date(t * 1000).toISOString().slice(11, 23);
  const vtt = ['WEBVTT', ''];
  let n = 0;
  for (const s of segments) for (const p of s.parts ?? [{ text: s.caption ?? s.text, start: s.start, end: s.end }]) vtt.push(String(++n), `${ts(p.start)} --> ${ts(p.end)}`, p.text, '');
  fs.writeFileSync(path.join(outDir, `${exp}.vtt`), vtt.join('\n'));
}
console.log(`timeline: ${segments.length} segments, ${duration.toFixed(1)}s`);

// ------------------------------------------------------------ description (paste-ready for YouTube; plain text)
// script.publish = { summary, chapters: [{ at, title }], essay: { title, creator, url }, also: [{ title, creator, url }],
//                    citations: [..], reading: [..], discussion: [..], tags: [..] }
{
  const pub = script.publish;
  if (pub) {
    const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const L = [];
    L.push(pub.summary.trim(), '');
    if (pub.chapters?.length) { L.push('CHAPTERS'); for (const c of pub.chapters) L.push(`${mmss(Math.max(0, atTime(c.at)))} ${c.title}`); L.push(''); }
    if (pub.essay || pub.also?.length) {
      L.push('GO DEEPER');
      if (pub.essay) L.push(`▶ In-depth video essay: ${pub.essay.creator}, "${pub.essay.title}"`, `  ${pub.essay.url}`);
      for (const a of pub.also ?? []) L.push(`▶ ${a.creator}, "${a.title}"`, `  ${a.url}`);
      L.push('');
    }
    L.push('SOURCES'); for (const c of pub.citations ?? script.sources) L.push(`• ${c}`); L.push('');
    if (pub.reading?.length) { L.push('RECOMMENDED READING'); for (const r of pub.reading) L.push(`• ${r}`); L.push(''); }
    if (pub.discussion?.length) { L.push('JOIN THE DISCUSSION'); for (const d of pub.discussion) L.push(d); L.push(''); }
    if (pub.tags?.length) L.push(pub.tags.map((x) => '#' + x).join(' '));
    fs.writeFileSync(path.join(outDir, 'description.txt'), L.join('\n').trim() + '\n');
  }
}

// ------------------------------------------------------------ static server
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.m4a': 'audio/mp4', '.png': 'image/png' };
const server = createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const stat = fs.statSync(p);
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  const head = { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  if (range) {
    const a = +range[1], b = range[2] ? +range[2] : stat.size - 1;
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${stat.size}`, 'Content-Length': b - a + 1 });
    return fs.createReadStream(p, { start: a, end: b }).pipe(res);
  }
  res.writeHead(200, { ...head, 'Content-Length': stat.size });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(opt('port', 0), r));
const url = `http://localhost:${server.address().port}/engine/player.html?exp=${exp}`;

// --format landscape | vertical | both (default both)
const fmtOpt = String(opt('format', 'both'));
const formats = fmtOpt === 'both' ? ['landscape', 'vertical'] : [fmtOpt];
const FORMATS = { landscape: { w: 1920, h: 1080, suffix: '' }, vertical: { w: 1080, h: 1920, suffix: '-vertical' } };

if (opt('preview', false)) {
  console.log(`preview: ${url}&preview  (space = play/pause, Ctrl-C to stop)`);
  spawn('open', [url + '&preview' + (formats[0] === 'vertical' ? '&format=vertical' : '')]);
} else if (opt('thumbs', false)) {
  try { await thumbnails(); } catch (e) { console.error(e); process.exit(1); }
  server.close();
} else {
  try { for (const f of formats) await capture(f); if (!opt('stills', null) && !opt('from', null) && !opt('to', null)) await thumbnails(); }
  catch (e) { console.error(e); process.exit(1); }
  server.close();
}

// ------------------------------------------------------------ frame capture
async function capture(format) {
  const F = FORMATS[format];
  const { default: puppeteer } = await import('puppeteer');
  const scale = parseFloat(opt('scale', 1));
  const browser = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.setViewport({ width: F.w, height: F.h, deviceScaleFactor: scale });
  await page.goto(url + (format === 'vertical' ? '&format=vertical' : ''));
  await page.waitForFunction('window.ready === true', { timeout: 60000 });
  const clip = { x: 0, y: 0, width: F.w, height: F.h };

  const stills = opt('stills', null);
  if (stills) {
    const dir = path.join(buildDir, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of String(stills).split(',').map(Number)) {
      await page.evaluate((t) => window.renderAt(t), t);
      const f = path.join(dir, `t${t.toFixed(1).padStart(6, '0')}${F.suffix}.png`);
      await page.screenshot({ path: f, clip });
      console.log(f);
    }
    return browser.close();
  }

  const fps = parseFloat(opt('fps', 30));
  const from = parseFloat(opt('from', 0)), to = parseFloat(opt('to', duration));
  const frames = Math.round((to - from) * fps);
  const partial = from > 0 || to < duration;
  const outFile = path.join(outDir, partial ? `${exp}${F.suffix}_${from}-${to}.mp4` : `${exp}${F.suffix}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-ss', String(from), '-t', String(to - from), '-i', narration,
    '-map', '0:v', '-map', '1:a',
    '-vf', `scale=${Math.round(F.w * scale / 2) * 2}:${Math.round(F.h * scale / 2) * 2}:flags=lanczos,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-tune', 'animation',
    '-af', 'apad', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(frames / fps), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = from + i / fps;
    await page.evaluate((t) => window.renderAt(t), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94, clip, optimizeForSpeed: true });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % fps === 0) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\rframe ${i}/${frames}  ${(i / Math.max(el, 0.001)).toFixed(1)} fps  eta ${Math.round((frames - i) / Math.max(i / el, 0.001))}s   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log(`\nwrote ${path.relative(ROOT, outFile)}`);
}

// ------------------------------------------------------------ thumbnails
// script.thumbnails = [{ at: { seg, cue?, offset } | seconds, html: "<b>5</b> or 1?", side: "left" | "right" }] → 1280×720 PNGs
async function thumbnails() {
  const list = script.thumbnails ?? [];
  if (!list.length) return;
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[page error]', e.message));
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url);
  await page.waitForFunction('window.ready === true', { timeout: 60000 });
  for (const [i, th] of list.entries()) {
    await page.evaluate((t, html, side) => { window.renderAt(t); window.showThumb(html, side); }, atTime(th.at), th.html, th.side ?? 'left');
    const png = path.join(buildDir, `thumb-${i + 1}.png`), out = path.join(outDir, 'thumbnails', `thumbnail-${i + 1}.png`);
    await page.screenshot({ path: png, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    execFileSync('ffmpeg', ['-y', '-nostdin', '-v', 'error', '-i', png, '-vf', 'scale=1280:720:flags=lanczos', out]);
    console.log('wrote ' + path.relative(ROOT, out));
  }
  await browser.close();
}
