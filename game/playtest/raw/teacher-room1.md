# teacher · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
- I'd use this in class. The four vignettes turn a chalkboard example into a short, embodied choice, and the journal questions are good seminar prompts. Cave and Ship are the strongest "play teaches something the film can't" moments: you do the climbing, and you swap the planks yourself.
- The weakest part, as decision design: in three of the four vignettes, the ending choice is available before the player has met the problem. The bench (Vat) and "Sit back down" (Cave) work from the first second, and one E press ends the game before any doubt or discovery. A curious student will end the lesson by accident.
- The narration in the Trolley Problem drops its most important teaching line on replays. Any student who stays first never hears that pulling makes the one person a victim. The "put it back" case, a rich variant, is also narrated wrongly.
- Two vignettes lean towards one answer. The Ship's new-plank ending asserts continuity ("Its story didn't [change]") while the old-plank ending only asks a question. The Brain in a Vat stages the sceptic's scenario, and Putnam's reply only appears in the notebook.
- The notebook and journal are almost good learning tools. For Trolley and Vat, the notebook still describes "this short film". It doesn't link what you just played to the literature, and it doesn't pause the scene. The journal keeps only your latest ending and answer, so a student's change of mind (the thing a teacher most wants to see) is lost. You also can't export it.
- Every ending in my part was reached: Trolley (three runs · chose yourself), Vat (no way out · stayed), Cave (kept watching · stayed in the light · went back), Ship (new · old). I entered each vignette through its house portal and played each at least twice.

## Findings

### trolley-problem
- **[major] [philosophy/narrative]** The cost of pulling is only spoken if pulling is your first choice. Run 1 was stay and run 2 was pull. I heard "You pulled the lever. The five are safe." + "This time you chose the other way. Most people feel the pull of both." `pulled_2` ("But the one on the side track was never in danger, until you moved the trolley.") never plays, because runs ≥2 replace line 2 with `again_same`/`again_diff` (`afterRun`, trolley-problem.js ~l.198). The same happens to a pull-pull player on run 2 ("The same choice again. It seems clear to you."). So the doing/allowing asymmetry, the core of Foot and Thomson, depends on which order you play in.
  Evidence: t≈111–115s (stay→pull), t≈1026–1029s (pull→pull).
  Suggestion: always play `<choice>_2` the first time that choice is made, then the again-line. Or merge the two: "You pulled it this time. The one on the side track was safe until you did."
- **[major] [philosophy]** Pulling the lever and then putting it back is narrated as "You left the lever alone. The trolley stayed on its track." That is false, and it's a missed teaching moment. Actively returning the trolley to the five is a well-known variant: is undoing a rescue the same as never trying? "Should you pull it?" was also voiced *after* I had already pulled and put it back.
  Evidence: t≈174–214s, `use pull the lever` → `use put the lever back`.
  Suggestion: track `touched`. If the final route is main but the lever was moved, say something like "You moved it, then moved it back. The five were yours to save for a moment." Skip `ask` once the lever has been touched.
- **[major] [decision design]** The journal question is about the footbridge ("wouldn't push someone off a bridge… Is there a real difference?"), but the player never meets a footbridge. It's the best question in the game, and it's asked about a case the player has to imagine. I answered in character: "I only played the lever, so I'm guessing about the bridge." The same question also appears after the self-sacrifice ending, where it fits poorly.
  Evidence: game-over card for both endings (shots/012-over.jpg).
  Suggestion: add a footbridge as a playable variant. For example, after the third run, a figure on a bridge over the main line with a "Push" prompt that you can refuse, then ask the question. If that's too big, make the question ending-aware: after "You chose yourself", ask Thomson's 2008 question: "If you wouldn't take the hit yourself, may you make someone else take it?"
- **[minor] [philosophy]** The self-sacrifice ending is presented as the climax ("You chose yourself", big title card), and the three-runs ending sounds like a shrug. Thomson's 2008 point is that you *aren't* required to sacrifice yourself, which is why she doubted you may turn the trolley onto someone else. Pupils will read the self-sacrifice as the "right answer".
  Suggestion: add one non-judgemental line after `self_end`, e.g. "Nobody could have asked this of you. Could you have asked it of the one?"
- **[minor] [decision design]** Leaving through the frame in the middle of a run has no consequence. I walked out during the slow phase on run 3 and went straight to the house, without seeing the trolley or hearing a line. "Walking away" is a real position (GAME.md even writes a line for it), and the game drops it.
  Evidence: t≈1033–1036s.
  Suggestion: if you step through the frame while the trolley is moving, hold for 3 s on the trolley reaching the five and say "You walked away. It didn't." before the house loads.
- **[minor] [pacing]** The gap between the reflection and the next run is only about 4 s after run 2. The trolley was already creeping before I had taken in "Most people feel the pull of both", and a student reading the notebook or just thinking loses the next choice.
  Evidence: `again_*` at 1029.5s → phase slow at 1033.3s.
  Suggestion: wait for the player to move or press something before the next run, or allow at least 8–10 s of silence.
- **[minor] [notebook]** The notebook says "This short film walks through Foot's original driver case…". In the game there is no film. It mentions "Thomson's surprising change of mind in 2008" but doesn't say that the third track *is* that case. The notebook doesn't pause the scene either: while I read it, the arrive phase ran into the slow phase behind it.
  Evidence: shots/013-notebook.jpg; t 167→172s the phase changed to `slow` with the notebook open.
  Suggestion: write a game version of the blurb that maps each thing you did to its source ("The lever: Thomson's bystander (1976/85). The third track: Thomson 2008."). Pause `ctx` time while the notebook is open.
- **[polish] [narrative]** The discovery lines play on a timer, not by proximity. "Five people, working on the track. They can't hear it coming." played while I stood at the lever about 20 m away.
  Evidence: t≈180s, 937s.
  Suggestion: fine as a fallback, but let the fallback say "Further down the track, five people…" when you aren't near them.

### brain-in-a-vat
- **[major] [decision design]** The "stay" ending is available before there's anything to stay *despite*. The bench is about 4 m from the spawn and "Sit down" is enabled from t=0. I sat 9 s after arriving and got "You stayed · You never found out whether the sun was real", but I had never seen an edge or had any reason to doubt. Sitting down is exactly what a curious player tries first.
  Evidence: replay at t≈388–410s.
  Suggestion: before `edgeSeen`, make sitting a rest that doesn't end the game ("You sit. The sun is warm." then you can stand up again). Only make it an ending once doubt exists.
- **[major] [narrative/bug]** The central question never played for me. `ask` ("If none of this were real, how would you ever know?") is queued after `edge`. I stepped off about 3 s later, and the `fall` line cut it out of the queue. A decisive player skips the whole question of the vignette.
  Evidence: t 305.6s edge caption → 308.9s step off; `ask` never appeared in the log.
  Suggestion: keep "Step off the edge" disabled until `ask` has finished, or play `ask` during the fall.
- **[major] [philosophy]** The vignette stages the sceptic's regress (vat above vat) and ends with "You can only ever check the world with the world". The notebook and journal, though, say the point of the brain in a vat is Putnam's *reply*: that you couldn't even coherently think it. Play and notebook disagree, and a student will leave believing the sceptic won. "Somewhere in here is that tree" (the machine aside) is the only hint of the reply, and it's optional.
  Suggestion: add one beat for the reply. For example, in layer 1, "Look at the tree" is available on the floating world above: "Your word 'tree' was always about these. Were you ever wrong about trees?" Or make the machine line compulsory before the second edge.
- **[minor] [decision design]** Layers 1 and 2 have no "stay" option. Once you're in the lab, the only action is to step off again, so a player who wants to say "this lab is real enough" can't. The "no way out" ending feels forced rather than chosen.
  Suggestion: put a stool or a chair in the lab with the same "stay" ending and its own line ("This will have to do.").
- **[minor] [journal]** "Would it matter to you whether your world was real?" is the experience-machine question, not the vat question. It's still a good class prompt, but it doesn't match the to-do list (Descartes → Putnam).
  Suggestion: keep it, and add a second, optional question: "Could you even say 'I'm a brain in a vat' and mean it?"
- **[minor] [notebook]** Again it says "This short film traces the idea…".
  Suggestion: same fix as for the Trolley Problem.

### platos-cave
- **[major] [decision design]** The "keep watching" ending sits under your feet at the moment of freedom. When the chains loosen, "E Sit back down" is already showing, because you are on the seat. I pressed E 0.2 s into freedom and got "You turn back to the wall. The shapes are familiar. It's easier." + "You kept watching". I had never turned around, so the line is also false.
  Evidence: replay 2, t 562.9s → 563.1s.
  Suggestion: enable "Sit back down" only after the player has turned (yaw past ~90°) or moved off the seat. Then the choice to stay means refusing something you've seen.
- **[minor] [clarity]** After "Your chains have come loose" nothing invites you to turn. I stood for about 45 s facing the wall before trying A/D. In first person with a wall filling the screen, many students won't realise they can turn at all.
  Evidence: t 438→482s.
  Suggestion: after about 8 s idle, a soft light flicker or crackle from behind, or a brief shadow of *your own* figure on the wall.
- **[minor] [interaction]** The "Tell them" prompt (radius 3.6 at z −1.4) swallows the prisoners' "Talk" prompts. I walked up to a prisoner to talk before deciding, pressed E, and triggered the "You went back" ending by mistake. The big decision fired through a small curiosity.
  Evidence: t≈532s at (−3.2, −1.6).
  Suggestion: when "Tell them" and "Talk" overlap, prefer "Talk", or put "Tell them" only at the centre seat with a small radius.
- **[minor] [philosophy]** Once you've come back down, the only option is "Tell them" ("Sit back down" is disabled when `returned`). Going back and staying silent is a real, discussable position (and Socrates' fate hangs over it).
  Suggestion: allow sitting back down after returning, with its own ending ("You came back, and said nothing.").
- **[minor] [narrative/bug]** The lines queue behind a player who walks briskly. "A path leads up, towards a light." and "It's too bright to look at." played *after* I was already outside. When I sat under the tree before `choose` finished, the order was "You stay in the light." → "You could stay up here. Or go back down, and tell them." → game over.
  Evidence: replay 3, t 598–612s.
  Suggestion: when the location changes, clear the lines that belong to the previous location. Enable "Sit under the tree" only after `saidChoose`.
- **[idea] [philosophy]** The ascent is instant: "too bright", then a cut to full daylight. Plato's own stages (shadows, then reflections in water, then things, then the sun) are the heart of his theory of education. The pond aside ("Your reflection. Another kind of shadow, but this one looks back.") is a lovely nod, but it's optional.
  Suggestion: make the outside fade in over about 20 s. Let the pond be the first thing you can see clearly, then the trees, and let the sun become lookable last. That turns the Divided Line into something you play.
- **[minor] [journal]** "Think of something you once believed completely and later saw differently… did you try to tell anyone?" is excellent for class, but it's asked after "You kept watching" too, where the player never saw differently.
  Suggestion: after that ending, ask "Is there something you'd rather not look at too closely? Why?"

### ship-of-theseus
- **[major] [philosophy]** The two endings are unequal. The new ship gets an assertion: "Its parts changed. Its story didn't." / "it never stopped being the ship that sailed." The old wood gets a question: "But is the ship?" / "Whether that makes it the same ship is the question." The narration takes the continuity side, against its own rule ("Never tell the player they were right"). There's also no third answer (both, neither, "it depends what you mean by 'same'"), which is where most class discussions end up.
  Evidence: t≈781s and 907s.
  Suggestion: give both endings the same shape, one fact plus one open question. For example: new ship: "The same voyage, not one plank of it. Is a ship its story?" / old wood: "Every plank that ever sailed. Is a ship its wood?" Consider a third action, "Stay on the dock" → "Maybe 'the same' means two different things here."
- **[minor] [decision design]** You can't mark the moment it stopped being the same ship. The sorites question ("after how many planks?") is the first half of the puzzle, but you must replace all six before any choice. Swaps 4 and 5 are silent chores, with no line or reaction.
  Suggestion: let the player board or "call it a different ship" at any point. Or at 4/6, have the shipwright ask "Still the same?" and let the player's next action (keep working / stop) count.
- **[minor] [interaction]** The two boarding prompts sit 1.8 m apart with radius 2.4 each. Standing between the boats, only "Board the ship of new planks" showed. I had to walk to the edge of the dock (z≈1.4) to get the old-planks prompt, so the default nudges you to the new ship.
  Evidence: t 855–905s. `use board the ship of old planks` timed out at (15.1, −0.1).
  Suggestion: split the prompts to opposite sides of the dock, or show both as two separate prompts at the midpoint.
- **[minor] [narrative]** The first line names the hero: "The ship of Theseus." The pillars say no names in the voice.
  Suggestion: "An old ship. Its wood is getting old." or "A famous old ship…". The house label already names it.

### house / journal / cross-cutting
- **[major] [journal/learning]** The journal keeps only the latest ending and a single answer per vignette. My Trolley entry shows "You chose yourself", and my three-run ending and my stay/pull/stay sequence are gone. On replay, the game-over box is prefilled with the old answer (under "You sailed the old wood" I saw my earlier answer defending the repaired ship). For a teacher, how an answer changes over replays *is* the learning, and there's no way to hand the journal in.
  Evidence: shots/047-journal-full.jpg. Ship game-over card at t≈914s.
  Suggestion: store an entry for each playthrough (date, ending, the choices in each run, answer), shown as a small history under each vignette. Add a "Copy / print my journal" button. Start with an empty answer box on replay, with the previous answer shown above it for comparison.
- **[minor] [bug]** Leaving a vignette with Esc doesn't stop its script. After I left the cave during the intro, the cave's "Shapes pass by…" caption played in the house. Later, in the Ship of Theseus, the console logged `missing line loose`: the cave's timeline was still running.
  Evidence: t 623.3s (house), about 650s (ship): `console.warn: missing line loose`.
  Suggestion: cancel the vignette's `ctx.wait` chain and voice queue in `dispose()`, for example with an abort token checked after each await.
- **[idea] [teaching]** Nothing across the vignettes invites comparison. A teacher would love the game-over card or journal to show "what other players chose". It could be local only, e.g. the class sharing one machine or a class code, and it would suit a decision-design class exactly.
  Suggestion: an optional tally on the game-over card ("On this computer: 7 pulled, 3 stayed"), off by default.

## Keep
- The Trolley Problem's third track and self-lever: a faithful, playable version of Thomson 2008, and it's irrevocable (you step onto the track), which makes it feel weighty.
- Talking to the workers in slow motion ("Loooveeelyyy daaayyy…"): it shows you can't warn them without a line of explanation.
- The Brain in a Vat reveal: your world floating over the jar (shots/021). It's the image students will remember.
- The Cave's first-person camera until daylight, and "They laugh. The climb has ruined your eyes": gentle and faithful.
- The Ship of Theseus asides: the shipwright ("I kept every one. Seemed a shame to burn them.") and the fisherman's grandad's rod ("New line, new reel, new handle."). This is the grandfather's-axe variant, and it made me doubt my own answer, which is exactly what the game should do.
- Journal questions phrased as "what do you think, and why?", and the to-do lists that point to the primary sources.

## Harness notes
- `use board the ship of old planks` couldn't get the prompt standing between the two boats (the prompts overlap). Walking to (16, 2.5) and pressing E worked. This is probably the game issue reported above, not the harness.
- `use Open the door` in the house picks the nearest door. From the cave's spawn point it re-entered the cave instead of the sky door, so walk near the target first.
