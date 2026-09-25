// Builds a vignette's notebook page (the only place the game names philosophers and sources).
// Source: game/notebook/<id>.json (title, summary, citations, essay, also, reading).
const link = (s) => s.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank">$1</a>');

export async function loadNotebook(level, url, title) {
  try {
    const raw = await (await fetch(url)).json();
    const p = raw.publish ?? raw;
    const summary = (p.summary ?? '').split('\n\n').pop();
    const videos = [p.essay, ...(p.also ?? [])].filter(Boolean);
    level.notebook = `<h2>${raw.title ?? title}</h2><p>${summary}</p>
      <h3>Where it comes from</h3><ul>${(p.citations ?? []).map((c) => `<li>${link(c)}</li>`).join('')}</ul>
      ${videos.length ? `<h3>Go deeper</h3><ul>${videos.map((v) => `<li><a href="${v.url}" target="_blank">${v.creator}, “${v.title}”</a></li>`).join('')}</ul>` : ''}
      ${(p.reading ?? []).length ? `<h3>Read</h3><ul>${p.reading.map((c) => `<li>${link(c)}</li>`).join('')}</ul>` : ''}`;
  } catch { /* the notebook is optional */ }
}
