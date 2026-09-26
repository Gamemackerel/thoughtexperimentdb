// Grant Wood's country, in clay: smooth round hills striped with crop rows, trees like lollipops, a white farmhouse,
// puffy clouds. Shared by the barn and the Gettier cases.
import { THREE, seeded, clay, mesh } from '/game/engine/core.js';
import { canvasTexture } from './brush.js';

// a smooth dome striped with curving rows
export function makeHill(r, h, color, rows = 12, rnd = Math.random) {
  const tex = canvasTexture(256, 256, (g, w, hh) => {
    g.fillStyle = color; g.fillRect(0, 0, w, hh);
    g.strokeStyle = 'rgba(40,60,20,0.28)'; g.lineWidth = 4;
    for (let i = 0; i < rows; i++) { g.beginPath(); const y = (i / rows) * hh; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 18, w * 0.7, y - 18, w, y); g.stroke(); }
  });
  const m = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  m.scale.set(r, h, r * (0.7 + rnd() * 0.4));
  return m;
}

export function makeLollipop(s = 1, color = 0x4f7a3a) {
  const t = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), clay(0x6b4a33)); trunk.position.y = 0.7; t.add(trunk);
  const ball = mesh(new THREE.SphereGeometry(0.9, 16, 12), clay(color)); ball.position.y = 1.9; t.add(ball);
  t.scale.setScalar(s); return t;
}

export function makeFarmhouse() {
  const g = new THREE.Group();
  const fh = mesh(new THREE.BoxGeometry(3, 3, 2.6), clay(0xf6f1e7)); fh.position.y = 1.5; g.add(fh);
  const fr = mesh(new THREE.ConeGeometry(2.3, 2, 4), clay(0x5a5a62)); fr.position.y = 4; fr.rotation.y = Math.PI / 4; g.add(fr);
  const win = new THREE.Shape(); win.moveTo(-0.3, 0); win.lineTo(0.3, 0); win.lineTo(0.3, 0.6); win.quadraticCurveTo(0.3, 0.95, 0, 1.2); win.quadraticCurveTo(-0.3, 0.95, -0.3, 0.6); win.closePath();
  const gw = new THREE.Mesh(new THREE.ShapeGeometry(win), new THREE.MeshBasicMaterial({ color: 0x5b6f86 })); gw.position.set(0, 2.2, 1.31); g.add(gw);
  const door = mesh(new THREE.BoxGeometry(0.7, 1.3, 0.06), clay(0x8a6a4a)); door.position.set(0.8, 0.65, 1.31); g.add(door);
  return g;
}

export function makeCloud(rnd = Math.random) {
  const c = new THREE.Group();
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.SphereGeometry(1 + rnd() * 0.6, 14, 10), clay(0xfbfbf8)); b.position.set((i - 2) * 1.1, rnd() * 0.5, rnd() * 0.4); b.scale.y = 0.75; b.castShadow = false; c.add(b); }
  return c;
}

// a whole backdrop: rolling hills, trees and a farmhouse or two, clouds, a meadow to stand them on
export function makeCountry({ seed = 1930, spread = 60, depth = -18, hills = 9, trees = 16 } = {}) {
  const rnd = seeded(seed), g = new THREE.Group();
  const greens = ['#8fb36a', '#a9c77a', '#c7b562', '#7aa05a', '#b8c98a'];
  const meadow = mesh(new THREE.BoxGeometry(spread * 1.6, 0.4, 70), clay(0x9aba72)); meadow.position.set(0, -0.3, depth - 20); g.add(meadow);
  for (let i = 0; i < hills; i++) { const hl = makeHill(8 + rnd() * 8, 3 + rnd() * 4, greens[i % 5], 10 + Math.floor(rnd() * 8), rnd); hl.position.set((rnd() - 0.5) * spread, -0.4, depth - rnd() * 34); g.add(hl); }
  for (let i = 0; i < trees; i++) { const t = makeLollipop(0.8 + rnd() * 0.6, [0x4f7a3a, 0x5d8a45, 0x3f6a35][i % 3]); t.position.set((rnd() - 0.5) * spread * 0.7, 0, depth + 6 - rnd() * 22); g.add(t); }
  for (let i = 0; i < 5; i++) { const c = makeCloud(rnd); c.position.set((rnd() - 0.5) * spread, 16 + rnd() * 6, depth - 30 - rnd() * 20); g.add(c); }
  return g;
}
