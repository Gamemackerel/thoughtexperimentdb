// Pre-rendered narration lines (game/assets/voice/<vignette>/manifest.json), queued so they never overlap, with captions.
//
// say(id, opts) → a Promise that resolves when the line (and anything queued before it) has finished.
//   once      (default true) never say the same line twice in a level
//   urgent    a reaction to something the player just did: cuts the current line short and goes to the front
//   maxAge    seconds: drop the line if it can't start within this long of being asked for (setup lines go stale)
//   when      () => bool, checked when the line reaches the front: drop it if its moment has passed
//   common    take the line from the shared set (game/assets/voice/common/), not the level's
//   pauseAfter seconds of silence after the line
// A dropped line resolves at once, as if said. When the level changes, abandon() forgets every pending line WITHOUT
// resolving it, so a level's `await voice.say(…)` chains simply stop there and never run into the next level.
export class Voice {
  constructor() {
    this.cap = document.getElementById('caption');
    this.queue = [];
    this.playing = null;
    this.manifest = {};
    this.common = {};
    this.base = '';
    this.said = new Set();
    fetch('/game/assets/voice/common/manifest.json').then((r) => r.json()).then((m) => (this.common = m)).catch(() => {});
  }

  async load(vignette) {
    this.abandon();
    this.said.clear();
    this.base = `/game/assets/voice/${vignette}/`;
    try { this.manifest = await (await fetch(this.base + 'manifest.json')).json(); } catch { this.manifest = {}; }
  }

  say(id, { once = true, pauseAfter = 0.4, urgent = false, maxAge = Infinity, when = null, common = false } = {}) {
    if (once && this.said.has(id)) return Promise.resolve();
    this.said.add(id);
    return new Promise((resolve) => {
      const item = { id, resolve, pauseAfter, maxAge, when, common, asked: performance.now() };
      if (urgent) {
        this.queue.unshift(item);
        if (this.playing) this.cut();
      } else this.queue.push(item);
      this.next();
    });
  }

  get busy() { return !!this.playing || this.queue.length > 0; }

  next() {
    if (this.playing || !this.queue.length) return;
    const item = this.queue.shift();
    const stale = (performance.now() - item.asked) / 1000 > item.maxAge || (item.when && !item.when());
    const line = (item.common ? this.common : this.manifest)[item.id];
    if (stale || !line) { if (!line && !stale) console.warn('missing line', item.id); item.resolve(); return this.next(); }
    const audio = new Audio((item.common ? '/game/assets/voice/common/' : this.base) + line.file);
    this.playing = { item, audio };
    this.cap.innerHTML = `<span>${line.text}</span>`;
    this.cap.classList.add('on');
    const done = () => {
      if (this.playing?.audio !== audio) return;
      this.cap.classList.remove('on');
      setTimeout(() => { if (this.playing?.audio !== audio) return; this.playing = null; item.resolve(); this.next(); }, item.pauseAfter * 1000);
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(() => setTimeout(done, (line.dur ?? 2) * 1000));
  }

  // end the current line now (it resolves, as if finished) and go on to the next
  cut() {
    const p = this.playing; if (!p) return;
    p.audio.pause(); this.playing = null; this.cap.classList.remove('on'); p.item.resolve();
  }

  // stop talking: the current line and everything queued resolve now (the level carries on)
  stop() {
    const q = this.queue; this.queue = [];
    q.forEach((i) => i.resolve());
    this.cut();
  }

  // the level is over: forget everything, resolving nothing
  abandon() {
    this.queue = [];
    if (this.playing) { this.playing.audio.pause(); this.playing = null; }
    this.cap?.classList.remove('on');
  }
}
