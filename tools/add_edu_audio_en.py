#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Nagranie BeHopeful -> lekki plik na serwer i pole `audio` w materiale.

    python tools/add_edu_audio_en.py 1 "<...>/one27/SzkoleniaAudio/BeHopeful_001_z_muzyka.mp3"

Jak w polskiej aplikacji (Apka_Marka/tools/build_edu_audio.py): mono, 24 kHz, MP3 48 kb/s,
-16 LUFS, tagi ID3. Plik NIE trafia do tego repo (publiczne, setki nagran po kilka MB):
laduje w ../Apka_Marka/public/audio/en/edu/NNN.mp3 i serwer polskiej aplikacji wystawia go
pod https://jestnadzieja.adwent.pl/audio/en/edu/NNN.mp3 - po tym skrypcie uruchom
`bash deploy-ftp.sh` w ../Apka_Marka. Odtwarzacz gra tylko strumieniowo (no-store na serwerze).

Skrypt dopisuje `audio` (sciezka z suma `?v=`, dlugosc, rozmiar) do public/content/en/edu/NN.json
i `audio: true` do edu/index.json.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EDU = ROOT / "public" / "content" / "en" / "edu"
OUT = ROOT.parent / "Apka_Marka" / "public" / "audio" / "en" / "edu"
LOUDNESS = "I=-16:TP=-1.5:LRA=11"


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    nr, src = int(sys.argv[1]), Path(sys.argv[2])
    if not src.exists():
        sys.exit(f"Missing file: {src}")
    item_path = EDU / f"{nr:02d}.json"
    item = json.loads(item_path.read_text(encoding="utf-8"))

    p = run(["ffmpeg", "-hide_banner", "-i", str(src), "-af", f"loudnorm={LOUDNESS}:print_format=json", "-f", "null", "-"])
    tail = p.stderr[p.stderr.rindex("{"):]
    m = json.loads(tail[: tail.index("}") + 1])
    af = (f"loudnorm={LOUDNESS}:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
          f":offset={m['target_offset']}:linear=true")
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{nr:03d}.mp3"
    p = run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
             "-af", af, "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k",
             "-map_metadata", "-1", "-id3v2_version", "3",
             "-metadata", f"title={nr}. {item['title']}", "-metadata", "artist=One Voice 27",
             "-metadata", "album=BeHopeful", "-metadata", f"track={nr}", str(dst)])
    if p.returncode:
        sys.exit(p.stderr)

    data = dst.read_bytes()
    seconds = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)]).stdout)
    item["audio"] = {"src": f"audio/en/edu/{nr:03d}.mp3?v={hashlib.md5(data).hexdigest()[:8]}",
                     "seconds": round(seconds), "bytes": len(data)}
    # pole audio zaraz po tytule i odnosniku - jak w polskich plikach
    order = ["nr", "title", "ref", "note", "sources", "audio"]
    item = {**{k: item[k] for k in order if k in item}, **{k: v for k, v in item.items() if k not in order}}
    item_path.write_text(json.dumps(item, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")

    index_path = EDU / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    for it in index["items"]:
        if it["nr"] == nr:
            it["audio"] = True
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")

    print(f"{dst}: {src.stat().st_size / 1e6:.1f} MB -> {len(data) / 1e6:.1f} MB, {seconds / 60:.1f} min")
    print("next: bash deploy-ftp.sh in ../Apka_Marka, then push this repo")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
