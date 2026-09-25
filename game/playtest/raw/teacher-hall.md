# teacher · the hall

## Summary
(in progress)

## Findings
### hall
- (notes) Reached via ladder fine; five portals are labelled with the experiment names as you walk past. Gentleman with apple has 4+ lines.

### grandfather-paradox
- **[major] [decision design]** The invitation to act arrives after most of the choices have expired. The narrator asks "So what happens if you stop him?" at the moment grandfather reaches segment 3, and that is exactly when "Close the gate" gets disabled (`enabled: S.seg < 3`). The meeting happens about 10 s later, and you are 15+ m from the signpost. On run 1 I listened to the setup the way a careful student would, then did `use close the gate`: it was "disabled right now", he met her, and the card said **"You let it be"**. The game labelled me a passive observer when I had tried to act. The design says "time slows to a crawl at the choice", but here time never slows and the choice is gone before the question is asked.
  Evidence: run 1, question caption t=52.1 s, meeting (phase over) t=62.5 s; shot 008-t75.jpg. Code: `grandfather-paradox.js` l.98 and l.159.
  Suggestion: voice the question when you arrive (or make grandfather wait at the machine until the question has been voiced), and slow his walk right after it (the other vignettes' "slow" phase). Also keep the gate usable until he is actually through it (seg ≤ 2 && u < 0.3).
- **[major] [philosophy]** Every branch teaches the same position: self-consistency, with the Lewis "you can but you won't" reading in the ending text. That is a real and good position, but the grandfather paradox is a classroom favourite *because* it is a fork in the literature. The main rival, branching or many-worlds time travel (you do stop him, and you return to a present where you were never born or a timeline that isn't yours), doesn't exist as an option or even as a line. There's also no twist after the first run (GAME.md template, beat 5) and no "most drastic option" ending. Students will come away thinking physics has settled it.
  Suggestion: on replay, add a twist that lets one attempt succeed (e.g. the second time the gate holds). He doesn't arrive, the sepia scene splits into a second, slightly different-coloured copy of the town, and "Go home" takes you to a time machine that's no longer yours. Reflection: "You changed it. But whose past was it?" That turns the vignette into a comparison between two real positions, and the notebook can then name Novikov-style consistency vs. branching (Deutsch), neither of which it mentions now.
- **[minor] [feedback]** The consequence lines lag their causes by up to 10 s because they queue behind the scripted lines. I told him who I was at t=155.4; "He laughs... And he walks on." played at t=165.6, after the grandmother and question lines. The signpost failure played after that. For learning, cause and effect need to be next to each other.
  Suggestion: let the `*_fail` lines interrupt or jump ahead of the descriptive lines (or delay `see_gm`/`ask` while a fail line is pending).
- **[minor] [bug/narrative]** "Go home" right at the start: the intro line "That's your grandfather. Young, and in a hurry." plays *between* the two reflection lines ("You came all this way, and changed nothing." / "...grandfather..." / "Maybe that's the only story that works."). The intro coroutine isn't cancelled when the run ends.
  Evidence: t=274.5–282.1 s, run 5.
  Suggestion: check `S.phase === 'walk'` before `voice.say('see_gf')` in the intro async.
- **[polish] [text]** One attempt gives the card "You tried once. Each time, something ordinary got in the way." ("Each time" after "once"). Also "You came all this way and changed nothing" on "Go home" 2 s after arriving reads oddly: you didn't come any way at all.
  Suggestion: "You tried once. Something ordinary got in the way." For leaving early, something like "You left before anything could happen. Or before anything could fail to."
- **[minor] [decision design]** Standing in his path only counts if you're there before he gets close. On run 3 I tap-walked to (7, 0.9) and arrived just as he reached me; he walked past and the card said "You let it be" / "changed nothing". On run 4, standing there early, it counted ("He steps around you, and apologises.").
  Suggestion: count a block whenever the player is within ~1.6 m ahead of him, even for a moment, or make his step-around visibly deliberate so the player knows they tried.
- **[idea] [learning]** The four attempts (gate, sign, block, tell) are nicely ordinary, but the reflection is the same whichever ones you try. The one that matters philosophically, "Tell him who you are", is where a student would expect the past to be *causally loaded* (the bootstrap problem: maybe telling him is why they married). One line there would open a second classic puzzle for free.
  Suggestion: on "tell", have grandma overhear and smile, and on the card: "Maybe that's why they got on so well." It's a gentle hint at causal loops, with the notebook explaining it.
- **[keep]** The journal question ("could you change anything at all? What would stop you?") is excellent for class. It's open, it's about reasons, and it works whichever ending you got. The Lewis line "You could have stopped him, in a sense. You just didn't." is the best one-sentence summary of a hard paper I've seen.
