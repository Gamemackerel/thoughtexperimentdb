# vibes · the hall

## Summary
(in progress)

## Findings

### hall
- **[major] [visual/camera]** The hall's best Magritte set pieces are never on screen. The upside-down dining table and chandelier live at y≈9.5 on the ceiling, and the fixed low third-person camera cuts off at the top of the back wall, so across the whole walk (x −16 → 14) I never saw them. All that reaches the frame is a few bowler hats and apples cropped at the top edge, which read as stray debris.
  Evidence: shots 005-mid1, 006-mid2, 007-end (build/agentplay/vibes-hall/shots/). The table is at `upside.position (-3.5, 9.5, -1.5)` in game/house/hall.js.
  Suggestion: lower the ceiling set to about y 6–7, or give the camera a slow upward tilt / crane beat on arrival (the ladder climb is the obvious moment: come up through the floor looking at the ceiling, then settle). Or drop the table and chandelier within ~1 m of the camera's top frame line at the spot where the player enters.
- **[major] [visual]** *Time Transfixed* doesn't read. The locomotive is black clay inside a flat black hearth (`0x1b1a20`) on the floor, so it's a dark blob with one yellow lamp. The painting's force comes from a small black train hanging in mid-air out of a bright, empty fireplace. The Son of Man and his speech bubble also stand right in front of it.
  Evidence: 007-end.jpg, 011-bubbles.jpg (fireplace at right; the bubble covers the mantel).
  Suggestion: make the hearth back a warm grey or cream marble, lift the engine off the floor so it projects out of the opening into the room, and move the gentleman ~2 m to the left of the fireplace so each picture gets its own silhouette.
- **[minor] [visual]** *Golconda* reads as a framed poster of men standing in rows. They're a flat texture in a window frame with no parallax and no visible fall, and the rows are too regular to feel like rain.
  Evidence: 008-mirror.jpg, top centre.
  Suggestion: put 2–3 depth layers of cut-out men at different z behind the window, drifting very slowly. The painting isn't about motion, but depth sells "outside". Loosen the grid a little.
- **[minor] [visual]** The grandfather clock (the Grandfather Paradox portal) is jammed into the Escher stairs. The bottom four floating steps cross in front of the clock case and its pendulum, so the first portal of the hall reads as clutter instead of an object you want to step into.
  Evidence: 005-mid1.jpg, 012-west.jpg.
  Suggestion: move the clock ~1.5 m left (or start the stairs further right) so it stands alone against the sky wall.
- **[minor] [visual]** The five portals are small tabletop props (a typewriter, a beige monitor, a thin telescope) on identical little desks. Next to the first room's painting, book and doors they look like furniture, not thresholds, and nothing glows or pulls the eye.
  Evidence: 006-mid2.jpg.
  Suggestion: give each portal a faint emissive "come in" cue in the object's own language: paper lit from inside the typewriter, the monitor's green light spilling on the wall, starlight on the telescope's brass, sun on the gate's grass. Give each desk a different shape too.
- **[minor] [UI]** Portal labels far from the player render as grey, semi-transparent pills on a pale blue sky wall with grey text. They look disabled and wash into the wallpaper. When two are near, they overlap each other and the paintings: "Fermi Paradox" sits on the starry window's lower edge and "Tragedy of the Commons" over the mirror.
  Evidence: 006-mid2.jpg ("Simulation Argument", "Fermi Paradox" at ~40 % opacity), 008-mirror.jpg.
  Suggestion: keep the far state at full-opacity cream but smaller, or show only the nearest label. Anchor labels below the prop (on the floor side) so they never sit on the paintings.
- **[minor] [camera/UI]** At the hatch (the arrival point and every return from the first room), the red curtain hides the player. The "E Climb down" prompt and the "Down to the first room" label stack on top of the player's head, so on arrival you can barely find yourself.
  Evidence: 004-t7.jpg, 013-west2.jpg (the teal figure is almost fully behind the curtain and labels).
  Suggestion: move the hatch and spawn ~1.5 m right (x ≈ −12), and merge the label and prompt into one pill when both are showing.
- **[minor] [bug/UI]** The gentleman's speech bubble stays on screen long after you walk away. I talked to him at x 13.6 (t=26.6), walked the full hall to x −16, and at t=40 "We always want to see what is hidden by what we see." was still floating mid-screen over the typewriter desk, with no speaker nearby.
  Evidence: 012-west.jpg, 013-west2.jpg.
  Suggestion: fade the `talk()` bubble after ~4 s, or when the player leaves the speaker's radius.
- **[polish] [visual]** The *Not to be Reproduced* mirror works (a second teal you, seen from behind, in a little checker room). But the gilt frame has no glass: no sheen, no slight tint. From the hall camera it reads as an open doorway with someone standing in it, and the joke only lands if you already know the painting.
  Evidence: 008-mirror.jpg.
  Suggestion: add a very faint transparent plane in the frame with a soft diagonal highlight and a slightly cooler tint, so it's clearly a mirror that's wrong.
- **[polish] [visual]** The sky wallpaper tiles one cloud stamp plus small dots at a regular pitch. Up close it reads as nursery polka-dot wallpaper, not Magritte's painted sky, and the dots (small single circles) are the cheapest-looking element in the room.
  Evidence: every hall shot; the dots are clearest around the stairs in 005-mid1.jpg.
  Suggestion: drop the dots. Vary cloud scale and rotation (2–3 stamps), and add a vertical gradient from deeper blue at the top to paler near the skirting, as in *The Blank Signature*/*Le Beau Monde* skies.
