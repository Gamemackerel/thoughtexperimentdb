# Work list after the 25 September playtest

What we decided to do, from `FEEDBACK.md` (reviewed item by item in the Playtest Decisions page) and the notes left in
the game's feedback box (`feedback.txt`). Items decided as skip are left out; see FEEDBACK.md for them.

## Shell (every vignette)
- [ ] **G2** Cancel a level's lines and scripts when it ends or is left (generation token; `voice.say`/`ctx.wait` stop,
      `gameOver`/`save`/`journal` ignore a disposed level); reaction lines jump the queue; stale lines expire.
- [ ] **G3** Speech bubbles never stick (hide the old label when a speaker talks again or a bubble expires).
- [ ] **G1** No ending one keypress from where you stand: endings unlock after the problem is met; an input grace period
      after loads and phase changes. (Return spawns stay where they are: H3 skipped.)
- [ ] **G4** Prompt priority: tie-break by facing, asides before endings; no two irreversible actions in one radius.
- [ ] **G16** The four house rules in GAME.md and in every vignette: usable-looking things show a prompt from arrival
      (even "Not yet"); a visible way home; doing nothing resolves within ~60 s of the question; no terminal action on a
      shared prompt anchor. Also: queue `look()` lines instead of hiding the prompt while narration plays; hide world labels
      under the page, notebook and game-over card; cancel the tap-to-walk target when an interaction fires.
- [ ] **G6** The journal keeps every ending (pips; unfound ones blank) and every answer with the ending it followed.
- [ ] **G7** Every vignette notices a replay (same vs different choice) and has an in-world way home.
- [ ] **G9** Collision: box blockers for long things, snap tap targets to free space, stop walking after ~1 s stuck.
- [ ] **G12** Real web fonts (a serif and a sans from Google Fonts); fewer text styles.
- [ ] **G13** In-game Esc pill instead of `confirm()`; "The end" instead of "Game over"; clear prompts and labels on unload
      and portal transitions; the frog during the choice. (No "what others chose" tally.)
- [ ] **G14** "Back to the hall" / "Back to the gallery" / "Back to the trolley room" on the card, per room.

- [ ] **Z-fighting** (your note): coplanar surfaces flicker where two planes sit at the same depth: the sky door in the
      first room, the Ship of Theseus dock on the beach, the prisoner's dilemma blackboard. Offset them, and sweep every
      level for others (the smoke test's screenshots).

## House
- [ ] **H1** Move the ladder so it doesn't cover the trolley painting.
- [ ] **H2** Stairs and armchair that read. The Penrose stairs: a flat, drawn image of the impossible staircase on a
      billboard that turns to face the camera (the illusion only works as a picture), with the climber drawn in it. A
      recognisable armchair. Blockers.
- [ ] **H4** "Open the purple door" / "Open the sky door"; anchored, non-overlapping labels; dismiss the toast on first move.
- [ ] **H5** Two or three `look()` asides, a wide establishing shot, the house behind the title.

## The Trolley Problem
- [ ] **T1** Standing on the track is its own ending: you didn't switch anything away from anyone, you just stood with
      them, and the trolley hits you and them.
- [ ] **T2** Each choice's two reflection lines play the first time that choice is made; a run-3 line.
- [ ] **T3** The lever line before the question; lines dropped once you've acted; a visible lever glow.
- [ ] **T6** Notice "pulled, then put it back".
- [ ] **T7** Hold the aftermath 3–4 s on a two-shot of you and what happened.

## Brain in a Vat
- [ ] **V1** The bench ending only after the edge; before that, sitting is a rest. Sit *on* the bench, not in it.
- [ ] **V2** The question always plays before you can step off.
- [ ] **V3** The narrator owns the edge ("in the real version there'd be no edge"); one Putnam beat at the machine; the
      journal question and Putnam to-do fixed.
- [ ] **V4** A stay option in each lab; layer-2 line variants; the machine aside again with a new line; show every fall;
      asides enabled from the start; the final pull-back through the stacked worlds; "step out" not "climb out".
- [ ] **V5** A real sunny afternoon (green grass, warm low light, a sun); cool labs. Narration: how warm the sun feels,
      how pleasant the afternoon is, how you might sit on the bench all day just feeling it. A local edge shimmer.
- [ ] **V6** Camera over the shoulder at the rim; blockers for trees and the cottage.

## Plato's Cave
- [ ] **C1** "Sit back down" only once you've turned to the fire or left the seat.
- [ ] **C2** The reveal in first person: firelight and your shadow on the wall as the cue, a gentle turn assist, more
      light, captions at the top in first person; enter through the door facing the wall.
- [ ] **C3** The ascent is compelled and hurts: someone pulls you up; resisted, washed-out first steps; the reflection
      first, then things, then the sun; the stay ending names the duty to go back.
- [ ] **C5** Outside: the horse, birds and jar that cast the shadows; a reflection in the pond; the most vivid place in
      room 1; warm bloom at the mouth; the stay ending framed in sunlight.
- [ ] **C6** Blockers (the parapet as a box, puppeteers, the mound), no white void past the exit, the mouth hidden while
      chained, "Go back down" enabled on arrival outside.

## Ship of Theseus
- [ ] **S1** Both endings the same shape: what this choice keeps, then the same open question.
- [ ] **S2** Board each ship at its own gangplank, with a walk aboard.
- [ ] **S4** Two parts replaced per trip; the narration says the ship is getting old and has to be repaired.

## The hall
- [ ] **HL1** The ceiling table, the holed door and the Empire of Light window on screen; Time Transfixed and Golconda
      readable.
- [ ] **HL2** Spawn clear of "Climb down"; blockers where the props are; clear toasts on `goto`.

## Grandfather Paradox
- [ ] **GP1** Give the player a reason to act: "Is it possible to stop him? See if you can." He waits until you've
      heard it. Then every attempt fails for an ordinary reason: the gate, the signpost, standing in his way, telling him,
      and a gun that jams (it never fires).
- [ ] **GP2** The loop: up to three walks in one visit, each more pointed.
- [ ] **GP3** Reactions on time; count a block only when you stand still in his path; the summary from what you tried.
- [ ] **GP4** State both halves of the paradox; end on "in a sense"; fix the Lewis to-do and the notebook.

## Infinite Monkey Theorem
- [ ] **IM1** Make it clear the page on the lectern is the best found so far, out of every page every monkey has typed
      (keep the time scale).

## Simulation Argument
- [ ] **SA1** Pose the choice after the reveal; tie each ending to a horn of the argument; a "build none" ending; an
      ambiguous reveal.
- [ ] **SA2** Endings you can see: real darkness and the giant's lamp stuttering; the door opens onto the giant's desk.
- [ ] **SA3** The window spot, the teal inhabitant, the frog's size, and collision.

## Fermi Paradox
- [ ] **FP1** The beam, the moon and the frog's star in frame.
- [ ] **FP2** Keep listening by sitting in the chair (nights pass); both choices after a pause; a notebook paragraph on
      whether to send.
- [ ] **FP3** Rewrite `send_2` and the "maybes"; a longer time-lapse.
- [ ] **FP4** You stay in the lower third; a telescope on the hill to match the portal.

## Tragedy of the Commons
- [ ] **TC1** Neighbours add sheep on their own; restraint has its own ending; "Take a sheep back".
- [ ] **TC2** The bell only once the grass thins (an honest early ring otherwise); the agreement costs you a sheep first.
- [ ] **TC3** Your sheep and house in teal; a wool pile that grows.
- [ ] **TC4** The question after the first copy; a slower decline; a cooldown; hold the bare field; a gentle rewind.
- [ ] **TC5** "Four neighbours and you"; "a shared pasture, with no rules yet"; a fence blocker with a gate; sheep that
      spread out. Explain at the start that the grass is healthy because there are only a few sheep (feedback box).

## From the feedback box (`feedback.txt`)
- [x] Ship of Theseus: replace the mast, deck and sail too; a real voyage at the end.
- [ ] **Transplant:** an operating theatre you walk into, where you're asked to do it (nothing graphic); and a
      "Request the palliative care team" option in the ward: the patients are wheeled away, the visitor lives, an ending.
- [ ] **Monty Hall:** the big button in view; journal question: "Was the result surprising to you? Why does switching
      increase your odds of winning?"
- [ ] **Ring of Gyges:** the king beside his gold, and the queen: in Plato, Gyges seduces the queen and with her help
      kills the king and takes the throne. Put both in the palace (handled gently: the crown, a whisper to the queen).
- [ ] **Commons:** explain at the start why the pasture is healthy (see TC5).
