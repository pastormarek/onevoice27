# -*- coding: utf-8 -*-
"""Podglad wersetow z pelnego przekladu angielskiego (public/content/en/bible/{KOD}/).

Uzycie:
  python tools/verse.py "Gen 3:1-5"            # BSB (domyslnie)
  python tools/verse.py "John 3:16" KJV
  python tools/verse.py --find "where are you" Gen   # szukanie frazy (opcjonalnie w ksiedze)

Odnosnik: skrot OSIS albo pelna nazwa angielska, rozdzial, opcjonalnie :werset[-werset].
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'public', 'content', 'en', 'bible')
TAG = re.compile(r'<[^>]+>')


def books(tr):
    with io.open(os.path.join(BASE, tr, 'index.json'), encoding='utf-8') as f:
        return json.load(f)['books']


def resolve(name, tr):
    key = name.lower().replace('.', '').replace(' ', '')
    for b in books(tr):
        for cand in (b['osis'], b['name'], b['abbr']):
            if cand.lower().replace(' ', '') == key:
                return b['osis']
    for b in books(tr):
        if b['name'].lower().replace(' ', '').startswith(key):
            return b['osis']
    raise SystemExit('Unknown book: ' + name)


def load(osis, tr):
    with io.open(os.path.join(BASE, tr, osis + '.json'), encoding='utf-8') as f:
        return json.load(f)['chapters']


def show(ref, tr):
    m = re.match(r'^\s*(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\s*$', ref)
    if not m:
        raise SystemExit('Bad reference: ' + ref)
    osis = resolve(m.group(1), tr)
    ch = int(m.group(2))
    verses = load(osis, tr)[ch - 1]
    a = int(m.group(3) or 1)
    b = int(m.group(4) or (m.group(3) or len(verses)))
    for n in range(a, min(b, len(verses)) + 1):
        print('{0} {1}:{2}  {3}'.format(osis, ch, n, TAG.sub('', verses[n - 1])))


def find(phrase, book, tr):
    ph = phrase.lower()
    for b in books(tr):
        if book and b['osis'] != resolve(book, tr):
            continue
        for ci, ch in enumerate(load(b['osis'], tr), 1):
            for vi, v in enumerate(ch, 1):
                t = TAG.sub('', v)
                if ph in t.lower():
                    print('{0} {1}:{2}  {3}'.format(b['osis'], ci, vi, t))


def main(argv):
    if argv and argv[0] == '--find':
        rest = argv[1:]
        tr = 'BSB'
        if rest and rest[-1] in ('WEB', 'KJV', 'BSB'):
            tr = rest.pop()
        find(rest[0], rest[1] if len(rest) > 1 else None, tr)
        return
    tr = argv[1] if len(argv) > 1 else 'BSB'
    show(argv[0], tr)


if __name__ == '__main__':
    main(sys.argv[1:])
