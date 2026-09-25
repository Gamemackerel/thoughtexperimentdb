#!/usr/bin/env bash
# One-time setup: Node deps, the Python env for Kokoro TTS (voice lines) and the narration audit, and the Kokoro model files.
# Requires: node 20+, python 3.10+, ffmpeg (brew install ffmpeg). Playtests use Puppeteer's bundled Chromium.
set -euo pipefail
cd "$(dirname "$0")/.."
npm install
python3 -m venv tools/kokoro-venv
tools/kokoro-venv/bin/pip install -q -r tools/requirements.txt
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f tools/kokoro/kokoro-v1.0.onnx ] || curl -L -o tools/kokoro/kokoro-v1.0.onnx $base/kokoro-v1.0.onnx
[ -f tools/kokoro/voices-v1.0.bin ] || curl -L -o tools/kokoro/voices-v1.0.bin $base/voices-v1.0.bin
echo "Ready. Play: npm run play (then open http://localhost:5173/game/)"
