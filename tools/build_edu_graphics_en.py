#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grafiki do udostepniania pod materialem BeHopeful.

    python tools/build_edu_graphics_en.py        # wszystkie z one27/HopeGrafiki
    python tools/build_edu_graphics_en.py 1      # tylko materialu 1

Zrodlo: one27/HopeGrafiki/NNN_ENa.png, NNN_ENb.png ... (PNG 1122x1402; polskie NNN_PLx.png
obsluguje ../Apka_Marka/tools/build_edu_graphics.py). Obok opcjonalnie NNN_ENa.txt z tekstem grafiki:
opis dla czytnikow ekranu i podpis przy udostepnianiu.

Wynik: public/media/edu/NNNa.jpg (szerokosc 1080, JPEG ok. 200 KB) i pole `graphics`
w public/content/en/edu/NN.json. Grafiki sa w repo (kilkaset KB na material), wiec dzialaja
tez na GitHub Pages.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path.home() / "AIprojekty" / "one27" / "HopeGrafiki"
OUT = ROOT / "public" / "media" / "edu"
EDU = ROOT / "public" / "content" / "en" / "edu"
WIDTH = 1080
RE_NAME = re.compile(r"^(\d{3})_EN([a-z]?)\.png$", re.I)


def main() -> int:
    only = {int(a) for a in sys.argv[1:]}
    OUT.mkdir(parents=True, exist_ok=True)
    found: dict[int, list[dict]] = {}
    for png in sorted(SRC.glob("*.png")):
        m = RE_NAME.match(png.name)
        if not m or (only and int(m.group(1)) not in only):
            continue
        nr = int(m.group(1))
        dst = OUT / f"{m.group(1)}{m.group(2).lower()}.jpg"
        img = Image.open(png).convert("RGB")
        if img.width > WIDTH:
            img = img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
        img.save(dst, "JPEG", quality=86, optimize=True, progressive=True)
        txt = png.with_suffix(".txt")
        found.setdefault(nr, []).append({
            "src": f"media/edu/{dst.name}?v={hashlib.md5(dst.read_bytes()).hexdigest()[:8]}",
            "width": img.width,
            "height": img.height,
            **({"text": txt.read_text(encoding="utf-8").strip()} if txt.exists() else {}),
        })
        print(f"{png.name} -> {dst.relative_to(ROOT)} {img.width}x{img.height}, {dst.stat().st_size // 1024} KB")

    for nr, graphics in sorted(found.items()):
        path = EDU / f"{nr:02d}.json"
        if not path.exists():
            print(f"brak {path.name} - grafiki {nr} czekaja na tekst materialu")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        data["graphics"] = graphics
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
        print(f"{path.name}: {len(graphics)} grafik")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
