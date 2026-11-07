"""Build photographic cloud plates for the drone descent.

The source is an aerial cloudscape.  We deliberately crop below the sunset
horizon so no hard orange line can tile across the opening sky, lift the
shadows, then cut soft-edged cloud cards that can be layered as sprites and
as a horizontal cloud ocean.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import os, random

SRC = r"public/images/hero_clouds.jpg"
OUT = r"public/images"
os.makedirs(OUT, exist_ok=True)

src = Image.open(SRC).convert("RGB")
W, H = src.size
print("source", W, H)

# cloud field below the horizon: no sun strip, no hard skyline
field = src.crop((0, int(H * 0.435), W, H))
field = ImageEnhance.Brightness(field).enhance(1.52)
field = ImageEnhance.Contrast(field).enhance(1.10)
field = ImageEnhance.Color(field).enhance(1.04)
field = field.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))

# one wide, slightly blurred plate for the cloud ocean plane
ocean = field.resize((2560, int(field.height * 2560 / field.width)), Image.LANCZOS)
ocean = ImageEnhance.Brightness(ocean).enhance(1.10)
ocean.save(os.path.join(OUT, "cloud_ocean.jpg"), quality=92, optimize=True, subsampling=1)
print("cloud_ocean", ocean.size)

# a softer horizon strip, still photographic
deck = field.resize((2048, 512), Image.LANCZOS)
deck = ImageEnhance.Brightness(deck).enhance(1.16)
deck = deck.filter(ImageFilter.GaussianBlur(0.8))
deck.save(os.path.join(OUT, "cloud_deck.jpg"), quality=90, optimize=True, subsampling=1)
print("cloud_deck", deck.size)

FIELD_W, FIELD_H = field.size

CROPS = [
    ("cloud_card_01", (0, 0, 620, 400)),
    ("cloud_card_02", (560, 40, 1180, 430)),
    ("cloud_card_03", (1160, 0, 1780, 390)),
    ("cloud_card_04", (180, 210, 800, 620)),
    ("cloud_card_05", (860, 250, 1480, 660)),
    ("cloud_card_06", (1280, 160, 1900, 560)),
    ("cloud_card_07", (420, 330, 1040, 720)),
]

for name, box in CROPS:
    crop = field.crop(box)
    cw, ch = crop.size
    target_w = 1024
    crop = crop.resize((target_w, int(ch * target_w / cw)), Image.LANCZOS)
    crop = ImageEnhance.Contrast(crop).enhance(1.08)
    crop = ImageEnhance.Brightness(crop).enhance(1.06)

    w, h = crop.size
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    random.seed(13 + len(name))
    md.ellipse((-w * 0.10, -h * 0.16, w * 1.10, h * 1.06), fill=255)
    for _ in range(22):
        cx = random.uniform(-0.12, 1.12) * w
        cy = random.uniform(-0.05, 1.05) * h
        r = random.uniform(0.10, 0.27) * w
        md.ellipse((cx - r, cy - r * 0.55, cx + r, cy + r * 0.55), fill=random.randint(0, 115))
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.020))
    # make top and bottom edges dissolve completely
    edge = Image.new("L", (w, h), 0)
    ed = ImageDraw.Draw(edge)
    for y in range(h):
        t = y / max(1, h - 1)
        val = int(255 * min(1.0, t * 5.0, (1.0 - t) * 5.0))
        ed.line((0, y, w, y), fill=val)
    edge = edge.filter(ImageFilter.GaussianBlur(w * 0.015))
    mask = Image.composite(mask, Image.new("L", (w, h), 0), edge)

    rgba = crop.convert("RGBA")
    rgba.putalpha(mask)
    rgba.save(os.path.join(OUT, name + ".png"), optimize=True)
    print(name, rgba.size)

# soft sky gradient plate used only as a CSS overlay beneath the real clouds
sky = Image.new("RGB", (1024, 512), (0, 0, 0))
pix = sky.load()
for y in range(512):
    t = y / 511
    for x in range(1024):
        r = int(234 * (1 - t) + 118 * t)
        g = int(211 * (1 - t) + 149 * t)
        b = int(182 * (1 - t) + 177 * t)
        sun = max(0.0, 1.0 - abs(x / 1023 - 0.72) * 2.1)
        r = min(255, int(r + 18 * sun * (1 - t)))
        g = min(255, int(g + 10 * sun * (1 - t)))
        pix[x, y] = (r, g, b)
sky.save(os.path.join(OUT, "sky_wash.jpg"), quality=90, optimize=True)
print("sky_wash saved")
