// Vignette: Newcomb's Paradox.
// A parlour, two boxes and a Predictor that has never been wrong. The glass box holds a thousand. The closed box holds a
// million if the Predictor foresaw you taking the closed box alone, and nothing if it foresaw you taking both. It made
// its prediction yesterday, and the ledger on the wall has no exceptions. Take both and that's the end. Take only the
// closed box, and you come back the next day to find both boxes glass, the million in plain sight: one again, or both.
import {
  THREE, palette, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeTable, makeFrog,
} from '/game/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { talk, look } from '../core/extras.js';
import { textTexture } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const BACK = -4.4, TABLE = V(0, 0, -1.2);
const BOX_A = V(-0.7, 0, -1.2), BOX_B = V(0.7, 0, -1.2);
const DOOR = V(6.6, 0, 1.2);
const money = (n) => '£' + n.toLocaleString('en-GB');

export default function newcomb(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xe9e0d0);
  stage.scene.fog = new THREE.Fog(0xe9e0d0, 40, 120);
  stage.hemi.intensity = 1.25; stage.sun.intensity = 1.9;
  voice.load('newcombs-paradox');

  // ---- a velvet parlour
  const slab = mesh(new THREE.BoxGeometry(15, 1.2, 8.6), clay(0x6b4a33)); slab.position.set(0, -0.62, -0.8); root.add(slab);
  const rug = mesh(new THREE.BoxGeometry(7, 0.04, 4.4), clay(0x7a2f3a)); rug.position.set(0, 0.02, -0.8); rug.receiveShadow = true; root.add(rug);
  for (let i = 0; i < 15; i++) { const b = mesh(new THREE.BoxGeometry(0.98, 0.06, 8), clay(i % 2 ? 0x8a6443 : 0x7a5638)); b.position.set(-7 + i, -0.01, -0.8); b.receiveShadow = true; root.add(b); }
  const velvet = clay(0x5a2a36);
  const back = mesh(new THREE.BoxGeometry(15.4, 6, 0.3), velvet); back.position.set(0, 3, BACK - 0.15); root.add(back);
  for (const sx of [-1, 1]) { const e = mesh(new THREE.BoxGeometry(0.3, 6, 8.6), velvet); e.position.set(sx * 7.6, 3, -0.8); root.add(e); }
  const dado = mesh(new THREE.BoxGeometry(15.2, 0.12, 0.1), clay(0xc9a54c, { metalness: 0.5 })); dado.position.set(0, 1.2, BACK + 0.03); root.add(dado);

  // the Predictor: a tall cabinet with one large eye that follows you
  const pred = new THREE.Group();
  const cab = mesh(new THREE.BoxGeometry(2.2, 3.8, 0.8), clay(0x2b2a33)); cab.position.y = 1.9; pred.add(cab);
  const trim = mesh(new THREE.BoxGeometry(2.3, 0.14, 0.9), clay(0xc9a54c, { metalness: 0.5 })); trim.position.y = 3.85; pred.add(trim);
  const white = mesh(new THREE.SphereGeometry(0.6, 32, 20), clay(0xfbf6ea)); white.position.set(0, 2.7, 0.35); pred.add(white);
  const iris = new THREE.Group(); const ir = mesh(new THREE.CircleGeometry(0.28, 28), clay(0x3f8f86)); const pu = mesh(new THREE.CircleGeometry(0.13, 20), clay(0x111111)); pu.position.z = 0.005; iris.add(ir, pu);
  iris.position.set(0, 2.7, 0.96); pred.add(iris);
  const lid1 = mesh(new THREE.SphereGeometry(0.62, 32, 10, 0, Math.PI * 2, 0, 0.9), clay(0x2b2a33)); lid1.position.set(0, 2.7, 0.35); pred.add(lid1);
  pred.position.set(0, 0, BACK + 0.45); root.add(pred);

  // the table and the two boxes (box B is wood on the first day, glass on the second)
  const table = makeTable({ w: 3.2, d: 1.4, h: 1.1, color: 0x3d2a1c }); table.position.copy(TABLE); root.add(table);
  const top = table.userData.top;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false });
  const rim = new THREE.LineBasicMaterial({ color: 0xfbf6ea, transparent: true, opacity: 0.7 });
  const edges = (geo) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), rim);
  const boxGeo = new THREE.BoxGeometry(0.9, 0.7, 0.7), lidGeo = new THREE.BoxGeometry(0.94, 0.06, 0.74);
  const glassBox = new THREE.Mesh(boxGeo, glass); glassBox.add(edges(boxGeo));
  glassBox.position.copy(BOX_A).setY(top + 0.35); root.add(glassBox);
  const thousand = mesh(new THREE.BoxGeometry(0.5, 0.16, 0.26), clay(0x7cc04e)); thousand.position.copy(BOX_A).setY(top + 0.09); root.add(thousand);
  const boxB = new THREE.Group(); const bb = mesh(boxGeo, clay(0x6b4a33)); bb.position.y = 0.35; boxB.add(bb);
  const bbRim = edges(boxGeo); bbRim.visible = false; bb.add(bbRim);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.72, -0.35); boxB.add(lidPivot);
  const lid = mesh(lidGeo, clay(0x5a3d29)); lid.position.set(0, 0, 0.37); lidPivot.add(lid);
  const lidRim = edges(lidGeo); lidRim.visible = false; lid.add(lidRim);
  boxB.position.copy(BOX_B).setY(top); root.add(boxB);
  const million = new THREE.Group(); million.visible = false;
  const band = clay(0xfbf6ea);
  for (let i = 0; i < 12; i++) {
    const b = mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), clay(0x7cc04e)); b.position.set(-0.26 + (i % 3) * 0.26, 0.09 + Math.floor(i / 6) * 0.13, -0.16 + (Math.floor(i / 3) % 2) * 0.32);
    const w = mesh(new THREE.BoxGeometry(0.05, 0.125, 0.305), band); b.add(w); million.add(b);   // a paper band round each bundle
  }
  boxB.add(million);
  const toGlass = () => {                                          // the second day: box B is glass, the million in plain sight
    bb.material = glass; lid.material = glass; bb.castShadow = lid.castShadow = false; bbRim.visible = lidRim.visible = true;
    million.visible = true; thousand.visible = true;
  };

  // the ledger of everyone before you: both boxes, a thousand; one box, a million; never an exception
  const rows = [['Mrs Ashby', 'both'], ['Mr Crane', 'one'], ['Miss Dove', 'one'], ['Dr Ellis', 'both'], ['Mr Finch', 'one'], ['Mrs Gale', 'both'],
    ['Mr Hart', 'both'], ['Miss Irving', 'one'], ['Mr Jay', 'both'], ['Mrs Kemp', 'one']];
  const ledger = textTexture([''], { w: 512, h: 640, bg: '#f6efe0' });
  const drawLedger = () => {
    const g = ledger.userData.ctx; g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 512, 640);
    g.fillStyle = '#2b2a33'; g.textBaseline = 'middle'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('PREVIOUS VISITORS', 256, 42);
    g.font = 'italic 20px Georgia, serif'; g.textAlign = 'left'; g.fillText('name', 30, 84); g.fillText('took', 220, 84); g.textAlign = 'right'; g.fillText('left with', 486, 84);
    g.fillRect(30, 98, 456, 2);
    rows.forEach(([who, took, odd], i) => {
      const y = 126 + i * 44; g.fillStyle = odd ? '#b8452f' : '#2b2a33'; g.font = (odd ? 'italic ' : '') + '26px Georgia, serif';
      g.textAlign = 'left'; g.fillText(who, 30, y); g.fillText(took === 'one' ? 'one box' : 'both', 220, y);
      g.textAlign = 'right'; g.fillText(money(took === 'one' ? 1e6 : odd ? 1001000 : 1000), 486, y);
    });
    ledger.needsUpdate = true;
  };
  drawLedger();
  const ledgerM = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.5), new THREE.MeshBasicMaterial({ map: ledger })); ledgerM.position.set(-4.4, 3, BACK + 0.05); root.add(ledgerM);
  const lframe = mesh(new THREE.BoxGeometry(2.2, 2.7, 0.06), clay(0xc9a54c, { metalness: 0.5 })); lframe.position.set(-4.4, 3, BACK - 0.02); root.add(lframe);
  // a butler, and the door out
  const butler = makePerson({ color: 0x1f1f24 }); butler.position.set(3.8, 0, -3); butler.rotation.y = -0.4; root.add(butler);
  const bow = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.06), clay(0xfbf6ea)); bow.position.set(0, 1.36, 0.33); butler.userData.body.add(bow);
  const door = mesh(new THREE.BoxGeometry(0.1, 2.9, 1.4), clay(0x3d2a1c)); door.position.set(7.42, 1.45, DOOR.z); root.add(door);

  // ---- the frog sits on the closed box; when you come near, it hops into the glass box among the money, then away
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const cameo = frogCameo(frog, [[-6, 2.4], [-4.6, 1.4], [-3, 0.4], { at: [-1.8, -0.4], height: 0.9 }, { at: [BOX_B.x, BOX_B.z], y: top + 0.76, height: 1.2 },
    { face: [0, 3] }, { wait: 2.6 }, { at: [BOX_A.x, BOX_A.z], y: top + 0.2, height: 1 }, { wait: 1.6, act: (f, u) => (f.userData.body.rotation.y = Math.sin(u * 12) * 0.2) },
    { at: [BOX_A.x - 1.4, BOX_A.z + 0.9], y: 0, height: 1.1 }, [-3.2, 0.6], [-5, 1.6], [-6.6, 2.6]]);

  // ---- state
  const S = { phase: 'intro', day: 1, total: 0, picks: [], lid: 0, idle: 0, nudged: 0, wrong: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/newcombs-paradox.json', "Newcomb's Paradox");
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; root.add(gp); level.ground.push(gp);

  async function take(pick) {
    S.phase = 'open'; S.picks.push(pick); player.enabled = false;
    const predicted = S.day === 1 ? pick : 'one';                 // on the first day it is never wrong; on the second the million is already in
    if (S.day === 1) million.visible = predicted === 'one';
    ctx.speak(butler, pick === 'one' ? (S.day === 1 ? 'The closed box. Very good.' : 'Only the one. Very good.') : 'Both boxes. Very good.');
    await ctx.wait(1.4); S.lid = 1; await ctx.wait(1.2);
    S.total += (pick === 'one' ? 0 : 1000) + (predicted === 'one' ? 1e6 : 0);
    if (pick === 'both') thousand.visible = false;
    const k = S.day === 1 ? pick : pick + '2';
    await voice.say(k + '_1');
    if (S.day === 2 && pick === 'both') { S.wrong = true; ctx.speak(butler, 'Oh.'); await ctx.wait(1.6); }   // the first exception
    await voice.say(k + '_2');
    if (S.wrong) {
      await ctx.wait(0.4); ctx.speak(butler, 'I shall have to add a line to the ledger.'); await ctx.wait(1.4);
      rows.push(['You', 'both', true]); drawLedger(); await ctx.wait(2.2);
    }
    million.visible = false;
    if (S.day === 2 || pick === 'both') return end();
    // come back tomorrow: both boxes are glass now
    await ctx.wait(1);
    await ctx.flash(true);
    S.lid = 0; lidPivot.rotation.x = 0; toGlass(); player.place(0, 2.2, Math.PI); S.day = 2;
    await ctx.flash(false);
    await voice.say('again'); await voice.say('glass'); await ctx.wait(0.6); await voice.say('ask2');
    S.idle = 0; S.phase = 'choose'; player.enabled = true;
  }
  async function end() {
    S.phase = 'over'; await ctx.wait(0.4); await voice.say('end'); await ctx.wait(1);
    save.complete('newcombs-paradox');
    const tail = 'About half of everyone chooses the other way, and thinks the answer is obvious.';
    const card = S.picks.length === 1
      ? { title: 'You took both boxes', text: `You left with ${money(S.total)}. The closed box was empty, as it has been for everyone who took both. The money was put there yesterday, and nothing you did could change it. ${tail}` }
      : S.picks[1] === 'one'
        ? { title: 'You took one box, twice', text: `You left with ${money(S.total)}, and two thousand on the table: the second time in plain sight, where nothing could have stopped you taking it. ${tail}` }
        : { title: 'You took both, with the million in plain sight', text: `You left with ${money(S.total)}, and the first exception in the ledger. This is a loose version of the puzzle: a Predictor that's never wrong would only have shown you the million if you still wouldn't take both. So this shouldn't really have been possible. ${tail}` };
    ctx.gameOver(card);
  }
  interact.add({ pos: V(BOX_B.x + 0.4, 0, -0.1), radius: 1, height: 2.2, terminal: true, enabled: () => S.phase === 'choose', prompt: () => (S.day === 1 ? 'Take only the closed box' : 'Take only the million'), onUse: () => take('one') });
  interact.add({ pos: V(BOX_A.x - 0.4, 0, -0.1), radius: 1, height: 2.2, prompt: 'Take both boxes', terminal: true, enabled: () => S.phase === 'choose', onUse: () => take('both') });
  interact.add({ pos: DOOR.clone().add(V(-0.8, 0, 0)), radius: 1.6, height: 2.4, prompt: 'Leave', enabled: () => S.phase !== 'over' && S.phase !== 'open', onUse: () => ctx.speak(butler, 'Not before you have chosen, if you please.') });
  const chat = [['It has never been wrong. Not once.', 'People ask whether it reads minds. It simply knows people.', 'I filled the boxes myself, yesterday. What is in them is in them.', 'Take your time. It already knows how long you will take.'],
    ['Glass today. It asked for glass.', 'I filled them yesterday, as before. You can see for yourself.', 'It knew you would come back.']];
  talk(ctx, { who: butler, enabled: () => S.phase === 'choose', lines: (i) => chat[S.day - 1][i % chat[S.day - 1].length] });
  look(ctx, { pos: V(-4.4, 0, -2.6), radius: 1.5, height: 3.4, prompt: 'Read the ledger', lines: ['ledger_look'], enabled: () => S.phase === 'choose' });

  (async () => {
    await ctx.wait(0.9); await voice.say('arrive'); await voice.say('predictor'); await ctx.wait(0.4); await voice.say('box_a'); await voice.say('box_b');
    await ctx.wait(0.6); await voice.say('filled'); await voice.say('causal'); await ctx.wait(0.6); await voice.say('ledger'); await ctx.wait(0.6); await voice.say('ask');
    S.phase = 'choose';
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 0, z: 2.2, rotY: Math.PI },
    walkable: (x, z) => Math.abs(x) < 7 && z > BACK + 0.9 && z < 3,
    blockers: () => [{ x: -1, z: TABLE.z, r: 0.85 }, { x: 0, z: TABLE.z, r: 0.85 }, { x: 1, z: TABLE.z, r: 0.85 }, { x: butler.position.x, z: butler.position.z, r: 0.45 }, { x: 0, z: BACK + 0.45, r: 1.3 }],
    update(dt, t) {
      // the eye follows you, and blinks now and then
      const to = player.pos.clone().add(V(0, 1.6, 0)).sub(V(0, 2.7, BACK + 1.2)).normalize();
      iris.position.set(to.x * 0.18, 2.7 + to.y * 0.12, 0.96);
      pu.scale.setScalar(lerp(pu.scale.x, S.wrong ? 0.45 : 1, 1 - Math.exp(-dt * 3)));   // after its first mistake the pupil narrows, and it stops blinking
      lid1.rotation.x = !S.wrong && (t % 5.3) < 0.15 ? 1.2 : 0;
      lidPivot.rotation.x = lerp(lidPivot.rotation.x, -S.lid * 1.7, 1 - Math.exp(-dt * 5));
      animatePerson(butler, t, { energy: 0.25 });
      if (S.phase === 'choose' && (S.idle += dt) > 40 && S.nudged < S.day) { S.nudged = S.day; ctx.speak(butler, 'Whenever you are ready. It already knows when that will be.'); }
      ctx.ui.label('purse', S.total && S.phase !== 'choose' ? 1 : 0, money(S.total), player.obj, [0, 2.7, 0]);
      if (S.phase === 'choose') cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      const look = V(pl.pos.x * 0.25, 1.9, -1.4);
      return { pos: look.clone().add(V(0.6, 4.6, 10.5)), look, stiffness: 2.2 };
    },
    dispose() { voice.stop(); },
  });
}
