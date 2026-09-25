# bugs · fermi-paradox (pilot)

## Summary
- Both endings (keep listening, send a message) are reachable and play cleanly if you sit and watch. Gating is solid: "Send a message" stays disabled until "So where is everybody?", E-spam never double-fires anything, and Play again resets the state and voice properly.
- **Leaving mid-ending is broken.** The ending coroutines keep running after Esc, so the narration *and the game-over card* turn up in the first room, the vignette is marked completed, and a junk `house` journal entry gets saved. The same thing happens with the intro lines if you Esc during the listen sequence.
- Leaving a hall vignette (Esc or "Back to the house") always drops you in the middle of the first room, not beside the telescope in the hall.
- Two authored visuals never reach the screen: the message beam starts about 26 units up and is above the frame, and the moon you "look at" from the chair is far off-screen. The frog cameo also plays mostly below the bottom edge.
- There's no twist, no second run and no replay acknowledgement: the first choice ends the vignette. This departs from the GAME.md template (see the gamedesign/drama personas for more).

## Findings
### fermi-paradox
- **[blocker] [bug]** If you Esc during either ending, the ending carries on in the house. Recipe: Listen → wait for "So where is everybody?" → Keep listening → wait 2 s → Esc. In the first room, the caption "Nights become years…" plays at +2 s and the "You kept listening" game-over card opens at +10 s, with journal question "-". The same happens for Send (Esc 1 s after pulling the lever: "Years pass…" plays in the house, then the "You called out" card). `save.complete('fermi-paradox')` still runs, so the portal counts as done even though the player bailed, and localStorage gets `ted.journal = {"house":{"ending":"You kept listening",…}}`. On that stray card, "Play again" reloads the house.
  Evidence: t=36.8 Esc → t=39.4 caption and t=46.8 gameover while `level=house`; screenshot build/agentplay/pilot-bugs/run1/025-lapse-leak.jpg.
  Suggestion: in both `onUse` handlers, check a disposed flag (or a level token) after every `await` (e.g. `if (disposed) return;` with `dispose(){ disposed = true; … }`), or have `ctx.wait`/`voice.say` reject once the level is disposed. The same pattern probably affects other vignettes, so a core fix in `ctx.wait` would be better. `ctx.gameOver` and `save.complete` should also ignore calls from a level that is no longer current.
- **[major] [bug]** Narration leaks after Esc during the intro sequence. Recipe: Listen → Esc right after "Some are far older than the Sun…" → "So where is everybody?" plays over the first room.
  Evidence: run1, t=144.5 house loaded, t=145.0 `caption: So where is everybody?` in `level=house`.
  Suggestion: same disposed-guard as above. `voice.stop()` in dispose doesn't stop the pending `await ctx.wait(0.6); await voice.say('ask')` chain.
- **[major] [bug/flow]** Esc and "Back to the house" from Fermi, even when you came in through the hall telescope, drop you at the centre of the first room (0, 5.5). You then have to climb the ladder and walk the whole hall again. `main.js` hard-codes `goto('house')` in both places, although `hall.js` already has a spawn for `ctx.from === 'fermi-paradox'`.
  Evidence: shots run1/023-after-esc.jpg; `level=house you at (0.0, 5.5)` after every exit.
  Suggestion: return to the room that owns the portal (keep a `parentOf` map, or remember the room you entered from) so the hall spawn beside the telescope gets used.
- **[major] [visual/bug]** The "Send a message" beam is never visible. The beam cylinder (260 long, centred at dish-local (0,133,-80), tilted -0.6) has its bottom end at about y=26, z=-11, well above the dish and above the top of the frame from the send camera. In every screenshot from sendT 0.2–6 s there's no beam; only the dish tilts slightly. The player's one big action has no visible payoff.
  Evidence: run1/018-t108.jpg (sendT≈2.5, beam opacity 0.55, nothing on screen); eval gives the beam world centre (5,133,-84).
  Suggestion: anchor the beam at the feed horn (put the cylinder's base at the horn, e.g. `geometry.translate(0,130,0)` and parent it to `bowl`), and pull the send camera back or up so the first ~20 m of the beam are in frame.
- **[minor] [visual/narrative]** "Look at the moon" (at the chair) refers to a moon that isn't on screen. Projected to NDC from the chair, the moon is at (-1.91, 2.09), far outside the frame. It only drifts into view during the time-lapse (run1/021-t117.jpg, top edge).
  Suggestion: move the moon so it sits in the upper frame from the chair (roughly toward -x, lower y), or have the aside nudge the camera up toward it.
- **[minor] [camera/frog]** The frog cameo (the shooting star) runs at z≈7–10, behind the player and below the frame while you're at the console, which is where the game puts you at that moment. I only saw a green sliver at the bottom edge.
  Evidence: shots/005-t13.jpg, run1/008-t27.jpg (bottom right).
  Suggestion: move the cameo path toward z≈4–5 or to the side of the console, so it plays in frame while the listen lines run.
- **[minor] [bug/ui]** The notebook (N) doesn't pause anything. With it open I walked to the console and triggered "Listen", and that pivotal caption was hidden under the notebook card. The prompt was invisible too.
  Evidence: shots/003-nb-open-listen.jpg (Listen fired at t=7.5 with the notebook open, no caption visible).
  Suggestion: block movement and interaction (or pause the level clock) while the notebook is open, or at least lift captions above it.
- **[minor] [camera]** During the send ending the camera tilts up and the player is cut to a head in the bottom-right corner, with the lever almost out of frame, for the whole consequence.
  Evidence: run1/019-t111.jpg, run1/021-t117.jpg.
  Suggestion: include the player and lever in the framer's points during `send`, or offset the tilt less.
- **[minor] [narrative]** On the "keep listening" ending, the card repeats the last narration nearly word for word ("rare… quiet… early" is voiced, then printed again two seconds later).
  Suggestion: give the card text a different beat (e.g. something about the logbook getting one more "Nothing" entry), or drop the rare/quiet/early triad from one of them.
- **[minor] [bug/journal]** The journal answer carries over between endings. I answered on "You kept listening", replayed and chose Send: the card pre-filled my old answer, and the saved journal now shows "You called out" with an answer I wrote for the other ending.
  Suggestion: keep the latest answer but show which ending it was written for, or store answers per ending.
- **[minor] [design]** The first choice ends the vignette immediately: no rewind, no second run, no twist, and Play again doesn't acknowledge the previous choice. GAME.md §3 asks for "after the first run, a twist opens a new option" and "Replay acknowledges the second choice".
  Suggestion: after the first ending, return to the hilltop years later (the logbook is thicker) and let the other option or a new one (e.g. a reply that's ambiguous, or deciding to switch the dish off) close it out.
- **[polish] [visual]** From every camera angle the dish shows its convex underside, so it reads as a brown mushroom cap rather than a receiving dish (only the tip of the horn pokes over).
  Evidence: run1/017-lever-before-listen.jpg.
  Suggestion: tilt the bowl toward the camera side, or lighten or texture its inside so the concave face reads.
- **[polish] [clarity]** Before Listen, the lever has no prompt at all (it's disabled). A player who walks there first gets no feedback that it's a thing.
  Suggestion: show a greyed prompt, or give the lever a short look line ("Not yet. First, listen.").
- **[polish] [ui]** The arrival caption sits over the player's head and body at spawn (run1/004-t11.jpg).
  Suggestion: move the spawn up the frame slightly, or raise the framer's bottom margin.

### hall (in passing)
- **[minor] [bug]** Esc in the hall asks "Leave this vignette and return to the house?" (the hall isn't a vignette). The first Esc at t=1.5, just after load, was accepted but did nothing; a second one worked.
  Suggestion: word the dialog per level type, and queue or ignore Esc during the load transition with visible feedback.
- **[polish] [visual]** The very first frame after `open hall` (t=1.3) shows the camera inside table legs (build/agentplay/pilot-bugs/shots/001-open.jpg was overwritten, but it looked like the underside of the hanging table). It settles by t=3.
  Suggestion: snap the camera to its framed position on level load instead of easing in from the previous pose.

## Keep
- The gating: Listen → four lines → only then the two choices. No double-fires under E-spam, and state resets cleanly on Play again (`voice.said` resets too).
- The lapse effect: the sky wheels, the Milky Way band sweeps over, a warm flicker. It reads as "years" immediately.
- The asides (cold tea, footprints on the moon) are short, warm and on theme.
- Captions, pacing and the silence after "So where is everybody?" work well.

## Harness notes
- **`teleport` deadlocks the session.** `teleport fermi-paradox` (from the house, after a game-over card) never returned. The server does `page.evaluate(() => __ted.ctx.goto(l))`, which awaits `goto`, and `goto` presumably waits on the frozen virtual clock. The per-session queue then blocks every later command (`status` timed out). A first `teleport` right after Esc returned but didn't change level. Recovery needed `kill -9` of the session's server.mjs (SIGTERM was ignored) and deleting `build/agentplay/pilot-bugs/port`. Suggest: don't await `goto` inside evaluate (fire it and then `adv()` until the level changes), and add a command timeout that returns an error instead of wedging.
- `eval "(__ted.ctx.goto('fermi-paradox'),'ok')"` returned but the level never changed, even after `wait 14`. So there's no reliable way to jump levels without `open` (which resets the clock and time).
- **Screenshot numbering restarts per server process**, so after the restart the new `001-open.jpg` overwrote my first shot. I moved the rest to `run1/` by hand. Suggest continuing the numbering from existing files, or a per-open subfolder.
- An open notebook or journal is echoed in full under "on screen now" on every command, which buries the useful lines. Suggest truncating to the first ~80 characters after the first print.
- Chaining commands with `;` in one shell call worked well. Long `wait` + `shots` is the best way to watch scenes.
- Missing info: no way to get the camera or project a world point without writing three.js in `eval` (`__ted.ctx.stage.camera` works). A `project <x> <y> <z>` or `inframe` command, listing which interactables and actors are on screen, would make framing bugs much faster to check. `debug` could also list the frog and actors.
- The status line shows `(moving)` right after `walk` says "arrived", which is a little confusing.
- Effort: about 80 game commands, plus one manual session recovery (about 10 minutes lost to the teleport deadlock).
