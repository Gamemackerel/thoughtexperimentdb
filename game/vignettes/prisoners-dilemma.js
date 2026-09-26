// Vignette: The Prisoner's Dilemma.
// You and your partner have been arrested and put in separate rooms, with a sheet of glass between you. The deal:
// talk while they stay silent and you walk free (they get three years); both silent, a year each; both talk, two years
// each. Sign the statement or say nothing. Three rounds: they get picked up again, and your partner remembers.
// (The partner plays tit for tat: silent at first, then whatever you did last time.)
import {
  THREE, palette, clamp, lerp, clay, mesh, makePerson, animatePerson, makeTable, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { textTexture } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BACK = -4.2, ROUNDS = 3;
const YEARS = { cc: [1, 1], dc: [0, 3], cd: [3, 0], dd: [2, 2] };   // [you, partner]; c = silent, d = talk

function makeChair(color = 0x6d7684) {
  const c = new THREE.Group(); const m = clay(color);
  const seat = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), m); seat.position.y = 0.5; c.add(seat);
  const bk = mesh(new THREE.BoxGeometry(0.7, 0.8, 0.08), m); bk.position.set(0, 0.9, -0.32); c.add(bk);
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const l = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), clay(0x3a3a42)); l.position.set(x, 0.25, z); c.add(l); }
  return c;
}

export default function prisonersDilemma(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xe8e4dc);
  stage.scene.fog = new THREE.Fog(0xe8e4dc, 40, 120);
  stage.hemi.intensity = 1.2; stage.sun.intensity = 1.8;
  voice.load('prisoners-dilemma');

  // ---- two bare rooms side by side, glass between them
  const slab = mesh(new THREE.BoxGeometry(16, 1.2, 8), clay(0x9a9690)); slab.position.set(0, -0.62, -0.6); root.add(slab);
  const floor = mesh(new THREE.BoxGeometry(15, 0.05, 7.4), clay(0xb8b4ac)); floor.position.set(0, 0.0, -0.6); floor.receiveShadow = true; root.add(floor);
  const wallM = clay(0xd8d2c4), dark = clay(0x5a5e66);
  const back = mesh(new THREE.BoxGeometry(15.4, 5, 0.3), wallM); back.position.set(0, 2.5, BACK - 0.15); root.add(back);
  for (const sx of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.3, 5, 7.4), wallM); e.position.set(sx * 7.6, 2.5, -0.6); root.add(e); }
  const lower = mesh(new THREE.BoxGeometry(0.3, 1, 7.4), wallM); lower.position.set(0, 0.5, -0.6); root.add(lower);
  const upper = mesh(new THREE.BoxGeometry(0.3, 1.8, 7.4), wallM); upper.position.set(0, 4.1, -0.6); root.add(upper);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 7.4), new THREE.MeshPhysicalMaterial({ color: 0xcfe0ee, transparent: true, opacity: 0.18, roughness: 0.05 })); glass.position.set(0, 2.1, -0.6); root.add(glass);
  for (const sx of [-1, 1]) { const lamp = mesh(new THREE.ConeGeometry(0.5, 0.4, 16, 1, true), dark); lamp.position.set(sx * 3.6, 4.4, -1.6); root.add(lamp); const bulb = new THREE.PointLight(0xfff1cc, 10, 7, 1.5); bulb.position.set(sx * 3.6, 4, -1.6); root.add(bulb); }

  const rooms = [-1, 1].map((sx) => {
    const x = sx * 3.6;
    const table = makeTable({ w: 2.2, d: 1.2, h: 1, color: 0x6b4a33 }); table.position.set(x, 0, -1.6); root.add(table);
    const ch1 = makeChair(); ch1.position.set(x, 0, -0.3); ch1.rotation.y = Math.PI; root.add(ch1);
    const ch2 = makeChair(); ch2.position.set(x, 0, -2.9); root.add(ch2);
    const paper = mesh(new THREE.BoxGeometry(0.42, 0.01, 0.56), clay(0xfbf6ea).clone()); paper.position.set(x - 0.5, 1.12, -1.4); root.add(paper);   // its own material: it changes colour when signed
    const pen = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), clay(0x2b2a33)); pen.rotation.set(0, 0.6, Math.PI / 2); pen.position.set(x - 0.1, 1.14, -1.35); root.add(pen);
    const det = makePerson({ color: 0x33343d }); det.position.set(x, 0, -2.9); det.userData.body.position.y = -0.42; root.add(det);
    return { x, table, paper, pen, det };
  });
  const partner = makePerson({ color: palette.one }); partner.position.set(rooms[1].x, 0, -0.3); partner.rotation.y = Math.PI; partner.userData.body.position.y = -0.42; root.add(partner);

  // the tally, chalked on the back wall above the glass
  const board = textTexture([''], { w: 768, h: 384, bg: '#27302c', fg: '#f6efe0', font: '40px sans-serif', align: 'left' });
  const boardM = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ map: board })); boardM.position.set(-4.9, 3.1, BACK + 0.07); root.add(boardM);
  const bframe = mesh(new THREE.BoxGeometry(3.8, 2, 0.08), clay(0x6b4a33)); bframe.position.set(-4.9, 3.1, BACK + 0.01); root.add(bframe);
  function drawBoard() {
    const g = board.userData.ctx; g.fillStyle = '#27302c'; g.fillRect(0, 0, 768, 384);
    g.fillStyle = '#f6efe0'; g.font = 'bold 40px sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('           YOU     PARTNER', 20, 50);
    g.font = '36px sans-serif';
    S.history.forEach(([a, b], i) => {
      const [y1, y2] = YEARS[a + b];
      g.fillText(`Round ${i + 1}`, 20, 120 + i * 70); g.fillText(`${y1} yr`, 240, 120 + i * 70); g.fillText(`${y2} yr`, 430, 120 + i * 70);
      g.fillStyle = '#f2c14e'; g.fillText(a === 'c' ? '·' : '✎', 380, 120 + i * 70); g.fillText(b === 'c' ? '·' : '✎', 580, 120 + i * 70); g.fillStyle = '#f6efe0';
    });
    board.needsUpdate = true;
  }

  // ---- the frog walks across your table, looks at the pen, looks at you, and leaves without signing anything
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const T = rooms[0].x;
  const cameo = frogCameo(frog, [[T - 3, 2.2], [T - 2.4, 0.9], { at: [T - 1.8, -0.2], height: 0.9 }, { at: [T - 0.9, -1.2], y: 1.1, height: 1.1 }, { face: [T - 0.1, -1.35] },
    { wait: 1.2, act: (f, u) => (f.userData.body.rotation.x = 0.3 * Math.sin(Math.PI * u)) }, { face: [T, 1] }, { wait: 0.9 }, { at: [T + 0.6, -1.9], y: 1.1 }, { at: [T + 1.8, -0.8], y: 0, height: 1 }, [T + 2.6, 0.6], [T + 3.3, 2.4]]);

  // ---- state
  const S = { phase: 'deal', round: 0, history: [], me: null };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/prisoners-dilemma.json', "The Prisoner's Dilemma");
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);
  drawBoard();

  const partnerMove = () => (S.history.length ? S.history[S.history.length - 1][0] : 'c');     // tit for tat
  async function choose(me) {
    S.phase = 'wait'; S.me = me; player.enabled = false;
    if (me === 'd') { S.signing = 1; ctx.speak(rooms[0].det, 'Sensible.'); } else ctx.speak(rooms[0].det, 'Suit yourself.');
    await ctx.wait(2.2);
    const them = partnerMove();
    if (them === 'd') { S.partnerSign = 1; ctx.speak(partner, 'Sorry.'); } else ctx.speak(partner, '…');
    await ctx.wait(2.2);
    S.history.push([me, them]); drawBoard();
    await voice.say('r_' + me + them, { once: false });
    await ctx.wait(1);
    S.signing = 0; S.partnerSign = 0;
    if (S.history.length < ROUNDS) {
      await voice.say(S.history.length === 1 ? 'again' : 'again_2', { once: false });
      if (S.history.length === 1) await voice.say('remember');
      S.phase = 'choose'; player.enabled = true; return;
    }
    const mine = S.history.map((h) => h[0]).join(''), years = S.history.reduce((a, [m, t]) => a + YEARS[m + t][0], 0), theirs = S.history.reduce((a, [m, t]) => a + YEARS[m + t][1], 0);
    const kind = mine === 'ccc' ? 'coop' : mine === 'ddd' ? 'defect' : 'mixed';
    await voice.say('end_' + kind); await ctx.wait(1);
    save.complete('prisoners-dilemma');
    ctx.gameOver({
      title: kind === 'coop' ? 'You kept quiet' : kind === 'defect' ? 'You talked, every time' : 'It depended on last time',
      text: `Three rounds. You served ${years} year${years === 1 ? '' : 's'}; your partner served ${theirs}. ${kind === 'coop' ? 'Trusting each other cost you both the least.' : kind === 'defect' ? 'Each time, talking was the safe move. Together you did worse than if you had both kept quiet.' : 'Your partner simply did what you did last time.'}`,
    });
  }
  interact.add({ pos: V(T - 1.6, 0, -0.9), radius: 1.2, height: 2, prompt: 'Sign the statement', enabled: () => S.phase === 'choose', onUse: () => choose('d') });
  interact.add({ pos: V(T + 1.6, 0, -0.9), radius: 1.2, height: 2, prompt: 'Say nothing', enabled: () => S.phase === 'choose', onUse: () => choose('c') });
  talk(ctx, { who: rooms[0].det, radius: 2.8, offset: [0, 2.7, 0], enabled: () => S.phase === 'choose',
    lines: ["Your partner's already talking, you know.", 'Take your time. We have all night.', 'Nobody is forcing you.', 'Do you really think they will keep quiet for you?'] });
  look(ctx, { pos: V(-0.7, 0, -0.9), radius: 1.3, height: 2.6, prompt: 'Look through the glass', lines: ['glass'], enabled: () => S.phase === 'choose' });

  (async () => {
    await ctx.wait(0.9); await voice.say('arrive'); await ctx.wait(0.4); await voice.say('deal'); await voice.say('deal_2'); await ctx.wait(0.6); await voice.say('ask');
    S.phase = 'choose';
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: T, z: 1.4, rotY: Math.PI },
    walkable: (x, z) => x > -7 && x < -0.5 && z > BACK + 0.5 && z < 2.6,
    blockers: () => [{ x: T, z: -1.6, r: 0.9 }, { x: T - 0.6, z: -1.6, r: 0.8 }, { x: T + 0.6, z: -1.6, r: 0.8 }, { x: T, z: -2.9, r: 0.5 }],
    update(dt, t) {
      rooms.forEach((r, i) => animatePerson(r.det, t, { phase: i * 2, energy: 0.3 }));
      animatePerson(partner, t, { phase: 1, energy: S.phase === 'wait' ? 0.6 : 0.3 });
      partner.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.3;          // glancing at the glass
      // the pens: yours signs if you talk, theirs if they do
      rooms[0].pen.rotation.x = S.signing ? Math.sin(t * 14) * 0.3 : 0;
      rooms[1].pen.rotation.x = S.partnerSign ? Math.sin(t * 14) * 0.3 : 0;
      rooms[0].paper.material.color.set(S.signing ? 0xf2e6a0 : 0xfbf6ea);
      rooms[1].paper.material.color.set(S.partnerSign ? 0xf2e6a0 : 0xfbf6ea);
      if (S.phase === 'choose') cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      const look = V(-0.9 + pl.pos.x * 0.15, 1.8, -1.4);
      return { pos: look.clone().add(V(0.4, 5.2, 11.5)), look, stiffness: 2.2 };
    },
    dispose() { voice.stop(); },
  });
}
