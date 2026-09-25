# generic-calm · hall

Screenshots are in `build/agentplay/generic-calm-hall/shots/`. Times are game time in seconds.

## Summary
- The hall is a delight: I understood right away that the objects were doors ("More doors, of a sort"), the labels helped, and the gentleman with the apple made me smile. As a hub, though, it lets you down: every way out of a hall vignette (card, Esc) drops you back in the **first room**, so you climb the ladder every time.
- **Grandfather Paradox** was the most confusing. On my first visit, as a careful player who listened to the narrator, the game ended before I had done anything. The grandfather's walk takes about 28 s and the question is asked about 10 s before he meets her.
- **Infinite Monkey** misled me as a newcomer. After three lever pulls the full line shows up at "3 million years", and I came away thinking that's roughly how long it takes. The "walk out" ending ("forever is much, much longer than it sounds") says the opposite.
- **Simulation Argument** is the best of the five: the zoom into the domes and the pull-back to a giant's face really landed. But after the reveal there's about 20 s of silence, no prompt, and no hint that walking out of the door is a choice.
- **Fermi** and **Commons** are clear and gentle, but the other option is hidden or never named. In Fermi the "Send a message" lever sits at the edge of the frame. In Commons, ringing the bell straight away skips the dilemma and still says "the grass came back".
- In several places a line plays late or out of date (after you've acted, or after you've left). It made me doubt that the game had registered what I did.

## Findings
### hall
- **[major] [navigation]** From every hall vignette, both *Back to the house* on the game-over card and Esc put me at the first room's spawn (0, 5.5), not beside the hall portal I used. I had to climb the ladder again each time. It happened after GP (262 s), Monkeys (434 s) and Simulation (Esc, 197 s). This breaks GAME.md's "spawn for `ctx.from`". Suggestion: return to the hall spawn next to the portal that was used (the hall already has spawns). Or relabel the button "Back to the hall".
- **[minor] [clarity]** Talking to the gentleman at around 24–31 s left his speech bubbles in the "on screen" list until I opened the clock at 42 s, about 25 units away. Suggestion: clear a talk bubble when the player walks out of range or after a set time.
- **[minor] [ui]** At the hall spawn, the "Climb down" prompt and the "Down to the first room" label sit on the player's head (002-arrive.jpg). Suggestion: offset the spawn by a metre from the hatch, or place the label above the hatch rather than over the figure.
- **[idea] [world]** The pipe, the mirror, the apple room, the easel and the fireplace train are all lovely, but none of them can be interacted with; only the gentleman has a prompt. As a first-timer I walked up to the pipe expecting a line. Suggestion: add 1–2 `look()` asides, e.g. the pipe ("It isn't a pipe. It's a picture of one.") and the mirror.
- **[polish] [feedback]** Completed portals get only a "✓" on the label (101-glow.jpg). I couldn't see any glow on the objects themselves. Suggestion: add a soft glow on the finished portal object, as GAME.md describes.

### grandfather-paradox
- **[major] [pacing]** On my first run I arrived at 43.6 s, listened to the four setup lines (44.6, 49.6, 54.0, 58.4) and walked toward the square. By 60 s the gate was already behind him (disabled), and `use "Tell him who you are"` couldn't reach him within 20 s. They met at 68.7 s and the card read "You let it be". I never got to act. The question "So what happens if you stop him?" comes only about 10 s before the meeting. Suggestion: have him wait (at the time machine or a first stop) until the "ask" line has finished, or slow his first segments a lot. Give the player a beat to choose after the question.
- **[major] [feedback]** When I stood in his path and pressed E on "Tell him who you are" (195.5 s), he paused for 2.5 s. But "He laughs. What a strange thing to say." was queued behind the "ask" line and played at 203.7 s, 8 s later, when he was already walking away. Suggestion: consequence lines should interrupt setup lines, or hold his pause until the reaction line has played.
- **[minor] [bug]** After "Go home" (242.6 s, phase over), the queued setup lines "At the station, a woman is waiting…" and "So what happens if you stop him?" still played at 243.4 s and 247.8 s. The card didn't appear until 261 s. Suggestion: flush the voice queue when the level ends.
- **[minor] [clarity]** At 107 s two prompts ("Turn the signpost" and "Tell him who you are") showed at the same time, and I couldn't tell which one E would trigger. Suggestion: show one prompt at a time (nearest or highest priority).
- **[minor] [clarity]** Standing still in his path counted as an attempt ("He steps around you" at 208 s) even though I didn't mean it as one. The card then said "You tried 2 ways". Suggestion: fine to keep, but count "block" only if the player moved into his path during the walk.
- **[minor] [narrative]** The "It had already happened" card says "You could have stopped him, in a sense. You just didn't." The narration had just said "It was never going to un-happen." To a first-timer these contradict each other. Suggestion: explain the "in a sense" plainly, or drop it from the card and leave it to the notebook.
- **[minor] [pacing]** The notebook (N) doesn't pause the scene. While I read it, his walk went from u = .07 to .92. With a walk this short, reading the notebook costs you the run. Suggestion: pause the level update while the notebook is open.
- **[minor] [design]** Every run ends in a game-over card after one pass. Nothing inside the scene says "you tried the same thing again" or "something different this time". Suggestion: allow two passes in one visit, with the narrator acknowledging the second choice, as GAME.md describes.
- **[polish] [camera]** The arrival caption covers the player (008-gp-arrive.jpg). The close-up when the gate blows open (016) is lovely.

### infinite-monkey
- **[major] [philosophy]** After three "Wait a million years" pulls, the page showed the full "to be, or not to be, that is the question" at about 3,031,250 years (040-r2.jpg). The card said "Three million years of noise, and then a line of Hamlet… It was simply bound to happen." I now believe it takes about three million years. The notebook says the lesson is "how unimaginably long forever would have to be", and the walk-out ending says "forever is much, much longer than it sounds". Suggestion: make each pull jump many orders of magnitude (e.g. 10^6 → 10^20 → 10^40 years; the counter could switch to "a number with 40 zeros"), or have the narrator say how absurdly lucky this page was.
- **[minor] [clarity]** After the first wait, "A word. Just one, by pure chance." highlights "the" inside "opthep.whka" (038-word.jpg). It isn't a standalone word, so I didn't believe it. Suggestion: generate the lucky word with spaces around it.
- **[minor] [narrative]** On the walk-out ending the journal question still says "The monkeys typed 'To be, or not to be' without meaning it…" but I never saw that happen. Suggestion: use a different question for the walk-out ending, e.g. "Would you keep waiting? Why?".
- **[minor] [ui]** The year counter overshoots to "1,010,417 years" after "a million years". The "Wait a million years" prompt sits right on top of the counter label (036). The "0 years" label is faint grey on grey when you arrive (032). Suggestion: clamp the counter to round numbers and move the prompt below the lever.
- **[polish] [narrative]** "Given forever, could they type Shakespeare?" names a person in the narration, which GAME.md says shouldn't happen. Suggestion: "…could they type a line of a famous play?".
- **[polish] [clarity]** Re-reading straight after a wait shows the same page and repeats the same caption. Suggestion: vary the page, or say "Still the same page".

### simulation-argument
- **[major] [clarity]** After the reveal (phase "choose" at 87.8 s) there was no line and no prompt, and I got 20 s of silence. "Leave them running" is on the door about 9 units away, and nothing had suggested the door was an option. I only found it with `debug`. Suggestion: add a line at "choose", such as "Switch them off, or leave them running?", and light up both the switch and the door.
- **[minor] [clarity]** After the zoom (57 s) the game returned to explore with me standing behind the desk (1.9, −3.2), with no prompt and nothing on screen. I had to walk round the desk to find "Run more worlds" at the monitor. Suggestion: after the zoom, put the player in front of the monitor, or add a short line pointing to it.
- **[minor] [design]** The replay doesn't acknowledge my previous choice (same arrival line, same beats).
- **[polish] [narrative]** The door has no prompt before the choice (it's disabled while you explore). A careful player tries it early, nothing happens, and they don't try again. Suggestion: give it a small line while it's disabled ("Not yet. The little world is still running.").

### fermi-paradox
- **[major] [clarity]** The "Send a message" lever is never mentioned. At the monitor it sits on the last pixel of the frame (`onscreen` gave (1279, 637); 074, 072). On my first run I pressed the only prompt I could see ("Keep listening") and got the ending. The card then asked "Would you send the message…", but I hadn't known there was one. Suggestion: keep the lever in frame at the choice and add a line after "So where is everybody?", e.g. "Or you could call out."
- **[minor] [pacing]** After the arrival line (8.1 s) there's nothing for about 18 s, and no hint that the monitor is where to go. Suggestion: add a second arrival line pointing to the static on the screen.
- **[minor] [camera]** When I sent the message, the camera tilted up to the dish but nothing visibly left it (081), and the player's head was cut off at the bottom of the frame. Suggestion: show a faint ring or pulse going up from the dish, and keep the figure in frame.
- **[polish] [camera]** Captions cover the player at the monitor (072). I didn't see the frog or the shooting star on either run.

### tragedy-of-the-commons
- **[major] [design]** Ringing the bell straight away, with no sheep added and grass at 1.0, gives "You agreed on limits… The grass came back." But the grass had never gone, and the dilemma never happened. Suggestion: enable the bell only once the grass has started to thin, or write an honest early-bell variant ("You agreed before anything went wrong. Rare, and wise.").
- **[minor] [bug]** On run 3 I added two sheep during the intro. The "One more sheep" and "Your neighbours notice" lines never played. Instead the stale intro line "Five neighbours, two sheep each. The grass is thick." played at 302.6 s, when the grass was at 0.83 and I had 4 sheep. Suggestion: drop queued intro lines once the player acts.
- **[minor] [visual]** After the neighbours copy me, the sheep bunch into one tight clump in the lower left (092, 093). It looks like a bug, not grazing. Suggestion: spread their wander targets across the whole pasture.
- **[polish] [ui]** The "Add a sheep" prompt covers the player (092).
- **[polish] [design]** If you do nothing for 40 s, nothing happens and there's no line. Suggestion: after about 30 s, a neighbour could say "Thinking of adding one? Everyone else is." to nudge the choice without forcing it.

## Keep
- The hall's look: sky walls, curtains, the apple-faced gentleman's lines ("Everything we see hides another thing"), and the mirror that shows your back.
- GP: the wind blowing the gate open with the close-up, the paper seller ("Nothing ever happens round here"), and the idea that ordinary things get in the way.
- Monkeys: reading the typed page as a paper card, the highlighted line, the bananas aside, and the walk-out ending text.
- Simulation: the zoom into the dome, then into the dome inside it; the shelves filling; the pull-back to a giant face; the room darkening with "Above you, the lights flicker."
- Fermi: the moon and logbook asides, and the night-to-years time-lapse.
- Commons: the diorama reads at a glance; the pasture turning to bare dirt; the neighbours gathering in the meeting.
- Game-over cards and the journal: warm, and the questions made me want to write an answer.

## Harness notes
- `debug` listed "Read the paper" (GP) as `[disabled]` when I was 1.9 units away, but `use` then worked fine.
- `use "Look at the photo"` in Simulation during explore seemed not to fire the first time (no caption, and the clock jumped from 17 s to 46 s). It worked later.
- `use` couldn't catch the moving grandfather. Walking into his path and pressing E worked.
