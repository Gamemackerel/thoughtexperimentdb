// Vignette: The Chinese Room.
// You're locked in a small room. Cards covered in marks you can't read come in through a slot. A huge rulebook tells
// you, for each card, which card to send back; the answers wait in pigeonholes. Match the shapes, post the reply.
// After three, the camera goes outside: a woman has been asking you questions in Chinese, and you've been answering
// perfectly. Or stop answering, and she decides there's nobody there.
import {
  THREE, palette, clamp, lerp, easeInOut, clay, mesh, makePerson, animatePerson, makeTable, makeFrog,
} from '/engine/core.js';
import { loadNotebook } from '../core/notebook.js';
import { frogCameo } from '../core/frog.js';
import { look } from '../core/extras.js';
import { textTexture } from '../core/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SLOT = V(4.1, 1.2, -0.6);                  // in the right-hand wall
const BOOK = V(-2.6, 0, -2.2), SHELF = V(1.2, 0, -3.1), TRAY = V(3.4, 0, -0.6), BED = V(-3.2, 0, 1.4);
// the questions she asks, and the right reply to each (with a spare reply that answers nothing)
const QA = [
  { q: '你好吗？', a: '我很好，谢谢。', en: ['How are you?', "I'm very well, thank you."] },
  { q: '你喜欢喝茶吗？', a: '喜欢，尤其是绿茶。', en: ['Do you like tea?', 'I do, especially green tea.'] },
  { q: '今天天气怎么样？', a: '今天天气很好。', en: ["What's the weather like today?", "It's lovely today."] },
];
const SPARE = '我不知道。';
const card = (text, w = 1.1) => new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5), new THREE.MeshBasicMaterial({ map: textTexture(text, { w: 512, h: 256, font: '64px "PingFang SC", "Noto Sans CJK SC", "Hiragino Sans GB", sans-serif' }), side: THREE.DoubleSide }));

export default function chineseRoom(ctx) {
  const { stage, interact, voice, player, save } = ctx;
  const root = new THREE.Group();
  stage.scene.background = new THREE.Color(0xe9e2d4);
  stage.scene.fog = new THREE.Fog(0xe9e2d4, 40, 120);
  voice.load('chinese-room');

  // ---- the room (a dollhouse: no front wall), and outside it, a little courtyard with a café table
  const slab = mesh(new THREE.BoxGeometry(20, 1.2, 9), clay(0xb5a88f)); slab.position.set(3, -0.62, -0.8); root.add(slab);
  const floor = mesh(new THREE.BoxGeometry(9, 0.05, 7), clay(0x9a8468)); floor.position.set(0, 0.01, -0.8); root.add(floor);
  const wallM = clay(0xe8dcc0);
  const back = mesh(new THREE.BoxGeometry(9, 4.6, 0.3), wallM); back.position.set(0, 2.3, -4.4); root.add(back);
  const left = mesh(new THREE.BoxGeometry(0.3, 4.6, 7.2), wallM); left.position.set(-4.5, 2.3, -0.8); root.add(left);
  const rightLow = mesh(new THREE.BoxGeometry(0.3, 1.1, 7.2), wallM); rightLow.position.set(4.3, 0.55, -0.8); root.add(rightLow);
  const rightHigh = mesh(new THREE.BoxGeometry(0.3, 3.4, 7.2), wallM); rightHigh.position.set(4.3, 2.9, -0.8); root.add(rightHigh);
  const slotFrame = mesh(new THREE.BoxGeometry(0.34, 0.14, 1.2), clay(0x2b2a33)); slotFrame.position.set(4.3, 1.2, SLOT.z); root.add(slotFrame);
  const ceilingLamp = new THREE.PointLight(0xffe7b8, 18, 9, 1.5); ceilingLamp.position.set(0, 4, -1); root.add(ceilingLamp);
  // furniture: the rulebook on a lectern, the pigeonholes, the tray under the slot, a bed, a heap of old cards
  const lect = new THREE.Group(); const lp = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.2, 10), clay(palette.wood)); lp.position.y = 0.6; lect.add(lp);
  const lt = mesh(new THREE.BoxGeometry(1.4, 0.1, 1), clay(palette.wood)); lt.position.y = 1.25; lt.rotation.x = 0.35; lect.add(lt);
  const tome = mesh(new THREE.BoxGeometry(1.2, 0.3, 0.85), clay(0x8c4a4a)); tome.position.set(0, 1.42, 0); tome.rotation.x = 0.35; lect.add(tome);
  const tpage = mesh(new THREE.BoxGeometry(1.1, 0.02, 0.78), clay(0xfbf6ea)); tpage.position.set(0, 1.58, 0.05); tpage.rotation.x = 0.35; lect.add(tpage);
  lect.position.copy(BOOK); root.add(lect);
  const shelf = new THREE.Group(); const sw = clay(0x6b4a33);
  const sBack = mesh(new THREE.BoxGeometry(4.6, 1.3, 0.1), sw); sBack.position.y = 1.55; shelf.add(sBack);
  for (const y of [0.9, 2.2]) { const b = mesh(new THREE.BoxGeometry(4.6, 0.08, 0.6), sw); b.position.set(0, y, 0.25); shelf.add(b); }
  for (const x of [-2.3, -1.15, 0, 1.15, 2.3]) { const b = mesh(new THREE.BoxGeometry(0.08, 1.3, 0.6), sw); b.position.set(x, 1.55, 0.25); shelf.add(b); }
  for (const x of [-2.2, 2.2]) { const l = mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), sw); l.position.set(x, 0.45, 0.25); shelf.add(l); }
  shelf.position.copy(SHELF); root.add(shelf);
  const ANSWERS = [QA[2].a, QA[0].a, SPARE, QA[1].a];         // one per pigeonhole
  const holes = ANSWERS.map((a, i) => { const c = card(a, 1); const x = -1.725 + i * 1.15; c.position.copy(SHELF).add(V(x, 1.55, 0.56)); root.add(c); return { a, pos: SHELF.clone().add(V(x, 0, 1.2)), mesh: c }; });
  const tray = mesh(new THREE.BoxGeometry(1, 0.08, 1.2), clay(0x5a5e66)); tray.position.copy(TRAY).setY(1.05); root.add(tray);
  const tleg = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), clay(0x5a5e66)); tleg.position.copy(TRAY).setY(0.5); root.add(tleg);
  const bed = mesh(new THREE.BoxGeometry(1.4, 0.5, 2.6), clay(0x5b7fa6)); bed.position.copy(BED).setY(0.25); root.add(bed);
  const heap = new THREE.Group(); for (let i = 0; i < 40; i++) { const c = mesh(new THREE.BoxGeometry(0.5, 0.02, 0.25), clay(0xfbf6ea)); c.position.set((Math.random() - 0.5) * 1.2, i * 0.018, (Math.random() - 0.5) * 0.8); c.rotation.y = Math.random() * 3; heap.add(c); }
  heap.position.set(-3.4, 0, -3.3); root.add(heap);
  // outside: the woman at her table
  const cafe = makeTable({ w: 1.2, d: 1.2, h: 1, color: 0xf2e6d4 }); cafe.position.set(6.6, 0, -0.6); root.add(cafe);
  const woman = makePerson({ color: 0x3f8f86 }); woman.position.set(7.6, 0, -0.6); woman.rotation.y = -Math.PI / 2; woman.userData.body.position.y = -0.3; root.add(woman);
  const cup = mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 12), clay(0xfbf6ea)); cup.position.set(6.4, 1.2, -0.3); root.add(cup);
  const plant = mesh(new THREE.SphereGeometry(0.6, 14, 10), clay(0x6f9a4f)); plant.position.set(8, 0.6, -3.6); root.add(plant);

  // ---- cards in play
  const incoming = { mesh: null, qa: null };
  const held = { mesh: null, text: null };
  const S = { phase: 'intro', round: 0, holding: null, wrong: 0, revealT: -1, stopped: false };
  const level = { root, ground: [], notebook: '', __S: S };
  loadNotebook(level, '/game/notebook/chinese-room.json', 'The Chinese Room');
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshBasicMaterial({ visible: false })); gp.rotation.x = -Math.PI / 2; gp.position.set(0, 0, -0.8); root.add(gp); level.ground.push(gp);

  function deliver() {
    const qa = QA[S.round];
    const m = card(qa.q, 1); m.rotation.x = -Math.PI / 2; m.position.copy(SLOT).add(V(0.6, 0, 0)); root.add(m);
    incoming.mesh = m; incoming.qa = qa; S.slideT = 0;
    voice.say(S.round === 0 ? 'card' : 'card_again', { once: S.round === 0 });
  }
  function hold(text) {
    if (held.mesh) player.obj.remove(held.mesh);
    held.text = text; held.mesh = text ? card(text, 0.9) : null;
    if (held.mesh) { held.mesh.position.set(0, 2.6, 0); player.obj.add(held.mesh); }
  }
  interact.add({ pos: TRAY.clone().add(V(-1, 0, 0)), radius: 1.3, height: 1.8, prompt: 'Take the card', enabled: () => S.phase === 'play' && incoming.mesh && !S.slideT && held.text !== incoming.qa.q,
    onUse: () => { root.remove(incoming.mesh); hold(incoming.qa.q); S.holdingQ = true; } });
  interact.add({ pos: BOOK.clone().add(V(0.3, 0, 1.3)), radius: 1.5, height: 2.4, prompt: 'Look it up in the rulebook', enabled: () => S.phase === 'play',
    onUse: () => {
      voice.say('book');
      const rule = held.text && S.holdingQ ? incoming.qa : null;
      ctx.page(rule
        ? `<b>RULE ${417 + S.round * 211}</b>\n\nWhen a card like this comes in:\n\n      <mark>${rule.q}</mark>\n\nsend back the card like this:\n\n      <mark>${rule.a}</mark>\n\n\n(Do not send anything else.)`
        : `<b>RULES FOR THE ROOM</b>\n\nFor every card that comes in, find its shape in this book. The book shows the shape of the card to send back.\n\nThe cards to send back are in the pigeonholes.\n\nPost it through the slot.\n\n(There are ${(12847).toLocaleString('en-GB')} pages.)`);
    } });
  holes.forEach((h) => interact.add({ pos: h.pos, radius: 0.6, height: 2.6, prompt: 'Pick up this card', enabled: () => S.phase === 'play' && held.text !== h.a, onUse: () => { hold(h.a); S.holdingQ = false; } }));
  interact.add({ pos: V(3.3, 0, SLOT.z + 0.9), radius: 1.2, height: 2, prompt: 'Post it through the slot', enabled: () => S.phase === 'play' && held.text && !S.holdingQ,
    onUse: async () => {
      const ok = held.text === incoming.qa?.a; hold(null); S.phase = 'wait';
      await ctx.wait(1.2);
      if (!ok) { S.wrong++; ctx.speak(woman, '？', { offset: [0, 2.6, 0] }); await voice.say('wrong', { once: false }); deliverAgain(); return; }
      ctx.speak(woman, '😊', { offset: [0, 2.6, 0] });
      S.round++;
      if (S.round === 1) await voice.say('sent');
      if (S.round < QA.length) { await ctx.wait(1); S.phase = 'play'; deliver(); return; }
      reveal();
    } });
  function deliverAgain() { S.phase = 'play'; deliver(); }
  interact.add({ pos: BED.clone().add(V(1, 0, 0.6)), radius: 1, height: 1.4, prompt: 'Stop answering', enabled: () => S.phase === 'play' && voice.said.has('ask'),
    onUse: async () => {
      S.phase = 'over'; S.stopped = true; player.place(BED.x, BED.z, 0); player.sit(true);
      for (let i = 0; i < 5; i++) { const m = card(QA[i % 3].q, 1); m.rotation.x = -Math.PI / 2; m.position.copy(TRAY).setY(1.12 + i * 0.02); m.rotation.z = i * 0.3; root.add(m); await ctx.wait(0.5); }
      await voice.say('stop_end'); await ctx.wait(1); save.complete('chinese-room');
      ctx.gameOver({ title: 'You stopped answering', text: 'The cards piled up by the slot. Outside, she decided there was nobody in the room who could speak her language. In a way, she was right.' });
    } });
  look(ctx, { pos: V(-3.4, 0, -2.2), radius: 1.2, height: 1.4, prompt: 'Look at the heap of cards', lines: ['heap'], enabled: () => S.phase === 'play' });

  async function reveal() {
    S.phase = 'reveal'; S.revealT = 0; player.enabled = false;
    await ctx.wait(1.5);
    for (const [i, qa] of QA.entries()) { ctx.speak(woman, `${qa.q}<br><small>${qa.en[0]}</small>`, { offset: [0, 2.8, 0], secs: 2.6 }); await ctx.wait(1.2); ctx.speak(slotFrame, `${qa.a}<br><small>${qa.en[1]}</small>`, { offset: [0.6, 1.4, 0], secs: 2.4 }); await ctx.wait(1.6); }
    await voice.say('reveal'); await voice.say('understand'); await ctx.wait(0.6); await voice.say('end'); await ctx.wait(1);
    save.complete('chinese-room');
    ctx.gameOver({ title: 'You answered perfectly', text: 'To her, whoever is in the room speaks fluent Chinese. You followed the rules and understood nothing. If that is not understanding, is a computer following its rules any different?' });
  }

  // ---- the frog comes in through the slot like a card, has a look round, and leaves the same way
  const frog = makeFrog({ scale: 0.6 }); root.add(frog);          // a smaller frog indoors
  const cameo = frogCameo(frog, [{ at: [5, SLOT.z], y: 1.15 }, { at: [3.5, SLOT.z], y: 1.12, height: 0.5 }, { at: [2.4, 0.4], y: 0, height: 1 }, [1, 0.6], [-0.6, -0.4], { face: [BOOK.x, BOOK.z] },
    { wait: 1.4, act: (f, u) => (f.userData.body.rotation.x = -0.3 * Math.sin(Math.PI * u)) }, [0.8, 0.2], [2.2, 0.2], { at: [3.4, SLOT.z], y: 1.12, height: 1.4 }, { at: [5, SLOT.z], y: 1.15, height: 0.4 }]);

  (async () => {
    await ctx.wait(0.9); await voice.say('arrive'); await ctx.wait(0.4);
    S.phase = 'play'; deliver(); await ctx.wait(1.5); await voice.say('ask');
  })();

  return Object.assign(level, {
    __frog: cameo,
    spawn: { x: 1.2, z: 1.4, rotY: Math.PI },
    walkable: (x, z) => x > -4.1 && x < 3.9 && z > -3.9 && z < 2.4,
    blockers: () => [{ x: BOOK.x, z: BOOK.z, r: 0.6 }, { x: TRAY.x, z: TRAY.z, r: 0.5 }, { x: BED.x, z: BED.z - 0.6, r: 0.8 }, { x: BED.x, z: BED.z + 0.6, r: 0.8 }, { x: -3.4, z: -3.3, r: 0.6 }],
    update(dt, t) {
      // a new card slides in through the slot onto the tray
      if (S.slideT != null && incoming.mesh) {
        S.slideT += dt; const k = easeInOut(S.slideT / 0.8);
        incoming.mesh.position.set(lerp(SLOT.x + 0.6, TRAY.x, k), lerp(SLOT.y, 1.12, k), TRAY.z);
        if (k >= 1) S.slideT = null;
      }
      animatePerson(woman, t, { energy: 0.3 }); woman.userData.body.position.y -= 0.3;
      if (S.phase === 'reveal') S.revealT += dt;
      if (S.round >= 1 && S.phase === 'play') cameo.start();
      cameo.update(dt);
    },
    camera(pl) {
      if (S.phase === 'reveal') {
        // rise up out of the room and look down on both sides of the wall
        const k = easeInOut(clamp(S.revealT / 3));
        const look = V(lerp(0, 4.2, k), 1.2, -0.8);
        return { pos: look.clone().add(V(lerp(0.5, 2.5, k), lerp(5.5, 9, k), lerp(10.5, 9, k))), look, stiffness: 2 };
      }
      const look = V(pl.pos.x * 0.3, 1.6, -1.2);
      return { pos: look.clone().add(V(-1.2, 5.2, 10)), look, stiffness: 2.2 };
    },
    dispose() { voice.stop(); if (held.mesh) player.obj.remove(held.mesh); player.sit(false); },
  });
}
