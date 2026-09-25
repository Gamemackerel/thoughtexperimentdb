# camera · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

Shots are in `build/agentplay/camera-room1/shots/`. Times are game time for this session. They restart at 0 after the `open house 390x844` near the end.

## Summary
- The authored camera works best in wide, calm shots: the trolley establishing and self-sacrifice shots, the brain-in-a-vat reveal and recursion tower, the Cave seen from its mouth on the way back, and the Ship's opening. Framing breaks down at the *key moments*. The line points at something the camera doesn't show: the fire in the Cave, the reflection in the pond, the edge of the Brain-in-a-Vat world, and the second ship in the Ship of Theseus.
- The player (the teal "you") leaves the shot during every trolley consequence. We never see the chooser's reaction. The only exception is the self-sacrifice ending.
- Captions sit at the bottom and wrap to 2–3 pills. Because the framer often places the player low in frame, the caption covers the player's body in many shots (cave outside, pond, stay ending, brain lab).
- First person in Plato's Cave is too dark and has a fixed eye pitch. The reveal ("Behind you, a fire...") lands on a frame that is 75% black void, with the fire tips hidden under the caption. It's the weakest shot in room 1, and it spoils what should be the most cinematic turn.
- In portrait (390x844) the framer fits the width, so the trolley choice becomes a thin band with 15px people. In the Cave, first person shows only a sliver of the wall and the shadows fall off-frame.
- The house hub has one recurring framing problem: the rope ladder and ceiling hatch sit in front of the trolley painting, which is the main portal, and the player stands behind the ladder whenever they are at the painting.

## Findings
### house
- **[major] [composition]** You walk to the painting (1.6,-5.0) to enter the Trolley Problem. The rope ladder cuts vertically through both the painting and the player, the ceiling hatch overlaps the top of the frame, and the prompt sits on the painting. You come back to the same framing after a vignette.
  Evidence: shots 004-at-painting.jpg, 061-t320.jpg, 214-t88.jpg.
  Suggestion: Move the ladder/hatch one wall bay to the right, away from the painting. Or give the house a per-portal camera offset so that when the player is within 3 m of a portal, the camera yaws until portal and player are unobstructed.
- **[minor] [UI/framing]** Labels and prompts stack over the portals they name. "Open the book" is drawn on top of the "Brain in a Vat" label, with ghost letters showing through (063). "Ship of Theseus" plus "Open the door" cover the sky door, which is seen edge-on (158). In portrait, "Up to the hall" hides the trolley painting completely (193).
  Evidence: 063-at-book.jpg, 158-at-skydoor.jpg, 193-open.jpg.
  Suggestion: Hide an object's label while its prompt is showing. Anchor labels above the object's top edge rather than at its centre. Turn the sky door ~30° toward the default camera so it reads as a door.
- **[minor] [camera]** In the back-right corner (6.2,-4.9), about 25% of the frame is a flat cream side wall (003). From the spawn and the corners, the Penrose staircase reads as a pile of cubes rather than a looping stair (001, 002).
  Evidence: 001-open.jpg, 002-corner-backleft.jpg, 003-corner-backright.jpg.
  Suggestion: Clamp the house camera's yaw so the right side wall never takes more than ~10% of the frame. Add a strong contrasting top face or edge line on each stair step so the loop reads at this distance.
- **[minor] [transition]** Stepping back through the trolley's frame into the house briefly shows a wide exterior diorama shot. The stale prompt "...ck through the frame" stays cut off at the left edge, and in the first frame the painting is solid black.
  Evidence: 212-t87.jpg, 213-t87.jpg.
  Suggestion: Clear prompts and labels on level unload. If the exterior pull-in is intended, hold it ~1 s longer and make sure the painting texture is ready first.
- **[polish] [transition]** The painting gets a lovely push-in to the trolley (005), but the book and both doors only get a flat white flash (064, 159). Being a cutscene you're inside starts at the portal.
  Evidence: 005-t11.jpg vs 064-t325.jpg, 159-t611.jpg.
  Suggestion: Give each portal a matching push: into the book's page, through the purple door into darkness (this suits the Cave), and through the sky door into its painted sky.

### trolley-problem
- **[major] [framing]** During every consequence (runs 1–3, pull or not), the chase camera follows the trolley and the player is never in frame. We never see the person who chose. At impact the five are cropped at the bottom edge with heads cut (023, 025), and the one's flight happens at the top edge.
  Evidence: 021-t52.jpg to 027-t58.jpg (pulled); 040-t108.jpg to 043-t112.jpg (did nothing).
  Suggestion: End the chase on a two-shot: hold the trolley and its victims, then cut (or pan) for 1–1.5 s to the player at the lever during the aftermath beat before the rewind. Add the people at stake to the framer targets so they are fitted fully, not cropped.
- **[minor] [camera/voice]** Standing still, the slow push-in drifts the player into the lower-left corner (x≈120), leaving the lower-right quadrant empty (012, 013). "Should you pull it?" plays at 33.7 s, but the lever isn't introduced until 37.3 s, when you walk near it. At the question, the camera gives the lever no emphasis.
  Evidence: 012-t31.jpg, 013-t36.jpg; captions 26.1/30.6/33.7/37.3 s.
  Suggestion: Keep the player in the framer's target set with a weight so they stay in the lower third. During "Five people…" and "just one", make small framing beats: a slow reframe toward the five, then toward the one. Hold "Should you pull it?" until the lever line has played, or retarget the camera onto the lever while it's spoken.
- **[minor] [UI]** With the Talk aside, the "E Talk" prompt covers the bottom line of the worker's speech bubble. The player is hidden behind the yellow worker, and the camera stays wide, so the speakers are ~40px tall.
  Evidence: 059-t187.jpg.
  Suggestion: While a speech bubble is showing, move the prompt below the speaker's feet. On talk(), bias the framer toward the pair (a gentle 30% push-in).
- **[polish] [composition]** In the twist shot, the exit frame is cropped in the lower-left corner, and the 3-line question ("Pull that one… someone else?") covers the bottom third. In the do-nothing consequence (043), two track ends are visible stopping in the void mid-frame.
  Evidence: 035-t73.jpg, 037-t77.jpg, 043-t112.jpg.
  Suggestion: Include the frame exit in the twist framer targets, or leave it out entirely. Split the long caption into two timed lines. Extend the rails past any camera angle, or fade them into the ground.

### brain-in-a-vat
- **[major] [framing]** At the edge of the world (9.6,15.6), "The world ends here. Just past the edge, it flickers." plays. The camera stays on the world, with the player tucked in the lower-right corner and hidden under the "Step off the edge" prompt. The edge and the void beyond it are out of frame.
  Evidence: 073-t351.jpg.
  Suggestion: When edgeSeen triggers, swing the framer to look over the player's shoulder at the rim and the void (add a point beyond the edge to the targets). Place the prompt above the head, not over the body.
- **[major] [occlusion]** Walking toward the edge through (7.1,11.2), a foreground tree hides the player completely, showing only the top of the head. At "Look at the tree", the player's head is inside the canopy.
  Evidence: 071-t347.jpg, 100-t420.jpg.
  Suggestion: Fade (dither) any object between the camera and the player. Or move the two near-camera trees out of the camera-facing ring.
- **[minor] [camera]** The first fall is beautiful: the underside of the island (074), the cut to "you" still on the bench (075), then the wide reveal (077). The second and third falls are only white frames (085, 092), followed by a mid-crane frame with no subject (086: jar at the top edge, empty floor).
  Evidence: 074–077 vs 085/086, 092.
  Suggestion: Reuse the layer-1 fall shot for layers 2 and 3. Each fall is the repetition that sells "no way out".
- **[minor] [framing]** On the "No way out" ending pull-back, the player is a 12px speck at the bottom edge (y≈700), half under the caption.
  Evidence: 094-t397.jpg, 096-t400.jpg.
  Suggestion: Put the player on the vertical centre line, below the tower but above the caption band, or show the tiny figure falling beneath the tower.
- **[minor] [voice/pacing]** On layers 2 and 3, "Here, too, the edge flickers." is cut after 0.3 s by "You step off the edge." (377.0 → 377.3, 392.2 → 392.6).
  Evidence: caption log.
  Suggestion: Enable "Step off the edge" only after the flicker line ends, or skip the flicker line if the player is already stepping off.
- **[polish] [framing]** In the "You stayed" ending, the camera is completely static on the bench, and "the only sun you have" plays with no sun in frame.
  Evidence: 101-t423.jpg, 102-t427.jpg.
  Suggestion: A slow 8-second push-in on the seated figure, or a tilt up to a warm sun disc. The bench close-up already exists in 075, so reuse it.
- **[polish] [frog]** The frog appears at arrival, not during a choice. It sits large in the foreground, its head bigger than the player's (066, 069). On the Ship it is also larger than the player's head (167).
  Evidence: 066-t326.jpg, 069-t332.jpg, 167-t631.jpg.
  Suggestion: Keep the frog at mid-ground depth (never nearer the camera than the player), or trigger its cameo when edgeSeen fires.

### platos-cave
- **[major] [framing]** The reveal is lost. After the chains fall, you turn and walk toward the fire, and "Behind you, a fire. People carrying cutouts. The shadows were only this." plays. The first-person frame is ~75% flat black ceiling, and the fire tips show only at the very bottom, under the caption. The carriers are barely visible. "A path leads up, towards a light" also plays while the light is out of frame.
  Evidence: 118-toward-fire.jpg, 119-back-a-bit.jpg, 121-up-path.jpg.
  Suggestion: When the "turn" line fires, ease the view pitch down ~10–15° and yaw-assist toward the fire and cutouts for 2 s. When the "climb" line fires, yaw-assist toward the mouth. In first person, move captions to the top of the screen, or lower the eye so the fire sits mid-frame.
- **[major] [camera/spoiler]** Entering through the purple door, the first ~1.5 s is a third-person establishing shot from behind the fire. It shows the carriers with cutouts, the fire and the prisoners before you, the prisoner, have ever turned around. This shot doesn't appear on Play again.
  Evidence: 109-t447.jpg, 203-t5.jpg, 205-t6.jpg (door entry) vs 142-t530.jpg (Play again).
  Suggestion: Start the door entry directly in first person facing the wall, as Play again does, or open on black.
- **[major] [clarity]** Near the mouth, "It's too bright to look at." plays, but the frame turns muddy grey, not bright. It reads as fog.
  Evidence: 127-near-mouth.jpg.
  Suggestion: Ramp to near-white with a warm bloom (additive overlay) as you approach MOUTH. Then fade back in outside so the eye adjusts.
- **[major] [framing]** At the pond, "Your reflection. Another kind of shadow, but this one looks back." plays. The camera is behind the player, the pond is flat blue, and no reflection is visible.
  Evidence: 132-t505.jpg.
  Suggestion: Cut to a top-down insert over the pond with a mirrored clone of the player (flipped on Y, slightly darker), or a planar reflector.
- **[minor] [composition]** In the "You stayed in the light" ending, the big tree eclipses the sun and you sit in its shade, while the caption over your body says "You stay in the light."
  Evidence: 153-t598.jpg.
  Suggestion: Frame from the other side so the sun is behind the camera and the seated figure is lit, with the cave mouth small in the background.
- **[minor] [voice order]** After sitting under the tree, the queued "You could stay up here. Or go back down, and tell them." plays after "You stay in the light." (597.3 → 599.4). On a straight run out, "It's too bright to look at." plays after you are already outside (590.2).
  Evidence: caption log.
  Suggestion: Flush conditional lines from the queue when the phase changes (over / where=out).
- **[minor] [transition]** The first frame outside is an empty sky with the island and sun cropped at the right edge (128). The arrival shot after it (131) is lovely, but the caption covers the player (129, 130).
  Evidence: 128-t492.jpg, 129-t493.jpg, 131-t496.jpg.
  Suggestion: Cut straight to the 131 framing, and raise the player to the lower third.
- **[minor] [portrait]** At 390x844 in first person, the narrow horizontal view shows one shadow fragment on a blank wall, with the rest of the shapes off-frame.
  Evidence: 195-portrait-cave.jpg.
  Suggestion: In portrait, widen the fov or move the cutouts closer together so at least two shadows fit.
- **[minor] [UX]** When the chains fall, the only prompt shown is "Sit back down". A player who presses E out of habit ends the vignette at once (551.5 s).
  Evidence: caption/prompt log at 551.5 s.
  Suggestion: Delay "Sit back down" by a few seconds after "Your chains have come loose", or show it only after the player has turned away and come back to the wall.

### ship-of-theseus
- **[major] [framing]** "Two ships. Which one is the ship of Theseus?" plays with the old-plank ship cropped at the bottom edge, the caption on top of it, and the new ship's mast cut at the top. The old-plank stack disappears in a cut, and we never see the "someone" rebuilding it.
  Evidence: 176-t681.jpg, 178-t685.jpg.
  Suggestion: Pull back and rotate to a two-shot with both hulls fully in frame and the player between them. Add the rebuilt hull to the framer targets as soon as rebuild starts.
- **[minor] [readability]** A single plank swap is hard to see: the new plank is just a slightly lighter strip, with no framing beat to point it out.
  Evidence: 167-t631.jpg, 170-t635.jpg.
  Suggestion: A 1 s push toward the hull as the plank goes in, plus a brief warm highlight on the new plank.
- **[minor] [clipping]** As each ship sets sail, its hull passes through the dock planks, and the stern plank ends are jagged or stepped.
  Evidence: 179-t691.jpg, 182-t695.jpg, 188-t763.jpg.
  Suggestion: Start the sail path clear of the dock, or lift/offset the hull. Close the stern plank ends.
- **[minor] [cut]** Boarding is a teleport: the player jumps from the dock to (-1.5,0) in one frame. Both endings then use the same sail-away move, ending on empty water.
  Evidence: 689.0 s position jump; 184 vs 190.
  Suggestion: Have the player walk aboard (scripted walk). In the old-wood ending, keep the new ship at the dock in the background of the last shot (and vice versa), so the question stays visible.
- **[polish] [UI]** The "Board the ship of old planks" prompt is drawn over the new ship's hull.
  Evidence: 187-choose-old.jpg.
  Suggestion: Anchor each board prompt over its own hull.

### portrait (all)
- **[major] [camera]** At 390x844, the trolley framer fits the whole scene to the narrow width. The choice becomes a thin band in the middle third with ~15px people and an unreadable lever, and the top and bottom 40% are empty. The house has the same problem (193).
  Evidence: 194-portrait-trolley.jpg, 193-open.jpg.
  Suggestion: For aspect < 1, rotate the camera azimuth so the tracks run top-to-bottom, and set a minimum player size (e.g. 8% of frame height), letting less important targets crop.

## Keep
- The painting push-in (005).
- The trolley establishing shot (007) and the self-sacrifice shot, with trolley, five and you in one frame (050).
- The brain-in-a-vat fall (074), the cut to "you still on the bench" (075), the reveal (077) and the recursion tower (089).
- The Cave from its mouth on the way back, with fire, carriers, shadows and prisoners in one dim frame (134/137). Consider reusing this angle for the reveal.
- The chained first-person shadow wall (110/111).
- The Cave's outdoor arrival, with sun, pond and tree (131).
- The Ship's opening establishing shot (161).
- The trolley framer stays robust anywhere you walk (057/058).

## Harness notes
- `onscreen` takes x y z. I first passed x z and got NaN; that was my mistake.
- One `ERR_ABORTED` on a trolley voice mp3 (twist_2) while audio is muted. It had no visible effect.
- The `use` command presses E the instant a prompt shows, so some caption cut-offs are faster than a human would cause. Still, "Here, too, the edge flickers" is cut after 0.3 s, and a human pressing E right away gets the same result.
