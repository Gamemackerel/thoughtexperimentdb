# streamer · the hall

Screenshots are in `build/agentplay/streamer-hall/shots/`. Times are game time in the session.

## Summary
- **Thumbnail material:** The hall (the apple-faced man, the raining bowler hats, the cloud wallpaper) and the Simulation giant looming over the dome (057/058) would make great thumbnails. The Monkey page with "to be, or not to be, that is the question" highlighted in yellow (042) and the Commons flock turning the grass brown (098, 111) are the best clips.
- **Too short on stream:** Each hall vignette takes 20–90 s from arrival to the game-over card. The Grandfather Paradox can end before a streamer has finished reading the intro to chat. None of them has the "rewind → twist → choice comes round again" beat that GAME.md promises, so chat gets only one vote per vignette.
- **Payoffs happen off-camera or late:** The Fermi message beam is out of frame. In the Grandfather Paradox the reaction captions arrive 10–15 s after the action (the funniest one arrives after the scene is over). After the Simulation reveal, the giant disappears. The Monkey "million years" changes nothing in the room.
- **Hub flow breaks the run:** "Back to the house" and Esc from any hall vignette drop you in the *first room*, so a stream going through the hall has to climb the ladder again every time.
- **Framing:** The arrival camera often puts the player at the bottom edge, underneath the caption pill (grandfather, commons, fermi). On a small stream window the viewer loses "where am I".

## Findings

### hall
- **[major] [flow]** "Back to the house" on the game-over card (Grandfather Paradox, t=193) and Esc + confirm (Simulation Argument, t=159) both loaded `level=house` at the default spawn (0, 5.5), in the first room, not in the hall next to the portal I used. When you play the hall's five portals in a row, every one costs an extra ladder climb and ~10 s of dead air.
  Evidence: shots 029 and 069.
  Suggestion: For hall vignettes, send the player back to the `hall` level with `ctx.from` set to the vignette id (the hall already has per-portal spawns). You could also label the card button "Back to the hall".
- **[minor] [streaming]** The Esc confirm is a browser-native `confirm()` ("Leave this vignette and return to the house?"). It looks jarring on stream, and OBS browser sources show native dialogs badly.
  Suggestion: Use an in-game pill dialog styled like the game-over card.
- **[minor] [UI]** The apple man's "E Talk" prompt sits right on top of his hat and apple, so the joke of the vignette is hidden when you're close (008). His speech bubbles also stayed on screen after I walked the length of the hall ("We always want to see…", still showing at t=38.8 after being said at t=26.5, shot 009).
  Suggestion: Anchor the Talk prompt at his feet or to one side. Fade bubbles when the player moves more than ~4 m away.
- **[idea] [streaming]** The hall's best props (the pipe that is not a pipe, the mirror showing the back of your head, the apple room, the train coming out of the fireplace) have no `look()` lines. These are the ones chat would ask about. The apple man is the only interaction, and his lines are good ("Everything we see hides another thing, you know." / "The hats? Oh, they come and go.").
  Suggestion: Add 2–3 one-line looks, e.g. the mirror ("You lean closer. So does the back of your head.").

### grandfather-paradox
- **[major] [pacing]** Run 1: I let the intro play as a streamer would while talking to chat (13 s), then walked to the gate. The gate prompt was already disabled, so the Grandfather Paradox ran without me: game over, "You let it be", at t=77, only 37 s after arrival and with zero choices made. On stream, that is a "wait, what? it's over?" moment.
  Evidence: arrived 39.8, 'ask' 54.7, over 65.0, card 77.2. Shots 014 and 016.
  Suggestion: Hold grandpa at the machine or his house until the player first moves or interacts, or until `ask` has finished. Slow his walk (1.35 → ~0.9) and give him one natural stop (e.g. buying a paper from the vendor), so there are ~60–90 s of real choice time.
- **[major] [pacing/narration]** Reaction captions are queued behind the intro lines, so they land long after what they describe:
  - Run 2: I pressed "Tell him who you are" at 91.3. "He laughs. What a strange thing to say." appeared at 106.3, after `see_gm` and `ask`. By then grandpa was far away.
  - Run 3: I turned the signpost; "He doesn't even look at the sign" appeared at 155.0, *after* `phase: over` (153.1).
  - Run 3: Reading the paper pushed "That's your grandfather" to t=138, when he was already at segment 3.

  These are the funny lines, and they need to land on the action.
  Suggestion: Give fail lines priority (interrupt or skip queued descriptive lines). Drop `see_gf`/`see_gm` if the player has already interacted with that person. Add a speech bubble on grandpa himself for tell_fail (e.g. "Ha! Good one, pal.") so the joke is visible instantly.
- **[minor] [bug]** "Tell him who you are" makes the player walk into his path, which also triggers the block attempt ("He steps around you, and apologises." at 92.9). The card then said "You tried 3 ways" when I had tried 2. Talking to grandma while he arrives also counted as a block (run 3).
  Suggestion: Don't count `block` in the 2 s after a `tell`, or while the player is inside the grandma's talk radius. Only count it when the player actually moves into his path.
- **[minor] [bug]** When I pressed "Go home" at once (run 4, t=175.7), the intro coroutine kept running. The ending read: "You came all this way, and changed nothing." / "That's your grandfather. Young, and in a hurry." / "Maybe that's the only story that works."
  Suggestion: In `end()`, cancel the intro async (e.g. check `S.phase === 'walk'` before `say('see_gf')`).
- **[minor] [camera]** The arrival shot puts the player in the bottom-left corner with the two-line caption over them (011, 013). The actual meeting, the climax, happens small at the far right edge with no push-in (014).
  Suggestion: Frame the player higher. When `met` fires, do a slow push-in on the couple on the bench, and hold it for the 'met' line.
- **[minor] [visual]** The gust of wind that reopens the gate can't be seen: in the close-up (019) grandpa and the player block the gate.
  Suggestion: Shift the close-up angle so the gate hinge is visible, and add a small leaf/dust puff.
- **[idea] [streaming]** There is only one timeline and one pass, so chat can't vote "gate or signpost or tell him" and then see a second attempt. GAME.md's replay beat, where the choice comes round again, is missing here. The time machine would suit a built-in "go back again" loop, where he walks the same route and the narrator notices you're back.
  Suggestion: After `met`, rewind (the frog already rewinds) and let the player try again. End on the third pass or on "Go home".
- **Keep:** Grandma's "Have we met? You have a familiar face." is the best line in the hall (027), and the vendor's "It's something about your shoes." is also good.

### infinite-monkey
- **[major] [clip moment]** The lever ("Wait a million years") spins a counter from 0 to 1,000,000 in ~3 s (219.9 → 223.0), and nothing in the room changes (034 vs 037): the same monkeys, the same bananas, the same light. That's where a streamer would say "wait, watch this", and nothing pays it off.
  Suggestion: Show time passing. Paper piles up around the desks, the banana crate empties and refills, the light cycles day and night, the monkeys get grey muzzles, the frog's cameo happens during a spin. Scale it: the second and third pulls get bigger piles.
- **[minor] [UI]** After the spin, the "E Wait a million years" prompt sits exactly on top of the year counter (037), so the number you just earned is hidden.
  Suggestion: Offset the counter label above the lever, or hide the prompt for 1.5 s after the spin.
- **[minor] [philosophy/streaming]** The full line appears after exactly 3 pulls, i.e. 3 million years, with 15 monkeys. The walk-out ending then says "Forever is longer than it sounds". Chat will "well actually" this at once: the real odds for 18+ characters are astronomically worse, and the two endings contradict each other.
  Suggestion: Make the counter's units escalate: 1 million, then 10^20, then "more years than there are atoms". Or have the narrator admit the cheat ("We skipped a few zeros.").
- **[minor] [replay]** The pages have identical text on every replay (the first page began "ikmc d dh knntxoryoe…" in both runs). On a second run, chat will notice.
  Suggestion: Seed the pages per run.
- **[minor] [narration]** The narration names "Shakespeare" (`ask`) and the card names "Hamlet". GAME.md says no names in the voice.
  Suggestion: "Given forever, could they type a famous play?". Keep the attribution in the notebook.
- **[idea] [streaming]** The gibberish page is very readable at stream size (033). Chat will hunt for accidental words ("no", "xud").
  Suggestion: On early pages, also highlight any real 2–3 letter words the RNG produced, and only have the narrator react to the planned ones.
- **Keep:** The yellow highlight on "to be" (038) and then the full line (042) make a great build-up. So do "(It pats your hand, and keeps typing.)" and "Forever takes a lot of bananas."

### simulation-argument
- **[major] [camera]** The giant-head reveal (057/058) is the best image in the hall. Then the camera cuts back to the study: the giant, the dome and the desk are gone, and the top half of the frame is empty paper-coloured void (059, t=90). The choice ("Switch them off" / "Leave them running") is made with nothing watching you.
  Suggestion: Keep the giant visible in the sky or background, blurred, during `choose`, or at least keep the dome's rim in shot. Frame the study so it fills the frame.
- **[major] [clip moment]** Both endings are over in 4–8 s and show nothing:
  - "Switch them off": the room dims and flickers (060/061), but the background void stays bright. The line says "Above you, the lights flicker", and no giant reacts.
  - "Leave them running": the card comes 4 s after you use the door (065/066).

  Suggestion: For "off", cut to the giant's hand hovering over their own switch for a beat and then pulling back (or not), and dim the void too. For "running", pull back once more to show the giant's desk has shelves of domes like yours.
- **[minor] [readability]** The arrival shot (046): on a small stream window, the "little world" on the desk is a few pixels.
  Suggestion: Start with a short push-in on the dome during the first line, then pull back to the room.
- **[minor] [flow]** Once "Run more worlds" is pressed, the reveal cutscene takes over control for ~20 s. That's fine, but "Look out of the window" did not respond while the photo line was playing (use timed out at ~t=17–46, and it worked later).
  Suggestion: Keep look() asides usable while another aside's line plays, or queue them.

### fermi-paradox
- **[major] [camera]** "Send a message" is the vote-worthy moment, but no transmission can be seen. The camera frames the dish (087–094), and the beam (`beam` in `fermi-paradox.js`, placed ~133 units up and angled away) never appears in any of my 8 screenshots.
  Suggestion: Tilt the camera up to follow the beam for 2–3 s, or add pulse rings that leave the dish in frame. Then hold on the silent sky for the "Nothing comes back" line.
- **[minor] [camera]** The player is cut off at the bottom edge in the arrival shot (071) and in the send shots (087, 089). The captions sit over the player and the desk (075, 082).
  Suggestion: Raise the framing so the player is at least 15% above the caption zone.
- **[minor] [pacing]** After "So where is everybody?" (208.3) there are 20+ s of nothing until you choose. That silence is on purpose, but on stream it's dead air with only a static waveform on screen.
  Suggestion: Keep the silence, but let the sky do something: a satellite drifting over, the frog's shooting star timed into the silence (I never caught the frog in 13 shots), or the waveform twitching once as a false alarm.
- **[polish] [clarity]** The hall portal is a *telescope*, but the vignette is a radio dish that you listen to.
  Suggestion: Make the hall portal a small dish or radio, or add an optical telescope to the scene.
- **Keep:** The night palette (071), the star-trail time-lapse (082), and "They left footprints, and went home."

### tragedy-of-the-commons
- **[major] [decision design]** You can ring the bell straight away, at 99% grass (run 2: one sheep, then the bell at t=105.5). The neighbours then agree on limits, and the card says "The grass came back", though it never went. It's the trivially "good" option, with no tension and nothing for chat to argue about.
  Suggestion: Unlock the bell only once the grass has visibly thinned (the "getting thin" line). Make the meeting cost something, e.g. one neighbour refuses unless you give up a sheep first. Or have the bell do nothing on the first ring ("Nobody comes. The grass looks fine to them.").
- **[minor] [camera]** The player is under the caption at arrival (097) and during the meeting (103). The meeting happens in the middle of the field while "you" stay at the bell, off to the side of the group. The line says "Together, you agree on limits", but you aren't in the circle.
  Suggestion: Script the player walking into the meeting circle, and frame the circle.
- **[minor] [clarity]** You can't tell which sheep are yours (098). When you've added 8, chat will want to point at "your" flock.
  Suggestion: Give the player's sheep a teal ribbon or collar, matching the player.
- **[polish] [feel]** The collapse is abrupt: grass went 0.71 → 0.01 in ~5 s after my eighth sheep, then the card appeared at 154.6. The sheep flopping over on bare dirt (111) is a good gentle consequence but lasts about 2 s.
  Suggestion: Hold the brown field for 3–4 s with the neighbours turning to look at you before the line.
- **Keep:** The grass colour going from green to straw (098 → 111) as the flock multiplies reads instantly at stream size. Also good: "Mine are the fat ones. Don't tell the others."

## Keep
- The hall as a set: the apple man, the raining bowlers and the sky walls. Portal labels with a ✓ once completed.
- The Simulation giant reveal and the "Look closer" zoom into the nested world (048, 050).
- The Monkey highlight build-up ("to be" → the full line).
- The Commons grass colour as a live meter.
- The Fermi night scene and the moon line.
- The funny aside lines (grandma, bananas, the vendor's shoes, the monkey patting your hand). These are what chat clips.
- Captions are big and readable at 1280×720.

## Harness notes
- `use <prompt>` waits up to 20 s. When the prompt is disabled (e.g. the gate once grandpa has passed), those 20 s of game time pass, which can let a scene end by itself. I note this so the Grandfather Paradox timings above aren't misread: in run 1 the scene had already reached `ask` before I started walking.
- In a shell loop, my `use` commands after a game-over ran against the card, and each timed out after 20 s. Not a game issue.
