"""Thumbnail from our own data: electricity returned per 100 stored (EIA 2019 fleet avg 82; NREL 2024 prototype 28)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
H = Path(__file__).resolve().parent
F = str(H.parents[2] / "assets" / "Anton-Regular.ttf")
im = Image.new("RGB", (1280, 720), (8, 14, 28)); d = ImageDraw.Draw(im)
for x in range(0, 1280, 40): d.line((x, 0, x, 720), fill=(14, 24, 46))
for y in range(0, 720, 40): d.line((0, y, 1280, y), fill=(14, 24, 46))
f = lambda s: ImageFont.truetype(F, s)
d.text((60, 40), "PUT IN 100.", font=f(110), fill="white")
d.text((60, 165), "GET BACK...", font=f(110), fill=(255, 196, 0))
base, scale = 660, 4.6
for x, val, lab, col in [(700, 82, "BATTERY", (70, 190, 255)), (980, 28, "HYDROGEN", (255, 107, 74))]:
    d.rectangle((x, base - val * scale, x + 220, base), fill=col)
    d.text((x + 110, base - val * scale - 12), str(val), font=f(120), fill=col, anchor="md")
    d.text((x + 110, base - 30), lab, font=f(44), fill=(8, 14, 28), anchor="mm")
d.text((60, 600), "OTHER END OF THE WIRE", font=f(34), fill=(200, 117, 51))
im.save(H / "thumb_round_trip.png")
