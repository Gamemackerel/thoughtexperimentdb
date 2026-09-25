# bugs · the hall

## Summary
- The hall and its five vignettes all play end to end and every listed ending is reachable, but async "ending chains" outlive their level: pressing Esc during an ending in Simulation or Fermi shows that vignette's game-over card **in the first room**, locks the controls and writes a bogus `"house"` journal entry (100% reproducible). Narration from a vignette also leaks into the next level.
- Navigation back is wrong: every way out of a hall vignette (game-over "Back to the house", Esc) lands in the first room, never beside the portal in the hall; the hall's `ctx.from` spawns are dead code. Esc in the hall itself asks "Leave this vignette?".
- Several sequence breaks give endings whose text contradicts what happened: Commons "the grass came back" when it never went (bell at t=10 s), Monkeys "three million years" after five, Grandfather "something always got in the way" after leaving before anything could.
- Event counting is off in Grandfather: telling him who you are (or closing the gate) also counts as "standing in his way", so the card says "You tried 2 ways" and an extra failure line plays.
- Voice-queue timing makes key questions arrive after the decision (Monkeys, Grandfather, and Commons, where with fast play the question lands when the grass is already at 0.01).
- None of the five hall vignettes acknowledges a replay (GAME.md: "Replay acknowledges the second choice"): replays play identical lines.

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

- **[minor] [bug/text]** Esc in the hall asks "Leave this vignette and return to the house?" (the hall isn't a vignette) and drops you in the first room. Main.js only exempts `level.name !== 'house'`.
  Suggestion: exempt hub levels (`house`, `hall`) from the Esc prompt, or word it "Go back down to the first room?".
- **[minor] [cross-cutting] [replay]** No hall vignette acknowledges a second run: Grandfather, Monkeys, Simulation, Fermi and Commons all replay the exact same lines after "Play again" (checked 2+ replays each), against the GAME.md checklist item "Replay acknowledges the second choice".
  Suggestion: keep a per-vignette run history in `save` and add one "again"/"differently" line per vignette.
- **[minor] [cross-cutting] [asides]** `look()` asides are disabled whenever *any* narration is playing (`!ctx.voice.busy`, extras.js l.24), so the prompt blinks away during lines: e.g. Grandfather "Read the paper" shows `[disabled]` at t=28.8 s in phase `walk` while the intro plays. In Grandfather the voice is busy most of the scene.
  Suggestion: queue the aside line instead of disabling the prompt, or only block while another *aside* line is playing.

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

### infinite-monkey
Played 4 runs: lever ×5 then read; proper read/lever ×3; walk out; Esc mid-wait. Endings: "Given forever", "You walked away".
- **[major] [bug/voice leak]** The vignette's intro narration keeps playing after you leave. Recipe: Play again → read a page → pull the lever → Esc during the million-year wait (t=145 s). In the first room: caption "They hit the keys at random. They will never stop." (shots/022-after-esc-wait.jpg), then at t=153 s "Given forever, could they type Shakespeare?". The intro is a fire-and-forget `(async () => { await ctx.wait(1); await voice.say('arrive'); … voice.say('ask') })()` (infinite-monkey.js l.119); `dispose()` → `voice.stop()` doesn't cancel the awaits still pending, so they resume in the next level. Same pattern exists in grandfather-paradox.js l.125 and likely every vignette.
  Suggestion: give each level a generation token/AbortSignal (`ctx.alive()`), have `ctx.wait` and `voice.say` reject or no-op once the level is disposed.
- **[major] [bug/sequence break]** The whole escalation can be skipped, and the ending text lies about it. Recipe: read one page (unlocks the lever: `readAt >= 0` is all it checks), pull the lever 5 times in a row, then read → instant "There it is." Card: "Three million years of noise, and then a line of Hamlet." with the lever label reading 5,031,250 years. The "A word…" / "Two words…" beats never play. The lever has no cap (`waits` 4, 5, …).
  Suggestion: enable the lever only when `S.readAt === S.waits` (you've read this million years' page), and build the card text from `S.waits` (or cap it at 3).
- **[minor] [bug]** The year counter overshoots: each pull ends at 1,010,417 / 2,020,833 / 3,031,250 years, not whole millions (`years += dt*(1e6/3.2)` for one frame past `k>=1`).
  Suggestion: set `S.years = S.waits * 1e6` when the wait ends.
- **[minor] [bug/voice]** Lines fire twice or late when you act quickly: spamming E on the lectern (read, put down, read) queued "Nonsense. Nothing but nonsense." twice (t=10.0 and 13.3 s). And the question "Given forever, could they type Shakespeare?" is spoken *after* the player has already read and pulled the lever (t=67.7 s in run 2, 23.6 s in run 1), because the intro chain waits behind the queued page/lever lines.
  Suggestion: `page_0` with `once: true` per million years (key on `S.waits`), and drop the intro's `ask` if the player has already pulled the lever (or say it before enabling the lectern).
- **[minor] [narrative]** Walking out without ever reading a page still says "Most of it is noise." and the game-over journal question ("The monkeys typed 'To be, or not to be' without meaning it…") presupposes the found ending, which this player never saw.
  Suggestion: a journal question per ending, or a neutral one ("Would you have kept waiting? Why?"); gate the "noise" line on `S.readAt >= 0`.
- **[polish] [UI]** On the found ending, the page overlay and the "250 years" / years label stay visible behind the translucent game-over card (shots/020-mk-over.jpg): three layers of text on top of each other.
  Suggestion: close the page and hide world labels when `gameOver` shows.
- **[polish] [UX]** "Walk out" is disabled until the intro's `ask` line has been said (~20 s, longer if lines are queued); a player who walks straight to the door gets no prompt and no hint.
  Suggestion: enable it from the start, or after the first line.
- Verified OK: Play again resets `waits/years/readAt` and the paper piles.

### simulation-argument
Played 5 runs: full "Leave them running", full "Switch them off", Esc right after switching off, Esc during the reveal, sequence-break attempt (Run more worlds before Look closer: correctly disabled). Both endings reached.
- **[blocker] [bug/state]** Esc right after "Switch them off" shows the Simulation game-over card *in the first room* and corrupts the journal. Recipe: reach `choose`, E "Switch them off" (t=60.3 s), Esc at t=60.6 s. At t=62.3 s in the house: caption "You switch them off. Above you, the lights flicker."; at t=67.6 s the card "You switched them off" appears over the first room with `journal question: -`, controls locked (shots/037-esc-after-off.jpg). `localStorage['ted.journal']` gains a `"house": {"ending":"You switched them off"}` entry, and the real Simulation entry in the journal has no ending or date. "Play again" on that card reloads the *house*. Cause: the `onUse` async (simulation-argument.js l.116: `await ctx.wait(2.2); await voice.say('off_end'); … ctx.gameOver(...)`) keeps running after `dispose()`, and `gameOver` writes to `level.name` of whatever level is current. Any vignette whose ending is an awaited chain has the same hole (monkey's `found`/`leave_end`, grandfather's `end()`).
  Suggestion: same per-level abort token as in the monkey finding; `ctx.gameOver`/`save.complete`/`journal.write` should ignore calls from a disposed level. Also remove the stray `house` key from saved journals on load.
- **[major] [bug/voice leak]** Esc during the reveal (t=52.1 s) → in the first room at t=54.9 s: caption "Somewhere, someone may be looking at you the same way." (the chain in `Run more worlds` l.111–114 continues, and also sets `player.enabled`/`outside.visible` on a dead level).
  Suggestion: as above.
- **[minor] [clarity]** When the `choose` phase starts (t=55.8 s) nothing says that the choice is open: no line, no prompt on screen (the player is standing at "Run more worlds", now disabled; "Switch them off" has a small 1.8 radius on the same desk and the door is 10 m away). A player who doesn't know to hunt for prompts will stand there.
  Suggestion: after "pullout", show the switch's prompt from further away (or glow the switch and the door), or one short line ("You could switch them off. Or leave them be.").
- **[polish] [save]** Leaving mid-ending still marks the portal done ("Simulation Argument ✓" in the hall after the Esc run above), because `save.complete` runs in the leaked chain.
  Suggestion: fixed by the abort token.

### fermi-paradox
Played 4 runs: moon + logbook + listen + send; listen + keep listening; keep listening + Esc during the lapse; idle 60 s. Both endings reached.
- **[blocker] [bug/state]** Same leaked-ending bug as Simulation: "Keep listening" (t=87 s), Esc 1 s into the lapse → first room, t=91.8 s caption "Nights become years…", t=99.3 s the "You kept listening" card over the first room, `journal question: -`, controls locked, and `ted.journal` gets another `"house"` entry (it overwrote the Simulation one). Reproducible every time. (Fix once, centrally: see simulation-argument.)
- **[minor] [pacing/clarity]** Standing idle after arrival: in 60 s of game time (t≈37–97 s) nothing happens after "A clear night…": no line, no nudge, and "Send a message" stays disabled until you've found "Listen" (it needs `voice.said.has('ask')`). A player who walks to the obvious lever first gets no prompt at all.
  Suggestion: after ~15 s idle, let the console crackle/glow (or say "listen" line on proximity); or enable the lever from the start with the question asked on first use.
- Verified OK: the Listen prompt becomes "Keep listening" after the first listen; asides are one-shot and don't re-fire.

### tragedy-of-the-commons
Played 5 runs: bell straight away, 6 spaced adds → collapse, 1 add + talk + bell when thin, idle 60 s, 8× E spam at the pen. Both endings reached.
- **[major] [sequence break/narrative]** You can "agree on limits" before there is any problem. Recipe: arrive, walk to the bell, ring it at t≈10 s (grass = 1.0, no sheep added, the question never asked). Captions: "You ring the bell…" then the intro's leftover "Five neighbours, two sheep each. The grass is thick." (t=17.5 s) then "Together, you agree on limits." Card: "You agreed on limits … The grass came back." It never went.
  Suggestion: enable "Ring the bell" only once the grass is thin (`voice.said.has('thin')`), or give the early bell its own honest ending ("Everyone came. Nobody saw the problem yet. They went home.").
- **[major] [bug/pacing]** The question arrives after it's too late. With 6 adds spaced ~3 s apart, "So why would anyone stop?" was spoken at t=60.7 s with grass 0.63, and the pasture collapsed at t=69 s: 8 s to find and ring the bell. With E spammed 8× at the pen (t≈250 s), "thin" and "ask" were queued behind `add_1` and spoken at t=256.9/259.5 s when `grass` was already 0.01; collapse at t=265.9 s. There was no chance to act on the question. The adds also have no cooldown (8 presses → `mine: 10`, `adds: 8`, 40 neighbour sheep, 104 root children).
  Suggestion: a cooldown on "Add a sheep" (wait until the neighbours have copied), a cap on adds, and slow the decline (or pause it) until the ask line has finished plus ~15 s; the pillar is "no timers you can lose to".
- **[minor] [bug/voice]** "Your neighbours notice. They add sheep too." never plays if you add a second sheep within ~6 s of the first: `if (S.adds === 1) voice.say('follow')` is checked after `await voice.say('add_1'); await ctx.wait(2.5)`, by which time `adds` is 2. Seen in the 6-add run (no "follow" caption between t=42.6 and 58.1 s); it did play in the 1-add run (t=110.2 s).
  Suggestion: capture `const first = ++S.adds === 1` before the awaits.
- **[minor] [design/dead end]** Doing nothing never ends: with 10 sheep the grass is in exact balance (`0.02 − 0.002·10 = 0`), so after 60 s idle grass = 1.0, no question, no ending; the only way out is Esc.
  Suggestion: let the neighbours add sheep on their own after ~20 s of inaction (which is also truer to the model: you don't need to start it), so doing nothing leads to the collapse or the bell.
- Verified OK: neighbour talk lines change with the grass level ("Well, you added one. Why shouldn't I?" at grass 0.47); "Look at your sheep" works.

## Keep
- The hall itself is solid: all five portals labelled, completed ones get "✓", talk asides cycle correctly, the gentleman's lines are lovely.
- Esc with the notebook open closes only the notebook; Play again cleanly resets each vignette's state (`waits`, `years`, `grass`, `attempts`, piles, sheep).
- Grandfather's "ordinary reasons" failure design (wind, habit, a laugh, stepping around you) is exactly Lewis's point and reads well.
- Neighbours' lines in Commons that change with the grass level; Monkeys' page with the highlighted line; Simulation's pull-back to the giant.
- Journal answers typed on the card persist and show in the first-room journal.

## Harness notes
- `use "Tell him who you are"` (a prompt on a moving character) chased the grandfather for 20 s without triggering; manual `walk`/`hold` worked. Also `walk` often stops early against a line of fence posts ("did not arrive, blocked").
