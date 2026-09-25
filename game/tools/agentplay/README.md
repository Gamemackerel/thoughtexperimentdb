# agentplay: play the game one command at a time

A command-line way to play the game in a headless browser, for AI playtesters (or a human at a terminal).
The game runs on a **virtual clock**: it is frozen between your commands and only moves when you let time pass.
Thinking between moves costs nothing. Nothing happens unless you `wait`, `walk` or `hold`.

Needs the game server running (`npm run play`). Every command is:

```sh
node game/tools/agentplay/play.mjs <session> <command> [args...]
```

`<session>` is your own name (e.g. `bugs-room1`). Each session is its own browser with its own saves; screenshots
go to `build/agentplay/<session>/shots/`. Open them with your image reader to see the game. Every command prints
the game time, where you are, what happened since the last command (narration captions, speech bubbles, prompts,
labels, level changes, `phase` changes of the level's state) and all the text on screen now, plus any errors.

| Command | What it does |
|---|---|
| `open [level] [WxH]` | Start (or restart) the game. `level`: `house` (default: the first room), `title` (stay on the title screen; then `clicksel #begin` to enter the house), or a level id: `hall`, `trolley-problem`, `brain-in-a-vat`, `platos-cave`, `ship-of-theseus`, `grandfather-paradox`, `infinite-monkey`, `simulation-argument`, `fermi-paradox`, `tragedy-of-the-commons`. `WxH` sets the screen size (default `1280x720`; e.g. `390x844` is a phone in portrait with touch). Takes a screenshot. |
| `look [label]` | Screenshot now (no time passes). |
| `status` | Text only, no screenshot. |
| `wait <sec> [shots]` | Let `sec` seconds of game time pass. With `shots`, take that many evenly spaced screenshots along the way (e.g. `wait 12 4` to watch a scene). |
| `until <what> [max]` | Let time pass until something happens (max 60 s by default): `phase` (the level's phase changes), a phase name (e.g. `until slow`), `caption` (the next narration line), `prompt` (an interaction prompt appears), `over` (the game-over card), `level` (a new level loads), or any JS condition. Better than a long `wait` when you don't want to skip past a moment. |
| `use <prompt text>` | Walk up to the interactable whose prompt contains that text (e.g. `use pull the lever`) and press E once its prompt shows. Quicker than aiming clicks; still try clicking and walking yourself sometimes, since that's how players do it. |
| `walk <x> <z> [max]` | Walk to world position (x, z), the way tap-to-walk does (steering around obstacles). Stops on arrival, when blocked, or after `max` seconds (default 15). Says whether you arrived. |
| `hold <keys> <sec>` | Hold keys for `sec` seconds of game time, e.g. `hold w 1.5`, `hold w+d 0.8`, `hold left 0.5`. Movement is camera-relative (first person: A/D turn, W/S walk). Good for testing collisions and feel. |
| `press <key>` | Press a key once: `e` (interact), `space`, `enter`, `n` (notebook), `esc` (leave vignette; the confirm dialog is accepted automatically), or any key name. |
| `click <x> <y>` | Click/tap a screen pixel (same coordinates as the 1280×720 screenshot): on the ground it walks you there; on the prompt it interacts. |
| `clicksel <css>` | Click an element, e.g. `clicksel "#over [data-act=again]"` (Play again), `clicksel "#over [data-act=home]"` (Back to the house), `clicksel "#journal .close"`. |
| `type <text>` | Type into the focused text box. To answer the journal question on the game-over card: `clicksel "#answer"` then `type ...`. |
| `drag <dx> <dy>` | Drag across the screen (look around in first person). |
| `debug` | Status plus the level's hidden map: every interactable (prompt text, position, radius, distance, enabled), trigger areas and the spawn. Use it when you're lost. (Being lost is itself feedback: say where and why.) |
| `onscreen <x> <y> <z>` | Where a world point appears on screen right now, and whether it's in frame (for framing checks). |
| `walkable <x> <z>` | Whether that point is walkable ground. |
| `teleport <level>` | Jump straight to a level (the game's own `goto`). |
| `eval <js>` | Run JavaScript in the page and print the result (promises aren't awaited: the clock is frozen) (`window.__ted` has `ctx`, `player`, `interact`, `level`; `level.__S` is the level's state). |
| `quit` | Close your browser session. If a session ever hangs, `open` again restarts the page; as a last resort, kill the `server.mjs` process for your session and delete `build/agentplay/<session>/port`. |

Notes:
- Audio is muted: narration shows up as `caption:` lines (the words and their timing are exact). CSS fades are instant.
- Screen positions in screenshots match `click` coordinates. World positions (x, z) are what `walk` takes and what
  `status` reports for you.
- In the real game the clock doesn't stop, so a player who hesitates or wanders lets scenes play on. Use `wait` to
  act the way a real player would: when a real person would stand and watch for 10 seconds, `wait 10`.
