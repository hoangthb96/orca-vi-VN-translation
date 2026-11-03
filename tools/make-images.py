#!/usr/bin/env python3
"""Generate images/cover.png (1600x1000) for the Orca vi plugin.

Cover: single centered headline on a gray field. Orca crops the cover to a wide banner
(~4.3:1) in the plugin detail view, so the text must sit inside the middle ~37% band
(y 316-684). Rendered at 4x and downscaled with LANCZOS for smooth edges.

Note: the manifest `icon` field was removed — Orca's plugin list draws a generic type
icon (PluginRowArt) and nothing renders images.icon, so an icon PNG has no visible slot.
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

FB = r"C:\Windows\Fonts\segoeuib.ttf"   # Segoe UI Bold

FLAG_RED = (218, 37, 29)      # #DA251D — chuẩn màu cờ Việt Nam
FLAG_RED_DARK = (168, 26, 20)
STAR_YELLOW = (255, 255, 0)   # #FFFF00 — chuẩn màu sao cờ
WHITE = (242, 245, 249)
SS = 4                        # supersample factor


def font(path, size):
    return ImageFont.truetype(path, size)


def fit(draw, txt, path, size, maxw):
    while size > 10:
        f = font(path, size)
        bb = draw.textbbox((0, 0), txt, font=f)
        if bb[2] - bb[0] <= maxw:
            return f
        size -= 2
    return font(path, size)


def center_ink(draw, txt, f, cx, cy, fill):
    """Draw txt so its ink box is centered at (cx, cy)."""
    bb = draw.textbbox((0, 0), txt, font=f)
    draw.text((cx - (bb[2] - bb[0]) / 2, cy - (bb[1] + bb[3]) / 2), txt, font=f, fill=fill)


def gradient(size, top, bot):
    img = Image.new("RGB", size)
    px = img.load()
    w, h = size
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def star(cx, cy, r, points=5):
    """Five-point star polygon: outer radius r, inner radius r*0.382."""
    pts = []
    for i in range(points * 2):
        rad = r if i % 2 == 0 else r * 0.382
        ang = math.radians(-90 + i * 180 / points)
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    return pts


# ---- cover: single centered headline on a calm gray field ----
# Text sits inside Orca's detail-view crop window (~y 316-684 at a 1100px-wide hero),
# so the 4.3:1 banner still shows the full headline.
W, H = 1600, 1000
COVER_TOP = (38, 42, 49)      # #262A31
COVER_BOT = (24, 27, 32)      # #181B20
TEXT_GRAY = (222, 226, 231)   # gray-white
img = gradient((W * SS, H * SS), COVER_TOP, COVER_BOT)
d = ImageDraw.Draw(img)
head = "Tiếng Việt"
hf = fit(d, head, FB, 240 * SS, int(W * 0.72) * SS)
center_ink(d, head, hf, W * SS // 2, H * SS // 2, TEXT_GRAY)
img = img.resize((W, H), Image.LANCZOS)
img.save("images/cover.png")
print("cover.png", img.size, os.path.getsize("images/cover.png"), "bytes, headline", hf.size // SS)
