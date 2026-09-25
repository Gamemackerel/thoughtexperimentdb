# vibes · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
(in progress)

## Findings
### house
- **[major] [typography]** The title screen and all UI type rely on system fonts (`--serif: "Iowan Old Style", "Palatino", Georgia` / `--sans: "Avenir Next", "Helvetica Neue", Helvetica, Arial` in `engine/style.css`). On a non-Mac machine the title "Thought Experiments" renders in a generic Times-like serif and the body in Arial: it reads like an unstyled web page, not an art game. Only Caveat is actually loaded from Google Fonts.
  Evidence: build/agentplay/vibes-room1/shots/002-open.jpg (title screen, Linux headless Chrome).
  Suggestion: self-host or load a real pair via Google Fonts (e.g. EB Garamond / Cormorant for serif, Inter / Figtree or DM Sans for sans) so the look is identical on every platform.
- **[minor] [visual]** The title screen is a flat cream page with text only; the first image of the game is the least beautiful. 
  Evidence: 002-open.jpg.
  Suggestion: render the house (slowly orbiting, blurred or at low opacity) behind the title, or at least a small clay vignette / the teal figure, so the art direction starts at frame one.
- **[major] [visual]** The Penrose staircase, the room's signature Escher piece, reads from the default camera as a ring of loose beige cardboard boxes around a grey peg, not as a looping staircase. From the high 3/4 angle the treads (0xf2eadb) and risers (0xc9b99c/0xa99a80) are too close in value, the steps are chunky cubes, and the "closed loop" illusion only works from the camera's own line of sight, which is looking down on it. The little climber is barely visible and the player disappears behind it when standing nearby (only the head shows).
  Evidence: 003-stairs.jpg, 006-t17.jpg (player at (-5.2,-4.1) hidden behind the steps).
  Suggestion: thinner, wider treads with a strong dark riser (the classic Escher black/white step edge), a visible railing or wall-hugging square plan like the Ascending/Descending building, and place it where the camera sees it more side-on (e.g. against the left wall, raised on a plinth). Give the climber a colour that pops (it's a grey peg on beige).
- **[minor] [visual]** The upside-down floating armchair is an untextured red L-shape that, from the default camera, overlaps the top-left corner of the trolley painting's gold frame; it reads as a stray box or a rendering error, not as a chair.
  Evidence: 003-stairs.jpg, 004-painting.jpg, 006-t17.jpg.
  Suggestion: give it recognisable armchair features (legs pointing up, rounded arms, a cushion seam, a darker velvet material) and move it so it floats clear of the painting (e.g. above the middle of the room, lower, where it silhouettes against the wall).
- **[minor] [composition]** The rope ladder to the hall hangs straight down the middle of the frame and cuts across the trolley painting — the one portal that is supposed to be a painting you step into. Its "Up to the hall" label also sits on top of the painting at spawn.
  Evidence: 001-open.jpg, 004-painting.jpg.
  Suggestion: move the ceiling door/ladder towards the right wall (near the tall table) so the painting is framed clean, or hang the painting further left.
