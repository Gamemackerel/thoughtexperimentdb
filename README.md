# Thought Experiment Database

**An art game about thought experiments.** You walk through a surreal house and step through paintings, books, doors
and clocks into short playable vignettes. There are four rooms. The first is after Escher and Dalí: the Trolley Problem,
Brain in a Vat, Plato's Cave and the Ship of Theseus. The hall is after Magritte: the Grandfather Paradox, the Infinite
Monkey Theorem, the Simulation Argument, the Fermi Paradox and the Tragedy of the Commons. The trolley room holds the
Footbridge, the Loop and the Transplant Surgeon. The gallery is after Picasso: the Ring of Gyges, the Prisoner's Dilemma,
Newcomb's Paradox, the Utility Monster, the Chinese Room and the Monty Hall Problem. You act, the world responds, and a
quiet narrator says a little about what you did. After each one there's a question for your journal, which also keeps
the original sources and video essays for going further.

## Play

```sh
tools/setup.sh     # once: npm install, the Python env for the voice (Kokoro) and the narration audit, model download
npm run play       # then open http://localhost:5173/game/   (?level=<id> jumps straight to a room or vignette)
```

Requires Node 20+. Voicing new lines also needs Python 3.10+ and ffmpeg.

How it's designed and made, and how to add a vignette: [GAME.md](GAME.md). Notes left in the game-over card's
"tell the builder" box land in `feedback.txt` (not committed); reports from AI playtesters are in `game/playtest/`.

## Repository layout

```
GAME.md                    design document and production guide (research, writing, voice, visuals, checks)
thought_experiments.xlsx   the catalogue and roadmap: every candidate, rated, with its sources and a video essay;
                           "In the game" marks the ones built so far
game/                      the game (layout in GAME.md §6)
  engine/                  the visual language: clay kit, frog, stage, overlays
  core/                    the runtime: player, camera, interactions, voice, notebook, journal, frog, asides
  house/                   the rooms of the house
  vignettes/               one module per thought experiment
  lines/ notebook/         narration and notebook data per vignette; journal.json
  assets/                  voice clips and paintings
  tools/                   dev server, voice rendering, automated playtests
tools/                     setup.sh, Kokoro TTS (kokoro/speak.py), narration audit (audit.py)
archive/films/             the two explainer films the project began with, and their production guide
build/                     generated screenshots and caches (not committed)
```

## Commands

```sh
npm run play                                        # the game at http://localhost:5173/game/
node game/tools/voice.mjs <id>                      # render a vignette's lines → game/assets/voice/<id>/
tools/kokoro-venv/bin/python tools/audit.py <id>    # narration audit: transcript, phonemes, pauses, pace
node game/tools/playtest-gallery.mjs [id] [alt]     # drive vignettes to their endings (also -hall, -variants, -trolley…)
node game/tools/shot.mjs <level> <name> [x z]...    # quick screenshots → build/shot-<name>-*.png
```
