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
  Evidence: t=297.7 s `clicksel "#over [data-act=home]"` → `level loaded: house`, you at (0.0, 5.5); shots/045.jpg. Esc mid-vignette does the same ("Leave this vignette and return to the house?" → first room at (0, 5.5)).
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
- **[minor] [interaction]** Tap-walking to the gate (tap on the gate at 250,390 on a 390x844 phone) routes you across the grandfather's path, so you "stand in his way" by accident: "He steps around you, and apologises" fires at 11.5 s, counting as a try before you reached the gate and pressed anything.
  Evidence: portrait run, t=8.2 → 11.5 s, shots/049.jpg.
  Suggestion: only count "stand in his way" when the player is stationary (e.g. stood still ≥1 s) in his path, not while walking through it.
- **[minor] [portrait]** On a 390x844 phone the top ~35% of the screen is empty sky, the scene sits small in the middle, and at spawn the "E Go home" pill is cut off by the left edge (only "E" half visible). Three-line captions become three stacked pills. At 17 s the player is ~10 px wide at the far left edge — hard to tap near.
  Evidence: shots/048.jpg, shots/050.jpg.
  Suggestion: in portrait, tilt the camera down / tighten the framer so the square fills the width; clamp prompt pills inside the viewport with a 16 px margin.

### infinite-monkey
- **[minor] [UI overlap]** The "E Wait a million years" prompt is drawn exactly on top of the years counter above the lever, so the moment the counting stops you can't read the total: "1,010,417 years" sits hidden behind the prompt pill.
  Evidence: shots/055-t28.jpg (t=27.6 s at (4.9, 6.3)).
  Suggestion: move the counter higher (or to the wall behind the lever) or anchor the lever prompt below/beside the lever; they should never share an anchor.
- **[polish] [UI]** The counter overshoots: after "A million years go by." it settles on 1,010,417 / 2,020,833 / 3,031,250 years instead of round millions (the ending card then says "Three million years").
  Evidence: labels at 25.6 s, 66.8 s, 86.9 s.
  Suggestion: clamp the count to `waits × 1,000,000` at the end of the animation.
- **[minor] [UI]** World labels stay visible over overlays: the years counter pokes out from behind the read-a-page sheet (shots/053.jpg, 056.jpg right edge) and shows through the game-over card next to the journal textarea ("…,250 years", shots/059.jpg).
  Suggestion: hide world labels (ctx.ui.label) while the page or the game-over card is open.
- **[minor] [portrait/touch]** On 390x844 the page sheet is wider than the screen: text starts at the very left edge and the "E · put it down" hint is cut off ("put it dow"). On touch there is no E; tapping the page does close it, but nothing says so.
  Evidence: shots/064.jpg.
  Suggestion: size the page to `min(90vw, …)` and show "tap to put it down" on touch devices.
- **[minor] [collision]** The exit door has no blocker: tap-walking to it (walk to (-9, 6.5)) parks the figure inside the door frame, where the door hides it completely, and before the "ask" line has played there is no prompt at all, so it just looks like you walked into a wall.
  Evidence: shots/060.jpg (t=204 s).
  Suggestion: add a thin blocker along the door slab and stop the player in front of it; show "Walk out" as soon as the room is introduced (or show a disabled-looking prompt) so the door reads as an exit.
- **[polish] [interaction]** The crate prompt competes with the nearest monkey's: standing at the crate at (-9.4, 2.8) the prompt flips from "Look in the crate" to "Say hello" (monkey at (-7.5, 2.0)), and the monkey's pill floats over the monkey rather than the crate. The figure also stands partly inside the crate.
  Evidence: shots/061.jpg, t=219.7 s both prompts fire on the same frame.
  Suggestion: prefer the interactable the player is facing / closest to, keep the crate's radius clear of the front-left monkey, and enlarge the crate blocker to its box (1.3 × 0.9).
- **[polish] [interaction]** "Read a page" as a tap target: the lectern's blocker (r 0.5) sits under its prompt, so walking to the lectern leaves the figure pushing against it ("trying to walk to a target but not getting closer") while the page is open.
  Evidence: status at t=11.1 s, 58.7 s, 67.9 s at (0, 8.0)/(1.8, 6.2).
  Suggestion: when an interaction is triggered, clear the walk target.
- **[polish] [text]** On the "walk out" ending the journal question still says "The monkeys typed 'To be, or not to be'…", though in that run you never saw it happen.
  Evidence: game-over at t=229.5 s.
  Suggestion: a variant question for the walk-out ending.

### simulation-argument
- **[minor] [collision]** The bookshelves have one small blocker (r 0.7 at (-8.2, -1.5)); tapping them walks the figure *behind* the shelves, where it is completely hidden (onscreen (-8.8, 1, -2.4) → (180, 404), exactly under the shelves), and the walk jitters there for the full 15 s timeout ("still walking at timeout").
  Evidence: shots/068.jpg (figure squeezing past the shelf end), shots/071.jpg (figure invisible).
  Suggestion: block the whole strip between the shelves and the back wall (a box from x -10.5..-7, z -4.6..-0.5) or make walkable exclude it.
- **[minor] [collision / stuck]** The desk's blocker (r 1.6 at (0, -3)) reaches the back wall (walkable z > -4.6), so the gap behind the desk is a dead end: after "Look out of the window" at (4, -4.1), tapping the photo on the other side walks you behind the desk to (1.1, -4.6) and stops ("did not arrive, still 4.9 away"), wedged between desk and wall.
  Evidence: shots/083.jpg.
  Suggestion: either leave a real passage behind the desk or block it fully; make tap-to-walk go round the front of the desk.
- **[minor] [collision]** The exit door (7.3, 1.0) has no blocker: you can walk straight through it and stand behind it (10.3, 2.2), and tapping the door itself on a phone (330, 430) walks you through and out the other side to (9.6, -0.4), past the "Leave them running" radius, so the prompt flashes and disappears.
  Evidence: shots/069.jpg, 070.jpg, 091.jpg; t=44.0 s prompt appears, gone by 46.6 s.
  Suggestion: give the door a thin blocker and stop taps on it at a stand point in front of it.
- **[minor] [portrait]** On 390x844 the "E Leave them running" pill runs off the right edge ("Leave them runn"), and during the reveal the whole study shrinks to ~130 px in the middle of an empty screen for ~4 s after the choice phase has already started (phase `choose` at 38.3 s, room still tiny at 38.4 s).
  Evidence: shots/089.jpg, shots/092.jpg.
  Suggestion: clamp prompt pills to the viewport; start `choose` only once the camera has come back in.
- **[polish] [interaction]** When the choice opens you're standing in front of the desk where "Run more worlds" was, but no prompt shows (the "Switch them off" radius is 1.8 around (1.4, -1.8), you're at 2.5). Nothing on screen for several seconds; one step right shows the prompt.
  Evidence: t=70.1–72.1 s at (-1.1, -1.4), "(no text)"; shots/081.jpg.
  Suggestion: widen the switch radius to ~2.4, or move the lever next to where the player stands after "Run more worlds".
- **[polish] [clipping]** In the zoom into the little world the blue person stands half inside the cottage wall; when the frog arrives it sits on the desk overlapping the monitor and the dome.
  Evidence: shots/074-t44.jpg, shots/078-t57.jpg.
  Suggestion: move the blue figure 0.5 m out from the cottage; land the frog on the free end of the desk.
- **[polish] [visual]** When you switch them off the room darkens, but the window pane stays full white and unlit, which reads as a rendering glitch rather than "the lights flicker".
  Evidence: shots/085-t103.jpg.
  Suggestion: dim the window's material with the rest of the room (or make it the flicker source).
