# drama · the hall

## Summary
- The premises are well chosen and the writing is often lovely ("They left footprints, and went home", "none of them meant a word of it", "You could have stopped him, in a sense"). The simulation reveal (the giant face over your domed study) is the strongest dramatic moment in my part.
- The recurring structural flaw: the **question arrives after, or apart from, the choice**. Grandfather asks "what happens if you stop him?" after you've already tried; in Commons the question plays after you've rung the bell; in Simulation the choice after the reveal is never posed at all. Beat 3 (the held, silent choice) is missing from most of these vignettes.
- **No rewind, no twist, no replay acknowledgement** in any hall vignette: each is a single pass straight to the game-over card, and "Play again" repeats the identical opening. The five-beat template from GAME.md is really three beats here (arrive, act, card).
- Two vignettes **dramatise the opposite of their theory**. Monkeys make Shakespeare arrive in three tidy million-year steps (the real theorem is about unimaginable improbability). Commons makes the player the only defector, with neighbours who just copy you (the real tragedy has no villain).
- Consequences are rushed: meetings, collapses and recoveries flash by in 2–5 s before the card, so the image the player should leave with is never held.



## Findings
### hall
- **[minor] [narrative]** The hall's floating labels name every experiment in scholarly form ("Infinite Monkey Theorem", "Simulation Argument", "Tragedy of the Commons") as you pass (hall, 6.9–12.0 s). "Tragedy" in the label gives the commons' ending away before you step through the gate, and the textbook titles clash with pillar 4's plain voice, when the portals themselves (clock, typewriter, gate) tease so well.
  Evidence: hall walk at 6.9–12.0 s; shots/006-stack.jpg ("Tragedy of the Commons" over the gate).
  Suggestion: label portals with a plain teaser ("A town, long ago", "A room of typewriters", "A shared field") and save the proper name for the notebook and journal.
- **[polish] [drama]** The apple-faced gentleman's lines ("Everything we see hides another thing… We always want to see what is hidden by what we see.") are the best thematic overture the hall could have: every vignette beyond it is about what's hidden behind what you see. But he stands at the far end past all the portals, so most players meet him last or never.
  Suggestion: move him near the ladder hatch, so his line frames the hall on arrival.

### grandfather-paradox
- **[major] [pacing/arc]** The central question comes *after* the action, so the choice never gets its moment. On arrival the grandfather is already walking and every prompt (gate, signpost, tell him) is live; the stakes line "If they never meet, you are never born. So what happens if you stop him?" only fires when he reaches seg 3. In run 2 I had already closed the gate, turned the sign and been stepped around before the question was asked (gate 82.1 s, sign 92.4 s, question 98.8 s); it arrived as an afterthought. In the passive run it comes 10 s before "They meet" (52.6 s → 62.9 s), with no slow-down or silence, which cuts against GAME.md beat 3 ("time slows… long silence").
  Evidence: run 2 captions 82.6–104.0 s; run 1 52.6 s → 62.9 s.
  Suggestion: hold him (idle at his door, checking his watch) until the "see_gm" and "ask" lines have played. Only then let him set off, and slow him right down (like the trolley's crawl) once the question is asked, so the attempts happen *under* the question and not before it.
- **[major] [arc/twist]** There's no twist, rewind or second run. One pass of the walk leads straight to the game-over card, so the replay acknowledgement GAME.md asks for ("the narrator acknowledges whether you chose the same or differently") never happens: "Play again" starts cold with the same "The past. The town where your grandparents met." In the whole vignette each attempt fails once, the same way, with no escalation. A time-travel story is *made* of loops, and this is the one vignette where the rewind *is* the theory.
  Evidence: runs at 76.6 s and 146.1 s both open with the identical line; no line references a prior run.
  Suggestion: after "They meet" do the rewind *inside* the fiction: the clock hands spin back, you're at the time machine again, and the narrator says "Again." On the second loop the ordinary obstacles grow more pointed (the wind comes *before* you reach the gate; he recognises you: "Have we met?"). End after 2–3 loops or when the player walks away. Now it's a real self-consistency loop, not a single anecdote.
- **[major] [narrative bug]** The summary line "Wind, habit, a laugh." is fixed, so it lists failures the player never caused. In run 2 I never told him who I was, but it said "a laugh". In run 3 I never touched the gate, but it said "Wind". This tells the player the narrator isn't watching, which is the opposite of the vignette's point (everything you did was accounted for).
  Evidence: `tried_1` in game/lines/grandfather-paradox.json; runs at 111.2 s and 177.9 s.
  Suggestion: build the list from `S.attempts` (e.g. "The wind. His habit. A laugh." with only the ones that happened), or write short per-attempt summary lines.
- **[minor] [narrative bug]** "Go home" right after arrival lets the queued arrival line play in the middle of the reflection: "You came all this way, and changed nothing." → "That's your grandfather. Young, and in a hurry." → "Maybe that's the only story that works." It also claims "the only story that works" when the player never saw the story.
  Evidence: run 4, captions 195.2 / 198.9 / 202.7 s.
  Suggestion: clear the voice queue when the phase goes to `over`. Give the early exit its own line ("You didn't stay to see it. It happened anyway.") and not the "watched" pair.
- **[minor] [staging]** The payoff moment is too small. "They meet, just as they always did" plays over two tiny figures next to a bench at the far edge of frame, with no gesture (screenshot 012-t64.jpg). The meeting that your existence depends on reads as two pegs standing near each other.
  Evidence: build/agentplay/drama-hall/shots/012-t64.jpg.
  Suggestion: frame the meeting (the framer should include both of them and you), and give them one small beat, such as him lifting his hat and her standing up. The quiet tenderness is what gives "you could have stopped him" its weight.
- **[polish] [philosophy/drama]** The card line "You could have stopped him, in a sense. You just didn't." is the best writing in the vignette: it dramatises the "can in one sense, can't in another" answer without jargon. But it only appears on the card and is never voiced, and the voiced ending ("It was never going to un-happen") takes the harder fatalist line.
  Suggestion: voice the "in a sense" line as the final spoken beat, so the reflection ends on the tension and not on a verdict.

### infinite-monkey
- **[major] [philosophy/drama]** The scale, which is the whole drama of this theorem, is inverted. The run is fixed: 3 lever pulls = 3 million years → a full, clean "to be, or not to be, that is the question" on the page (t=91.9 s). One word appears after 1 M years, two after 2 M, then the line: a tidy staircase that makes the outcome feel *likely and near*. The real theorem is vertiginous because it's "certain given forever" *and* "never, in any time that means anything" (a single short line takes vastly longer than the age of the universe). The game's own walk-out card says the truer thing ("forever is much, much longer than it sounds"), so the "success" ending teaches the wrong lesson and the "giving up" ending teaches the right one.
  Evidence: `TARGETS[Math.min(waits,3)]` in game/vignettes/infinite-monkey.js; card "Three million years of noise, and then a line of Hamlet… It was simply bound to happen."
  Suggestion: make the counter escalate absurdly with each pull (a million → a billion → the sun burns out → the stars go dark → a number the counter can't show), with the pages still mostly noise ("A word." "Still just the word."). Let the line appear only after the player has kept pulling past the point where the universe has ended, and voice that: "The stars went out long ago. They're still typing." That makes the tension the player's own stubbornness, which is the real theorem.
- **[minor] [arc]** The central question lands before the player can do anything about it and then nothing tightens. The only choice is how many times to pull a lever, and the result is deterministic, so there's no suspense on the 2nd and 3rd reads (you can predict "two words" → "three"). The "Two words, in the right order." page doesn't highlight them the way the 1 M page highlights "the" (and that "the" is a substring of "theshxinms", which slightly cheats "a word").
  Evidence: shots/039-page.jpg; page at 79.7 s.
  Suggestion: add randomness to what shows up (sometimes a word, sometimes nothing: "Nothing. Again."), highlight every found fragment, and only count a word with spaces on both sides.
- **[minor] [narrative]** On the walk-out ending, the journal question still says "The monkeys typed 'To be, or not to be' without meaning it", which the player never saw.
  Evidence: card at 198.8 s.
  Suggestion: give the walk-out ending its own question (e.g. "Would you have kept waiting? What's the difference between 'it will happen' and 'it will happen to someone'?").
- **[polish] [pacing]** The bananas aside pushed the central question "Given forever, could they type Shakespeare?" back to after I'd looked in the crate (185.5 s joke → 189.9 s question), so the joke framed the question. Replay also re-plays the identical intro with no acknowledgement of the first run.
  Suggestion: let the ask line interrupt/pre-empt asides, and on replay open with a variant ("Back again. They never stopped.").

### simulation-argument
- **[major] [arc/philosophy]** The choice answers a different question from the one the scene asks. The whole build-up is about *probability and self-location* ("how many are real? And which kind is yours?", 65.4 s), and the reveal pays it off beautifully (giant face over your domed study, shots/049-t77.jpg). The choice that follows (switch off / leave running) is about *ethics toward the simulated* and is never posed: after the reveal the choose phase is silent (I idled 15 s at 85–100 s with no line). The player has to work out from prompts what the lever now means. Neither ending comes back to "which kind is yours?"
  Evidence: phases reveal 71.7 s → choose 80.3 s, no caption until the ending.
  Suggestion: voice a short choice line once `choose` starts ("They'll never know if you stop."). Then tie each ending to one horn of the notebook's trilemma, without jargon: switching off is the "almost nobody who could would choose to run them" branch ("If everyone did what you just did, there'd be almost no little worlds, and you'd probably be real."); leaving them running feeds the count ("One more world. The odds that yours is the first one just got worse."). Then the choice *changes the answer to the question*, and that is the argument's actual mechanism.
- **[minor] [stakes]** The simulated people are never made to matter before you're asked whether to switch them off. The zoom shows a blue figure at a desk and a teal one leaning against a house (shots/043-t53.jpg), but they don't look up, react or do anything individual, so "Switch them off" costs nothing emotionally.
  Suggestion: during the zoom, give one tiny person a small human act (hanging washing, waving at a child); on the second visit, have one of them look up at the dome. That mirrors the reveal and gives the switch weight.
- **[minor] [consequence]** "Switch them off" darkens your own study (strong, shots/053-t106.jpg), but it goes straight to the card: no hold, no rewind, and "Play again" restarts identically. GAME.md's gentle rewind ("then time rewinds and everything is restored") never happens, and the switch-off leaves the player in the dark.
  Suggestion: after "the lights flicker", let your lights come back up *on their own* ("Someone switched you back on."): a rewind that is also a twist.
- **[polish] [pacing]** Replay acknowledges nothing: same arrival line, and the player has to redo look → run more → reveal (~45 s) before the choice comes back.
  Suggestion: on replay, skip straight to choose with one line ("Back at the desk. They're still running.").

### fermi-paradox
- **[major] [arc/stakes]** Sending carries no risk before you do it, so the choice is weightless. The setup builds the puzzle well ("Billions of stars… Someone should have come by now. / So where is everybody?", 32–42 s). But nothing in the scene says why you might *not* call out, so "Send a message" vs "Keep listening" reads as "do the thing" vs "do nothing". The danger only shows up afterwards, as a hedge in send_2 ("or maybe they're listening too, and staying quiet") and in the journal question ("not knowing who, or what, might hear it"). Both endings then land on the same outcome (silence) within ~15 s, so the consequence doesn't differ.
  Evidence: runs at 22–93 s (listen) and 107–166 s (send); lines in game/lines/fermi-paradox.json.
  Suggestion: seed the unease *before* the choice with one environmental beat. For example, the logbook's last entry is "Heard something. Didn't answer." or, after "So where is everybody?", the static briefly falls completely silent ("Even the hiss stops, for a moment."). Then make the send ending linger differently from the listen one: after "Years pass", a faint regular blip appears on the screen for one beat and fades. It's ambiguous, but now you are *the one who spoke*.
- **[minor] [pacing]** The reflection line crams the whole answer-space into one breath: "Nights become years. Only static. Either they're rare, or they're quiet, or we're early." That's a menu of solutions read out, not a reflection on what the player did (GAME.md: "reflect on the player's journey"). And the second press of "Keep listening" ends the vignette immediately (80.8 s → card at 93.3 s), so the night-after-night time-lapse is ~12 s.
  Suggestion: split it into three lines that fall across the time-lapse as the sky wheels (e.g. year 1 "Maybe they're rare."; year 10 "Maybe they're quiet."; year 40 "Maybe we're early."), and let the lapse run ~25–30 s. The waiting then *is* the experience.
- **[polish] [pacing]** "Send a message" stays disabled until you've listened, and nothing says so; I walked to the lever at 110 s and got nothing for 20 s. The lever is lit and in frame from the start (shots/061-arrive.jpg), so it reads as available.
  Suggestion: hide or dim the lever until the ask line, or have it respond before listening ("Not yet. First, listen.").

### tragedy-of-the-commons
- **[major] [philosophy/drama]** The tragedy has a villain, and it's you. The neighbours only ever add sheep when *you* do (`// the neighbours copy you`, tragedy-of-the-commons.js:96). I idled 100+ s without adding: grass stayed at 1.00, nobody added a sheep, no line fired, and there was no ending and no frog (the cameo only starts once `adds >= 1`). The theory's force is that *nobody* has to be the bad one: each herder independently finds one more sheep rational, so ruin comes with no villain. The current build turns it into "monkey see, monkey do", a morality tale about starting it. It also leaves doing nothing, which the pillars call "always a real option", as a dead end.
  Evidence: state `{"grass":1,"adds":0}` from 110 s to 227 s; line "Your neighbours notice. They add sheep too." (47.0 s).
  Suggestion: after a short grace period, have a neighbour add a sheep *on their own* ("Your neighbour adds a sheep. It's their right."), then another. Now the player's restraint is costly (you're the only one not getting fatter sheep while the grass thins anyway) and the question "So why would anyone stop?" bites. Give restraint its own ending too: if you never add and never ring, the grass still goes. "You held back. It went anyway."
- **[major] [arc]** The resolution is available before the problem. "Ring the bell" is live from the first second. Ringing with an untouched pasture (227.8 s) plays "Together, you agree on limits" and a card saying "The grass came back", when it never left (grass 1.00 throughout). And the agreement costs nothing: the neighbours walk into the field, the line plays, the grass snaps back to 1.00 within about 4 s, and nobody objects. The cooperative solution works in real communities *because* people do the work of rules, watching and sanctions, and that friction is the drama.
  Evidence: run 2 state `recoverFrom: 1`; run 3 `recoverFrom: 0.58` → grass 1 by 302 s; shots/093-t238.jpg, shots/099-t304.jpg.
  Suggestion: enable the bell only once the grass is visibly thin (or have an early ring get "The neighbours come, look at the thick grass, shrug, and go home."). At the meeting, stage one visible cost: each herder, you included, leads a sheep back to the pen; one neighbour hesitates and is watched until they do. Recover the grass over a held 8–10 s wide shot, and make the card text depend on `recoverFrom`.
- **[minor] [pacing bug]** The central question lands after its answer. In run 3 I rang the bell at 283.9 s, the queued "Each extra sheep helps its owner… So why would anyone stop?" played at 284.3 s, and then "You ring the bell." at 290.6 s. The question arrived after the player had already answered it.
  Suggestion: drop the queued `ask` line when the phase leaves `graze`, or better, ask it before the bell becomes usable (see above).
- **[minor] [staging]** You aren't in "Together, you agree on limits". The four neighbours gather mid-pasture while the teal figure stays at the bell at the edge of frame (shots/093-t238.jpg).
  Suggestion: walk the player to the circle during `meeting` (scripted walk), so "you" is literally one of the people agreeing.
- **[minor] [consequence]** On the collapse ending, the card shows at the same moment as "The grass is gone. For everyone." (101.4 s), so the bare field is never held on screen. The wreck the player caused is the image the vignette should leave, and it's skipped.
  Suggestion: hold 4–6 s on the bare pasture (sheep standing still, a neighbour looking at you) before the card. Then do a gentle rewind: the grass grows back as the sheep un-add, which is also GAME.md's rewind.

### house / navigation (all hall vignettes)
- **[minor] [flow]** Esc mid-vignette (commons, 315.8 s) and "Back to the house" on every card (grandfather at 208 s, monkeys at 199.5 s) return you to the *first room* at (0, 5.5), never to the hall beside the portal you used. After a quiet ending, the pause before the next portal is spent walking back to the ladder and climbing it again.
  Suggestion: send hall vignettes home to the hall at their portal's spawn (`ctx.from`), as GAME.md describes.

### journal
- **[minor] [reflection]** The journal keeps only the *last* ending per vignette. I reached "It had already happened" twice and "You let it be" once, but it shows only "You left the past alone" (my last, throwaway early exit). The meaningful ending is overwritten by the least meaningful one.
  Evidence: journal at 321 s, Grandfather entry.
  Suggestion: list every ending reached (or at least keep the first and the most recent), so the journal reads as a record of the player's arc.

## Keep
- The simulation reveal: slow pull-back from the nested worlds to your study under a dome with a giant peg face above (shots/049-t77.jpg), and switching off darkening *your own* room.
- The monkey reflection "But none of them meant a word of it", plus its journal question about meaning without intention: it turns a probability puzzle into a question about meaning.
- Grandfather's ordinary obstacles (wind, habit, a laugh, "He steps around you, and apologises") and the card line "You could have stopped him, in a sense. You just didn't."
- Fermi's quiet asides: the cold tea, the logbook of "Nothing" every night, and the moon's "They left footprints, and went home."
- The commons neighbour "Mine are the fat ones. Don't tell the others." Self-interest seeded in one joke.
- Card texts that differ per ending, and the journal's to-do lists (Lewis's "you can, and you can't" matches the vignette's own card line).

## Harness notes
- `use "Tell him who you are"` in Grandfather chased the moving grandfather until the scene ended (20 s timeout). Waiting in place with `until` for the prompt worked.
