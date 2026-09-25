# generic-calm · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

Screenshots are in `build/agentplay/generic-calm-room1/shots/`.

## Summary
- I'd tell a friend about this. Every vignette made its idea clear without a menu or lecture: the trolley consequence and twist, the brain-in-a-vat reveal shot, the cave climb, and the two ships on the dock all landed with me as a first-timer.
- The biggest risk for a careful player is **endings that fire by accident, too early**. The bench in Brain in a Vat and "Sit back down" in the cave both sit right where you're standing. One E press ends the vignette before the idea has been set up.
- **Narration sometimes runs out of step with what I did.** It asks a question before I've acted and then keeps playing after I've acted. Examples: "Should you pull it?" before the lever has been named, "It's too bright" once I'm already outside, and "You could stay… or go back down" after the ending.
- Twice I got lost or stuck physically. A small bollard trapped me on the Theseus dock, and in the cave I wandered in a blank white-out past the exit trigger.
- The Theseus endings aren't balanced. The new ship gets a confident verdict and the old wood gets a shrug, so the game seems to hint at the "right" answer.
- In several places it's unclear what to do next: "go again" in the trolley, nothing pointing to the lab edge, nothing prompting you to turn around in the cave.

## Findings
### house
- **[minor] [clarity/visual]** The ladder stands directly in front of the trolley painting and cuts it in half from the default camera. The "Step into the painting" prompt also overlaps the "Your journal" label. Evidence: 002-center.jpg, 003-painting.jpg.
  Suggestion: move the ladder to a clear stretch of wall, or offset the painting, and stack prompts and labels so they don't overlap.
- **[minor] [clarity]** At spawn the only labels visible are "Up to the hall" and a faded "Ship of Theseus", which hangs in mid-air near the long-legged table rather than on its door. The other room-1 portals get labels only once you're close, so a first-timer is nudged upstairs first. Evidence: 001-open.jpg.
  Suggestion: show all four room-1 portal labels faintly from spawn, anchored on their objects. Or have the opening toast point at the room ("Four things here lead elsewhere").
- **[polish] [UI]** Esc opens the browser's native `confirm()` dialog ("Leave this vignette and return to the house?"), which breaks the handmade look.
  Suggestion: use an in-game pill styled like the prompts.

### trolley-problem
- **[major] [narrative/order]** If you stand still, "Should you pull it?" (t=32.9) plays before anything has mentioned a lever. "This lever switches the tracks" only fires once you walk near it (t=34.9), so "it" has nothing to refer to. The reverse also happens: I pulled early (t=167), and "Five people…", "On the side track…" and "Should you pull it?" all still played afterwards, as if I hadn't acted.
  Suggestion: fire the lever line on a timer before the question, not only on proximity. Skip or reword the question once the lever has been moved ("You've pulled it. The trolley is still coming.").
- **[minor] [clarity]** "Go again, or step back through the frame." Nothing can be done during the twist phase (every interactable is disabled), and "go again" simply starts two seconds later by itself. I didn't know whether I was meant to do something.
  Suggestion: say "It will come round again. Or step back through the frame." and enable the frame during the twist.
- **[minor] [pacing]** After I committed (pulled at t=167), I watched the slow creep for about 28 s with nothing left to decide. The first time, the silence works. On runs 2 and 3 it drags.
  Suggestion: once the lever has been touched on a repeat run, speed the slow phase up (for example, halve its remaining time).
- **[major] [clarity/journal]** The journal question on the game-over card is about pushing someone off a bridge, a case the game never shows or mentions. As someone who didn't know the literature, I had to imagine a scene I'd never seen. Evidence: 032-over.jpg.
  Suggestion: add a one-line setup to the question ("Imagine instead you could stop it only by pushing a stranger off a bridge…"), or add the footbridge as a playable twist.
- **[minor] [narrative]** The three-run ending says "Nobody could stop the trolley." But the self-track ending I'd just reached shows you can stop it by stepping in front of it.
  Suggestion: "Nobody else could stop the trolley", or "You only decided where it went."
- **[minor] [collision/visual]** After the rewind, standing where "Look at the driver" had taken me, my figure was drawn overlapping the trolley's front. Evidence: 025-t125.jpg, player at (-14.3, 1.5).
  Suggestion: move the driver aside's stand spot, or push the player off the track on rewind.
- **[minor] [notebook]** The notebook says "This short film walks through Foot's original driver case…", but I'm playing a game, not watching a film. Game time also keeps running while the notebook is open (the trolley moved from slow phase onwards while I was reading), so a reader can miss the moment of choice.
  Suggestion: rewrite that sentence for the game and pause the level while the notebook is open.
- **[polish] [journal]** The journal shows only the latest ending ("Someone is always on the track"), although I'd reached "You chose yourself" too.
  Suggestion: list every ending reached per vignette.

### brain-in-a-vat
- **[major] [pacing/ending]** The bench's "Sit down" prompt appears within about 3 m of the spawn. On replay I sat 6 s after arriving and got "You sat… Real or not, it's the only sun you have." / "You stayed", without ever seeing an edge or hearing "If none of this were real, how would you ever know?". The ending's line has nothing to push against, and it's the most natural first thing a calm player does.
  Suggestion: enable the bench only after the edge line has played (or after about 45 s). Alternatively, sitting early could play a doubt line and let you stand up again.
- **[minor] [camera]** At the edge the camera frames the island, and the player is at the very bottom of the screen, half-hidden behind the prompt and the caption. The edge itself is off-screen. The "flicker" is full-width horizontal bands that read as a screen glitch rather than the world's rim. Evidence: 042-edge2.jpg, 043-edge3.jpg.
  Suggestion: pull the framer towards the rim when the player is near it, and confine the flicker to the rim geometry.
- **[minor] [clarity]** In the lab, nothing points you towards its edge. "Here, too, the edge flickers" only plays once you're standing there. I spent the time looking at the machine (a lovely line).
  Suggestion: add a faint flicker ring on the lab rim that's visible from the spawn, or a line like "The room ends somewhere, too."
- **[minor] [visual/narrative]** In the reveal shot, a small teal figure sits on the bench in the world above, even though I had stepped off the edge rather than sat. I couldn't tell whether that was me. Evidence: 048-t384.jpg.
  Suggestion: if it's meant to be "your body is still up there", have a line say so; otherwise show the figure standing where you stepped off.
- **[polish] [narrative]** The final line says "However far you climb out…", but you've been stepping off and falling each time.
  Suggestion: "However far you step out…"
- **[idea] [structure]** The vignette has no replay acknowledgment, unlike the template's "replay acknowledges the second choice". On my second run nothing noted that I'd been here before.
  Suggestion: on replay, add one line such as "You know where the edge is now."

### platos-cave
- **[major] [ending/prompt]** While chained, the prompt for the neighbour is "Talk". About 20 s in, the chains loosen and the prompt at your own seat (radius 2, exactly where you are) becomes "Sit back down". I pressed E to talk and ended the vignette ("You kept watching") 3 s after being freed, without having turned around. Evidence: t=510.6.
  Suggestion: enable "Sit back down" only after the player has left the seat by some distance (or after the fire line has played), and ignore E for the first few seconds after "Your chains have come loose".
- **[major] [camera/first person]** Walking forward from the seat, I ran straight into a puppeteer. The "Behind you, a fire. People carrying cutouts." line played while the screen was filled by a giant close-up face, and the fire itself was never clearly in frame at any point. Evidence: 069-fwd1.jpg, 070-fwd2.jpg.
  Suggestion: when the chains loosen, play a short authored turn that frames the fire and the cutouts. Or trigger the line on the player's yaw facing the fire, and block the puppeteer walkway.
- **[major] [navigation]** Near the mouth the screen fades to about 92% white. I walked past the 2 m trigger into the walkable pocket at (20.3, 7.0) and stood in a flat white screen, with no cue about where the way out was. Evidence: 074-fwd6.jpg, 075-l1.jpg. I only got out by walking back to (17, 6).
  Suggestion: make the whole mouth circle trigger the exit (anything within the 3.5 m walkable disc), or remove the pocket beyond it.
- **[minor] [narrative/order]** When I walked briskly, "A path leads up, towards a light." and "It's too bright to look at." played after I was already outside in daylight. When I sat under the tree straight away, "You stay in the light" was followed by "You could stay up here. Or go back down, and tell them." after the choice had been made.
  Suggestion: drop queued cave lines on transit, and gate "Sit under the tree" behind the "choose" line (or skip that line once you've sat).
- **[minor] [clarity]** Once freed, nothing suggests turning around. "Behind you, a fire" fires only when you walk to z>0, not when you turn and look. Turning is also very fast (about 2.1 rad/s, so a 3 s hold on D is a full circle), which made it hard to settle on a view.
  Suggestion: add a gentle "Behind you, a flicker of light." after about 8 s of standing still, and slow keyboard yaw to about 1.2 rad/s.
- **[minor] [controls]** Tapping the bright opening doesn't walk you there, because it isn't ground. Only tapping the dark floor works.
  Suggestion: treat a tap on the mouth or light as a walk target.
- **[polish] [UI]** Outside, the caption pill sits right over the player figure. Evidence: 076-out1.jpg.
  Suggestion: frame the player higher in third-person shots, or move captions to the side when they would cover the player.

### ship-of-theseus
- **[major] [bug/collision]** After talking to the fisherman at (23, 1.4), I asked to walk back to the planks and got stuck at (21.1, 1.4) against a bollard (blocker at x 20.5, z 1.2, r 0.3). Walking there by tap (`walk`) reported "blocked"; holding A/left and S did nothing; only W freed me. A tap-to-walk player would be stuck. Evidence: 093-t882.jpg, t=741 to 887.
  Suggestion: let the steering slide around small post blockers, or leave a clear lane down the middle of the dock.
- **[major] [bug/UI]** The fisherman's speech bubble "Mind you, they have replaced every board of it since." stayed on screen at a fixed position for about 220 s (t=735 until the game-over card), even over the game-over card itself. Evidence: 097-t926.jpg, 101-t956.jpg.
  Suggestion: time out speech bubbles and clear them on phase changes and on the game-over card. It seems to happen when you press E again while one bubble is still showing.
- **[major] [philosophy/narration]** The endings are asymmetric. The new ship gets "You chose the ship that kept sailing. Its parts changed. Its story didn't." and "it never stopped being the ship that sailed" (a verdict). The old wood gets "Whether that makes it the same ship is the question" (a shrug). As a first-timer, I read that as the game telling me which answer was right.
  Suggestion: give both endings the same structure: what you favoured (continuity versus the original material) and the same open question.
- **[minor] [clarity]** The two boarding spots are 1.8 m apart on the dock and their radii overlap. Standing between the ships, I only ever got "Board the ship of new planks"; I had to walk to the dock's south edge before "old planks" appeared. Evidence: 104-t1051.jpg.
  Suggestion: put each boarding spot at the far end of its own gangplank, or choose the prompt by which ship you're facing.
- **[minor] [pacing/replay]** Play again means carrying all six planks again (about 50 s of identical chores) before the choice, and there's no acknowledgment that you've been here before.
  Suggestion: on replay, start with the two ships already built (or make carrying one plank enough), and add a line such as "Last time you chose the new ship."
- **[minor] [voice pillar]** The opening narration names "The ship of Theseus", and the choice line asks "Which one is the ship of Theseus?". Pillar 4 says no names in the voice.
  Suggestion: "An old ship. Its wood is getting old." / "Two ships. Which one is the real one?"
- **[polish] [visual]** The dock has a jagged, stair-stepped end where it meets the beach, so it looks unfinished. Evidence: 088-ship-arrive.jpg.
  Suggestion: add a clean ramp or planks joining the dock to the sand.

## Keep
- The trolley: the slowed workers' speech ("Diiid yyyooouuu heeeaaar aaa beeell…"), the fainted driver aside, the rewind, and the third track pointing at you. "You didn't make this happen. But you could have changed it." is a great line.
- The brain-in-a-vat reveal shot (045-t375.jpg) and the second-layer recursion (053-t426.jpg). The window line "you've never seen anyone go in."
- The cave outside and the pond reflection line. "They laugh. The climb has ruined your eyes" as the tell-them ending.
- Theseus: the plank-by-plank lines ("Still the same ship, surely." / "Half of it is new now."), the old ship rising out of the water beside the dock, the shipwright's "Seemed a shame to burn them", and the fisherman's grandad's rod.
- The journal page: handwriting, to-dos written as notes to self, and "8 more to go…". Portals get ✓ when finished.

## Harness notes
- `status` often reports "(moving)" while the player is standing still.
- `use board the ship of old planks` stopped at (15.1, -0.1) and timed out, because the neighbouring new-ship prompt won. Walking manually to (16.5, 1.8) worked. That may be the same prompt-overlap issue players will hit.
- Every time a trolley run entered `go`, the log showed `request failed: …/voice/trolley-problem/twist_2-e0b73331.mp3 (net::ERR_ABORTED)` (audio is muted in the harness). This is probably harmless, but it's worth checking that the line isn't cut off in the real game.
