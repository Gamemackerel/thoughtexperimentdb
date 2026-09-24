#!/usr/bin/env python3
"""Kokoro TTS for render.mjs:  speak.py <voice> <speed> <lang> <out.wav>  (text on stdin)"""
import os
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

here = os.path.dirname(os.path.abspath(__file__))
voice, speed, lang, out = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
text = sys.stdin.read().strip()
kokoro = Kokoro(os.path.join(here, "kokoro-v1.0.onnx"), os.path.join(here, "voices-v1.0.bin"))
samples, rate = kokoro.create(text, voice=voice, speed=speed, lang=lang)
sf.write(out, samples, rate)
