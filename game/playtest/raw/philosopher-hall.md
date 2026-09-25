# philosopher · THE HALL (hall, grandfather-paradox, infinite-monkey, simulation-argument, fermi-paradox, tragedy-of-the-commons)

## Summary
(in progress)

## Findings
### hall
- **[major] [navigation]** "Back to the house" on every hall vignette's game-over card drops you in the *first room* at (0.0, 5.5), not beside the portal you used in the hall. You have to climb the ladder again and walk the hall every time.
  Evidence: grandfather-paradox → Back to the house at t=325 → `level=house you at (0.0, 5.5)`; same from infinite-monkey at t=509. GAME.md §3 "New rooms" says rooms should give a spawn for `ctx.from` so players come back beside the portal.
  Suggestion: route `home` from a hall vignette to `hall` with `ctx.from=<vignette id>` (the hall already has per-portal spawns), or relabel the button "Back to the hall".
- **[minor] [controls]** Pressing Esc in the hall (to close the notebook, which the hall doesn't have) silently took me down to the first room with no confirm. Esc is documented as "leave a vignette"; the hall isn't one.
  Evidence: t=52.3 in hall → `press n`, `press esc` → t=52.9 `[level loaded: house]`.
  Suggestion: make Esc a no-op in the hub rooms (or at least confirm), and have N show something in the hall (e.g. a one-line note on Magritte) instead of nothing.
- **[polish] [attribution]** The apple-faced gentleman says, verbatim, Magritte's own remark about *The Son of Man* ("Everything we see hides another thing, we always want to see what is hidden by what we see"). It's a good line, but it's an unattributed quotation in a game whose rule is "quotes and names live in the notebook", and the hall has no notebook to credit it.
  Evidence: hall, Talk at (14.4, 1.3), bubbles 2 and 3 (t=42.5, t=45.7).
  Suggestion: give the hall a notebook page (N) listing the Magritte works it quotes (The Son of Man, The Treachery of Images, Golconda, Time Transfixed, The Human Condition, Not to Be Reproduced, The Listening Room, Personal Values, The False Mirror) with that quote credited; the label "Ceci n'est pas une pipe" is already on the wall.
- **[polish] [labels]** The house label reads "Up to the hall" but the prompt reads "Climb the ladder", and the hall's portals are labelled with the experiment name while their prompts say "Open the clock / Sit at the typewriter / Look into the screen…". Fine for players; for the notebook-minded it would help if the label and prompt agreed (e.g. label "The Grandfather Paradox", prompt "Open the grandfather clock" — the pun is the point of the portal).

### grandfather-paradox
- **[major] [philosophy]** The setup line never states the paradox. "If they never meet, you are never born. So what happens if you stop him?" gives only half the loop. The paradox is the second half: if you're never born, you never travel back, so nobody stops him, so they meet, so you are born… Without it, the scenario is just "can you change the past?", and the endings read as fate rather than as a resolution of a contradiction.
  Evidence: caption `ask` at t=113.9 (game/lines/grandfather-paradox.json).
  Suggestion: e.g. "If they never meet, you're never born. And then who came back to stop him?" (still plain, no names).
- **[major] [philosophy]** The narration picks one resolution and asserts it as fact: "It had already happened. It was never going to un-happen." / "Maybe that's the only story that works." That is the Lewis/Novikov self-consistency view. The other main answer in the literature (branching or many-worlds timelines: you *can* stop him, in another history; Deutsch 1991) is absent from the voice, the notebook and the journal. The game-over text "You could have stopped him, in a sense. You just didn't." captures Lewis well, so the voice lines contradict their own card by saying it "was never going to" happen.
  Evidence: tried_2 at t=184.3; watched_2 at t=131.6; notebook text (only Barjavel + Lewis).
  Suggestion: soften tried_2 to something that leaves the question open ("Or maybe, somewhere else, it did.") and add a notebook paragraph on branching-timeline and self-consistency (Novikov) replies, with the SEP §§ on them.
- **[major] [philosophy]** The journal to-do paraphrases Lewis backwards: "He says you can, and you can't, at the same time." Lewis's whole point is that there is *no* contradiction: "can" is relative to which facts you hold fixed. Relative to Tim's gun and skill he can; relative to the fact that Grandfather survived he can't. The notebook text gets it right; the journal line reads as if Lewis embraced a contradiction.
  Evidence: game/journal.json `grandfather-paradox.todo[0]`; journal page in first room at t=359.
  Suggestion: "He says you can, in one sense, and can't, in another — and that both are true."
- **[minor] [history]** The notebook says the puzzle "appears in" Barjavel (1943). Fine, but the journal says it's "usually traced to" him; the killing-your-ancestor story is older in pulp SF (letters in *Amazing Stories* 1929; Nathaniel Schachner, "Ancestral Voices", 1933). Also, in Barjavel the traveller accidentally kills an ancestor (not his grandfather, and not to stop a meeting).
  Suggestion: "often traced to Barjavel (1943), though earlier pulp stories had the idea".
- **[minor] [philosophy]** The classic paradox is killing your grandfather; here it's stopping a meeting. That's a good gentle adaptation, but it quietly removes the sharpest version (an act that *can't* be undone for ordinary reasons, like a shot missing). The four attempts are all ones that obviously might fail anyway; the "ordinary reason" point lands less when the obstacles are this weak.
  Suggestion: add one strong attempt (e.g. lock the gate with the key from the paper stand) that fails for a stranger ordinary reason (the key slips, a bird, you trip), which is exactly Lewis's banana-peel example.
- **[minor] [pacing]** The central question is voiced on a timer (t≈14 s after arrival) and the scene ends ~10 s later if you only watch. In run 2 I'd closed the gate and turned the sign *before* the narrator asked "So what happens if you stop him?", so the question arrived as a non-sequitur.
  Evidence: run 2: gate_fail t=153, then `ask` t=165, sign_fail t=170.
  Suggestion: skip `ask` if the player has already tried something, or fire it when the player first approaches the gate/grandfather.
- **[minor] [bug]** "Stand in his way" is counted as an attempt when you merely walk near his path (to turn the sign or talk to him), so the card says "You tried 3 ways" when I chose two. For a vignette about agency, the game shouldn't count things I didn't choose.
  Evidence: run 2 → "He steps around you, and apologises." after walking to the sign; card "You tried 3 ways". Run 4 same after telling him.
  Suggestion: only count block when the player stands still on the route for ~1 s, or name it ("You got in his way").
- **[minor] [bug]** Leaving immediately via "Go home" plays the intro line in the middle of the ending: "You came all this way, and changed nothing." → "That's your grandfather. Young, and in a hurry." → "Maybe that's the only story that works."
  Evidence: run 5, t=312–320.
  Suggestion: cancel the intro async on `end()`.
- **[minor] [philosophy]** Leaving at once gets the same reflection as watching ("Maybe that's the only story that works"), which the player has done nothing to earn: they never tested whether the past could change.
  Suggestion: a separate line for left-early, e.g. "You didn't try. So you'll never know." (the title "You left the past alone" is already right).
- **[minor] [harness/gameplay]** `use "Tell him who you are"` from the spawn chased him for 20 s without the prompt ever appearing; I had to pre-position at the gate. A player who spends the opening lines looking around may find he's already past the only place to tell him.
  Suggestion: let him pause at the fountain once, or make the prompt radius larger.
- **[polish] [journal]** The journal only keeps the last ending ("You left the past alone") and loses "It had already happened". For a vignette with two very different endings, keeping the list of endings reached would be kinder.
- **[polish] [notebook]** SEP "Time Travel" appears twice (under WHERE IT COMES FROM and READ).

### infinite-monkey
- **[major] [philosophy/maths]** The scale is wrong by dozens of orders of magnitude, which undoes the lesson the notebook states ("a lesson about how unimaginably long forever would have to be"). After 1 million years the page shows one word ("the"); after 2, "to be"; after ~3 million years, the full 39-character line "to be, or not to be, that is the question". With ~30 keys, a specific 39-character string has odds ~30^-39 ≈ 10^-58 per position; a dozen monkeys typing for 3 million years produce ~10^16 characters. The game shows the line as inevitable in a time shorter than our species has existed.
  Evidence: waits 1→3, `<mark>the</mark>`, `<mark>to be</mark>`, `<mark>to be, or not to be, that is the question</mark>`, label "3,031,250 years"; card "Three million years of noise, and then a line of Hamlet… It was simply bound to happen."
  Suggestion: make each pull multiply time (a million years, then 10^20, then a number that fills the counter, then "∞"), or keep the lever and let the counter run away into powers of ten. The game-over should say how long it actually took (e.g. "far longer than the universe has existed").
- **[major] [philosophy/maths]** Conversely, the first page is not "Nothing but nonsense": random text of that length already contains short words, and my first page had "no" and "go" in it. And the word highlighted after a million years was "the" inside "opthep", not a standalone word. Short words need seconds, not a million years.
  Evidence: page 1 at t=376.7 (`,no n.`, `anh go;`); page 2 at t=397 `op<mark>the</mark>p`.
  Suggestion: highlight the short accidental words on the first page ("A few words, already. Just by chance."), and put the million-year jumps on longer strings.
- **[minor] [philosophy]** "Given forever, it had to happen" / "bound to happen": the theorem says *almost surely* (probability 1), not *had to*: there are infinite sequences that never contain the line (all q's, as the monkey who hands you a page of q's shows). And three million years isn't "forever". The title "Given forever" names the one thing the player did not give.
  Evidence: found_2 t=425.4; card text.
  Suggestion: "Given forever, it almost certainly happens." and a title like "A line of Hamlet"; the q-monkey aside is a lovely hook for the "almost" if the narrator acknowledges it.
- **[minor] [journal]** The walk-out ending shows the same journal question, "The monkeys typed 'To be, or not to be' without meaning it…", although in that ending they never did.
  Evidence: run 2, walked out at t=502, card question unchanged.
  Suggestion: a different question for walk-out, e.g. "Would you believe they could, if you never saw it? Why?"
- **[minor] [notebook]** The notebook says Borel used monkeys "to illustrate events so improbable they will never be seen in practice" (correct, and the opposite of the game's "bound to happen" framing), and that Eddington imagined them writing the British Museum's books. It omits that both were making a point about the second law of thermodynamics (a gas spontaneously gathering into half a box is less likely than the monkeys' feat). That context is the reason the example exists and would help players see why it matters.
  Suggestion: one sentence on the statistical-mechanics context; also mention the 2003 Paignton Zoo experiment (six macaques, five pages, mostly the letter S), which the "all q" monkey already alludes to.
- **[polish] [ui]** The counter overshoots: a "million years" pull ends at 1,010,417 years, then 2,020,833, 3,031,250.
  Suggestion: clamp to exact millions at the end of each wait.
- **[polish] [text]** The pages are all lower-case with no capitals or quotation marks, so "To be, or not to be" as quoted in the narration and journal (capital T) can't actually be typed; the found line is lower-case. Harmless, but a pedant notices the keyboard can't produce the text the theorem is about.

### simulation-argument
- **[major] [philosophy]** The one option that corresponds to a prong of the argument is removed. After "Look closer", the only enabled interaction is "Run more worlds"; "Switch them off" and "Leave them running" (the door) stay disabled until you've scaled up, and idling 30+ s does nothing. Bostrom's second disjunct is precisely "civilisations that could run such simulations choose not to". A player who decides *not* to run more worlds (the interesting, principled choice) has no way to act on it or to leave except Esc.
  Evidence: run 2, t=121–181: `debug` shows only "Run more worlds" enabled; phase stays `explore`.
  Suggestion: enable the door (and "Switch it off") from the start, with a separate ending: "You didn't make any more. If everyone decides that, almost nobody is simulated." That makes all three horns playable.
- **[major] [philosophy]** The staging resolves a disjunction into a revelation. The narration hedges ("may be looking at you"), but the camera pull-back unambiguously shows your study under a dome on a giant's desk, i.e. the game tells you that you *are* simulated. Bostrom's argument is a trilemma and he explicitly doesn't claim the third horn is true (he has said his own credence in it is below 50%). The notebook states the trilemma correctly; the scene doesn't.
  Evidence: phase `reveal` at t=70.8 / 195.5; shot build/agentplay/philosopher-hall/shots/039-t79.jpg (giant face over your dome).
  Suggestion: keep the pull-back but make it ambiguous: pull out to the dome and then fade the giant's desk in and out, or show the dome on the desk *and* an empty desk and cut between them, ending on the unanswered "which kind is yours?".
- **[minor] [philosophy]** The little worlds are physical miniatures in glass domes (terrariums), with a monitor as the portal. The argument turns on substrate-independence: minds *computed* on hardware having experiences like ours. A tiny physical village under glass doesn't need that premise and reads closer to brain-in-a-vat or Leibniz's mill than to a computer simulation.
  Evidence: shots 035-t26.jpg, 040-t85.jpg.
  Suggestion: show the monitor rendering the dome world (pixels/grid on the ground, a wireframe flicker when you "Look closer"), so it's visibly computed.
- **[minor] [philosophy]** "Each of those can run more" presents nesting as free. Bostrom points out the opposite: simulations within simulations consume the base machine's resources, so deep stacks may get shut down, which is exactly the risk the switch-off ending gestures at.
  Evidence: line `more` t=59.4.
  Suggestion: let the nested domes visibly strain the machine (the desk lamp dims, the fan speeds up) when you run more worlds.
- **[minor] [narrative]** "You switch them off. Above you, the lights flicker." implies your act causes a response from your simulators, a karmic or retributive link no version of the argument supplies. It nudges the player to treat "leave them running" as the right answer, which the narration rules say never to do.
  Evidence: off_end t=206.4.
  Suggestion: make the flicker happen in *both* endings (or neither), so it reads as the world's uncertainty, not a verdict.
- **[minor] [philosophy]** The notebook omits the argument's actual engine (the indifference principle: if you can't tell which you are, your credence should match the ratio) and the named target, "ancestor simulations" (simulations of *their own* past, i.e. of people like us). The game's worlds are fantasy villages, which weakens the "which kind is yours?" question.
  Suggestion: one sentence in the notebook on ancestor simulations and the indifference principle; optionally put a tiny copy of *your study* inside one of the shelf domes.
- **[minor] [bug]** An aside line is dropped (not queued) if you trigger it while another line is playing: "Look out of the window" right after "Look at the photo" printed nothing; it only played when I tried again in a later run.
  Evidence: run 1 t≈35–40 (no window caption); run 3 t=221.4 (caption appears).
  Suggestion: queue look() lines, or keep the prompt available until the line has actually played.
- **[polish] [consistency]** Neither ending rewinds; switching off is final and the card follows immediately. Other vignettes play the consequence then restore; here a rewind (worlds flicker back on) would also answer "and then?" nicely.

### fermi-paradox
- **[major] [philosophy]** The choice the vignette offers (send a message vs keep listening) isn't the Fermi question; it's the SETI/METI debate. Fermi's (and Hart's) puzzle is about *visitors*: given the age of the galaxy, someone should have colonised or at least come here. The scene is a radio-listening station, and the only playable question is whether to transmit. The notebook explains Fermi/Hart and never mentions METI at all, so a player who reads it can't connect the choice they made to the text.
  Evidence: lines `old` ("Someone should have come by now") vs choices "Keep listening" / "Send a message"; notebook text (no mention of transmitting, Arecibo 1974, or the METI controversy); journal question is purely about sending.
  Suggestion: add one notebook paragraph on active messaging (the 1974 Arecibo message, the METI debate, the "dark forest"/"stay quiet" idea the send line alludes to), and/or give the player a visitor-shaped act too (e.g. the telescope finds a probe-sized nothing where one "should" be; the Moon's footprints are already a great hook).
- **[major] [philosophy]** "Years pass. Nothing comes back. Maybe no one is there." draws an inference from evidence that can't bear it. At light speed, a reply from even the nearest star takes 8+ years round trip, and from most of the "billions" thousands of years; silence after years is exactly what you'd expect whether or not anyone is there. The game-over card gets it right ("The message is still travelling, and will be for thousands of years. Nothing has answered yet."), so voice and card disagree.
  Evidence: send_2 at t=189.0; card "You called out" at ~t=206.
  Suggestion: "Years pass. Your message has barely left the neighbourhood." and keep the maybe-they're-quiet line for the card.
- **[minor] [philosophy]** The closing disjunction "Either they're rare, or they're quiet, or we're early" is presented as exhaustive. It omits the answers the notebook itself lists (civilisations destroy themselves: the Great Filter, which is not the same as "rare" because it lies in *our* future too) and the zoo/"they're here and we can't tell" family. For a pedant, "either… or… or…" claims more than the literature supports.
  Evidence: listen_end at t=70.3; card "Maybe they are rare. Maybe they are quiet. Maybe we are early."
  Suggestion: "Maybe they're rare. Maybe they don't last. Maybe they're quiet. Maybe we're early." (the card's "maybe" framing is better than the voice's "either").
- **[minor] [accuracy]** The notebook says Hart argued "there are no other civilisations". Hart's claim was narrower: that we are the first (or only) civilisation *in our Galaxy*, from "Fact A" (no extraterrestrials on Earth now). The journal repeats it ("arguing the silence means there's no one out there"), and "silence" is itself anachronistic: Hart's argument is about absence of visitors, not radio silence (that's Brin's "Great Silence", 1983).
  Evidence: notebook text; game/journal.json fermi-paradox.todo[1].
  Suggestion: "Michael Hart argued in 1975 that the absence of visitors on Earth means we are probably the only civilisation in the Galaxy."
- **[minor] [accuracy]** The notebook quotes Fermi as asking "Where is everybody?" as fact. Jones's own report (the cited source) says the witnesses remembered the wording differently ("Where is everybody?" / "But where is everybody?" / "Don't you ever wonder where everybody is?").
  Suggestion: "asked something like 'Where is everybody?'".
- **[minor] [design]** "Send a message" is disabled until you've used "Listen", and nothing happens if you don't listen (I idled 30+ s at t=113–143: no lines, no prompts). A player who walks straight to the lever (the most visible prop) gets a dead lever and no feedback.
  Evidence: run 2, `debug` at t=113: "Send a message … [disabled]".
  Suggestion: enable sending from the start (sending without listening first is a real and interesting choice), or have the lever say "Not yet" and point to the headphones.
- **[polish] [voice]** send_2 is four sentences on three caption lines, against GAME.md §5 ("one short sentence per trigger, rarely two").
  Evidence: shots/056-t194.jpg.
- **[polish] [accuracy]** The moon aside, "Only one other world has ever had visitors", is true only of crewed visits; Mars, Venus and Titan have had robotic ones. Harmless, but the pedant hears it. "Only one other world has ever had footprints" says the same thing exactly.

### tragedy-of-the-commons
- **[major] [philosophy]** The neighbours never act on their own: they add sheep only as an echo of *your* "Add a sheep" (`onUse` adds one sheep per neighbour 2.5 s after yours). If you do nothing, the pasture is exactly sustainable forever (10 sheep: regrowth 0.02/s = 10 × 0.002/s eaten) and nothing ever happens; I idled 60 s at full grass. That inverts Hardin's argument, whose force is that *no* instigator is needed: each herder independently finds adding an animal rational (the whole +1 to him, a fraction of the −1 shared), so ruin follows from everyone's reasoning, not from one bad example. As built, it's a story about a ringleader and copycats (conditional cooperation), and it tells the player "the tragedy is your fault".
  Evidence: run 2, t=63–124, grass stays 1.00, adds 0; game/vignettes/tragedy-of-the-commons.js `onUse` of "Add a sheep" (neighbours only add inside your handler); neighbour line "Well, you added one. Why shouldn't I?".
  Suggestion: let neighbours add sheep on their own schedule (slowly, each after a little "why not?" beat), whether or not you do; your sheep then speed or slow it. Doing nothing becomes a real option with a real outcome ("You held back. They didn't. The grass went anyway."), which is the tragedy.
- **[major] [philosophy]** "A shared pasture. Anyone may graze their sheep here." makes the pasture open-access, which is Hardin's model but not what historical commons were: English commons were regulated by custom and manorial courts (stints, i.e. per-household limits). This is the main historical objection to Hardin (e.g. Cox, "No Tragedy on the Commons", 1985), and Hardin himself later said he should have called it "the tragedy of the *unmanaged* commons". The notebook frames Ostrom as the rebuttal but never makes this distinction, so the player learns "commons = open access".
  Evidence: arrive line t=9.4; notebook text.
  Suggestion: notebook: add one sentence on open access vs managed commons and Hardin's later "unmanaged" qualification. Voice: "A shared pasture, with no rules yet. Anyone may graze here."
- **[minor] [accuracy]** The notebook says Hardin "concluded that commons must be privatised or regulated from above". His actual formula was "mutual coercion, mutually agreed upon by the majority of the people affected" — close to what the bell ending does. And the essay's real subject was population ("Freedom to breed is intolerable"), which the notebook omits; since Hardin's views on population and immigration are the reason many readers now approach the essay warily, a curious player deserves one neutral sentence on it.
  Evidence: notebook text (game/notebook/tragedy-of-the-commons.json).
  Suggestion: "Hardin, writing mainly about population growth, argued for 'mutual coercion, mutually agreed upon', including privatisation or state regulation."
- **[minor] [philosophy]** Ringing the bell produces instant, costless, permanent agreement ("You talked, set rules, and kept to them."). Ostrom's finding is that it works *under conditions*: clear boundaries, monitoring, graduated sanctions, rules made by those affected. The game asserts "kept to them" without ever letting anyone (including you) break them, so the cooperation ending is cheap talk that always works.
  Evidence: runs 2 and 3: bell → agree → card within ~15 s; no further play.
  Suggestion: after the meeting, leave "Add a sheep" enabled for a short while; if you sneak one in, a neighbour notices and walks it back (monitoring + a gentle sanction), and the card reflects it.
- **[minor] [text]** Ringing the bell at full grass (before anyone added a sheep) still ends with "The grass came back." and "everyone looks after it".
  Evidence: run 2, t=132.8–148.3, grass 1.00 throughout.
  Suggestion: branch the card: "The grass was fine. You agreed on limits anyway, before anyone needed them." (a nice Ostrom point in itself).
- **[polish] [text]** "Five neighbours, two sheep each" but there are four other households with herders plus you. Either "Five households" or "Four neighbours and you".
  Evidence: herders line t=14.5; shot 069-t184.jpg shows four herders at the meeting.
- **[polish] [staging]** At the meeting the four neighbours gather in the middle of the pasture while you stay at the bell, yet the line says "Together, you agree on limits".
  Evidence: shots/069-t184.jpg.
  Suggestion: walk the player to the meeting (scripted walk) before `agree`.
