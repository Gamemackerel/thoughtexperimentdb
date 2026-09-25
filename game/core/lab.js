// The lab in Brain in a Vat: a brain, its vat and the humming machine that feeds it a world.
// (Made for the film, archive/films/experiments/brain-in-a-vat/scene.js; the game uses the same models.)
import { THREE, palette, clamp, seeded, clay, mesh } from '/game/engine/core.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function makeBrain() {
  const g = new THREE.Group();
  const mat = clay(0xf58e9f, { roughness: 0.6, emissive: 0x7a2a3a, emissiveIntensity: 0.25 });
  for (const s of [-1, 1]) {
    const geo = new THREE.IcosahedronGeometry(0.5, 5);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = v.clone().normalize();
      // gyri: interfering folds, deeper towards the sides
      const fold = Math.sin(13 * v.x + 4 * Math.sin(9 * v.z)) * Math.sin(12 * v.y + 3 * Math.cos(8 * v.x)) + 0.5 * Math.sin(17 * v.z + 5 * v.y);
      v.addScaledVector(n, 0.035 * fold);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const h = mesh(geo, mat);
    h.scale.set(0.82, 0.78, 1.15);
    h.position.x = 0.21 * s;
    g.add(h);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.5, 12), mat);
  stem.position.set(0, -0.42, -0.2);
  stem.rotation.x = 0.35;
  g.add(stem);
  return g;
}

export function makeVat() {
  const g = new THREE.Group();
  const metal = clay(0x8b909a, { metalness: 0.5, roughness: 0.35 });
  const base = mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.36, 40), metal);
  base.position.y = 0.18;
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 2.0, 40),
    new THREE.MeshStandardMaterial({ color: 0x9fe0c6, emissive: 0x3fae8e, emissiveIntensity: 0.25, transparent: true, opacity: 0.42, roughness: 0.2, depthWrite: false }));
  fluid.position.y = 0.36 + 1.0;
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.45, 40, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 }));
  glass.position.y = 0.36 + 1.22;
  const cap = mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.24, 40), metal);
  cap.position.y = 0.36 + 2.45 + 0.1;
  const ring = mesh(new THREE.TorusGeometry(1.16, 0.06, 10, 40), metal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.36 + 1.02;
  g.add(base, fluid, glass, cap, ring);
  g.renderOrder = 2;
  return g;
}

export function makeComputer() {
  const g = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(2.8, 4.2, 1.5), clay(0x8a929e));
  body.position.y = 2.1;
  const trim = mesh(new THREE.BoxGeometry(2.9, 0.18, 1.6), clay(0x5d6470));
  trim.position.y = 4.25;
  g.add(body, trim);
  // screen: scrolling green text on a dark panel
  const cvs = document.createElement('canvas');
  cvs.width = 256; cvs.height = 512;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#0f2a2b'; ctx.fillRect(0, 0, 256, 512);
  const r = seeded(4);
  for (let y = 10; y < 512; y += 14) {
    ctx.fillStyle = r() < 0.2 ? '#f2b35c' : '#6fe0b8';
    let x = 12;
    while (x < 230) { const w = 6 + r() * 40; if (r() < 0.8) ctx.fillRect(x, y, w, 5); x += w + 8; }
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 0.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(0, 3.15, 0.76);
  g.add(screen);
  // tape reels
  const reels = [];
  for (const x of [-0.55, 0.55]) {
    const reel = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24), clay(0x2b2a33));
    reel.rotation.x = Math.PI / 2;
    reel.position.set(x, 1.95, 0.77);
    const hub = mesh(new THREE.BoxGeometry(0.5, 0.06, 0.1), clay(0xdcd6cb));
    hub.position.z = 0.02; hub.rotation.x = -Math.PI / 2;
    reel.add(hub);
    reels.push(reel); g.add(reel);
  }
  // blinking lights
  const lights = [];
  const cols = [0xe0674f, 0xe2a93b, 0x3f8f86, 0x6fe0b8];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.MeshStandardMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 0 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), m);
    l.position.set(-0.9 + (i % 6) * 0.36, 1.05 - Math.floor(i / 6) * 0.26, 0.77);
    lights.push(l); g.add(l);
  }
  g.userData = { tex, reels, lights };
  return g;
}
