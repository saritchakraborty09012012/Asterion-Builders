"""Generate believable apartment facade sheets for the township towers.

Each sheet holds four floors by six bays and tiles cleanly in both directions.
The glass is drawn as a soft vertical sky gradient with recessed spandrels,
mullions and occasional warm interiors rather than flat black rectangles.
"""
from PIL import Image, ImageDraw, ImageFilter
import random, os

OUT = r"public/images"
os.makedirs(OUT, exist_ok=True)


def rgb(hex_col):
    return ((hex_col >> 16) & 255, (hex_col >> 8) & 255, hex_col & 255)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def grain(img, base, seed, amount=9000):
    random.seed(seed)
    d = ImageDraw.Draw(img)
    for _ in range(amount):
        x, y = random.randrange(img.width), random.randrange(img.height)
        f = random.uniform(0.90, 1.08)
        c = tuple(max(0, min(255, int(v * f))) for v in base)
        d.point((x, y), fill=c)


def facade(name, base_hex, glass_hex, accent_hex, seed, balcony=True, banded=True):
    random.seed(seed)
    W = H = 512
    base = rgb(base_hex)
    glass = rgb(glass_hex)
    accent = rgb(accent_hex)

    img = Image.new("RGB", (W, H), base)
    grain(img, base, seed)
    d = ImageDraw.Draw(img)

    floors = 4
    bays = 6
    fh = H / floors
    bw = W / bays

    for floor in range(floors):
        y0 = floor * fh

        # ---- floor slab and the shadow it casts on the storey below ----
        d.rectangle((0, y0, W, y0 + fh * 0.055), fill=mix(base, (255, 252, 244), 0.42))
        d.rectangle((0, y0 + fh * 0.055, W, y0 + fh * 0.085), fill=mix(base, (52, 48, 41), 0.35))
        d.rectangle((0, y0 + fh * 0.085, W, y0 + fh * 0.12), fill=mix(base, (255, 252, 244), 0.16))

        for bay in range(bays):
            x0 = bay * bw
            # ---- structural pier with a lit edge and a shadowed reveal ----
            d.rectangle((x0, y0, x0 + bw * 0.055, y0 + fh), fill=mix(base, (255, 252, 245), 0.30))
            d.rectangle((x0 + bw * 0.055, y0, x0 + bw * 0.075, y0 + fh), fill=mix(base, (70, 64, 55), 0.30))
            d.rectangle((x0 + bw * 0.075, y0, x0 + bw * 0.085, y0 + fh), fill=mix(base, (250, 246, 237), 0.10))

            # ---- window recess ----
            wx = x0 + bw * 0.15
            wy = y0 + fh * 0.20
            ww = bw * 0.70
            wh = fh * 0.57

            d.rectangle(
                (wx - 6, wy - 6, wx + ww + 6, wy + wh + 8),
                fill=mix(base, (58, 54, 47), 0.52),
            )
            d.rectangle((wx - 3, wy - 3, wx + ww + 3, wy + wh + 5), fill=mix(base, (82, 77, 68), 0.42))

            # glazing: cool sky gradient that lifts toward the top
            for yy in range(int(wy), int(wy + wh)):
                t = (yy - wy) / max(1.0, wh)
                g = mix(glass, (154, 173, 172), 0.18 + 0.37 * (1 - t))
                # a slow horizontal tonal drift, like reflected sky
                g = mix(g, (206, 214, 205), 0.06 * math_sin(x0 * 0.02 + yy * 0.01))
                if random.random() < 0.12:
                    g = mix(g, (28, 35, 37), random.random() * 0.28)
                d.line((wx, yy, wx + ww, yy), fill=g)

            # broad, soft reflection band along one side of the glass
            band_x = wx + ww * (0.10 if bay % 2 == 0 else 0.54)
            for yy in range(int(wy), int(wy + wh)):
                t = (yy - wy) / max(1.0, wh)
                strength = 0.16 * (1 - t) * (0.55 + 0.45 * math_sin(t * 3.1))
                d.line((band_x, yy, band_x + ww * 0.22, yy), fill=mix(glass, (210, 220, 212), strength))

            # mullions and transom
            d.rectangle(
                (wx + ww * 0.49, wy, wx + ww * 0.49 + bw * 0.018, wy + wh),
                fill=mix(base, (228, 223, 212), 0.36),
            )
            d.rectangle(
                (wx, wy + wh * 0.56, wx + ww, wy + wh * 0.56 + bw * 0.014),
                fill=mix(base, (223, 218, 207), 0.30),
            )
            # thin muntin on some bays only, so the grid never feels cloned
            if bay % 3 == 1:
                d.rectangle(
                    (wx + ww * 0.74, wy, wx + ww * 0.74 + bw * 0.010, wy + wh),
                    fill=mix(base, (214, 209, 199), 0.24),
                )

            # occasional warm interior, very restrained in daylight
            if random.random() < 0.09:
                warm = (255, 204, 146)
                for yy in range(int(wy + 3), int(wy + wh - 2)):
                    a = 0.20 + 0.22 * (1 - (yy - wy) / max(1.0, wh))
                    d.line((wx + 3, yy, wx + ww - 3, yy), fill=mix(glass, warm, a))
                d.rectangle((wx + 3, wy + 3, wx + ww - 3, wy + wh - 2), outline=mix(base, warm, 0.25))

            # balcony: slab, glass balustrade, sometimes a planter
            if balcony and bay % 2 == 0:
                by = y0 + fh * 0.83
                d.rectangle((x0 + 2, by - 3, x0 + bw - 2, by + 5), fill=mix(base, (242, 236, 224), 0.36))
                d.rectangle((x0 + 2, by + 5, x0 + bw - 2, by + 8), fill=mix(base, (70, 64, 56), 0.45))
                for yy in range(int(by - fh * 0.16), int(by - 3)):
                    t = (yy - (by - fh * 0.16)) / (fh * 0.16)
                    rail = mix(glass, (180, 201, 199), 0.25 + 0.12 * t)
                    d.line((x0 + bw * 0.04, yy, x0 + bw * 0.96, yy), fill=rail)
                d.line((x0 + bw * 0.04, by - 4, x0 + bw * 0.96, by - 4), fill=mix(base, (238, 231, 218), 0.45))
                if random.random() < 0.5:
                    d.rectangle((x0 + bw * 0.10, by - 12, x0 + bw * 0.30, by - 4), fill=mix((46, 60, 41), (112, 129, 84), 0.28))
                    d.rectangle((x0 + bw * 0.12, by - 16, x0 + bw * 0.26, by - 9), fill=mix((55, 76, 49), (129, 146, 92), 0.22))

            # shallow awning / sunshade on some floors, reminiscent of NCR towers
            if banded and floor % 2 == 1 and bay % 3 == 0:
                d.rectangle((wx - 5, wy - 9, wx + ww + 5, wy - 4), fill=mix(accent, base, 0.55))
                d.rectangle((wx - 5, wy - 4, wx + ww + 5, wy - 2), fill=mix(base, (72, 65, 55), 0.38))

        # faint horizontal weathering under the slab
        for k in range(3):
            y = int(y0 + fh * (0.90 + k * 0.012))
            d.line((0, y, W, y), fill=mix(base, (110, 101, 87), 0.05))

    # corner piers read as real structure
    for x in (0, W - 8):
        d.rectangle((x, 0, x + 8, H), fill=mix(base, (250, 246, 237), 0.28))
        d.rectangle((x + 6, 0, x + 8, H), fill=mix(base, (74, 67, 57), 0.38))

    # parapet at the very top
    d.rectangle((0, 0, W, 6), fill=mix(base, (255, 252, 244), 0.45))
    d.rectangle((0, 6, W, 12), fill=mix(base, (80, 73, 62), 0.28))

    img = img.filter(ImageFilter.GaussianBlur(0.42))
    img.save(os.path.join(OUT, name), quality=92, optimize=True, subsampling=1)
    print(name, img.size)


def math_sin(x):
    import math

    return math.sin(x)


facade("facade_warm.jpg", 0xD5C9B7, 0x2A3437, 0xB08A5E, 3, balcony=True, banded=True)
facade("facade_stone.jpg", 0xCEC7BA, 0x2C3639, 0x94836C, 11, balcony=True, banded=False)
facade("facade_grey.jpg", 0xC3C0B7, 0x252F32, 0x7C8A82, 23, balcony=False, banded=True)
facade("facade_white.jpg", 0xDCD5C8, 0x2E373A, 0xA88963, 31, balcony=True, banded=True)
facade("facade_context.jpg", 0xB8B0A2, 0x2B3437, 0x8F8069, 47, balcony=False, banded=False)
