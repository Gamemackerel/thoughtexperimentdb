# camera · the hall

Screenshots are under `build/agentplay/camera-hall/shots/`. Times are game time in that session.

## Summary
- The best shots in the hall set are very good. They are the Simulation Argument's push into the dome and over the shoulder of the tiny person at *their* dome, the reveal of your study under a dome on a giant's desk, the low-angle Fermi sky, and the Commons wide shot that shows the whole board. That quality is the benchmark.
- Several key payoffs happen **off camera**:
  - Fermi's "send" beam is never on screen.
  - Fermi's moon, which one aside is entirely about, is never on screen.
  - Fermi's frog and shooting star are below the frame.
  - The Simulation frog gag is hidden behind the player's head.
  - In the Commons agreement, the player is not in the circle.
- Narration desyncs from picture in the Grandfather Paradox. Captions describe actions 10–18 s after they happen, including one after the ending has already started. For a cutscene-you're-inside game, this is the worst "edit" in the set.
- Most vignettes lock the camera in one static wide shot (Monkeys, Commons, and Grandfather once the meeting starts). The moment of consequence never gets its own shot: no push-in, no two-shot, no reaction.
- Recurring UI/framing problems on almost every arrival:
  - The spawn puts "you" at the bottom edge, exactly under the caption pill.
  - The previous room's prompt is left hanging over the first frame of the new level.

## Findings

### house → hall
- **[minor] [transition]** Climbing the ladder in the first room shows a full frame of empty paper-coloured void with the peg floating in it, and the first room's toast "Look around. Some things here lead elsewhere." still showing. Only after that does the hall appear.
  Evidence: t=4.0, shots/003-t4.jpg.
  Suggestion: Hold the fade until the new level has rendered its first frame, and clear toasts/prompts on level change.
- **[minor] [framing/UI]** On arrival in the hall, the player is at the bottom left. The "E Climb down" prompt and the "Down to the first room" label are stacked on top of the player's head, and the red curtain covers the left edge.
  Evidence: shots/006-t7.jpg (player at about x=390, labels at y 440–510).
  Suggestion: Offset the spawn about 1.5 m away from the hatch (so its prompt isn't live on arrival), or anchor the hatch label to the hatch rather than the player position.
- **[polish] [camera]** The hall camera is a close side-tracking shot, so the Magritte ceiling pieces (upside-down table/chandelier) are never visible in landscape. Ironically they do show in portrait (186-portrait-hall.jpg). Walking the hall, the "Fermi Paradox" label sits faded behind the apple room.
  Evidence: 007/008/009-hall-*.jpg.
  Suggestion: Pull back or tilt up slightly when the player is between portraits, so the ceiling gag reads at least once.
- **[major] [navigation]** "Back to the house" on any hall vignette's game-over card, and `Esc` inside one, both return you to the **first room** at its default spawn (0, 5.5), not to the hall beside the portal you used. Every replay of a hall vignette therefore costs a ladder climb and a walk down the hall.
  Evidence: grandfather → shots/053-t131.jpg; commons Esc → shots/184-t162.jpg.
  Suggestion: Return to `hall` with `ctx.from = <vignette id>`, as GAME.md §3 asks ("give it a spawn for `ctx.from`").
- **[minor] [portrait]** In 390×844 the hall is a thin letterboxed strip, with about 60% of the screen empty paper above and below. Portal labels also clip off the left edge ("nite Monkey Theorem ✓").
  Evidence: shots/186-portrait-hall.jpg.
  Suggestion: In portrait, move the camera further back and higher so the hall fills the height (floor + wall + ceiling). Clamp labels inside the viewport.

### all hall vignettes (cross-cutting)
- **[minor] [UI/transition]** Every hall portal leaves its prompt ("Open the clock", "Sit at the typewriter", "Look into the screen", "Look through the telescope") floating over the first frame of the vignette.
  Evidence: 011-t19, 056-t5, 079-t6, 128-t8.
  Suggestion: Clear the interact prompt DOM when `goto` starts.
- **[major] [framing]** On arrival, and for most of every vignette, the player sits at the bottom of frame, where the two-line caption pill covers the body. This happens in grandfather (013), monkeys (059), simulation (083), fermi (131, 134, 137, 148; the player is cut at the waist) and commons (156, 161, 170, 176). The caption also often wraps so that one word sits on its own second pill ("met.", "one.", "count.").
  Suggestion (either works):
  - Add a bottom safe-area to `makeFramer` (reserve about 15% of frame height for captions).
  - Move captions to a top band.
  Also widen the caption max-width, or balance line breaks (`text-wrap: balance`) so a single word doesn't sit alone.

### grandfather-paradox
Played three times: did nothing / closed the gate, turned the sign, told him, stood in his way / "Go home" early. I reached all three game-over titles.
- **[major] [narrative sync]** The fail lines lag far behind the action. All lines share one serial queue behind the long "see_gm" and "ask" lines, so:
  - Telling him at t=72.5 → "He laughs. What a strange thing to say" at **84.1**, when he is already far past you (041-t84).
  - Turning the sign at t=70.8 → "He doesn't even look at the sign" at **88.5**. By then he is standing next to your grandmother and the phase is already `over` (86.9) (043-t90).

  Suggestion:
  - Give reaction lines priority: interrupt or skip queued descriptive lines when a fail line fires.
  - Or drop `ask` if an attempt has already happened.
  - Or have him pause (`S.pause`) until his own fail line has been heard.
- **[major] [staging]** The question "So what happens if you stop him?" is only voiced when he reaches seg 3, which is *after* he's through the gate. On my first run I walked to the gate the way a player would. He had already passed it, and the gate prompt had quietly disabled (`S.seg < 3`) before the question was asked (018-walked-to-gate).
  Suggestion: Voice `ask` at arrival (after "see_gf"), or make him wait at his front door until the question has been heard.
- **[major] [camera]** The meeting, which is the payoff, is shot as a static wide: grandparents tiny at the right edge, player at the far left edge (x≈140), a lot of empty ground in between. There is no push-in or two-shot on "They meet, just as they always did."
  Evidence: 023-t44, 026-t50, 043-t90.
  Suggestion: When `S.met`, frame just the grandparents (plus the player small in the foreground if near). Hold 3 s, then pull back for the reflection lines.
- **[minor] [composition]** The vendor's head and stall roof intrude at the bottom of the frame whenever the player is near the gate.
  Evidence: 028-gate-closed, 031-t67.
  Suggestion: Add the stall to the framer's "avoid" set, or lower its priority by nudging the camera up/north when the player is north of the stall.
- **[minor] [camera]** "Go home" shows no departure: the player stands beside the machine while the stale "That's your grandfather" caption plays, then the card appears.
  Evidence: 049-t119.
  Suggestion: Walk the player into the machine, dim it, then cut. Stop queued arrival lines when an ending starts.
- **[polish] [portrait]** In portrait, everything fits in a 390 px band, the top ~40% of the screen is empty sky, and the player is cut off at the left edge beside the "Go home" prompt.
  Evidence: 190-t21.
  Suggestion: Use a taller vertical angle in portrait, and keep the player inside the safe area.
- **[good]** The gate-gust moment is readable and well staged (031-t67). The first-run frog is nicely placed near the player (018).

### infinite-monkey
Played twice: read / wait ×3 → "Given forever"; walked out.
- **[major] [camera]** The camera is one static wide shot of the room from arrival to ending. The monkeys are only ever seen from behind, and the found line has no camera beat: which monkey typed it?
  Evidence: framer points are all fixed (camera() in infinite-monkey.js line 153); 059, 063, 067, 075.
  Suggestion:
  - When "found" fires, slow push to one monkey, who turns its face to camera, blank.
  - Or cut to a close shot of the monkey pulling the page out of its typewriter.
- **[minor] [time-lapse]** "Wait a million years" changes nothing in the picture apart from the counter. There are no pages piling up, no light cycling, and no camera drift.
  Evidence: 063-t24 vs 067-t28.
  Suggestion: Grow paper stacks per wait and run a quick day/night light cycle during `waiting`, with a slow orbit of the camera.
- **[minor] [UI overlap]** The "Wait a million years" prompt sits exactly on top of the years counter label. The counter also ends on "1,010,417 years" rather than 1,000,000.
  Evidence: 067-t28.
  Suggestion: Put the counter above the lever (or top-centre of screen), and clamp it to the exact million when the wait ends.
- **[minor] [UI]** When the ending triggers, the page overlay stays up underneath the game-over card (status listed `[page]` and `[gameover]` together at t=59.1).
  Suggestion: Close the page before `gameOver`.
- **[minor] [UI overlap]** The speech bubble "(It pats your hand, and keeps typing.)" is cut off by the "Say hello" prompt drawn over it. The camera is too high to see any pat.
  Evidence: 070-monkey-hello.
  Suggestion: Offset speech bubbles above prompts. For asides that describe an action, a brief closer framing would help.
- **[polish] [set]** The "Walk out" exit is a thin door frame lying at the side of the room and barely reads as a door (075-t84). "Walk out" is also enabled before you've read a single page.
- **[good]** The establishing shot of the 12 desks (059-t8) and the highlighted *to be, or not to be* on the page (069-t54) are clear.

### simulation-argument
Played twice: switched off / left running; photo and window asides.
- **[good] [camera]** The push into the dome and over the tiny blue person at their own dome (088, 091, 094), and the reveal of your study under a dome on a giant's desk (104 → 106 → 107), are the best camera work in the hall set. Keep them.
- **[minor] [composition]** During the zoom, the lever's dark base and handle fill the right edge of frame (088-t22, 091-t25).
  Suggestion: Hide the lever for the zoom, or offset the zoom path left.
- **[minor] [camera]** The pull-back from the nested zoom (096-t31) has the blue giant's head cropped at bottom left and a large teal inhabitant floating mid-frame. It reads as "you" levitating. It then hard-cuts to the wide (097).
  Suggestion: Give the teal peg inside the dome a different colour (only the player is teal, per pillar 1). Make this a cleaner dissolve or a straight pull-back.
- **[major] [frog]** The frog is about as wide as the player's shoulders. On the desk it sits directly behind the player's head, so the gag ("looks into the dome while a frog inside looks back") is occluded. I never saw the frog inside.
  Evidence: 100-t39.
  Suggestion: Put the frog on the far side of the dome from the camera and add both frogs to the framer for the cameo's duration. Scale it down to match other vignettes.
- **[minor] [framing]** On the reveal, the caption pill sits across the dome's base, covering tiny-you in the tiny study (106-t51). The giant is a floating head with no body or desk edge to anchor it.
  Suggestion: Frame the dome higher (upper-left third). Give the giant shoulders, or at least a hand resting on the desk.
- **[minor] [camera]** In the choose phase the game snaps back to the same wide shot, in silence. Nothing in the frame points to the lever versus the door (109-t57).
  Suggestion: Hold the reveal a beat longer, then settle on a shot where the lever and door both sit on the thirds.
- **[minor] [camera/lighting]** In "Switch them off", the line is "Above you, the lights flicker", but the camera never looks up. The window stays bright and the void outside the room stays paper-white, so the flicker barely reads.
  Evidence: 112-t90, 115-t93.
  Suggestion: Tilt the camera up slowly toward the ceiling or void during the flicker. Dim the window and scene background with the room.
- **[minor] [camera]** "Leave them running": the player walks to the door and stops. There is no exit and no look back at the shelves of little worlds before the card (123-t146).
  Suggestion: Walk through the door, and end on a shot of the shelves still glowing.
- **[polish]** The photo aside is a tiny frame on the wall with no closer shot (120-photo). The player doesn't face it.

### fermi-paradox
Played twice: kept listening; logbook, moon, sent a message.
- **[major] [camera]** "Send a message": the beam mesh never appears on screen. Its world centre is (5, 133, −84) and its lower end is about (5, 26, −10.6), which projects to (626, −373): above the frame. During the send the only visible change is the dish tilting slightly. The player's biggest act has no visible payoff.
  Evidence: 149-t80, 150-t82, 151-t84; `onscreen` checks.
  Suggestion: Start the beam at the dish bowl, not about 25 m above it. Tilt the camera up along it (as the lapse does), and keep the dish and the player in the lower third.
- **[major] [camera]** "Look at the moon" (from the chair "facing the moon") plays the moon line, but the moon at (−150, 120, −200) is always off screen (`onscreen` → (−401, −340)). The chair also faces away from the camera.
  Evidence: 134-t17.
  Suggestion: Move the moon into the upper left of the default framing, or pan to it when the aside plays.
- **[major] [frog]** The frog's watching spot (1.2, 7.2) projects to (979, 819), below the bottom of the frame, whenever the player is at the console where the cameo starts. The shooting star crosses at the top while the frog is out of shot. I never saw the frog in the listening frames 135–141.
  Suggestion: Move the cameo path into view (for example between the console and the dish), or add the frog to the camera points while `cameo.active`.
- **[minor] [framing]** With the low sky-filling angle, the player is always cut at the waist by the bottom edge and covered by the caption (131, 137, 148). In "keep listening" the tilt-up reduces them to the top of a head, and then to nothing under the caption (143, 146). The lapse flash fades the night to flat grey.
  Suggestion: Keep "you" as a small silhouette in the bottom third during the lapse (it is the point: someone keeps listening). Limit the flash to a subtle brightness pulse.
- **[good] [portrait]** Portrait works better than landscape here: sky above, the whole player visible above the caption (195-t5).

### tragedy-of-the-commons
Played three times: overgrazed → "The grass is gone" (twice); rang the bell → "You agreed on limits".
- **[major] [staging]** At the bell meeting, the four neighbours gather in the middle of the pasture while **you** stay at the bell on the bottom edge, hidden behind the caption "Together, you agree on limits…" (176-t95, 178-t99). The one who called the meeting isn't in the shot's centre.
  Suggestion: Walk the player into the circle (scripted walk) and frame the five of them close. The narration also says "Five neighbours, two sheep each", but only four neighbours are visible. Either count "you" in the line or add a fifth.
- **[minor] [camera]** The camera never moves in any run (fixed framer points). Adding sheep, the neighbours copying you, the grass thinning and the collapse are all the same wide shot. Neighbours never move or react; their sheep just pop in near their houses.
  Suggestion:
  - When "Your neighbours notice", pan or push toward one neighbour who walks a sheep in through their gate.
  - At collapse, push slowly over the bare dirt.
- **[minor] [readability]** All sheep are identical white, so you can't see which are yours. "Look at your sheep" walks you into the flock, but the camera stays wide (166, 170, 172).
  Suggestion: Give each herder's sheep a small coloured collar or tag in their house colour (yours teal).
- **[minor] [narrative sync]** The "follow" line is lost if you add a second sheep within about 5 s: it is gated on `S.adds === 1` after an await (runs 1 and 3). On run 3, the "herders" intro line played *after* "One more sheep…", because both were queued.
  Suggestion: Capture `const first = S.adds === 1` before the awaits. Skip the intro lines once the player has acted.
- **[polish] [composition]** A foreground orange house crops into the bottom centre of every frame (160, 182).
- **[good]** The collapse image reads instantly: toppled sheep on bare dirt inside the fence (182-t154). The establishing shot shows the whole system at once (160).

## Keep
- The Simulation zoom-in, the nested over-the-shoulder shot and the giant's-desk reveal.
- The Fermi low angle with the sky taking two-thirds of the frame, and its portrait framing.
- The Commons establishing wide shot and the collapse image.
- The Grandfather gate-gust beat, and the frog near the player on run 1.
- The highlighted line on the monkey page.
- The sepia filter for the past.

## Harness notes
- `clicksel "#over [data-act=again]"` failed once with "Node is either not clickable or not an Element" right after the card appeared (commons, t≈156). Pressing `esc` worked.
- `use "Look at the photo"` reported the prompt disabled for 20 s during the simulation choose phase. On replay it worked, once the voice queue was idle (`look()` is disabled while `voice.busy`). So it probably isn't a game bug, but a player may also find asides silently unavailable while narration plays.
