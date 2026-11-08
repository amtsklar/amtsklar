#!/usr/bin/env python3
"""Banner (2560x1440) and profile picture (800x800) for "Other End of the Wire".
Navy background, copper wire that ends in a glowing point (the "other end")."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
FONT = HERE.parent.parent / "assets" / "Anton-Regular.ttf"
NAVY, COPPER, COPPER_HI, AMBER, WHITE, MUTED = (8, 14, 28), (200, 117, 51), (232, 160, 96), (255, 196, 0), (255, 255, 255), (159, 176, 200)


def bg(w, h):
    im = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(im)
    step = h // 18
    for x in range(0, w, step):
        d.line((x, 0, x, h), fill=(14, 24, 46), width=1)
    for y in range(0, h, step):
        d.line((0, y, w, y), fill=(14, 24, 46), width=1)
    return im


def glow(im, xy, r, color):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    for k, a in [(6, 40), (4, 70), (2.5, 120)]:
        d.ellipse((x - r * k, y - r * k, x + r * k, y + r * k), fill=color + (a,))
    layer = layer.filter(ImageFilter.GaussianBlur(r * 2))
    im.paste(layer, (0, 0), layer)
    ImageDraw.Draw(im).ellipse((x - r, y - r, x + r, y + r), fill=(255, 240, 200))


def wire(d, pts, width):
    d.line(pts, fill=COPPER, width=width, joint="curve")
    d.line([(x, y - width * 0.25) for x, y in pts], fill=COPPER_HI, width=max(2, width // 4), joint="curve")


def centered(d, y, text, size, fill, w):
    f = ImageFont.truetype(str(FONT), size)
    tw = d.textlength(text, font=f)
    d.text(((w - tw) / 2, y), text, font=f, fill=fill)
    return tw


# --- banner: safe area for all devices is the centered 1546x423 box
W, H = 2560, 1440
b = bg(W, H)
d = ImageDraw.Draw(b)
centered(d, 548, "OTHER END OF THE WIRE", 170, WHITE, W)
centered(d, 772, "FOLLOW THE ELECTRON", 58, AMBER, W)
y = 880
wire(d, [(0, y), (700, y), (760, y - 20), (1800, y - 20), (1860, y), (1985, y)], 14)
glow(b, (1985, y), 16, AMBER)
b.save(HERE / "banner_2560x1440.png")

# --- profile: works as a circle down to 98 px
S = 800
p = bg(S, S)
d = ImageDraw.Draw(p)
centered(d, 175, "OTHER", 190, WHITE, S)
centered(d, 375, "END", 190, WHITE, S)
wire(d, [(0, 640), (300, 640), (340, 615), (560, 615)], 22)
glow(p, (560, 615), 26, AMBER)
p.save(HERE / "profile_800x800.png")
# preview: profile as a small circle
mask = Image.new("L", (S, S), 0); ImageDraw.Draw(mask).ellipse((0, 0, S, S), fill=255)
prev = Image.new("RGB", (S, S), (255, 255, 255)); prev.paste(p, (0, 0), mask)
prev.resize((98, 98), Image.LANCZOS).save(HERE / "profile_preview_98px.png")
print("ok")
