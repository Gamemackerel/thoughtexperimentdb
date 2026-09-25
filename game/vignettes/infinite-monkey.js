// Vignette: The Infinite Monkey Theorem.
// A hall of monkeys at typewriters. Read what they've typed; pull the lever to wait a million years; read again.
// Nonsense, then a word, then two, then "To be, or not to be". Or walk out before forever arrives.
import {
  THREE, palette, clamp, lerp, seeded, clay, mesh, makeIsland, makeTable, makeFrog, animateFrog, makeLever,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const LECTERN = V(0, 0, 6.2);
const LEVER = V(6, 0, 6);
const EXIT = V(-9, 0, 6.5);
const TARGETS = ['', 'the', 'to be', 'to be, or not to be, that is the question'];

function makeMonkey() {
  const g = new THREE.Group(), body = new THREE.Group();
  const fur = clay(0x8a6446), face = clay(0xe0c09a);
  const torso = mesh(new THREE.CapsuleGeometry(0.3, 0.45, 8, 14), fur); torso.position.y = 0.62; body.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.3, 20, 14), fur); head.position.y = 1.28; body.add(head);
  const muzzle = mesh(new THREE.SphereGeometry(0.18, 16, 10), face); muzzle.scale.set(1.2, 0.85, 0.8); muzzle.position.set(0, 1.22, 0.22); body.add(muzzle);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.SphereGeometry(0.11, 12, 8), face); ear.position.set(0.3 * s, 1.34, 0); body.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), clay(palette.ink)); eye.position.set(0.1 * s, 1.36, 0.26); body.add(eye);
    const arm = mesh(new THREE.CapsuleGeometry(0.07, 0.45, 6, 10), fur); arm.position.set(0.3 * s, 0.85, 0.28); arm.rotation.x = -1.1; arm.userData.side = s; body.add(arm);
  }
  const tail = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.4, -0.25), V(0, 0.3, -0.6), V(0, 0.7, -0.9), V(0, 1, -0.7)]), 20, 0.05, 6), fur); body.add(tail);
  g.add(body); g.userData.body = body;
  g.userData.arms = body.children.filter((c) => c.userData.side);
  return g;
}

// gibberish, with the target words hidden somewhere in it (highlighted)
function page(waits, seed) {
  const r = seeded(seed), letters = 'abcdefghijklmnopqrstuvwxyz        ,.;';
  const noise = (n) => Array.from({ length: n }, () => letters[Math.floor(r() * letters.length)]).join('');
  const target = TARGETS[Math.min(waits, 3)];
  if (!target) return noise(520);
  const before = noise(Math.floor(160 + r() * 140));
  return `${before}<mark>${target}</mark>${noise(520 - before.length - target.length)}`;
}

export default function infiniteMonkey(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xf4efe6);
  stage.scene.fog = new THREE.Fog(0xf4efe6, 40, 110);
  voice.load('infinite-monkey');
  const frame = makeFramer(stage);

  root.add(makeIsland({ radius: 20, seed: 4, decor: false, color: 0xeee6d8, rim: 0xd6c9b4 }));
  const back = mesh(new THREE.BoxGeometry(30, 7, 0.4), clay(0xf7f2e8)); back.position.set(0, 3.5, -10); root.add(back);

  // rows of desks, typewriters, monkeys, and growing drifts of paper
  const monkeys = [], piles = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    const x = -7.5 + col * 5, z = -7 + row * 4;
    const desk = makeTable({ w: 1.8, d: 1, h: 1, color: palette.wood }); desk.position.set(x, 0, z); root.add(desk);
    const tw = mesh(new THREE.BoxGeometry(0.8, 0.26, 0.55), clay(palette.ink)); tw.position.set(x, 1.24, z); root.add(tw);
    const sheet = mesh(new THREE.BoxGeometry(0.55, 0.5, 0.02), clay(0xfbf6ea)); sheet.position.set(x, 1.55, z - 0.2); sheet.rotation.x = -0.2; root.add(sheet);
    const mk = makeMonkey(); mk.position.set(x, 0, z + 1.05); mk.rotation.y = Math.PI; root.add(mk); monkeys.push(mk);
    const pile = mesh(new THREE.BoxGeometry(1, 1, 0.8), clay(0xfbf6ea)); pile.position.set(x + 1.3, 0, z); pile.scale.y = 0.05; root.add(pile); piles.push(pile);
  }
  // the reading lectern, the lever, the way out
  const lect = new THREE.Group();
  const post = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.3, 12), clay(palette.wood)); post.position.y = 0.65; lect.add(post);
  const top = mesh(new THREE.BoxGeometry(1.2, 0.1, 0.9), clay(palette.wood)); top.position.y = 1.35; top.rotation.x = 0.35; lect.add(top);
  const pg = mesh(new THREE.BoxGeometry(0.55, 0.02, 0.7), clay(0xfbf6ea)); pg.position.set(0, 1.42, 0); pg.rotation.x = 0.35; lect.add(pg);
  lect.position.copy(LECTERN); root.add(lect);
  const lever = makeLever(); lever.position.copy(LEVER); root.add(lever);
  const arch = new THREE.Group(); const amat = clay(0xf2e6d4);
  for (const x of [-1, 1]) { const p = mesh(new THREE.BoxGeometry(0.3, 3, 0.4), amat); p.position.set(x, 1.5, 0); arch.add(p); }
  const lintel = mesh(new THREE.BoxGeometry(2.3, 0.3, 0.4), amat); lintel.position.y = 3.1; arch.add(lintel);
  const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.9), new THREE.MeshBasicMaterial({ color: 0xfffaf0 })); doorLight.position.y = 1.5; arch.add(doorLight);
  arch.position.copy(EXIT); arch.rotation.y = Math.PI / 2; root.add(arch);

  const frog = makeFrog(); root.add(frog);
  const FROG_PATH = [[-10, 0, -1], [-8, 0, -0.9], [-6, 0, -1.1], [-4, 0, -0.9], [-2, 0, -1.1], [0, 0, -0.9], [2, 0, -1.1], [4, 0, -0.9]];

  const S = { phase: 'explore', waits: 0, readAt: -1, waitT: -1, years: 0, frogT: -1, frogDone: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/infinite-monkey.json', 'The Infinite Monkey Theorem');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  interact.add({ pos: LECTERN, radius: 2.2, height: 2, prompt: 'Read a page', enabled: () => S.phase === 'explore',
    onUse: async () => {
      ctx.page(page(S.waits, 11 + S.waits * 7 + Math.floor(S.years)));
      S.readAt = S.waits;
      if (S.waits >= 3) { S.phase = 'over'; await ctx.wait(0.6); await voice.say('found'); await voice.say('found_2'); await ctx.wait(1); save.complete('infinite-monkey');
        return ctx.gameOver({ title: 'Given forever', text: 'Three million years of noise, and then a line of Hamlet. Nobody meant it. It was simply bound to happen.' }); }
      voice.say(['page_0', 'page_1', 'page_2'][S.waits], { once: false });
    } });
  interact.add({ pos: LEVER, radius: 2.2, height: 2, prompt: 'Wait a million years', enabled: () => S.phase === 'explore' && S.readAt >= 0,
    onUse: () => { S.phase = 'waiting'; S.waitT = 0; voice.say('wait', { once: false }); } });
  interact.add({ pos: EXIT, radius: 2.4, height: 3, prompt: 'Walk out', enabled: () => S.phase === 'explore' && voice.said.has('ask'),
    onUse: async () => { S.phase = 'over'; player.target = EXIT.clone().add(V(-3, 0, 0)); await voice.say('leave_end'); await ctx.wait(0.8); save.complete('infinite-monkey');
      ctx.gameOver({ title: 'You walked away', text: 'You never saw it happen. Almost everything they type is noise, and forever is much, much longer than it sounds.' }); } });

  (async () => { await ctx.wait(1); await voice.say('arrive'); await ctx.wait(1.5); await voice.say('typing'); await ctx.wait(2); await voice.say('ask'); })();

  return Object.assign(level, {
    spawn: { x: 0, z: 9, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z) < 18 && z > -9.2,
    blockers: () => [
      ...monkeys.map((m) => ({ x: m.position.x, z: m.position.z - 0.5, r: 1.2 })),
      { x: LECTERN.x, z: LECTERN.z, r: 0.5 }, { x: LEVER.x, z: LEVER.z, r: 0.5 },
    ],
    update(dt, t) {
      // typing: arms hammer away (faster while time is skipping)
      const speed = S.phase === 'waiting' ? 40 : 14;
      monkeys.forEach((m, i) => { m.userData.arms.forEach((a) => (a.rotation.x = -1.1 + Math.abs(Math.sin(t * speed + i + a.userData.side)) * 0.35)); m.userData.body.rotation.z = Math.sin(t * 3 + i) * 0.03; });
      // waiting a million years: the light races day-night, the paper drifts pile up
      if (S.phase === 'waiting') {
        S.waitT += dt;
        const k = clamp(S.waitT / 3.2);
        S.years += dt * (1e6 / 3.2);
        ctx.ui.fade(0.35 * Math.abs(Math.sin(S.waitT * 14)) * (1 - k), '#2b2a33');
        if (k >= 1) { S.waits++; S.phase = 'explore'; ctx.ui.fade(0); }
      }
      const grow = S.waits + (S.phase === 'waiting' ? clamp(S.waitT / 3.2) : 0);
      piles.forEach((p, i) => { p.scale.y = 0.05 + grow * (0.6 + (i % 3) * 0.15); p.position.y = p.scale.y / 2; });
      ctx.ui.label('years', clamp((7 - player.pos.distanceTo(LEVER)) / 3), `${Math.round(S.years).toLocaleString('en-GB')} years`, LEVER.clone().add(V(0, 2.2, 0)));
      // frog: once, along the aisle, after the first page
      if (!S.frogDone && S.readAt >= 0 && S.frogT < 0) S.frogT = 0;
      if (S.frogT >= 0 && !S.frogDone) { S.frogT += dt; if (S.frogT > FROG_PATH.length * 1.3 + 1) S.frogDone = true; }
      frog.visible = S.frogT >= 0 && !S.frogDone;
      if (frog.visible) animateFrog(frog, S.frogT, FROG_PATH, { loop: false });
    },
    camera(pl) { return { ...frame([pl.pos.clone(), V(0, 2, -7), V(-8, 1, -3), V(8, 1, -3), LECTERN.clone(), LEVER.clone()], { min: 14, max: 40 }), stiffness: 2.2 }; },
    dispose() { voice.stop(); ctx.ui.fade(0); },
  });
}
