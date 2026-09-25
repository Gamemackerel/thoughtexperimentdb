# Playtest brief (read all of this first)

You are one playtester in a swarm. Each playtester plays the same game from a different point of view, and your
feedback will be merged with everyone else's into one improvement list for the developer. Stay in your persona: your
value is the perspective the others won't have. But if you trip over something important outside your lens, report it.

## The game

*Thought Experiment Database* is an art game in the browser (Three.js): you walk through a surreal house (an
Escher/Dalí first room, a Magritte hall) and step through paintings, books, doors and clocks into short playable
vignettes of famous thought experiments. Pillars: you are the teal figure; act, don't answer (no menus); slow and
authored; plain, not academic (no names in the narration, scholarship only in the notebook `N` and the journal);
consequences are real but gentle, then rewind. Each vignette ends with a game-over card with a journal question.

Read `GAME.md` (the design document) before playing, so you can judge the game against its own intentions.
For your part of the game, you may also skim the vignette code in `game/vignettes/<id>.js`, its lines in
`game/lines/<id>.json`, notebook `game/notebook/<id>.json` (or the film's `experiments/<id>/script.json`) and
`game/journal.json`, but **play first**: your first impressions as a player are the most valuable thing you have.

## How to play

Use the command-line player described in `game/tools/agentplay/README.md` (read it). The game server is already
running; don't start or stop it. Use your own session name (given below) for every command. Open screenshots with
your file reader to actually look at the game. Screenshot at meaningful moments (arrivals, choices, consequences,
anything odd), not every step. The clock is frozen between commands, so pace yourself the way a real player would
(`wait` when they'd watch; don't skip the silences if silences are what you're judging).

Play each vignette in your part **at least twice**, and reach every ending you can (the endings are listed in
`GAME.md`). Enter each one from the house/hall portal the way a player would at least once, and return through the
game's own ways out. Try the notebook (`N`) and the journal where your persona cares. On the game-over card, you may
answer the journal question in character, but **leave the "Tell the builder" box empty** (your feedback goes in
your file instead).

Don't edit any file in the repository except your own feedback file. Don't commit. If the harness itself misbehaves
(not the game), note it in a short "Harness notes" section and work around it.

## What to write

Write your feedback to `game/playtest/raw/<your session name>.md`, in this format:

```markdown
# <persona> · <part>

## Summary
3–6 bullets: your overall verdict from your perspective.

## Findings
### <level id>            (one section per level you played: house, hall, trolley-problem, …)
- **[severity] [category]** What you observed (what you did → what happened; be concrete).
  Evidence: game time / position / screenshot path / error text.
  Suggestion: a concrete change the developer could make.

## Keep
What works and must not be lost in the next iteration (short).

## Harness notes
(only if any)
```

Severity is one of: `blocker` (breaks play or progress), `major` (seriously hurts the experience or misrepresents the
philosophy), `minor`, `polish`, `idea` (a new thing to add). Category is free (e.g. bug, collision, camera, narrative,
philosophy, pacing, clarity, visual, streaming).

Quality bar: every finding must come from something you actually saw or did (or read, for text), be specific enough to
act on without you, and include a suggestion. No padding, no generic praise, no duplicates. Twenty sharp findings
beat sixty vague ones. Write the file incrementally as you go (so nothing is lost), and polish it at the end.

When you're done, `quit` your session and reply with just the path to your file and your 3 most important findings.
