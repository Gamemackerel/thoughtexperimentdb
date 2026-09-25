// Small things to do that aren't the thought experiment: people to talk to (speech bubbles, no voice) and things to
// look at (one short narrator line each). They never change the story; they make the place feel lived in.
import { THREE } from '/game/engine/core.js';

const wpos = (o) => (o.isObject3D ? o.getWorldPosition(new THREE.Vector3()) : o);

// talk(ctx, { who, lines: [..] | () => string, prompt, radius, offset, enabled, at })   (at: where to stand, if not next to them)
// Lines cycle; a function can answer according to the state of the scene.
export function talk(ctx, { who, lines, prompt = 'Talk', radius = 1.9, offset = [0, 3.1, 0], enabled = () => true, at = null }) {
  let i = 0;
  return ctx.interact.add({
    pos: at ? () => at : () => wpos(who), radius, prompt, height: 2, aside: true,
    enabled: () => enabled() && who.visible !== false,
    onUse: () => { const text = typeof lines === 'function' ? lines(i) : lines[i % lines.length]; i++; ctx.speak(who, text, { offset }); },
  });
}

// look(ctx, { pos, lines: ['voice_id', ...], prompt, radius, enabled })
// Each use plays the next narrator line (queued after anything already being said); once they're all said the prompt
// goes away.
export function look(ctx, { pos, lines, prompt = 'Look', radius = 1.9, height = 2, enabled = () => true }) {
  let i = 0;
  return ctx.interact.add({
    pos: typeof pos === 'function' ? pos : () => wpos(pos), radius, prompt, height, aside: true,
    enabled: () => enabled() && i < lines.length,
    onUse: () => { ctx.voice.say(lines[i++], { pauseAfter: 0.2 }); },
  });
}
