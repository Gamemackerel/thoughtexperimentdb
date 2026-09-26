# Thought Experiment Database: The Game

An art game made of playable vignettes, one per thought experiment. You don't score points or win; you step into
each dilemma and act. The world responds, and a quiet narrator says a little about what you did. It plays like a cutscene you're inside: the camera is authored and the pacing is slow, but the
choice is yours.

This is the game's design document and production guide: how the house and its vignettes are designed, written,
voiced, built and checked. The project began as short explainer films; their standards for research, writing, colour
and voice carried over and are folded in here (§8). The films themselves are archived in `archive/films/`.

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
  It should feel dreamlike, but stay in the clay-diorama style (§8.3).
- **Progress:** completed portals glow softly (saved in the browser). Nothing is ever locked behind another vignette.
- **Order:** new portals are added in the order of `thought_experiments.xlsx` (highest Avg rating first).

## 3. The vignette template

Each vignette is a short (3–8 minute) playable scene in five beats:

| Beat | What happens | Trolley example |
|---|---|---|
| **1. Arrive** | You land in the scene. A line or two of voice sets the situation. You can walk and look. | You arrive beside a railway on a sunny island. "A runaway trolley." |
| **2. Discover** | Walking reveals the stakes. Triggers fire as you approach things (people, objects, edges of the world). | Walking along the track, you see five workers ahead; at the fork, one worker on the side track. |
| **3. The choice** | Time slows to a crawl. One or two interactions are possible, and so is doing nothing. The central question is voiced, then there's a long silence. | The trolley creeps forward in slow motion. The lever glows. "Should you pull it?" |
| **4. Consequence** | The world acts out what you chose (or didn't) in full, holds a beat, then rewinds, and the controls reset. | The trolley runs down the track you left it on and knocks those people flying. Rewind: everyone is restored, and the lever snaps back to the main line. |
| **5. Reflection** | One or two plain lines about what you did and the tension in it, with no names or theory. Then a twist that reframes the choice, and a way home. | Pulled: "You saved five. But you made the trolley kill someone who was safe." Walked away: "You didn't touch a thing. Five people were hit anyway." Then a third track appears, pointing at you, and you can try again. |

**Endings.** A vignette ends with a quiet *The end* card (`ctx.gameOver`) with *Play again* and *Back to the <room>* (the room
of the house you came from: the first room, the hall, the trolley room or the gallery):
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
vignette: every ending you've reached (with the date), and every answer you've written, each with the ending it followed,
so a change of mind shows (all editable there). A question can depend on the ending (`"questions"` in `journal.json`). Once you've finished a
vignette, it also shows a to-do list written like a note to self: the original source, a video essay or two, and an
encyclopedia entry (SEP where one exists), with links. Questions and to-dos live in `game/journal.json`; answers are
saved in the browser (`localStorage`).

Every vignette also has:
- **A notebook:** an optional page (`N`), never forced, for the curious: where the thought experiment comes from,
  sources, recommended reading and the video essay, from `game/notebook/<id>.json`. The notebook and the
  journal are the only places philosophers and citations appear.
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
- **The house rules** (from the September playtest; every vignette keeps all four):
  1. Everything that looks usable shows a prompt from arrival, even if it only says "Not yet" or gives a line.
  2. There's a visible way home from arrival (the pill at the top left, and one in the world).
  3. Doing nothing always resolves within about a minute of the question: a passive ending, or someone nudging you.
  4. An ending never shares a prompt spot with anything that isn't one, and never sits where you arrive: endings open
     only once the problem has been put, and are marked `terminal` so they lose ties to smaller actions.
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

### The trolley room (built)

Once you've finished the Trolley Problem, the painting in the first room opens onto a railway waiting room instead:
green panelling, a station clock, a departures board, a stationmaster at the ticket window, and a model railway going
round a table (throw the lever to reverse it). Four paintings hang on the wall, three of them rendered live from little
clay scenes (`game/core/paint.js`) so they match the original.

| Painting | Vignette | What you can do | Endings |
|---|---|---|---|
| The lever | **The Trolley Problem** | (as in the first room) | |
| The footbridge | **The Footbridge** | On a bridge over the line, beside a very large man. Push him, and he stops the trolley; look over the railing (you're too light) | You pushed him · you kept your hands to yourself (after two runs) |
| The loop | **The Loop** | The side track loops back to the five; one big man on the loop. Pull the lever; a ghost trolley then shows the loop with nobody on it | You needed him there · you left the lever (after two runs) |
| The surgeon | **The Transplant Surgeon** | Five patients, five organs, no donors; a healthy visitor in the waiting room. Send him home, or take him to theatre (the doors close; nothing is shown) | You sent him home · you operated |

### The gallery (built)

Up Escher's stairs from the hall: a long room after Picasso. The walls are broken into tilted, overlapping planes; the
floor is cut into facets; the far left is washed blue, where an old man plays guitar; harlequin pillars frame the portals;
a grey mural (a bull, a horse crying out, a lamp like an eye) runs along the top; a sheet-metal guitar stands on a plinth;
a weeping woman hangs with both eyes on one side of her face; a painter in a striped shirt will talk to you.

| Portal | Vignette | What you can do | Endings |
|---|---|---|---|
| A ring under glass | **The Ring of Gyges** | Find the ring in the bronze horse; turn it (R) to vanish; take apples, coins or the king's gold; walk past the guards | Throw it back into the dark · keep it and walk into the hills |
| A cell door | **The Prisoner's Dilemma** | Sign the statement or say nothing, three times; your partner plays tit for tat | You kept quiet · you talked every time · it depended on last time |
| Two boxes | **Newcomb's Paradox** | Take the closed box or both; the Predictor is never wrong; come back tomorrow | You took one box · you took both boxes |
| A cake | **The Utility Monster** | Carry eight slices to six villagers or the monster; a meter adds up happiness | You fed the monster · you shared the cake · your own way |
| A door with a slot | **The Chinese Room** | Take each card, find its rule in the book, post back the matching card; then see who you've been talking to | You answered perfectly · you stopped answering |
| Three doors | **The Monty Hall Problem** | Pick, watch the host show a goat, stay or switch; then play a hundred times each way | Switching wins two times in three |

Rooms are hubs: "Back to the house" on the game-over card (and Esc) returns you to the room you came from (`HOME_ROOM` and
`ctx.hub` in `game/main.js`).

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

- One narrator throughout: Kokoro `bm_fable` (British English), speed 0.9. Respell anything it mispronounces in the
  line file's `pronounce` map (captions keep the real spelling); see §8.4.
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
  index.html            entry: loads the house, handles portals, notebook, journal, captions, saves
  main.js               the shell: levels, rooms (hubs), camera, input, game-over card, journal, feedback
  engine/core.js        the visual language: palette, clay materials, world kit (islands, people, trolleys, tracks,
                        furniture), the frog, particles, ghosts, stage (renderer, lights, camera), overlay UI
  engine/style.css      colour tokens, fonts, and the overlays core.js makes (fades, labels, rewind, glitch)
  core/                 the game runtime on top of the engine
    player.js           the teal "you": movement with steering around obstacles, sitting, scripted walks, first person
    camera.js           makeFramer(): fits a set of points exactly on screen from a fixed angle (the default camera)
    interact.js         proximity triggers, interactables and their prompts
    voice.js            plays pre-rendered lines with captions, queued so they never overlap
    notebook.js         builds the notebook page from notebook/<id>.json
    journal.js          the journal: answers (localStorage) and its page
    frog.js             frogCameo(): the frog's one small scene per vignette
    extras.js           talk() and look(): the asides
    paint.js            paintings rendered live from little clay scenes
    props.js            shared props (sheep, goat, car, text cards)
    lab.js              the brain, vat and machine (Brain in a Vat)
    trolley-kit.js      framing camera, knock-away and slowed speech for the trolley variants
    ui.css              the HUD: prompts, captions, notebook, journal, game-over card, speech bubbles
  house/                the rooms: house.js (first room), hall.js, trolley-room.js, gallery.js
  vignettes/<id>.js     one module per thought experiment (see the level contract below)
  lines/<id>.json       voice lines per vignette (id → text), with pronounce rules
  notebook/<id>.json    notebook data: title, summary, citations, essay, also, reading
  journal.json          one guided question and a to-do list of sources per vignette
  assets/voice/<id>/    generated audio (committed; small)
  assets/paintings/     the trolley painting
  playtest/             AI playtest briefs, raw reports and consolidated feedback
  tools/voice.mjs       renders lines with Kokoro → assets/voice
  tools/serve.mjs       local dev server → http://localhost:5173/game/ (also appends POST /feedback to feedback.txt)
  tools/playtest-*.mjs  automated playthroughs (headless Chrome drives window.__ted; screenshots to build/)
  tools/playtest-asides.mjs   watches every frog cameo and tries every aside
  tools/shot.mjs        quick screenshots of any level after walking to given points
  tools/agentplay/      a virtual-clock, command-line player for AI playtest swarms
tools/                  (repo root) setup.sh, Kokoro TTS (kokoro/speak.py), narration audit (audit.py)
```

- **Level contract:** a room or vignette module's default export takes `ctx` and returns `{ root, ground, spawn,
  walkable(x, z), blockers(), camera(player, t, dt), update(dt, t), start?(), dispose?(), notebook, __S, __frog }`.
  `ctx` gives the stage, player, interact, voice, save, `goto`, `wait`, `toast`, `speak`, `page`, `gameOver`, `from`
  and `hub`.
- Everything visual comes from `game/engine/core.js`. `clay(color)` materials are **cached and shared**: never change
  a clay material's colour in place; `.clone()` it first.
- The game runs in the browser (Three.js). It can later be packaged for desktop (e.g. Tauri or Electron) or hosted on
  GitHub Pages (the feedback box needs the dev server).

## 7. Process for a new vignette

1. **Research:** as in §8.1. Pick the next experiment from `thought_experiments.xlsx` (highest average rating first).
2. **Beat sheet:** write the five beats. For each, set the player's possible actions, what triggers each line, and what the
   world does. Every branch must be honest to the literature (who argued what).
3. **Greybox:** block out the island, the walkable area and the camera rails with plain shapes. Walk it end to end.
4. **Lines:** write `lines/<id>.json`, render the voice (`node game/tools/voice.mjs <id>`), and run the narration audit
   (`tools/kokoro-venv/bin/python tools/audit.py <id>`) for names and pace (§8.4).
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

## 8. Standards

### 8.1 Research
- Start from the **original publication(s)** and the relevant **Stanford Encyclopedia of Philosophy** entry (or the
  Internet Encyclopedia of Philosophy, or Wikipedia where neither exists). Prefer the original author's framing.
- Record: author(s), title, year of original publication (not a reprint year), the canonical setup, the author's own
  verdict, the key later variants and who introduced them, and one or two notable responses.
- The scenario must be faithful to the original; each branch the player can take should correspond to a position
  someone has actually argued.
- **Verify every link** before it goes in a notebook or the journal (fetch it; for YouTube, check the oEmbed title and
  channel). SEP entries get renamed (e.g. `brain-vat` → `skepticism-content-externalism`).
- Quotes are only ever in the notebook, verbatim and attributed. If unsure of the exact wording, paraphrase.

### 8.2 Writing
- Plain, warm, precise. Short declarative sentences, one idea each, in the second person for the player's situation.
- Present answers as answers people have given, never as the truth; never grade the player.
- No filler or stock phrases ("It's worth noting", "Let's dive in"), and nothing about comments, likes or subscribing.
- The narration names no philosophers; the notebook and journal do (§5).

### 8.3 Visual language
- **World:** floating clay dioramas on warm paper (`#f3ebdd`), low-poly trees and rocks, soft shadows, gentle fog. Matte
  clay throughout; toylike and friendly, never gory. Harm is shown as toys being knocked flying, then undone.
- **Colour roles** (never repurpose them; use `palette` in `core.js`): coral `#e0674f` the threat or doing harm · blue
  `#5b7fa6` the many · mustard `#e2a93b` the one · teal `#3f8f86` you, the agent who chooses.
- **People** are peg figures (`makePerson`); workers wear hard hats.
- **Type:** Newsreader (serif) for titles and the notebook, Figtree (sans) for the UI and captions, Caveat for the
  journal; all three from Google Fonts, loaded in `game/index.html`.
- Each room of the house is dressed after an artist (Escher and Dalí, Magritte, Picasso), in clay.

### 8.4 Voice and the narration audit
- Kokoro `bm_fable`, speed 0.9, `en-gb`. `game/tools/voice.mjs` trims silence and normalises loudness.
- The audit transcribes each line (faster-whisper), prints its phonemes, pauses and words per minute. Transcription
  often just misspells ("Foote", British "door" heard as "doll"), so confirm with the phonemes before changing anything.
- Aim for about 130–155 wpm; slower for the central question. Split long lines rather than raising the speed.
- Known Kokoro artifacts, fixed in `pronounce` so captions are unaffected: a sentence-initial unstressed "If" gets a
  phantom /s/ (`"If you": "Iff you"`); a sentence-final /θ/ ("path.") becomes a hiss (`"in its parth"`, no final
  period). Names are often wrong (Descartes, Putnam, Nagel came out "dis-KARTS", "PUT-nahm", "NAY-jel"); respell them.

### 8.5 Known pitfalls
- `clay()` materials are shared: clone before changing colour or opacity.
- Transparent ghosts must not write depth; keep `ghostify` as is.
- `ui.label` offsets are in world units; inside a scaled group (a miniature world), scale the offset too.
- Interactables at the same floor position shadow each other (the nearest one wins, ties go to the first): give each
  its own spot.
- Tap-to-walk steering is simple: keep walkways clear around tables and counters, and check far sides are reachable.
- Two surfaces at the same depth flicker (z-fighting): a picture, sign or board on a wall or frame needs to stand at least
  3–5 cm proud of it, and a deck or rug a few centimetres above the ground it sits on. Check props don't run through each
  other (the melting-clock tree once went through the sky door).
- Never put a `//` comment in the middle of a line of code: everything after it on the line is silently dropped (it has
  hidden a door and two sheets of paper, and broken a whole level). Comments go at the end of the line.

