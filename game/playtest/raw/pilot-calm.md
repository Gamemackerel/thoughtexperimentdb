# generic-calm · house (brief) + trolley-problem

## Summary
- The trolley vignette lands. As a first-timer I understood the situation from the first four lines, the long slow-motion choice (about 33 s from `slow` to `go`) felt weighty and not boring, and the toy-like knock and the VHS "REWIND" were exactly "real, but gentle".
- I reached both endings: *Someone is always on the track* (3 runs: nothing, pull, nothing) and *You chose yourself* (after Play again: pull, then the third lever on run 2).
- The biggest content problem: from run 2 on, the replay line *replaces* the second reflection line. If you leave the lever alone first and pull it second, you never hear "But the one on the side track was never in danger, until you moved the trolley", which is the whole point of pulling.
- Runs start again by themselves about 4 s after "Go again, or step back through the frame." Nothing asks me whether I want to go again, so "You ran it 3 times" on the card felt like something done to me, not by me.
- The house reads as a lovely dreamlike menu. The painting, though, is half hidden behind the ladder and the ceiling hatch, and the floating labels overlap each other and the prompts.
- What I'd tell a friend: "Short, gentle, makes you feel the lever. Wait at the lever and don't rush it."

## Findings

### house
- **[minor] [clarity]** From the spawn view the Trolley painting is mostly covered by the rope ladder, and the "Up to the hall" label sits over it. The first thing a first-timer is meant to find is the hardest thing to read. The "Ship of Theseus" label floats faded in mid-air to the right, with no visible door under it.
  Evidence: `build/agentplay/pilot-calm/shots/002-t4.jpg`, `003-t7.jpg`.
  Suggestion: move the ladder or the painting so they don't overlap from the spawn camera. Hide a label whose portal is off-screen or on the ceiling, or point it at the object (an arrow or a leader line).
- **[minor] [UI]** Next to the journal desk, the "Your journal" label and the "E Read your journal" prompt stack right on top of each other. At the painting, "Your journal" also sits right beside the "Step into the painting" prompt, so I had to read carefully to see which object E would act on.
  Evidence: `shots/004-atpainting.jpg`, `shots/005.jpg`.
  Suggestion: when a prompt is showing, hide the label of the same object, and fade labels of other objects inside the prompt's radius.
- **[minor] [controls]** Tapping the wall or the painting does nothing. I tapped the painting to walk to it (screen 700,330 from the desk) and didn't move. Tapping the floor under it worked.
  Evidence: t=14.3 s, position (-2.0, -6.2) unchanged after `click 700 330`.
  Suggestion: when a tap hits a portal or its wall, walk to the portal's interact point.
- **[polish] [visual]** The very first frame after entering the house is a big, abstract close-up (a desk and flat bands of colour) before the camera settles into the room view.
  Evidence: `shots/001-open.jpg` (t=1.3 s).
  Suggestion: if this is a camera fly-in, start it from a readable framing, or hold a fade until the camera has settled.
- **[minor] [journal]** After finishing the vignette twice, the journal shows only the last ending ("You chose yourself · Sep 25"). My first ending (three runs) is gone. The first two to-dos (Foot and Thomson papers) aren't links, while the others are.
  Evidence: `shots/043-journal.jpg`.
  Suggestion: list every ending reached (e.g. "Endings: Someone is always on the track, You chose yourself"). Link the two papers (PhilPapers or a PDF), or style them as plain notes so they don't look like broken links.

### trolley-problem
- **[major] [narrative]** On runs 2 and 3, the reflection is `pulled_1`/`stayed_1` followed by `again_same`/`again_diff`. The second line of each branch (`pulled_2`: "…never in danger, until you moved the trolley"; `stayed_2`: "You didn't make this happen…") is dropped. In my first playthrough (nothing, then pull) I never heard `pulled_2`. I only heard it on the replay, when I pulled first.
  Evidence: t=123–126 s: "You pulled the lever. The five are safe." then straight to "This time you chose the other way…". Code: `game/vignettes/trolley-problem.js` ~line 198.
  Suggestion: the first time each branch is taken, always play its second line. Only swap in `again_*` when the branch has been seen before (or play it after the pair).
- **[minor] [pacing/agency]** "Go again, or step back through the frame." is followed about 4 s later by the next run starting on its own (t=91.7 caption, 95.3 `slow`). There's no "go again" act, so the line reads like a menu choice that never arrives. The run counter then ends the vignette after 3 runs whether or not I meant to "run it".
  Evidence: phases at t=91.7 → 95.3 s and t=258.0 → 261.5 s.
  Suggestion: make going again an act (walk back to the first lever, or the trolley waits at the tunnel until you touch the lever or step near the track). Or reword it to "It's coming round again. Or you can step back through the frame."
- **[minor] [narrative]** On run 3, I walked all the way to the third lever, stood on the third track through the whole run, and didn't pull it. The game didn't notice. The reflection only compared lever 1 with the previous run.
  Evidence: t=145–159 s, player at (17.2, 8.5), then "You left the lever alone… This time you chose the other way."
  Suggestion: add one line for "stood by your own lever and didn't pull it", e.g. "You went to your own lever. You didn't pull it." That hesitation is the most honest moment the twist creates.
- **[minor] [controls/bug]** Tapping the lever itself makes the player push into it for the rest of the scene: the status stays "(moving)" and the position jitters between about (-7.1, 3.6) and (-6.4, 3.0) for 60+ s, through the rewind. The same "(moving)" also shows right after `walk` says "arrived".
  Evidence: after `click 715 410` at t=28 s, "(moving)" until t=139 s. `shots/013-t49.jpg` shows the figure pressed against the lever.
  Suggestion: when the tap target is an interactable, stop at its radius instead of its centre, and clear the walk target on arrival or when blocked.
- **[minor] [camera]** The first tap toward the lever overshot. I ended up at (-2.2, 2.3) on the rails ahead of the trolley. The prompt disappeared and I had to walk back. The lever is small on screen (about 15 px) during arrival.
  Evidence: `shots/010-t36.jpg`.
  Suggestion: make the lever easier to spot and aim at (a soft glow in `slow`, which GAME.md already describes: "The lever glows"). I saw no glow.
- **[minor] [camera]** In the self ending, my knocked-over figure lies at the bottom edge of the frame, half off-screen, under the caption pill.
  Evidence: `shots/038-t291.jpg`.
  Suggestion: add the player to the framer's points during `aftermath` for the `self` route, and keep the caption clear of it.
- **[polish] [narrative]** The self-ending card says "The five walk away. So does the one." But behind the card they're all still standing on the track.
  Evidence: `shots/041-t299.jpg`.
  Suggestion: have the six workers turn and stroll off before the card, or change the text to "The five are fine. So is the one."
- **[polish] [UI]** Two-line captions render as two separate pills ("…They can't hear" / "it coming."). It looks like two lines of speech rather than one.
  Evidence: `shots/010-t36.jpg`, `shots/038-t291.jpg`.
  Suggestion: make the caption a single box, or widen it so these lines fit on one line at 1280 px.
- **[minor] [notebook]** The notebook says "This short film walks through Foot's original driver case…". In the game there's no film, so a first-timer is left wondering which film. The trolley also keeps running while the notebook is open (s went from 22.8 to 38.5, and `arrive` → `slow` happened behind the page), so captions can be missed.
  Evidence: notebook text at t=310 s, level state before and after.
  Suggestion: write a game-specific intro in `game/notebook/trolley-problem.json`, or link the film explicitly ("There's also a short film…"). Pause the vignette clock, or at least hold narration, while the notebook is open.
- **[idea] [clarity]** The journal question brings in pushing someone off a bridge, which the vignette never showed. As a newcomer it came out of nowhere, but it was also the most thought-provoking moment. The asides (talking to workers, "Look at the driver") never surfaced for me: I never walked near the workers, and nothing hinted that I could.
  Suggestion: add one quiet footbridge (or a large stranger standing on it) to the scene as set dressing, so the card's question has something to point back to. Consider a talkable worker near the lever's path.

## Keep
- The slow motion plus the long silence after "Should you pull it?". It gave me time to actually decide.
- The toy-like knock, the dust, the VHS "◀◀ REWIND". It's gentle and clear.
- The narration: short, plain, no names, and never judgemental. "You only decide who." is a great closing line.
- The self-ending card title "You chose yourself", and my journal answer being kept and prefilled on the next card.
- The ✓ on the painting's label after finishing.

## Harness notes
- **Effort:** about 55 game commands (open 1, wait 17, click 5, walk 5, press 9, look 4, clicksel 3, type 1, debug 1, quit 1, and so on), plus about 20 image reads. It fit well within the budget.
- **Clear and good:** the "what happened" log with timestamps, `[phase: …]` and exact caption text is excellent. It let me reconstruct the pacing without audio. `wait N shots` is the right tool for watching a scene. `debug` answered "where is the lever" immediately.
- **`open` skips the title screen:** the log shows the title text at t=0 and the house loads at 1.1 s, so I never judged the title screen or its "Enter the house" button. I'd like `open` to say explicitly that it clicked through (or use `open title` by default for first-timer personas).
- **"(moving)" is misleading:** it stays on after `walk` says "arrived", and for a whole minute while I was pushing into the lever. I couldn't tell whether the game or the harness was wrong, so I reported it as a game finding.
- **Text in text boxes isn't in the dump:** the journal page's "on screen now" left out my saved answer (it was in the screenshot). The first time, it looked like the answer hadn't been saved.
- **Timing blind spots:** a single `wait 20 2` jumped straight over `go` → `aftermath` → `rewind`, and I missed the first consequence. A `wait-until <phase>` (or "stop on phase change") command would help playtesters watch key moments without guessing durations.
- **Click coordinates vs a moving camera:** the authored camera reframes as you move, so a screen coordinate from the last screenshot is stale. `click` after even a short walk hit a wall once. Printing the on-screen pixel position of the prompt and interactables (or a `clickprompt` command) would help.
- **Missing info:** the list of endings is in GAME.md, but a `status` line with "endings reached so far" (from saves) would make it easy to confirm coverage.
- **Not an issue, but worth knowing:** `clicksel "#over [data-act=again]"` and `[data-act=home]` worked first time, and the Esc confirm dialog was auto-accepted as documented.
