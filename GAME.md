# Thought Experiment Database: The Game

An art game made of playable vignettes, one per thought experiment. You don't score points or win; you step into
each dilemma and act. The world responds, and a quiet narrator says a little about what you did. It plays like a cutscene you're inside: the camera is authored and the pacing is slow, but the
choice is yours.

The films (on `main`) and the game share one engine, one visual language, one voice, one frog and one research
standard. `PRODUCTION.md` still governs research, writing quality, colour roles and sources. This document covers
what's different for the game.

---

## 1. Pillars

1. **You are "you".** The player is always the teal peg figure, the agent who must choose. Every vignette puts the
   player in the second-person role the thought experiment already asks you to imagine.
2. **Act, don't answer.** The dilemma is posed through a situation you can act in (pull, walk away, open, look), never
   through a multiple-choice menu. Doing nothing is always a real option, and often the most interesting one.
3. **Slow and authored.** Cinematic cameras, long silences, time that slows or freezes at the moment of choice.
   There are no fail states, timers you can lose to, or scores.
4. **Plain, not academic.** The narrator is minimal and warm: a few words to describe the situation, and a brief,
   non-judgemental reflection on what the player did and why it's interesting. **No philosophers, dates, papers
   or jargon in the voice.** The scenarios stay faithful to the originals, and the scholarship lives only in the optional notebook.
5. **Consequences are real, but gentle.** Your choice plays out in full: whoever is on the track gets knocked flying,
   like toys. Then time rewinds and everything is restored. No gore, and no lingering.

## 2. Structure: the House

The game's menu is a place: a **surreal house** inspired by Escher and Dalí, floating in the paper-coloured sky.

- **Portals:** each vignette is entered through an object that suits it. You step **into a painting** (The Trolley
  Problem), **open a book** (Brain in a Vat, via Descartes' *Meditations*), or **open a door** (upcoming experiments,
  labelled but locked until built). Choose the portal to fit the experiment: a painting for a scene, a book for an argument
  from a text, a door for a place.
- **Set dressing (Escher/Dalí):** a Penrose-style staircase that loops, a door on the ceiling, a window looking into
  the sky below the floor, melting clocks draped over furniture, a table on impossibly long legs, a checkered floor.
  It should feel dreamlike, but stay in the clay-diorama style of the films.
- **Progress:** completed portals glow softly (saved in the browser). Nothing is ever locked behind another vignette.
- **Order:** new portals are added in the order of `thought_experiments.xlsx` (highest Avg rating first).

## 3. The vignette template

Each vignette is a short (3–8 minute) playable scene in five beats, mirroring the films' five acts:

| Beat | What happens | Trolley example |
|---|---|---|
| **1. Arrive** | You land in the scene. A line or two of voice sets the situation. You can walk and look. | You arrive beside a railway on a sunny island. "A runaway trolley." |
| **2. Discover** | Walking reveals the stakes. Triggers fire as you approach things (people, objects, edges of the world). | Walking along the track, you see five workers ahead; at the fork, one worker on the side track. |
| **3. The choice** | Time slows to a crawl. One or two interactions are possible, and so is doing nothing. The central question is voiced, then there's a long silence. | The trolley creeps forward in slow motion. The lever glows. "Should you pull it?" |
| **4. Consequence** | The world acts out what you chose (or didn't) in full, holds a beat, then rewinds, and the controls reset. | The trolley runs down the track you left it on and knocks those people flying. Rewind: everyone is restored, and the lever snaps back to the main line. |
| **5. Reflection** | One or two plain lines about what you did and the tension in it, with no names or theory. Then a twist that reframes the choice, and a way home. | Pulled: "You saved five. But you made the trolley kill someone who was safe." Walked away: "You didn't touch a thing. Five people were hit anyway." Then a third track appears, pointing at you, and you can try again. |

**Endings.** A vignette ends with a quiet *Game over* card (`ctx.gameOver`) with *Play again* and *Back to the house*:
- after a small number of completed runs (the trolley: three), whatever you chose; the narrator names what never changed;
- or when the player takes the most drastic option the experiment offers (the trolley: sending it onto yourself).
After the first run, a twist opens a new, playable option (the trolley: a third track with its own lever).

The game-over card also asks two things, both optional:
- **The journal question:** one guided question about what the player just did, in the form "what do you think, and
  why?" (e.g. Ship of Theseus: *Which one was the real ship: the repaired one, or the one rebuilt from the old planks?
  What made you decide?*). The answer goes into the player's **journal**.
- **A note for the builder:** anything confusing, broken or missing. It's sent to the dev server and appended to
  `feedback.txt` at the repo root (gitignored), with the level, ending, player position, the level's `__S` state and the
  screen size, so it can be picked up on the next iteration. Read it before starting work on a vignette.

**The journal** lies open on a writing desk in the first room (it glows once you've finished something). It keeps, per
vignette: the question, your answer (editable there), the ending you reached and the date. Once you've finished a
vignette, it also shows a to-do list written like a note to self: the original source, a video essay or two, and an
encyclopedia entry (SEP where one exists), with links. Questions and to-dos live in `game/journal.json`; answers are
saved in the browser (`localStorage`).

Every vignette also has:
- **A notebook:** an optional page (`N`), never forced, for the curious: where the thought experiment comes from,
  sources, recommended reading and the video essay, drawn from the film's `script.json → publish`. This is the only
  place philosophers and citations appear.
- **Replay:** after the reflection, the choice comes round again. The narrator acknowledges whether you chose the same
  or differently.
- **A journal entry:** a question and a to-do list in `game/journal.json` (verify every link).
- **The frog:** it appears exactly once per vignette, preferably during the choice, visible but never central. It hops in,
  does **one small thing that is different in every vignette** (and quietly fits it), hops out, and is never mentioned.
  Built with `frogCameo()` in `game/core/frog.js` (hops, waits, faces, jump cuts; `frogExtras` adds a tongue and a throat
  sac). So far: steps onto the rails, feels them hum and thinks better of it (trolley) · hops past the bench, flickers,
  and does the same two hops again (brain in a vat) · looks at itself in the pond and plops in (cave) · climbs out of the
  sea onto a bollard and croaks at the ship (Theseus) · hops across the square, then rewinds backwards (grandfather) ·
  presses one key on a typewriter while the monkey stares (monkeys) · looks into the dome while a frog inside looks back
  (simulation) · watches a shooting star (Fermi) · catches a fly, the only one not grazing the common (commons).
- **Asides:** one to three small things to do that aren't the thought experiment: people to talk to (silent speech
  bubbles, `talk()` in `game/core/extras.js`) and things to look at (one short narrator line each, `look()`). They never
  change the story; they make the place feel lived in, and they can be funny.

### The first room (built)

| Portal | Vignette | What you can do | Endings |
|---|---|---|---|
| The painting | **The Trolley Problem** | Walk to the lever; pull it or don't; after the first run, a third track and lever lead to you | Choose yourself · three runs |
| The book on the lectern | **Brain in a Vat** | Wander a sunny little world; its edges flicker; step off and fall outward into a lab where your world floats above a brain, and again | Sit on the bench · no way out (three layers) |
| The purple door | **Plato's Cave** | Chained, watching shadows; the chains fall; turn to the fire, climb into the light | Keep watching · stay in the light · go back and tell them |
| The sky door | **Ship of Theseus** | Carry new planks and replace all six of the ship's old ones; the old planks become a second ship | Board the new ship · board the old wood |

The first room's Penrose staircase is a real spiral, re-shaped every frame so that from wherever the camera is, its top
step sits exactly in front of its bottom step: it always reads as a closed loop, and the little figure climbs forever.

### The hall (built)

Up the rope ladder, through the door on the first room's ceiling: a long corridor built after Magritte. Its walls are
painted sky, and red stage curtains frame it. There's a dining table and chandelier hanging from the ceiling, day above
night in one window with an easel in front painted with exactly the view it hides, bowler-hatted men hanging like rain
outside a high window, a steam engine coming out of the fireplace, a small room filled by one green apple, a mirror that
shows the back of your head, a pipe that is not a pipe, a door with a hole in it, and a gentleman whose face is hidden by
a hovering apple (you can talk to him). Escher's stairs climb into the ceiling. A hatch in the floor leads back down.

| Portal | Vignette | What you can do | Endings |
|---|---|---|---|
| A grandfather clock | **Grandfather Paradox** | Step out of a time machine into the sepia-toned past. Your young grandfather walks to meet your grandmother; close the gate, turn the signpost, stand in his way or tell him who you are | Something always got in the way · you let it be (or left early) |
| A typewriter | **Infinite Monkey Theorem** | Read the monkeys' pages; pull the lever to wait a million years; read again | Find "To be, or not to be" · walk out |
| A glowing monitor | **Simulation Argument** | Look into the world on your desk (and the one inside it); run more worlds; the camera pulls back to reveal your study under a dome on a giant's desk | Switch them off · leave them running |
| A telescope | **Fermi Paradox** | Listen to the static under the stars | Send a message · keep listening |
| A garden gate | **Tragedy of the Commons** | Add sheep to the shared pasture; the neighbours copy you; the grass thins | The grass is gone · ring the bell and agree on limits |

New rooms: add a level in `game/house/`, register it in `LEVELS` (`game/main.js`), link it from an existing room with a
portal whose id is the room's level id, and give it a spawn for `ctx.from` (so players come back beside the portal they
used). Hall portals and spawns are in `game/house/hall.js`.

## 4. Controls

- **Move:** WASD / arrow keys, a gamepad left stick, or tap/click on the ground to walk there.
- **Interact:** `E` / `Space` / gamepad A, or tap the on-screen prompt when it appears near an object.
- **Notebook:** `N`. **Leave to the House:** `Esc` (asks first).
- **Camera: third person by default.** The camera is authored (`makeFramer` keeps you and everything at stake in frame).
  There is no free mouse-look.
- **First person, only where the experiment is about perspective.** In Plato's Cave you see through your own eyes until
  you step out into daylight: A/D or drag to turn, W/S or tap to walk, a wider lens (the level returns `fov`), and
  turning is limited while chained (`player.yawLimit`). Outside the cave, and when you go back in, the same rule holds:
  first person inside, third person outside.

## 5. Voice and text

- Same narrator as the films: Kokoro `bm_fable`, speed 0.9, with the `pronounce` fixes from `PRODUCTION.md` §5.3.
- **Minimal:** a vignette has roughly 6–12 lines in total. One short sentence per trigger (rarely two), everyday
  words, and long silences between them. Most lines are triggered by where you are or what you did, not by a timer.
- **Describe, then reflect:** lines either describe the scenario plainly ("A runaway trolley." "Five people on the
  track.") or briefly reflect on the player's journey ("You waited. Nobody made you choose, but not choosing was a
  choice too."). Never cite, lecture or grade. Never tell the player they were right or wrong.
- Lines are captioned (a small pill at the bottom). Every line is written in `game/lines/<vignette>.json` and
  pre-rendered to audio by `node game/tools/voice.mjs <vignette>`.
- No quotes, names or citations in narration. They live in the notebook.

## 6. Engine and layout

```
game/
  index.html            entry: loads the House, handles portals, notebook, captions, saves
  core/                 game runtime on top of engine/core.js
    player.js           the teal "you": movement with steering around obstacles, sitting, scripted walks, walk animation
    camera.js           makeFramer(): fits a set of points exactly on screen from a fixed angle (the default vignette camera)
    notebook.js         builds the notebook page from a film's script.json or game/notebook/<id>.json
    interact.js         proximity triggers, interactables + prompts, one-shot/repeatable events
    voice.js            plays pre-rendered lines with captions, and queues them so they never overlap
    ui.css              prompts, captions, notebook, portal flashes
  house/house.js        the hub
  vignettes/<id>.js     one module per thought experiment: build(ctx) → { update(dt), dispose() }
  lines/<id>.json       voice lines per vignette (id → text), with pronounce rules
  journal.json          the journal: one guided question and a to-do list of sources per vignette
  core/journal.js       journal store (localStorage) and page
  notebook/<id>.json    notebook data for vignettes without a film (same fields as a film's `publish`)
  assets/voice/<id>/    generated audio (committed; small)
  tools/voice.mjs       renders lines with Kokoro → assets/voice
  tools/serve.mjs       local dev server → http://localhost:5173/game/ (also appends POST /feedback to feedback.txt)
  tools/playtest-asides.mjs  watches every frog cameo and tries every aside (screenshots to build/asides-*)
  tools/playtest-*.mjs  automated playthroughs (headless Chrome drives window.__ted; screenshots to build/)
```

- Everything visual comes from `engine/core.js` (palette, clay kit, frog, particles, ghosts). Scenes are still
  deterministic where it matters, so a vignette can be driven by a timeline in its cutscene moments.
- The game runs in the browser (Three.js). It can later be packaged for desktop (e.g. Tauri or Electron) or hosted on
  GitHub Pages.

## 7. Process for a new vignette

1. **Research:** as in `PRODUCTION.md` §1. If a film exists, reuse its research, `publish` metadata and verified quotes.
2. **Beat sheet:** write the five beats. For each, set the player's possible actions, what triggers each line, and what the
   world does. Every branch must be honest to the literature (who argued what).
3. **Greybox:** block out the island, the walkable area and the camera rails with plain shapes. Walk it end to end.
4. **Lines:** write `lines/<id>.json`, render the voice, and run the narration audit (`tools/audit.py`) for names and pace.
5. **Build:** dress the scene with the kit, add the choice moment, the consequence (played out in full, then a rewind that resets everything), the reflection branches, the endings,
   the frog, the notebook page and the journal entry (question + to-dos).
6. **Portal:** add the painting, book or door in the House.
7. **Playtest checklist:**
   - Every branch plays, including doing nothing and leaving mid-scene.
   - Replay acknowledges the second choice.
   - No line overlaps another. There's no dead end, and no moment where the player doesn't know they can move.
   - The camera keeps the player, the hazard and everyone at stake in frame from anywhere the player can walk.
   - Every ending is reachable. Write a `game/tools/playtest-<id>.mjs` that drives `window.__ted` through each path (see the
     existing ones; the trolley supports `?fast=<speed>`). Wait for the prompt before pressing E.
   - Tap-to-walk works everywhere: the player steers around obstacles, but check that nothing traps them.
   - The frog appears exactly once. Captions are readable.
   - It works with keyboard, gamepad and touch.
