// Pre-rendered narration lines (game/assets/voice/<vignette>/manifest.json), queued so they never overlap, with captions.
export class Voice {
  constructor() {
    this.cap = document.getElementById('caption');
    this.queue = [];
    this.playing = null;
    this.manifest = {};
    this.base = '';
    this.said = new Set();
  }

  async load(vignette) {
    this.stop();
    this.said.clear();
    this.base = `/game/assets/voice/${vignette}/`;
    try { this.manifest = await (await fetch(this.base + 'manifest.json')).json(); } catch { this.manifest = {}; }
  }

  // say(id) → Promise resolved when the line (and anything queued before it) has finished
  say(id, { once = true, pauseAfter = 0.4 } = {}) {
    if (once && this.said.has(id)) return Promise.resolve();
    this.said.add(id);
    return new Promise((resolve) => { this.queue.push({ id, resolve, pauseAfter }); this.next(); });
  }

  get busy() { return !!this.playing || this.queue.length > 0; }

  next() {
    if (this.playing || !this.queue.length) return;
    const item = this.queue.shift();
    const line = this.manifest[item.id];
    if (!line) { console.warn('missing line', item.id); item.resolve(); return this.next(); }
    const audio = new Audio(this.base + line.file);
    this.playing = { item, audio };
    this.cap.innerHTML = `<span>${line.text}</span>`;
    this.cap.classList.add('on');
    const done = () => {
      if (this.playing?.audio !== audio) return;
      this.cap.classList.remove('on');
      setTimeout(() => { this.playing = null; item.resolve(); this.next(); }, item.pauseAfter * 1000);
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(() => setTimeout(done, (line.dur ?? 2) * 1000));
  }

  stop() {
    this.queue.forEach((q) => q.resolve());
    this.queue = [];
    if (this.playing) { this.playing.audio.pause(); this.playing.item.resolve(); this.playing = null; }
    this.cap?.classList.remove('on');
  }
}
