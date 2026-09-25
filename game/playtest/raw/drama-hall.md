# drama · the hall

## Summary
(in progress)

## Findings
### hall
- (notes) Ladder → hall transition took <1 s of game time; hall arrival toast "A long hall. More doors, of a sort." Gentleman lines are Magritte's own words (fine in a speech bubble, not narration).

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
