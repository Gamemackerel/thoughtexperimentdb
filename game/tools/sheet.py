"""Contact sheet of screenshots: python3 game/tools/sheet.py <out.png> <glob>... (4 across, 480 px wide each)."""
import glob, sys
from PIL import Image
out, pats = sys.argv[1], sys.argv[2:]
fs = [f for p in pats for f in sorted(glob.glob(p))]
w, h, cols = 480, 270, 4
ims = [Image.open(f).convert('RGB').resize((w, h)) for f in fs]
rows = (len(ims) + cols - 1) // cols
s = Image.new('RGB', (cols * w, rows * h), 'black')
for i, im in enumerate(ims): s.paste(im, ((i % cols) * w, (i // cols) * h))
s.save(out); print(out, len(ims))
