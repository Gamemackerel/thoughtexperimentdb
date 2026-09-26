// Vignette: The Puddle.
// Morning, after the rain. You're a puddle (teal, of course), lying in a hole that fits you staggeringly well: surely it
// was made to have you in it. The sun comes up, and you begin to shrink. There are other holes, joined to yours by
// cracks in the ground; flow into one, and it fits you perfectly too. Either way the sun takes you in the end: sure to
// the last that the world was made for you, or knowing you took the shape of the hole, and not the other way round.
import { THREE, palette, clamp, lerp, easeInOut, seeded, clay, mesh, makeFrog, makeRock } from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SUN_TIME = 70;                     // seconds from the question until the sun has taken you

// the holes: irregular shapes (outlines in x, z around a centre), and the cracks that join them
const blob = (cx, cz, r, wob, seed, n = 28) => { const s = seeded(seed), k1 = 2 + Math.floor(s() * 3), k2 = 3 + Math.floor(s() * 3), p1 = s() * 6, p2 = s() * 6, sx = 0.8 + s() * 0.5; return { c: V(cx, 0, cz), pts: [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2, rr = r * (1 + wob * Math.sin(a * k1 + p1) * 0.6 + wob * Math.cos(a * k2 + p2) * 0.4); return [Math.cos(a) * rr * sx, Math.sin(a) * rr]; }) }; };
const star = (cx, cz, r, n = 5) => ({ c: V(cx, 0, cz), pts: [...Array(n * 2)].map((_, i) => { const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.5 : r; return [Math.cos(a) * rr, Math.sin(a) * rr]; }) });
const crescent = (cx, cz, r) => ({ c: V(cx, 0, cz), a: V(cx - 0.8 * r, 0, cz - 0.12 * r), pts: [...[...Array(16)].map((_, i) => { const a = -0.3 + (i / 15) * (Math.PI + 0.6); return [Math.cos(a) * r, -Math.sin(a) * r]; }), ...[...Array(16)].map((_, i) => { const a = Math.PI + 0.3 - (i / 15) * (Math.PI + 0.6); return [Math.cos(a) * r * 0.55, -Math.sin(a) * r * 0.55 - r * 0.2]; })] });
const HOLES = [blob(0, 0, 1.9, 0.35, 7), crescent(6.4, -0.4, 2), star(-6.2, 0.6, 2.1), blob(0.4, -6, 1.3, 0.5, 21), blob(5.6, -6.6, 1.1, 0.2, 33, 20)];
const CRACKS = [[0, 1], [0, 2], [0, 3], [3, 4]];

const inPoly = (x, z, h, shrink = 0.9) => { const px = (x - h.c.x) / shrink, pz = (z - h.c.z) / shrink; let inside = false; const p = h.pts; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside; } return inside; };
const inCrack = (x, z) => CRACKS.some(([a, b]) => { const A = HOLES[a].a ?? HOLES[a].c, B = HOLES[b].a ?? HOLES[b].c, dx = B.x - A.x, dz = B.z - A.z, L2 = dx * dx + dz * dz, u = clamp(((x - A.x) * dx + (z - A.z) * dz) / L2); return Math.hypot(x - (A.x + dx * u), z - (A.z + dz * u)) < 0.38; });
const shapeOf = (h) => { const s = new THREE.Shape(); h.pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath(); return s; };

export default function puddle(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  const dawn = new THREE.Color(0x9fb2d0), day = new THREE.Color(0xf6e7c8);
  stage.scene.background = dawn.clone();
  stage.scene.fog = new THREE.Fog(0x9fb2d0, 30, 90);
  stage.hemi.intensity = 0.9; stage.sun.intensity = 0.6;
  voice.load('puddle');
  const rnd = seeded(1998);
  player.obj.visible = false;

  // ---- the ground: packed earth, stones, grass at the edges; the holes and the cracks between them
  const earth = mesh(new THREE.CylinderGeometry(14, 13, 1.2, 48), clay(0xb89a78)); earth.position.y = -0.6; earth.receiveShadow = true; root.add(earth);
  for (let i = 0; i < 26; i++) { const r = makeRock(0.3 + rnd() * 0.5, rnd); const a = rnd() * 6.28, d = 4 + rnd() * 9; r.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); if (HOLES.some((h) => r.position.distanceTo(h.c) < 2.6)) continue; root.add(r); }
  for (let i = 0; i < 90; i++) { const a = rnd() * 6.28, d = 10 + rnd() * 3.5, g = mesh(new THREE.ConeGeometry(0.06, 0.5, 4), clay(0x7a9a55)); g.position.set(Math.cos(a) * d, 0.25, Math.sin(a) * d); root.add(g); }
  const holeMat = clay(0x6a5540), rimMat = clay(0x8a7258);
  HOLES.forEach((h) => {
    const m = mesh(new THREE.ShapeGeometry(shapeOf(h)), holeMat); m.rotation.x = -Math.PI / 2; m.position.copy(h.c).setY(0.006); m.castShadow = false; root.add(m);
    const pts = h.pts.map(([x, z]) => V(x, 0.03, z)); const rim = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.07, 5, true), rimMat); rim.position.copy(h.c); root.add(rim);
  });
  CRACKS.forEach(([a, b]) => { const A = HOLES[a].a ?? HOLES[a].c, B = HOLES[b].a ?? HOLES[b].c, L = A.distanceTo(B);   // (a crack runs to a hole's anchor: its middle, or for the crescent, its near tip)
    const c = mesh(new THREE.BoxGeometry(0.5, 0.02, L), holeMat); c.position.copy(A).lerp(B, 0.5).setY(0.004); c.rotation.y = Math.atan2(B.x - A.x, B.z - A.z); c.castShadow = false; root.add(c); });

  // ---- you: the water in whichever hole you're in (or a trickle, between holes)
  const waterMat = new THREE.MeshStandardMaterial({ color: palette.agent, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.88 });
  const puddles = HOLES.map((h) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(h)), waterMat); m.rotation.x = -Math.PI / 2; m.position.copy(h.c).setY(0.035); m.scale.setScalar(0.001); m.receiveShadow = true; root.add(m); return m; });
  const trickle = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10), waterMat); trickle.scale.set(1, 0.18, 1.6); trickle.visible = false; root.add(trickle);
  const shine = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); shine.rotation.x = -Math.PI / 2; root.add(shine);
  const steam = [...Array(10)].map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); root.add(s); s.userData.t = rnd() * 3; return s; });
  // the sun, coming up
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd98a, fog: false })); root.add(sun);
  // a sparrow that drops in for a drink
  const bird = new THREE.Group(); const bb = mesh(new THREE.SphereGeometry(0.22, 10, 8), clay(0x8a6a4a)); bb.scale.z = 1.4; bb.position.y = 0.25; bird.add(bb);
  const bh = mesh(new THREE.SphereGeometry(0.13, 10, 8), clay(0x8a6a4a)); bh.position.set(0, 0.42, 0.26); bird.add(bh);
  const beak = mesh(new THREE.ConeGeometry(0.04, 0.12, 6), clay(0xe2a93b)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.42, 0.42); bird.add(beak);
  bird.visible = false; root.add(bird);

  // ---- the frog hops into you, sits a while (you're its pond), and hops out again
  const frog = makeFrog({ scale: 0.55 }); root.add(frog);
  const cameo = frogCameo(frog, [[-3.4, 4.2], [-2.2, 3], [-1, 2.2], { at: [0.2, 0.4], y: 0.02, height: 0.9 }, { face: [0, 6] },
    { wait: 3.2, act: (f, u) => (f.userData.body.position.y = -0.12 + Math.sin(u * 20) * 0.02) }, { at: [1.6, 2.4], y: 0, height: 0.9 }, [2.8, 3.8], [4, 5]]);

  // ---- state
  const S = { phase: 'wake', hole: 0, seen: new Set([0]), sunT: -1, e: 1, fill: HOLES.map(() => 0), over: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/puddle.json', 'The Puddle');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  S.fill[0] = 1;

  async function evaporate() {
    if (S.over) return; S.over = true; player.enabled = false;
    const flowed = S.seen.size >= 2;
    if (flowed) { await voice.say('end_flow', { urgent: true }); }
    else { await voice.say('end_home_1', { urgent: true }); await ctx.wait(0.6); await voice.say('end_home_2'); }
    await ctx.wait(1.6);
    save.complete('puddle');
    ctx.gameOver(flowed ? { title: 'You took the shape of the hole', text: 'Every hole you tried fitted you perfectly, because you took its shape. The sun took you all the same, but you knew, at the end, that the world wasn\'t made to fit you. You fitted it.' }
      : { title: 'The hole was made for you', text: 'It fitted you staggeringly well, so it must have been made to have you in it. You held on to that as the sun rose and you shrank, so the moment you disappeared came as rather a surprise.' });
  }
  interact.add({ pos: () => HOLES[S.hole].c, radius: 3, height: 0.8, prompt: 'Lie still, and let the sun take you', terminal: true, enabled: () => S.phase === 'sun' && !S.over && S.sunT > 20, onUse: () => { S.sunT = Math.max(S.sunT, SUN_TIME * 0.9); } });
  look(ctx, { pos: () => HOLES[S.hole].c, radius: 3, height: 1, prompt: 'Think how well it fits', lines: ['made'], enabled: () => S.phase !== 'wake' && !S.over && S.hole === 0 });

  (async () => {
    await ctx.wait(1); await voice.say('arrive'); await ctx.wait(0.6); await voice.say('fits');
    S.phase = 'look'; await ctx.wait(7); await voice.say('sun'); S.sunT = 0; S.phase = 'sun'; await ctx.wait(1); await voice.say('ask'); cameo.start();
    await ctx.wait(6); voice.say('cracks', { when: () => S.seen.size < 2 });
  })();

  const holeAt = (x, z) => HOLES.findIndex((h) => inPoly(x, z, h, 0.95));
  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 0.3, rotY: Math.PI },
    walkable: (x, z) => holeAt(x, z) >= 0 || inCrack(x, z),
    blockers: () => [],
    update(dt, t) {
      // the sun comes up, the light warms, and you shrink
      if (S.sunT >= 0 && !S.overDone) S.sunT += dt;
      const u = clamp(S.sunT / SUN_TIME);
      sun.position.set(30, lerp(-8, 26, easeInOut(u)), -60);
      stage.scene.background.copy(dawn).lerp(day, u); stage.scene.fog.color.copy(stage.scene.background);
      stage.sun.intensity = 0.6 + u * 2; stage.hemi.intensity = 0.9 + u * 0.8;
      S.e = 1 - u;
      if (S.e < 0.06 && !S.over) evaporate();
      // where you are: a hole fills with you (and fits you), a crack carries a trickle of you
      const h = holeAt(player.pos.x, player.pos.z);
      if (h >= 0 && h !== S.hole) {
        S.hole = h;
        if (!S.seen.has(h)) { S.seen.add(h); voice.say(S.seen.size === 2 ? 'other_1' : S.seen.size === 3 ? 'other_2' : 'other_3', { urgent: true }); }
      }
      const inHole = h >= 0;
      S.fill.forEach((f, i) => (S.fill[i] = lerp(f, inHole && i === S.hole ? 1 : 0, 1 - Math.exp(-dt * 3))));
      puddles.forEach((m, i) => { const s = Math.max(0.001, S.fill[i] * (0.15 + 0.85 * Math.sqrt(S.e)) * (S.over ? 0.96 : 1)); m.scale.setScalar(s); m.visible = s > 0.01; m.position.y = 0.035 - (1 - S.e) * 0.02; });
      trickle.visible = !inHole && !S.over; trickle.position.set(player.pos.x, 0.05, player.pos.z); trickle.rotation.y = player.obj.rotation.y;
      shine.position.copy(inHole ? (HOLES[S.hole].a ?? HOLES[S.hole].c) : player.pos).add(V(-0.4, 0.05, -0.3)); shine.scale.setScalar(Math.max(0.01, S.e)); shine.material.opacity = 0.35 + Math.sin(t * 2) * 0.1;
      // steam, once the sun is up
      steam.forEach((s, i) => { s.userData.t += dt; const k = (s.userData.t % 3) / 3, c = HOLES[S.hole].c; s.position.set(c.x + Math.sin(i * 2.3) * 1.2, k * 2.2, c.z + Math.cos(i * 1.7) * 1); s.material.opacity = u > 0.2 && inHole ? 0.3 * Math.sin(Math.PI * k) * S.e : 0; });
      // a sparrow drops in for a drink, now and then
      const bt = t % 22; bird.visible = bt > 12 && bt < 18 && inHole && !S.over;
      if (bird.visible) { const c = HOLES[S.hole].c; bird.position.set(c.x + 1.8, 0, c.z + 1.4); bird.rotation.y = Math.atan2(c.x - bird.position.x, c.z - bird.position.z); bh.position.y = 0.42 - Math.max(0, Math.sin(t * 6)) * 0.2; }
      cameo.update(dt);
    },
    camera(pl) {
      const c = S.hole >= 0 && holeAt(pl.pos.x, pl.pos.z) >= 0 ? HOLES[S.hole].c : pl.pos;
      const look = V(c.x * 0.8, 0, c.z * 0.8 - 0.5);
      return { pos: look.clone().add(V(0, 8.5, 9.5)), look, stiffness: 2 };
    },
    dispose() { voice.stop(); player.obj.visible = true; },
  });
}
