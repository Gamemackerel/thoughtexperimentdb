# world · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
(in progress)

## Findings
### house
- **[major] [collision]** The Penrose staircase has no collision: `hold w` from (-4.0,-3.2) walked me into it; at (-5.4,-7.0) the teal figure stands *inside* the steps, head poking out between blocks and a slice of body showing below.
  Evidence: t=13.2s, build/agentplay/world-room1/shots/004.jpg
  Suggestion: give the staircase footprint an obstacle collider (or let the player climb its lowest step and be gently turned away).
- **[major] [visual]** From the camera angles the house actually uses while you walk, the staircase reads as a jumble of beige cardboard boxes, not a loop; the "closed loop" illusion only works from one idea of camera, and the tiny grey climber is easy to miss. Standing at (-4,-3.2) the staircase also hides the player almost completely (only a teal sliver visible).
  Evidence: shots/003-stairs.jpg, shots/001-open.jpg
  Suggestion: darker step risers / alternating tones so steps read as steps, a railing, and fade/cut away the staircase when it occludes the player.
- **[minor] [visual]** The upside-down floating armchair reads as a plain red box stuck to the back wall from every angle I saw (it sits right against the painting's top-left corner). The Dalí/Magritte cues (floating armchair, wall-door high up, clouds indoors) are there but read as props rather than a dream.
  Evidence: shots/003-stairs.jpg, 006.jpg, 033-back.jpg
  Suggestion: pull the armchair away from the wall into open air, give it visible legs/cushion/armrests, a slow bob and a soft shadow on the floor under it so it's clearly *floating*.
- **[minor] [camera/set]** The rope ladder and ceiling hatch sit directly in front of the Trolley painting: on return from the trolley (spawn 1.5,-5.2) the ladder cuts the painting in half and the hatch covers its top; the house's own first portal is its most occluded object.
  Evidence: shots/033-back.jpg, 006.jpg
  Suggestion: move the ladder/hatch a couple of metres right (toward the long-legged table), or hang the painting further left.
- **[minor] [environmental storytelling]** The house has no asides at all: `debug` lists only the 5 portals and the journal. The window in the floor, the melting clocks, the long-legged table, the endless climber and the floating chair can't be examined; standing on the floor window does nothing. Every vignette has `look()` asides, but the hub, where players spend the most time, has none.
  Evidence: debug at t=2s (interactables #0–#5 only); walked onto the window at (-1.3,5.9): no response.
  Suggestion: add 2–3 `look()` lines in the house (the window: "Sky, all the way down."; the climber: "He's nearly at the top. He has been for a while."; the clock), and let the frog live here between vignettes.
- **[idea] [environmental storytelling]** Portals don't remember what happened inside. After finishing the trolley the painting only gains a ✓ on its label; the picture itself is unchanged.
  Evidence: shots/033-back.jpg
  Suggestion: let the painting change with your last ending (a third track painted in; the tiny teal figure on the rails after "You chose yourself"); same for the book's page, the doors' light.

### trolley-problem
- **[major] [world/logic]** Standing on the main track does nothing. On run 1 I was among the five workers at (16.7,0.2) when the trolley went; it passed straight through my figure (and the workers flew) while I stood untouched, and the narration said only "You left the lever alone." In a scene whose drastic ending is "put yourself on the track", physically putting yourself on it is ignored.
  Evidence: t=58–66s, shots/013-t63.jpg (trolley passing through the teal figure).
  Suggestion: either knock the player flying too (and add a line: "You stood with them."), or have the workers/people shoo you off the rails when the trolley starts, so it never visibly clips through you.
- **[major] [navigation]** Tap-to-walk gets stuck against the row of five workers. From the side-track worker (14,-5.5) walking to the third lever (use "Pull this lever" / walk 16 12) stops at (15.1,-0.5) and never arrives; also from (16.7,0.2) I could not reach (14,-5.8). All points in between are walkable, so the steering just jams on the worker line. Cost me the whole choice window twice (the run played out while I stood stuck).
  Evidence: t=141–161s ("could not get the Pull this lever prompt"), t=252–272s (stuck at 15.1,-0.5).
  Suggestion: route around the ends of the worker line (treat the line as one obstacle with a path around), or let the player pass between workers.
- **[minor] [set dressing]** The place is a bare beige disc with a clump of trees at the back; tracks simply end in mid-field at the east edge. The five "working on the track" have no tools, no barrow, no hut, no reason to be there; the house painting promises a green hill and a tunnel that I never saw framed in the vignette.
  Evidence: shots/021-edge.jpg, 022-far.jpg vs the painting in shots/002-window.jpg
  Suggestion: add a work site (shovels, a sleeper pile, a tea urn, a flag) and end the tracks in a buffer stop or another tunnel mouth; bring the tunnel/hill from the painting into the opening shot so the portal image and the destination rhyme.
- **[polish] [asides]** "Look at the driver" narrates that he has fainted, but the camera stays wide; you never actually see the slumped driver. The Talk prompt also sits on top of the worker's speech bubble.
  Evidence: shots/017-driver.jpg, shots/027-sideworker.jpg
  Suggestion: brief close-up (or a visible slumped head in the cab window) when looking at the driver; offset the Talk prompt below the bubble.
- **[keep-worthy note]** The workers' slowed-down speech ("Loooveeelyyy daaayyy fooor iiit…", "Theeeyyy aaalwaaayyys puuut meee ooon myyy ooown…" from the lone one) is the best world-building in the room: it makes the people real *and* the slow-motion felt. Keep it.

### brain-in-a-vat
- **[major] [set dressing]** The "sunny afternoon" exists only in the narration. Lines say "A sunny afternoon", "The grass, the trees, the warmth", "You sit down. The sun is warm", but the ground is the same flat paper-beige as every other island, there's no grass, no sun, no warm light, no sky, no birds or breeze. The payoff line "Real or not, it's the only sun you have" lands on a scene with no sun in it.
  Evidence: shots/037-arrive.jpg, shots/060-t670.jpg (sitting on the bench)
  Suggestion: give layer 0 a green grass tint, warm key light and long soft shadows, a visible low sun disc (or sunbeams through the trees), a few butterflies/birds; then the lab layer's cold neutral light becomes a real contrast.
- **[minor] [set dressing]** The lab is just a machine, a table and a jar on a bare disc. Nobody runs it: no stool, no coffee mug, no clipboard, no lab coat on a hook. Layer 2's lab is a pixel copy of layer 1.
  Evidence: shots/045-t577.jpg, 050-t609.jpg
  Suggestion: one or two traces of an absent keeper (a cold mug of tea, a notebook with a sketch of the tree, a chair pushed back). Vary layer 2 subtly (the mug is still warm there) so the recursion invites "who's watching *this* one?". The machine lines ("Somewhere in here is that tree", "It sounds like a summer afternoon") are excellent and would pair well with that.
- **[minor] [asides]** The cottage aside is lovely ("Nobody home. Come to think of it, you've never seen anyone go in.") but the house is otherwise inert: black window, closed door, no chimney smoke. Nothing in layer 0 subtly *wrong* besides the edge.
  Evidence: shots/038-window.jpg
  Suggestion: add one more simulated-world tell you can find if you poke around (the door is painted on; a tree's shadow points the wrong way; the same leaf falls twice, matching the frog's déjà vu).
- **[polish] [camera]** At the edge prompt (9.9,15.9) the player is mostly cropped at the bottom of the screen under the "Step off the edge" pill; and in the final pull-back of the "No way out" ending the teal figure is not visible anywhere, so the last image of "you're still looking through the same eyes" has no "you" in it.
  Evidence: shots/040-edge2.jpg, shots/052-t645.jpg
  Suggestion: frame the player higher at the edge; keep the tiny teal figure visible (falling or landed) in the final stack shot.

### platos-cave
- **[major] [world/philosophy]** The world outside doesn't contain the real versions of the shadows. The cutouts are a tree, a bird, a jar and a horse, but outside there are only a couple of trees, a pond and the sun: no horse grazing, no birds, no jar by the pond. The prisoner even says "Shh. The horse is next." — so the one thing you'd most want to see for real is missing. That's the central image of the allegory (the objects themselves, then the sun) and the easiest environmental story in the game.
  Evidence: outside at (292.5,6.0), shots/078-t759.jpg, 081-t768.jpg; cutout kinds in `game/vignettes/platos-cave.js` (`kinds = ['tree','bird','jar','horse']`).
  Suggestion: put a real horse (slowly grazing), two or three birds crossing the sky, and a clay jar at the pond outside; if you want a look() aside, the horse: "It's much bigger than its shadow."
- **[minor] [set dressing]** The pond says "Your reflection. Another kind of shadow, but this one looks back." but the pond is a flat blue disc: no reflection of the teal figure is drawn. The cave mouth is a flat white circle between rocks; "A path leads up, towards a light" but there's no visible slope or steps.
  Evidence: shots/081-t768.jpg (flat pond, frog in it), shots/075-mouth.jpg
  Suggestion: a mirrored, slightly darker copy of the player (and frog) under the pond surface; a few rough steps rising into the glow at the mouth.
- **[minor] [asides/life]** The other prisoners can only be talked to while still chained (one line, "Shh. The horse is next."); once free, all four Talk prompts are disabled, and the puppeteers can't be approached at all. On "Tell them", the caption says "They laugh" but nobody visibly laughs: no speech bubbles, no shaking.
  Evidence: debug at t=748s (Talk #0–#3 disabled); shots/086-t785.jpg
  Suggestion: keep the prisoners talkable when you're free ("Sit down, you're blocking the bird."), give each puppeteer one bubble (they're bored, or they don't know what the shadows look like), and show laughing bubbles ("Ha!", "The sun!") at "Tell them".
- **[major] [controls/ending]** Pressing E twice to talk to your neighbour ends the vignette. When the chains come loose the "Talk" prompt shows at your seat for ~3 s, then is replaced in the same spot by "Sit back down"; my second E (meant as another Talk) instantly gave "Game over · You kept watching", about 30 s into my first visit, before I'd turned round.
  Evidence: t=698.6s Talk → t≈702s second E → phase over at t≈709s, shots/068-over.jpg
  Suggestion: make "Sit back down" need a short hold or only appear after you've stood up and moved a step away from the seat, or keep repeating Talk while it's the closest action.
- **[minor] [narration timing]** After choosing "Sit under the tree", the queued line "You could stay up here. Or go back down, and tell them." plays *after* "You stay in the light.", offering a choice that's already been made, right before the game-over card.
  Evidence: t=832.9s "You stay in the light." → t=835.0s "You could stay up here…" → 836.2s game over
  Suggestion: drop queued prompt lines when an ending starts.
- **[polish] [navigation]** In first person with no fire in view, the cave is a black void; after `hold w 3` from the seat I walked past the fire and stood at (-1.8,7.9) facing pure black with no cue where the exit is. The glow of the mouth only reads once you face +x.
  Evidence: shots/073-walk1.jpg
  Suggestion: a faint shaft of daylight on the cave floor leading toward the mouth, or a cave ceiling with rock texture lit from the mouth side, so the dark has a direction.
