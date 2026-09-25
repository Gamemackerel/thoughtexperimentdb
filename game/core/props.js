// Small clay props shared by several vignettes (animals, a car, cards with writing on them).
import { THREE, palette, clay, mesh } from '/engine/core.js';

export function makeSheep() {
  const g = new THREE.Group(), body = new THREE.Group();
  const wool = clay(0xf7f3ea), dark = clay(palette.ink);
  for (const [x, y, s] of [[-0.25, 0.62, 0.36], [0.15, 0.66, 0.4], [0.05, 0.8, 0.3], [-0.1, 0.55, 0.32]]) { const b = mesh(new THREE.SphereGeometry(s, 14, 10), wool); b.position.set(0, y, x); body.add(b); }
  const head = mesh(new THREE.SphereGeometry(0.17, 12, 10), dark); head.scale.set(0.9, 1, 1.3); head.position.set(0, 0.72, 0.55); body.add(head);
  for (const [x, z] of [[-0.18, -0.25], [0.18, -0.25], [-0.18, 0.25], [0.18, 0.25]]) { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), dark); l.position.set(x, 0.22, z); body.add(l); }
  g.add(body); g.userData.body = body;
  return g;
}

export function makeGoat() {
  const g = new THREE.Group(), body = new THREE.Group();
  const coat = clay(0xe9e2d4), dark = clay(0x5a4a3c);
  const torso = mesh(new THREE.CapsuleGeometry(0.32, 0.7, 8, 14), coat); torso.rotation.x = Math.PI / 2; torso.position.y = 0.85; body.add(torso);
  const neck = mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 10), coat); neck.position.set(0, 1.15, 0.48); neck.rotation.x = 0.5; body.add(neck);
  const head = mesh(new THREE.CapsuleGeometry(0.14, 0.26, 6, 10), coat); head.rotation.x = 1.2; head.position.set(0, 1.35, 0.72); body.add(head);
  for (const s of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.05, 0.36, 8), dark); horn.position.set(0.08 * s, 1.58, 0.6); horn.rotation.set(-0.6, 0, 0.25 * s); body.add(horn);
    const ear = mesh(new THREE.SphereGeometry(0.07, 8, 6), coat); ear.scale.set(1.8, 0.5, 0.8); ear.position.set(0.17 * s, 1.44, 0.62); body.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), clay(palette.ink)); eye.position.set(0.1 * s, 1.44, 0.8); body.add(eye);
  }
  const beard = mesh(new THREE.ConeGeometry(0.06, 0.2, 8), coat); beard.rotation.x = Math.PI; beard.position.set(0, 1.12, 0.86); body.add(beard);
  for (const [x, z] of [[-0.18, -0.35], [0.18, -0.35], [-0.18, 0.35], [0.18, 0.35]]) { const l = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6), dark); l.position.set(x, 0.3, z); body.add(l); }
  const tail = mesh(new THREE.SphereGeometry(0.07, 8, 6), coat); tail.position.set(0, 1.05, -0.55); body.add(tail);
  g.add(body); g.userData.body = body;
  return g;
}

export function makeCar(color = palette.trolley) {
  const g = new THREE.Group();
  const paint = clay(color, { roughness: 0.35, metalness: 0.2 });
  const base = mesh(new THREE.BoxGeometry(1.7, 0.55, 3.4), paint); base.position.y = 0.6; g.add(base);
  const cabin = mesh(new THREE.BoxGeometry(1.5, 0.55, 1.7), paint); cabin.position.set(0, 1.12, -0.2); g.add(cabin);
  const glass = clay(palette.glass, { roughness: 0.2 });
  for (const z of [0.66, -1.06]) { const w = mesh(new THREE.BoxGeometry(1.36, 0.42, 0.04), glass); w.position.set(0, 1.14, z); g.add(w); }
  for (const x of [-0.76, 0.76]) { const w = mesh(new THREE.BoxGeometry(0.04, 0.4, 1.4), glass); w.position.set(x, 1.14, -0.2); g.add(w); }
  for (const [x, z] of [[-0.8, 1.1], [0.8, 1.1], [-0.8, -1.1], [0.8, -1.1]]) { const wh = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), clay(0x2b2a33)); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.34, z); g.add(wh); }
  for (const x of [-0.5, 0.5]) { const l = mesh(new THREE.SphereGeometry(0.1, 10, 8), clay(0xfff3c4)); l.position.set(x, 0.66, 1.7); g.add(l); }
  const bow = mesh(new THREE.TorusGeometry(0.25, 0.08, 8, 16), clay(0xf2c14e)); bow.position.set(0, 1.5, -0.2); bow.rotation.y = Math.PI / 2; g.add(bow);
  return g;
}

// a canvas texture with text on it (cards, signs, boards)
export function textTexture(lines, { w = 512, h = 256, bg = '#fbf6ea', fg = '#2b2a33', font = '40px sans-serif', align = 'center', lineH = 1.3 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.font = font; g.textAlign = align; g.textBaseline = 'middle';
  const px = parseInt(font.match(/(\d+)px/)[1], 10), arr = [].concat(lines), y0 = h / 2 - ((arr.length - 1) * px * lineH) / 2;
  arr.forEach((l, i) => g.fillText(l, align === 'center' ? w / 2 : 24, y0 + i * px * lineH));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData = { canvas: c, ctx: g };
  return t;
}
