// The player's journal: one guided question per vignette (asked on the game-over card), their answers, and, once a
// vignette is finished, a todo list of where to go next (the original text, a video essay, an encyclopedia entry).
// Questions and todos live in game/journal.json; answers stay in this browser (localStorage `ted.journal`).
const KEY = 'ted.journal';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export class Journal {
  constructor() {
    this.data = {};
    this.ready = fetch('/game/journal.json').then((r) => r.json()).then((d) => (this.data = d)).catch(() => {});
    try { this.notes = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { this.notes = {}; }
  }
  question(id) { return this.data[id]?.question ?? ''; }
  answer(id) { return this.notes[id]?.answer ?? ''; }
  write(id, fields) {
    this.notes[id] = { ...this.notes[id], ...fields, at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(this.notes)); } catch {}
  }

  // the journal page, in the order of journal.json; vignettes you haven't finished are left blank
  render(done) {
    const ids = Object.keys(this.data).filter((k) => !k.startsWith('_'));
    const entries = ids.filter((id) => done.has(id) || this.notes[id]).map((id) => {
      const d = this.data[id], n = this.notes[id] ?? {};
      const when = n.at ? new Date(n.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      const todo = d.todo.map((t) => `<li>${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.text)}</a>` : esc(t.text)}</li>`).join('');
      return `<div class="entry"><h3>${esc(d.title)} <small>${[n.ending, when].filter(Boolean).map(esc).join(' · ')}</small></h3>
        <div class="q">${esc(d.question)}</div>
        <textarea data-id="${id}" rows="1" placeholder="…">${esc(n.answer ?? '')}</textarea>
        ${done.has(id) ? `<ul>${todo}</ul>` : ''}</div>`;
    });
    const left = ids.length - entries.length;
    return `<div class="close">Esc · close</div><h2>My journal</h2>
      ${entries.join('') || '<p class="empty">Nothing yet. Go through a door, a painting or a book.</p>'}
      ${entries.length && left ? `<p class="empty">${left} more to go…</p>` : ''}`;
  }
}
