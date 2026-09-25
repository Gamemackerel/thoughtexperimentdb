// Vignette: The Fermi Paradox.
// A hilltop at night under more stars than anyone could count. A radio dish, a console full of static. Listen; then
// send a message into the dark, or keep listening. Either way: years of silence.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeHouse, makeTable, makeLever, makeFrog, animateFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DISH = V(5, 0, -4);
const CONSOLE = V(-3.5, 0, 0.5);
const SWITCH = V(8.5, 0, 0.5);
const NIGHT = 0x0e1426;

export default function fermiParadox(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(NIGHT);
  stage.scene.fog = new THREE.Fog(NIGHT, 70, 400);
  stage.hemi.intensity = 0.55; stage.hemi.color.set(0x9fb2e0); stage.sun.intensity = 0.9; stage.sun.color.set(0xc8d4ff);
  voice.load('fermi-paradox');

  root.add(makeIsland({ radius: 22, seed: 19, color: 0x7d8b7a, rim: 0x5c6a5e }));
  // the radio dish
  const dish = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 16), clay(0xdcd6cb)); base.position.y = 0.8; dish.add(base);
  const mount = mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), clay(0xdcd6cb)); mount.position.y = 2.6; dish.add(mount);
  const bowl = new THREE.Group();
  const cup = mesh(new THREE.SphereGeometry(3.4, 40, 16, 0, Math.PI * 2, 0, 0.9), clay(0xf2eee6, { side: THREE.DoubleSide })); cup.rotation.x = Math.PI; cup.position.y = 3.3; bowl.add(cup);
  const feed = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), clay(0x8b909a)); feed.position.y = 1.4; bowl.add(feed);
  const horn = mesh(new THREE.ConeGeometry(0.25, 0.5, 12), clay(0x8b909a)); horn.position.y = 2.7; bowl.add(horn);
  bowl.position.y = 3.8; bowl.rotation.x = -0.6; dish.add(bowl);
  dish.position.copy(DISH); root.add(dish);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 2.2, 260, 24, 1, true), beamMat);
  beam.position.set(0, 133, -80); beam.rotation.x = -0.6; dish.add(beam);
  // the hut and the console
  const hut = makeHouse({ color: 0xcfd6e2, roof: 0x5a6a7e }); hut.position.set(-7, 0, -4); hut.rotation.y = 0.4; root.add(hut);
  const winGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); winGlow.position.set(-6.1, 1.5, -2.72); winGlow.rotation.y = 0.4; root.add(winGlow);
  const hutLight = new THREE.PointLight(0xffc97a, 8, 9, 1.5); hutLight.position.set(-4.5, 2, 0); root.add(hutLight);
  const desk = makeTable({ w: 1.8, d: 1, h: 1.1, color: palette.wood }); desk.position.copy(CONSOLE); root.add(desk);
  const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 128;
  const g2 = cvs.getContext('2d'); const scrTex = new THREE.CanvasTexture(cvs);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: scrTex })); scr.position.copy(CONSOLE).add(V(0, 1.75, -0.2)); root.add(scr);
  const box = mesh(new THREE.BoxGeometry(1.4, 0.8, 0.5), clay(0x5d6470)); box.position.copy(CONSOLE).add(V(0, 1.72, -0.48)); root.add(box);
  const lever = makeLever(); lever.position.copy(SWITCH); root.add(lever);

  // the sky: thousands of stars, denser in a band (the Milky Way), slowly wheeling
  const sky = new THREE.Group(); root.add(sky);
  const N = 5000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), r = seeded(77);
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (i < 2200) { const a = r() * Math.PI * 2, b = (r() - 0.5) * 0.35; x = Math.cos(a); y = Math.sin(a) * 0.55 + b; z = Math.sin(a) * 0.8 + b * 0.5; }
    else { const u = r() * 2 - 1, a = r() * Math.PI * 2; x = Math.sqrt(1 - u * u) * Math.cos(a); y = Math.abs(u) * 0.9 + 0.05; z = Math.sqrt(1 - u * u) * Math.sin(a); }
    const v = V(x, Math.abs(y), z).normalize().multiplyScalar(300);
    pos.set([v.x, v.y, v.z], i * 3);
    const w = 0.7 + r() * 0.3; col.set([w, w, 0.85 + r() * 0.15], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  sky.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, fog: false })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf2eedd, fog: false })); moon.position.set(-150, 120, -200); sky.add(moon);

  const frog = makeFrog(); root.add(frog);
  const FROG_PATH = [[-1, 0, 7], [0.8, 0, 6.2], [2.6, 0, 5.8], [4.4, 0, 6], [6.2, 0, 6.8], [8, 0, 8]];

  const S = { phase: 'explore', listened: false, lapse: -1, frogT: -1, frogDone: false, spin: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/fermi-paradox.json', 'The Fermi Paradox');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: CONSOLE.clone().add(V(0, 0, 1.2)), radius: 2.2, height: 2.4, prompt: () => (S.listened ? 'Keep listening' : 'Listen'),
    enabled: () => S.phase === 'explore' && (!S.listened || voice.said.has('ask')),
    onUse: async () => {
      if (!S.listened) { S.listened = true; await voice.say('listen'); await ctx.wait(0.8); await voice.say('stars'); await voice.say('old'); await ctx.wait(0.6); await voice.say('ask'); return; }
      S.phase = 'lapse'; S.lapse = 0; S.ending = 'listen';
      await ctx.wait(5); await voice.say('listen_end'); await ctx.wait(1); save.complete('fermi-paradox');
      ctx.gameOver({ title: 'You kept listening', text: 'Night after night, only the hiss of the stars. Maybe they are rare. Maybe they are quiet. Maybe we are early.' });
    } });
  interact.add({ pos: SWITCH.clone().add(V(0, 0, 1.2)), radius: 2.2, height: 2.4, prompt: 'Send a message', enabled: () => S.phase === 'explore' && voice.said.has('ask'),
    onUse: async () => {
      S.phase = 'send'; S.sendT = 0; await voice.say('send_1'); await ctx.wait(0.5);
      S.lapse = 0; S.ending = 'send';
      await ctx.wait(3.5); await voice.say('send_2'); await ctx.wait(1); save.complete('fermi-paradox');
      ctx.gameOver({ title: 'You called out', text: 'The message is still travelling, and will be for thousands of years. Nothing has answered yet.' });
    } });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    spawn: { x: 0, z: 7, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 20,
    blockers: () => [{ x: DISH.x, z: DISH.z, r: 1.6 }, { x: -7, z: -4, r: 2.2 }, { x: CONSOLE.x, z: CONSOLE.z, r: 1 }, { x: SWITCH.x, z: SWITCH.z, r: 0.5 }],
    update(dt, t) {
      // static on the console screen
      g2.fillStyle = '#0f2a2b'; g2.fillRect(0, 0, 256, 128); g2.strokeStyle = '#6fe0b8'; g2.lineWidth = 2; g2.beginPath();
      for (let x = 0; x < 256; x += 3) { const y = 64 + (Math.random() - 0.5) * (S.listened ? 46 : 14); x === 0 ? g2.moveTo(x, y) : g2.lineTo(x, y); }
      g2.stroke(); scrTex.needsUpdate = true;
      // the sky turns; in a time-lapse it wheels, nights flicker past
      const fast = S.lapse >= 0 ? Math.min(1, (S.lapse += dt) / 1.5) : 0;
      S.spin += dt * (0.006 + fast * 0.9);
      sky.rotation.y = S.spin; sky.rotation.z = Math.sin(S.spin * 0.2) * 0.05;
      if (S.lapse >= 0) ctx.ui.fade(0.25 * Math.abs(Math.sin(S.lapse * 9)) * fast, '#fff7e0'); else ctx.ui.fade(0);
      // the message: a beam from the dish into the sky
      if (S.sendT !== undefined) { S.sendT += dt; beamMat.opacity = 0.55 * clamp(S.sendT / 0.6) * (1 - clamp((S.sendT - 3) / 3)); bowl.rotation.x = lerp(bowl.rotation.x, -0.45, 0.02); }
      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, S.phase === 'send' ? -0.45 : 0.45, 1 - Math.exp(-dt * 8));
      if (!S.frogDone && S.listened && S.frogT < 0) S.frogT = 0;
      if (S.frogT >= 0 && !S.frogDone) { S.frogT += dt; if (S.frogT > FROG_PATH.length * 1.3 + 1) S.frogDone = true; }
      frog.visible = S.frogT >= 0 && !S.frogDone;
      if (frog.visible) animateFrog(frog, S.frogT, FROG_PATH, { loop: false });
    },
    camera(pl) {
      // low and looking slightly up, so the sky fills the top of the frame
      const mid = pl.pos.clone().lerp(V(1.5, 0, -1.5), 0.5);
      const up = S.lapse >= 0 || S.phase === 'send' ? 2.5 : 0;
      return { pos: mid.clone().add(V(-3, 4.5 + up * 0.3, 17)), look: mid.clone().add(V(0, 4.2 + up, -4)), stiffness: 1.8 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); },
  });
}
