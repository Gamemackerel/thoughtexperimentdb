# polish · THE HALL (hall, grandfather-paradox, infinite-monkey, simulation-argument, fermi-paradox, tragedy-of-the-commons)

## Summary
(in progress)

## Findings
### house (route to the hall)
- **[minor] [interaction]** Tap-walking onto the ladder itself (click 785,420 on the rungs) walks the figure *through* the ladder to (2.7, 0.2), behind it; the "Climb the ladder" prompt flashes at 2.5 s and then disappears because the stop point is 2.4 from the ladder (radius 2.3). Pressing E then does nothing. The figure also visibly stands inside the ladder rails.
  Evidence: shots/002.jpg (build/agentplay/polish-hall/shots/), `debug` "Climb the ladder" dist 2.4 radius 2.3.
  Suggestion: when a tap lands on an interactable's mesh, walk to a stand point in front of it (inside its radius) instead of to the ray's ground hit; give the ladder a collider so you can't stand inside it.

### hall
- **[minor] [interaction]** You arrive in the hall already inside the "Climb down" radius (spawn -13.5,1.4; hatch -15,1.4, radius 2.2), so the first thing on screen is "E Climb down". A player who presses E/Space to "continue" after the arrival toast goes straight back down.
  Evidence: shots/003.jpg, t=30.2 s prompt appears on the same frame as the toast.
  Suggestion: spawn ~3 m from the hatch (e.g. x = -12), or suppress the hatch prompt until the player has moved once.
- **[polish] [UI]** The "Down to the first room" label is drawn right over the player's head at spawn (and "E Climb down" pill stacked just above it), hiding the figure's face.
  Evidence: shots/003.jpg.
  Suggestion: raise the hatch label (labelAt y 1.6 → ~2.6) or offset it towards the curtain so it never sits on the figure.
- **[minor] [collision]** Blockers for the portal props are offset ~1 m *behind* the visible props, so you walk into them: tap-walking to (6.2, -2.2) puts the figure inside the telescope's tripod (telescope barrel sticking out of its head); walking to (11.5, -3) stands the figure inside the green garden gate's bars. hall.js blockers are at telescope (6.2, -2.8) and gate (11.5, -3.6), but the telescope is drawn at ~(6.2, -1.8) and the gate at ~(11.5, -2.6).
  Evidence: shots/020.jpg (in the tripod), shots/021.jpg (in the gate). The walk to (11.5, -3) also took 15 s of game time (108 → 123 s) for ~5 m, jittering against the gate blocker.
  Suggestion: move those blocker circles onto the props (telescope z ≈ -1.9, r ≈ 0.7; gate z ≈ -2.6, a wide box/2 circles across its width), and keep interact radius so the prompt still triggers in front.
- **[minor] [collision]** The little room filled by the apple uses two circles (r 0.9 at x 2.6 and 3.8) for a square box; at its front-right corner the figure sinks into the box wall. Walking to (3.5, -3.5) stops at (4.9, -4.0) with the body half inside the box's right side.
  Evidence: shots/019.jpg.
  Suggestion: use a rectangle blocker for the box (or a third circle at the corners) and make the room's footprint match.
- **[minor] [collision / stuck]** Holding W+D into the back wall between the grandfather clock and the typewriter table (from (-7, -3)) leaves you at (-6.2, -4.1), exactly on the walkable edge (`z > -4.1` is false there). From that spot tap-to-walk to anything to the right fails instantly ("did not arrive, still 10.1 away") and holding D does nothing; only walking forward (S, or tapping in front) frees you. Reproduced 3 times.
  Evidence: `walkable -6.2 -4.1` → false; `walk 3 0` and `walk 6.2 -3.9` fail from there, `walk -2 0` works.
  Suggestion: clamp the player to walkable - epsilon when sliding along the wall, and let the steering accept moves that don't reduce the distance to the boundary (slide along the wall instead of refusing).
- **[polish] [camera]** At both ends of the hall the camera stops panning, so the figure goes half off-screen behind the red curtains: at (16.7, 3.2) the figure is cut by the right edge and hidden by the curtain; at (-16.8, 3.2) same on the left.
  Evidence: shots/008.jpg, shots/012.jpg; `onscreen 16.9 1 4` → OFF SCREEN.
  Suggestion: shrink the walkable x range at the front (|x| < ~15.5 when z > 2), or let the framer pan a little further so the figure always stays in frame and in front of the curtain.
- **[polish] [UI]** Portal name label + "E" prompt stack directly over the figure's head when standing at a portal (clock, telescope, gate): the prompt pill covers the face in shots/013.jpg ("Open the clock" sits right on the head), and in shots/020/021 the two pills form a tower above the head.
  Suggestion: anchor the E prompt at the object (or to one side of the player) and fade the portal name label once the prompt is showing.
- **[polish] [clipping]** The Escher stairs run straight through the grandfather clock: two steps pass through its case just under the clock face.
  Evidence: shots/003.jpg, shots/013.jpg.
  Suggestion: move the stair spiral 1 m to the left or put the clock in front of it (clock z ≈ -3.2) so the steps pass behind.
- **[polish] [UI]** The gentleman's speech bubble ("Good afternoon.") is drawn high above the fireplace, far from his head, and the "E Talk" pill sits between the bubble and him, covering his bowler hat. It reads as if the fireplace is speaking.
  Evidence: shots/006-t41.jpg.
  Suggestion: anchor the bubble just above his hat and hide the Talk prompt while a bubble is showing.

### grandfather-paradox
- **[major] [navigation]** The game-over card's "Back to the house" drops you in the *first room* at its default spawn (0, 5.5), not in the hall beside the grandfather clock. To try another hall vignette you have to walk to the ladder and climb again every time. (GAME.md: players should come back beside the portal they used.)
  Evidence: t=297.7 s `clicksel "#over [data-act=home]"` → `level loaded: house`, you at (0.0, 5.5); shots/045.jpg.
  Suggestion: for vignettes whose portal is in the hall, route "Back to the house" (and Esc) to `hall` with `ctx.from` set, and label the button "Back to the hall".
- **[minor] [interaction]** You arrive standing 0.4 m from the time machine, inside the "Go home" radius, so "E Go home" is the first prompt of the vignette and stays up through the opening lines. One reflexive E press ends the vignette before it starts. Same pattern as the hall's hatch.
  Evidence: `debug` at t=133 s: "Go home" dist 0.4 radius 2.4; shots/023-t133.jpg.
  Suggestion: step the figure out of the machine a couple of metres (spawn ~(-12, 7)) or enable "Go home" only after the opening line.
  Reproduced: `open hall` → clock → a single `press e` at t=5.7 s (2 s after arriving) ends the vignette ("You left the past alone"). In that ending the queued line "That's your grandfather. Young, and in a hurry." still plays at 12.4 s, *between* the two ending lines, so the reflection reads out of order.
  Suggestion (extra): clear the voice queue when a vignette jumps to its ending.
- **[minor] [UI]** Two-line captions render as two separate pills ("The past. The town where your grandparents" / "met."), with the second one a stub; at spawn the caption also sits right over the figure (spawn is at the bottom of the frame).
  Evidence: shots/023-t133.jpg, 024.jpg, 036-t227.jpg.
  Suggestion: `box-decoration-break: clone` is fine, but give the caption a single block background (display:inline-block with max-width) and balance the lines (`text-wrap: balance`); nudge the opening camera so the figure isn't under the caption.
- **[minor] [collision]** The grandfather walks straight through you when you stand in his way: the narration says "He steps around you, and apologises", but the two figures overlap completely at (1.3, 1.0).
  Evidence: shots/037-t231.jpg (t=231 s), caption at 236.3 s.
  Suggestion: make his route steer around the player (the player is a blocker for NPC paths), or at least sidestep 0.8 m when within 1 m of you.
- **[minor] [collision]** Houses, trees, the station platform/shelter and the time machine's surroundings have no blockers (level blockers list only fountain, sign, machine, grandma, paper stand and fence posts), so the figure can walk into the cottages. Conversely the short fence stops tap-to-walk dead: tapping a house behind it (walk to (-4, -14)) halts at (-8.4, -2.6) against the fence instead of going round its end.
  Evidence: `eval level.blockers()`; walk result "did not arrive (still 12.2 away)"; shots/043.jpg.
  Suggestion: add circle blockers for each house/tree/platform; give tap-to-walk a simple detour (try going around the blocker's end) instead of stopping.
- **[minor] [pacing/interaction]** The whole walk from arrival to "They meet" takes ~25 s. On my first run I talked to the paper seller (an aside) and by the time I walked to the gate its prompt was already disabled ("it is disabled right now"); the vignette ended "You let it be" without my ever seeing a prompt. For a player exploring the asides the choice silently disappears.
  Evidence: t=129 s arrive → 154.5 s phase over; the "Close the gate" prompt never appeared.
  Suggestion: have the grandfather wait by the paper stand/fountain until the player has come within ~8 m of the square (or until the question line has played), so the window to act is tied to the player, not the clock.
- **[polish] [movement]** A tap-walk in progress keeps going after the ending starts: I tapped towards the station at t≈287 s, the ending began, controls locked, and the figure kept walking until the card at (16.3, 3.2) ("moving" + "[controls locked/seated]").
  Suggestion: cancel the tap target when the level locks controls.
- **[polish] [camera]** The walkable disc (radius 26) has a huge empty foreground; walking there (e.g. (-18, 18)) makes the framer pull back so far that the town and the grandparents become tiny at the top of the frame.
  Evidence: shots/041.jpg, shots/042.jpg.
  Suggestion: shrink the walkable area to ~radius 18 around the square/station, or clamp the framer's zoom.
- **[polish] [clipping]** At the paper stand the figure stands partly inside the counter and hides the seller (the "Paper! Read all about it!" bubble comes from someone you can't see).
  Evidence: shots/024.jpg (t=141 s at (-9.5, 3.7)).
  Suggestion: enlarge the stand blocker to the counter's footprint and put the seller in front/side of the counter where the camera sees him.
