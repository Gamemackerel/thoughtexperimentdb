// The frog's cameo: once per vignette it hops in, does one small thing, and hops out. Never central, never mentioned.
// frogCameo(frog, steps) → { start(), update(dt), active, done }
// steps:
//   [x, z] or { at: [x, z], y, height, back, speed }  hop to a point (back: facing away, as if rewound) (the first point is where it appears, ideally off-camera)
//   { wait: secs, act(frog, u, t) }       sit still for a while, optionally doing something (u = 0..1 through the wait)
//   { face: [x, z] }                      turn on the spot to face a point
//   { set(frog) }                         run once (e.g. a sound, a flag)
//   { warp: [x, z], y }                   jump cut to a point
import { THREE, clamp, lerp, easeInOut, clay, mesh } from '/game/engine/core.js';

const HOP = 0.42, REST = 0.45;

export function frogCameo(frog, steps) {
  const pts = []; let at = null, y = 0;
  const segs = [];
  for (const s of steps) {
    if (Array.isArray(s) || s.at) {
      const p = Array.isArray(s) ? s : s.at, py = s.y ?? 0;
      if (at) segs.push({ kind: 'hop', a: at, b: p, ay: y, by: py, height: s.height ?? 1.1, back: s.back, sp: s.speed ?? 1, dur: (HOP + REST) / (s.speed ?? 1) });
      at = p; y = py; pts.push(p);
    } else if (s.wait !== undefined) segs.push({ kind: 'wait', dur: s.wait, act: s.act, at, y });
    else if (s.face) segs.push({ kind: 'face', to: s.face, at, y, dur: 0.35 });
    else if (s.set) segs.push({ kind: 'set', fn: s.set, dur: 0 });
    else if (s.warp) { const w = s.warp, wy = s.y ?? y; segs.push({ kind: 'set', fn: (f) => { f.position.set(w[0], wy, w[1]); f.visible = true; }, dur: 0 }); at = w; y = wy; }
  }
  const first = steps.find((s) => Array.isArray(s) || s.at);
  const start = Array.isArray(first) ? first : first.at;
  let t = -1, i = 0, local = 0, heading = 0;
  frog.visible = false;
  const api = {
    get active() { return t >= 0 && i < segs.length; },
    get done() { return i >= segs.length; },
    start() { if (t >= 0) return; t = 0; frog.visible = true; frog.position.set(start[0], first.y ?? 0, start[1]); },
    update(dt) {
      if (t < 0 || i >= segs.length) return;
      t += dt; local += dt;
      let seg = segs[i];
      while (seg && local >= seg.dur) {
        if (seg.kind === 'set') seg.fn(frog);
        if (seg.kind === 'wait') seg.act?.(frog, 1, seg.dur);
        local -= seg.dur; i++; seg = segs[i];
        if (!seg) { frog.visible = false; return; }
      }
      const body = frog.userData.body;
      if (seg.kind === 'hop') {
        const air = clamp(local * seg.sp / HOP), p = easeInOut(air);
        frog.position.set(lerp(seg.a[0], seg.b[0], p), lerp(seg.ay, seg.by, p) + Math.sin(Math.PI * air) * seg.height, lerp(seg.a[1], seg.b[1], p));
        heading = Math.atan2(seg.b[0] - seg.a[0], seg.b[1] - seg.a[1]) + (seg.back ? Math.PI : 0); frog.rotation.y = heading;
        const land = local * seg.sp - HOP;
        const sq = air < 1 ? 1 + 0.18 * Math.sin(Math.PI * air) : 1 - 0.22 * Math.exp(-land * 9) * Math.cos(land * 20);
        body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      } else if (seg.kind === 'face') {
        const target = Math.atan2(seg.to[0] - seg.at[0], seg.to[1] - seg.at[1]);
        let d = target - heading; d = Math.atan2(Math.sin(d), Math.cos(d));
        frog.rotation.y = heading + d * easeInOut(local / seg.dur);
        if (local + dt >= seg.dur) heading = target;
      } else if (seg.kind === 'wait') {
        body.scale.set(1, 1 + 0.015 * Math.sin(t * 5), 1);          // breathing
        seg.act?.(frog, local / seg.dur, local);
      }
    },
  };
  return api;
}

// Extra parts some cameos use: a tongue (flick it with frogTongue(frog, 0..1)) and a throat sac (frogCroak(frog, 0..1)).
export function frogExtras(frog) {
  const body = frog.userData.body;
  const tongue = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8), clay(0xe8788a));
  tongue.geometry.translate(0, 0.5, 0); tongue.rotation.x = Math.PI / 2 - 0.25; tongue.position.set(0, 0.33, 0.5); tongue.scale.y = 0.001; tongue.visible = false;
  const sac = mesh(new THREE.SphereGeometry(0.22, 18, 12), clay(0xe9f3c9));
  sac.position.set(0, 0.2, 0.46); sac.scale.setScalar(0.001);
  body.add(tongue, sac);
  frog.userData.tongue = tongue; frog.userData.sac = sac;
  return frog;
}
export function frogTongue(frog, k, reach = 1.4) {
  const tg = frog.userData.tongue; const e = Math.sin(Math.PI * clamp(k));
  tg.visible = e > 0.01; tg.scale.y = Math.max(0.001, e * reach);
}
export function frogCroak(frog, k) {
  const s = Math.sin(Math.PI * clamp(k)); frog.userData.sac.scale.setScalar(Math.max(0.001, s * 1.25));
}
