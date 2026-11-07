#!/usr/bin/env python3
"""Final QC for a rendered project: tech checks + contact sheets (3 frames per scene with narration).
Usage: python3 pipeline/qc.py projects/<name> <outdir>"""
import json, subprocess, sys, textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

proj, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
b = proj / "build"
v = b / "video.mp4"


def run(*a):
    return subprocess.run(a, capture_output=True, text=True).stderr + subprocess.run(a, capture_output=True, text=True).stdout


dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(v)],
                           capture_output=True, text=True).stdout)
lufs = [l for l in subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(v), "-af", "ebur128", "-f", "null", "-"],
                                  capture_output=True, text=True).stderr.splitlines() if " I: " in l][-1].split()[1]
sil = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(v), "-af", "silencedetect=noise=-45dB:d=2.5", "-f", "null", "-"],
                     capture_output=True, text=True).stderr.count("silence_start")
blk = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(v), "-vf", "blackdetect=d=0.5:pix_th=0.08", "-an", "-f", "null", "-"],
                     capture_output=True, text=True).stderr.count("black_start")
print(f"duration {int(dur // 60)}:{int(dur % 60):02d}  loudness {lufs} LUFS  silences {sil}  black {blk}")

tl = json.loads((b / "timeline.json").read_text())["scenes"]
sc = json.loads((proj / "scenes.json").read_text())["scenes"]
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
W, H, TH = 400, 225, 62
for i, t in enumerate(tl):
    for k, fr in enumerate((0.08, 0.5, 0.9)):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t['start'] + t['dur'] * fr:.2f}", "-i", str(v),
                        "-frames:v", "1", "-vf", f"scale={W}:{H}", str(out / f"f{i:02d}_{k}.png")])
for pg in range(0, len(sc), 10):
    ch = list(range(pg, min(pg + 10, len(sc))))
    im = Image.new("RGB", (W * 6, (H + TH) * 5), "white"); d = ImageDraw.Draw(im)
    for n, i in enumerate(ch):
        x, y = (n % 2) * W * 3, (n // 2) * (H + TH)
        for k in range(3):
            im.paste(Image.open(out / f"f{i:02d}_{k}.png"), (x + k * W, y))
        st = tl[i]["start"]
        d.rectangle((x, y, x + 110, y + 22), fill="black")
        d.text((x + 3, y + 1), "s%02d %d:%02d" % (i, st // 60, st % 60), font=FB, fill="yellow")
        d.text((x + 5, y + H + 2), "\n".join(textwrap.wrap(sc[i]["text"], 150)[:3]), font=F, fill="black")
    im.save(out / f"qc_{pg // 10 + 1}.jpg", quality=78)
print("sheets", (len(sc) + 9) // 10)
