// The Utility Monster's clay model: a purple, three-eyed, furry blob with a bib. Shared by the Utility Monster and the
// lighthouse watcher on the Ship of Theseus's voyage. Faces +z; about 3.2 units tall. userData: body, mouth.
import { THREE, clay, mesh } from '/game/engine/core.js';

export function makeMonster() {
  const g = new THREE.Group(), body = new THREE.Group();
  const fur = clay(0x8a6bb0, { roughness: 1 });
  const blob = mesh(new THREE.SphereGeometry(1.5, 32, 20), fur); blob.scale.set(1, 1.1, 0.95); blob.position.y = 1.6; body.add(blob);
  for (let i = 0; i < 14; i++) { const tuft = mesh(new THREE.ConeGeometry(0.2, 0.5, 6), fur); const a = (i / 14) * Math.PI * 2; tuft.position.set(Math.cos(a) * 0.9, 3.1 + Math.sin(i * 1.7) * 0.1, Math.sin(a) * 0.9); tuft.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); body.add(tuft); }
  for (const [x, y, s] of [[-0.5, 2.3, 0.26], [0.5, 2.3, 0.26], [0, 2.7, 0.2]]) { const e = mesh(new THREE.SphereGeometry(s, 16, 12), clay(0xfbf6ea)); e.position.set(x, y, 1.25); body.add(e); const p = mesh(new THREE.SphereGeometry(s * 0.45, 10, 8), clay(0x111111)); p.position.set(x, y, 1.25 + s * 0.8); body.add(p); }
  const mouth = mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), clay(0x5a1f2e)); mouth.scale.set(1.2, 0.6, 0.6); mouth.position.set(0, 1.7, 1.2); body.add(mouth);
  const bib = mesh(new THREE.CircleGeometry(0.6, 20), clay(0xfbf6ea)); bib.position.set(0, 1.2, 1.4); body.add(bib);
  for (const s of [-1, 1]) { const arm = mesh(new THREE.CapsuleGeometry(0.2, 0.6, 6, 10), fur); arm.position.set(1.4 * s, 1.5, 0.5); arm.rotation.z = s * 0.9; body.add(arm); }
  g.add(body); g.userData.body = body; g.userData.mouth = mouth;
  return g;
}
