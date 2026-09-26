// Vignette: The Fermi Paradox.
// A hilltop at night under more stars than anyone could count. A radio dish, a receiver full of static. Listen; then
// sit in the chair and keep listening (or simply don't call), or pull the lever and send a message into the dark.
// Either way: years of silence.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeHouse, makeTable, makeLever, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DISH = V(5, 0, -4);
const CONSOLE = V(-3.5, 0, 0.5);
const SWITCH = V(7, 0, 0.2);
const CHAIR = V(0.6, 0, 3.4);
const SCOPE = V(-6.8, 0, 4.2);
const MOON = V(-36, 27, -80);
const NIGHT = 0x0e1426, DAWN = 0x4a5f8e;
const WAIT_AFTER_ASK = 3.5, IDLE_LIMIT = 45;        // the choice opens a moment after the question; doing nothing = listening

export default function fermiParadox(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  const bg = new THREE.Color(NIGHT);
  stage.scene.background = bg;
  stage.scene.fog = new THREE.Fog(NIGHT, 70, 400);
  stage.hemi.intensity = 0.55; stage.hemi.color.set(0x9fb2e0); stage.sun.intensity = 0.9; stage.sun.color.set(0xc8d4ff);
  voice.load('fermi-paradox');
  const replay = save.done.has('fermi-paradox');

  root.add(makeIsland({ radius: 22, seed: 19, color: 0x7d8b7a, rim: 0x5c6a5e }));
  // the radio dish, its concave face turned up and towards you, aimed at the sky over the moon
  const dish = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 16), clay(0xdcd6cb)); base.position.y = 0.8; dish.add(base);
  const mount = mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), clay(0xdcd6cb)); mount.position.y = 2.6; dish.add(mount);
  const bowl = new THREE.Group();
  const cup = mesh(new THREE.SphereGeometry(3.4, 40, 16, 0, Math.PI * 2, 0, 0.9), clay(0xf2eee6, { side: THREE.DoubleSide })); cup.rotation.x = Math.PI; cup.position.y = 3.3; bowl.add(cup);
  const feed = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), clay(0x8b909a)); feed.position.y = 1.4; bowl.add(feed);
  for (let i = 0; i < 3; i++) {                                              // struts from the rim to the feed horn
    const a = (i / 3) * Math.PI * 2, rim = V(Math.cos(a) * 2.6, 1.1, Math.sin(a) * 2.6), tip = V(0, 2.6, 0);
    const st = mesh(new THREE.CylinderGeometry(0.03, 0.03, rim.distanceTo(tip), 5), clay(0x8b909a));
    st.position.copy(rim).lerp(tip, 0.5); st.quaternion.setFromUnitVectors(V(0, 1, 0), tip.clone().sub(rim).normalize()); bowl.add(st);
  }
  const horn = mesh(new THREE.ConeGeometry(0.25, 0.5, 12), clay(0x8b909a)); horn.position.y = 2.7; bowl.add(horn);
  const AIM = V(-0.35, 0.85, 0.4).normalize(), AIM_SEND = V(-0.45, 0.85, 0.25).normalize();
  bowl.position.y = 3.8; bowl.quaternion.setFromUnitVectors(V(0, 1, 0), AIM); dish.add(bowl);
  dish.position.copy(DISH); root.add(dish);
  // the message: a beam from the feed horn, and rings of signal travelling up it
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3, 0.28, 120, 24, 1, true), beamMat); beam.position.y = 2.9 + 60; bowl.add(beam);
  const rings = [...Array(5)].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; bowl.add(m); return m;
  });
  // the hut and the receiver
  const hut = makeHouse({ color: 0xcfd6e2, roof: 0x5a6a7e }); hut.position.set(-7, 0, -4); hut.rotation.y = 0.4; root.add(hut);
  const winGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); winGlow.position.set(-6.1, 1.5, -2.7); winGlow.rotation.y = 0.4; root.add(winGlow);
  const hutLight = new THREE.PointLight(0xffc97a, 8, 9, 1.5); hutLight.position.set(-4.5, 2, 0); root.add(hutLight);
  const desk = makeTable({ w: 1.8, d: 1, h: 1.1, color: palette.wood }); desk.position.copy(CONSOLE); root.add(desk);
  const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 128;
  const g2 = cvs.getContext('2d'); const scrTex = new THREE.CanvasTexture(cvs);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: scrTex })); scr.position.copy(CONSOLE).add(V(0, 1.75, -0.22)); root.add(scr);
  const box = mesh(new THREE.BoxGeometry(1.4, 0.8, 0.5), clay(0x5d6470)); box.position.copy(CONSOLE).add(V(0, 1.72, -0.48)); root.add(box);
  const lever = makeLever(); lever.position.copy(SWITCH); lever.rotation.y = -0.4; root.add(lever);

  // the sky: thousands of stars, denser in a band (the Milky Way) that crosses the sky in front of you, slowly wheeling
  const sky = new THREE.Group(); root.add(sky);
  const r = seeded(77);
  const stars = (n, size, band) => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      let v;
      if (i < band) { const a = r() * Math.PI * 2, b = (r() - 0.5) * 0.3; v = V(Math.cos(a), 0.25 + Math.sin(a) * 0.6 + b, -Math.abs(Math.sin(a)) * 0.9 + b * 0.5); }
      else { const u = r() * 2 - 1, a = r() * Math.PI * 2; v = V(Math.sqrt(1 - u * u) * Math.cos(a), Math.abs(u) * 0.9 + 0.05, Math.sqrt(1 - u * u) * Math.sin(a)); }
      v.y = Math.abs(v.y) + 0.02; v.normalize().multiplyScalar(300); pos.set([v.x, v.y, v.z], i * 3);
      const w = 0.7 + r() * 0.3; col.set([w, w, 0.85 + r() * 0.15], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    sky.add(new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false })));
  };
  stars(5000, 1.6, 2400); stars(700, 2.4, 200); stars(90, 3.6, 0);
  // the moon, low over the hill, up in the top left of the picture
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf2eedd, fog: false })); moon.position.copy(MOON); root.add(moon);

  // a crate by the hut with the logbook and a mug on it; a folding chair facing the moon; a telescope on the brow of the hill
  const CRATE = V(-6.2, 0, 0.8);
  const crate = mesh(new THREE.BoxGeometry(1, 0.8, 0.8), clay(palette.wood)); crate.position.copy(CRATE).setY(0.4); root.add(crate);
  const log = mesh(new THREE.BoxGeometry(0.5, 0.08, 0.36), clay(0x8c4a4a)); log.position.copy(CRATE).add(V(-0.15, 0.84, 0)); log.rotation.y = 0.3; root.add(log);
  const logs = [];                                                            // the years pile up, one logbook each
  const mug = mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.2, 12), clay(0xf2e6d4)); mug.position.copy(CRATE).add(V(0.3, 0.9, 0.1)); root.add(mug);
  const chair = new THREE.Group(); const cmat = clay(0x3f8f86);
  const seat = mesh(new THREE.BoxGeometry(0.8, 0.08, 0.7), cmat); seat.position.y = 0.5; chair.add(seat);
  const cback = mesh(new THREE.BoxGeometry(0.8, 0.9, 0.08), cmat); cback.position.set(0, 0.95, 0.38); cback.rotation.x = -0.35; chair.add(cback);
  for (const [x, z] of [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), clay(0xdcd6cb)); l.position.set(x, 0.25, z); chair.add(l); }
  const CHAIR_ROT = Math.atan2(MOON.x - CHAIR.x, MOON.z - CHAIR.z);           // it faces the moon
  chair.position.copy(CHAIR); chair.rotation.y = CHAIR_ROT + Math.PI; root.add(chair);
  const scope = new THREE.Group(); const brass = clay(0xb08d57), iron = clay(0x4a4a50);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2, l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), iron); l.position.set(Math.cos(a) * 0.3, 0.7, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); scope.add(l); }
  const tube = mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.5, 16), brass); tube.position.y = 1.45;
  tube.quaternion.setFromUnitVectors(V(0, 1, 0), MOON.clone().sub(SCOPE).normalize()); scope.add(tube);
  scope.position.copy(SCOPE); root.add(scope);

  // the frog crosses between the receiver and the dish, sits, looks up at a shooting star, watches it go, and hops off
  const frog = makeFrog(); root.add(frog);
  const meteor = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.9, 26, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  meteor.rotation.z = 1.25; root.add(meteor);
  const cameo = frogCameo(frog, [[-8, 5], [-6.2, 3.6], [-4.4, 2.8], [-2.4, 2.4], [-0.6, 2.2], { face: [-30, -60] },
    { wait: 4.2, act: (f, u) => {
      f.userData.body.rotation.x = -0.45 * Math.sin(Math.PI * clamp(u * 1.3));        // looks up
      const m = clamp((u - 0.3) / 0.28);
      meteor.material.opacity = m > 0 && m < 1 ? 0.9 * Math.sin(Math.PI * m) : 0;
      meteor.position.set(lerp(-80, 40, m), lerp(88, 66, m), -170);
      f.rotation.y = Math.atan2(-30 + 0.6, -60 - 2.2) + (m > 0 ? 0.6 * m : 0);        // and follows it
    } }, [1.2, 2], [3, 2.2], [4.6, 2.9], [6.4, 3.8], [8.4, 5]]);

  const S = { phase: 'explore', listened: false, asked: false, open: false, idle: 0, lapse: -1, spin: 0, blip: 0 };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/fermi-paradox.json', 'The Fermi Paradox');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  const notYet = () => voice.say('not_yet', { once: false, urgent: true, when: () => !S.open });
  const years = (n) => { for (let i = logs.length; i < n; i++) { const b = mesh(new THREE.BoxGeometry(0.5, 0.07, 0.36), clay([0x8c4a4a, 0x4a5f8c, 0x6a7a5a][i % 3])); b.position.copy(CRATE).add(V(0.05 * Math.sin(i * 2.1) - 0.15, 0.92 + i * 0.07, 0.04 * Math.cos(i * 1.3))); b.rotation.y = 0.3 + Math.sin(i * 3.7) * 0.2; root.add(b); logs.push(b); } };

  // keeping on listening: nights become years, with one "maybe" at a time
  async function keepListening(seated) {
    if (S.phase !== 'explore') return;
    S.phase = 'lapse'; S.ending = 'listen';
    if (seated) { player.place(CHAIR.x, CHAIR.z, CHAIR_ROT); player.sit(true); S.seated = true; }
    else { player.enabled = false; player.target = null; }                    // (stand where you are; the years go by)
    await voice.say('keep', { urgent: true }); S.lapse = 0;
    await ctx.wait(2.5); await voice.say('year_1');
    await ctx.wait(4); await voice.say('year_10');
    await ctx.wait(4); await voice.say('year_40');
    await ctx.wait(3); save.complete('fermi-paradox');
    ctx.gameOver({ title: 'You kept listening', text: 'Forty years of logbooks, one line a night, and every line the same. The question is still open.' });
  }

  interact.add({ pos: CONSOLE.clone().add(V(0, 0, 1.2)), radius: 2.2, height: 2.4, prompt: () => (S.listened ? 'Listen again' : 'Listen'),
    enabled: () => S.phase === 'explore' && (!S.listened || (S.open && !voice.said.has('static_again'))),
    onUse: async () => {
      if (S.listened) { voice.say('static_again'); return; }
      S.listened = true; await voice.say('listen'); await ctx.wait(0.8); await voice.say('stars'); await voice.say('old'); await ctx.wait(0.6);
      await voice.say('ask'); S.asked = true;
      await ctx.wait(WAIT_AFTER_ASK); S.open = true; S.idle = 0; voice.say('choose');
    } });
  interact.add({ pos: CHAIR.clone().add(V(0.2, 0, 0.9)), radius: 1.8, height: 1.8, terminal: true,
    prompt: () => (S.open ? 'Sit and keep listening' : 'Sit down'), enabled: () => S.phase === 'explore',
    onUse: () => (S.open ? keepListening(true) : notYet()) });
  interact.add({ pos: SWITCH.clone().add(V(-0.4, 0, 1.1)), radius: 2, height: 2.4, terminal: true, prompt: 'Send a message', enabled: () => S.phase === 'explore',
    onUse: async () => {
      if (!S.open) return notYet();
      S.phase = 'send'; S.ending = 'send'; S.sendT = 0; player.enabled = false; player.target = null;
      await voice.say('send_1', { urgent: true }); await ctx.wait(2.5);
      S.lapse = 0; await voice.say('send_2');
      await ctx.wait(3.5); await voice.say('send_3');
      await ctx.wait(3.5); await voice.say('send_4');
      S.blip = 2.4; await ctx.wait(3); save.complete('fermi-paradox');
      ctx.gameOver({ title: 'You called out', text: 'The message is still travelling, and will be for thousands of years. Whoever hears it will know where it came from.' });
    } });

  // asides: the logbook, the cold tea, and the moon through the telescope
  look(ctx, { pos: CRATE.clone().add(V(0.5, 0, 1)), radius: 1.7, height: 1.6, prompt: 'Read the logbook', lines: [replay ? 'logbook_again' : 'logbook'], enabled: () => S.phase === 'explore' });
  look(ctx, { pos: CRATE.clone().add(V(1.3, 0, 0.1)), radius: 1.2, height: 1.6, prompt: 'Drink the tea', lines: ['tea'], enabled: () => S.phase === 'explore' });
  look(ctx, { pos: SCOPE.clone().add(V(0.3, 0, 0.8)), radius: 1.8, height: 2, prompt: 'Look through the telescope', lines: ['moon'], enabled: () => S.phase === 'explore' });

  (async () => {
    await ctx.wait(1); await voice.say('arrive');
    await ctx.wait(14); voice.say('arrive_2', { when: () => !S.listened });
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 7, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x - 0.5, z + 0.5) < 11.5,
    blockers: () => [
      { x: CRATE.x, z: CRATE.z, w: 1.1, d: 0.9 }, { x: CHAIR.x, z: CHAIR.z, r: 0.5 }, { x: DISH.x, z: DISH.z, r: 1.6 }, { x: -7, z: -4, w: 4.6, d: 4, rot: 0.4 },
      { x: CONSOLE.x, z: CONSOLE.z, w: 2, d: 1.2 }, { x: SWITCH.x, z: SWITCH.z, r: 0.5 }, { x: SCOPE.x, z: SCOPE.z, r: 0.5 },
    ],
    update(dt, t) {
      // static on the receiver's screen (and, at the very end of the send ending, something regular. Maybe.)
      if (S.blip > 0) S.blip -= dt;
      g2.fillStyle = '#0f2a2b'; g2.fillRect(0, 0, 256, 128); g2.strokeStyle = '#6fe0b8'; g2.lineWidth = 2; g2.beginPath();
      for (let x = 0; x < 256; x += 3) {
        const pulse = S.blip > 0 && (x + Math.floor(t * 90)) % 64 < 4 ? -30 : 0;
        const y = 64 + (Math.random() - 0.5) * (S.listened ? 46 : 14) + pulse; x === 0 ? g2.moveTo(x, y) : g2.lineTo(x, y);
      }
      g2.stroke(); scrTex.needsUpdate = true;
      // after the question, doing nothing is also an answer
      if (S.open && S.phase === 'explore') {
        const moving = player.vel ? player.vel.lengthSq() > 0.01 : false;
        S.idle = moving ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) keepListening(false);
      }
      // the sky turns; in a time-lapse it wheels, and quick dawns wash over it; the logbooks pile up
      const fast = S.lapse >= 0 ? Math.min(1, (S.lapse += dt) / 2) : 0;
      S.spin += dt * (0.006 + fast * 0.7);
      sky.rotation.y = S.spin; sky.rotation.z = Math.sin(S.spin * 0.2) * 0.05;
      const dawn = S.lapse >= 0 ? fast * 0.7 * Math.pow(Math.abs(Math.sin(S.lapse * 1.6)), 4) : 0;
      bg.set(NIGHT).lerp(new THREE.Color(DAWN), dawn); stage.scene.fog.color.copy(bg);
      stage.hemi.intensity = 0.55 + dawn * 0.5;
      if (S.lapse >= 0 && S.ending === 'listen') years(Math.min(14, Math.floor(S.lapse / 1.2)));
      // the message: the dish turns up a little; a beam from the feed horn, with rings of signal climbing it
      if (S.sendT !== undefined) {
        S.sendT += dt;
        bowl.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), AIM_SEND), 1 - Math.exp(-dt * 1.5));
        beamMat.opacity = 0.28 * clamp((S.sendT - 0.6) / 0.8) * (1 - 0.6 * clamp((S.sendT - 8) / 4));
        rings.forEach((m, i) => {
          const u = ((S.sendT - 0.6) * 0.22 + i / rings.length) % 1, on = S.sendT < 14;
          m.position.y = 3 + u * 110; m.scale.setScalar(0.6 + u * 3);
          m.material.opacity = on ? 0.7 * (1 - u) * clamp((S.sendT - 0.6) * 2) : 0;
        });
      }
      lever.userData.pivot.rotation.z = lerp(lever.userData.pivot.rotation.z, S.phase === 'send' ? -0.45 : 0.45, 1 - Math.exp(-dt * 8));
      if (S.seated) player.pos.y = 0.08;
      if (S.listened) cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      // wide and low, the sky filling the top of the frame and you small in the lower third
      const mid = pl.pos.clone().setY(0).lerp(V(1, 0, -1), 0.5);
      let pos = mid.clone().add(V(-3, 4.2, 25)), look = mid.clone().add(V(0, 4.8, -4));
      if (S.lapse >= 0) { const u = easeInOut(clamp(S.lapse / 3)); pos.add(V(0, 0.6 * u, 7 * u)); look.add(V(0, 2.2 * u, 0)); }
      if (S.sendT !== undefined && S.lapse < 0) {
        // follow the message up out of the dish
        const u = easeInOut(clamp(S.sendT / 5)), dir = V(0, 1, 0).applyQuaternion(bowl.quaternion);
        const hornW = V(0, 2.9, 0).applyMatrix4(bowl.matrixWorld);
        look = look.lerp(hornW.addScaledVector(dir, 8 + 22 * u), 0.8 * clamp(S.sendT / 1.2));
      }
      return { pos, look, stiffness: 1.8 };
    },
    dispose() { voice.stop(); ctx.ui.fade(0); player.sit(false); player.pos.y = 0; },
  });
}
