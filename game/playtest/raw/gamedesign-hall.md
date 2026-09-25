# gamedesign · the hall

## Summary
(in progress)

## Findings
### hall
- **[major] [hub/progression]** Finishing a hall vignette and clicking *Back to the house* on the game-over card drops you in the *first room* at its centre spawn (0, 5.5), not in the hall beside the portal you used. To try the next hall vignette you must walk to the ladder, climb, and walk the hall again every time.
  Evidence: grandfather-paradox game-over → `#over [data-act=home]` → `level=house you at (0.0, 5.5)` (t=163s).
  Suggestion: the card button should return to the room that owns the portal (`hall`, with `ctx.from` = the vignette id so you stand by the clock). Label it by room ("Back to the hall").

### grandfather-paradox
- **[major] [pacing/goals]** The whole vignette is one ~40 s walk on a fixed clock with no choice beat. The grandfather starts walking the moment you land (seg 0 u=0.89 five seconds in), the central question "So what happens if you stop him?" is only voiced at seg 3, ~5 s before they meet, and then it's game over. On my first run I read the newspaper (the aside the level puts right by the spawn), walked towards the gate, found "Close the gate" already disabled, and the card told me **"You let it be"**, which is a judgement of a choice I never got to make.
  Evidence: arrive t=55, paper t=65, `use close the gate` → "disabled right now", `phase: over` t=80.3, card t=92.5 "You let it be".
  Suggestion: hold the grandfather at his front door until the player first moves off the machine (or until the `see_gf` line finishes plus a beat), voice the question *before* the first opportunity (gate), and slow him down (time slow per GAME.md pillar 3) when the player is within reach of an interactable. Don't award "You let it be" to a player who never had an enabled option in range; loop the walk instead ("He sets off again" / rewind) so the first run is a learning run.
- **[major] [structure/replay]** No multi-run structure and no rewind: a single walk ends the vignette, and *Play again* restarts cold with the same arrival line; the narrator never acknowledges that you already tried (GAME.md §3: "the narrator acknowledges whether you chose the same or differently"; endings after "a small number of completed runs"). There's also no twist after the first run.
  Evidence: runs 2 and 3 open with the identical "The past. The town where your grandparents met." and same script.
  Suggestion: rewind the town after the meeting (the time-travel theme begs for it) and let the player try up to 3 walks in one visit; on run 2+ voice a short acknowledgement ("Again." / "Different door this time."), and use the "tried N ways" ending only after the last run. A twist could be that on run 2 you see evidence of your *own* earlier attempt (the gate already closed, a second you by the signpost).
- **[minor] [feedback]** Feedback for turning the signpost ("He doesn't even look at the sign") is queued behind `see_gm` + `ask` and plays at t=125 — *after* the meeting and after `phase: over` — so the consequence of the action arrives out of order with the reflection.
  Evidence: turned sign t≈113, sign_fail caption 125.1 s, phase over 124.1 s.
  Suggestion: give failure lines priority (interrupt/skip the queued descriptive lines), or trigger `sign_fail` when he passes the sign, not when u>0.6 of seg 4.
- **[minor] [feedback/fairness]** "Stand in his way" counted as an attempt when I merely walked past him on my way to the signpost ("He steps around you, and apologises."), and the card said "You tried 4 ways". An accidental bump reads as a deliberate choice.
  Evidence: run 2, walking from gate to signpost at t≈111.
  Suggestion: count blocking only when the player stands still in his path for ~1 s, or require facing him.
- **[minor] [onboarding/affordance]** The first and only prompt at spawn is **"Go home"**, and one E press ends the vignette with no confirmation (card at t+2 s: "You left the past alone"). A player mashing E to "interact with the time machine" or skipping a line leaves immediately. Meanwhile the paper aside is the next nearest thing, luring you away from the clock-driven action.
  Evidence: run 3: press e at t=147 → phase over 147.4.
  Suggestion: disable "Go home" for the first ~10 s or until the grandfather is seen; or make it a two-step ("Go home?" → E again). Move the paper stand along his route so reading it doesn't cost the whole run.
- **[minor] [bug/narration]** After leaving early, the queued `see_gf` line ("That's your grandfather. Young, and in a hurry.") plays *between* the two reflection lines, since the grandfather still walks into view.
  Evidence: run 3 captions: 149.6 "You came all this way…", 153.3 "That's your grandfather…", 157.1 "Maybe that's…".
  Suggestion: stop discovery triggers once `S.phase === 'over'`.

### infinite-monkey
- **[major] [core loop/decision]** The loop is a fixed 3-step progress bar: pull lever (3.2 s), read page, repeat; the third pull *always* yields "to be, or not to be", with pages 1 and 2 scripted to show exactly one and two words. There is no uncertainty, no decision and no reason to read between pulls (I pulled 3× without reading, then one read ended the vignette at t=197). The only real choice is "Walk out", and the lever is a "next" button. It also teaches the opposite of the idea: that Hamlet is 3 million years away.
  Evidence: run 2, `waits` 0→3 by lever only, one `Read a page` → `phase: over`, card "Three million years of noise, and then a line of Hamlet."
  Suggestion: make the wait an act of patience the player controls and can give up on: e.g. holding the lever spins the counter by orders of magnitude (10³, 10⁶ … 10⁵⁰ years; add a "the universe ends" beat when it passes ~10¹⁰⁰), with each page showing the *best* fragment so far found by chance (length growing roughly logarithmically). The ending then asks whether you keep holding past the heat death, which turns "walk out" into a real position (the finite vs. the ideal "forever").
- **[minor] [affordance]** "Wait a million years" is silently disabled until you have read one page (`enabled: S.readAt >= 0`). A player who goes to the glowing red lever first (the most game-like object in the room) gets nothing: no prompt, no line, `use` fails for 20 s ×3.
  Evidence: run 2, three `use wait a million years` attempts from t=87 to 160, `waits` stayed 0.
  Suggestion: always enable the lever, or show it with a dimmed prompt "Read a page first", or have the monkey nearest the lever hand you a page.
- **[minor] [UI]** The prompt pill "E Wait a million years" sits exactly on top of the years counter label, so the one piece of feedback for the action (the counter) is hidden while you stand at the lever.
  Evidence: shots/025-t38.jpg.
  Suggestion: anchor the counter to the back wall (a big mechanical odometer) or offset the prompt below the lever.
- **[minor] [feedback]** The counter overshoots: after "A million years go by." it rests at 1,010,417 and 2,010,417 years, but 3,000,000 on the final pull. It reads like a bug.
  Evidence: status after each pull.
  Suggestion: clamp the counter to the exact target at the end of each wait.
- **[minor] [narrative/journal]** The *Walk out* card says "You never saw it happen", but the journal question on the same card says "The monkeys typed 'To be, or not to be' without meaning it…", so it presumes an event the player didn't see.
  Evidence: run 1 card at t=76.
  Suggestion: per-ending journal question, or phrase it conditionally ("If a monkey typed…").
- **[polish] [UI]** On the Hamlet ending the page overlay stays up behind the game-over card; the typewriter text shows through and makes the card hard to read.
  Evidence: shots/029-card2.jpg.
  Suggestion: close `ctx.page` before `ctx.gameOver`, or let the player close the page first and hold the card until then.
- **[polish] [feedback]** Re-reading without waiting gives the identical page and the same caption again ("Two words, in the right order."); "Read a page" implies a fresh one.
  Suggestion: new random page each read with a line like "More nonsense." until the next wait.
