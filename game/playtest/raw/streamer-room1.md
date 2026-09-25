# streamer · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
- Room 1 has at least one great clip per vignette: the trolley impact and ragdolled workers, "you" still on the bench and then the brain with your world floating above it, the whiteout into daylight, the fisherman's "grandad's rod" joke. The trolley's third track is a perfect chat-vote twist.
- The biggest stream-killer is **one-tap endings**: in the Vat ("Sit down", 3 m from spawn) and the Cave ("Sit back down" the moment the chains fall; "Sit under the tree" the moment you're outside) a single E ends the vignette before the interesting part. Chat bounces with "wait, that's it?".
- **Dead air and repetition** on replay: the Ship makes you redo six identical plank carries (~50 s), the Trolley's Play again drops the third track, and the Cave replays its 22 s chained intro. Play again should get you to the choice faster.
- **Readability at stream size**: the cave in first person is mostly black exactly when its reveal line plays, the Vat's edge flicker is too faint, and the player is often a tiny speck or sits under the two-line caption at the key moment.
- Bugs that look bad on camera: the fisherman's speech bubbles stay stuck for the rest of the Ship scene (they even float over the sea in the ending shot); standing on the trolley track makes the trolley pass straight through you; stale narration lines play after an ending, or in the house after you've left.

## Findings
### house
- **[minor] [streaming]** The notebook (`N`) doesn't pause anything. I opened it during the trolley's slow phase and the trolley kept coming (t=24→29 s, phase `slow`, pt advancing). A streamer who opens it to read the background to chat loses the choice. The trolley notebook text also says "This short film walks through…", which is the film's blurb and reads oddly inside a game.
  Suggestion: freeze the level clock while the notebook is open, and reword the notebook intro for the game ("This scene…").
- **[minor] [thumbnail]** Walking up to the trolley painting, the rope ladder stands right in front of it and slices the train in half; the "Your journal" label also overlaps the "Step into the painting" prompt. That's the one shot a streamer would grab for "entering the first painting".
  Evidence: shots/002-painting.jpg (player at 1.5,-4.5).
  Suggestion: move the ladder a metre or two right of the painting, or hide the journal label while another prompt is active.

- **[minor] [clarity]** Both house doors say just "Open the door" (purple door → cave, sky door → ship). Standing between them you can't tell from the prompt which one you'll get; I went into the cave when I meant the ship.
  Evidence: house, me at (-5.6, 3.4), prompt "Open the door".
  Suggestion: "Open the purple door" / "Open the sky door", or put the vignette name in the prompt.

### trolley-problem
- **[major] [streaming / chat-vote]** I stood right on the main track among the five workers (talking to them) when the trolley came. It drove straight through me: no hit, no line, no reaction. "I'll stand on the track myself" is THE first thing chat will shout; right now it's a non-event that makes the scene look broken on camera.
  Evidence: run 2, t≈107–110 s, me at (14.6, 1.2); shots/019-t110.jpg (trolley right behind me, workers flying, I'm untouched). Reflection then said only "You left the lever alone."
  Suggestion: either knock the player flying too (rewind handles it) with a line like "You stood with them. It didn't stop the trolley.", or have the player step aside automatically with a line. Either is a clip.
- **[minor] [pacing / chat-vote]** On a replay (Play again from the card) the twist is gone: runs reset to 0, so to reach the "choose yourself" lever I had to sit through a full no-choice run plus ~18 s of reflection/twist narration before "Pull this lever" became enabled. On stream, chat already voted "pull it on yourself" and I'm waiting about 55 s to do it.
  Evidence: second attempt t=167→241 s; "could not get the 'Pull this lever' prompt within 20s (it is disabled right now)".
  Suggestion: once the player has seen the twist, keep the third track on Play again (it's saved-progress knowledge), or enable the self lever as soon as the twist line starts.
- **[minor] [clarity]** "Should you pull it?" plays on a timer even if you never went near the lever, so the "it" has no referent (I was standing at spawn; "This lever switches the tracks" only plays when you walk past the lever). On my second attempt it played when I was already at the far end by the self lever.
  Evidence: t=33.7 s, me at (-17, 7) spawn; t=188 s me at (16.7, 9.3).
  Suggestion: if the lever line hasn't fired, say "Should you pull the lever?" or fire the lever line first.
- **[polish] [humour]** The slowed-down worker speech bubbles ("Neeeaaarlyyy doooneee wiiith thiiis streeetch…", "Diiid yyyooouuu heeeaaar aaa beeell juuust nooow?") are genuinely funny and clip-worthy. But the bubble only appears if you walk 30 m to them during the slow phase, and doing so ate my whole choice window (the trolley committed while I was chatting, t≈107 s).
  Evidence: t=98–106 s.
  Suggestion: keep them; maybe give the first run a slightly longer slow window if the player is near the workers, or let one worker call out unprompted when the player approaches.
- **[polish] [readability]** The pull-back arrival shot keeps the player figure ~20 px tall at 1280×720; on a small stream window (or a phone viewer) the teal "you" and the lever are specks. The impact shots (shots/011-t54.jpg, 023-t144.jpg, 028-t263.jpg) are excellent thumbnails though.
  Suggestion: slightly tighter framing in the arrive/slow phases, or make the lever glow (GAME.md promises "the lever glows") actually visible at stream resolution; I couldn't see any glow in shots/009-t34.jpg.
- **[polish] [framing]** In the "You chose yourself" ending the knocked-over player lies at the bottom-right edge and the two-line caption sits on top of them (shots/030-t267.jpg). That's the most clip-worthy moment in the room and the hero is half covered.
  Suggestion: frame the landing spot a bit higher, or offset the caption.
- **[idea] [chat-vote]** The journal question is about pushing someone off a bridge, which the game never lets me try. Chat will immediately ask "can we push the guy?". A footbridge variant as a later twist (or an aside where you can stand on a bridge above the track) would be the most streamable addition in the whole room.

### brain-in-a-vat
- **[major] [pacing / onboarding]** The bench is 3.5 m from the spawn and its "Sit down" prompt shows while the opening line is still playing. Pressing E there ends the vignette immediately (phase → over at t=366 s, 3 s after arrival). A player who does the obvious first thing gets the "You stayed" card after ~15 s having seen nothing: no edge, no flicker, no brain. On stream that's "wait, that's it?" and chat bounces.
  Evidence: replay t=362.6 → gameover 381.3 s.
  Suggestion: don't enable "Sit down" (or don't make it final) until the player has seen the edge flicker at least once; or make the first sit a short rest that the narrator comments on and only the second sit (after the edge line) end the scene.
- **[minor] [framing]** The big reveal (fall → lab) opens on a shot where the player isn't in frame: first frame after landing shows the brain, machine and world above, but the teal figure is off-screen/under the caption (shots/038-t319.jpg; player appears at bottom edge in 039). The reveal reads better with "you" standing small beside the vat.
  Suggestion: land the player in front of the vat, or include the player position in the reveal framer.
- **[minor] [payoff]** The "No way out" ending is a small, quiet zoom: after the third step-off the camera shows the stacked worlds at mid size and the player is a 10 px speck at the very bottom under the caption (shots/045-t354.jpg, 046-t358.jpg); the card appears ~6 s later. This is the thumbnail moment of the vignette ("it's brains all the way down") and it undersells it.
  Suggestion: a longer, continuous pull-back through many nested layers (the stack visibly repeating into the distance) before the card; keep the player visible.
- **[polish] [readability]** The edge "flicker" is faint horizontal banding that I could barely see at full resolution (shots/035-t313.jpg); on a compressed stream it will be invisible, and the edge itself is off the bottom of the frame when the line "The world ends here" plays.
  Suggestion: a stronger glitch at the actual rim (a torn/pixelated strip, colour shift), and pan to show the rim when the edge line fires.
- **[keep]** The first-fall cut to "you" still sitting on the bench (shots/036-t315.jpg), then the brain with your world floating above it (and a tiny figure on the bench up there), is the best "wait, WHAT" moment in the room. The nested lab (shots/044-t346.jpg) is a perfect thumbnail.

### platos-cave
- **[major] [streaming / readability]** Most of the cave in first person is near-black: after "Your chains have come loose" I turned and walked toward the fire and got a completely dark frame (only a dim orange floor strip) exactly while the narrator said "Behind you, a fire. People carrying cutouts." Another turn gave a fully black frame. On a compressed stream (dark scenes turn to mush) viewers see nothing for the vignette's big reveal.
  Evidence: shots/059-t420.jpg (black, caption over it, me at 1.8, 8.0), shots/063-scan2.jpg (black), vs. the good-looking shots/073-t462.jpg.
  Suggestion: raise ambient/bounce light in the cave (walls, ceiling catching firelight), and when the "turn" line fires, nudge the view toward the fire and the carriers (a soft auto-look) so the reveal is actually on screen.
- **[major] [pacing]** "Sit back down" is enabled the instant the chains loosen, at your own seat, with no movement needed. One E press (which a player spams to "continue") ends the vignette: "You kept watching" card 6 s later. Same pattern for "Sit under the tree": it's usable the moment you arrive outside, before the "Outside. The real things…" line has even played.
  Evidence: replay 2, prompt at 499.8 s, over at 499.9 s; replay 3, tree used at 545.3 s, before the "Outside" caption at 547.7 s.
  Suggestion: make the quit-options appear only after a beat of real freedom (e.g. after the player has turned more than ~90° or ~6 s have passed), and the tree only after the "you could stay up here" line.
- **[minor] [bug / narration order]** When I moved fast, the voice queue lagged far behind me and then played lines that contradict the ending I'd chosen: I sat under the tree (phase over) and the narrator then said "It's too bright to look at." (a cave line), "Outside…", "You stay in the light." and finally "You could stay up here. Or go back down, and tell them." — at the same moment the game-over card appeared. Also "A path leads up, towards a light." played once I was already outside.
  Evidence: replay 3, t=541.8–555.4 s (see captions/gameover timestamps in the log).
  Suggestion: drop queued location lines that are stale when their turn comes (player no longer in that `where`), and never play a choice prompt line after phase is `over`.
- **[minor] [payoff]** The "go back and tell them" ending is told, not shown: "They laugh. The climb has ruined your eyes, they say." but the prisoners don't laugh, turn, or bubble anything (no speech events at all), the frame is just their static backs/faces (shots/075-t471.jpg). This is the emotional punchline and the most chat-reactive moment in the cave.
  Suggestion: reuse `talk()` bubbles for two or three mocking replies ("Ha! Sun, he says." / "Sit down, you're blocking the rabbit.") and a small head-turn/shake animation.
- **[polish] [chat bait]** The prisoner bubbles ("Best seat in the house, this." / "What's behind us? Nothing. Just rock.") are good and funny. More of them would give a streamer something to read out during the 22 s chained intro, which currently has only two lines and no interaction (and replays in full on Play again).
  Suggestion: let prisoners already be talkable (bubbles only) while chained, or shorten the chained intro on replay.
- **[polish] [visual]** "Your reflection… this one looks back." but the pond is a flat blue disc with no reflection (shots/069-t450.jpg). The frog plop there is cute and does read on camera.
  Suggestion: a simple mirrored figure/sky in the pond.
- **[keep]** The whiteout into the paper-white sky and then the sun over the pond (shots/066-t436.jpg → 067-t437.jpg) and the dark-adapted return (shots/073-t462.jpg, fire, prisoners, shadows on the wall) are strong and readable.
- **[minor] [bug]** Pressing Esc half a second after arriving in the cave showed the "Leave this vignette?" dialog, I accepted it, and nothing happened: I stayed chained in the cave for another 17 s until a second Esc worked. Then, back in the house, the cave's line "Your chains have come loose." played as a caption in the first room.
  Evidence: t=558.3 s Esc accepted → still `platos-cave` at 575 s; after second Esc, house loaded at 575.9 s and caption "Your chains have come loose." at 577.6 s.
  Suggestion: honour an accepted leave during the arrival transition (or don't show the dialog then), and flush the voice queue on level change.

### ship-of-theseus
- **[major] [bug]** The fisherman's speech bubbles never go away. I talked to him 4 times at t≈720–727 s; all four bubbles stayed "on screen" for the rest of the scene (still listed at 874 s), and the last one ("This was my grandad's rod…") floats over open water in the sailing ending shot and on the game-over card.
  Evidence: shots/105-stuck.jpg, shots/107-t871.jpg (bubble in the empty sea while I sail away). Recipe: go to the fisherman at (24.4, 1.2), press E four times ~2 s apart.
  Suggestion: time out each bubble and replace the previous one instead of stacking; hide bubbles whose speaker is off-screen or when the phase changes to sail.
- **[major] [pacing / dead air]** The core loop is six identical carry trips (take plank → walk → replace → ~5 s animation), about 8 s each, ~50 s total, with narration only after swaps 1, 3 and 6. Swaps 2, 4 and 5 are silent busywork, and Play again makes you do all six again before you can pick the other ship. On stream that's the moment chat starts typing "skip".
  Evidence: first run t=616–666 s; second run t=703–778 s.
  Suggestion: make later swaps faster (the old planks fly out on their own after the third, or you carry two at a time), give the silent swaps a tiny beat (the fisherman comments, a plank creaks, the ship changes colour visibly), and on Play again start at the two-ships choice or offer "skip to the choice".
- **[minor] [clarity]** The two boarding prompts are 1.8 m apart on the same dock (new ship at z=-0.9, old at z=+0.9, radius 2.4). Walking up the middle of the dock you only ever get "Board the ship of new planks"; the old-plank ship needs you to know to step to the other edge. Chat votes "old ship!" and the streamer fumbles.
  Evidence: me at (15.1, -0.2) for 70 s with only the new-ship prompt; stepping to (15.9, 1.4) showed the old-ship prompt.
  Suggestion: separate the two boarding points (one at each end of the dock, or each by its own ship's gangplank), or show both prompts.
- **[minor] [collision]** Tap-walking from the shore toward the fisherman at the dock end stops dead at the plank stack (x≈6.9, z≈1.4): "blocked", even when holding a direction key. You have to know to step around it.
  Evidence: t=703–710 s, walk to (23.5, 1) and `hold d 2` both stuck at (6.9, 1.4).
  Suggestion: route around the stack (steering) or move the stack off the centre line of the dock.
- **[minor] [payoff]** Both endings are ~8 s of the boat bobbing, one line, then the card. No twist, no replay acknowledgement ("you chose the same/other ship"), unlike the trolley. The choice is the best chat-vote in the room ("which one is the REAL ship?") and it resolves too quietly.
  Suggestion: after boarding, have the other ship follow or pass you, with the rebuilder/fisherman reacting; on replay, acknowledge the switch; consider a twist (e.g. both ships claim the name at the harbour).
- **[polish] [visual]** Ship model reads oddly in the sailing close-up: the hull sits on a dark flat slab like a sledge, and the side planks stick out past the stern in a stepped, broken edge (shots/095-t690.jpg). When the old-plank ship appears, its sail and mast cut across the dock and the fisherman (shots/093-t681.jpg).
  Suggestion: hide the cradle when sailing, trim the plank ends, and spawn the second ship a little further from the dock.
- **[polish] [narration pillar]** The first line is "The ship of Theseus. Its wood is getting old." and the question "Which one is the ship of Theseus?". That's a name in the narration, which GAME.md §1 says to avoid.
  Suggestion: "An old ship. Its wood is getting old." / "Which one is the real ship?"
- **[keep]** The fisherman's lines ("Forty years I have fished off this dock. / Mind you, they have replaced every board of it since. / This was my grandad's rod. New line, new reel, new handle. / Still his rod, though.") are the funniest, most clip-able writing in the room. The rebuilder's "I kept every one. Seemed a shame to burn them." is great too.

## Keep
- Trolley: slow-mo worker bubbles, the impact/ragdoll shots, the rewind, and the third track ("Would you? If not, is it fair to send it to someone else?"), which is the best chat-vote in the room.
- Vat: the cut to the brain with your world above it, and the nested labs (shots/044-t346.jpg is the thumbnail).
- Cave: the whiteout into daylight, the dark-adapted return, the prisoner bubbles ("Best seat in the house, this.").
- Ship: the fisherman and rebuilder lines, and the old-plank ship appearing beside the new one.
- Game-over card titles are short and quotable ("Someone is always on the track", "No way out"). Big serif titles read even at 640×360.
- Captions stay readable at 640×360 (shots/111-small.jpg).

## Harness notes
- `use "Talk"` / `use "Board the ship of old planks"` sometimes reported the prompt "disabled" or never appeared, because the auto-walk got blocked (plank stack) or stopped where a nearer prompt won. Walking manually worked. I've reported the in-game causes above.
- `use "Open the door"` in the house picks the nearest door. Both doors share the prompt text (see house finding).
