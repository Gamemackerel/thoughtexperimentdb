# Playtest feedback: consolidated improvement list

From the playtest swarm of 2026-09-25: 12 reviewer personas × 2 parts of the game (room 1 and the hall), plus two
pilots. Every item below was observed in play by at least one playtester; the raw reports with screenshots, times and
positions are in `game/playtest/raw/`. This list is written for the developer: each item says what's wrong, how to see
it, and what to change.

**How to read it**
- **Priority:** **P0** breaks the experience or misrepresents the philosophy, fix first · **P1** clearly hurts it ·
  **P2** polish or a good idea.
- **Seen by** counts how many independent playtesters reported it (of 12 per part), as a rough confidence and
  importance signal. Persona names: calm, wild (generic first-timers), bugs, polish, camera, world, drama, teacher,
  philosopher (phil), gamedesign (gd), vibes, streamer.
- Items are grouped **Global** (engine/shell, affects every vignette), then **per level**. Where a global fix also needs
  a per-vignette change, the vignette section says so.
- GAME.md rules are cited where the game breaks its own design (e.g. §5 "Never tell the player they were right or wrong").

---

## Global (engine, shell, cross-vignette)

### G1 · P0 · Endings one E-press from where you stand
Several endings are live the instant the player arrives, sitting on or next to the spawn, so a stray E/Space (or talking
to someone nearby) ends the vignette before the dilemma has been posed. The ending lines then answer a question the
player never had. Seen in Brain in a Vat (bench), Plato's Cave ("Sit back down" under you when the chains fall; "Sit under
the tree" on arrival outside), and the house (you respawn inside the portal's radius). *Seen by 12/12.*
- **Rule for every vignette:** an ending interaction is enabled only after the player has met the problem (seen the
  edge, turned to the fire, heard the question). Before that, the same object can be a harmless aside ("You sit a while.
  The sun is warm." and you can stand up).
- Prefer "do nothing" endings that happen by *not acting* over time, rather than a prompt at the spawn (gd).
- Ignore interaction input for ~0.8 s after a level loads or a phase changes, and swallow E presses held over from the
  previous phase (bugs, wild).
- Spawn returning players ~1 m outside the portal radius they came through (bugs, polish). See H3.

### G2 · P0 · Narration queue is out of step with the player
Lines are queued on timers and proximity and never cancelled, so setup lines arrive after the player has acted, choice
lines play after the choice ("You could stay up here… or go back down" after "You stay in the light", over the game-over
card), a location's lines play after you've left it ("It's too bright" once outside), and a vignette's lines play in
the house after you've left it with Esc. *Seen by 12/12.*
- Clear the voice queue whenever an ending starts (`ctx.gameOver` or the vignette's ending function) and on every level
  change (`goto` already calls `voice.stop()`, but the vignette's own async chains keep calling `say()` afterwards).
- Give every vignette coroutine an abort token (`level.disposed` / a phase check) tested after each `await ctx.wait()` /
  `await voice.say()`; stop running when the level is disposed or the phase has moved on. (Teacher saw
  `console.warn: missing line loose` in Ship of Theseus from the cave's still-running timeline; pilot-bugs saw Fermi's
  ending card appear in the house.)
- Let `voice.say(id, { when: () => bool })` drop a line whose moment has passed (checked when the line reaches the head of
  the queue): location lines when `where` changed, question lines when the question has been answered.
- Never show a caption on top of the game-over card (hide captions while `#over` is open).

### G3 · P0 · Speech bubbles get stuck on screen
Talking to someone again before their bubble expires freezes the old bubble half-faded in place for the rest of the
level: over the sea in the sailing ending, outside the cave in daylight, on the game-over card. Cause (`game/main.js`,
`ctx.speak`): the speaker's entry in `bubbles` is replaced with a new `key`, so `ui.label('speech-'+oldKey)` is never
updated or hidden again; expired bubbles are also deleted without setting their label to 0. *Seen by 10/12.*
- In `speak()`, if the target already has a bubble, hide its label first (or reuse the key). On delete, call
  `ui.label('speech-'+key, 0, …)`. Clear all bubbles on phase changes that move the camera far away, and on `gameOver`.
- Also hide a bubble when its speaker is off-screen, and stop a second Talk opening while a bubble is showing (wild).

### G4 · P1 · Overlapping prompts pick the wrong (sometimes irreversible) action
The nearest interactable wins, so small curiosities and big decisions collide: "Board the ship of new planks" beats
"Talk" to the shipwright (ends the vignette), "Tell them" swallows the prisoners' "Talk", the two boarding prompts are
1.8 m apart so the old ship is nearly unreachable, "Climb the ladder" beats the sky door, and the painting beats the
nearer journal. *Seen by 11/12.*
- Resolve ties by facing direction (the object in front of the player) before distance; give ending/portal actions a
  lower priority than asides when both are in range; shrink radii where two are close.
- Never put two irreversible actions within each other's radius; separate them physically (per-vignette items below).
- Hide an object's label while its own prompt is showing; keep prompts off the player's head and inside a screen-safe
  margin; stack speech bubbles above prompts (polish, camera).

### G5 · P1 · The notebook doesn't pause the game, and it still says "this short film"
With `N` open the scene keeps running (the trolley commits behind the page), W still moves you and E still triggers
prompts you can't see. The trolley and vat notebooks open with "This short film walks through…", copy from the films.
*Seen by 10/12.*
- While the notebook is open: `player.enabled = false`, ignore interact input, and pause `level.update` and the voice
  queue (the same `busy` idea `goto` uses).
- Rewrite the notebook intros for the game ("This scene…"), and link the film separately. Map what the player did to the
  literature ("The lever: Thomson's bystander (1976/85). The third track: Thomson 2008.") (teacher, phil).
- Style: curly quotes and italic titles throughout, and link text instead of raw URLs (vibes, gd).

### G6 · P1 · The journal keeps only the latest ending and one answer
Reaching a second ending overwrites the first; an answer written for one ending ends up labelled with another; editing
the answer re-stamps the date; Play again pre-fills the old answer. For a game about changing your mind, the change is
lost. *Seen by 9/12.*
- Store every ending reached per vignette (with the date first reached) and show them: "2 of 2 endings" as pips, with
  unfound endings blank so nothing is spoiled; also show the pips on the portal label in the house (gd).
- Store each answer with the ending it was written after (a small history per vignette). On replay, start with an empty
  box and show the previous answer above it for comparison (teacher).
- Keep `at` as the ending date; add `editedAt` for edits (bugs).
- Idea: a "Copy / print my journal" button (teacher).

### G7 · P1 · The five-beat template only exists in the Trolley
Only the trolley has consequence → rewind → reflection → replay acknowledgement → twist and an in-world way home.
Brain in a Vat, the Cave and Ship end on the first commit, never acknowledge a second, different choice on replay
(GAME.md §3 "Replay: the narrator acknowledges whether you chose the same or differently"), and have no way home except
Esc or the card. *Seen by 7/12 (gd, phil, calm, drama, teacher, streamer, wild).*
- Minimum for every vignette: one replay line that notices same vs different ("Last time you went with the ship. This
  time, the wood.") and an in-world exit. Or change what GAME.md promises.

### G8 · P1 · Replays cost too much
Play again replays the whole setup: the trolley's twist has to be re-earned (~55 s), the cave's 22 s chained intro plays
in full, and Ship makes you carry six planks again (~50–90 s). Reaching every ending is a chore. *Seen by 8/12.*
- On Play again, skip what the player has already seen: start the trolley with the third track present once the twist
  has been seen; shorten the cave's chained intro; start Ship at the two-ships choice ("Back at the dock. Two ships.").

### G9 · P1 · Collision is mostly missing, and the steering jams
Furniture, trees, posts and stacks are ghost geometry (the house has no furniture collision at all), you can stand inside
the Penrose stairs, desk, ladder or coat stand, and tap-to-walk walks in place against small blockers when the target is
behind them. *Seen by 6/12 (polish, world, calm, wild, streamer, phil).*
- Add circle/box blockers for trunks (r≈0.4), posts, stacks and furniture; use box blockers for long objects (a circle
  per object leaves gaps).
- When a tap target is inside or behind a blocker, snap it to the nearest free point; stop the walk cycle after ~1 s with
  no progress; clear `player.target` when blocked (pilot-calm saw the player push into the lever for 60+ s).
- Fade (dither) objects that come between the camera and the player (stairs, cottage, cave mound, trees, fisherman).

### G10 · P1 · Captions and prompts cover the player at key moments
The framer often puts the player in the bottom band where the caption sits, so captions hide the figure (vat edge, cave
outside, pond, stay ending, self-sacrifice ending), and long captions wrap into two separate pills that read like two
speakers. *Seen by 7/12.*
- Keep the player above the caption band (bias every framer so the player stays in the middle or lower third, above ~80%
  of the screen height).
- Render a caption as one block (`box-decoration-break: clone` or one rounded box, `text-wrap: balance`, a slightly wider
  max-width). In first person, put captions at the top or make them smaller and translucent (camera, vibes).

### G11 · P1 · Phone portrait isn't framed for
At 390×844 the framers fit the scene's width, so the trolley's choice is a thin band with ~10–15 px people, the room is a
strip with empty top and bottom, labels keep desktop size and cover the portals, the cave's first-person view shows one
shadow, prompts still show an "E" key cap on touch, and there's no way to leave a vignette on touch before the frame
appears. *Seen by 4/12 (polish, camera, vibes, streamer).*
- For aspect < 1: rotate the camera so the main axis runs top-to-bottom, set a minimum player size (~8% of frame height)
  and let less important targets crop; widen the horizontal FOV in first person.
- Scale labels with the viewport (`clamp(12px, 3.2vw, 20px)`); show "Tap" (or a hand) instead of "E" on touch; add a
  small persistent "leave" button for touch.

### G12 · P1 · Web fonts: the UI depends on Mac system fonts
`--serif: "Iowan Old Style", "Palatino", Georgia` and `--sans: "Avenir Next", "Helvetica Neue", …` in
`engine/style.css`: on Windows/Linux the title renders in a Times-like serif and the UI in Arial. Only Caveat is loaded.
*Seen by vibes (confirmed in the CSS).*
- Load a real pair from Google Fonts or self-host (e.g. EB Garamond / Cormorant + Inter / DM Sans).
- Reduce the number of text styles (captions, toasts, labels, bubbles, notebook, game-over card) to one narration voice
  and three type treatments; `resize: none` on the card's textareas (vibes).

### G13 · P2 · Smaller shell items
- Esc opens the browser's native `confirm()`; use an in-game styled pill. On the game-over card, Esc should act as
  "Back to the house" without asking (calm, polish, bugs).
- Esc accepted during the arrival transition is ignored (streamer: had to press it twice in the cave). Honour it, or don't
  show the dialog until the level has loaded.
- "GAME OVER" reads as a loss in a game with no fail states; use "The end" or the vignette's name as the kicker (gd).
- Clear prompts and labels on level unload (camera saw a stale "…ck through the frame" pill during the trolley exit).
- Hide all labels and prompts when a portal transition starts (vibes).
- The frog appears at arrival in Brain in a Vat and big in the foreground in Ship; GAME.md wants it during the choice,
  mid-ground (wild, gd, camera).
- Transitions: only the painting has a real entrance and nothing has a matching exit. Give each portal its own entry
  (pages of the book, darkness through the purple door, painted sky through the sky door) and a reverse exit (pull back
  out of the painting) (vibes, camera).
- Idea: an optional, local "what others chose on this computer" tally on the game-over card (teacher).

---

## House (the first room)

### H1 · P1 · The trolley painting (the first portal) is hidden behind the ladder
From the spawn and at the painting, the rope ladder cuts the painting and the player in half, the ceiling hatch covers
its top, the "Up to the hall" label sits on it, and on return you land behind the ladder. *Seen by 9/12.*
- Move the ladder and hatch a wall bay to the right (towards the long-legged table), or hang the painting further left;
  move the painting's return spawn to ~(0, -4), facing into the room.

### H2 · P1 · The Escher/Dalí set pieces don't read, and have no collision
The Penrose staircase reads as a ring of cardboard boxes from the house camera (treads and risers too close in value),
the player can walk into and disappear behind it, and the floating armchair reads as a red box stuck to the painting's
corner. *Seen by 6/12 (world, vibes, polish, camera, wild, calm).*
- Staircase: thinner, wider treads with strong dark risers (Escher's black/white step edge), a railing, a placement
  seen more side-on, a climber colour that pops; a collider for its footprint.
- Armchair: recognisable features (legs up, arms, cushion), floating clear of the painting with a slow bob and a soft
  floor shadow.
- Add blockers for the desk, lectern, ladder foot, coat stand and clock-table legs (see G9).

### H3 · P1 · Returning puts you inside the portal you used
You respawn within the trigger radius of the portal you came back through, so one E sends you straight back in. *Seen by
bugs, polish.*
- Spawn ~1 m outside the radius, facing into the room (see G1).

### H4 · P2 · Prompts and labels
- Both doors say "Open the door" (purple door → cave, sky door → ship): use "Open the purple door" / "Open the sky door"
  (bugs, wild, streamer, gd).
- Labels overlap each other and the prompts ("Your journal" on "Step into the painting", "Plato's Cave" on "Brain in a
  Vat"), and the "Ship of Theseus" label floats in mid-air near a door seen edge-on. Anchor labels above their objects,
  turn the sky door ~30° towards the camera, offset near-by labels (calm, gd, camera).
- At spawn only two labels show, nudging first-timers upstairs; show all four room-1 labels faintly from spawn (calm).
- Dismiss the opening toast on first movement; it covers the Trolley label (polish).

### H5 · P2 · Make the hub a place, not a menu
- The house has no asides: add 2–3 `look()` lines (the floor window: "Sky, all the way down."; the endless climber: "He's
  nearly at the top. He has been for a while."; a melting clock), and a little reaction when you step on the window
  (world, wild).
- Portals could remember what happened inside (the painting gains the third track after you've seen it; the book's page
  changes) instead of only a ✓; completed portals should glow as GAME.md says (world, vibes).
- On desktop the camera is so tight you never see that the room floats in the sky (the phone framing shows it well):
  open on a wide establishing shot and ease in (vibes).
- The title screen is text on cream; show the house behind it (vibes).

---

## The Trolley Problem (`trolley-problem`)

### T1 · P0 · The trolley passes through the player standing on the track
Stand on the main or side track and the trolley drives through you while the workers beside you fly; the narrator then
says "You left the lever alone." It's the first thing a player (and chat) tries, and it contradicts the vignette's own
closing line ("someone is standing on the track"). *Seen by 11/12.*
- Best: honour it. Standing on the committed route leads to the "chose yourself" ending (you're knocked flying like the
  others, then `self_end`, with its own line, e.g. "You stood with them."). This gives the self-sacrifice option to people
  who find it without the twist.
- At least: make the track bed non-walkable during `slow`/`go` with a gentle nudge ("You step back off the rails.").
- Keep the player in the framer's points during that consequence (the camera loses them).

### T2 · P0 · The key reflection on pulling is lost on replays
From run 2 on, `again_same`/`again_diff` replaces the second reflection line (`afterRun`, ~line 198). A player who waits
on run 1 and pulls on run 2 (the natural order) never hears "But the one on the side track was never in danger, until
you moved the trolley." So the doing/allowing asymmetry, the heart of the problem, depends on play order, and the
do-nothing choice is challenged twice while pulling goes unchallenged. *Seen by 7/12 (pilot-calm, drama, phil, teacher,
gd, calm, bugs).*
- Play `<choice>_1` + `<choice>_2` the first time each choice is made, then the again-line (or fold it in: "This time you
  pulled. The one was never in danger, until you did.").
- `again_diff` repeats word for word on runs 2 and 3; write a run-3 variant (drama).

### T3 · P1 · The setup lines don't follow what the player knows or does
"Should you pull it?" plays on a timer even if the lever was never mentioned (its line only fires by proximity), and if
the player pulls early, "Five people…", "just one" and "Should you pull it?" still play after the choice. *Seen by 9/12.*
- Put the lever line in the timed sequence before `ask` (it can still fire early on proximity); or say "Should you pull
  the lever?". Hold the lever's prompt until the question has played, or drop `ask` once the lever has been touched.
- Make "five"/"one" fire where the player can see them ("Further down the track, five people…" as the fallback).
- Make the lever glow in `slow`, as GAME.md says; nobody could see a glow.

### T4 · P1 · Leading lines on the cards
- The three-run closing line "Whatever you choose, someone is standing on the track. You only decide who." and card
  "Nobody could stop the trolley. You only decided where it went." take a side on doing vs allowing (§5), and contradict
  the self-lever twist (you *could* stop it). Let it cut both ways: "Every time, someone was on the track. Whether
  leaving it alone counts as choosing is the part nobody agrees on." If the twist was seen and declined, acknowledge it:
  "You could have stood there yourself. You didn't." (phil, drama, calm).
- The self-sacrifice card "The trolley only needed someone on the track" is false for the switch case (the one isn't
  *needed*; that's what separates switch from footbridge). Use e.g. "Someone had to be in the way. You made sure it was
  you." Keep some doubt so martyrdom doesn't read as the right answer: "Nobody could have asked this of you. Could you
  have asked it of the one?" (phil, drama, teacher).
- "The five walk away. So does the one." while they're all still standing on the track: have them walk off, or reword
  (pilot-calm).

### T5 · P1 · The journal question asks about a footbridge the game never shows
"…wouldn't push someone off a bridge…" arrives out of nowhere (and after the self ending it fits poorly). It's the most
thought-provoking question in the game, about a case the player has to imagine. *Seen by 9/12.*
- Best (idea, the most requested addition): a playable footbridge variant after the third run: a large stranger on a
  bridge over the main line, a Push prompt you can refuse, same gentle physics; then ask the question about the
  difference the player felt (streamer: "the most streamable addition in the room").
- At least: set it up in the final line or on the card ("There's a version with a bridge…"), and make the question
  ending-aware (after "You chose yourself": Thomson 2008's "If you wouldn't take the hit yourself, may you make someone
  else take it?").

### T6 · P1 · Agency between runs
- "Go again, or step back through the frame." while the frame is disabled, and the next run starts by itself ~4 s later,
  so "You ran it 3 times" feels done to you. Start the next run when the player moves towards a lever or the track (or
  after ≥15 s), enable the frame when the line plays, or reword: "The trolley will come again. Or step back through the
  frame." (pilot-calm, drama, gd, calm, teacher).
- Nothing warns that the runs are limited; the card after run 3 feels like a cut. Add "One last time." or three run
  markers (gd).
- Hesitation isn't acknowledged: pull then put back is narrated as "You left the lever alone." (false); add "You moved
  it, then moved it back." (drama, teacher). Standing by your own lever and not pulling it is never noticed; add "You went
  to your own lever. You didn't pull it." (pilot-calm).
- On runs 2+ the slow phase is ~18 s but the self-lever is ~25 m away, so you can't reach it in time; keep the slow
  phase running while the player walks towards a lever (polish).
- Stepping through the frame mid-run skips the consequence; hold 3 s on the trolley and say "You walked away. It
  didn't." (teacher).
- The self-lever locks controls for ~14 s of creep with no way back; either let the player step off before the fork (more
  dramatic if they could and don't) or shorten it (gd).

### T7 · P1 · Camera: the chooser is never in the consequence
The chase camera follows the trolley; the player is out of frame for every consequence except the self ending, the five
are cropped at impact, and the aftermath lasts ~1.6 s. *Seen by camera, drama, wild, streamer.*
- Hold the aftermath 3–4 s, and end it on a two-shot of the player and what they caused before the rewind. Add the people
  at stake to the framer so they're never cropped. In the self ending, frame the landed player above the caption.

### T8 · P2 · Trolley polish
- Tap-to-walk jams on the row of five workers at ~(15.1, -0.5) (lost the whole choice window twice); let the steering
  route round the line (world).
- The painting promises a green hill and tunnel; you land on a beige plane. Match the arrival shot to the painting, add
  ground colour, a work site (shovels, sleepers, a hut) and buffer stops where the rails end in mid-field (world, vibes,
  polish, camera).
- "Look at the driver": show the slumped driver (a close-up or a head in the cab window) (world).
- Time slowing has no visual signature: a slight grade change and hanging dust motes during `slow` (vibes).
- Dust trail spheres read as pearls: vary size/opacity, fade and tint them (vibes).
- The lever is ~15 px on screen during arrival, and prompts cover the lever and figure at the moment of choice (calm,
  polish, streamer).
- Faceted low-poly trees clash with the smooth clay kit (vibes). See also V5.
- The in-world frame is a gold rectangle lying cropped at the edge; stand it upright and show the house through it
  (vibes).
- Replay knowledge: once the twist is seen, Play again should start with the third track (see G8).
- Notebook: say the third track *is* Thomson 2008; add the survey citation for "most people would pull"; journal to-do:
  Thomson named it in 1976 (phil).
- The run-3 "chose yourself" state: `S.runs` isn't incremented and `'self'` isn't pushed to `S.choices` (bugs).

---

## Brain in a Vat (`brain-in-a-vat`)

### V1 · P0 · The "You stayed" bench works from the first second
See G1. The bench is 3.5 m from the spawn, "Sit down" is enabled from t=0 and overlaps the "Look at the tree" aside; one
E ends the vignette with "You never found out whether the sun was real" before any doubt exists. *Seen by 12/12.*
- Enable the ending only after `edgeSeen` (or after `ask`); before that, sitting is a rest you can get up from. Move the
  bench away from the spawn, shrink its radius to ~1.4.
- Or make the stay ending passive: you sit, the flicker returns, a held silence, then the ending (gd).
- Give an early sit its own line if you keep it ("You never went looking.") (wild, drama).

### V2 · P0 · The central question gets cut
`ask` ("If none of this were real, how would you ever know?") is queued after `edge`; stepping off within ~3 s stops the
queue, so a decisive player never hears the question of the vignette. On layers 2–3, "Here, too, the edge flickers." is
cut after 0.3 s. *Seen by bugs, teacher, camera.*
- Keep "Step off the edge" disabled until `ask` has finished, or play `ask` during the fall / on landing.

### V3 · P1 · Philosophy: the deception is detectable, and Putnam is missing from play
- The world has a visible flickering edge you can step off, so the skeptic's scenario (indistinguishable from reality)
  plays as a red-pill escape; the question is asked while standing at the answer. Make the layer-0 edge seamless, or let
  the narrator own the move ("In the real version, there'd be no edge to find.") (phil).
- Putnam's reply (why this is its own thought experiment, not Descartes' demon) is in the notebook and journal but not in
  play. Add one quiet externalist beat, e.g. at the machine: "When you said 'tree' up there, did you mean this? Or the
  tree you've never touched?" (phil, teacher, drama).
- The nested labs drift towards the Simulation Argument; have the card name the actual point (you can't get an outside
  check), and distinguish the two in the notebook (phil).
- The journal question ("would it matter to you whether your world was real?") is the Experience Machine's question;
  ask the epistemic one ("Can you know right now that you're not a brain in a vat?") or add it as a second question
  (phil, teacher).
- Embodiment: you walk round the lab as the teal figure while "you" sit on the bench above. Acknowledge it ("Up there,
  someone who looks like you is still sitting on the bench.") or make it deliberate (phil, drama, calm).
- Journal to-do misstates Putnam: not "can't coherently say it" but "if you were one, the sentence 'I am a brain in a
  vat' would come out false"; notebook: add Harman 1973 (phil).

### V4 · P1 · The lab layers are a corridor
Layers 1 and 2 offer one verb (step off again) plus one aside that's used up on layer 1; layer 2 has ~20 s of nothing and
the same edge line; the third fall ends with no reveal. *Seen by drama, gd, teacher, wild, bugs.*
- Add a stay option in each lab (a stool by the machine: "You decided this one was the bottom. You can't check that
  either.") so "No way out" becomes a choice made at every layer.
- Make layer 2 strange in a new way (the machine labelled with your first world's words; the mug still warm), give
  `lab_edge` a layer-2 variant, keep the machine aside available with a different line.
- Show the second and third falls (reuse the layer-1 fall shot), and end with a long pull-back through the stacked
  worlds with the tiny figure visible (camera, streamer, drama).
- Enable the tree/window asides from the start: they're the reason to explore before the edge (gd).
- Final line: "However far you climb out…" but you step off and fall; use "step out" / "fall outward" (calm, drama).

### V5 · P1 · The "sunny afternoon" isn't on screen
Same beige disc and light as every other island: no grass, no sun, no warmth; the lab looks the same as the "fake"
world, which undercuts the reveal. *Seen by world, vibes, calm.*
- Layer 0: green grass, warm low key light, long soft shadows, a visible sun, a few birds/butterflies. Labs: cool, clinical
  grey-blue. On "You stayed", shift to golden hour and ease the camera in on the bench.
- The edge flicker is a full-screen stripe overlay (over the player too); make it local and diegetic (the rim de-rezzes,
  a scanline shimmer at the horizon), and visible at stream size (vibes, streamer, calm).
- Optional: reserve faceted low-poly trees for the simulated world so the look is a clue; add the tape reels the line
  mentions; sculpt the brain (vibes).
- A lab with traces of an absent keeper (cold mug, a notebook with a sketch of the tree) (world).

### V6 · P2 · Vat camera and collision
- At the near edge the player is at the bottom of the frame under the caption and prompt, and the edge itself is out of
  frame when "The world ends here" plays; swing the framer to look over the player's shoulder at the rim (camera, calm,
  wild, polish).
- A foreground tree hides the player; the cottage hides the player from behind; the head goes into the canopy at "Look at
  the tree"; the body sinks through the bench (camera, polish).
- The first frame after landing in the lab doesn't include the player (streamer).
- Only three blockers in layer 0 (cottage circle, bench, one tree); add trunk blockers and a box for the cottage (polish).
- In the lab, nothing points to its edge; a faint flicker ring visible from the spawn (calm).
- Idea: a `look()` on the jar ("You tap the glass. Somewhere, a sky ripples.") (wild).

---

## Plato's Cave (`platos-cave`)

### C1 · P0 · "Sit back down" is under you when the chains fall
See G1. The moment the chains loosen, the prompt at your own seat changes from "Talk" to "Sit back down" (invisible in
first person, since it's anchored under the camera), so an E meant for the neighbour, or a mashed E, ends the vignette
with "You turn back to the wall" although you never turned. On touch it's unreachable (you must tap an invisible prompt).
*Seen by 12/12.*
- Enable "Sit back down" only after the player has turned to face the fire (`voice.said.has('turn')` or yaw past ~90°) or
  moved off the seat; or make "keep watching" passive (not turning round for ~30 s after the chains fall).
- In first person, render prompts whose anchor is behind the camera as a fixed pill at bottom-centre.
- Add a variant line for a player who never looked behind ("You never looked round. The shapes are all there is.").

### C2 · P0 · The reveal is lost in first person
After the chains fall nothing invites you to turn (turning is 2.1 rad/s, so a 3 s hold is a full circle); "Behind you, a
fire…" fires on position (z>0), often while facing a puppeteer's face or a black ceiling (~75% of the frame), with the fire
under the caption; the cave is near-black on most headings; "A path leads up, towards a light" plays with the light out of
frame. Entering through the purple door also opens with a third-person shot of the fire and carriers, spoiling the reveal.
*Seen by 9/12.*
- After ~8 s free and still facing the wall: firelight flickers on the wall and your own shadow appears on it (the
  allegory's natural cue), or a crackle from behind.
- Trigger "turn" on yaw towards the fire, not position; when it fires, ease pitch down 10–15° and yaw-assist towards the
  fire and cutouts for ~2 s; when "climb" fires, yaw-assist towards the mouth. Slow keyboard yaw to ~1.2 rad/s.
- Raise ambient/bounce light (walls and a ceiling catching firelight); a shaft of daylight on the floor leading to the
  mouth; captions at the top in first person.
- Door entry: start in first person facing the wall (as Play again does), or open on black.
- The camera's reveal angle from the mouth on the way back (fire, carriers, shadows, prisoners in one frame) is the best
  cave shot; consider reusing it (camera).

### C3 · P1 · Philosophy: the ascent is free and painless, and the return has no duty
- Plato's prisoner is compelled to stand and turn, it hurts, he'd rather go back, and he's dragged up the slope; here the
  chains "come loose" on a timer and you stroll out. The game's own notebook says he "is dragged up into the sunlight".
  Have someone pull you to your feet; make the first steps to the fire and the mouth resisted (slowed, white-out): "It
  hurts to look. The wall was easier." (phil, drama).
- The ascent skips the stages (shadows → reflections → things → sun). Make the first seconds outside washed out, let the
  pond be the first thing you see clearly, and hold "the sun that lights them all" until the player has looked at the pond
  or a tree (phil, teacher, drama).
- "Stay in the light" is offered as a neutral happy ending; for Plato the one who has seen the sun *must* go back, and
  going back is dangerous. Add to the stay ending: "The others are still down there. You're the only one who knows the
  way." Let the prisoners' hostility go one notch further than laughter (phil).
- Journal question presumes you turned round and came out; vary it by ending (after "You kept watching": "Is there
  something you'd rather not look at too closely? Why?") (teacher, phil, drama, wild).
- Notebook: say it's an allegory (the third of Sun, Line, Cave); note 517a (phil).

### C4 · P1 · The return is only narrated
"Tell them" is one E press; "They laugh" is in the voice only; the prisoners don't react. *Seen by drama, gd, world,
streamer.*
- Have the prisoners turn their heads and answer with bubbles of ridicule as you pass (the `BACK[]` talk lines exist),
  delay the card until they've turned back to the wall.
- Keep the prisoners talkable once you're free ("Sit down, you're blocking the bird."); give each puppeteer a line
  (world, gd).
- After going back down, the way up is a silent dead end and "Sit back down" is disabled; allow sitting back down with
  its own ending ("You came back, and said nothing.") and/or one line at the mouth ("The light is too far now.") (bugs,
  wild, teacher).
- "Tell them" (r 3.6) overlaps the prisoners' Talk (r 3.2); prefer Talk, or disable Talk once returned (teacher, polish).

### C5 · P1 · Outside: the real things behind the shadows aren't there
The cutouts are a tree, a bird, a jar and a horse ("Shh. The horse is next."), but outside there's no horse, no bird, no
jar; the pond reflects nothing under "Your reflection… this one looks back"; the sun disc and the shadows disagree; the
"real" world is paler than the cave. *Seen by world, vibes, camera, streamer, wild.*
- Put a grazing horse, birds crossing the sky and a jar by the pond outside (a `look()` on the horse: "It's much bigger
  than its shadow.").
- A real pond reflection (`Reflector` or a mirrored, darkened, rippled copy of the figure and frog).
- Make the outside the most vivid place in room 1 (green grass, blue sky, crisp saturated colour, a strong sun with real
  shadows pointing away from the sun disc); fade from white to full colour over a few seconds.
- At the mouth, "too bright to look at" should ramp to warm near-white bloom, not muddy grey (camera).
- In the "stay in the light" ending, frame the seated figure in sunlight, not in the tree's shade (camera, vibes).

### C6 · P2 · Cave polish
- Past the exit trigger at ~(20.3, 7.0) you can stand in a flat white screen with no cue; make the whole mouth disc
  trigger the exit (calm).
- The parapet is blocked by four circles with walk-through gaps at x≈0, ±4, ±8; use a box blocker plus end caps, and add
  puppeteer blockers (polish).
- Walking behind the outside mound hides the player; enlarge the arch blocker (polish).
- Walking face-first into the shadow wall fills the screen with brown; stop ~2.5 m short (polish).
- While chained, the bright mouth is visible at the edge of the yaw limit ("What's behind us? Nothing. Just rock."):
  tighten `yawLimit` or block the sightline (wild, vibes).
- The cave has no ceiling and the wall's edges show; hard cut-out shadows from a five-cone fire; banding on the wall
  gradient: add a ceiling, soft wobbling shadows, a real fire with glow and embers, dithering (vibes).
- Tapping the bright opening doesn't walk you there (not ground) (calm).
- "Go back down" only appears after the choose line; enable it on arrival outside (bugs).
- Shorten the 22 s chained intro on replay, or let the player loosen the chains (gd). Have one prisoner speak unprompted
  while chained so players learn they can talk (drama).

---

## Ship of Theseus (`ship-of-theseus`)

### S1 · P0 · The endings take a side
New ship: "Its parts changed. Its story didn't." / card "…it never stopped being the ship that sailed" (a verdict, and
it never sailed in this scene). Old wood: "But is the ship?" / "Whether that makes it the same ship is the question" (a
doubt). The game endorses continuity and questions the other choice, against §5. *Seen by 9/12.*
- Give both endings the same shape: what this choice holds on to, then the same open question. E.g. new: "You chose the
  ship that kept going. Not one plank of it was there at the start. Is that enough?"; old: "You chose the original wood.
  Every plank that ever sailed. But was it a ship, all that time in a pile?" Cards end on the same question.

### S2 · P0 · Boarding by accident, and the old ship is nearly unreachable
The two boarding prompts are 1.8 m apart on the pier centre line (r 2.4 each), so the middle of the pier always offers
"Board the ship of new planks"; the old ship needs you to hug the far edge, and "Board the ship of new planks" beats
"Talk" to the shipwright, so an E meant for her ends the vignette. *Seen by 11/12.*
- Put each boarding point at its own ship's gangplank on its side of the pier (z ≈ ±2.2–2.5), radius ~1.2, prompt over
  its own hull; or require walking onto the ship (a trigger), which is also more "act, don't answer".
- Board with a scripted walk aboard rather than a teleport (camera).

### S3 · P1 · No "do nothing", no sorites, no consequence
Standing at the choice for 45–80 s does nothing; you must replace all six planks before any choice; after boarding, ~7 s
of sailing then the card; no replay acknowledgement or twist. *Seen by 8/12.*
- After ~30–40 s idle at the choice: both ships sail off without you ("Two ships leave the harbour. Both of them say
  they're the ship of Theseus.") or you walk away ("You didn't pick. Maybe 'the same ship' was never one question.") as a
  third ending: closest to the real puzzle (both/neither/it depends).
- Let the player call it a different ship at any point during the swaps, or have the shipwright ask "Still the same?" at
  4/6 and let the next action count (teacher, drama: "Half old, half new. Which half is the ship?").
- After the choice, let the other ship do something (the builder sails it the other way, both reach the same harbour
  with the same name); keep the other ship visible in the last shot so the question stays on screen (drama, camera).
- On replay: "Last time you went with the ship. This time, the wood. They can't both be the one." (phil).
- Phil's pedantry: the repaired ship keeps its original keel, mast and sail, and the rebuilt one gets a mast from
  nowhere; make the mast/keel part of the swaps or have the rebuilt hull come up bare.

### S4 · P1 · The plank loop is a chore
Six identical ~8 s carry trips; only swaps 1, 3 and 6 have a line; Play again repeats all six. *Seen by 7/12.*
- Speed later swaps (carry two, or the old planks fly out on their own after the third), give swaps 2/4/5 a small beat
  (the fisherman comments, a plank creaks, the shipwright picks up the old plank), and start replays at the choice (G8).
- Make each swap visible: a 1 s push towards the hull and a warm highlight on the new plank (camera); old wood that looks
  old (weathered, cracked, greenish at the waterline) vs clean new pine (vibes).
- Show the shipwright from the start, carrying each old plank off (world).

### S5 · P1 · The ship doesn't read as a ship
Loose bent strips with gaps, a flat slab, stepped open plank ends at bow and stern; it reads as a sled or basket, and
hulls pass through the dock when they sail. *Seen by vibes, streamer, camera, polish.*
- A small clay Greek boat whose six planks are continuous strakes meeting at a stem and sternpost (a painted eye on the
  bow, a steering oar); swapping a strake changes only its material ("same shape, different stuff"). Hide the cradle when
  sailing; start the sail path clear of the dock.
- Animated low-amplitude water, foam at the pilings, a wake; opaque sails (the alpha-hashed sail and shadows speckle).

### S6 · P2 · Ship polish
- Narration names the experiment ("The ship of Theseus.", "Which one is the ship of Theseus?"), against pillar 4:
  "An old ship. Its wood is getting old." / "Two ships. Which one is the real one?" (calm, drama, teacher, gd, streamer,
  phil).
- A bollard at (20.5, 1.2) traps tap-to-walk at (21.1, 1.4) (only W frees you); the plank stack at (6.9, 1.4) blocks the
  centre line; posts have no blockers and the walkable strip reaches them; the stack's blocker is a 0.35 m circle for a
  1.5 m stack: shrink the walkable strip to |z| < 1.1, use box blockers, clear a lane (calm, streamer, polish, phil).
- The player stands behind the fisherman from the camera's view when talking to him; put his talk spot on the camera side
  (polish).
- The pier's ramp z-fights with the sand, and the pier meets the beach in a jagged step (polish, calm, vibes).
- The world: a boatshed or a few houses, gulls, a horizon to sail towards; build the dock from mixed old and new boards so
  the fisherman's joke is visible before he says it (world).
- "Two ships. Which one…" plays with the old ship cropped under the caption and the new ship's mast cut off; pull back to
  a two-shot with both hulls and the player (camera).

---

## Keep (don't lose these)

Mentioned again and again as the best of room 1:
- **Trolley:** the slowed workers' speech bubbles ("Theeeyyy aaalwaaayyys puuut meee ooon myyy ooown…"), the fainted
  driver aside (it quietly makes it Thomson's bystander case), slow motion and the long creep, "Put the lever back", the
  toy-like knock and the VHS rewind, the third track and "Would you? If not, is it fair to send it to someone else?"
  (Thomson 2008 in two sentences), `pulled_2`, the frame as a way home, the colour-coded tracks.
- **Brain in a Vat:** the fall, the cut to "you" still on the bench, the brain with your world floating above it, the
  recursion tower (the best single image in room 1); the asides ("Every leaf exactly where you'd expect it", "you've
  never seen anyone go in", "Somewhere in here is that tree"); "You can only ever check the world with the world."
- **Plato's Cave:** first person with a limited turn while chained; the prisoners' prediction talk ("I've counted. The
  bird always comes after the jar.", "Shh. The horse is next."); the whiteout into daylight; "Your reflection. Another
  kind of shadow, but this one looks back."; the dark-adapted return; "They laugh. The climb has ruined your eyes."
- **Ship of Theseus:** the fisherman ("Forty years… they have replaced every board of it since… my grandad's rod. New
  line, new reel, new handle. Still his rod, though."), the shipwright ("Seemed a shame to burn them."), the old ship
  rising beside the dock.
- **House and shell:** the painting push-in, spawning beside the portal you used, the ✓ and the glowing journal, the
  handwritten journal page with its notes-to-self to-do lists, the title card and "Look around" onboarding, the
  game-over card over a frozen frame, the accurate notebooks (every citation checked by phil).

## Not included (harness artifacts)

- "The first frame after entering the house is an abstract close-up" (pilot-calm): the harness screenshotted during the
  0.6 s fade-in, before the game had placed the camera. Fixed in the harness; not a game issue.
- "(moving)" shown while standing still, and the `use` command walking to the wrong one of two overlapping prompts:
  harness issues (the second is also a real game issue, G4/S2).
- `net::ERR_ABORTED` on a voice mp3: the harness mutes audio.
