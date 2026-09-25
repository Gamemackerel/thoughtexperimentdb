# gamedesign · the hall

## Summary
- The hall works as a hub and is easy to read: one straight row of five portals, each labelled on approach, with a ✓ once finished. But **both ways out of a hall vignette (the card's *Back to the house* and Esc) drop you in the first room**, so every vignette costs a ladder climb and a walk back. It's the biggest hub friction.
- Across all five hall vignettes the GAME.md loop (choice → consequence → **rewind → replay that remembers you → twist**) is missing: each is a single ~30–90 s run straight to the game-over card, and *Play again* restarts cold with identical lines. They feel like one-shot dioramas next to the trolley's three-run structure.
- The decisions are thinnest where the idea is richest: the monkeys' lever is a fixed 3-click progress bar, the commons' bell is a free win at any time, and Fermi's terminal "Keep listening" sits on the same prompt as "Listen", so a second E ends the vignette.
- Rules aren't consistent between rooms: prominent levers are silently disabled until you've done step 1 (monkeys, Fermi), exits are available always / after the question / only at the choice / never depending on the room, and "doing nothing" is an ending in some rooms and a soft-lock in others (commons).
- Grandfather Paradox runs on a real-time clock that doesn't wait for you (even the notebook doesn't pause it): a player who reads the paper or the notebook gets the "You let it be" card without ever having had a choice.

## Findings
### hall
- **[major] [hub/progression]** Finishing a hall vignette and clicking *Back to the house* on the game-over card drops you in the *first room* at its centre spawn (0, 5.5), not in the hall beside the portal you used. To try the next hall vignette you must walk to the ladder, climb, and walk the hall again every time.
  Evidence: grandfather-paradox game-over → `#over [data-act=home]` → `level=house you at (0.0, 5.5)` (t=163s).
  Also Esc from a hall vignette (simulation, t=170) → first room (0, 5.5).
  Suggestion: the card button and Esc should return to the room that owns the portal (`hall`, with `ctx.from` = the vignette id so you stand by the clock). Label it by room ("Back to the hall").
- **[major] [consistency/replay]** None of the five hall vignettes has the rewind-and-replay structure GAME.md §3 promises (endings "after a small number of completed runs", "replay acknowledges the second choice", a twist after the first run). Each ends on its first resolution; *Play again* reloads the level from the arrival line (grandfather ~27 s, simulation ~50 s of repeated narration before the choice returns). Ending variety therefore comes only from menu-level replays, and the narrator never reacts to what you did last time.
  Evidence: every hall vignette, 2–4 runs each.
  Suggestion: adopt one shared pattern in a helper (e.g. `ctx.runs` + `voice.say('again_same'|'again_diff')`): after the consequence, rewind in-scene and return to the choice beat; the second pass acknowledges the first; the card appears after run N or on the drastic option.
- **[minor] [consistency/affordance]** Inconsistent rules across rooms, which undermines what players learn in one room and apply in the next:
  prominent levers disabled silently until a first step (monkeys: until you read; Fermi: until you listen); exits available from spawn (grandfather "Go home"), after the question (monkeys "Walk out"), only at the choice (simulation door), or not at all except as an ending (Fermi, commons); doing nothing ends the scene (grandfather) or stalls forever (commons, Fermi before listening).
  Suggestion: a house rule, written in GAME.md: (1) every object that looks usable shows a prompt from arrival, even if it only says "Not yet" or gives a line; (2) every vignette has a visible way home from arrival; (3) doing nothing always resolves within ~60 s of the question.
- **[minor] [pacing/notebook]** The notebook (`N`) doesn't pause time. In the grandfather vignette, 10 s in the notebook took him from seg 0 to seg 3, past both the gate and the signpost, so the "optional, for the curious" page costs you the choice.
  Evidence: `open grandfather-paradox`, `press n` at t≈2, `wait 10` → seg 3.
  Suggestion: freeze the level's `update` while the notebook (and the journal) is open.
- **[polish] [UI]** Esc uses the browser's native `confirm()` ("Leave this vignette and return to the house?"), which breaks the hand-made look of every other panel and says "house" even when you'll want the hall.
  Suggestion: an in-game card styled like the game-over card, with "Back to the hall" / "Stay".
- **[idea] [progression]** The ✓ on a hall label says you finished a vignette but not that other endings exist, and the journal (downstairs) keeps only the *latest* ending (my grandfather entry showed "You left the past alone", overwriting "It had already happened"). There's no pull to replay.
  Suggestion: show endings found on the portal label ("Grandfather Paradox · 2 of 3"), keep all endings reached in the journal entry, and put a second journal (or a guest book) in the hall so hall players meet it.

### grandfather-paradox
- **[major] [pacing/goals]** The whole vignette is one ~40 s walk on a fixed clock with no choice beat. The grandfather starts walking the moment you land (seg 0 u=0.89 five seconds in), the central question "So what happens if you stop him?" is only voiced at seg 3, ~5 s before they meet, and then it's game over. On my first run I read the newspaper (the aside the level puts right by the spawn), walked towards the gate, found "Close the gate" already disabled, and the card told me **"You let it be"**, which is a judgement of a choice I never got to make.
  Evidence: arrive t=55, paper t=65, `use close the gate` → "disabled right now", `phase: over` t=80.3, card t=92.5 "You let it be".
  Suggestion: hold the grandfather at his front door until the player first moves off the machine (or until the `see_gf` line finishes plus a beat), voice the question *before* the first opportunity (gate), and slow him down (time slow per GAME.md pillar 3) when the player is within reach of an interactable. Don't award "You let it be" to a player who never had an enabled option in range; loop the walk instead ("He sets off again" / rewind) so the first run is a learning run.
- **[major] [structure/replay]** No multi-run structure and no rewind: a single walk ends the vignette, and *Play again* restarts cold with the same arrival line; the narrator never acknowledges that you already tried (GAME.md §3: "the narrator acknowledges whether you chose the same or differently"; endings after "a small number of completed runs"). There's also no twist after the first run.
  Evidence: runs 2 and 3 open with the identical "The past. The town where your grandparents met." and same script.
  Suggestion: rewind the town after the meeting (the time-travel theme begs for it) and let the player try up to 3 walks in one visit; on run 2+ voice a short acknowledgement ("Again." / "Different door this time."), and use the "tried N ways" ending only after the last run. A twist could be that on run 2 you see evidence of your *own* earlier attempt (the gate already closed, a second you by the signpost).
- **[minor] [feedback]** Feedback for turning the signpost ("He doesn't even look at the sign") is queued behind `see_gm` + `ask` and plays at t=125 — *after* the meeting and after `phase: over` — so the consequence of the action arrives out of order with the reflection.
  Evidence: turned sign t≈113, sign_fail caption 125.1 s, phase over 124.1 s.
  Suggestion: give failure lines priority (interrupt/skip the queued descriptive lines), or trigger `sign_fail` when he passes the sign, not when u>0.6 of seg 4.
- **[minor] [feedback/fairness]** "Stand in his way" counted as an attempt when I merely walked past him on my way to the signpost ("He steps around you, and apologises."), and the card said "You tried 4 ways". An accidental bump reads as a deliberate choice.
  Evidence: run 2, walking from gate to signpost at t≈111.
  Suggestion: count blocking only when the player stands still in his path for ~1 s, or require facing him.
- **[minor] [onboarding/affordance]** The first and only prompt at spawn is **"Go home"**, and one E press ends the vignette with no confirmation (card at t+2 s: "You left the past alone"). A player mashing E to "interact with the time machine" or skipping a line leaves immediately. Meanwhile the paper aside is the next nearest thing, luring you away from the clock-driven action.
  Evidence: run 3: press e at t=147 → phase over 147.4.
  Suggestion: disable "Go home" for the first ~10 s or until the grandfather is seen; or make it a two-step ("Go home?" → E again). Move the paper stand along his route so reading it doesn't cost the whole run.
- **[minor] [bug/narration]** After leaving early, the queued `see_gf` line ("That's your grandfather. Young, and in a hurry.") plays *between* the two reflection lines, since the grandfather still walks into view.
  Evidence: run 3 captions: 149.6 "You came all this way…", 153.3 "That's your grandfather…", 157.1 "Maybe that's…".
  Suggestion: stop discovery triggers once `S.phase === 'over'`.

### infinite-monkey
- **[major] [core loop/decision]** The loop is a fixed 3-step progress bar: pull lever (3.2 s), read page, repeat; the third pull *always* yields "to be, or not to be", with pages 1 and 2 scripted to show exactly one and two words. There is no uncertainty, no decision and no reason to read between pulls (I pulled 3× without reading, then one read ended the vignette at t=197). The only real choice is "Walk out", and the lever is a "next" button. It also teaches the opposite of the idea: that Hamlet is 3 million years away.
  Evidence: run 2, `waits` 0→3 by lever only, one `Read a page` → `phase: over`, card "Three million years of noise, and then a line of Hamlet."
  Suggestion: make the wait an act of patience the player controls and can give up on: e.g. holding the lever spins the counter by orders of magnitude (10³, 10⁶ … 10⁵⁰ years; add a "the universe ends" beat when it passes ~10¹⁰⁰), with each page showing the *best* fragment so far found by chance (length growing roughly logarithmically). The ending then asks whether you keep holding past the heat death, which turns "walk out" into a real position (the finite vs. the ideal "forever").
- **[minor] [affordance]** "Wait a million years" is silently disabled until you have read one page (`enabled: S.readAt >= 0`). A player who goes to the glowing red lever first (the most game-like object in the room) gets nothing: no prompt, no line, `use` fails for 20 s ×3.
  Evidence: run 2, three `use wait a million years` attempts from t=87 to 160, `waits` stayed 0.
  Suggestion: always enable the lever, or show it with a dimmed prompt "Read a page first", or have the monkey nearest the lever hand you a page.
- **[minor] [UI]** The prompt pill "E Wait a million years" sits exactly on top of the years counter label, so the one piece of feedback for the action (the counter) is hidden while you stand at the lever.
  Evidence: shots/025-t38.jpg.
  Suggestion: anchor the counter to the back wall (a big mechanical odometer) or offset the prompt below the lever.
- **[minor] [feedback]** The counter overshoots: after "A million years go by." it rests at 1,010,417 and 2,010,417 years, but 3,000,000 on the final pull. It reads like a bug.
  Evidence: status after each pull.
  Suggestion: clamp the counter to the exact target at the end of each wait.
- **[minor] [narrative/journal]** The *Walk out* card says "You never saw it happen", but the journal question on the same card says "The monkeys typed 'To be, or not to be' without meaning it…", so it presumes an event the player didn't see.
  Evidence: run 1 card at t=76.
  Suggestion: per-ending journal question, or phrase it conditionally ("If a monkey typed…").
- **[polish] [UI]** On the Hamlet ending the page overlay stays up behind the game-over card; the typewriter text shows through and makes the card hard to read.
  Evidence: shots/029-card2.jpg.
  Suggestion: close `ctx.page` before `ctx.gameOver`, or let the player close the page first and hold the card until then.
- **[polish] [feedback]** Re-reading without waiting gives the identical page and the same caption again ("Two words, in the right order."); "Read a page" implies a fresh one.
  Suggestion: new random page each read with a line like "More nonsense." until the next wait.

### simulation-argument
- **[major] [choice/clarity]** The choice phase starts in silence with no prompt in view and no question voiced *as* a choice. After the pull-back, `phase: choose` at t=121.8; the player is standing at the monitor end of the desk, the lever ("Switch them off", radius 1.8) and the door ("Leave them running", 7 m away) show nothing until you blunder into them. The last line ("Somewhere, someone may be looking at you the same way.") is a reflection, not a prompt. I stood 15 s with an empty screen. A player who doesn't know they are being asked something just walks out the door (which *is* an ending) without knowing it was a decision.
  Evidence: t=121.8–137 no text on screen; shots/045-t127.jpg.
  Suggestion: at `choose`, light the lever (glow/pulse like the trolley lever) and open the door a crack with light spilling in, then voice one short beat ("You could switch them off.") and hold a long silence. Consider making the door visibly *closed* before `choose` so its opening is the signal that the scene now lets you go.
- **[minor] [affordance/tap-to-walk]** Tapping the little world on the desk (the obvious thing to tap) walked me *behind* the desk to (1.1, -4.6), where the "Look closer" prompt (radius 2.2 around (0.6, -1.8)) disappeared. On touch there is no way to "tap the object"; you tap the ground near it and hope.
  Evidence: `click 610 330` at t=11.8 → arrived at (1.1, -4.6), prompt shown at 12.7 then gone; shots/035-t24.jpg.
  Suggestion: when a tap ray hits an interactable's mesh, walk to its interaction point (the front side) and show its prompt; this is a global rule worth adding in `interact.js`.
- **[minor] [affordance]** The exit door is dead until the choice phase (`Leave them running` disabled in `explore`), and nothing tells you. Walking to the only door in the room early gives no prompt, so the only way out is Esc. Every other vignette in the hall has an always-available way out (grandfather's "Go home", monkeys' "Walk out" after the question).
  Evidence: run 2, `use leave them running` → "disabled right now" at t=166.
  Suggestion: make the door usable from the start with a neutral early exit ("Leave the study"), which gives a third ending ("You never looked").
- **[minor] [structure/replay]** Same as grandfather: *Play again* replays every line verbatim (arrive, look, nested, more, ask, pullout ≈ 60 s before the choice comes back) with no acknowledgement of the previous choice, no skip, and the forced sequence Look closer → Run more worlds must be redone.
  Evidence: run 2 ~50 s from arrival to `choose` again, identical captions.
  Suggestion: on replay, start at the choice (the camera already pulled back), with one line that remembers ("Last time you switched them off.").
- **[polish] [asides]** Window and photo asides are disabled until you've looked closer (both listed `[disabled]` at arrival), so the first 10 s in the room have nothing to poke except the main object.
  Suggestion: enable asides from arrival; they are the natural thing to do while the arrival line plays.

### fermi-paradox
- **[major] [controls/accidental ending]** "Keep listening", the ending action, appears on the *same spot and same key* as "Listen", the action you just did, the moment the question is asked. A player who presses E again (to listen more, or to skip a caption) ends the vignette on their first interaction: Listen → 15 s of lines → E → time-lapse → game over at ~80 s, having never seen the send lever used.
  Evidence: run 1, `use listen` t=28.9, "So where is everybody?" + prompt "Keep listening" 42.9, one E at 69.2 → `phase: lapse` → card at 81.7.
  Suggestion: make keeping-listening the *passive* branch (GAME.md pillar 2: doing nothing is a real option): sit in the chair and let the nights pass on their own after ~30–40 s of silence, or require the player to sit in the chair (a distinct object). Don't put a terminal action on the same prompt anchor as a non-terminal one.
- **[major] [structure]** One binary choice, one run, ~70–80 s end to end, no replay loop, no twist, no rewind; the card's journal question ("Would you send the message…?") is asked identically of players who never discovered the send lever. It's the thinnest vignette in the hall.
  Evidence: run 1 (listen) card at 81.7 s; run 2 (send) card at ~73 s after arrival.
  Suggestion: after the first time-lapse, rewind to the same night and let the second visit carry a twist that is true to the literature. For example, after sending, a faint reply arrives but it's your own message echoed back from far away (the "we're early / alone" reading); or after listening, you notice a light that isn't a star moving. On run 2 the narrator acknowledges the first choice. Ask the journal question only once the player has seen both options exist.
- **[minor] [affordance]** The send lever (red knob, the most "pullable" object in view at arrival, shots/052-t15.jpg) is disabled until you've listened, and walking to it gives nothing.
  Evidence: run 2, `use send a message` right after arrival → "disabled right now".
  Suggestion: same rule as the monkey lever: either enable it (sending before listening is a legitimate, interesting choice: shouting before you've heard anything) or show a dimmed prompt.
- **[polish] [mapping]** The hall portal is "Look through the telescope", but the vignette is a radio dish with static; there is no telescope to look through. The verb promises seeing, the scene is about hearing.
  Suggestion: make the hall portal a small radio dish or a radio set ("Tune in"), or put a telescope in the scene that shows the empty sky as the moon aside.

### tragedy-of-the-commons
- **[major] [decision design]** The bell is a free, guaranteed win at any moment: rung at t=0 (grass 1.0, no sheep added), after two adds (grass 0.79) or at grass 0.22 after the "So why would anyone stop?" question, it always gives the same ending, "You agreed on limits … The grass came back." There's no cost, no neighbour who refuses, no risk of the meeting failing, so the dilemma collapses into "press the good button". Ringing it before anything happened even produces "the grass came back" when it never left.
  Evidence: three runs, bell at grass 1.0 (t=150), 0.79 (t=197), 0.22 (t=259) → identical card.
  Suggestion: make agreement cost something and depend on the state: the bell only gathers people once the grass is visibly thinning (before that: "Nobody comes. The grass looks fine."); at the meeting *you* must lead by removing a sheep of your own (walk one back to your pen) before the neighbours follow; below a threshold the meeting comes too late and the grass is gone anyway. That keeps the hopeful ending (it's true to the literature on managed commons) but makes it earned.
- **[major] [doing nothing / fidelity of the dynamic]** If you do nothing, nothing happens: 60 s idle, grass stays at 1.0, no neighbour ever adds a sheep, no line, no ending. The tragedy only begins when *you* add the first sheep, so the game implies the problem is the player's greed rather than a structure in which everyone's incentive is the same. It also breaks "doing nothing is always a real option" (GAME.md pillar 2): here doing nothing is a soft-lock that needs Esc.
  Evidence: run 2, t=90–150 idle, `grass: 1, adds: 0`.
  Suggestion: after ~20 s, a neighbour adds a sheep on their own ("The blue house adds one. Nobody stops them."). Then the player's real choice is whether to join in, hold back (and watch the grass go anyway, the painful bit), or organise. Give holding back its own ending ("You kept to two. It didn't save the grass.").
- **[minor] [feedback]** The private benefit that drives the whole dilemma is invisible. "A little more for you" is narrated, but your sheep look identical to everyone else's, and there is no wool, coin or fatness to see. I couldn't tell which of ~40 sheep were mine (shots/072-sheep.jpg).
  Suggestion: tint or collar your sheep in teal, and show your pen or a small wool pile growing by your gate with each add, so the player *feels* the gain they're trading against the shared grass.
- **[minor] [pacing]** The question "So why would anyone stop?" comes at grass ≈0.28, and the grass hits zero ~14 s later (t=65.6 → 79.9). The reflection question lands at the point where it's nearly too late to act on it.
  Suggestion: voice the question after the first neighbour copies you (grass ~0.95), and slow the final decline so the choice beat has room for a silence.
- **[polish] [affordance]** There's no way to take a sheep back. The only verbs are add and bell, so restraint can't be expressed as an action.
  Suggestion: "Take a sheep home" at your pen (pairs with the lead-by-example meeting above).

## Keep
- The hall as a single readable corridor of portals with proximity labels and a ✓ on completion; the talkable apple-face gentleman ("Everything we see hides another thing, you know.") is a perfect hub aside.
- Grandfather: the failure lines ("A gust of wind. The gate swings open again." / "He laughs. What a strange thing to say.") and the ending that counts the ways you tried: ordinary causes, not magic, is exactly the right feedback.
- Monkeys: the highlighted fragment on the page ("to be" in amber) is great feedback; keep the page-reading verb.
- Simulation: the pull-back from your study to a dome on a giant's desk, and the lights going out in your own room when you switch the worlds off. Best consequence beat in the hall.
- Commons: neighbours visibly copying you right after your first sheep; the grass colour draining is instantly readable.
- Game-over card layout (title, one-line reflection, journal question, two buttons) is clean and consistent across vignettes.

## Harness notes
- After *Play again*, the console shows `request failed … assets/voice/<id>/<line>.mp3 (net::ERR_ABORTED)` for a line from the previous run (grandfather `tried_1`, commons `ask`). It looks like aborted audio on restart, not a missing file; no visible effect with audio muted.
- `use <prompt>` walks you to a prompt even when that prompt is disabled and waits 20 s, which in real-time scenes (grandfather) lets the scene run on; I accounted for that in the timings above.
