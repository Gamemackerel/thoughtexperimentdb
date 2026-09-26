// The Gettier cases' card: what you believed, and the farmer's three prongs (you believed it, it was true, you had good
// reason), ticked off one by one, then the question none of them answers. It lives in #ui, so a level change clears it.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function beliefCard(belief) {
  const el = document.createElement('div'); el.className = 'belief';
  el.innerHTML = `<div class="said">You believed:</div><div class="what">“${esc(belief)}”</div>
    <ul><li>You believed it</li><li>It was true</li><li>You had good reason to</li></ul><div class="knew">Did you know it?</div>`;
  document.getElementById('ui').appendChild(el);
  const items = el.querySelectorAll('li');
  return {
    show() { el.classList.add('on'); },
    tick(i, ok = true) { items[i]?.classList.add(ok ? 'yes' : 'no'); },
    ask() { el.classList.add('asked'); },
    hide() { el.classList.remove('on'); },
  };
}
