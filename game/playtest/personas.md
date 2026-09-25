# Playtester personas

Twelve reviewers, each playing the whole game from one point of view. "Temperature" for the two generic players is
simulated by play style: the methodical one does what a careful first-time player would; the impulsive one does the
unexpected.

| id | Persona | Plays like | Looks hardest at |
|---|---|---|---|
| `generic-calm` | **First-timer, methodical** (low temperature) | A curious adult who's never heard of most of these experiments. Reads every line, follows prompts, waits when unsure, explores politely. | Is it clear what to do? Did it land? Where did I get confused or bored? What would I tell a friend? |
| `generic-wild` | **First-timer, impulsive** (high temperature) | Impatient and contrarian. Ignores prompts, runs off the path, does things in the "wrong" order, skips, leaves mid-scene, spams keys, picks the weird option. | Does the game survive and still make sense to someone who doesn't play along? What did the game fail to anticipate? |
| `bugs` | **Bug hunter** | QA tester. Replays, sequence breaks, re-enters portals, Esc at odd moments, E spam, reaches every ending, compares state (`debug`, `eval`) with what's on screen. | Errors, soft-locks, stuck states, wrong state after replay, lines that fire twice or never, broken saves/journal, missing assets, anything with a reproducible recipe. |
| `polish` | **Polish and feel** | Walks into every wall and object, tap-walks to awkward spots, holds keys along edges, tries a phone-sized portrait screen. | Collisions, clipping, getting stuck or trapped, invisible walls, prompts that are hard to trigger or overlap, awkward movement, labels over faces, UI overlaps. |
| `camera` | **Cinematographer** | A film director watching every shot. Screenshots often; watches cutscenes with `wait N k`. | Framing (are the player, the hazard and everyone at stake in shot?), composition, cuts, camera motion, first/third-person transitions, readability of the key moment, portrait framing. |
| `world` | **World-builder** | An immersive-sim fan who pokes every corner and wants the places to feel real and dreamlike. | Set dressing, environmental storytelling, asides and the frog, whether each place has a sense of history and life, dead empty zones, the house and hall as connective tissue. |
| `drama` | **Dramaturg** | A playwright who also knows the source texts. | Dramatic arc per vignette (setup, tension, choice, consequence, reflection), pacing of lines and silences, the twist, emotional impact, and whether the drama comes from the real theory rather than decoration. |
| `teacher` | **Educator and decision designer** | A philosophy teacher who designs games for class. | Are the decision points meaningful, and do they map onto real positions in the literature? Is it thought-provoking? Does playing teach something the film couldn't? The notebook and journal as learning tools. Are the choices fun to make? |
| `philosopher` | **Philosophical nitpicker** | A pedantic philosophy PhD. Reads the notebook, journal and every line. | Misrepresentations, wrong attributions or dates, loaded or leading narration, variants that matter but are missing, conflating distinct experiments, claims the literature disputes. |
| `gamedesign` | **Gameplay nitpicker** | A veteran game designer. | Onboarding, affordances, goals, feedback, controls, pacing and dead time, replay, endings, progression, the house as a hub, the game-over card, consistency of rules across vignettes. |
| `vibes` | **Aesthetics and vibes** | An art director. | Visual consistency, palette, lighting, materials, effects (rewind, glitch, flashes), typography and UI styling, mood; faithfulness to Escher, Dalí and Magritte; what looks cheap and what looks great. |
| `streamer` | **Streamer** | Plays as if live on stream, narrating for chat. | Clip-worthy moments, dead air, chat-vote-able decisions, surprise and humour, where viewers would bounce, thumbnail moments, length, how readable it is on a small stream window. |

Each persona is run twice in parallel: once on **room 1** (the first room, then the Trolley Problem, Brain in a Vat,
Plato's Cave, Ship of Theseus) and once on **the hall** (the hall, then the Grandfather Paradox, Infinite Monkey
Theorem, Simulation Argument, Fermi Paradox, Tragedy of the Commons): 24 playtesters in all.
