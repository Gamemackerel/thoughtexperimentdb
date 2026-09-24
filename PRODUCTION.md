# Thought Experiment Database: Production Guide

This guide covers how to make one film in the series. It is written so that a single prompt ("Make the film for
*<thought experiment>* following PRODUCTION.md") produces a film at the quality of `experiments/trolley-problem/`.
That film is the reference implementation: when this guide and the trolley film disagree, the guide wins, and the
disagreement is a bug to fix.

Every film follows the same **five-act structure**, the same **visual language**, the same **voice**, and contains the
**frog**.

---

## 0. Workflow at a glance

0. **Pick**: take the highest-rated unmade row in `thought_experiments.xlsx` (sorted by Avg rating; `Video created` = FALSE).
1. **Research**: read the original text(s) and the SEP entry. Collect exact quotes and correct dates, and find an in-depth video essay (§8).
2. **Write**: produce `experiments/<id>/script.json` using the structure and voice rules in §2.
3. **Direct**: plan the shots, beats and overlays for every segment and every pause (§3).
4. **Build**: write `experiments/<id>/scene.js` on the shared engine (§4). Add anything reusable to `engine/core.js`.
5. **Review**: render stills at every cue and every pause (start, middle, end) and fix what you see (§5).
6. **Audit narration**: transcribe, check phonemes, measure words per minute (§5.3).
7. **Render**: `node engine/render.mjs <id>` → `experiments/<id>/output/`: `<id>.mp4` (16:9), `<id>-vertical.mp4` (9:16),
   `<id>.vtt`, `thumbnails/thumbnail-1..3.png`, `description.txt`.
8. **Publish the record**: in the spreadsheet, set `Video created` to TRUE and add the `Video essay` link. Add the film to the README table and commit (videos are not committed).

Never ship without having looked at stills of every section. Most problems (overlaps, off-frame labels, static
holds, mistimed beats) are only visible in frames.

---

## 1. Research

- Start from the **original publication(s)** and the relevant **Stanford Encyclopedia of Philosophy** entry. Prefer the
  original author's framing and wording over later retellings.
- Record: author(s), title, year of original publication (not the reprint year the SEP may cite), the canonical
  setup, the author's own verdict, the key later variant(s) and who introduced them, and one or two notable
  responses.
- On-screen quotes must be **verbatim** and attributed ("Author, Year"). If you are not certain of the exact
  wording, paraphrase in narration and do not put quote marks on screen. Tell the user which quotes to verify.
- List every source in `script.json → sources` and on the end card.

---

## 2. Writing

### 2.1 Structure (the five acts)

| Act | Segment ids (trolley) | Length | Purpose |
|---|---|---|---|
| **1. Cold-open hook** | `hook1…hook4` | ~8–11 s | 3–4 very short second-person lines that put *you* inside the dilemma at its most visceral. Ends on a dramatic beat (in the trolley film a real hit, then a flash + VHS rewind). No names, no dates. |
| **2. Title splash** | `title` | ~2 s + 3 s break | "*The X.*" Hard cut to a paper title card, then the world fades up behind it. |
| **3. Brief history** | `foot`, `footTracks`, `footAnswer` | ~25 s | The original version and its author's own answer, for context only. One quote on screen. |
| **4. The central question** | `thomson`, `setup`, `ask` + **8 s pause** | ~35 s | The version the film is really about, set up in the second person. Ends with the core question, followed by a long silent **thinking pause** that shows the setup beautifully (slow orbit, both outcomes illustrated, the frog). |
| **5. Wrap-up** | `angles`, `redirect`, `twist`, `outro`, `wrap` | ~60–70 s | What makes it hard (the distinction at stake, shown as a comparison card), the main answer(s) from the literature, the most interesting later development, then re-ask the question and deliver the closing wrap. |

The **finale** runs in this order:
1. **Re-ask** the central question (`outro`). As it is asked, any later-variant props (e.g. Thomson's third track) sink
   away and the camera pulls up to a steep **overhead view of the core problem in its entirety**, with both outcome
   paths lit and short labels ("Do nothing: five die" / "Pull the lever: one dies" / "You").
2. **Fade to translucent paper** (~0.82) with the question centred as the end card. The overhead diagram stays faintly
   visible behind it and keeps drifting, so the end screen is never static.
3. The **closing wrap** is narrated over the end card.
4. Sources fade in under the question, and a small **"Try this" note** appears in the top-right corner
   (`ui.note`): *"If your answer feels obvious, build the best case you can for the other side. That's usually where
   it gets interesting."* This note is on screen only and is never narrated.

The **closing wrap** (while the question stays on screen) always contains, in this order:
1. *"This is X in its simplest form"* + one concrete named variation that makes it harder.
2. Why the experiment matters: the scenario is deliberately artificial so that it isolates what we value.

**Never** include calls to action about comments, likes, subscribing, or "let us know". These are standalone videos.

Target total length: **2½–3 minutes**.

### 2.2 Voice and style

- Plain, warm, precise. Short declarative sentences. One idea per sentence.
- Use the **second person** for the central case ("You are a bystander…", "Should you pull the lever?").
- Name the people and dates, but spell years out through `pronounce` (see below) and keep titles for the lower-thirds.
- State each author's view fairly and briefly. Present answers as *answers people have given*, not as the truth.
- Avoid filler and stock phrases: "Let's dive in", "It's worth noting", "In conclusion", "Tell us in the comments".
- Leave room: every major concept is followed by a ~3 s break (`"after": 3`). The central question gets `"after": 8`.

### 2.3 `script.json` format

```json
{
  "title": "The Trolley Problem",
  "voice": { "engine": "kokoro", "name": "bm_fable", "speed": 0.9, "lang": "en-gb" },
  "lead": 0.3, "gap": 0.7, "tail": 5,
  "pronounce": { "1967": "nineteen sixty-seven", "2008": "two thousand and eight" },
  "sources": ["Author, “Title,” Journal (Year)", "…"],
  "segments": [
    { "id": "hook1", "text": "A runaway trolley.", "after": 0.25 },
    { "id": "setup", "text": "If you do nothing, the trolley will kill the five. [[pull 0.8]] If you pull the lever, it will turn onto the side track, and kill the one.", "speed": 0.72 },
    { "id": "ask", "text": "Should you pull the lever?", "speed": 0.8, "after": 8 }
  ]
}
```

- `after` / `before`: silence after/before a segment. Default gap is `gap` (0.7 s).
- **Inline markers** in `text`: `[[name]]` marks a cue that the scene reads with `tl.cue('setup', 'pull')`; `[[0.5]]`
  inserts a pause; `[[name 0.5]]` does both. Each stretch between markers is voiced separately, so cues land
  exactly on their words and captions switch there. Put a cue wherever a visual must hit a phrase.
- `caption`: optional caption override (rarely needed; curly quotes in `text` are fine).
- `speed`: per-segment override of the voice speed (see §5.3 for why this is sometimes needed).
- `pronounce`: text replacements applied to speech only (years, names, abbreviations). Captions keep the original.

---

## 3. Direction

### 3.1 Visual language

- **World**: a floating clay diorama island on warm paper (`#f3ebdd`), low-poly trees and rocks, soft shadows,
  gentle fog. Everything is matte clay (`clay()`), and the look is toylike, friendly and never gory.
- **Colour roles** (never repurpose these):
  - coral `#e0674f` = the threat / *doing harm*
  - blue `#5b7fa6` = the many / *allowing harm*
  - mustard `#e2a93b` = the one
  - teal `#3f8f86` = the agent who must choose (you)
  - Use `palette` in `core.js` and add new roles there, not inline.
- **People** are peg figures (`makePerson`). Victims wear hard hats when they are workers. Harm is shown with
  physics (knocked over, flung away), never injury.
- **Typography**: Iowan Old Style for titles and quotes, Avenir Next for UI and captions. Captions are always on (dark
  pill, bottom centre).

### 3.2 Overlays (all in `ui`)

| Element | Use |
|---|---|
| `ui.title` | Title splash; end card (question + sources). |
| `ui.note` | Small top-right aside on the end card (the "Try this" steelman prompt). |
| `ui.lower` | Lower-third when a thinker is introduced: name + work + year. |
| `ui.quote` | Top-of-frame paper box for (a) a verbatim quote with citation, (b) the central question during the pause, (c) the question hanging in a concept break. |
| `ui.card` | Comparison table for the key distinction (e.g. doing vs. allowing). Rows appear on narration cues. |
| `ui.label` | Pills pinned to 3D objects ("Do nothing: five die"). Short, colour-dotted with the role colour. |
| `ui.fade` | Paper fades for cuts; dims the world behind cards (~0.35). |
| `ui.rewind` | VHS rewind treatment (hook only). |

Make sure overlays never cover labels or key figures: frame the shot (raise the `look` target so the scene sits
lower) rather than shrinking text.

### 3.3 Camera rules

- Every shot is a function of time. Use `cameraAt(keys, t)` for keyframed moves; follow shots track objects.
- **No static holds, ever.** Every shot's last key must extend to the moment the next shot takes over. Every pause
  and concept break needs visible camera motion **and** an illustration of the idea (the question kept on screen,
  pulsing outcome paths, a ghost run, labels held, a lever wavering).
- Hook: low, close, fast cuts with shake. History and setup: medium and wide, eased moves. Thinking pause: slow
  orbit with everything in view. Wrap-up: high wide shots and pull-backs. Finale: a steep overhead view of the core problem, then a fade to paper.
- Hard cuts (`blend: 0`) only for the hook, the title splash, and "rewinds" between cases (with a paper fade).

### 3.4 Signature devices (reuse them)

- **Energetic hero object**: e.g. the trolley bursts out of a tunnel with sparks, dust and speed streaks, rattles,
  and glides into a **freeze-frame** (particles hang in the air) instead of stopping.
- **Ghost previews** (`ghostify`): translucent copies act out each possible outcome physically while the real
  scene stays frozen. Victim ghosts are knocked away; the real people stay standing.
- **Path glows** (`makePathGlow`): draw where each option leads, in the role colour; pulse them during pauses.
- **Hook rewind**: the hook plays for real, then a white flash and a fast reversed replay (~3×) with the rewind
  treatment, then a hard cut to the title.

### 3.5 Two formats: landscape and vertical

Every film ships in **1920×1080** and **1080×1920** from the same scene. Nothing in `scene.js` should assume an aspect ratio:
- In portrait the camera keeps ~86% of the landscape shot's horizontal field of view (`PORTRAIT_KEEP` in
  `createStage`) and gains height above and below. Landscape framing therefore carries over, with more world top and bottom.
- Overlays have a portrait layout (`.vertical` rules in `style.css`) that keeps text in the mobile safe area: clear
  of the top ~180 px and bottom ~340 px. Labels are automatically kept inside the frame.
- If a shot needs a portrait-specific adjustment, branch on `stage.portrait` inside that shot. Don't fork the scene.
- Review stills in **both** formats: `--stills … --format both` (files ending `-vertical.png`).

### 3.6 Soundtrack (minimal, synthesised)

The soundtrack is kept to a minimum, so the voice always leads. All of it is synthesised by `tools/sfx.py`, so nothing needs licensing, and it is
configured per film in `script.json`:

```json
"soundtrack": {
  "hits": [{ "sfx": "braam", "at": { "seg": "title", "offset": -0.35 }, "gain": -18 }]
}
```

- **Braam**: an Inception-style low brass hit on the hard cut to the title splash (`title` start −0.35 s). It is dramatic
  but sits ~3 dB under the narration.
- **No music bed.** A drone bed (`"bed": { "sfx": "pad", … }`) exists in the engine but was rejected for the series
  because it made the mood strange. Leave it out unless the user asks for one.
- The **cold open stays dry** (voice only), so the braam lands.
- `at` / `from` accept `{ seg, offset }` or `{ seg, cue, offset }`. Check levels with `volumedetect` on the output: voice
  ≈ −19.5 dB mean, braam onset ≈ −23 dB.

### 3.7 The frog (brand easter egg)

Every film contains **one frog** (`makeFrog`, `animateFrog`), under these rules:
- It appears in **exactly one scene** and is invisible everywhere else.
- Preferred placement: the **central thinking pause**, while the question is on screen.
- It must be **visible but never central**: on open ground to one side, never on top of a focal element, never
  covered by overlays, and in frame for the whole scene (check start, middle and end stills of the moving camera).
- It **hops in from off-screen, wanders, and hops back out** before the shot ends. It never pops into or out of existence.
  Use a one-way path, `animateFrog(frog, t, path, { loop: false, rest })`, whose first and last points are outside the
  frame for the whole moving shot, with `rest` set so the path spans the scene.
- It is never mentioned in narration or text.

In the trolley film it hops in from the bottom right during "Should you pull the lever?", circles beside the
junction, and hops out again before the pause ends (`FROG_PATH` in `scene.js`).

---

## 4. Engine

### 4.1 Layout

```
engine/core.js      palette, easing, Timeline (tl.s/e/at/p/cue), stage, camera, kit, particles, ghosts, frog, UI, captions
engine/style.css    all overlay typography
engine/player.html  loads an experiment; renderAt(t) for capture; ?preview for a live player with audio
engine/render.mjs   TTS → timeline → narration mix → frame capture (headless Chrome, Metal) → ffmpeg
tools/kokoro/       Kokoro-82M ONNX model + speak.py;  tools/kokoro-venv/  Python env
experiments/<id>/   script.json + scene.js
build/<id>/         generated audio parts, timeline.json, narration.m4a, stills/ (not committed)
experiments/<id>/output/   deliverables: videos (not committed), .vtt, thumbnails/, description.txt
```

### 4.2 Scene contract

`scene.js` exports `build({ stage, ui, tl })` and returns `{ update(t) }`. **Everything is a pure function of `t`**:
no accumulated state and no `Math.random()` at runtime (use `seeded()`), so any frame can be rendered in isolation and the
film re-times itself when narration changes.

Timing sources, in order of preference:
1. `tl.cue(id, name)`: exact word timing from `[[markers]]`. Use it for anything that must hit a phrase.
2. `tl.s(id)`, `tl.e(id)`: segment start and end. Use them for shots, windows and breaks (`tl.e(a)` → `tl.s(b)` is a break).
3. `tl.at(id, k)`: a fraction of a segment. Only use it for loose timing; it drifts when pacing changes.

Helpers: `ramp(t,a,b)` (smooth 0→1), `win(t,a,b,fade)` (on between a and b), `easeInOut`, `lerp`.

### 4.3 Kit (`core.js`)

`makeIsland`, `makeTree`, `makeRock`, `makePerson` / `animatePerson`, `makeTrolley`, `makeTrack(curve)`,
`makePathGlow(curve, colour)`, `makeLever`, `makeTunnel`, `makeEmitter` (deterministic particles, with the clock passed in),
`ghostify(obj, colour, opacity)`, `setOpacity(group, o)`, `makeFrog` / `animateFrog`, `cameraAt`.
When a new film needs a prop or effect that another film could use, add it to `core.js` in the same style.

### 4.4 Patterns from the trolley film

- **Warped clocks**: the trolley's own clock `tau` slows into the freeze; particles use it, so they freeze too. The
  hook uses `hookTime(t)` that runs backwards during the rewind, and the camera and all hook visuals read it.
- **Shots table**: `S = { name: (t) => ({pos, look}) }` plus `shots = [{ t, s, blend }]`; `camera(t)` blends
  between consecutive shots.
- **Labels** re-read the camera matrices every frame (already handled in `ui.label`).

---

## 5. Review and QA

### 5.1 Commands

```sh
node engine/render.mjs <id> --stills 12.5,40,71.2   # PNG frames → build/<id>/stills/
node engine/render.mjs <id> --preview              # live player with audio + scrubber
node engine/render.mjs <id> --from 30 --to 45      # partial MP4
node engine/render.mjs <id>                        # both videos + captions + thumbnails + description (~8 min)
node engine/render.mjs <id> --thumbs               # thumbnails + description only
node engine/render.mjs <id> --format vertical      # one format only (landscape | vertical | both)
```

Get segment and cue times from `build/<id>/timeline.json`. Tile stills into a contact sheet with
`ffmpeg -pattern_type glob -i 't*.png' -vf "scale=800:-1,tile=2x5" sheet.png` and look at it.

### 5.2 Checklist

- [ ] Checked in both landscape and vertical.
- [ ] Every cue: the visual lands on its words.
- [ ] Every pause and break: stills at start, middle and end show camera motion and an illustration; nothing is static.
- [ ] No overlay covers a label or key figure; no label is clipped at the frame edge.
- [ ] Hook: the hero beat lands on the key word; the rewind reads clearly; the hard cut to the title works.
- [ ] Quotes are verbatim and attributed; lower-third years and titles are correct; sources are on the end card.
- [ ] The frog appears in exactly one scene, hops in and out from off-screen, is clearly visible while on screen, and is not central.
- [ ] The finale's overhead shot shows the core problem only, the fade to paper is clean, and the corner note and sources appear at the end.
- [ ] Narration audit passes (below). Output duration equals the timeline duration.

### 5.3 Narration audit

Run a transcription, phoneme and pace check over every clip (faster-whisper `small.en` + Kokoro's phonemizer; see
`tools/kokoro-venv/bin/python tools/audit.py . <id>`):
- Transcription mismatches are often just spelling ("Foote", "Thompson"), so confirm with the **phonemes**
  before changing anything. Fix real problems with `pronounce`.
- Target **130–155 wpm** for narration, slower for the hook and the central question (~100–130).
- Kokoro's `speed` has less effect on long sentences. That is why the engine voices each marker-separated stretch
  on its own. If a segment still measures fast, split it with `[[0.3]]` pauses or give it its own `"speed"`.

---

## 6. Known pitfalls

- ffmpeg run from a background process must get `-nostdin`, or it blocks on terminal input.
- The narration mix uses a fixed-length silent bed. Don't reintroduce `apad`, because it can make the mix hang.
- Variables used in `update()` must be defined before use; a page error shows as `[page error]` and aborts the render.
- Kokoro pads clips with silence; the engine trims it. Changing TTS settings invalidates the per-part cache automatically.
- Transparent ghosts must not write depth; keep `ghostify` as is.
- In the trolley film, don't recompute the trolley's hook speed from a fixed start time. Key the emergence to a cue so that slower
  narration doesn't slow the action.

---

## 7. Packaging: thumbnails and description

Both are defined in `script.json` and generated by `render.mjs` into `experiments/<id>/output/`.

**Thumbnails (3 options, 1280×720).** Each entry poses the film at a moment and adds a headline card; captions, labels and
running overlays are hidden:

```json
"thumbnails": [
  { "at": { "seg": "hook4", "offset": 1.0 }, "html": "Would you <em>pull</em> the lever?", "side": "right" },
  { "at": { "seg": "ask", "offset": 3.2 }, "html": "Kill <em>one</em>…<br>or let <em>five</em> die?", "side": "left" },
  { "at": { "seg": "hook1", "offset": 1.9 }, "html": "The <em>Trolley</em> Problem<small>Foot · Thomson</small>", "side": "right" }
]
```

- Make three different options: (1) the hook's most dramatic frame plus the question, (2) the central dilemma in one
  view (the thinking pause, where the frog may appear) plus the choice in a few words, (3) the hero object plus the title and authors.
- Two to six words. `<em>` marks the coral accent word. Put the card on the side opposite the subject, and check that it doesn't cover the key figures.

**Description (`description.txt`, plain text for YouTube).** Filled from `script.json → publish`:

- `summary`: 2 short paragraphs. The dilemma in the viewer's terms, then who introduced it and what the film covers.
- `chapters`: `{ at, title }` list. The first is at 0; every chapter must be **≥ 10 s** (a YouTube rule).
- `essay`: the recommended **in-depth video essay by another creator** (`creator`, `title`, `url`). Prefer a video that
  goes deeper into the same primary texts. Verify that the URL exists (e.g. YouTube oEmbed) and record it in the spreadsheet too.
  Use `also` for any extra videos or lectures.
- `citations`: full references with volume, issue and pages. `reading`: 2–4 recommended readings (SEP entries, accessible books).
- `discussion`: invite viewers to comment with (1) their answer and reasoning, (2) whether the thought experiment is
  even valuable, and (3) which thought experiment should be made next. This belongs **only in the description**,
  never in the film.
- `tags`: 4–6 hashtags.

## 8. One-prompt brief template

> Make the film for **<thought experiment>** following PRODUCTION.md.
> Original source(s): <citation(s)>. SEP entry: <url>.
> Central version: <which formulation the film is about>. History: <earlier formulation for context>.
> Wrap-up: <the key distinction at stake>, <main answer(s)>, <the most interesting later development>, and one named harder variation.

Or simply: "Make the next film from thought_experiments.xlsx following PRODUCTION.md."

From that brief: research (§1) → write `script.json` (§2) → plan shots, beats and the frog placement (§3) → build
`scene.js` on the kit (§4) → stills review and narration audit (§5) → thumbnails + description (§7) → full render →
update the spreadsheet and README → report the output and the quotes the user should verify.
