# Thought Experiment Database

Short 3D explainer films of famous philosophical thought experiments, all in one visual style, grounded in the
original texts. Each film ships in 16:9 and 9:16 with captions, three thumbnail options and a ready-to-post
description.

| # | Experiment | Status |
|---|---|---|
| 1 | [The Trolley Problem](experiments/trolley-problem/) | ✅ rendered |

What's next is decided by [`thought_experiments.xlsx`](thought_experiments.xlsx): the catalogue of candidates, sorted by
the average of their Accessibility, Visualization and Popularity ratings, with a link to an in-depth video essay for
each and a checkbox for each film that's been made.

**Making a new film? Start with [PRODUCTION.md](PRODUCTION.md)**. It covers research, writing, direction, the engine, QA
and the frog.

## Repository layout

```
PRODUCTION.md              the production guide: how every film is researched, written, directed, built and checked
thought_experiments.xlsx   catalogue + production order (sorted by average rating), video-essay links, "Video created"
engine/                    shared renderer
  core.js                  palette, clay kit (people, trolley, tracks, lever, tunnel, frog…), particles, ghosts, camera, overlay UI
  style.css                typography and layout for overlays, in landscape, vertical and thumbnail modes
  player.html              loads an experiment; renderAt(t) for capture, ?preview for a live player, ?format=vertical
  render.mjs               TTS → timeline → soundtrack mix → frames (headless Chrome) → ffmpeg; thumbnails; description
tools/                     setup.sh, Kokoro TTS (kokoro/speak.py), synthesised sound design (sfx.py), narration audit (audit.py)
experiments/<id>/          one folder per film: everything needed to rebuild it, plus its deliverables
  script.json              narration (with [[cue]] / pause markup), voice, soundtrack, sources, thumbnails, publish metadata
  scene.js                 the 3D film as a pure function of time, built on engine/core.js
  output/
    <id>.mp4               16:9 film, no burned-in captions  (not committed; rebuild with render.mjs)
    <id>-vertical.mp4      9:16 film, large burned-in captions (not committed)
    <id>.vtt               captions track: upload it with the 16:9 video on YouTube
    thumbnails/            three 1280×720 thumbnail options
    description.txt        paste-ready description: summary, chapters, video essay, sources, reading, discussion
build/                     generated cache (narration clips, timeline, stills). Not committed.
```

There are no binary shared assets yet: every model, material and sound is generated in code (`engine/core.js`,
`tools/sfx.py`). If shared assets are needed later, they go in `assets/`.

## Setup

Requires Node 20+, Python 3.10+, ffmpeg and Google Chrome (or Puppeteer's Chromium). Rendering is GPU-accelerated on
Apple Silicon.

```sh
tools/setup.sh     # npm install, Python venv (Kokoro TTS, scipy, faster-whisper), Kokoro model download
```

## Commands

```sh
node engine/render.mjs trolley-problem                    # everything: both videos, captions, thumbnails, description
node engine/render.mjs trolley-problem --preview          # live player with audio + scrubber (add --format vertical)
node engine/render.mjs trolley-problem --stills 5,20,42 --format both   # review frames → build/<id>/stills/
node engine/render.mjs trolley-problem --thumbs           # thumbnails + description only
node engine/render.mjs trolley-problem --from 30 --to 45 --scale 0.5    # draft a section
tools/kokoro-venv/bin/python tools/audit.py . trolley-problem           # narration audit: transcript, phonemes, pace
```

## Narration markup and voice

Inside a segment's `text`: `[[name]]` marks a cue (read in scenes with `tl.cue('segId', 'name')`), `[[0.5]]` inserts
a pause, and `[[name 0.5]]` does both. Each stretch between markers is voiced separately, so cues land exactly on their
words, and captions switch at those boundaries. A segment can set its own `"speed"`.

Narration uses local [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) via `kokoro-onnx`:

```json
"voice": { "engine": "kokoro", "name": "bm_fable", "speed": 0.9, "lang": "en-gb" }
```

Clips are cached by text + voice and trimmed of edge silence. The final mix (voice + synthesised braam) is
loudness-normalised to −16 LUFS.
