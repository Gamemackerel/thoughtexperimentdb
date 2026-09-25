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
