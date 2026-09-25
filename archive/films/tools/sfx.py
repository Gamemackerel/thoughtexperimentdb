#!/usr/bin/env python3
"""Synthesised soundtrack elements for the series (no samples, nothing to license).

  sfx.py braam <out.wav>            Inception-style low brass hit (~6 s incl. tail)
  sfx.py pad <seconds> <out.wav>    quiet ambient drone bed, fades in and out

Both are mono 48 kHz, peak-normalised; render.mjs sets their level in the mix.
"""
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def saw(freq, t, phase=0.0):
    return 2.0 * ((freq * t + phase) % 1.0) - 1.0


def reverb(x, seconds=3.0, mix=0.35):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * seconds / 6.0))
    ir = sosfilt(butter(2, 3500, "low", fs=SR, output="sos"), ir)
    wet = fftconvolve(x, ir)[: len(x)]
    wet /= np.max(np.abs(wet)) + 1e-9
    return (1 - mix) * x + mix * wet * np.max(np.abs(x))


def sweep_lowpass(x, cutoff):
    """Time-varying 2-pole low-pass (cascaded one-poles) — gives the brass 'bloom'."""
    y1 = np.zeros_like(x); y2 = np.zeros_like(x)
    a = 1.0 - np.exp(-2 * np.pi * cutoff / SR)
    s1 = s2 = 0.0
    for i in range(len(x)):
        s1 += a[i] * (x[i] - s1); s2 += a[i] * (s1 - s2)
        y2[i] = s2
    return y2


def braam():
    dur = 6.5
    t = np.arange(int(dur * SR)) / SR
    # low brass stack: A1, E2, A2 with detuned unison voices
    tone = np.zeros_like(t)
    for f, g in ((55.0, 1.0), (82.41, 0.7), (110.0, 0.55), (164.8, 0.25)):
        for d in (-0.004, 0.0, 0.005):
            tone += g * saw(f * (1 + d), t, rng.random())
    cutoff = 160 + 1500 * np.minimum(t / 0.3, 1.0) * np.exp(-np.maximum(t - 0.3, 0) / 0.9)   # brass 'bloom'
    tone = sweep_lowpass(tone / 6.0, cutoff)
    env = np.minimum(t / 0.07, 1.0) * np.where(t < 0.5, 1.0, np.exp(-(t - 0.5) / 1.3))
    tone = np.tanh(3.0 * tone * env) * 0.8
    sub = (np.sin(2 * np.pi * 27.5 * t) + 0.6 * np.sin(2 * np.pi * 55 * t)) * np.minimum(t / 0.05, 1) * np.exp(-t / 2.2) * 0.5
    thump = sosfilt(butter(2, 120, "low", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t / 0.06) * 4
    out = reverb(tone + sub + thump, seconds=3.5, mix=0.3)
    out *= np.minimum((dur - t) / 0.4, 1.0)  # no click at the end
    return out


def pad(seconds):
    t = np.arange(int(seconds * SR)) / SR
    notes = (73.42, 110.0, 174.61, 164.81, 220.0)  # D2 A2 F3 E3 A3 — D minor add9, open and unresolved
    out = np.zeros_like(t)
    for i, f in enumerate(notes):
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * (0.03 + 0.017 * i) * t + i * 1.7)
        voice = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * (1.002) * t)
        out += voice * lfo / (1 + 0.4 * i)
    air = sosfilt(butter(2, [300, 2400], "band", fs=SR, output="sos"), rng.standard_normal(len(t))) * 0.03
    out = sosfilt(butter(2, 1400, "low", fs=SR, output="sos"), out + air)
    fade_in, fade_out = 5.0, 5.0
    out *= np.clip(t / fade_in, 0, 1) * np.clip((seconds - t) / fade_out, 0, 1)
    return reverb(out, seconds=4.0, mix=0.4)


if __name__ == "__main__":
    kind = sys.argv[1]
    if kind == "braam":
        audio, out = braam(), sys.argv[2]
    elif kind == "pad":
        audio, out = pad(float(sys.argv[2])), sys.argv[3]
    else:
        raise SystemExit(f"unknown sfx {kind}")
    audio = audio / (np.max(np.abs(audio)) + 1e-9) * 0.95
    sf.write(out, audio.astype(np.float32), SR)
