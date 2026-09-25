# -*- coding: utf-8 -*-
"""Hope Groups (en/groups/*.json): wstawia tekst Pisma do blokow "pismo".

Pisarz podaje w kazdym fragmencie tylko angielski `odnosnik` (np. "Ezekiel 31:3-6, 10-11",
"Jude 9", "Daniel 2:36-45") i `przeklad` ("BSB", wyjatkowo "WEB"/"KJV"). Skrypt wycina
wersety z pelnego przekladu (en/bible/{KOD}/) i zapisuje je w `akapity` jako jeden akapit;
przerwy miedzy odcinkami oznacza wielokropkiem. Nadpisy psalmow (<b>) sa pomijane.
Tekst Pisma nigdy nie jest pisany recznie.

Uzycie:
  python tools/fill_scripture_groups.py            # wszystkie pliki
  python tools/fill_scripture_groups.py E-01 E-02  # wybrane
  python tools/fill_scripture_groups.py --ref "Ezekiel 31:3-6, 10-11"   # podglad jednego odnosnika
"""
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en')
TITLE = re.compile(r'<b>.*?</b>\s*', re.S)
TAG = re.compile(r'<[^>]+>')
_books = {}
_cache = {}


def books(tr):
    if tr not in _books:
        idx = json.load(io.open(os.path.join(EN, 'bible', tr, 'index.json'), encoding='utf-8'))['books']
        _books[tr] = idx
    return _books[tr]


def resolve(name, tr):
    key = name.lower().replace('.', '').replace(' ', '')
    if key in ('psalm', 'psalms', 'ps'):
        return 'Ps'
    if key in ('songofsolomon', 'songofsongs', 'song'):
        return 'Song'
    for b in books(tr):
        for cand in (b['osis'], b['name'], b['abbr']):
            if cand.lower().replace(' ', '') == key:
                return b['osis']
    raise ValueError('nieznana ksiega: ' + name)


def chapters(osis, tr):
    k = (tr, osis)
    if k not in _cache:
        _cache[k] = json.load(io.open(os.path.join(EN, 'bible', tr, osis + '.json'), encoding='utf-8'))['chapters']
    return _cache[k]


def verse(osis, ch, v, tr):
    rows = chapters(osis, tr)
    if ch < 1 or ch > len(rows) or v < 1 or v > len(rows[ch - 1]):
        raise ValueError('brak wersetu {0} {1}:{2}'.format(osis, ch, v))
    return TAG.sub('', TITLE.sub('', rows[ch - 1][v - 1])).strip()


def text_for(ref, tr='BSB'):
    """'Ezekiel 31:3-6, 10-11' / 'Genesis 2:18, 21-24' / 'Jude 9' / 'Luke 22:66-23:5' -> tekst."""
    ref = ref.replace('–', '-').replace('—', '-').strip()
    m = re.match(r'^((?:[123]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d.*)$', ref)
    if not m:
        raise ValueError('zly odnosnik: ' + ref)
    osis = resolve(m.group(1), tr)
    rest = m.group(2).replace(' ', '')
    single = len(chapters(osis, tr)) == 1
    segs, ch = [], None
    for part in rest.split(','):
        if not part:
            continue
        if ':' not in part and ch is None:
            if single:
                ch = 1
                a, _, b = part.partition('-')
                segs.append((1, int(a), 1, int(b or a)))
                continue
            a, _, b = part.partition('-')          # cale rozdzialy
            for c in range(int(a), int(b or a) + 1):
                segs.append((c, 1, c, len(chapters(osis, tr)[c - 1])))
            continue
        a, _, b = part.partition('-')
        if ':' in a:
            ch, v1 = [int(x) for x in a.split(':')]
        else:
            v1 = int(a)
        if b:
            if ':' in b:
                c2, v2 = [int(x) for x in b.split(':')]
            else:
                c2, v2 = ch, int(b)
        else:
            c2, v2 = ch, v1
        segs.append((ch, v1, c2, v2))
        ch = c2
    out = []
    for (c1, v1, c2, v2) in segs:
        words = []
        c, v = c1, v1
        while (c, v) <= (c2, v2):
            rows = chapters(osis, tr)
            if v > len(rows[c - 1]):
                c, v = c + 1, 1
                continue
            t = verse(osis, c, v, tr)
            if t:
                words.append(t)
            v += 1
        out.append(' '.join(words))
    return ' … '.join(out)


def fill_file(path):
    d = json.load(io.open(path, encoding='utf-8'))
    n, errors = 0, []

    def walk(x):
        nonlocal n
        if isinstance(x, dict):
            if x.get('typ') == 'pismo':
                for fr in x.get('fragmenty', []):
                    tr = fr.get('przeklad') or 'BSB'
                    if tr not in ('BSB', 'WEB', 'KJV'):
                        tr = 'BSB'
                        fr['przeklad'] = tr
                    try:
                        fr['akapity'] = [text_for(fr['odnosnik'], tr)]
                        n += 1
                    except Exception as e:
                        errors.append('{0}: {1}'.format(fr.get('odnosnik'), e))
                return
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(d)
    with io.open(path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write('\n')
    return n, errors


def main(argv):
    if argv[:1] == ['--ref']:
        tr = argv[2] if len(argv) > 2 else 'BSB'
        print(text_for(argv[1], tr))
        return 0
    ids = set(argv)
    files = sorted(glob.glob(os.path.join(EN, 'groups', '*-*.json')))
    bad = 0
    for p in files:
        gid = os.path.basename(p)[:-5]
        if ids and gid not in ids:
            continue
        n, errors = fill_file(p)
        print('{0}: {1} fragmentow{2}'.format(gid, n, '' if not errors else ', BLEDY: ' + '; '.join(errors)))
        bad += len(errors)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
