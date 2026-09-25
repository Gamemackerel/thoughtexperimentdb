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
