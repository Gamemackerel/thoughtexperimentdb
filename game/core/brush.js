// Painted textures, drawn on canvases: short thick strokes laid side by side (after Van Gogh), and a swirling night sky.
import { THREE, seeded } from '/game/engine/core.js';

export function canvasTexture(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 4;
  return t;
}

// strokes over a base colour; dir(x, y) gives each stroke's angle (radians) at a point
export function strokes(g, w, h, { base, colors, count = 3000, len = [10, 22], width = [3, 6], dir = () => 0, seed = 1, alpha = 1 }) {
  const r = seeded(seed);
  if (base) { g.fillStyle = base; g.fillRect(0, 0, w, h); }
  g.lineCap = 'round'; g.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h, a = dir(x, y) + (r() - 0.5) * 0.35, l = len[0] + r() * (len[1] - len[0]);
    g.strokeStyle = colors[Math.floor(r() * colors.length)]; g.lineWidth = width[0] + r() * (width[1] - width[0]);
    g.beginPath(); g.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2); g.lineTo(x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2); g.stroke();
  }
  g.globalAlpha = 1;
}

// a strokes texture that tiles
export function strokeTexture(opts, { w = 512, h = 512, repeat = [4, 4] } = {}) {
  return canvasTexture(w, h, (g) => {
    // draw three times, offset, so strokes cross the seams and it tiles
    for (const [ox, oy] of [[0, 0], [-w, 0], [0, -h], [-w, -h], [w, 0], [0, h]]) { g.save(); g.translate(ox, oy); strokes(g, w, h, { ...opts, base: ox || oy ? null : opts.base }); g.restore(); }
  }, { repeat });
}

// A night sky after The Starry Night: deep blue strokes that follow two great swirls and circle each star, a crescent
// moon wrapped in orange light, all on the inside of a sphere (the seam is at the back).
export function starrySky({ w = 4096, h = 2048, seed = 1889 } = {}) {
  const r = seeded(seed);
  const stars = [...Array(22)].map(() => [r() * w, h * (0.36 + r() * 0.11), 14 + r() * 14]);          // (the horizon is at h / 2)
  const swirls = [[w * 0.42, h * 0.42, 120], [w * 0.55, h * 0.4, 90], [w * 0.12, h * 0.43, 110], [w * 0.8, h * 0.42, 100], [w * 0.3, h * 0.44, 80]];
  const moon = [w * 0.66, h * 0.4];
  return canvasTexture(w, h, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#15244f'); gr.addColorStop(0.5, '#2a4f8f'); gr.addColorStop(1, '#6f8fb0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const dir = (x, y) => {
      for (const [sx, sy, sr] of [...swirls, ...stars.map(([a, b, c]) => [a, b, c * 2.2])]) {
        const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy);
        if (d < sr * 1.6) return Math.atan2(dy, dx) + Math.PI / 2;           // round and round
      }
      return Math.sin(x / 140 + y / 90) * 0.5;                                // otherwise a slow wave
    };
    strokes(g, w, h, { colors: ['#1d3a78', '#2c5aa0', '#3f73b8', '#5d8fca', '#8fb5d9', '#1a2c5e'], count: 90000, len: [10, 22], width: [3, 6], dir, seed });
    // the swirls' pale arms
    for (const [sx, sy, sr] of swirls) for (let k = 0; k < 500; k++) {
      const a = r() * 6.28, d = sr * (0.3 + r() * 0.8), x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d * 0.7, t = a + Math.PI / 2;
      g.strokeStyle = ['#b9d2ea', '#e8eed2', '#8fb5d9'][k % 3]; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(t) * 20, y + Math.sin(t) * 14); g.stroke();
    }
    // stars: a yellow core in rings of pale strokes
    for (const [x, y, s] of stars) {
      for (let ring = 3; ring >= 0; ring--) for (let k = 0; k < 26; k++) {
        const a = (k / 26) * 6.28 + ring, d = s * (0.8 + ring * 0.55);
        g.strokeStyle = ['#f6e27a', '#fbf1b8', '#d9e6c8', '#b9d2ea'][ring]; g.lineWidth = 5;
        g.beginPath(); g.arc(x, y, d, a, a + 0.22); g.stroke();
      }
      g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(x, y, s * 0.55, 0, 7); g.fill();
    }
    // the moon
    const [mx, my] = moon;
    for (let ring = 4; ring >= 0; ring--) { g.strokeStyle = ['#f2b33d', '#f6c95a', '#f9dc7c', '#fbe9a6', '#fff3c6'][ring]; g.lineWidth = 9; for (let k = 0; k < 30; k++) { const a = (k / 30) * 6.28; g.beginPath(); g.arc(mx, my, 34 + ring * 12, a, a + 0.18); g.stroke(); } }
    g.fillStyle = '#ffe98a'; g.beginPath(); g.arc(mx, my, 30, 0, 7); g.fill();
    g.fillStyle = '#e39a2d'; g.beginPath(); g.arc(mx + 13, my - 6, 26, 0, 7); g.fill();
  });
}
