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
