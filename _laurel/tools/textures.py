"""Generate Laurel's tileable textures (grayscale; themes tint them in CSS).

Run: python3 _laurel/tools/textures.py  ->  _laurel/src/textures/{wood,paper}.jpg
FFT-filtered noise is periodic, so every texture tiles without seams.
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "textures")
rng = np.random.default_rng(1926)


def fft_noise(h, w, lx, ly, beta=2.0):
    """Periodic noise with correlation lengths lx (along x) and ly (along y) in pixels."""
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    r = np.sqrt((fx * lx) ** 2 + (fy * ly) ** 2) + 1e-6
    amp = 1.0 / (1.0 + r ** beta)
    amp[0, 0] = 0
    spec = (rng.normal(size=(h, w)) + 1j * rng.normal(size=(h, w))) * amp
    n = np.real(np.fft.ifft2(spec))
    return (n - n.mean()) / (n.std() + 1e-9)


def wood(h=1024, w=1024):
    y = np.arange(h)[:, None] / h
    warp = fft_noise(h, w, 900, 260, 3.0) * 1.0 + fft_noise(h, w, 260, 60, 2.6) * 0.18
    rings = 22  # integer => tiles vertically
    v = y * rings + warp * 0.5
    band = 0.5 + 0.5 * np.cos(2 * np.pi * v)
    weight = 0.55 + 0.45 * np.clip(fft_noise(h, w, 500, 90, 2.4) * 0.6 + 0.5, 0, 1)
    late = band ** 16 * weight  # thin dark latewood lines, varying in strength
    soft = band ** 2.5
    v2 = y * rings * 3 + warp * 1.5  # faint secondary grain
    late += 0.25 * (0.5 + 0.5 * np.cos(2 * np.pi * v2)) ** 20
    fibres = fft_noise(h, w, 700, 1.4, 2.0)
    fine = fft_noise(h, w, 120, 0.9, 1.8)
    figure = fft_noise(h, w, 600, 260, 3.0)  # broad colour drift (heartwood variation)
    g = 0.64 - 0.13 * late - 0.06 * soft + 0.022 * fibres + 0.012 * fine + 0.045 * figure
    g = np.clip(g, 0, 1)
    return Image.fromarray((g * 255).astype(np.uint8), "L")


def paper(h=512, w=512):
    fibres = fft_noise(h, w, 30, 30, 1.2)
    blot = fft_noise(h, w, 140, 140, 2.8)
    grain = rng.normal(size=(h, w))
    g = 0.93 + 0.012 * fibres + 0.02 * blot + 0.008 * grain
    g = np.clip(g, 0, 1)
    return Image.fromarray((g * 255).astype(np.uint8), "L")


os.makedirs(OUT, exist_ok=True)
wood().save(os.path.join(OUT, "wood.jpg"), quality=78, optimize=True, progressive=True)
paper().save(os.path.join(OUT, "paper.jpg"), quality=72, optimize=True, progressive=True)
for n in ("wood.jpg", "paper.jpg"):
    print(n, os.path.getsize(os.path.join(OUT, n)))
