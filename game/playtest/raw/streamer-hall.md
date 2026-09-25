# streamer · the hall

## Summary
(in progress)

## Findings
### hall
- notes: ladder -> hall transition ~1s, arrival toast "A long hall. More doors, of a sort." Hall is a strong thumbnail (apple man, raining bowlers, clouds wallpaper). Apple man 5 bubble lines, "Talk" prompt sits on top of his hat/face (shot 008). No look() asides on pipe/mirror/apple room/train.

- gp run1: arrived t=39.8, watched intro captions ~13s (as streamer talking to chat), then walked to gate (use Close the gate) -> gate disabled; grandpa met grandma by t=65, game over "You let it be" at t=77. Whole first run 37s, zero choices made. Meet moment is tiny at right edge (shot 014). Player at bottom-left corner under captions at arrival (011, 013). Frog appeared at t~52 near fountain during intro, not during choice.
- gp run2: rushed gate (t82.8 closed), wind line at 88.8 with nice closeup (019) but gate swinging not visible (grandpa/player occlude). Pressed "Tell him who you are" at 91.3 -> caption "He steps around you, and apologises" (block, because tell-prompt puts you in his path) at 92.9; the tell_fail "He laughs..." arrived at 106.3, 15 s late, after see_gm+ask queue; he's long gone. Signpost unreachable (disabled before I got there). Over at 108; card "You tried 3 ways" (I intended 2). Whole run ~46 s.
- gp run3: vendor + paper asides fine; paper line delayed "That's your grandfather" to t=138 (grandpa already at seg3). Signpost turned; sign_fail caption at 155, 2 s AFTER phase over. Standing by grandma counted as "block". Grandma "Have we met? You have a familiar face." = clip line; bubbles overlap each other (027). Central question 'ask' at 146, 5 s before they meet.
- gp run4: Go home at once -> end lines interleaved with the intro: "You came all this way, and changed nothing." / "That's your grandfather. Young, and in a hurry." / "Maybe that's the only story that works." (bug: intro async not cancelled).
- ISSUE: "Back to the house" on the GP game-over card lands you in the FIRST ROOM at the default spawn (0,5.5), not in the hall by the clock. Must climb the ladder again each time.
### infinite-monkey
- run1: arrival wide shot fine (031). "Say hello" -> "(It pats your hand, and keeps typing.)" cute. Page is very readable on stream (033). Lever: 3 s counter spin, 0->1,000,000 yrs, nothing in the room changes (034/037), prompt covers counter (037). 'to be' highlighted after 2 waits (038) = good chat moment. Full line at 3 waits (t=252) -> over. Whole run ~50 s after arrival. Card text says "Hamlet" (name). Narration says "Shakespeare".
- run2: lever is disabled until you've read a page once (fine). Lever x3 w/o reading, then read -> full line highlighted (041/042) = best clip of the vignette. Pages are identical on replay (same seed) - chat would notice.
- run3: bananas "Forever takes a lot of bananas" (good joke). Walk out -> "Forever is longer than it sounds" — contradicts the other ending, where it takes 3 lever pulls/3 million years. Only choice in the vignette is pull-lever vs leave; no chat-vote tension.
### simulation-argument
- run1: arrival wide (046) - little world on desk is unreadable at stream size. photo aside good line. Window prompt disabled while photo line plays? (use timed out once, later worked: "You've never actually checked how far it goes."). Look closer zoom (048, 050) great. Run more worlds -> auto reveal: giant head over dome (057/058) = THE thumbnail. Then cut back: top half of frame is empty paper (059). Switch off at 90.7 -> dim flicker (060/061), background sky stays bright; no giant reaction. Over at 98. ~90 s total.
- run2: Leave them running -> card 4 s later, nothing plays out (065/066). Esc from any hall vignette -> browser-native confirm, then FIRST ROOM spawn (not hall).
### fermi-paradox
- run1: arrival night scene is beautiful/moody (071) but player's figure cut off at bottom edge; portal is "telescope" in hall, scene has a radio dish. Moon line "They left footprints, and went home." strong. Logbook line fine. Listen -> 3 lines, "So where is everybody?" at 208; then ~20 s nothing. Keep listening -> timelapse star trails (082) -> card at 242. Captions cover the player/desk in 075/082. Didn't spot the frog/shooting star in 5 shots.
- run2: Send a message at 274.5 -> camera frames the dish (087) but no beam visible in any of 8 shots (code has a beam at y~133 rotated up; it's out of frame). The chat-vote payoff has no visual. Player's head cropped at bottom edge (087/089). Card at 292 (18 s).
