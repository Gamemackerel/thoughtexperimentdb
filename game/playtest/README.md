# Playtest swarm

How the game gets playtested by many AI reviewers at once, and where their feedback ends up.

```
personas.md          the reviewer personalities (12) and how the game is split between them (2 parts → 24 playtesters)
brief.md             what every playtester reads first: the game, how to play, how to write feedback
raw/<session>.md     each playtester's own findings
FEEDBACK.md          the consolidated improvement list, by thought experiment, for the developer
```

## How it runs in parallel

1. **One game server** (`npm run play`) serves the game to everyone.
2. **One browser per playtester.** Each playtester drives its own headless Chromium through
   `game/tools/agentplay/play.mjs <session> …`. The first command starts a small daemon for that session
   (`build/agentplay/<session>/`: its own profile, so its own saves, and its own screenshots).
3. **Virtual time.** Each browser's clocks are replaced (`agentplay/clock.js`): the game is frozen between commands and
   only advances when the playtester waits, walks or holds a key. Frames in between are simulated without drawing,
   and only the frame you look at is rendered. So an AI that thinks for 30 seconds doesn't miss the trolley, a
   4-core machine can host two dozen sessions at once (they're idle while their agents think), and timing is the same
   as in the real game.
4. **Text as well as pixels.** Every command reports what a player would have heard and read since the last one
   (narration captions with timestamps, speech bubbles, prompts, labels, the game-over card) and any page errors,
   so the reviewers don't depend on catching the right frame.
5. **Coordinator.** The main session launches the playtesters as background agents with the persona, session name,
   part and output path, waits for all of them, then reads every `raw/*.md` and consolidates them into `FEEDBACK.md`.

## Pilot

Two pilot playtesters (`raw/pilot-calm.md`: trolley; `raw/pilot-bugs.md`: Fermi) validated the setup; their harness
notes led to `until`, `use`, `onscreen`, non-blocking `teleport`, and settling past the fade-in before the first frame
(so one pilot finding, an "abstract close-up first frame" in the house, was a harness artifact).

## Running it again

```sh
npm run play        # keep it running
# then, per playtester (agent or human):
node game/tools/agentplay/play.mjs <persona>-<part> open house
```

Launch prompt per playtester: "Read game/playtest/brief.md and follow it. Your persona is `<id>` in
game/playtest/personas.md. Session: `<id>-<part>`. Part: <room 1 | the hall> (<levels>). Write to
game/playtest/raw/<id>-<part>.md."
