# bugs · the hall

## Summary
(in progress)

## Findings
### hall
- **[major] [bug/navigation]** Leaving any hall vignette drops you in the *first room*, not the hall. Grandfather Paradox → game-over "Back to the house" → `level=house` at (0.0, 5.5) (the default spawn, t=235s). Esc does the same. `game/main.js` hard-codes `goto('house')` in both the game-over click handler (l.121) and the Esc handler (l.181), so the hall's `spawnAt` table for `ctx.from` (hall.js l.270) is dead code: nobody ever arrives at the hall from a vignette. Every hall vignette costs a ladder climb to get back.
  Suggestion: give each level a `home` (hall vignettes → `'hall'`, room-1 vignettes → `'house'`) and use it in both handlers (and in the confirm text: "return to the hall?").
- **[minor] [bug/UI]** Talk-spam stacks speech bubbles. Pressing E five times on the apple-faced gentleman in ~2 s shows five overlapping bubbles at once ("Good afternoon." on top of "We always want to see…" on top of "The hats?…"), unreadable. Evidence: shots/003-talkspam.jpg, t≈19s. Bubbles also stay listed on screen while you walk the whole hall away from him (still there at t=25s beside the clock).
  Suggestion: one bubble per speaker (replace, don't add), or ignore E while the current bubble is younger than ~1 s.
- **[polish] [UX]** Hall spawn (-13.5, 1.4) is inside the "Climb down" prompt radius (dist 1.5 < 2.2), so the first E a player presses on arrival (e.g. to "interact with something") sends them straight back down.
  Suggestion: spawn ~1 m further into the hall (x ≈ -12.3).
- **[polish] [UI]** The first room's toast "Look around. Some things here lead elsewhere." is carried up the ladder and still on screen when the hall loads (t=3.9s), then replaced by the hall toast.
  Suggestion: clear toasts in `goto()` with the other overlays.

