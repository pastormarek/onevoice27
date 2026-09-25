# -*- coding: utf-8 -*-
"""Ikony PWA i grafika podgladu linku dla One Voice 27 (wydanie angielskie).

Znak: gradientowy hasztag w barwach #AllThingsNew (turkus -> niebieski -> fiolet -> roz)
na ciemnym, granatowo-fioletowym tle. Podglad linku: banner #AllThingsNew + nazwa.
Uzycie: python tools/make_icons_en.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
STOPS = [(0.0, (56, 214, 230)), (0.4, (99, 132, 255)), (0.72, (150, 105, 255)), (1.0, (232, 94, 190))]
BG1, BG2 = (20, 26, 58), (44, 22, 66)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def grad_color(t):
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        if t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return STOPS[-1][1]


def diag(size, fn):
    w, h = size
    im = Image.new('RGB', size)
    px = im.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = fn((x / w + y / h) / 2)
    return im


def icon(n, scale=1.0, rounded=True):
    S = n * 4
    bg = diag((S, S), lambda t: lerp(BG1, BG2, t))
    grad = diag((S, S), grad_color)
    mask = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(mask)
    k = S / 32 * scale
    off = S / 2 - 16 * k
    P = lambda x, y: (off + x * k, off + y * k)
    wdt = int(3.6 * k)
    for a, b in [((11, 5), (8, 27)), ((23, 5), (20, 27)), ((4, 13), (28, 13)), ((3, 20), (27, 20))]:
        d.line([P(*a), P(*b)], fill=255, width=wdt)
        for p in (a, b):
            x, y = P(*p)
            d.ellipse([x - wdt / 2, y - wdt / 2, x + wdt / 2, y + wdt / 2], fill=255)
    out = Image.composite(grad, bg, mask)
    if rounded:
        r = Image.new('L', (S, S), 0)
        ImageDraw.Draw(r).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        o = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        o.paste(out, (0, 0), r)
        out = o
    return out.resize((n, n), Image.LANCZOS)


def og():
    W, H = 1200, 630
    im = diag((W, H), lambda t: lerp((14, 18, 44), (40, 18, 58), t))
    banner = Image.open(os.path.join(PUB, 'allthingsnew.png')).convert('RGB')
    bw = W
    bh = int(banner.height * bw / banner.width)
    im.paste(banner.resize((bw, bh), Image.LANCZOS), (0, 150))
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype('C:/Windows/Fonts/seguibl.ttf', 76)
    f2 = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 34)
    t1 = 'One Voice 27'
    t2 = 'The Bible, Bible studies and 40 Days of Prayer'
    d.text(((W - d.textlength(t1, font=f1)) / 2, 420), t1, font=f1, fill=(255, 255, 255))
    d.text(((W - d.textlength(t2, font=f2)) / 2, 520), t2, font=f2, fill=(200, 205, 235))
    im.save(os.path.join(PUB, 'og-onevoice27.jpg'), quality=88)


def main():
    icon(512).save(os.path.join(PUB, 'pwa-512.png'))
    icon(192).save(os.path.join(PUB, 'pwa-192.png'))
    icon(512, scale=0.72, rounded=False).save(os.path.join(PUB, 'pwa-512-maskable.png'))
    icon(180, rounded=False).save(os.path.join(PUB, 'apple-touch-icon.png'))
    icon(64).save(os.path.join(PUB, 'favicon-64.png'))
    og()


if __name__ == '__main__':
    main()
