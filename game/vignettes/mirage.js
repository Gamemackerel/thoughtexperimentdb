// Vignette: Dharmottara's Mirage (a Gettier case, twelve centuries before Gettier).
// The desert. You've been walking since dawn, and your water ran out hours ago. Up ahead, shimmering blue: water. You
// walk towards it, and it goes: a mirage. But there's a rock just there. Lift it, and there's water under it after all;
// or turn back, thirsty, and never know you were right.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeFrog, makeRock } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';
import { canvasTexture } from '../core/brush.js';
import { beliefCard } from '../core/gettier.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SPOT = V(0, 0, -12);
const ROCK = V(1.4, 0, -12.6);
const IDLE_LIMIT = 50;

export default function mirage(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xf2dfb8);
  stage.scene.fog = new THREE.Fog(0xf2dfb8, 30, 120);
  stage.hemi.color.set(0xfff0d0); stage.sun.color.set(0xfff0c8); stage.sun.intensity = 2.8;
  voice.load('mirage');
  const rnd = seeded(770);

  // ---- the desert: pale sand, dunes, scattered stones, a thorn tree or two, hills on the horizon
  const sand = mesh(new THREE.CylinderGeometry(60, 60, 0.6, 64), clay(0xe6c68a)); sand.position.y = -0.3; sand.receiveShadow = true; root.add(sand);
  for (let i = 0; i < 18; i++) { const d = mesh(new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), clay(0xe0bd7e)); d.scale.set(6 + rnd() * 10, 1 + rnd() * 2.5, 3 + rnd() * 5); const a = rnd() * 6.28, r = 16 + rnd() * 34; d.position.set(Math.cos(a) * r, -0.2, Math.sin(a) * r); d.rotation.y = rnd() * 3; root.add(d); }
  for (let i = 0; i < 30; i++) { const r = makeRock(0.3 + rnd() * 0.5, rnd); const a = rnd() * 6.28, d = 3 + rnd() * 30; r.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); if (Math.abs(r.position.x) < 2.2) continue; root.add(r); }
  for (const [x, z] of [[-9, -6], [11, 2], [-14, 9]]) {
    const t = new THREE.Group(); const trunk = mesh(new THREE.CylinderGeometry(0.1, 0.18, 2.2, 6), clay(0x7a5a3a)); trunk.position.y = 1.1; trunk.rotation.z = 0.2; t.add(trunk);
    const crown = mesh(new THREE.SphereGeometry(1.4, 12, 8), clay(0x8a9a5a, { flatShading: true })); crown.scale.y = 0.4; crown.position.set(0.3, 2.4, 0); t.add(crown); t.position.set(x, 0, z); root.add(t);
  }
  for (const [x, z, h] of [[-50, -70, 14], [-20, -80, 10], [30, -75, 16], [60, -60, 11]]) { const m = mesh(new THREE.ConeGeometry(h * 1.6, h, 6), clay(0xd9a878, { flatShading: true })); m.position.set(x, h / 2 - 1, z); root.add(m); }
  // the mirage: a shimmer of sky lying on the sand ahead, that fades as you come near
  const shimmerTex = canvasTexture(256, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(143,181,217,0)'); gr.addColorStop(0.4, 'rgba(111,160,216,0.95)'); gr.addColorStop(0.6, 'rgba(160,196,232,0.95)'); gr.addColorStop(1, 'rgba(143,181,217,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), new THREE.MeshBasicMaterial({ map: shimmerTex, transparent: true, depthWrite: false, fog: false }));
  shimmer.rotation.x = -Math.PI / 2; shimmer.position.copy(SPOT).setY(0.06); root.add(shimmer);
  // the rock, and the water under it
  const pool = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.05, 20), clay(0x5b8fb8, { roughness: 0.1 })); pool.position.copy(ROCK).setY(0.02); root.add(pool);
  const rim = mesh(new THREE.TorusGeometry(0.95, 0.1, 6, 20), clay(0xb89a78)); rim.rotation.x = Math.PI / 2; rim.position.copy(ROCK).setY(0.04); root.add(rim);
  const rock = makeRock(2.1, rnd); rock.position.copy(ROCK); rock.scale.y *= 0.7; root.add(rock);

  // ---- the frog lives under the rock, in the water; when the water is found, it blinks and hops away
  const frog = makeFrog({ scale: 0.4 }); root.add(frog);
  const cameo = frogCameo(frog, [{ at: [ROCK.x, ROCK.z], y: 0.02 }, { face: [0, 0] }, { wait: 2.2, act: (f, u) => (f.userData.body.scale.y = Math.abs(u - 0.5) < 0.05 ? 0.7 : 1) }, [ROCK.x + 1.8, ROCK.z + 0.8], [ROCK.x + 3.4, ROCK.z + 1.4], [ROCK.x + 5, ROCK.z + 2]]);
  frog.visible = false;

  // ---- state
  const S = { phase: 'walk', idle: 0, lift: 0, seen: false, gone: false, reveal: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/mirage.json', "Dharmottara's Mirage");
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  let card = null;

  // seeing it: once you've walked a little way, it's there, ahead
  interact.trigger({ test: (p) => p.z < 9, onEnter: async () => {
    S.seen = true; await voice.say('see', { urgent: true });
    card = beliefCard('There\'s water up ahead.', { reason: 'You had good reason to (it looks exactly like water)' }); card.show(); await ctx.wait(0.6); card.tick(0); await ctx.wait(0.5); card.tick(2);
  } });
  // it goes, as you reach it
  interact.trigger({ pos: SPOT, radius: 3.4, when: () => S.seen, onEnter: async () => {
    S.gone = true; await voice.say('mirage', { urgent: true }); await ctx.wait(0.6); await voice.say('ask'); S.phase = 'choose'; S.idle = 0;
  } });
  async function lift() {
    if (S.phase !== 'choose') return;
    S.phase = 'over'; player.enabled = false; S.lift = 0.001; frog.visible = true; cameo.start();
    await ctx.wait(1.4); await voice.say('water', { urgent: true }); card.tick(1); await ctx.wait(0.6); card.ask(); await voice.say('end'); await ctx.wait(1.8);
    save.complete('mirage');
    ctx.gameOver({ title: 'There was water after all', text: 'You believed there was water there, you had every reason, and there was. But what you saw was a mirage; the water that made you right was under a rock, where you couldn\'t see it. Did you know there was water there?' });
  }
  async function turnBack(idle) {
    if (S.phase !== 'choose') return;
    S.phase = 'over'; player.locked = true; player.target = V(0, 0, 10);
    await voice.say(idle ? 'back_idle' : 'back_1', { urgent: true }); await ctx.wait(1);
    S.reveal = true; S.lift = 0.001; frog.visible = true; cameo.start(); await ctx.wait(1.4);
    await voice.say('back_2'); card.tick(1); await ctx.wait(0.6); card.ask(); await ctx.wait(1.8);
    save.complete('mirage');
    ctx.gameOver({ title: 'You turned back', text: 'You believed there was water there, and when it turned out to be a mirage, you gave up on it. But there was water, under a rock, a step away. You were right, and never knew it.' });
  }
  interact.add({ pos: ROCK.clone().add(V(-0.6, 0, 1.6)), radius: 1.4, height: 1.6, prompt: 'Lift the rock', terminal: true, enabled: () => S.phase === 'choose', onUse: lift });
  interact.add({ pos: SPOT.clone().add(V(-1.8, 0, 2.4)), radius: 1.4, height: 1.6, prompt: 'Give up, and turn back', terminal: true, enabled: () => S.phase === 'choose', onUse: () => turnBack(false) });
  look(ctx, { pos: V(1.2, 0, 11.4), radius: 1.4, height: 1.6, prompt: 'Shake your water skin', lines: ['skin'], enabled: () => S.phase === 'walk' });

  (async () => { await ctx.wait(1); await voice.say('arrive'); })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 13, rotY: Math.PI },
    walkable: (x, z) => Math.hypot(x, z + 2) < 22,
    blockers: () => [{ x: ROCK.x + S.lift * 2.4, z: ROCK.z, r: 1.1 }],
    update(dt, t) {
      // the shimmer: strong from far away, thinning to nothing as you come close
      const d = Math.hypot(player.pos.x - SPOT.x, player.pos.z - SPOT.z);
      shimmer.material.opacity = S.gone ? Math.max(0, shimmer.material.opacity - dt) : clamp((d - 4) / 8) * (0.95 + Math.sin(t * 3) * 0.05);
      shimmer.scale.x = 1 + Math.sin(t * 2.3) * 0.04; shimmer.position.y = 0.06 + Math.sin(t * 5) * 0.01;
      // the rock, rolled aside
      if (S.lift > 0) { S.lift = Math.min(1, S.lift + dt * 0.7); const u = easeInOut(S.lift); rock.position.set(ROCK.x + u * 2.4, Math.sin(Math.PI * u) * 0.6, ROCK.z + u * 0.4); rock.rotation.z = -u * 1.4; }
      if (S.phase === 'choose') {
        S.idle = player.vel.lengthSq() > 0.01 ? 0 : S.idle + dt;
        if (S.idle > IDLE_LIMIT) turnBack(true);
      }
      cameo.update(dt);
    },
    camera(pl) {
      if (S.reveal) return { pos: ROCK.clone().add(V(-2, 4.4, 6)), look: ROCK.clone().add(V(0, 0.2, 0)), stiffness: 1.6 };
      if (S.phase === 'over') return { pos: ROCK.clone().add(V(3.6, 3.8, 5)), look: ROCK.clone().add(V(0, 0.2, 0)), stiffness: 2 };   // from the side, past you, onto the water
      // low, looking ahead over the sand, so the shimmer sits on the horizon
      return { pos: pl.pos.clone().add(V(1.6, 2.8, 7)), look: pl.pos.clone().add(V(0, 1.2, -12)), stiffness: 2 };
    },
    dispose() { voice.stop(); player.locked = false; },
  });
}
