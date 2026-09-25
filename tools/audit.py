"""Narration audit for a vignette: transcribe each voiced line, show its phonemes, pauses and words per minute.
Usage: tools/kokoro-venv/bin/python tools/audit.py <vignette-id>      (render the voice first: node game/tools/voice.mjs <id>)
Reads game/lines/<id>.json and game/assets/voice/<id>/manifest.json."""
import json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vid = sys.argv[1]
spec = json.load(open(f"{root}/game/lines/{vid}.json"))
manifest = json.load(open(f"{root}/game/assets/voice/{vid}/manifest.json"))
k = Kokoro(f"{root}/tools/kokoro/kokoro-v1.0.onnx", f"{root}/tools/kokoro/voices-v1.0.bin")
model = WhisperModel("small.en", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9' ]", "", s.lower().replace("-", " ")).split()
lang = spec.get("voice", {}).get("lang", "en-gb")
for key, raw in spec["lines"].items():
    text = raw if isinstance(raw, str) else raw["text"]
    spoken = text
    for a, b in spec.get("pronounce", {}).items(): spoken = spoken.replace(a, b)
    mp3 = f"{root}/game/assets/voice/{vid}/{manifest[key]['file']}"
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        subprocess.run(["ffmpeg", "-y", "-nostdin", "-v", "error", "-i", mp3, "-ac", "1", "-ar", "16000", tmp.name], check=True)
        audio, sr = sf.read(tmp.name)
        dur = len(audio) / sr
        # internal pauses: 20ms frames under -40 dBFS, runs >= 250ms
        fr = int(sr * 0.02); n = len(audio) // fr
        db = 20 * np.log10(np.sqrt((audio[: n * fr].reshape(n, fr) ** 2).mean(1)) + 1e-9)
        pauses, run = [], 0
        for j, q in enumerate(db < -40):
            if q: run += 1
            else:
                if run * 0.02 >= 0.25: pauses.append((round((j - run) * 0.02, 2), round(run * 0.02, 2)))
                run = 0
        segs, _ = model.transcribe(tmp.name, language="en", beam_size=5)
        heard = " ".join(s.text.strip() for s in segs)
    want, got = norm(spoken), norm(heard)
    miss = [x for x in want if x not in got]
    print(f"## {key}  {dur:.2f}s  {len(want) / dur * 60:.0f} wpm  pauses(at,len)={pauses}")
    print(f"   heard: {heard}")
    if miss: print(f"   MISMATCH words: {miss}")
    print(f"   phon : {k.tokenizer.phonemize(spoken, lang=lang)}")
