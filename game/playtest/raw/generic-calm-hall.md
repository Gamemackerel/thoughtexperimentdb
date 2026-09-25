# generic-calm · hall

(notes in progress)

## Findings
### hall
- Arrived via ladder: pressing E on "Climb the ladder" cut straight to the hall in ~1s, no visible climb. Label "Down to the first room" + prompt sit on top of the player's head at spawn (shot 002-arrive.jpg).
- Hall: lovely. Gentleman talk cycles through 5 lines. His speech bubbles stayed on screen ("[speech]" listed) while I walked ~25 units away to the clock at 42s (spoken at 24-31s).
- No things to look at in hall besides gentleman (debug shows only portals+Talk). Pipe, mirror, apple room, easel are not interactable - as first-timer I'd want a line on the pipe.
### grandfather-paradox run 1
- Arrive at 43.6; captions 44.6, 49.6, 54.0, 58.4 ("So what happens if you stop him?"). I walked to the square at ~56. Gate already passed (disabled) by 60s. Tried "Tell him who you are": `use` failed in 20s - couldn't catch him. 68.7 phase over, they meet. Game over "You let it be" at 80.9. Whole run ~37s, I never got to act. The question is posed only 10s before the meeting.
- Caption at arrival overlaps player (008).
### gp runs 2-5
- Run2: closed gate at 91s (good, wind blows it, camera closes in nicely 016), block counted automatically, turned signpost - "Turn the signpost" and "Tell him" prompts both shown at once (107.1) - which does E do? Ending "It had already happened... You tried 3 ways... You could have stopped him, in a sense. You just didn't." -> "in a sense" + "never going to un-happen" feels contradictory to a first-timer.
- Run3: use "Tell him" from spawn: failed again, couldn't catch him. Run4: waited at (-2,0) in his path: prompt at 195.5, pressed E, pause 2.5s, but "He laughs..." line queued behind "ask" line, played at 203.7 (8s later) when he's already gone. Also block_fail fired though I only stood there.
- Notebook doesn't pause the scene (u advanced from .07 to .92 while reading). With a ~28s walk, reading the notebook costs you the run.
- Read the paper: works, debug listed it "[disabled]" at 1.9 dist (harness?).
- Go home early at 242.6: phase over, but queued lines "At the station..." and "So what happens if you stop him?" still played AFTER I left (243.4, 247.8). Then card "You left the past alone" at 261 - 18s after pressing Go home.
- Run always ends in game over after one pass; no in-scene replay / "same or different" acknowledgement.
- **Back to the house** from the GP game-over card took me to the FIRST ROOM spawn (0,5.5), not the hall beside the clock. Had to climb the ladder again.
### infinite-monkey run 1
- Arrive 269. "0 years" label is faint grey on grey at start (032). Room = one wall in a void.
- Narration: "Given forever, could they type Shakespeare?" (name in voice). Card: "a line of Hamlet".
- Wait a million years: counter spins 3s, overshoots to 1,010,417 (034-036). Prompt "Wait a million years" sits on top of the counter label (036).
- Frog visible in the wait (034) but I only glimpsed it.
- After wait 1: "A word. Just one" - highlighted "the" is inside "opthep" (038), not a standalone word. Re-reading shows the same page & repeats caption.
- Wait 2: "Two words". Wait 3: full "to be, or not to be, that is the question" at ~3 million years (040). Game over at 333.7 ("Given forever... bound to happen"). Whole vignette ~65s of game time, 3 lever pulls. As a first-timer I now believe it takes ~3 million years - scale badly misrepresented; the whole point (it's astronomically unlikely, forever is needed) is lost.
- Game-over card appeared over the open page (I hadn't put it down).
### infinite-monkey run 2
- Crate aside: "Forever takes a lot of bananas." good. Arrival line 2 "They hit the keys at random" didn't play on replay (maybe preempted by crate).
- Walk out ending: "forever is much, much longer than it sounds" - great, contradicts the other ending's 3 million years. Journal question on this card still says "The monkeys typed 'To be, or not to be'..." though I never saw that.
- Back to the house -> first room again (0,5.5).
### simulation-argument run 1
- Arrival 7.8 caption fine. Asides window/photo: nice lines. First "use Look at the photo" in explore seemed not to fire (no caption; time jumped to 46s) - unsure, harness?
- Look closer: zoom into the dome, then deeper into the inner dome (046,047) - lovely. After zoom (57s) returned to explore with nothing on screen, no prompt at my position (1.9,-3.2, behind the desk) -> didn't know what to do; had to walk around to find "Run more worlds" at the monitor.
- Run more worlds: shelves fill with domes, "which kind is yours?", reveal pull-back to giant's face over my dome (054) - best moment so far.
- Then phase "choose" at 87.8 with NO line, no prompt, ~20s of silence; "Leave them running" is at the door 9 units away and nothing hints it's a choice. I stood there confused.
- Switch them off: room darkens, "Above you, the lights flicker." (058) - lands well. Card at 120.8.
### simulation-argument run 2
- Replay: no acknowledgement of last choice. Door has no prompt before the choose phase (walked to it at 7,1: "Leave them running" disabled, nothing shown) - fine but no sign it'll matter later.
- Leave them running: "You let them run. Maybe someone is doing the same for you." Card 181.5 - good.
- Esc from the vignette also lands in the first room, not the hall.
### fermi-paradox run 1
- Arrival 8.1 "A clear night..." then 18s nothing; no hint to go to the monitor. Asides: moon line and logbook line are great.
- Listen (36.5) -> 4 lines -> "So where is everybody?" + prompt "Keep listening" at 50.5. The lever "Send a message" is cut off at the right edge of the frame (074, 072) and never mentioned; I didn't know sending was an option. Pressed Keep listening -> time-lapse -> card 69.3 "You kept listening". Journal question then asks "Would you send the message" - what message?
- Caption box covers the player at the monitor (072). Didn't see the frog/shooting star.
- Portal is a telescope, scene has a radio dish - fine but nobody "looks through" anything.
