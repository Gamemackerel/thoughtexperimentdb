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
- The hall has the same pattern: grandfather's "Go home" is the first prompt at the spawn, Fermi's ending "Keep
  listening" sits on the same prompt as "Listen", the commons bell ends the vignette before there's a problem, and the
  hall spawn is inside "Climb down" (GP5, FP2, TC2, HL2).

### G2 · P0 · Narration queue is out of step with the player
Lines are queued on timers and proximity and never cancelled, so setup lines arrive after the player has acted, choice
lines play after the choice ("You could stay up here… or go back down" after "You stay in the light", over the game-over
card), a location's lines play after you've left it ("It's too bright" once outside), and a vignette's lines play in
the house after you've left it with Esc. *Seen by 12/12.*
- **Root cause** (wild-hall, confirmed in `game/core/voice.js`): `Voice.stop()` *resolves* the promises of queued lines,
  so every `await voice.say(a); await voice.say(b)` chain in a vignette carries on after `stop()` and after the level is
  disposed (using the old manifest until the new one loads). Resolve them with a "cancelled" value (or reject) and have
  chains bail out.
- **Blocker consequence** (bugs-hall, pilot-bugs; 100% reproducible): press Esc within ~1 s of an ending action in
  Simulation ("Switch them off") or Fermi ("Keep listening"/"Send") and that vignette's narration plays in the first room,
  then its game-over card opens *over the first room* with journal question "-" and controls locked; `save.complete`
  marks the portal done and `ted.journal` gains a bogus `"house"` entry; "Play again" reloads the house. Every vignette
  whose ending is an awaited chain has the same hole (monkeys' `found`/`leave_end`, grandfather's `end()`).
- Give every level a generation token (`ctx.alive()` / `level.disposed`); make `ctx.wait` and `voice.say` no-op (or reject)
  once the level is disposed; make `ctx.gameOver`, `save.complete` and `journal.write` ignore calls from a level that is
  no longer current; drop any stray `house` key from saved journals on load. (Teacher saw `console.warn: missing line
  loose` in Ship of Theseus from the cave's still-running timeline.)
- Clear the voice queue whenever an ending starts (`ctx.gameOver` or the vignette's ending function) and on every level
  change.
- **Reaction lines must land on their action.** The single FIFO queue puts "He laughs…" 10–15 s after you told him, and
  "He doesn't even look at the sign" after the ending (grandfather); "A word. Just one" over a page showing two
  (monkeys); "The grass is thick." over bare dirt (commons). Give lines a priority: reaction/consequence lines interrupt
  or jump ahead of descriptive lines, and descriptive lines carry a `maxAge` so they're dropped if they can't start
  within ~3 s of being triggered (wild-hall, camera-hall, streamer-hall, teacher-hall, gd-hall).
- Let `voice.say(id, { when: () => bool })` drop a line whose moment has passed (checked when the line reaches the head of
  the queue): location lines when `where` changed, question lines when the question has been answered.
- Never show a caption on top of the game-over card (hide captions while `#over` is open).

### G3 · P0 · Speech bubbles get stuck on screen
Talking to someone again before their bubble expires freezes the old bubble half-faded in place for the rest of the
level: over the sea in the sailing ending, outside the cave in daylight, on the game-over card. Cause (`game/main.js`,
`ctx.speak`): the speaker's entry in `bubbles` is replaced with a new `key`, so `ui.label('speech-'+oldKey)` is never
updated or hidden again; expired bubbles are also deleted without setting their label to 0. *Seen by 10/12 in room 1
and 8/11 in the hall (the apple-faced gentleman's bubbles stay at full opacity 28 m away).*
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

### G14 · P0 · Leaving a hall vignette drops you in the first room
Both "Back to the house" on the game-over card and Esc hard-code `goto('house')` (`game/main.js` ~l.121 and ~l.181), so
every hall vignette returns you to the first room's default spawn (0, 5.5) and costs a ladder climb and a walk back down
the hall; the hall's per-portal `ctx.from` spawns (`hall.js` ~l.270) are dead code. Esc *in the hall* also asks "Leave
this vignette and return to the house?". *Seen by 10/10 hall playtesters so far.*
- Give each level a `home` (room-1 vignettes → `house`, hall vignettes → `hall`) and use it in both handlers with
  `ctx.from` set to the vignette id; label the button "Back to the hall" there.
- Don't treat hub rooms (`house`, `hall`) as vignettes in the Esc handler: no confirm, or "Climb down to the first room?".

### G15 · P1 · One run straight to the card: the hall has no second pass at all
None of the five hall vignettes has consequence → rewind → a replay that remembers you → twist; each is a single
~20–90 s run to the game-over card, and Play again restarts cold with identical lines (grandfather ~27 s, simulation
~50 s of repeated narration before the choice returns). *Seen by 10/10 hall playtesters.* This is G7 at its sharpest;
per-vignette suggestions are in each hall section.
- Build the loop once as a shared helper (`ctx.runs`, `voice.say('again_same' | 'again_diff')`, an in-scene rewind),
  then give each vignette at least one rewind pass and a replay line. For grandfather, the loop *is* the theory.

### G16 · P1 · House rules for affordances, exits and "doing nothing"
The rooms teach contradictory rules (gd-hall): prominent levers are silently disabled until a first step (monkeys: until
you read; Fermi: until you listen), exits are available from arrival (grandfather), after the question (monkeys), only
at the choice (simulation door) or never; doing nothing ends one scene and soft-locks another (commons, simulation
without "Run more worlds"). Write these into GAME.md and apply them everywhere:
1. Every object that looks usable shows a prompt from arrival, even if it only says "Not yet" or gives a line.
2. Every vignette has a visible way home from arrival.
3. Doing nothing always resolves within ~60 s of the question (a passive ending or a nudge).
4. A terminal action never sits on the same prompt anchor as a non-terminal one (Fermi's Listen → Keep listening).
- Also: `look()` asides are disabled whenever any narration is playing (`!ctx.voice.busy`, `extras.js` ~l.24), so prompts
  blink away during lines and a second aside is silently dropped; queue the aside's line instead (bugs-hall, phil-hall,
  camera-hall, streamer-hall).
- Tapping an interactable's mesh should walk you to its interaction point and show its prompt (`interact.js`), not to
  the nearest ground behind it (gd-hall: tapping the little world walked the player behind the desk).

### G17 · P1 · Hold the last image, and show what the narration says
- The game-over card arrives 0–5 s after the last line and covers the final image (grandparents meeting, bare pasture,
  grass recovering, the sailing ship). Hold the final image ≥4 s after the last caption before the card (vibes-hall,
  drama-hall, streamer-hall).
- Across the game the narration announces images the scene doesn't show: the wind at the gate, "he laughs", a million
  years passing, "above you, the lights flicker", the message leaving the dish, the moon, the pond reflection, the sun in
  "the only sun you have". Show, then say (details per vignette) (vibes, camera, world, streamer).

### G18 · P2 · Colour roles and labels
- Teal is "you", but it turns up on props: the grandfather station roof, the study door and monitor, a teal inhabitant
  inside the simulation dome that reads as the player levitating; your own commons house is orange. Keep teal for the
  player (and things that are yours: your house roof, a raddle mark on your sheep) (vibes-hall, camera-hall).
- Portal labels use the textbook names ("Tragedy of the Commons" gives the ending away before you enter) and clash with
  the plain voice; consider plain teasers ("A shared field") with the proper name in the notebook and journal (drama-hall).
- Label and prompt disagree ("Up to the hall" / "Climb the ladder"; the Fermi portal is a telescope but the scene is a
  radio dish) (phil-hall, gd-hall, streamer-hall, vibes-hall).

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

## The hall (`hall`)

See G14 first: every exit from a hall vignette goes to the first room.

### HL1 · P1 · The best Magritte pieces are built but never on screen
The camera sits low and looks level at the back wall, so the upside-down dining table and chandelier (y≈9.5) only show
as candle stubs at the top edge, the door with the hole (left end wall, x≈-17.9) is off screen from everywhere, and the
Empire of Light window is cut off; in phone portrait the table finally appears but floats above the wall into the void.
*Seen by vibes, world, camera.*
- Lower the ceiling set to y≈6–7, or give the camera a look-up zone under the table (the ladder arrival is the natural
  moment: come up through the floor looking at the ceiling, then settle); move the holed door onto the back wall.
- *Time Transfixed* doesn't read: a black engine in a black hearth on the floor. Lighten the hearth (warm grey or cream
  marble), lift the engine to project out of the opening, and move the gentleman ~2 m left of it (vibes).
- *Golconda* reads as a poster: 2–3 depth layers of cut-out men at different depths, loosen the grid (vibes).
- The grandfather clock (first portal) is jammed into the Escher stairs; move it ~1.5 m left so it stands alone (vibes).
- In portrait, extend the sky wallpaper to a ceiling plane and clamp labels inside the viewport ("…nite Monkey Theorem ✓"
  runs off the edge) (vibes, camera).

### HL2 · P1 · Arrival, labels and bubbles
- Hall spawn (-13.5, 1.4) is inside the "Climb down" radius and behind the red curtain, with the "Down to the first
  room" label and the prompt stacked on the player's head: the first E sends you straight back down. Spawn ~1.5 m further
  in (x≈-12) (bugs, camera, vibes, wild, calm).
- The first room's toast is carried up the ladder (clear toasts in `goto`); climbing shows a frame of empty void first
  (hold the fade until the hall has rendered) (bugs, camera, world).
- Talk-spam on the apple-faced gentleman stacks bubbles that stay frozen at full opacity 28 m away (G3) (bugs, world,
  wild, vibes, calm, streamer, teacher).
- At the east and west ends the curtains hide the player; clamp the camera or the walkable area (wild, world).
- Portal labels far away render as grey semi-transparent pills that look disabled, and overlap the paintings; show only
  the nearest label or keep them opaque and anchored below the props (vibes). Tap-walk gets stuck behind the typewriter
  table (wild, world).
- Portals are small tabletop props on identical desks; give each a faint "come in" glow in its own language, and make
  completed portals glow (GAME.md promises it; `hall.js` ~l.307 only appends ✓) so the hall lights up as you play
  (vibes, calm).

### HL3 · P2 · Give the hall a voice
- The hall has no `look()` asides; only the gentleman talks. Add 2–3 one-liners (the pipe: "It isn't a pipe. It's a
  picture of one."; the mirror: "You lean closer. So does the back of your head.") (world, calm, streamer).
- Two of the gentleman's lines are near-verbatim Magritte quotes inside a no-quotes voice; keep one, credit it, and give
  the hall a notebook page (`N`) listing the works it quotes (The Son of Man, The Treachery of Images, Golconda, Time
  Transfixed, The Human Condition, Not to Be Reproduced, The Listening Room, Personal Values, The False Mirror). Render
  stage directions ("The apple stays exactly in front of his face.") differently from speech (phil, world).
- Move the gentleman near the ladder hatch: "Everything we see hides another thing" is the overture to every vignette
  beyond him, and most players meet him last (drama).
- A second copy of the journal in the hall ("Ceci n'est pas un journal") so hall players meet it (teacher, gd, world).
- The sky wallpaper's polka dots look like nursery paper; drop them, vary cloud stamps, add a vertical gradient (vibes).
- The mirror has no glass: add a faint transparent sheen so it reads as a mirror that's wrong (vibes).

---

## Grandfather Paradox (`grandfather-paradox`)

### GP1 · P0 · The scene ends before a careful player can act
The grandfather starts walking the moment you arrive; the question "So what happens if you stop him?" is voiced at
segment 3, the same moment "Close the gate" is disabled (`enabled: S.seg < 3`), ~10 s before he meets her. A player who
listens to the setup, reads the paper or the notebook, or talks to the vendor gets "You let it be" ~25–37 s after
arriving without ever having had an enabled option in reach. *Seen by 10/11.*
- Hold him at his door (checking his watch) until the player first moves off the machine or the `see_gm`/`ask` lines
  have played; voice the question *before* the first opportunity; then slow him right down (the trolley's crawl) while
  the player is within reach of an interactable.
- Keep the gate usable until he's actually through it (`seg ≤ 2 && u < 0.3`); give him a natural stop or two (buying a
  paper, tipping his hat to the vendor) so there are 60–90 s of real choice.
- Don't award "You let it be" to a player who never had an enabled option in range; loop the walk instead (GP2).
- Pause him while the notebook is open (G5).

### GP2 · P1 · No loop: the one vignette where the rewind *is* the theory
One pass to the card; Play again starts cold with the same line. *Seen by 8/11.*
- After "They meet", rewind inside the fiction (clock hands spin back, you're at the machine: "Again.") and let the player
  try up to 3 walks in one visit; on each loop the ordinary obstacles get more pointed (the wind comes *before* you reach
  the gate; he recognises you: "Have we met?"); end after 2–3 loops or on "Go home" (drama, gd, wild, streamer).
- Twist idea: on run 2 you see evidence of your own earlier attempt (the gate already closed, a second you by the
  signpost) (gd).
- Twist idea (the main rival view, currently absent): on a replay let one attempt succeed; the sepia town splits into a
  second, slightly different-coloured copy, and "Go home" takes you to a time machine that's no longer yours: "You changed
  it. But whose past was it?" Then the vignette compares self-consistency with branching timelines (teacher, phil).

### GP3 · P1 · Reactions arrive 10–18 s late, and the counting is wrong
- "He laughs. What a strange thing to say." plays 8–15 s after you tell him; "He doesn't even look at the sign" plays
  after the meeting and after `phase: over`. Fix per G2 (reaction lines interrupt), or have him pause until his own
  fail line has been heard; add a speech bubble on him for the laugh ("Ha! Good one, pal.") so it's visible at once
  (camera, streamer, wild, teacher, calm, gd).
- "Tell him who you are" and closing the gate put you on his path, so "block" also counts: "He steps around you, and
  apologises." plays and the card says "You tried 2/3 ways" for things you didn't choose. Count a block only when the
  player stands still in his path for ~1 s, and not within 2 s of a tell (bugs, phil, streamer, calm, gd).
- "Wind, habit, a laugh." and the card are fixed text, whatever you tried; build the sentence from `S.attempts` ("A
  laugh." / "Wind, habit.") and write the count in words with a singular variant ("You tried once, and something ordinary
  got in the way." not "You tried once. Each time…") (drama, bugs, world, teacher).
- "Tell him" on a moving target is hard to catch; let him slow for a second when you run towards him within ~5 m
  (wild, bugs).

### GP4 · P1 · The philosophy is half stated and one-sided
- The setup never states the paradox, only half the loop: add the second half, e.g. "If they never meet, you're never
  born. And then who came back to stop him?" (phil).
- The voice asserts self-consistency as fact ("It was never going to un-happen." / "Maybe that's the only story that
  works."), while the card ("You could have stopped him, in a sense. You just didn't.") is Lewis, and more careful.
  Voice the "in a sense" line as the last spoken beat and soften `tried_2` ("Or maybe, somewhere else, it did.")
  (phil, drama, calm).
- Journal to-do inverts Lewis: not "you can, and you can't, at the same time" but "you can, in one sense, and can't, in
  another, and both are true" (phil).
- Notebook: add the self-consistency (Novikov) and branching (Deutsch) replies; "often traced to Barjavel (1943), though
  earlier pulp stories had the idea"; SEP "Time Travel" is listed twice (phil).
- Idea: one strong attempt that fails for a stranger ordinary reason (lock the gate with the key from the paper stand;
  the key slips): Lewis's banana peel (phil). On "Tell him who you are", grandma overhears and smiles; card: "Maybe that's
  why they got on so well." (a hint at causal loops) (teacher).

### GP5 · P1 · Leaving early
- "Go home" is live 0.4 m from the spawn, the first prompt you see: one E ends the vignette, counts as completed (✓) and
  overwrites the journal's richer ending. Enable it after `see_gf`, or after the player has walked away and back; don't
  overwrite a richer ending (G6) (gd, wild, world).
- After an early leave, "That's your grandfather…" plays between the two reflection lines (G2); give the early exit its
  own line ("You didn't stay to see it. It happened anyway.") instead of "the only story that works" (drama, phil, all).
- Leaving early after turning the sign gives "Every time you tried, something ordinary got in the way" though nothing
  did; `end()` never checks `leftEarly` (bugs).
- Show the departure: walk the player into the machine, close the door, a brief shimmer (camera, vibes).

### GP6 · P2 · Staging and world
- The meeting (the image the vignette builds to) is a static wide shot with two ~20 px pegs at the frame edge; frame
  the couple, give them a gesture (he lifts his bowler, she stands), hold 3 s (camera, drama, vibes, world, streamer).
- Sepia is a whole-canvas CSS filter that also mutes the player; tint the scene's materials instead and leave the player
  and the time machine in full colour ("you don't belong here"); the station roof is teal (vibes). World: the past reads
  the same cream as everywhere; add grain (world).
- The wind isn't visible (leaf/dust swirl, a tree sway); the railway is two lines on sand; the "late" train never arrives
  (let it pull in as they meet); background walkers, a curtain twitch (vibes, world, streamer).
- The fence is a row of post blockers that traps tap-to-walk; make it one segment blocker the steering knows about
  (bugs). Two prompts at once ("Turn the signpost" and "Tell him who you are") (calm). The vendor's stall intrudes at the
  bottom of the frame near the gate (camera). The fountain water sinks below the rim (vibes).
- Keep: grandma's "Have we met? You have a familiar face.", the vendor's "It's something about your shoes." and
  "Nothing ever happens round here", the gate-gust close-up.

---

## Infinite Monkey Theorem (`infinite-monkey`)

### IM1 · P0 · The time scale teaches the opposite of the theorem
Three lever pulls = 3 million years = the full line "to be, or not to be, that is the question" (`TARGETS` in
`infinite-monkey.js`); the card says "Three million years of noise… It was simply bound to happen." A 39–41-character
line is ~10^58–10^64 tries; the notebook says Borel used monkeys for events "so improbable they will never be seen in
practice", and the walk-out ending ("forever is much, much longer than it sounds") is the true lesson. Players leave
believing it takes a few million years. *Seen by 10/11.*
- Make each pull multiply time by orders of magnitude (10^6 → 10^14 "until the stars go out" → a number the counter can't
  show, in scientific notation → "∞"), with the pages still mostly noise ("Still just the word."), and let the line
  appear only after the player keeps going past the end of the universe: "The stars went out long ago. They're still
  typing." The tension becomes the player's own stubbornness (drama, teacher, phil, gd).
- Or: holding the lever spins the counter through powers of ten, with each page showing the best fragment found so far
  (length growing roughly logarithmically); walking out becomes a real position (finite vs. forever) (gd).
- Card: "Longer than the universe will last, and then a line of Hamlet." Voice: "Given forever, it almost certainly
  happens." (probability 1, not "had to"; the all-q monkey is a lovely hook for the "almost"); the title "Given forever"
  names the one thing the player did not give (phil).

### IM2 · P1 · The pages are scripted, and the lines don't match them
- The first page is "Nothing but nonsense" but random text already contains short words ("no", "go"); the million-year
  "word" is "the" inside "opthep.whka". Highlight the short accidental words on the first page ("A few words, already. Just
  by chance."), and only count words with spaces around them (phil, calm, drama, vibes, streamer).
- Randomness: sometimes a word, sometimes nothing ("Nothing. Again."); re-reading gives a fresh page ("More nonsense.")
  instead of the same page and caption; seed pages per run (identical on every replay) (drama, gd, streamer).
- Lines misaligned with pages: "A word. Just one" over a page showing two; two "A million years go by."; the question
  played after the first wait (wild, bugs). Key `page_N` on the page actually shown (`S.waits`), `once` per million years.
- Sequence break: read one page, pull five times, read → instant "There it is", the "a word / two words" beats skipped,
  and the card still says three million. Enable the lever only when this million years' page has been read, cap it, and
  build the card from `S.waits` (bugs).
- The counter overshoots (1,010,417 / 2,020,833 / 3,031,250); clamp to exact multiples when a wait ends (bugs, phil,
  teacher, gd, calm).

### IM3 · P1 · A million years pass and the room doesn't change
Only the paper stacks grow a little; same monkeys, same light, the banana crate never empties. The lever is the moment a
streamer says "watch this" and nothing pays it off. *Seen by vibes, world, streamer, camera.*
- A time-lapse during the wait: sun and shadow sweep the floor (day/night), dust and cobwebs, paper piles balloon and are
  carried off, the crate empties and a new one is stacked on it ("Somebody has been restocking it."), greyer muzzles, a
  wall clock whose hands blur; bigger effects on later pulls.
- On the found line: every typewriter stops for two seconds of silence and all the monkeys turn to look at you, one lamp
  brightens on the lucky desk; or push in on the one monkey pulling the page out (vibes, camera).
- The room is a greybox exam hall (one taupe wall, 12–15 identical monkeys from behind): a scriptorium receding into haze,
  warm desk lamps, the front row in three-quarter view, a few distinct monkeys (one asleep, one hiding its page, one on a
  coffee break); the "Say hello" pool repeats the same stage direction (vibes, world).
- Move the frog's cameo out of the 3-second time-lapse, where nobody can see it (world).

### IM4 · P1 · Decision design and text
- The only real choice is walk out vs. keep pulling, and the lever is a "next" button. Idea: after the line is found,
  "Keep the page" or "Put it back in the pile" ("You kept it. Something about it mattered, though nobody meant it."),
  which sets up the journal question on meaning; add Knapp & Michaels' wave poem to the notebook/to-dos (teacher).
- "Wait a million years" is silently disabled until you've read a page (the glowing red lever is the first thing players
  try); show a dimmed "Read a page first", or have a monkey hand you a page (G16) (gd, bugs).
- "Walk out" is enabled before you've read anything and is a bare door frame on the lever's path, and the outside looks
  like the inside; put a real door in it and change the light beyond (wild, camera, vibes). It's disabled until the intro
  question has played (bugs).
- The walk-out card's journal question presupposes the found line; use a per-ending question ("Would you have kept
  waiting? Why?" / "If they ever did type it, would the words mean anything?") (bugs, phil, drama, teacher, gd, calm,
  world). Walking out without reading still says "Most of it is noise." (bugs).
- "Given forever, could they type Shakespeare?" names a person (pillar 4): "…a famous play?" (calm, vibes, streamer).
- The prompt sits on the year counter; put the counter on the set (a mechanical flip counter or board), always opaque
  (gd, camera, calm, vibes, streamer, world). The page overlay and the year label show through the game-over card; close
  the page before `gameOver` (bugs, wild, teacher, gd, camera).
- Notebook: the statistical-mechanics context (Borel, Eddington and the second law), the 2003 Paignton Zoo experiment
  (the all-q monkey already alludes to it) (phil).

---

## Simulation Argument (`simulation-argument`)

### SA1 · P1 · The choice is never posed, and the staging answers the argument
- After the reveal, `choose` starts in silence: no line, no prompt in view, the lever ("Switch them off", r 1.8) and the
  door (7–9 m away) show nothing until you blunder into them; players stood 15–30 s. At `choose`, light the lever and
  crack the door open with light spilling in, voice one short beat ("You could switch them off. Or leave them be."), then
  hold a silence. *Seen by 8/11.*
- The choice (ethics towards the simulated) isn't the question the scene asked (credence: "which kind is yours?"). Tie
  each ending to a horn of the trilemma without jargon: switching off = "If everyone did what you just did, there'd be
  almost no little worlds, and you'd probably be real."; leaving them = "One more world. The odds that yours is the first
  one just got worse." (drama, teacher, phil).
- The "don't build more" horn can't be played: "Switch them off" and the door stay disabled until you choose "Run more
  worlds", and idling does nothing (a soft stall). Enable the door and switch from the start with their own ending ("You
  didn't make any more. If everyone decides that, almost nobody is simulated.") (phil, wild, gd, world: "Locked. From the
  outside." as an early door line).
- The pull-back shows your study under a dome on a giant's desk, i.e. it asserts you *are* simulated; Bostrom's is a
  trilemma. Keep the shot (it's the best in the hall) but make it ambiguous: fade the giant's desk in and out, or cut
  between a dome on a desk and an empty desk, ending on "which kind is yours?" (phil).
- The switch-off reflection is only about risk to *you*; add a moral beat first: "They were real to themselves. Were they
  real to you?" (teacher). "Above you, the lights flicker" in only one ending reads as retribution; flicker in both or
  neither (phil).
- Idea: "Run more worlds" adds a counter ("1 world like yours not inside a dome · 1,000 that are") so the odds land;
  worlds visibly strain the machine (lamp dims, fan speeds up) (teacher, phil). A third, do-nothing ending ("nothing
  changes whether you know or not") (teacher).
- Notebook: the indifference principle and "ancestor simulations"; show the monitor *computing* the dome world (pixels,
  a wireframe flicker) since terrariums don't need substrate-independence; a tiny copy of your study in one shelf dome
  (phil).

### SA2 · P1 · The endings show nothing
- "Switch them off" dims only the lit materials: the paper sky stays cream and the window and photo stay bright, so it
  reads as a render bug; the shelf domes vanish instead of going dark; "Above you, the lights flicker" is never shown.
  Fade background and fog to near-black, keep the domes with dark glass, and cut to the reveal angle: the giant's desk
  lamp stutters, the giant turns towards the dome; or a giant's hand hovering over their own switch (vibes, camera,
  world, streamer).
- Rewind that is also a twist: your lights come back up on their own, "Someone switched you back on." (drama).
- "Leave them running": the player walks to the door and stops, card 4 s later. Open the door onto the giant's desk edge,
  or pull back to the reveal with all the shelf domes glowing, and hold 2 s (camera, vibes, streamer).
- After the reveal the giant disappears and the choice happens in an empty frame; keep the giant (blurred) or the dome's
  rim in shot during `choose` (streamer).

### SA3 · P2 · Simulation polish
- Replay: skip to `choose` with "Back at the desk. They're still running." / "Last time you switched them off." (drama,
  gd, wild, calm).
- The window is a flat grey rectangle under "You've never actually checked how far it goes": paint a sky with a faint
  seam or a repeating cloud; after the reveal show a sliver of the giant's room; dim it with the room (world, vibes).
- "Look out of the window" parks the player behind the desk on non-walkable ground (1.1, -4.6), from which nothing can be
  reached; put its interact point in front of the desk and make the gap non-walkable (teacher, wild, world, gd).
- After the zoom you're returned behind the desk with nothing on screen; return in front of the monitor (calm).
- The frog is as big as the monitor, sits behind the player's head, and the frog-inside gag is invisible; scale it down
  ~40%, put it on the far side of the dome, use the zoom framing for 2 s (camera, vibes, world).
- A teal inhabitant in the dome reads as you levitating; teal door and monitor (G18) (camera, vibes).
- The giant is a floating head: give it shoulders, a hand by the dome and a desk-lamp pool (vibes, camera).
- The study is empty before the shelves fill: builder's clutter (a soldering iron, sketches, a cracked dome, a coffee cup
  with a tiny coffee cup inside) (world). Give one tiny person a human act, and on a second visit have one look up at the
  dome (drama).
- Asides are disabled until "Look closer"; enable them from arrival (gd). The lever intrudes on the zoom shot (camera,
  vibes).

---

## Fermi Paradox (`fermi-paradox`)

### FP1 · P0 · The player's big action and the scene's sky are off camera
- "Send a message": the beam's lowest point is ~26 m above the dish, above the frame; only the dish tilts. Anchor it at
  the feed horn (parent it to the bowl) and tilt the camera up along it, or show 3–4 faint expanding rings rising from the
  feed and dwindling to a point, then hold on the empty sky for "Nothing comes back". *Seen by 8/11.*
- "Look at the moon" (the chair "faces the moon"): the moon at (-150, 120, -200) is always off screen; move it into the
  upper left of the default frame (~(-40, 35, -80)) or pan to it (camera, vibes, world, pilot-bugs).
- The frog and its shooting star play below the frame (z≈7–10); route the cameo between the console and the dish (z≈1–3)
  with the star in the upper third (camera, vibes, world, pilot-bugs).
- The dish shows its convex back, reading as a mushroom; tilt it towards the camera to show the concave face, feed horn
  and struts (vibes, pilot-bugs). The Milky Way band never enters frame; bring it across the visible sky with 2–3 star
  sizes (vibes).

### FP2 · P1 · The choice: hidden, accidental, and about a different debate
- "Keep listening" (an ending) appears on the same spot and key as "Listen" the instant "So where is everybody?" ends,
  so a second E ends the vignette with no silence after the question; the send lever sits on the last pixel of the frame
  and is never mentioned (players didn't know it existed). Make keeping-listening the passive branch (sit in the chair;
  nights pass after ~30–40 s of silence), enable both options 3–5 s after `ask`, keep the lever in frame, and add "Or you
  could call out." (gd, wild, calm).
- Send is disabled (no prompt at all) until you've listened; sending before listening is a real choice: enable it, or a
  dimmed "Not yet. First, listen." (bugs, phil, drama, gd, wild).
- The choice (send vs. listen) is the METI debate, not Fermi's (where are the visitors?), and the notebook has nothing on
  METI, so the journal question asks about reading the player never got: add a notebook paragraph (Arecibo 1974, Brin's
  "Great Silence" 1983, the 2015 statement against METI, the "stay quiet" idea); or make listening playable as the
  paradox, with each night showing one hypothesis as an image (a planet going dark, a second silent dish pointed at you,
  one far light) (phil, teacher).
- Sending carries no risk before you do it: seed unease first (the logbook's last entry "Heard something. Didn't
  answer."; the static falls silent for a moment), and make the send ending linger differently (a faint regular blip for
  one beat) (drama).

### FP3 · P1 · Voice and pacing
- "Years pass. Nothing comes back. Maybe no one is there." draws an inference the physics can't support (a reply takes
  8+ years from the nearest star); the card gets it right. "Years pass. Your message has barely left the neighbourhood."
  (phil). `send_2` is four sentences on three caption lines (phil).
- "Either they're rare, or they're quiet, or we're early" claims exhaustiveness and omits "they don't last" (Great Filter):
  "Maybe they're rare. Maybe they don't last. Maybe they're quiet. Maybe we're early." Split the lines across a longer
  (~25–30 s) time-lapse (year 1, 10, 40) so waiting is the experience; the card repeats the voice word for word, give it
  a different beat (the logbook gets one more "Nothing") (phil, drama, pilot-bugs).
- Idle after arrival: nothing for 60 s and no hint the monitor is where to go; a second arrival line pointing to the
  static, or the console crackling (bugs, calm). Dead air after the question on stream: let the sky do something
  (a satellite, the frog's star, a false-alarm twitch) (streamer).
- Notebook accuracy: Hart argued we are probably the only civilisation *in the Galaxy*, from the absence of visitors (not
  "no others", not "silence"); Fermi asked "something like 'Where is everybody?'"; the moon line: "Only one other world
  has ever had footprints" (Mars, Venus, Titan had robotic visitors) (phil).
- Replay: "The logbook has one new line in it: yours." (teacher).

### FP4 · P2 · Fermi polish
- The player is at the bottom edge under the caption in every shot, cut at the waist; in the lapse, reduced to the top
  of a head: keep "you" as a small silhouette in the lower third (someone keeps listening) (camera, streamer, calm,
  vibes).
- The time-lapse turns the sky flat grey with stars on it: cycle quick dawn gradients and star trails; record the years
  at the station (a stack of logbooks, faded paint, snow on the dish, the figure in the chair) (vibes, world, camera).
- The hall portal is a brass telescope but the scene is a radio dish; make the portal a radio set, or put a telescope on
  the hill (gd, streamer, vibes, world). The hut window is half black like an unloaded texture (vibes). The mug deserves
  its own prompt (world).

---

## Tragedy of the Commons (`tragedy-of-the-commons`)

### TC1 · P0 · The tragedy only happens if you start it
Neighbours add sheep only as an echo of *your* "Add a sheep" (inside your `onUse`); with no adds the pasture is exactly
sustainable forever (10 sheep: regrowth 0.02/s = 10 × 0.002/s), so doing nothing is a dead end (no line, no ending, no
frog; Esc is the only way out) and the game teaches that the tragedy needs a first bad actor, the opposite of Lloyd and
Hardin (each herder independently finds one more sheep rational; no villain needed). The card's "Every sheep made sense
to the one who added it" is contradicted by the neighbour's "Well, you added one. Why shouldn't I?". *Seen by 9/11.*
- After ~20–30 s, a neighbour adds a sheep on their own ("The blue house adds one. It's their right."), then another,
  whether or not you do; your sheep speed it up or slow it down. Copying can stay as a second reason (reciprocity).
- Give restraint its own ending: "You held back. They didn't. The grass went anyway." (drama, teacher, phil, gd, bugs).
- Add "Take a sheep back" at your pen: the neighbours don't follow ("More for us, then."), the decline slows but doesn't
  stop: "You held back. It wasn't enough on your own." (teacher, gd).

### TC2 · P0 · The bell is a free win, available before any problem
"Ring the bell" is live from the first second and always gives the same ending: rung at full grass it says "The grass
came back" when it never went; rung at 0.09 it's instant and unanimous. *Seen by 10/11.*
- Enable it only once the grass is visibly thinning (after the "thin" line), or give an early ring its own honest ending
  ("Everyone came. Nobody saw the problem yet. They went home." / "You agreed on limits before anyone needed them. That
  is rarer than it sounds.").
- Make the agreement cost something and show it: at the meeting *you* walk one of your sheep back first, then the
  neighbours follow; one hesitates and is watched until they do; below a threshold the meeting comes too late (drama,
  teacher, gd, streamer). Card text depends on `recoverFrom`.
- Idea: after the meeting, leave "Add a sheep" enabled briefly; sneak one in and a neighbour walks it back (monitoring and
  a gentle sanction: Ostrom's conditions) (phil).
- Walk the player into the meeting circle (scripted walk) and frame the five of them; the player currently stays at the
  bell, under the caption, while "Together, you agree" plays (7/11). Swing the bell with rings (vibes).

### TC3 · P1 · The private gain is invisible
"One more sheep. A little more for you." but nothing on screen shows it: your sheep look like everyone's, the pen stays
empty, there's no wool or tally. Adding is simply the wrong button. *Seen by teacher, gd, vibes, world, camera, streamer.*
- Mark your sheep (a teal raddle dot or collar; each household's in its roof colour), make your house roof teal, have
  added sheep walk out of your pen, and show your gain growing (a wool pile by your gate, a tally that out-earns the
  neighbours for a while).
- Idea: "Fence off your share" (the pasture splits into six small plots; "It worked. Nobody shares anything any more."),
  so privatisation, regulation and Ostrom are all playable (teacher).

### TC4 · P1 · Pacing and consequence
- The question "So why would anyone stop?" comes at grass ≈0.28–0.63 and the collapse follows 8–14 s later; with E spam
  it plays after the grass is gone or after the bell. Voice it after the first neighbour copies you (~0.95), slow the final
  decline (pillar: no timers you can lose to), add a cooldown and a cap on "Add a sheep" (15 sheep in 5 s is possible)
  (bugs, gd, wild).
- Stale lines: "Five neighbours, two sheep each. The grass is thick." plays over bare dirt; drop it once the player acts
  (G2) (wild, calm, world, camera). "Your neighbours notice. They add sheep too." never plays if you add a second sheep
  within ~6 s: capture `const first = ++S.adds === 1` before the awaits (bugs, camera).
- Hold the bare field 4–6 s before the card (sheep still, neighbours turning to look at you), then a gentle rewind as
  the grass grows back and the sheep un-add (GAME.md's rewind) (drama, streamer, vibes).
- Neighbours have no body language: as the grass drops they walk to the fence and lean on it; at the collapse they turn
  to look at you; a neighbour walks a new sheep in through their gate when they copy you (world, camera).

### TC5 · P2 · Commons text and polish
- "Five neighbours, two sheep each" but four are visible: "Four neighbours and you" (phil, camera, world).
- "A shared pasture. Anyone may graze their sheep here." makes it open access, the main historical objection to Hardin
  (historical commons had stints; Hardin later said "unmanaged commons"): "A shared pasture, with no rules yet." and one
  notebook sentence on it (phil).
- Notebook: Hardin's own formula was "mutual coercion, mutually agreed upon", not "regulated from above"; his essay was
  mainly about population, which deserves one neutral sentence (phil).
- Sheep clump into one overlapping white pile; add separation steering and spread grazing targets; after the agreement
  the extra sheep walk through the fence (add a gate) (calm, vibes, world).
- The caption covers the player at the gate; a foreground house crops the bottom of the frame; the frog's fly catch is at
  the bottom edge (wild, camera, vibes, streamer).
- Keep: "Mine are the fat ones. Don't tell the others.", the neighbours' lines souring with the grass, the grass colour
  as a live meter, "Nobody owned the pasture, and nobody had to.", the journal question about something shared in your
  own life.

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
- **Hall:** the Magritte set (the apple-faced gentleman and "Everything we see hides another thing", the mirror that
  shows your back, "Ceci n'est pas une pipe", Golconda, the train in the fireplace), the ✓ on finished portals.
- **Grandfather Paradox:** the ordinary failures (wind, habit, a laugh, "He steps around you, and apologises."), the card
  "You could have stopped him, in a sense. You just didn't." (Lewis in one sentence), the gate-gust close-up, grandma's
  "Have we met? You have a familiar face.", the journal question.
- **Infinite Monkey:** the typed page with the highlighted line, "But none of them meant a word of it" and the journal
  question on meaning without a meaner, the all-q monkey, "Forever takes a lot of bananas", "(It pats your hand, and keeps
  typing.)", the walk-out card.
- **Simulation Argument:** the zoom into the dome and over the tiny person's shoulder at *their* dome, the shelves filling
  with worlds, the pull-back to your study under a dome on a giant's desk (the best shot in the hall, and the game's
  thumbnail), your own room going dark, the unremembered photo and the unchecked sky.
- **Fermi Paradox:** "Someone should have come by now" (Hart in five words), "They left footprints, and went home.", the
  logbook of "Nothing", the cold tea, the lamplit console on the cold hill, the star-trail time-lapse, the card "The
  message is still travelling".
- **Tragedy of the Commons:** the grass colour draining as a live meter, the neighbours' lines souring with the grass
  ("Well, you added one. Why shouldn't I?", "Not my fault. I only did what everyone did."), "Mine are the fat ones",
  "Nobody owned the pasture, and nobody had to.", the colour-coded households, the toppled toy sheep.
- **House and shell:** the painting push-in, spawning beside the portal you used, the ✓ and the glowing journal, the
  handwritten journal page with its notes-to-self to-do lists, the title card and "Look around" onboarding, the
  game-over card over a frozen frame, the accurate notebooks (every citation checked by phil).

## Not included (harness artifacts)

- "The first frame after entering the house is an abstract close-up" (pilot-calm): the harness screenshotted during the
  0.6 s fade-in, before the game had placed the camera. Fixed in the harness; not a game issue.
- "(moving)" shown while standing still, and the `use` command walking to the wrong one of two overlapping prompts:
  harness issues (the second is also a real game issue, G4/S2).
- `net::ERR_ABORTED` on a voice mp3: the harness mutes audio.
