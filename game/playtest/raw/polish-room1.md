# polish · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
(in progress)

## Findings
### house
- **[major] [collision]** The first room has no furniture collision at all: its `walkable()` is only the 7.3 square minus the floor window (`game/house/house.js:278`). I walked through the Penrose staircase and the stack of boxes (`walk -2 -4.8` then `hold a 1.5` ended at (-7.3,-5.4) *behind* the staircase), into the middle of the journal desk (`walk -2 -6.3`), into the ladder's rails (2.6, 2.4) and through the coat stand (6.3, 4.5). `walkable -4.5 -5` (inside the stairs) returns true.
  Evidence: build/agentplay/polish-room1/shots/004-desk-clip.jpg (figure standing inside the desk), 006-coatstand.jpg (pole through the figure's body), 005-ladder-clip.jpg.
  Suggestion: add circle/box blockers to `walkable` for the staircase footprint, lectern, desk, clock table legs, coat stand and ladder foot (the player's steering already handles blockers, as in the vignettes). Keep interact radii reachable from outside the blockers.
- **[major] [camera/occlusion]** Walking behind the Penrose staircase (back-left corner, around (-7,-5.5)) hides the figure completely behind the boxes; only a sliver of head shows at the left edge of the stairs. Nothing tells you where you are.
  Evidence: shots/003-left-edge.jpg.
  Suggestion: block that corner (collision, see above), or fade/x-ray the stairs when they occlude the player (a teal silhouette pass would also help elsewhere).
- **[minor] [UI overlap]** Journal and painting sit so close that their labels and prompts stack: at the desk, "Your journal" label + "E Read your journal" prompt sit right on top of the figure's head, and the "The Trolley Problem" label is half hidden behind the opening toast "Look around. Some things here lead elsewhere." (the toast stays up ~5 s, which is exactly the time it takes to walk to the painting).
  Evidence: shots/002-wall-n.jpg (toast over the Trolley label; journal label over the painting), 004-desk-clip.jpg.
  Suggestion: offset the journal label to the left of the desk (or only show one label when two portals are within ~3 m), keep labels above the figure's head height, and dismiss the opening toast on first movement.
- **[minor] [interaction]** Standing between desk and painting at (-0.5,-6.7), 1.7 m from the journal and 2.0 m from the painting, the prompt offered is "Step into the painting", not the closer journal. Prompts are hard to choose between here; a player trying to read the journal can accidentally step into a vignette.
  Evidence: `hold w 3` from spawn → prompt "EStep into the painting" while journal is nearer.
  Suggestion: pick the nearest interactable (or the one the figure faces), and shrink the painting's 2.3 m radius or move the desk ~1 m further left.
- **[major] [UI/phone]** On a 390×844 portrait phone the room is a thin band in the middle of the screen (top ~30% and bottom ~20% empty paper), while labels keep desktop size: "The Trolley Problem" label and the "Step into the painting" prompt fully cover the painting, and the "Your journal" label is hidden behind the prompt. The toast wraps to three lines and covers the room's top.
  Evidence: shots/009-open.jpg, 010-phone-painting.jpg.
  Suggestion: in portrait, frame the room tighter (raise FOV/zoom until the floor fills the width, or tilt the camera more top-down) and scale labels/prompts down (~0.7×); stack prompt and label so they never overlap each other.
- **[polish] [collision]** In the front-left corner (-7,7) the figure's body overlaps the base of the left wall (ROOM=7.3 minus body radius leaves it inside the wall's thickness).
  Evidence: shots/007-front-left.jpg.
  Suggestion: reduce ROOM to ~6.9 or account for the figure's radius in the walkable test.

### trolley-problem
- **[major] [collision/philosophy]** You can stand right on the main track in front of the trolley (`walk -3 0.3` at the switch during the slow phase) and nothing responds: the trolley rolls up to you, the camera cuts to the five being hit, and after the rewind you are still standing on the rails at (-2.9, 0.2). The narrator says "You left the lever alone." The only blocker is the trolley's own body pushing you; the level's `walkable` allows the whole track bed.
  Evidence: shots/016-t40.jpg (figure on the rails, trolley 2 m behind), 020-after-rewind.jpg (figure still on the track after the rewind).
  Suggestion: either make the track bed non-walkable while the trolley is running (a thin strip blocker along the main line and the switch), or treat standing on the track as a real act (the trolley stops/knocks you gently and a line acknowledges it). Silently passing through reads as a bug.
- **[minor] [interaction/pathing]** Tapping/walking to a spot just past the first lever (`walk -7.2 2.5`) leaves the figure walking in place against the lever blocker for ~12 s ("did not arrive, still 1.1 away, still walking at timeout"); the steering doesn't route round a 0.5 m blocker when the target is directly behind it.
  Evidence: t=13–25 s, you at (-7.0, 3.5) (moving).
  Suggestion: when the target lies inside/behind a blocker, snap the target to the nearest free point, or stop and idle after ~1 s of no progress.
- **[minor] [UI overlap]** The "E Pull the lever" / "E Put the lever back" prompt pill sits exactly on the figure's head and the lever, so at the moment of choice you can't see the figure or the lever handle move. At the self-lever the prompt is also clipped by the right screen edge ("Pull this lever" pill touches x=1280) and covers the figure.
  Evidence: shots/013-lever-close.jpg, 021-pulled.jpg, 022-far-lever.jpg.
  Suggestion: anchor prompts ~0.6 m higher than the head or to the side of the object facing away from the player; clamp them inside a safe margin of the screen.
- **[minor] [pacing/reach]** After the first run the slow phase lasts only ~18 s (slow 118.3 → go 136.6), but the third-track lever is ~25 m from the first lever. Walking from the far right of the island to the self-lever (≈25 m) I didn't get its prompt before the trolley went and the run counted as "left the lever alone". The first run's slow phase is 33 s.
  Evidence: t=126–137 s; `use pull this lever` → "Could not get the prompt within 20s", phase went reflect.
  Suggestion: keep the slow phase as long as the player is still moving toward a lever (or at least as long as run 1), or start the run with the player placed between the two levers.
- **[polish] [visual]** The three tracks simply stop in mid-field at the right (x≈1100 px in shots/023-far-right.jpg); no buffer stop or fade. Because the framer lets you walk past them, the cut ends are very visible.
  Suggestion: add buffer stops or let the rails sink into grass/tall weeds.
- **[polish] [collision]** Trees and rocks on the island have no blockers (`blockers()` lists only people, levers, trolley, frame), so the figure walks through trunks when tap-walking around the island edge.
  Suggestion: add small (r≈0.4) blockers for tree trunks near the playable area.
- **[polish] [UI]** Long captions wrap into two separate dark pills stacked with a gap ("Five people, working on the track. They can't hear / it coming."), which looks like two lines of different speakers.
  Evidence: shots/013-lever-close.jpg, 020-after-rewind.jpg.
  Suggestion: render the caption as one block with `box-decoration-break: clone` padding or a single rounded box, and widen `max-width` slightly so most lines fit on one row at 1280.
- **[minor] [camera/return]** Coming back to the house from the trolley (card "Back to the house" or Esc) spawns you at (1.5,-5.2) with the ladder rails directly between camera and figure, and the ceiling hatch hiding most of the painting; the "The Trolley Problem ✓" label ends up floating on the orange ceiling hatch rather than on the painting. You also land already inside the painting's prompt, so an E-happy player re-enters instantly.
  Evidence: shots/033-back-home.jpg.
  Suggestion: move the painting's return spawn ~1.5 m left/forward (e.g. (0,-4)) facing into the room, clear of the ladder, and outside the 2.3 m prompt radius.
- **[polish] [UI]** Esc opens the browser's native `confirm()` ("Leave this vignette and return to the house?"), the only system-styled UI in the game; on touch there's no Esc at all during a vignette unless you find the frame.
  Suggestion: an in-game styled confirm pill (same style as the game-over buttons), plus a small persistent "leave" corner icon for touch.
- **[polish] [clarity]** At arrival the return frame is invisible (`frameOn: 0` until after the first run) though its spot (-19,10) is right next to the spawn; the only way out during run 1 is Esc.
  Suggestion: show the frame faintly from the start (it's where you came in), and make it active.
- **[major] [phone/camera]** In 390×844 portrait, the choice moment is unreadable: the figure, the lever and the six workers are each ~10 px tall, the side track and the lone worker run off the right edge, and the top ~35% of the screen is empty sky. Tapping the lever (a ~8 px target) or tapping the ground next to it is fiddly.
  Evidence: shots/115-phone-trolley.jpg (t=15 s, slow phase).
  Suggestion: in portrait, frame the switch area (lever, fork, both groups) rather than the whole line, rotate the camera so the tracks run top-to-bottom, and enlarge the tap radius of the prompt/lever.

### brain-in-a-vat
- **[major] [UI overlap/camera]** Walking along the near (camera-side) edge of the sunny world, the figure sits at the very bottom of the frame, exactly where the caption pill is: the caption "If none of this were real, how would you ever know?" covers both the figure and the "E Step off the edge" prompt, so the one action the scene is steering you to is unreadable. The framer keeps the whole disc in shot rather than the player.
  Evidence: shots/043-edge-slide.jpg (you at (-1.9, 17.3), prompt hidden under caption); also 041-edge.jpg (at (10,16) the prompt pill sits on the head, the body is half cut by the frame bottom).
  Suggestion: reserve the caption band — bias the framer upward so the lowest walkable point is above ~80% of screen height, and have prompts avoid the caption rect (move above the figure's head, or push captions to the top while a prompt is up).
- **[minor] [camera/occlusion]** Walking behind the cottage (e.g. (-8,-7)) hides the figure completely; only a teal sliver shows at the roof's left edge. There's a "Look in the window" aside right there, so players will go round it.
  Evidence: shots/040-behind-house.jpg.
  Suggestion: fade the cottage (or its roof) when it occludes the player, or make the back of the cottage non-walkable (blocker is a 2.2 m circle, so the back strip is walkable).
- **[polish] [collision]** Only three blockers exist in the sunny world (cottage circle, bench, one tree); the other ~12 trees have none, so tap-walking across the lawn passes through trunks. The cottage's round blocker (r 2.2) lets the figure brush into its square corners.
  Evidence: `blockers()` in game/vignettes/brain-in-a-vat.js:139; shots/039-house-corner.jpg (figure pressed against the wall by the window).
  Suggestion: add trunk blockers (r≈0.4) and a box blocker for the cottage.
- **[major] [interaction]** The "Sit down" prompt (bench (2,1.6), r 2.4) overlaps the "Look at the tree" aside (tree (4.6,0.2), r 2.2) and sits 3.5 m from the spawn. After `use look at the tree` I was left at (4.2,1.3) with "E Sit down" as the live prompt: one more E ends the whole vignette ("You stayed"). On a replay I sat 3 s after arriving, before the arrival lines had finished; the queued "The grass, the trees, the warmth…" line then played over the sitting ending.
  Evidence: t=437.9 s prompt "ESit down" right after the tree line; shots/057-tree.jpg; t=411 s phase over 3 s into the run.
  Suggestion: shrink the bench radius to ~1.4 and require facing it; don't enable "Sit down" until the arrival lines have played (or the player has walked ~10 m); cancel queued explore lines when an ending starts.
- **[minor] [collision]** Walking up to the tree for its aside pushes the figure's head into the canopy (head hidden in the leaves), and sitting on the bench sinks the body through the seat plank (legs visible in front of it).
  Evidence: shots/057-tree.jpg, 055-sitting.jpg.
  Suggestion: move the tree's look-spot to ~1.2 m from the trunk on the camera side; lower the sit pose or raise the seat so the body sits on it.
- **[minor] [pathing]** In the lab, tapping just past the vat table (`walk 400 0` from (406,7)) leaves the figure walking in place 3 m short for 8+ s against the table blocker.
  Evidence: t=352–360 s, "did not arrive (still 3.0 away, still walking at timeout)".
  Suggestion: same fix as the trolley lever: snap blocked targets to the nearest reachable point and stop the walk cycle when no progress.
- **[polish] [text]** The notebook opens with "This short film traces the idea…", which reads oddly inside a game.
  Evidence: shots/059-notebook.jpg.
  Suggestion: a game-specific intro line in `game/notebook/` or a replacement of "This short film" with "This page".

### platos-cave
- **[major] [UI/touch]** When the chains come loose, the "E Sit back down" prompt is live (status lists it) but is not drawn anywhere: its anchor is the seat you're sitting in, i.e. under the first-person camera. On desktop an innocent E press ends the vignette with no visible prompt; on a phone (touch, where you must tap the prompt) the "keep watching" ending is effectively unreachable from the seat.
  Evidence: shots/089-desk-free.jpg (desktop, prompt live, nothing on screen), 083-phone-free.jpg (390×844, same).
  Suggestion: in first person, render prompts whose anchor is off-screen/behind the camera as a fixed pill at bottom-centre (above the caption band); or anchor "Sit back down" to the wall in front of the seat.
- **[major] [collision]** The low wall (parapet, 18 m wide at z 2.6) is blocked only by four 1.6 m circles at x = -6, -2, 2, 6, which leaves gaps at x≈0, ±4 and ±8. `walk 0 5` from the seat went straight through the middle of the wall to (0, 4.9) in 2 s, into the puppeteers' walkway (the puppeteers themselves have no blockers).
  Evidence: t=469.9–471.9 s; shots/065-through-wall.jpg; blockers in game/vignettes/platos-cave.js:181.
  Suggestion: use a box blocker for the parapet (x −9…9, z 2.35…2.85) plus end caps, and small blockers for the four puppeteers; if walking behind the wall is meant to be possible, open a visible gap at its ends.
- **[major] [UI overlap]** After "Sit under the tree" (stay ending), the queued line "You could stay up here. Or go back down, and tell them." plays after "You stay in the light." and its caption renders on top of the game-over card, overlapping the Play again / Back to the house buttons on a phone.
  Evidence: t=40.2 s caption vs 41.4 s game-over; shots/087-phone-over.jpg.
  Suggestion: flush the voice queue when an ending starts, and hide captions (or put them under the card's z-index) while the card is open.
- **[major] [camera/occlusion]** Outside, walking round behind the cave-mouth mound (e.g. (283, 1)) hides the figure completely: the screen shows only the mound. At (286, 12) the figure is cut in half by the bottom edge of the frame.
  Evidence: shots/073-behind-mound.jpg, 072-mound-side.jpg.
  Suggestion: make the far side of the mound non-walkable (enlarge the ARCH blocker to cover its back half) or let the framer swing to keep the player visible; keep the figure above the bottom 15% of the frame.
- **[minor] [collision/feel]** Walking straight ahead from the seat you can press your face into the shadow wall: at (0.4, -8.6) the whole screen is a flat brown fill with no shadows and no feedback.
  Evidence: shots/080-at-wall.jpg.
  Suggestion: stop the walkable area ~2.5 m from the wall (WALL_Z + 2.5) so the shadows stay in view, or add a narrator beat when you touch it.
- **[minor] [interaction]** Back in the cave, "Tell them" (r 3.6 at (0,-1.4)) and the prisoners' "Talk" (r 3.2) prompts overlap: arriving at (2.1,-0.4) both fired within 0.1 s. An E meant to tell them can just trigger small talk (or vice versa); the tell is the ending.
  Evidence: t=554.0 "ETalk", 554.1 "ETell them".
  Suggestion: disable the "Talk" asides once you've come back down (or make them part of telling).
- **[minor] [pacing/sync]** Walking briskly from the fire to the mouth, the transit to outside triggers at (15,6) before the mouth lines finish; "It's too bright to look at." then plays after you're already outside in full daylight, and "A path leads up, towards a light." never plays.
  Evidence: phone run t=25.5–31 s.
  Suggestion: hold the transit until the mouth line has played (the fade can wait ~2 s), or drop stale lines tied to the previous place when `where` changes.
- **[polish] [phone]** In portrait, the chained first-person view shows only one shadow (the tree) on the wall; the others pass outside the narrow horizontal view. The top half of the outdoor portrait shot is empty sky, and prompts still show an "E" key cap on a touch device.
  Evidence: shots/083-phone-free.jpg, 085-phone-tree.jpg.
  Suggestion: widen the horizontal FOV in portrait (fit the wall width, not height); on touch show "Tap" or a hand icon instead of "E".

### ship-of-theseus
- **[minor] [camera/occlusion + UI overlap]** At the far end of the pier (25, 0), talking to the fisherman: the figure stands directly behind him from the camera's view (only a sliver of teal above his hat is visible), the carried plank disappears, and the "E Talk" prompt pill sits on top of the last line of his speech bubble ("Forty years I have fished off this / dock." – "dock." is covered).
  Evidence: shots/110-talk-carry.jpg.
  Suggestion: put his talk spot on the camera side of him (block the strip behind him, x > 24.8), and stack speech bubbles above prompts (or hide the prompt while a bubble is showing).
- **[minor] [collision]** The pier's posts have no blockers and the walkable strip (|z| < 1.45) reaches the post line, so holding W along the pier leaves the figure standing on top of / inside a post (e.g. (10.3,-1.4), and (16, 1.1) at the old ship's prompt). The plank stack's blocker is a 0.35 m circle, but the stack is ~1.5 m long: at (7.6, 0.4) the figure's lower body is inside the stack.
  Evidence: shots/093-pier-edge.jpg, 101-near-old.jpg, 092-stack-clip.jpg.
  Suggestion: shrink the walkable strip to |z| < 1.1 (inside the posts) and use a box blocker for the stack and scrap pile.
- **[minor] [interaction]** "Board the ship of new planks" and "Board the ship of old planks" are 1.8 m apart (both r 2.4) in the middle of the pier; which one you get depends on a few centimetres, and at (16, 1.3) the "old planks" pill is drawn over the *new* ship in the background, so the label seems to point at the wrong boat. `use board the ship of old planks` from (16,-1.2) stopped at (16,-0.5) still showing the new-ship prompt.
  Evidence: shots/101-near-old.jpg; t=68–89 s.
  Suggestion: anchor each board prompt at its own gangway on the ship's side of the pier (z ±1.3) with smaller radii (≈1.2), and draw a short leader line or put the pill over the corresponding hull.
- **[polish] [visual/collision]** When the old-planks ship sails away it passes through the end of the pier: the hull overlaps the pier deck next to the fisherman, who seems to stand in the boat.
  Evidence: shots/105-t142.jpg.
  Suggestion: moor the rebuilt ship ~1 m further out or give its departure path an outward arc before it heads along the pier.
- **[polish] [visual]** The ramp where the beach meets the pier renders as flickery horizontal stripes (looks like z-fighting between the ramp and the sand).
  Evidence: shots/091-ship-arrive.jpg (x≈410–480, y≈430–490), 113-pier-join.jpg.
  Suggestion: lift the ramp a few mm above the sand or give it a polygon offset.
