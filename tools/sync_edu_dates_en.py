#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Daty materialow BeHopeful wedlug kalendarza polskiego Czlowieka Nadziei (decyzja 2026-10-15).

    python tools/sync_edu_dates_en.py && python tools/build_indexes_en.py

Bierze `date` (i `open`) z ../Apka_Marka/public/content/pl/edu/index.json, dopisuje do
public/content/en/edu/NN.json `date` i angielskie `dateLabel` („Thursday, October 15”).
Data sluzy stronie glownej do wyboru dzisiejszego materialu; materialow NIE blokuje
(w wersji angielskiej wszystkie sa otwarte). Inny kalendarz dla EN = wpisz daty w plikach recznie.
"""
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PL = ROOT.parent / "Apka_Marka" / "public" / "content" / "pl" / "edu" / "index.json"
EN = ROOT / "public" / "content" / "en" / "edu"


def label(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return f"{d.strftime('%A')}, {d.strftime('%B')} {d.day}"


for it in json.loads(PL.read_text(encoding="utf-8"))["items"]:
    p = EN / f"{it['nr']:02d}.json"
    if not it.get("date") or not p.exists():
        continue
    d = json.loads(p.read_text(encoding="utf-8"))
    d["date"], d["dateLabel"] = it["date"], label(it["date"])
    # kolejnosc kluczy jak w PL: nr, date, dateLabel, potem reszta
    d = {"nr": d["nr"], "date": d["date"], "dateLabel": d["dateLabel"], **{k: v for k, v in d.items() if k not in ("nr", "date", "dateLabel")}}
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(p.name, d["date"], d["dateLabel"])
