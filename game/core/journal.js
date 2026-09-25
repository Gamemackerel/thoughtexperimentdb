// The player's journal: one guided question per vignette (asked on the game-over card), every ending you've reached, every
// answer you've written (each kept with the ending it followed, so a change of mind shows), and, once a vignette is
// finished, a todo list of where to go next. Questions and todos live in game/journal.json; the rest stays in this
// browser (localStorage `ted.journal`).
const KEY = 'ted.journal';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');

export class Journal {
  constructor() {
    this.data = {};
    this.ready = fetch('/game/journal.json').then((r) => r.json()).then((d) => (this.data = d)).catch(() => {});
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
    this.notes = {};
    for (const [id, n] of Object.entries(raw)) {
      if (!n || typeof n !== 'object') continue;
      // older saves kept one ending and one answer: carry them over
      const endings = n.endings ?? (n.ending ? [{ title: n.ending, at: n.at }] : []);
      const answers = n.answers ?? (n.answer ? [{ ending: n.ending ?? '', text: n.answer, at: n.at }] : []);
      this.notes[id] = { endings, answers, last: n.last ?? n.ending ?? null };
    }
    this.save();
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.notes)); } catch {} }
  entry(id) { return (this.notes[id] ??= { endings: [], answers: [], last: null }); }

  question(id) { return this.data[id]?.question ?? ''; }
  /** titles of the endings reached here, oldest first, with the most recent last */
  endings(id) { const n = this.notes[id]; if (!n) return []; const t = n.endings.map((e) => e.title).filter((x) => x !== n.last); return n.last ? [...t, n.last] : t; }
  reach(id, title) {
    const n = this.entry(id);
    if (!n.endings.some((e) => e.title === title)) n.endings.push({ title, at: new Date().toISOString() });
    n.last = title; this.save();
  }
  answer(id, ending, text) { this.entry(id).answers.push({ ending, text, at: new Date().toISOString() }); this.save(); }
  lastAnswer(id) { const a = this.notes[id]?.answers; return a?.length ? a[a.length - 1] : null; }
  edit(id, i, text) { const a = this.notes[id]?.answers?.[i]; if (a) { a.text = text; a.editedAt = new Date().toISOString(); this.save(); } }

  // the journal page, in the order of journal.json; vignettes you haven't reached an ending in are left out
  render(done) {
    const ids = Object.keys(this.data).filter((k) => !k.startsWith('_'));
    const entries = ids.filter((id) => this.notes[id]?.endings.length).map((id) => {
      const d = this.data[id], n = this.notes[id];
      const found = n.endings.map((e) => `<span class="ending">${esc(e.title)} <small>${day(e.at)}</small></span>`).join('');
      const answers = n.answers.map((a, i) => `<div class="answer"><small>after “${esc(a.ending)}”</small>
        <textarea data-id="${id}" data-i="${i}" rows="1">${esc(a.text)}</textarea></div>`).join('');
      const todo = d.todo.map((t) => `<li>${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.text)}</a>` : esc(t.text)}</li>`).join('');
      return `<div class="entry"><h3>${esc(d.title)}</h3>
        <div class="endings">${found}</div>
        <div class="q">${esc(d.question)}</div>
        ${answers || '<p class="empty">(no answer yet)</p>'}
        ${done.has(id) ? `<ul>${todo}</ul>` : ''}</div>`;
    });
    const left = ids.length - entries.length;
    return `<div class="close">Esc · close</div><h2>My journal</h2>
      ${entries.join('') || '<p class="empty">Nothing yet. Go through a door, a painting or a book.</p>'}
      ${entries.length && left ? `<p class="empty">${left} more to go…</p>` : ''}`;
  }
}
