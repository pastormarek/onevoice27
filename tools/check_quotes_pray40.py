# -*- coding: utf-8 -*-
"""Kontrola cytatow w angielskich czytankach 40 dni (public/content/en/pray40/).

Kazdy cytat w cudzyslowie typograficznym, dluzszy niz MIN znakow, musi wystapic
doslownie (po normalizacji interpunkcji i wielkosci liter) w BSB albo – gdy oznaczony
(WEB)/(KJV) – w tym przekladzie. Wielokropek dzieli cytat na kawalki; kazdy musi byc.
Wypisuje cytaty, ktorych nie ma w zadnym przekladzie (do recznego przejrzenia:
to moga byc cytaty z ludzi, a nie z Pisma).

Uzycie: python tools/check_quotes_pray40.py [dzien ...]
"""
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en')
MIN = 18
TAG = re.compile(r'<[^>]+>')
QUOTE = re.compile('“([^”]+)”(\\s*\\((WEB|KJV)\\))?')


def norm(s):
    s = s.lower().replace('’', "'").replace('‘', "'")
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def corpus(tr):
    parts = []
    for p in glob.glob(os.path.join(EN, 'bible', tr, '*.json')):
        if p.endswith('index.json'):
            continue
        for ch in json.load(io.open(p, encoding='utf-8'))['chapters']:
            parts.extend(TAG.sub('', v) for v in ch)
    return ' ' + norm(' '.join(parts)) + ' '


def main(days):
    text = dict((tr, corpus(tr)) for tr in ('BSB', 'WEB', 'KJV'))
    files = sorted(glob.glob(os.path.join(EN, 'pray40', '[0-9][0-9].json')))
    total = bad = 0
    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        if days and d['day'] not in days:
            continue
        paras = []
        for v in d['versions'].values():
            for s in v['sections']:
                paras.extend(s['paragraphs'])
        for para in paras:
            for m in QUOTE.finditer(para):
                q, tr = m.group(1), m.group(3) or 'BSB'
                if len(q) < MIN:
                    continue
                total += 1
                chunks = [norm(c) for c in re.split('…|\\.\\.\\.', q)]
                chunks = [c for c in chunks if len(c) > 3]
                if all(' ' + c in text[tr] or c in text[tr] for c in chunks):
                    continue
                other = [t for t in text if all(c in text[t] for c in chunks)]
                bad += 1
                print('dzien {0:2d} [{1}{2}] {3}'.format(
                    d['day'], tr, (' -> jest w ' + '/'.join(other)) if other else '', q[:110]))
    print('\n{0} cytatow, {1} do sprawdzenia'.format(total, bad))


if __name__ == '__main__':
    main(set(int(a) for a in sys.argv[1:]))
