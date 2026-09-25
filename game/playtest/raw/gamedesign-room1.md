# gamedesign · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
- The hub works as a hub. Every portal is labelled, completed portals get a ✓, you come back beside the portal you used, and the empty journal ("Nothing yet. Go through a door, a painting or a book.") is a good first goal. What's missing is any sense of *how much* of a vignette you've seen: it has no endings counter, and the journal only keeps the last ending per vignette.
- The biggest cross-cutting problem is that **an ending prompt sits on the spawn point**. In Brain in a Vat and Plato's Cave, one early press of E ends the vignette in 5–25 s, before the dilemma has been posed. The quiet "stay" option should come from *not acting* over time, not from a prompt you get the moment you arrive.
- **The rules aren't the same across vignettes.** Only the Trolley has the template's rewind → reflection → replay loop, an in-world exit and a twist. Brain in a Vat, the Cave and Ship each end on the first commit, and none of them has a way home except Esc or the card. A player who learns the loop in the Trolley will expect it everywhere.
- **Choices need a "do nothing" branch and fair feedback.** Ship has no do-nothing branch (I waited 80 s at the choice and nothing happened). In the Trolley, standing on the track in front of the five is silently ignored. The two Ship endings are voiced unevenly: one answers the question, the other asks it.
- **Replays cost too much.** "Play again" replays the whole setup every time: the Trolley re-earns its twist, the Cave replays a 22 s chained intro and Ship makes you carry six planks again (about 55–90 s). Reaching every ending is a chore, especially in Ship.
- There are several narration queue/order bugs (stale lines playing after an ending, the lever line coming after "Should you pull it?"). They make the feedback feel out of step with what the player just did.

## Findings

### house
- **[minor] [feedback/progression]** Completing a vignette only adds "✓" to its label. After I had reached 2 of 2 Trolley endings, 2 of 2 Brain in a Vat, 3 of 3 Cave and 2 of 2 Ship, the labels looked exactly the same as after one ending. The journal also shows only the **most recent** ending per vignette (Trolley showed "You chose yourself" and nothing about "Someone is always on the track").
  Evidence: shots/025-home.jpg and 067-journal3.jpg; journal text after finishing everything.
  Suggestion: store every ending per vignette. Show "2 / 2 endings" (or one pip per ending) on the portal label and in the journal, with unfound endings as blank pips (no names, so nothing is spoiled). This gives completionists a goal without making it a score.
- **[minor] [clarity]** The purple door (Cave) and the sky door (Ship) both prompt "Open the door". The Trolley painting is half-hidden behind the ladder in the spawn view, and the "Plato's Cave" and "Brain in a Vat" labels overlap (shots/051-home2.jpg).
  Evidence: `debug` interactables #3 and #5; shots/001-open.jpg, 051-home2.jpg.
  Suggestion: name the prompt after the portal ("Open the purple door", "Open the door in the sky"). Offset or stack labels that are close together so their pills don't overlap.
- **[polish] [onboarding]** The toast "Look around. Some things here lead elsewhere." plus the title card's control list is a good minimal onboarding. The journal's empty state gives the first goal. Keep it.

### trolley-problem
- **[major] [affordance/philosophy]** You can walk onto the main track and stand in front of the five. The trolley passes straight through you and hits them anyway, and the reflection says "You left the lever alone." That is the most natural "act, don't answer" move (put your own body in the way, like the footbridge/self-sacrifice variant), and the game quietly ignores it.
  Evidence: I stood at (4.8, 0.5) through the go phase, t≈208–214; shots/019-t211.jpg shows the trolley overlapping the player.
  Suggestion: either block the tracks during the slow phase (the player steps back with a line like "You can't outrun it."), or make it count: route it to the "You chose yourself" ending, which gives the self-sacrifice option to people who find it without the twist.
- **[major] [pacing/clarity]** The narration is on a timer while the explanation is on proximity. If you stay at the spawn, you hear "Should you pull it?" without ever being told there is a lever, because "This lever switches the tracks." only fires near it. When I did walk to the lever, that line got queued *after* the question (ask at 33.5 s, lever at 35.4 s). On a later run I was 12 units away talking to workers when "Should you pull it?" played.
  Evidence: run 1, t=33.5 vs 35.4; third visit, no lever line at all before "Should you pull it?" (t=969.5).
  Suggestion: make the lever line part of the timed sequence *before* "ask" (it can still fire early on proximity), or change "ask" to "Should you pull the lever?". Make the lever glow from the start of the slow phase, as GAME.md describes.
- **[minor] [feedback]** The game over after run 3 comes without any warning. I pulled the lever on run 3 expecting another twist or loop, and the card appeared. Nothing tells you the runs are limited.
  Evidence: runs 1→3, card at 167.4 s.
  Suggestion: add a line on the third run's reflection ("One last time.") or show three small run markers near the frame, so the ending feels authored rather than cut off.
- **[minor] [replay]** "Play again" resets `runs:0, twist:false`, so a player who wants the "choose yourself" ending has to sit through the whole first run again (~60 s) to unlock the third lever.
  Evidence: state right after Play again at t=169.7.
  Suggestion: once the twist has been seen, start "Play again" with the third track already there (the narrator can skip twist_1 and twist_2).
- **[minor] [consistency]** The main lever can be undone ("Put the lever back") until the fork. The self lever auto-walks you onto the track and locks your controls for about 14 s of slow creep, with no way back.
  Evidence: pulled at 247.6, locked until go at 262.1.
  Suggestion: either let the player step off before the fork (it's more dramatic if they *could* and don't), or shorten the locked creep once you're on the track.
- **[minor] [clarity]** "Go again, or step back through the frame." plays while the frame interaction is still disabled (twist phase). "Go again" isn't an action at all, because the next run starts on its own after about 4 s.
  Evidence: `debug` at t=74 and 1004: frame [disabled]; the slow phase starts by itself at 87.1 and 1022.3.
  Suggestion: enable the frame when this line plays, and reword it to "The trolley will come again. Or step back through the frame."
- **[idea] [progression]** The journal question asks about pushing someone off a bridge, a case the player never gets to play. The strongest link between play and journal would be to let the player *feel* that difference.
  Suggestion: after the three-run ending, unlock a short footbridge variant (or a painting in the hall) and point the journal question at the difference the player felt between the two.
- **[keep]** Slow motion at the choice, the long creeping silence, "Put the lever back", the slowed-down speech bubbles from the workers ("Loooveeelyyy daaayyy…"), the rewind, and the "again_same/again_diff" acknowledgement. The frame exit is the best "way home" in room 1.

### brain-in-a-vat
- **[major] [onboarding/endings]** "Sit down" (the "You stayed" ending) is enabled from t=0 and is 3.5 units from spawn, the first prompt a player sees. I pressed E 4 s after arriving, and the vignette ended ~20 s later without ever raising the doubt: the edge ("If none of this were real, how would you ever know?") was never shown. The reflection "Real or not, it's the only sun you have" then answers a question the player was never asked.
  Evidence: second run, `use "Sit down"` at t=397.3 → game over at 412.6; `edgeSeen:false`.
  Suggestion: keep the bench disabled (or have it say "Sit a moment" without ending) until `edgeSeen`. Better still, make the ending *passive*: you sit, the flicker returns, and only after a held silence does the vignette end.
- **[major] [consistency/choice]** The lab layers (1 and 2) offer one verb, "Step off the edge", plus one aside. You can't sit down, go back up, or refuse, and there's no rewind or replay acknowledgement. The central choice (keep checking vs. accept) exists only on layer 0, so after the first fall it's a corridor.
  Evidence: `debug` on layers 1 and 2: Sit down [disabled]; the only enabled items were the machine and the edge.
  Suggestion: add a stay option on each layer (a stool by the vat, "Stay here"), with its own reflection ("You settled for the lab. It felt just as real as the park."). That turns "No way out" into a choice the player makes at every layer.
- **[minor] [affordance]** The asides (tree, window) are disabled until you've seen the edge. At t=298 I stood 1.7 units from the tree and got no prompt. A curious player who explores the village first finds *only* the ending prompt.
  Evidence: `debug` at t=301: Look at the tree [disabled], dist 1.7.
  Suggestion: enable the asides from the start. They're the reason to explore before the edge.
- **[minor] [pacing]** The frog appears at arrival (shots/027-bivarrive.jpg), not during the choice as GAME.md prefers, and it's the first thing the eye goes to.
  Suggestion: move the cameo to the moment the player stands at the edge.
- **[polish] [notebook]** The notebook opens with "This short film traces the idea…", inside a game, and prints raw URLs.
  Evidence: `press n` at t=297.
  Suggestion: add a game-specific intro sentence for the notebook (or drop the film summary) and make the URLs link text.

### platos-cave
- **[major] [onboarding/endings]** At the same instant the chains come loose, "Sit back down" appears *on the player's own spot* (radius 2, dist 0). One E press (for example a player mashing E to break the chains) ends the vignette 0.2 s later with "You kept watching", before they've turned around.
  Evidence: second run, prompt at 567.1, press E → phase over at 567.3.
  Suggestion: make "keep watching" passive: if the player doesn't turn toward the fire for ~30 s after the chains fall, play the ending. Or enable "Sit back down" only once the player has looked at the fire. Don't put an ending prompt where the player is standing.
- **[major] [agency/pacing]** The chains fall on a ~20 s timer, and "Play again" replays the whole 22 s chained intro every time (3 plays = over a minute of watching the same shadows). During the chained phase the player's only affordance is looking left and talking to the two prisoners on the left, one of whom is behind the "Sit back down" prompt once free.
  Evidence: chained 544.5→567.1 and 578.0→600.6; `debug`: Talk #2 and #3 [disabled] while chained, all Talk disabled once free.
  Suggestion: let the player loosen the chains (hold E or tug with A/D) after the first two lines, and shorten the intro on replays. Keep the prisoners talkable after you're free: it sets up "Tell them".
- **[major] [navigation]** In the dark first-person cave, with no hint about which way to go, I walked into black nothing at (7.4, 10.5) (shots/043-walk.jpg, a fully dark frame). "A path leads up, towards a light." fired while the mouth was behind me. After "Your chains have come loose." there's no cue to turn around at all; a first-timer doesn't know that A/D turns in first person (I overshot a full 360° with a 3 s hold at 2.1 rad/s).
  Evidence: shots/040-back2.jpg, 043-walk.jpg, 044-mouth.jpg.
  Suggestion: add a soft light/sound cue from behind right after the chains fall ("Behind you, something crackles."). Give the mouth a light spill onto the floor that's visible from the fire, and reduce the turn speed or ease it in.
- **[major] [narrative bug]** In the "stay in the light" ending, the choice line "You could stay up here. Or go back down, and tell them." plays **after** "You stay in the light", just as the game-over card appears, so it contradicts the choice the player just made.
  Evidence: third run: sit at 610.7, "You stay in the light." 614.8, stale "You could stay up here…" 616.9, card 618.1.
  Suggestion: when an ending fires, cancel queued voice lines (`voice` queue clear), or gate "saidChoose" on the phase still being `free`.
- **[minor] [feedback]** "Tell them" is a single E press and the ending comes at once. "They laugh" happens only in the narration; the prisoners don't react (no bubbles, no turn of the head).
  Evidence: shots/049-t540.jpg, over 0.2 s after the press.
  Suggestion: have each prisoner answer with a silent speech bubble (laughing, "Your eyes are ruined") as you pass them, then the ending. That makes the gentle "consequence" visible, in line with the other vignettes.
- **[minor] [pacing]** "It's too bright to look at." played *after* I was already outside (t=607.7) when I walked quickly.
  Suggestion: fire it on approach to the mouth and drop it if the transit has started.

### ship-of-theseus
- **[major] [choice design]** At the choice there's no "do nothing" option. I stood between the two ships for 80 s and nothing happened, and there's no "walk away / let both sail" ending, which goes against pillar 2 ("Doing nothing is always a real option").
  Evidence: `choose` phase from t=852 to 920 with no change.
  Suggestion: after about 30 s of silence, both ships sail off without you: "Two ships leave the harbour. Both of them say they're the ship of Theseus." That's a third ending, and it's the one closest to the real puzzle.
- **[major] [affordance]** The two boarding prompts are 1.8 units apart (radius 2.4 each). From anywhere in the middle of the dock you only get "Board the ship of new planks"; to board the old wood you have to go to the far edge (z≈1.4). The harness's own `use "Board the ship of old planks"` failed for 20 s.
  Evidence: `debug` at t=768: #2 at (16,-0.9), #3 at (16,0.9); shots/058-t738.jpg.
  Suggestion: put the gangplanks at opposite ends of the dock (or on opposite sides, several units apart), each with its own label over its ship.
- **[major] [pacing/replay]** Reaching the choice takes six identical fetch-and-place trips (~55 s even with perfect pathing, ~90 s playing normally). Only trips 1, 3 and 6 get a line, and "Play again" makes you do all six again for the other ending.
  Evidence: second run: swaps 1–6 from t≈796 to 836, choice at 852.
  Suggestion: make each trip faster (carry two planks, or have the planks stacked closer), give each swap a small distinct beat (the fisherman comments, the purple keeper picks up the old plank), and on "Play again" start at the choice with a short recap.
- **[minor] [feedback/fairness]** The two endings are voiced unevenly. New ship: "Its parts changed. Its story didn't. … it never stopped being the ship that sailed" (an answer). Old wood: "Every plank is the same. But is the ship?" (a question). Choosing new is confirmed as right; choosing old gets doubted.
  Evidence: captions at 777.5 and 922.9; card subtitles.
  Suggestion: give both endings the same shape: state what this choice holds on to, then add one doubt about it.
- **[polish] [UI]** The speech bubble "I kept every one. Seemed a shame to burn them." stays through the ending and shows behind the game-over subtitle.
  Evidence: shots/062-over-ship.jpg.
  Suggestion: clear speech bubbles when `ctx.gameOver` fires.
- **[minor] [narrative]** The opening line names a person ("The ship of Theseus."), and so does "Which one is the ship of Theseus?", against the pillar that names stay out of the voice.
  Suggestion: "An old ship. Its wood is getting old." / "Two ships. Which one is the ship?"

### cross-vignette (consistency)
- **[major] [consistency]** GAME.md's template (consequence → rewind → reflection → replay with "same/different" acknowledgement, plus a twist) is fully built only in the Trolley. Brain in a Vat, the Cave and Ship end on the first commit, have no replay acknowledgement, and have no in-world way home (only Esc or the card). The Trolley teaches players that choices are rehearsable; the next three vignettes break that.
  Suggestion: either give each vignette at least a "replay acknowledged" loop and an in-world exit (a bookmark in the vat world, the cave mouth, the dock's end), or clearly change what GAME.md promises.
- **[minor] [game-over card]** The card says "GAME OVER" even for endings that are acts of meaning ("You chose yourself", "You went back"). In a game with "no fail states", "Game over" reads as a loss.
  Suggestion: use "The end" or the vignette's own name as the kicker, and keep the ending title as it is.

## Keep
- The title card, the hub toast and the journal's empty state: minimal onboarding that works.
- Coming back beside the portal you used, the ✓ on labels and the glowing journal.
- The Trolley's creep and slow motion, "Put the lever back", the rewind, the replay acknowledgement lines, and the frame as an in-world exit.
- The cave's switch from first person to third person at the mouth, and the "eyes" adaptation on the way back down.
- The asides: the Trolley workers' slowed speech, the Ship fisherman ("they have replaced every board of it since"), the "Nobody home" window. They're short, funny and don't get in the way.
- The journal answer is pre-filled on "Play again" and saved to the journal.

## Harness notes
- `use "<prompt>"` walks to the interactable's centre, so when two prompts overlap (Ship's boarding pair) it can't reach the second one. I had to `walk` to the dock edge.
- In first person, `hold a 3` turns a full ~360° (2.1 rad/s), which makes it look as if turning does nothing. Use holds of about 1.5 s to turn around.
