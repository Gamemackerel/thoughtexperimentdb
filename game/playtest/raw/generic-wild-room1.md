# generic-wild · room 1 (house, trolley-problem, brain-in-a-vat, platos-cave, ship-of-theseus)

## Summary
(in progress)

## Findings
### house
- **[minor] [collision]** From the Plato's Cave door corner, `use Step into the painting` (auto-walk/steering toward the painting) got stuck for 20 s at (-7.2, -1.4) against the Penrose staircase; a single `hold d` freed me. Earlier `walk -5 -6` also stopped there.
  Evidence: t≈7–27 s, house, (-7.2,-1.4).
  Suggestion: give the staircase a rounded/convex collider or add a waypoint so tap-to-walk slides around its left edge instead of pinning against it.
- **[idea] [interaction]** Standing on the sky window in the floor (0,5.5 → -1.3,5.9) and pressing E / N does nothing. As a player who does the "wrong" thing, the hole in the floor is the first thing I'd poke.
  Suggestion: one `look()` aside line or a tiny wobble/cloud drift when you step on it.

### trolley-problem
- **[major] [narrative/bug]** Run 1: I ignored the lever and walked straight onto the main track in front of the trolley at (-5, 0) and stood there. The trolley slowed, the whole choice beat played around me, then in `go` it drove *through* my figure (it tilts, is shoved, controls lock), hits the five, rewinds — and the narrator says "You left the lever alone. The trolley stayed on its track." Standing on the track (the classic "throw yourself in" move) is not anticipated at all; nothing happens to me and the reflection is wrong about what I did.
  Evidence: t 38–85 s, you at (-4.9,-0.1); shots 008–014 (`build/agentplay/generic-wild-room1/shots/010-t68.jpg`, `011-t73.jpg`).
  Suggestion: either block the track (invisible fence / the player steps off with a small "not yet" nudge) or, better, honour it: treat standing on the main line as the drastic "yourself" ending (the trolley stops at you / knocks you flying like the others) with its own line. At minimum the player must not be passed through.
- **[minor] [camera]** During `aftermath` of that run the camera followed the trolley and the victims and my own figure was out of frame, so I couldn't see what happened to me.
  Evidence: `012-t77.jpg`.
  Suggestion: keep the player in the framer's point set during the consequence.
- **[minor] [clarity]** On run 1 the "Step back through the frame" exit is disabled and (as far as I could see) not visible, so a player who wants out before the trolley arrives has only Esc. I walked to (-19, 10) during `slow` and nothing was there.
  Evidence: t≈151 s, `019-frame.jpg`; debug shows #2 `[disabled]`.
  Suggestion: fine to keep it hidden, but then show a small "Esc: back to the house" hint once when the player walks away from the action toward the spawn.
- **[minor] [clarity]** The trolley journal question ("…wouldn't push someone off a bridge…") refers to a bridge/footbridge scenario the vignette never shows. After I'd just stood on the tracks and sent the trolley at myself, this came out of nowhere.
  Evidence: game-over card, `017-over.jpg`.
  Suggestion: add one line on the card ("There's a version with a bridge and a large stranger…") or ask about the ending the player actually reached (e.g. for "You chose yourself": "Is it braver, or just different, to choose yourself?").
- **[polish] [behaviour]** The lever can't be pulled once `go` starts (my `use Pull the lever` during `go` silently waited out the whole run). OK by design, but nothing tells you; the prompt just isn't there.
  Suggestion: keep the lever prompt visible but greyed, or have the figure reach and miss.

### brain-in-a-vat
- **[minor] [camera/UI]** When the edge you reach is on the near (south) side of the island, the camera frames the whole disc and puts the player at the very bottom of the screen, where the caption pill and the "Step off the edge" prompt cover the figure completely. I couldn't see myself at the moment of the choice.
  Evidence: t≈324–331 s, you at (-11, 14) and (-8.9, 17.9); `021-run.jpg`, `022-push.jpg`.
  Suggestion: bias the framer so the player never sits in the bottom ~20% (caption zone), or move the prompt above the player when the caption is showing.
- **[polish] [frog]** The frog was sitting right at my feet in the very first second (arrival), before anything had happened, not during the choice.
  Evidence: `020-arrive.jpg`, t≈318 s.
  Suggestion: if it's meant to be the choice-time cameo, delay it until the edge has been seen.
- **[major] [narrative/philosophy]** Sitting on the bench straight away (`use Sit down` 0.8 s after arriving, before any edge or flicker) ends the vignette with "You stayed · You never found out whether the sun was real. You felt it anyway." But I never had any reason to doubt the sun: the doubt (flickering edge) never appeared. The ending congratulates a choice I didn't make.
  Evidence: t 386–403 s, state `edgeSeen:false` at `phase:over`.
  Suggestion: before `edgeSeen`, make the bench an aside (sit, one line, get up) and only make it the ending once the edge has been seen; or give the no-doubt sit its own line ("You never went looking.").
- **[minor] [bug/voice order]** In that same instant-sit run the arrival line was queued behind the ending: captions went "The grass, the trees, the warmth. All of it feels solid." → "You sit down. The sun is warm." → "A sunny afternoon. Everything feels real." → "Real or not, it's the only sun you have." The arrival line lands third, after I'm already seated.
  Evidence: t 386.6 / 391.1 / 394.4 / 398.3 s.
  Suggestion: drop (or cancel) a queued arrival line once the choice/ending lines start.
- **[minor] [pacing]** Holding one direction and pressing E three times finishes "No way out" in about 60 s (arrival 317 s → card 385 s) with six short lines; the layers 2 and 3 edges are reachable within ~5 s of landing, and the third landing goes straight to the card, so the "and again… and again" never builds. As an impatient player I rushed right past the point.
  Evidence: t 317–385 s.
  Suggestion: make each lab's edge flicker only after a beat (e.g. after the "So this is what's real. Isn't it?" line has finished plus a few seconds, or after you've walked up to the jar), and give the last layer a short hold (camera pulls back through the stacked worlds) before the card.
- **[idea] [interaction]** In the lab I walked up to the jar and spammed E: the brain/jar has no interaction; only the machine aside. The obvious "wrong" thing a player wants is to tap the glass or tug a wire.
  Suggestion: a one-line `look()` on the jar ("You tap the glass. Somewhere, a sky ripples.") would reward the poke without changing the story.

### platos-cave
- **[major] [bug/UI]** A prisoner's speech bubble got stuck on screen. While still chained I pressed E (and Space) a couple of times near the neighbours, which triggered their `Talk` lines; two bubbles overlapped ("What's behind us? Nothing. Just rock." on top of "Best seat in the house, this."), and then "Best seat in the house, this." stayed pinned at the same screen spot (~843, 238) for the rest of the scene: while I faced the wall in a dark corner, while I stood in the fire, and even **outside in daylight** after the transit (it floats over the tree next to the sun).
  Evidence: t≈423 s onward, still there at t=484 s outside; `030-chained2.jpg`, `033-wall.jpg`, `035-turned.jpg`, `036-fire.jpg`, `038-outside.jpg`.
  Suggestion: give talk bubbles a lifetime and hide them when the speaker is behind the camera / out of frame / on another island; clear all bubbles on the `transit` flash. Also don't let a second `Talk` open while the first bubble is showing.
- **[minor] [premise]** Chained, turning as far right as the yaw limit allows (hold D), the right edge of the view shows a bright white shape (daylight/cave mouth), while the prisoner next to me says "What's behind us? Nothing. Just rock."
  Evidence: `030-chained2.jpg`, `031-chained3.jpg` (right edge), yaw 1.94 from spawn 3.14.
  Suggestion: tighten `yawLimit` while chained or block that sightline with a rock, so the first sight of light is earned.
- **[minor] [clarity]** After "Your chains have come loose." I walked the wrong way (into the shadow wall and a dark corner) and waited ~28 s: no line, no light cue, nothing nudged me to turn around. In first person, facing the wall fills the screen with flat brown (`035-turned.jpg`), and there's no sense of where the fire is.
  Evidence: t 437–468 s, (-11.7,-7.5) and (-5.1,-8.6).
  Suggestion: after ~12 s free and still facing the wall, have firelight flicker on the wall / your own shadow appear on it (that's the natural cue in the allegory), or let the "turn" line fire on a timer too.
- **[polish] [narrative]** "Behind you, a fire…" fires on crossing z>0, i.e. when I'm already facing and standing next to the fire (tap-walk took me right up to/into the flames, `036-fire.jpg`). "Behind you" reads wrong at that moment.
  Suggestion: trigger it on first yaw toward the fire (dot product) rather than on position, or reword to "A fire. People carrying cutouts…".
- **[major] [input/ending]** E-spam ends the cave by accident. The "Sit back down" prompt is live at your seat the instant the chains fall, so a player who has been mashing E/Space while chained (which also triggers the neighbours' `Talk`) gets "You turn back to the wall… It's easier." and the "You kept watching" card 0.2 s after being freed, having never chosen anything.
  Evidence: run 2, freed at 543.9 s, E at 544.0 s → `phase: over`.
  Suggestion: enable "Sit back down" only after the player has moved/turned away from the seat once (or after ~3 s free), and swallow E presses held over from the chained phase.
- **[minor] [soft-lock-ish]** After going back down (`returned:true`), I changed my mind and walked back up the path to the mouth (17.5, 6 → 20.5, 6.3): nothing happens, the view is black rock, no line. You can't go back up and "Sit back down" is disabled too, so the only ways out are "Tell them" or Esc, and nothing says so.
  Evidence: t 499–509 s, `039-stuckmouth.jpg`.
  Suggestion: either allow returning to the light (a third, honest option: you came back and left again) or have the mouth say one line ("The light is too far now.") and turn you back toward the others.
- **[minor] [journal]** The one cave journal question ("…later saw differently… did you try to tell anyone?") is shown for all three endings, including "You kept watching", where I never turned around at all.
  Suggestion: per-ending questions, or a question that also works for staying ("What would it take to make you turn around?").
- **[polish] [visual]** "Look in the pond" says "Your reflection… this one looks back" but the pond is a flat blue disc with no reflection of the figure.
  Evidence: `042-t594.jpg`.
  Suggestion: a mirrored, darkened copy of the peg figure in the pond (or a simple planar reflection) while standing at its edge.
