"""Narration audit: transcribe each clip, show phonemes, pauses and words/min.
Usage: tools/kokoro-venv/bin/python tools/audit.py . <experiment-id>"""
import json, glob, re, sys, os
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro

root, exp = sys.argv[1], sys.argv[2]
script = json.load(open(f"{root}/experiments/{exp}/script.json"))
tl = json.load(open(f"{root}/build/{exp}/timeline.json"))
k = Kokoro(f"{root}/tools/kokoro/kokoro-v1.0.onnx", f"{root}/tools/kokoro/voices-v1.0.bin")
model = WhisperModel("small.en", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9' ]", "", s.lower().replace("-", " ")).split()
by_idx = {i: f"{root}/build/{exp}/seg-{i:02d}.wav" for i in range(len(script["segments"]))}
for i, seg in enumerate(script["segments"]):
    spoken = re.sub(r"\[\[[^\]]*\]\]", " ", seg["text"])
    for a, b in script.get("pronounce", {}).items(): spoken = spoken.replace(a, b)
    w = by_idx[i]
    audio, sr = sf.read(w)
    dur = len(audio) / sr
    # internal pauses: 20ms frames under -40 dBFS, runs >= 250ms
    fr = int(sr * 0.02); n = len(audio) // fr
    db = 20 * np.log10(np.sqrt((audio[: n * fr].reshape(n, fr) ** 2).mean(1)) + 1e-9)
    quiet = db < -40; pauses = []; run = 0
    for j, q in enumerate(quiet):
        if q: run += 1
        else:
            if run * 0.02 >= 0.25: pauses.append((round((j - run) * 0.02, 2), round(run * 0.02, 2)))
            run = 0
    segs, _ = model.transcribe(w, language="en", beam_size=5, word_timestamps=False)
    heard = " ".join(s.text.strip() for s in segs)
    exp, got = norm(spoken), norm(heard)
    miss = [x for x in exp if x not in got]
    wpm = len(exp) / dur * 60
    ph = k.tokenizer.phonemize(spoken, lang=script["voice"].get("lang", "en-us"))
    print(f"## {seg['id']}  {dur:.2f}s  {wpm:.0f} wpm  pauses(at,len)={pauses}")
    print(f"   heard: {heard}")
    if miss: print(f"   MISMATCH words: {miss}")
    print(f"   phon : {ph}")
