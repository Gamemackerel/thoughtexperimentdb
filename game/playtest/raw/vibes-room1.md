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
- **[polish] [UI]** Portal name labels ("The Trolley Problem", "Your journal", "Up to the hall") are large bold 26px-ish sans pills that dominate the frame and sit on top of the art they name; the journal label stays on screen through the whole dolly into the painting.
  Evidence: 004-painting.jpg (label over the ceiling door/painting), 008-t20.jpg (dolly into the painting with "Your journal" pill still bottom-left).
  Suggestion: hide all labels/prompts as soon as a portal transition starts; make labels smaller, lighter (serif small caps or a brass museum-plaque style) so they feel like part of the house.

### trolley-problem
- **[minor] [visual]** The step-into-the-painting dolly is a great idea, but at the end the camera is so close that the painting texture is visibly upscaled and blurry (jpeg-soft edges on the trolley windows), just before the white flash.
  Evidence: 009-t20.jpg.
  Suggestion: render the painting texture at 2048 px (or render the painting as a live render-to-texture of the level's first shot), and cut to white slightly earlier.
- **[minor] [visual]** The painting promises a green hill, a stone tunnel mouth and a warm sky; you land on a flat, beige, nearly featureless plane dotted with trees, and the tunnel is off frame. The transition "into" the picture doesn't pay off visually.
  Evidence: 008-t20.jpg vs 011-t23.jpg / 012-t25.jpg.
  Suggestion: make the arrival shot match the painting's composition (same angle on the tunnel and hill), then have the camera swing to the gameplay framing. Add a little ground colour variation (a green hill, grass patches, a path) so the island isn't a sand-coloured void.
- **[minor] [visual]** Style mismatch: the trees are flat-shaded low-poly icosahedra (hard facets) while the trolley, people, lever and rocks are soft, rounded clay. The trees look like a different asset pack.
  Evidence: 012-t25.jpg, 024-t121.jpg (faceted trees next to the smooth trolley).
  Suggestion: use smooth-shaded, slightly lumpy clay blobs for the canopies (subdivided + noise, `flatShading: false`), matching the clay kit.
- **[polish] [visual]** "Time slows to a crawl" has no visual signature: the frame looks identical in normal and slow phases apart from the tinted route. It's the big moment of the scene.
  Evidence: 012-t25.jpg (arrive) vs 013-slow.jpg (slow).
  Suggestion: a subtle grade change when the slow begins (slight desaturation / warm vignette / dust motes hanging in the air, the trolley's dust puffs freezing), released when you commit.
- **[polish] [visual]** The trolley's dust trail is made of perfect, opaque white spheres of equal shade; they read as pearls or foam balls, not dust.
  Evidence: 016-t64.jpg, 023-t119.jpg, 028-t156.jpg.
  Suggestion: vary size and opacity, fade them out as they rise, tint them toward the ground colour, and soften with a bit of transparency.
- **[polish] [typography]** Long captions wrap into two separate dark pills of different widths ("Five people, working on the track. They can't hear / it coming.") which looks like two UI elements. Captions also use a different style (white on dark, sans) from the house toast (dark italic serif on white).
  Evidence: 013-slow.jpg, 019-t71.jpg vs 001-open.jpg.
  Suggestion: render the caption as one block with `max-width` and balanced wrapping (`text-wrap: balance`), and pick one voice style for all narration text (captions and toasts).
- **[polish] [UI]** The game-over card mixes five type treatments (tracked orange sans kicker, big serif title, italic serif, roman serif question, handwritten Caveat answer, bold small sans label, grey sans placeholder) and the default browser textarea resize grips are visible; the buttons sit on the very bottom edge at 1280×720.
  Evidence: 030-over.jpg, 031-answer.jpg.
  Suggestion: drop to three treatments (serif display, italic serif body, Caveat for anything the player writes), `resize: none`, and tighten vertical spacing so the buttons have breathing room.
- **[minor] [transition]** Coming back is a plain white flash straight to the house; the lovely "dolly into the painting" entrance has no mirror. Same for "Back to the house" from the game-over card.
  Evidence: 035-frame.jpg (white) → 036-t403.jpg (house).
  Suggestion: land in the house with the camera starting tight on the painting and pulling back out of it while the figure steps out of the frame (reverse of the entry); the painting could even show the last frame of your run for a moment.
- **[polish] [visual]** The in-world gold frame you "step back through" is a nice idea but is only an empty gold rectangle lying at the bottom-left edge of the frame, half cut off.
  Evidence: 020-twist.jpg (bottom-left corner).
  Suggestion: stand it upright, show the house (the checkered floor, the room's wall colour) through it, and keep it inside the framer's points once it appears.
- **[polish] [visual]** The completed trolley painting doesn't glow in the house; the only sign is a "✓" appended to its label. The journal desk does get a warm glow disc.
  Evidence: 032-t168.jpg.
  Suggestion: a soft warm rim light / gilded sheen on the painting's frame once completed (as GAME.md promises "completed portals glow softly"), and drop the checkmark glyph.
- **[minor] [UI]** The notebook is a white web card with serif body text and a tracked-caps sans heading; it doesn't look like a notebook (no paper, no ruled lines, no handwriting), and it uses straight quotes and curly quotes inconsistently (`"The Problem of Abortion…"` vs `“Judith Thomson, The Trolley Problem…”`); book titles aren't italicised. Its intro also says "This short film walks through…" inside the game.
  Evidence: 033-notebook.jpg.
  Suggestion: style it as a notebook page (cream paper texture, faint ruling, a Caveat margin note, a paper-clip or tab), use curly quotes and italic titles throughout, and rewrite the intro for the game.

### brain-in-a-vat
- **[major] [visual/narrative]** The narration sells "A sunny afternoon… The grass, the trees, the warmth" but the world is the same pale beige paper disc as the trolley island and the lab below: no grass, no sun colour, no warm light. The first layer is supposed to be seductively real and it's the flattest-looking place in room 1. It also makes the lab (the "real" layer) indistinguishable in palette from the fake one, which undercuts the reveal.
  Evidence: 042-t408.jpg, 045-t422.jpg (world) vs 055-t450.jpg (lab): same ground colour, same light.
  Suggestion: push layer 0 hard toward idyll (saturated green grass disc, warm key light, long soft shadows, a pale-blue sky gradient above the disc, a few flowers that are actually visible); make each lab clinical (cool grey-blue floor, cold top light, tiles or a floor grid). The contrast is the point: "real" should feel less inviting than the simulation.
- **[major] [effects]** The edge "flicker" is a full-screen overlay of translucent horizontal pastel bars that sit over everything, including the house, bench and the player, rather than at the edge of the world. It reads like a CSS/UI glitch, not the world breaking, and it looks cheap next to the handsome reveal shots.
  Evidence: 047-t435.jpg, 049-t438.jpg, 057-edge2.jpg (bars across the player and the machine).
  Suggestion: make the glitch diegetic and local: the disc's rim tiles dissolve into wireframe/voxels or scanline shimmer, grass near the rim de-rezzes, trees near the edge pop to lower LOD, a thin band of "missing texture" at the horizon. Keep any screen-space effect subtle and masked to the edge region.
- **[minor] [transition]** Both entering the book and falling off the edge are hard cuts to white. For a vignette about perception, the fall ("fall outward into a lab") is the money shot and we never see it.
  Evidence: 039-t407.jpg, 050-t440.jpg (white frames), then 051-t442.jpg (already in the lab).
  Suggestion: entering: pages of the book turn/fly past the camera (it's "open the book"). Falling: keep the camera on the figure dropping off the rim, pull back as the disc shrinks overhead and the lab's floor rises; only then land.
- **[minor] [visual]** Text/visual mismatches: "Reels turning, lights blinking" (the machine has two dials and a screen, no reels); "Every leaf exactly where you'd expect it" (the trees are faceted low-poly balls with no leaves; could be a great deliberate joke if the vat world were the only low-poly place, but the trolley uses the same trees).
  Evidence: 056-t462.jpg, 045-t422.jpg.
  Suggestion: add two tape reels spinning on the machine's face; and reserve the faceted "too-perfect" tree style for the simulated layer (smooth clay trees everywhere else) so the look itself becomes a clue.
- **[polish] [visual]** The brain is a smooth pink double blob (reads more like a bottom than a brain) and the wires cross in front of the machine's screen.
  Evidence: 051-t442.jpg, 059-t470.jpg.
  Suggestion: add a few sculpted gyri grooves (normal map or displaced noise), a hint of a brain stem, and route the cables from the top of the cabinet.
- **[minor] [lighting]** The "You stayed" ending ("You sit down. The sun is warm." / "Real or not, it's the only sun you have.") has no visual payoff: the light, colour and camera are exactly as before you sat. This is the most tender ending in room 1 and it's static.
  Evidence: 066-t504.jpg (identical grade to 045-t422.jpg).
  Suggestion: on sitting, slowly shift the key light to low golden hour (warmer, longer shadows), bloom a little, and let the camera ease in on the bench; a leaf or two could drift down.
