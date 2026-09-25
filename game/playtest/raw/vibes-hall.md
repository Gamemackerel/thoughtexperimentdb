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

### grandfather-paradox
- **[major] [visual/drama]** The meeting, the image the whole vignette builds to, is visually dead. Grandfather slides up and stops beside the bench, grandmother stays seated, and nothing moves: no hat lift, no standing, no turn toward each other, no change in light. The caption "They meet, just as they always did." carries all of it.
  Evidence: 033-t121.jpg, 036-t127.jpg (both identical over 6 s).
  Suggestion: give the meeting a two-second gesture: he lifts the bowler, she stands, they turn to face each other, and a small warm glow or the sepia filter easing for one beat. Frame it closer. It's the only close-up the vignette needs.
- **[major] [visual]** "Sepia-toned past" is a whole-canvas CSS filter (`sepia(0.35) saturate(0.85)` on the renderer), so the result is just a slightly faded version of the normal palette. Terracotta roofs, olive trees and a **teal** station roof all survive, and the player's teal is muted along with everything else. The strongest idea available (you're the only thing in full colour, because you don't belong here) is lost, and the teal roof competes with "you".
  Evidence: 016-t47.jpg, 019-gate.jpg (the station roof is the same teal family as the player and the time machine).
  Suggestion: tint the past through materials (a sepia palette variant for the scene's clay) instead of the canvas filter, and leave the player and the time machine at full saturation. Recolour the station roof to a period brick or slate.
- **[minor] [visual]** Things the narration says happen aren't shown. "A gust of wind. The gate swings open again." has no wind: no leaves, no dust, no sway in the trees. In the shot at the caption the gate still reads as closed. "He laughs." has no bounce or bubble.
  Evidence: 025-t100.jpg (gate caption; nothing moves), 047-t225.jpg (laugh caption).
  Suggestion: a short swirl of leaf or dust particles across the gate and a tree sway for the wind; a little shoulder bob and a "Ha!" `talk()` bubble for the laugh. Show, then say.
- **[minor] [visual]** The railway is two thin dark lines drawn on the sand, with no sleepers, ballast or buffer stop, and no train ever arrives. The station is a slab with a bench and a hut. Next to the hall's lovingly made locomotive it looks unfinished, and it's the goal of the whole walk.
  Evidence: 018-t57.jpg, 033-t121.jpg.
  Suggestion: add clay sleepers and a buffer, a lamp post and a station sign on the platform. Maybe have a small train sigh in and out after the meeting, so the "they always did" beat has a sound-image.
- **[minor] [camera]** The default framing pulls so wide (it fits the whole route) that at the choice the grandparents are ~20 px figures and the player hugs the bottom-left edge, sometimes half off frame next to the time machine.
  Evidence: 018-t57.jpg (player at the left edge), 039-t160.jpg (grandfather ~25 px tall).
  Suggestion: frame player + grandfather + the next obstacle, and cut wide only on the arrival and the meeting.
- **[minor] [UI]** The "E Close the gate" prompt sits over grandfather's face and hat right as he walks through the gate, which is the moment you want to see him. The caption pill also breaks a two-line sentence into two separately rounded boxes ("…Your" / "grandmother."), which looks like a rendering glitch.
  Evidence: 047-t225.jpg (prompt on grandfather), 016-t47.jpg / 018-t57.jpg (split caption pills).
  Suggestion: put prompts below the object's feet when an NPC is the focus. Render the caption as one block (a single background box with `max-width`, not inline `box-decoration-break` pills), or keep narration lines short enough for one line at 1280.
- **[minor] [bug/narrative]** Leaving early via "Go home" at t≈2 s: the reflection "You came all this way, and changed nothing." played, then the queued arrival line "That's your grandfather. Young, and in a hurry." played *after* it, over the frozen town. Pressing "Go home" also has no visible departure: you stand next to the machine and the world freezes.
  Evidence: t=262 → t=266, shots 051-t262.jpg, 053-t266.jpg.
  Suggestion: clear the voice queue on phase `over`. Walk the player into the machine, close the door, and give it a brief shimmer before the card.
- **[polish] [visual]** The fountain water vanishes. At t=262 the basin has its pale blue water; at t=266 it's empty sand-coloured stone. The bob (`0.58 ± 0.01`) sinks it below the rim.
  Evidence: 051-t262.jpg vs 053-t266.jpg.
  Suggestion: raise the water base to ~0.6 so the bob stays above the basin top.
- **[major] [structure]** "Back to the house" on the game-over card drops you in the **first room** at (0, 5.5), not in the hall beside the grandfather clock. Having climbed the ladder to reach the hall, you're sent back downstairs each time. The label also says "house" for a hall portal.
  Evidence: t=275.9 level=house after `#over [data-act=home]` from grandfather-paradox.
  Suggestion: return hall vignettes to the hall at the portal's spawn (`ctx.from`), and label the button "Back to the hall" there.
- **[minor] [pacing/mood]** A whole run lasts about 25 s (arrive t=43.6 → "They meet" t=68.8 on my first run), and grandfather hurries the entire time. I stood a few seconds to take in the town and the vignette ended before I'd reached anything. That's the opposite of "slow and authored" and leaves no room for the town's mood.
  Evidence: first run: phase `over` at 68.8 s after loading at 43.6 s, and I never got a prompt.
  Suggestion: have him pause on his doorstep until the player first moves (or ~8 s), and add a stop or two on the route (tip the hat to the stallholder, look at the fountain), so the player has time to be a ghost in the town.
