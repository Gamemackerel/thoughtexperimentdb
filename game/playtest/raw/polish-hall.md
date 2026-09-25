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
