# world · the hall (hall, grandfather-paradox, infinite-monkey, simulation-argument, fermi-paradox, tragedy-of-the-commons)

## Summary
(in progress)

## Findings
### hall
- **[major] [bug]** Talking to the apple-faced gentleman faster than one line every ~2.6 s leaves the earlier speech bubbles stuck on screen forever. I pressed E on him 7 times about 2–3 s apart, then walked 28 m to the far end: five bubbles ("Good afternoon.", "We always want to see what is…", "The hats? Oh, they come and go.") stayed frozen at screen (982, 390), floating over the typewriter table, 20+ s later. Cause (main.js `ctx.speak`): a new line for the same speaker replaces the `bubbles` Map entry with a new `key`, so the old `speech-<key>` label is never faded or updated again and stays at opacity 1. This hits every `talk()` aside in the game.
  Evidence: shots 010-bubbles.jpg, 011-leftend.jpg, 012-leftfront.jpg; `eval` shows `.label.speech` "Good afternoon." with opacity 1, visibility visible at t=51 s.
  Suggestion: in `speak()`, before replacing an entry, hide the old label (`ui.label('speech-'+old.key, 0, …)`) or reuse the old key; alternatively keep the key per speaker and only swap the text.
- **[major] [visual]** Three of the hall's promised Magritte pieces are built but never on screen, because the camera sits low and looks level at the back wall. The upside-down dining table + chandelier (y≈9.5) only shows as a few white candle stubs poking in at the top edge; the door with the hole ("The Unexpected Answer", on the left end wall at x≈-17.9) is off screen from every spot I could reach (`onscreen -17.9 1.5 -1.2` → x=-270 to -386) and hidden behind the left curtain; the Empire of Light window is cut off at the left edge unless you stand at the far left. The hall reads as one long flat wall of objects in a row.
  Evidence: shots 003, 004, 013 (candle stubs top-centre), 012; `onscreen -3.5 8.5 -1.5` → y=-112 from under the table.
  Suggestion: when the player is under the table, let the camera tilt up (a short "look up" framing zone), or hang the table lower (y≈6) so it's in frame; move the holed door onto the back wall near the hatch (or turn the camera to face the left end when the player is at x<-14).
- **[minor] [camera]** At the left end (x≈-16) the player walks behind the red curtain and is half-hidden at the screen edge (shot 011: only the head shows; shot 012: player cut off at left edge). The hatch "Down to the first room" is also at the very left edge.
  Suggestion: clamp the camera target so the player stays at least ~15% in from the frame edge, or stop the walkable area at x≈-14.5.
- **[minor] [environment]** The hall has no `look()` asides at all: only the gentleman talks. Eleven famous images sit there with no voice. For a world-builder the pipe, the mirror and the train are begging for one plain line each ("It isn't a pipe. It's a picture of one." / "Your back, again.").
  Suggestion: add 2–3 `look()` asides (the pipe, the mirror, the apple room), one short line each, no names.
- **[polish] [narrative]** Two of the gentleman's five lines are near-verbatim Magritte quotes ("Everything we see hides another thing", "We always want to see what is hidden by what we see"). They're lovely, but they're quotations inside a no-quotes voice pillar, and the stage direction "(The apple stays exactly in front of his face.)" appears in the same speech bubble style as his words, so it reads as if he said it.
  Suggestion: keep one quote, write the others fresh; render stage directions as a narrator toast or italic grey bubble anchored on the apple, not his mouth.
- **[polish] [streaming]** On first arrival the first room's toast "Look around. Some things here lead elsewhere." is still on screen in the hall for ~0.6 s before being replaced by the hall's own toast.
  Evidence: `until level` output at t=4.0 s shows the house toast in the hall.
  Suggestion: clear the toast on level change (in `goto`).
- **[polish] [bug]** Same stuck-bubble bug appears in every vignette with `talk()` (see Grandfather Paradox below): it's the single most visible world bug in my part.

### grandfather-paradox
- **[major] [pacing]** Poking around the town costs you the whole vignette. On my first visit I did what a world-builder does: listened to the opening, talked to the newspaper seller three times, read the paper. That took ~20 s; the grandfather kept walking the whole time (`seg` 0 → 5), met the grandmother at t≈129 s (26 s after arrival) and the game ended "You let it be" while I was still walking towards the gate ("Close the gate" prompt was already disabled). I never saw the meeting, never reached the station-side person (the second "Talk" at (16, 2.4)), and the card told me I "came all this way and changed nothing". The asides actively punish the curiosity they're meant to reward.
  Evidence: arrival t=103.5 s; paper read t=123.6 s; phase `over` at t=128.7 s; shot 021-t148.jpg.
  Suggestion: don't start the grandfather's walk until the player leaves the time machine's area or first moves toward the square (a trigger, not a timer); or have him pause to buy a paper when the player is at the stall; or loop his walk (he circles the square once) the first time so the day has room for the asides.
- **[minor] [bug]** The stuck speech bubbles again: after talking to the paper seller three times in 6 s, "Paper! Read all about it!" stayed frozen in the middle of the square and "Nothing ever happens round here. Lovely, isn't it?" at the left edge, and both were still visible behind the game-over card 20 s later.
  Evidence: shots 019-paper.jpg, 021-t148.jpg.
  Suggestion: fix `ctx.speak` (see hall).
- **[minor] [environment]** The town is a set, not a place. Seven identical cottages with closed doors and black windows, one vendor, one grandmother, one grandfather; nobody else walks, nothing moves (no smoke, no birds, no train ever arrives at the "late" station). The "sepia past" also reads as the same cream as every other island rather than as old: nothing is tinted or grainy.
  Evidence: shots 017, 022, 032.
  Suggestion: one or two background walkers on loops, a curtain twitching in one window, a train that finally pulls in as they meet (it's "late, it always is"), and a real sepia/grain post-filter or desaturated palette so the past looks like an old photo.
- **[minor] [staging]** The meeting itself is unstaged: he stops in front of the bench and both stand still (shot 027). It's the emotional centre (your own origin) and the camera frames it at the edge from far away while the player is elsewhere.
  Suggestion: a small gesture (he lifts his hat, she stands; the bench creaks), and let the camera settle on the two of them for the "They meet" line.
- **[minor] [narrative]** The reflection doesn't reflect what I actually did. After only "Tell him who you are" the narrator said "Every time you tried, something ordinary got in the way. Not magic. Wind, habit, a laugh." (wind and habit never happened), and the card said "You tried once. Each time, something ordinary got in the way." ("once" + "each time"). After three tries the card says "You tried 3 ways" with a digit in prose.
  Evidence: t=209.9 s and card at t=221.7 s (run 2); card at t=268.4 s (run 3).
  Suggestion: build the list from the fails that happened ("A laugh." / "Wind, habit."), and write one/two/three/four in words with a singular variant ("You tried once, and something ordinary got in the way.").
- **[minor] [pacing]** The notebook doesn't pause the world. I opened `N` at arrival and read for 6 s; the grandfather walked from seg 0 to seg 2 meanwhile. In a vignette that ends ~25 s after you arrive, reading the notebook eats most of the choice window.
  Suggestion: freeze level time (or at least the grandfather's walk) while the notebook is open.
- **[polish] [clarity]** The "Go home" prompt is live the moment you step out of the machine (you spawn 0.4 m from it). An E press meant for anything else, or a curious tap on the machine, ends the vignette instantly with "You left the past alone".
  Suggestion: enable "Go home" only after the grandfather line has played or after the player has walked a few metres away and back.
- **[polish] [camera]** Talking to the grandmother at the station puts her and the "Talk" prompt at the far right edge, prompt clipped (shot 023); the station is off-screen when you first reach it (shot 022).
  Suggestion: include the station platform in the framer's point set once the player is east of x≈8.
- **[major] [structure]** "Back to the house" on the Grandfather Paradox card drops you in the *first room* at its default spawn (0, 5.5), not in the hall beside the clock you came through. The hall stops being connective tissue: every hall vignette sends you downstairs and you have to climb the ladder again. GAME.md says players should come back "beside the portal they used".
  Evidence: t=289.2 s `[level loaded: house]` after `clicksel "#over [data-act=home]"` from grandfather-paradox.
  Suggestion: make the card's home button `goto(parentRoom)` (hall for hall portals) with `ctx.from` set to the vignette id, and label it "Back to the hall".
