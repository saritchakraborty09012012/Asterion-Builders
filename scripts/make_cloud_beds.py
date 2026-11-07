"""Procedural, photoreal-leaning cloud beds for the opening drone shot.

A seamless multi-octave value-noise field is shaded as a cloud-top height map
with a low golden-hour sun.  Two independently seeded beds can be layered in
Three.js for parallax, and the irregular alpha keeps the plane edges invisible.
"""
from PIL import Image, ImageFilter
import numpy as np
import os

OUT = r"public/images"
os.makedirs(OUT, exist_ok=True)
RES = 1536


def periodic_noise(res, grid, seed):
    """Bilinearly interpolated value noise that tiles at `res`."""
    rng = np.random.default_rng(seed)
    lattice = rng.random((grid, grid))

    x = np.arange(res, dtype=np.float64) * (grid / res)
    y = np.arange(res, dtype=np.float64) * (grid / res)
    x0 = np.floor(x).astype(int) % grid
    y0 = np.floor(y).astype(int) % grid
    x1 = (x0 + 1) % grid
    y1 = (y0 + 1) % grid
    tx = x - np.floor(x)
    ty = y - np.floor(y)
    tx = tx * tx * (3 - 2 * tx)
    ty = ty * ty * (3 - 2 * ty)

    a = lattice[np.ix_(y0, x0)]
    b = lattice[np.ix_(y0, x1)]
    c = lattice[np.ix_(y1, x0)]
    d = lattice[np.ix_(y1, x1)]
    tx2 = tx[np.newaxis, :]
    ty2 = ty[:, np.newaxis]
    top = a * (1 - tx2) + b * tx2
    bot = c * (1 - tx2) + d * tx2
    return top * (1 - ty2) + bot * ty2


def fbm(res, seed, octaves=6, base=4, persistence=0.52):
    total = np.zeros((res, res), dtype=np.float64)
    amp = 1.0
    norm = 0.0
    for i in range(octaves):
        grid = base * (2 ** i)
        layer = periodic_noise(res, grid, seed + i * 97)
        total += layer * amp
        norm += amp
        amp *= persistence
    return total / norm


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def render(seed, res=RES):
    print("building", seed, res)
    base = fbm(res, seed, octaves=5, base=2, persistence=0.60)
    detail = fbm(res, seed + 331, octaves=4, base=8, persistence=0.55)
    warp = fbm(res, seed + 911, octaves=3, base=4, persistence=0.52)

    # domain warp adds the cauliflower / anvil shapes of real cumulus
    base = np.clip(base + (warp - 0.5) * 0.12, 0, 1)
    coverage = smoothstep(0.50, 0.63, base)
    fine = smoothstep(0.36, 0.64, detail)
    alpha = coverage * (0.72 + 0.28 * fine)

    # soft, rounded edges
    alpha = np.clip(alpha * 1.08, 0, 1)
    alpha = np.where(alpha < 0.035, 0.0, alpha)

    # cloud tops: blur the height field so the shading reads as big volumes
    height = np.power(np.clip(coverage, 0, 1), 0.9) * (0.8 + 0.35 * detail)
    height_img = Image.fromarray((height * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(4))
    height = np.asarray(height_img, dtype=np.float64) / 255.0
    gy, gx = np.gradient(height)
    strength = 65.0
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(height)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx /= length
    ny /= length
    nz /= length

    # low sun from the left, like the source key light in the 3d scene
    lx, ly, lz = -0.52, -0.30, 0.80
    lambert = np.clip(nx * lx + ny * ly + nz * lz, 0, 1)
    lambert = 0.18 + 0.82 * lambert
    sky = np.clip(nz, 0, 1)

    shadow = np.array([62, 79, 102], dtype=np.float64)
    mid = np.array([168, 180, 188], dtype=np.float64)
    lit = np.array([255, 250, 239], dtype=np.float64)
    warm = np.array([255, 222, 184], dtype=np.float64)

    # mix cool shadow -> neutral body -> warm highlight
    col = np.zeros((res, res, 3), dtype=np.float64)
    t1 = np.clip(lambert * 1.8, 0, 1)
    for c in range(3):
        col[:, :, c] = shadow[c] * (1 - t1) + mid[c] * t1
    hi = np.clip((lambert - 0.62) / 0.38, 0, 1) ** 1.2
    for c in range(3):
        col[:, :, c] = col[:, :, c] * (1 - hi) + lit[c] * hi
    glow = np.clip(sky * 0.20 + 0.05, 0, 1)
    for c in range(3):
        col[:, :, c] = col[:, :, c] * (1 - glow * 0.22) + warm[c] * glow * 0.22

    rgba = np.zeros((res, res, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(col, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    img = img.filter(ImageFilter.GaussianBlur(1.1))
    return img


for name, seed in (("cloud_bed_01.png", 41), ("cloud_bed_02.png", 87)):
    img = render(seed)
    img.save(os.path.join(OUT, name), optimize=True)
    print(name, img.size)

# a much softer, brighter plate for haze around the horizon
haze = render(303, res=1024).filter(ImageFilter.GaussianBlur(5))
haze.save(os.path.join(OUT, "cloud_haze.png"), optimize=True)
print("cloud_haze", haze.size)
