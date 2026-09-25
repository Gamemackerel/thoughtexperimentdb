# bugs · the hall

## Summary
(in progress)

## Findings
### hall
- **[major] [bug/navigation]** Leaving any hall vignette drops you in the *first room*, not the hall. Grandfather Paradox → game-over "Back to the house" → `level=house` at (0.0, 5.5) (the default spawn, t=235s). Esc does the same. `game/main.js` hard-codes `goto('house')` in both the game-over click handler (l.121) and the Esc handler (l.181), so the hall's `spawnAt` table for `ctx.from` (hall.js l.270) is dead code: nobody ever arrives at the hall from a vignette. Every hall vignette costs a ladder climb to get back.
  Suggestion: give each level a `home` (hall vignettes → `'hall'`, room-1 vignettes → `'house'`) and use it in both handlers (and in the confirm text: "return to the hall?").
- **[minor] [bug/UI]** Talk-spam stacks speech bubbles. Pressing E five times on the apple-faced gentleman in ~2 s shows five overlapping bubbles at once ("Good afternoon." on top of "We always want to see…" on top of "The hats?…"), unreadable. Evidence: shots/003-talkspam.jpg, t≈19s. Bubbles also stay listed on screen while you walk the whole hall away from him (still there at t=25s beside the clock).
  Suggestion: one bubble per speaker (replace, don't add), or ignore E while the current bubble is younger than ~1 s.
- **[polish] [UX]** Hall spawn (-13.5, 1.4) is inside the "Climb down" prompt radius (dist 1.5 < 2.2), so the first E a player presses on arrival (e.g. to "interact with something") sends them straight back down.
  Suggestion: spawn ~1 m further into the hall (x ≈ -12.3).
- **[polish] [UI]** The first room's toast "Look around. Some things here lead elsewhere." is carried up the ladder and still on screen when the hall loads (t=3.9s), then replaced by the hall toast.
  Suggestion: clear toasts in `goto()` with the other overlays.

### grandfather-paradox
Played 6 runs: do nothing ×2, close gate, tell him, turn sign + Go home early, plus Esc-with-notebook. Endings reached: "You let it be", "It had already happened". Did not reach "You left the past alone" (see first finding).
- **[major] [bug/narrative]** Leaving early after any attempt plays the "something always got in the way" ending even though nothing did. Recipe: turn the signpost at t≈204 s (grandfather still on segment 1, nowhere near it), walk back to the machine, "Go home" at t=209 s → narrator: "Every time you tried, something ordinary got in the way. Not magic. Wind, habit, a laugh." / "It had already happened." Card: "It had already happened · You tried once. Each time, something ordinary got in the way." He never saw the sign and the couple never met on screen. `end(false, true)` only checks `S.attempts.size`, never `leftEarly`; so the "You left the past alone" title is only reachable with zero attempts.
  Suggestion: in `end()`, when `leftEarly`, use a left-early branch regardless of attempts ("You turned the sign and left before you could see what happened."), and only count attempts that actually *failed on screen* (gate blew, sign ignored, he stepped round, he laughed).
- **[major] [bug]** Telling him who you are also counts as "standing in his way". Recipe: catch him on his route (~(-6,-4.8), t≈152 s), E "Tell him who you are" → `attempts` becomes `["tell","block"]` (eval), then ~4 s after "He laughs… And he walks on." the narrator adds "He steps around you, and apologises." Card: "You tried 2 ways." You have to stand in front of him to get the prompt, so the block detector (`toYou.length() < 1.6 && dot > 0`) always fires. Same happens with the gate: closing it puts you on his path, and the gate run also reports "You tried 2 ways" plus the "steps around you" line.
  Suggestion: skip the block check while `S.pause > 0` / right after a tell, and require the player to stay in front of him for ~1 s (a deliberate block) before counting it.
- **[minor] [narrative/order]** The central question "So what happens if you stop him?" fires only at segment 3 (together with "see_gm"), i.e. *after* the gate option has already expired (`S.seg < 3`) and usually after you've already tried. In my gate run, it came 12 s after "A gust of wind…", as if you hadn't done anything yet.
  Suggestion: ask the question as soon as grandfather is introduced (after "see_gf"), and move "see_gm" to when the grandmother first comes into frame.
- **[minor] [collision/tap-to-walk]** The gate fence traps tap-to-walk. From (-9.3,-2.6) walking to (-8.5,-5) or (-11.5,-5) stops dead against the fence end ("did not arrive, blocked"), and from (0.2,-3.7) the player can't get round the right half to the signpost (20 s, prompt never shown; shots/013-gp-stuck.jpg). The fence is a row of r=0.35 post blockers that the steering doesn't route around; with WASD it's easy (hold a, then w).
  Suggestion: make the fence one capsule/segment blocker the path planner knows about, or leave a visible gap at each end and make sure steering tries both sides of a line of blockers.
- **[minor] [UX]** You can't reliably "Tell him who you are" by walking toward him: the `use` approach (i.e. chasing him with tap-to-walk) followed him for 20 s from the spawn without the prompt ever appearing, and the run ended "You let it be". He walks at 1.35 and his prompt is on a moving target.
  Suggestion: have him pause/turn when the player is within ~3 m in front of him and a prompt is available, or widen the tell radius.
- **[minor] [UX]** The notebook doesn't pause the scene: with `N` open from t≈240 s, grandfather keeps walking; a curious player who reads it on arrival misses the gate window.
  Suggestion: freeze `level.update` while the notebook is open (or at least `S.phase==='walk'` movement).
- **[polish] [text]** "You tried once. Each time, something ordinary got in the way." ("once" + "each time").
  Suggestion: "You tried once, and something ordinary got in the way."
- **[polish] [narrative]** "Wind, habit, a laugh." is spoken whatever you actually tried (sign only → still "wind" and "a laugh").
  Suggestion: build that sentence from the attempts that happened.
- Verified OK: Esc with notebook open closes only the notebook; second Esc leaves. Journal answer saves (`ted.journal`), clock shows "Grandfather Paradox ✓" in the hall. Frog appears once during the walk.

