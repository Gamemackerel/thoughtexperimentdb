# generic-wild · THE HALL (hall, grandfather-paradox, infinite-monkey, simulation-argument, fermi-paradox, tragedy-of-the-commons)

## Summary
- Nothing crashed. I rushed, skipped, spammed E and did things out of order, and every vignette still reached a game-over card. But **the narration can't keep up with an impatient player.** The voice is a strict FIFO queue, so describe-lines, questions and reactions arrive 5–15 s after the moment they belong to. They often contradict the screen ("The grass is thick." over bare dirt; "A word. Just one" over a page showing two). This is the biggest problem for someone who doesn't play along, and it affects every vignette I played.
- **Lines from the previous level leak into the next** after Esc, Go home or Back to the house (monkey lines in the first room and the hall; the grandfather intro line in the middle of the reflection). Root cause looks like `Voice.stop()` resolving pending promises, which lets old async line chains carry on.
- **Leaving always goes to the first room.** Esc, "Back to the house", and even Esc *in the hall itself* all go to the first room, so every hall vignette costs a ladder climb. The hall never gets the "come back beside the portal you used" treatment.
- **A skipper can reach every "good" or quiet ending without meeting the dilemma.** The commons bell works before a single sheep is added. "Go home" in the grandfather paradox works 1 s after arrival and still counts as completed (✓). "Walk out" in the monkeys works before reading a page. None of the hall vignettes has the template's "choice comes round again" replay: the first outcome is always the game-over.
- Soft stalls work the other way. In the simulation argument, if you don't find "Run more worlds", nothing happens, forever. Doing nothing is not a real option there.
- The scenes themselves look good, and the Magritte hall is a delight to run around in.

## Findings

### hall
- **[major] [navigation]** Every exit from a hall vignette goes to the *first room*, not back to the hall. Esc (with its confirm dialog), "Back to the house" on the game-over card, and the grandfather "Go home" card all do this, so I climbed the ladder 5 times. Pressing Esc *in the hall* asks "Leave this vignette and return to the house?" and drops you in the first room, but the hall isn't a vignette.
  Evidence: `main.js:121` `goto(act === 'again' ? level.name : 'house')` and `main.js:181` `level.name !== 'house' && confirm(...) goto('house')`. Esc at hall t=13.7 → house (2.5, 3.4). Shot 018.
  Suggestion: keep a "hub" per vignette (the level the portal lives in) and `goto(hub)` with `ctx.from = vignetteId`, so the hall spawns you beside the clock/typewriter/etc. Don't treat `hall` as a vignette in the Esc handler (either no confirm, or "Climb down to the first room?").
- **[minor] [ui]** The apple-hat man's speech bubbles linger. Pressing E 3× stacked three bubbles in the DOM, and one was still floating over the commons gate ~6 s after I'd walked 12 m away. It had detached from the man and was anchored at a spot with nothing there.
  Evidence: shot 006 (t=31.5, "Everything we see hides another thing, you know." over the gate/grass, man off-screen).
  Suggestion: clear or replace the previous bubble on each new line, and hide bubbles when the player leaves the talk radius.
- **[minor] [camera]** At the east end of the hall (16, 3) the player is almost entirely behind the right-hand red curtain.
  Evidence: shot 004.
  Suggestion: clamp the camera/walkable area so the curtain can't sit between the camera and the player, or fade the curtain when it occludes the player.
- **[minor] [pathing]** Tap-walk from behind the typewriter table (-6.3, -4.1) to (9.5, -3) gave up after 1 s ("blocked"). The steering doesn't back out of the gap between the table and the wall.
  Evidence: shot 069.
  Suggestion: pad the table blockers so the gap behind them isn't walkable, or have the steering back off before declaring itself blocked.
- **[polish] [ui]** At the hall spawn, the "Down to the first room" label and the "Climb down" prompt sit on top of the player's head.
  Evidence: shot 002.
  Suggestion: offset the hatch label away from the spawn point, or spawn the player a metre further in.

### grandfather-paradox
- **[major] [pacing/narrative]** The narration lags the action by a lot when you act fast. I closed the gate before the grandfather was even introduced, told him who I was at 86.4 s, and turned the sign at 96 s. Here is what the captions did:
  - "He laughs. What a strange thing to say" came at 101.3 s, 15 s late, after he had walked on.
  - "He doesn't even look at the sign" came at 105.7 s, *after* phase `over` (104.0).
  - The central question "So what happens if you stop him?" came at 96.2 s, after I'd already tried three ways.
  Evidence: run 2, t=79–125.
  Suggestion: give reaction lines priority. Interrupt the current describe-line (or drop describe-lines that are now stale, e.g. skip `ask` if `attempts.size > 0` and use a shorter "Try again?" line instead). Add a `maxAge` to queued lines so they're discarded if they can't start within ~3 s of being triggered.
- **[major] [clarity]** On my first run I rushed toward the grandfather the moment I arrived and simply never caught him. He meets the grandmother 10 s after the question is voiced (ask 50.7 s, meet 61 s), and the card said "You let it be", though I'd been trying to stop him the whole time. There is no second chance: the first meeting is always the game-over.
  Evidence: shots 008–012.
  Suggestion: follow the template's replay. After the meeting and reflection, rewind the town and let him walk again (the narrator notes if you tried something new). End on the 2nd or 3rd pass, or when the player has tried everything. At minimum, don't start his walk until the player is within sight of the route.
- **[major] [bug]** "Go home" is enabled from the first frame, and the prompt is on screen at spawn. One E press ends the vignette. It counts as completed (✓ on the hall label, and the journal entry is overwritten with "You left the past alone"). Also, the intro line "That's your grandfather. Young, and in a hurry." plays *between* the two reflection lines (130.6 "You came all this way…" → 134.2 intro line → 138.0 "Maybe that's the only story that works").
  Evidence: run 3, t=126.7–142.7.
  Suggestion: enable "Go home" only after `see_gf`, or require walking back to the machine after moving away. Cancel the intro coroutine when `end()` runs (check `S.phase === 'over'` between awaits). Don't `save.complete` on an early leave, or at least don't overwrite a richer earlier ending in the journal.
- **[minor] [harness-ish/interaction]** Because the "Tell him who you are" interactable moves with the grandfather, tap-walking to where the prompt *was* leaves you standing in the empty street.
  Suggestion: when he's walking, add a short "Wait!" style catch-up: if the player runs toward him within ~5 m, he slows for a second.

### infinite-monkey
- **[major] [narrative/bug]** The lines are misaligned with the pages when you move at normal speed (read → lever → read):
  - "A word. Just one, by pure chance." was captioned over the page whose highlight shows **"to be"** (two words) (shot 027).
  - The Hamlet page appeared under "Two words, in the right order.", then a second "A million years go by." (139.3), and only then "There it is." (142).
  - "Given forever, could they type Shakespeare?" played after my first million-year wait. The arrive line played during the wait.
  Evidence: t=112–151, shots 027, 028.
  Suggestion: the same fix as above (reaction lines interrupt; stale describe-lines drop). Tie `page_N` to the page actually being shown (call it with the same `waits` value as the `ctx.page()` call), and pass `once: true` for `wait` or skip it if one is already queued.
- **[major] [philosophy]** The card says "Three million years of noise, and then a line of Hamlet." The counter is linear (1,000,000 per lever pull), so the game teaches that this takes a few million years. The real point is that the expected time is unimaginably longer than the age of the universe ("forever is longer than it sounds" is the walk-out line, but the success path contradicts it).
  Suggestion: make each pull multiply the years (10^6 → 10^20 → 10^50…), with the counter switching to "a 1 followed by 50 zeros years". Change the card to something like "Unimaginably longer than the universe has existed, and then a line of Hamlet."
- **[minor] [bug]** Esc'ing out 3 s after arriving, the monkey lines kept playing in the next levels: "They hit the keys at random…" at 9.8 s *in the first room* and "Given forever, could they type Shakespeare?" at 13.6 s *in the hall*. This happened again on a later Esc (110.4 s in the house).
  Evidence: runs at t=8–14 and 108–110.
  Suggestion: `Voice.stop()` resolves pending promises, so any `await voice.say(a); await voice.say(b)` chain continues into the next level (using the old manifest until the new one loads). Reject or flag the promises instead (e.g. resolve with `false` and have chains bail), or give each level a generation token that `say()` checks.
- **[minor] [clarity]** "Walk out" becomes available as soon as the `ask` line is said, before you've read a single page. I walked out in 20 s and got "You never saw it happen", which is fair, but the exit is just a bare door frame beside the path to the lever, so it's easy to stumble into.
  Evidence: t=79.5, shot 022.
  Suggestion: require reading at least one page before "Walk out" enables, or move the exit away from the lever's path.
- **[polish] [ui]** The page overlay stays open under the game-over card and its text bleeds through the card (the "to be, or not t…" highlight shows behind the question).
  Evidence: shot 029.
  Suggestion: close `ctx.page` before `ctx.gameOver`.

### simulation-argument
- **[major] [pacing/soft-lock]** If you look closer but never find "Run more worlds", the vignette stalls. I stood 40 s after the zoom with no line, no prompt in view, and "Switch them off" / "Leave them running" disabled. The door does nothing before the `choose` phase either. Even after the reveal (`choose`), there was 30+ s of silence with no prompt visible from where the camera drops you, and nothing tells you the door is an option.
  Evidence: run 2, t=331–372. Run 1, `choose` at t=275, nothing until I walked to the door at 307; shot 041.
  Suggestion: after the zoom, if the player idles ~10 s, have the extra-worlds lever glow or add a nudge line. Let "Switch them off" work at any point after "Look closer" (the drastic option shouldn't be gated behind the second lever). In `choose`, give both options a soft glow so the door reads as a choice.
- **[minor] [collision]** Using "Look out of the window" parked me behind the desk at (1.1, -4.6), a point `walkable` says is false. From there, tap-walking to the photo was "blocked", and `use Run more worlds` couldn't reach its prompt in 20 s. I had to walk out manually via (-1.4, -0.4).
  Evidence: shot 035.
  Suggestion: move the window interactable's approach point in front of the desk, or add the desk-to-wall gap to the blockers.
- **[minor] [narrative]** Replay isn't acknowledged. My second run (switched off after leaving them running) got exactly the same lines.
  Suggestion: add one line on replay ("Last time you let them run.").

### fermi-paradox
- **[minor] [pacing]** You stand at the console to "Listen". After the four describe-lines, the same prompt turns into "Keep listening" at the exact instant "So where is everybody?" finishes (both at 550.8). An E-spammer ends the vignette with no silence after the question, which goes against pillar 3 ("the central question is voiced, then there's a long silence").
  Evidence: run 3, t=550.8.
  Suggestion: enable "Keep listening" / "Send a message" 3–5 s after `ask` ends, and use a different label or position (e.g. "Keep listening" on the chair) so a held E doesn't carry over.
- **[minor] [feedback]** Pressing E at the send lever before the question does nothing, with no prompt and no sound, for ~15 s.
  Suggestion: show a dimmed prompt, or give a tiny line/animation ("It isn't warmed up yet") so the player knows the lever matters.
- **[polish] [camera]** In the send ending, the player is cut off at the bottom edge of the frame while the dish swings.
  Evidence: shot 056.
  Suggestion: include the player in the framer points during the send cutscene.

### tragedy-of-the-commons
- **[major] [philosophy/pacing]** Ringing the bell 5 s after arrival (before adding a sheep) goes straight to "You agreed on limits … **The grass came back.**" The grass was never touched (`grass: 1` the whole time). The whole tragedy can be skipped in 18 s, and the card's text is false for that path.
  Evidence: run 1, t=578.7–596.9.
  Suggestion: keep the bell disabled (or have neighbours shrug: "What for? There's plenty.") until the grass is visibly thinning (e.g. `grass < 0.8`), and give the card a separate text if the grass never fell.
- **[major] [narrative]** Spamming "Add a sheep" (15 sheep in ~5 s) exhausted the grass (phase `over` at 610.8), and then the captions played in order:
  - "One more sheep." (603, after 7 adds)
  - "**Five neighbours, two sheep each. The grass is thick.**" (608, over bare dirt with ~50 sheep; shot 063)
  - "The grass is getting thin." (612, after it was gone)
  - The question "So why would anyone stop?" (614.9, after the game was already over)
  Evidence: shots 063–065.
  Suggestion: add rate limiting (one sheep per ~1.5 s, with the neighbours' copying visible between adds). Drop stale describe-lines. Don't voice `ask` once the phase is over.
- **[minor] [camera]** The caption pill covers the player at the pasture gate, and a foreground house crops the bottom of the frame.
  Evidence: shot 063.
  Suggestion: frame the player higher in the shot, or raise the caption above the bottom 15% when the player is there.

### cross-cutting (all hall vignettes)
- **[major] [design]** None of the five has the template's "consequence → rewind → choice comes round again". The first outcome is always the game-over, so a player who acted by accident or too early (common for my persona) never gets the reflective second pass or the "you chose differently" acknowledgement.
  Suggestion: add at least one rewind pass to each, as the first-room vignettes do.
- **[minor] [journal]** The journal keeps only the latest ending. My grandfather entry went from "It had already happened" (4 attempts) to "You left the past alone" (a 1-second exit).
  Evidence: shot 070.
  Suggestion: keep the most substantial ending, or list every ending reached.

## Keep
- The Magritte hall itself: the easel painting of the hidden view, the ceiling stairs, the man with the apple ("Everything we see hides another thing"), the bowler hats. Running around it is a pleasure, and the ✓ labels are clear.
- The grandfather's failure lines ("He steps around you, and apologises."), the "ordinary things got in the way" reflection, and the card "You could have stopped him, in a sense. You just didn't.": plain and faithful.
- The simulation argument's pull-back reveal of the giant face over the dome (shot 040), and the lights flickering when you switch them off (shot 046).
- The monkey page highlighting ("to be" glowing in the noise), and the bananas aside.
- Fermi's "Either they're rare, or they're quiet, or we're early." It sums the solutions up in one breath.
- The commons ending "Nobody owned the pasture, and nobody had to." (the Ostrom point, without names).

## Harness notes
- `use <prompt>` on a moving interactable (the grandfather) walks to the position it had when the command started and then times out; I worked around it by standing in his path.
- A voice mp3 request (`fermi-paradox/listen_end`) was aborted on level change (net::ERR_ABORTED). Probably just the navigation, not a missing asset.
