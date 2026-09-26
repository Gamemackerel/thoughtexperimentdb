// Vignette: The Grandfather Paradox.
// You step out of a time machine into the town where your grandparents met. Your young grandfather walks to the
// station, where your grandmother waits. You can try to stop him — close a gate, turn the signpost, stand in his way,
// tell him who you are — and each time something ordinary gets in the way. They meet. The ending depends on whether
// you tried.
import {
  THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh,
  makeIsland, makeTree, makePerson, animatePerson, makeHouse, makeBench, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { makeFramer } from '../core/camera.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const MACHINE = V(-16, 0, 8);
const GATE = V(-5, 0, -3.2);
const SIGN = V(3, 0, -0.6);
const PLATFORM = V(15, 0, 1.5);
// grandfather's walk: from his front door, through the gate, past the fountain and the signpost, to the platform
const ROUTE = [V(-15, 0, -9), V(-9, 0, -6), V(-5, 0, -4.8), V(-5, 0, -1.8), V(-1, 0, 1.7), V(4.5, 0, 0.4), V(10, 0, 1.2), PLATFORM.clone().add(V(-1.4, 0, 0))];
// segment indices: 2 = through the gate, 4 = past the signpost

export default function grandfatherParadox(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xefe3cc);
  stage.scene.fog = new THREE.Fog(0xefe3cc, 50, 150);
  stage.renderer.domElement.style.filter = 'sepia(0.35) saturate(0.85)';      // the past is a little faded
  voice.load('grandfather-paradox');
  const frame = makeFramer(stage);

  // ================================================================ the town
  root.add(makeIsland({ radius: 28, seed: 17, decor: false }));
  const square = mesh(new THREE.CylinderGeometry(9, 9, 0.06, 48), clay(0xd9ccb3)); square.position.set(-1, 0.03, -1); square.castShadow = false; root.add(square);
  const rnd = seeded(5);
  const home = makeHouse({ color: 0xf2e6d4, roof: 0x8c4a4a }); home.position.set(-17, 0, -12); home.rotation.y = 0.6; root.add(home);
  for (const [x, z, r] of [[-20, -3, 0.2], [8, -12, -0.3], [-4, -14, 0], [20, -9, -0.6]]) { const h = makeHouse({ color: 0xe9dcc3, roof: 0xb5654e }); h.position.set(x, 0, z); h.rotation.y = r; root.add(h); }
  for (let i = 0; i < 10; i++) { const t = makeTree(0.9 + rnd() * 0.6, rnd); const a = rnd() * 6.28, r = 19 + rnd() * 6; t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); root.add(t); }
  // fountain
  const basin = mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.6, 32), clay(0xcfc3ad)); basin.position.set(-1, 0.3, -1);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.05, 32), clay(0x9cc0d0, { roughness: 0.2 })); water.position.set(-1, 0.58, -1);
  const spout = mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 12), clay(0xcfc3ad)); spout.position.set(-1, 1, -1);
  root.add(basin, water, spout);
  // garden gate (can be closed), fence either side
  const gatePivot = new THREE.Group(); gatePivot.position.copy(GATE).add(V(-0.8, 0, 0));
  const gmat = clay(0x6b4a33);
  for (let i = 0; i < 5; i++) { const b = mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), gmat); b.position.set(0.15 + i * 0.32, 0.65, 0); gatePivot.add(b); }
  const gr = mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), gmat); gr.position.set(0.8, 1.1, 0); gatePivot.add(gr);
  root.add(gatePivot);
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) { const post = mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), gmat); post.position.set(GATE.x + side * (1.1 + i * 0.9), 0.55, GATE.z); root.add(post); }
  for (const side of [-1, 1]) { const rail = mesh(new THREE.BoxGeometry(5, 0.08, 0.08), gmat); rail.position.set(GATE.x + side * 3.4, 0.9, GATE.z); root.add(rail); }
  // signpost (can be turned)
  const sign = new THREE.Group(); const spost = mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), gmat); spost.position.y = 1.2; sign.add(spost);
  const arm = mesh(new THREE.BoxGeometry(1.4, 0.3, 0.06), clay(0xf2e6d4)); arm.position.set(0.6, 2.1, 0); sign.add(arm);
  const tip = mesh(new THREE.ConeGeometry(0.17, 0.3, 3), clay(0xf2e6d4)); tip.rotation.z = -Math.PI / 2; tip.position.set(1.42, 2.1, 0); sign.add(tip);
  sign.position.copy(SIGN); root.add(sign);
  // station: platform, a little shelter, a bench, and your grandmother
  const plat = mesh(new THREE.BoxGeometry(6, 0.4, 3), clay(0xcfc3ad)); plat.position.copy(PLATFORM).add(V(1.5, 0.2, 0)); root.add(plat);
  const shelter = makeHouse({ color: 0xe9dcc3, roof: 0x3f8f86 }); shelter.scale.setScalar(0.7); shelter.position.copy(PLATFORM).add(V(3, 0.4, -2.2)); root.add(shelter);
  const bench = makeBench(); bench.position.copy(PLATFORM).add(V(0.8, 0.4, 0.4)); bench.rotation.y = -Math.PI / 2; root.add(bench);
  for (const z of [-2.3, -1.1]) { const r = mesh(new THREE.BoxGeometry(30, 0.1, 0.12), clay(palette.rail, { metalness: 0.4 })); r.position.set(12, 0.1, PLATFORM.z + 2.5 + z * 0.5 + 1); root.add(r); }
  const grandma = makePerson({ color: palette.judge, robe: true }); grandma.position.copy(PLATFORM).add(V(1, 0.4, 0.9)); grandma.rotation.y = -Math.PI / 2; root.add(grandma);
  const grandpa = makePerson({ color: palette.one });
  const hat = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.3, 16), clay(palette.ink)); hat.position.y = 1.98; grandpa.userData.body.add(hat);
  const brim = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 20), clay(palette.ink)); brim.position.y = 1.84; grandpa.userData.body.add(brim);
  grandpa.position.copy(ROUTE[0]); root.add(grandpa);
  // the time machine: a teal cabinet with a dial
  const tm = new THREE.Group();
  const cab = mesh(new THREE.BoxGeometry(1.6, 2.8, 1.6), clay(palette.agent)); cab.position.y = 1.4; tm.add(cab);
  const top = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe9a0, emissiveIntensity: 1.2 })); top.position.y = 3; tm.add(top);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: 0xf6efe0 })); dial.position.set(0, 1.9, 0.81); tm.add(dial);
  tm.position.copy(MACHINE); tm.rotation.y = 0.4; root.add(tm);

  // a paper stand by the square, and the man who sells the papers
  const STAND = V(-8.2, 0, 3.6);
  const stand = new THREE.Group();
  const counter = mesh(new THREE.BoxGeometry(1.8, 1, 0.8), clay(0x8c4a4a)); counter.position.y = 0.5; stand.add(counter);
  const awning = mesh(new THREE.BoxGeometry(2.1, 0.08, 1.2), clay(0xf2e6d4)); awning.position.set(0, 2.3, 0.1); awning.rotation.x = 0.15; stand.add(awning);
  for (const x of [-0.95, 0.95]) { const p = mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), clay(palette.ink)); p.position.set(x, 1.15, -0.3); stand.add(p); }
  for (let i = 0; i < 3; i++) { const pile = mesh(new THREE.BoxGeometry(0.46, 0.12 + i * 0.05, 0.34), clay(0xf6f0e2)); pile.position.set(-0.55 + i * 0.55, 1.06 + i * 0.025, 0.1); stand.add(pile); }
  stand.position.copy(STAND); stand.rotation.y = 0.5; root.add(stand);
  const vendor = makePerson({ color: 0x9a7453, hat: true }); vendor.position.copy(STAND).add(V(-0.45, 0, -0.9)); vendor.rotation.y = 0.5; root.add(vendor);

  // the frog hops across the square, stops, then rewinds (hopping backwards along the same path) and goes the other way
  const frog = makeFrog(); root.add(frog);
  const cameo = frogCameo(frog, [[-4.5, 5.2], [-3, 3.6], [-1.4, 2.8], [0.2, 2.9], { wait: 0.9 },
    { at: [-1.4, 2.8], back: true, speed: 1.4 }, { at: [-3, 3.6], back: true, speed: 1.4 }, { at: [-4.5, 5.2], back: true, speed: 1.4 }, { wait: 0.7 },
    { face: [-2, 7] }, [-3.4, 6.6], [-2.2, 8.2], [-1, 9.8], [0.2, 11.4]]);

  // ================================================================ state
  // phases: intro (he waits at his door until you've heard the question) → walk → met → (the clock turns back) walk … → over
  const S = { phase: 'intro', walk: 1, seg: 0, u: 0, attempts: new Set(), gateClosed: false, signTurned: false, pause: 0, met: false, hasGun: false, firedThisWalk: false, blockT: 0, tellT: -9 };
  const WALKS = 3;

  // a pistol, left on a crate by the time machine (it jams: it never fires)
  const crate = mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), clay(0x8a6443)); crate.position.copy(MACHINE).add(V(1.9, 0.3, -0.7)); root.add(crate);
  const pistol = new THREE.Group(); const grip = mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), clay(0x2b2a33)); grip.position.y = -0.08; grip.rotation.z = 0.25; pistol.add(grip);
  const barrel = mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), clay(0x3a3a42)); barrel.position.set(0.1, 0.02, 0); pistol.add(barrel);
  pistol.position.copy(crate.position).add(V(0, 0.36, 0)); root.add(pistol);
  function resetWalk() {
    S.seg = 0; S.u = 0; S.gateClosed = false; S.signTurned = false; S.gateBlew = false; S.signIgnored = false; S.gateOpenT = undefined; S.met = false; S.firedThisWalk = false; S.recognised = false;
    grandpa.position.copy(ROUTE[0]); grandpa.rotation.set(0, 0, 0);
  }
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/grandfather-paradox.json', 'The Grandfather Paradox');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  const tried = (what, line) => { S.attempts.add(what); voice.say(line, { once: false, urgent: true }); };   // a reaction lands on its action

  const open = () => S.phase === 'walk' || S.phase === 'intro';
  interact.add({ pos: GATE.clone().add(V(0, 0, 1.2)), radius: 2.4, height: 1.8, prompt: 'Close the gate', enabled: () => open() && !S.gateClosed && (S.seg < 2 || (S.seg === 2 && S.u < 0.3)),
    onUse: () => { S.gateClosed = true; S.attempts.add('gate'); } });
  interact.add({ pos: SIGN.clone().add(V(0, 0, 1)), radius: 2.4, height: 2.6, prompt: 'Turn the signpost', enabled: () => open() && !S.signTurned && S.seg < 5,
    onUse: () => { S.signTurned = true; S.attempts.add('sign'); } });
  interact.add({ pos: () => grandpa.position, radius: 2.2, height: 2.4, prompt: 'Tell him who you are', enabled: () => S.phase === 'walk' && S.seg < ROUTE.length - 2 && S.tellT < -1,
    onUse: () => { S.pause = 2.5; S.tellT = 2; ctx.speak(grandpa, 'Ha! Good one, pal.', { offset: [0, 2.6, 0] }); tried('tell', 'tell_fail'); } });
  interact.add({ pos: crate.position, radius: 1.6, height: 1.4, prompt: 'Take the pistol', enabled: () => open() && !S.hasGun,
    onUse: () => { S.hasGun = true; pistol.position.set(0.42, 1.1, 0.28); pistol.rotation.set(0, -Math.PI / 2, 0); player.obj.add(pistol); } });
  interact.add({ pos: () => grandpa.position, radius: 6, height: 2.8, prompt: 'Fire the pistol', enabled: () => S.phase === 'walk' && S.hasGun && !S.firedThisWalk && S.tellT < -1,
    onUse: () => { S.firedThisWalk = true; ctx.speak(player.obj, '…click.', { offset: [0, 2.4, 0] }); tried('gun', 'gun_fail'); } });
  interact.add({ pos: MACHINE.clone().add(V(1.2, 0, 1.2)), radius: 2.4, height: 3, prompt: 'Go home', terminal: true, enabled: () => S.phase === 'walk',
    onUse: () => end(false, true) });

  // asides: the paper seller, the paper, and your grandmother (who is waiting for someone)
  talk(ctx, { who: vendor, radius: 2.4, enabled: () => S.phase === 'walk', lines: ['Paper! Read all about it!', 'Nothing ever happens round here. Lovely, isn\'t it?', "You're not from round here. It's something about your shoes."] });
  look(ctx, { pos: STAND.clone().add(V(0.4, 0, 0.9)), radius: 1.8, height: 1.8, prompt: 'Read the paper', lines: ['paper'], enabled: () => S.phase === 'walk' });
  talk(ctx, { who: grandma, radius: 2.2, enabled: () => S.phase === 'walk' && !S.met, lines: ["I'm waiting for someone. I think.", 'Have we met? You have a familiar face.', 'The train is late. It always is.'] });

  // they meet: the first two times, the clock turns back and he's at his door again; the third time, it ends
  async function met() {
    S.phase = 'met'; S.met = true;
    await ctx.wait(0.4); await voice.say('met', { once: false }); await ctx.wait(1.5);
    if (S.walk >= WALKS) return end(true);
    S.phase = 'rewind'; S.rewT = 0; await ctx.wait(2.2);
    resetWalk(); player.place(MACHINE.x + 1.5, MACHINE.z + 1.5, Math.PI * 0.8); S.walk++;
    S.phase = 'walk'; await voice.say(S.walk === 2 ? 'again' : 'again_2', { once: false });
  }
  const WHY = { gate: 'the wind', sign: 'habit', tell: 'a laugh', block: 'good manners', gun: 'a jammed pistol' };
  const list = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
  async function end(met, leftEarly = false) {
    if (S.phase === 'over') return;
    S.phase = 'over';
    const triedAny = S.attempts.size > 0, n = S.attempts.size;
    if (triedAny) { await voice.say('tried_1'); await voice.say('tried_2'); await ctx.wait(0.4); await voice.say('in_a_sense'); }
    else { await voice.say('watched_1'); await voice.say('watched_2'); }
    await ctx.wait(1);
    save.complete('grandfather-paradox');
    const why = [...S.attempts].map((a) => WHY[a]);
    ctx.gameOver(triedAny
      ? { title: 'It had already happened', text: `You tried ${['', 'once', 'two ways', 'three ways', 'four ways', 'five ways'][n]}, and each time something ordinary got in the way: ${list(why)}. You could have stopped him, in a sense. You just didn't.` }
      : { title: leftEarly ? 'You left the past alone' : 'You let it be', text: 'You came all this way and changed nothing. Maybe that is the only way the story holds together.' });
  }

  // he waits at his door, checking his watch, until you've heard what's at stake; then he sets off
  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6); await voice.say('see_gf'); await voice.say('see_gm');
    await ctx.wait(0.5); await voice.say('ask'); await voice.say('try');
    S.phase = 'walk';
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: MACHINE.x + 1.5, z: MACHINE.z + 1.5, rotY: Math.PI * 0.8 },
    walkable: (x, z) => Math.hypot(x, z) < 26,
    blockers: () => [{ x: -1, z: -1, r: 1.9 }, { x: SIGN.x, z: SIGN.z, r: 0.3 }, { x: MACHINE.x, z: MACHINE.z, r: 1.2 },
      { x: grandma.position.x, z: grandma.position.z, r: 0.5 }, { x: STAND.x, z: STAND.z, r: 1 }, { x: vendor.position.x, z: vendor.position.z, r: 0.45 },
      ...[-1, 1].map((sd) => ({ x: GATE.x + sd * 3.4, z: GATE.z, w: 5.2, d: 0.35 })), { x: crate.position.x, z: crate.position.z, r: 0.5 }],
    dispose() { voice.stop(); stage.renderer.domElement.style.filter = ''; ctx.ui.rewind(0); player.obj.remove(pistol); },

    update(dt, t) {
      // ---- grandfather's walk (he waits for no one; each obstacle fails for an ordinary reason)
      if (S.phase === 'walk') {
        if (S.pause > 0) S.pause -= dt;
        else {
          const a = ROUTE[S.seg], b = ROUTE[S.seg + 1];
          // the gate: if closed as he arrives, a gust swings it open again
          if (S.seg === 2 && S.gateClosed && S.u > 0.3 && !S.gateBlew) { S.gateBlew = true; S.pause = 1.2; S.gateOpenT = 0; voice.say('gate_fail', { once: false }); }
          // the signpost: he glances past it
          if (S.seg === 4 && S.signTurned && S.u > 0.6 && !S.signIgnored) { S.signIgnored = true; S.pause = 0.8; voice.say('sign_fail', { once: false }); }
          // standing in his way: he steps around you
          const ahead = b.clone().sub(grandpa.position).setY(0).normalize();
          const toYou = player.pos.clone().sub(grandpa.position).setY(0);
          let step = ahead.clone();
          if (toYou.length() < 1.6 && toYou.dot(ahead) > 0) {
            step.add(V(-ahead.z, 0, ahead.x).multiplyScalar(toYou.cross(ahead).y > 0 ? 1.2 : -1.2)).normalize();
            // it only counts as blocking him if you stood still in his way (not if you were telling him something)
            S.blockT = player.vel.length() < 0.4 && S.tellT < -2 ? S.blockT + dt : 0;
            if (S.blockT > 0.8 && !S.blocked) { S.blocked = true; tried('block', 'block_fail'); }
          } else { S.blockT = 0; S.blocked = false; }
          if (S.walk > 1 && !S.recognised && toYou.length() < 3) { S.recognised = true; ctx.speak(grandpa, 'Have we met?', { offset: [0, 2.6, 0] }); }
          grandpa.position.addScaledVector(step, dt * 0.95);
          grandpa.rotation.y = Math.atan2(step.x, step.z);
          const segLen = a.distanceTo(b); S.u = clamp(1 - grandpa.position.distanceTo(b) / segLen);
          if (grandpa.position.distanceTo(b) < 0.35) { S.seg++; S.u = 0; if (S.seg === 3) S.pause = 2.5; }   // a pause by the fountain
          if (S.seg >= ROUTE.length - 1) met();
        }
        animatePerson(grandpa, t * 1.6, { energy: S.pause > 0 ? 0.3 : 1.2 });
      } else if (S.phase === 'intro') { grandpa.rotation.y = Math.sin(t * 0.7) * 0.4; animatePerson(grandpa, t, { energy: 0.3 }); }
      S.tellT -= dt;
      ctx.ui.rewind(S.phase === 'rewind' ? Math.min(1, (S.rewT += dt) / 0.3, (2.2 - S.rewT) / 0.3) : 0, t);
      if (S.met) { grandpa.rotation.y = lerp(grandpa.rotation.y, Math.PI / 2, 0.05); grandma.rotation.y = lerp(grandma.rotation.y, -Math.PI / 2, 0.05); }
      animatePerson(grandma, t, { energy: 0.3 });
      // gate + signpost animation
      if (S.gateOpenT !== undefined) S.gateOpenT += dt;
      const shut = S.gateClosed && !(S.gateOpenT > 0) ? 1 : 0;
      gatePivot.rotation.y = lerp(gatePivot.rotation.y, shut ? 0 : -1.4 + (S.gateOpenT !== undefined ? Math.sin(S.gateOpenT * 6) * 0.2 * Math.exp(-S.gateOpenT) : 0), 1 - Math.exp(-dt * 6));
      sign.rotation.y = lerp(sign.rotation.y, S.signTurned ? Math.PI : 0, 1 - Math.exp(-dt * 5));
      top.material.emissiveIntensity = 1 + 0.5 * Math.sin(t * 4);
      water.position.y = 0.58 + Math.sin(t * 2) * 0.01;
      // frog: once, across the square while he walks
      if (S.seg >= 3 && S.walk === 1) cameo.start();
      cameo.update(dt);
      animatePerson(vendor, t, { energy: 0.25 });
    },

    camera(pl) {
      const pts = [pl.pos.clone(), grandpa.position.clone().add(V(0, 2, 0))];
      if (S.seg >= 3 || S.met) pts.push(grandma.position.clone().add(V(0, 2, 0)));
      else pts.push(GATE.clone());
      return { ...frame(pts, { min: 14, max: 42 }), stiffness: 2.2 };
    },
  });
}
