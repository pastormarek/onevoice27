# -*- coding: utf-8 -*-
"""Kontrola angielskich spotkan Hope Groups wobec polskiego oryginalu:
te same klucze i dlugosci list na kazdym poziomie, te same `typ` i id pytan,
wypelnione fragmenty Pisma, brak polskich znakow. Uzycie: python tools/check_groups_en.py"""
import glob
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en', 'groups')
PL = os.path.join(ROOT, '..', 'Apka_Marka', 'public', 'content', 'pl', 'groups')
PLCH = re.compile('[ąćęłńóśźż]', re.I)
FIXED = ('typ', 'id', 'poziom', 'kluczowe', 'opcjonalne', 'numer', 'zwijany', 'dlugosc', 'liczbaPytan', 'wersja', 'tryb')


def compare(a, b, path, errs):
    if isinstance(a, dict):
        if not isinstance(b, dict) or set(a) != set(b):
            errs.append(path + ': klucze ' + str(sorted(set(a) ^ set(b if isinstance(b, dict) else {}))))
            return
        for k in a:
            if k in FIXED and a[k] != b[k]:
                errs.append('{0}.{1}: {2!r} != {3!r}'.format(path, k, a[k], b[k]))
            if k == 'akapity':
                if not b[k] or not all(b[k]):
                    errs.append(path + ': pusty tekst Pisma')
                continue
            if k == 'tagi':
                continue
            compare(a[k], b[k], path + '.' + k, errs)
    elif isinstance(a, list):
        if not isinstance(b, list) or len(a) != len(b):
            errs.append('{0}: dlugosc {1} != {2}'.format(path, len(a), len(b) if isinstance(b, list) else '-'))
            return
        for i, (x, y) in enumerate(zip(a, b)):
            compare(x, y, '{0}[{1}]'.format(path, i), errs)


def main():
    # seria, ktorej nie ma jeszcze w polskiej aplikacji: zrodlo wyciagniete z one27 do tools/pl_groups_extra/
    extra = os.path.join(ROOT, 'tools', 'pl_groups_extra')
    pl_files = sorted(glob.glob(os.path.join(PL, '*-*.json')) + glob.glob(os.path.join(extra, '*-*.json')))
    ok = 0
    for p in pl_files:
        gid = os.path.basename(p)[:-5]
        e = os.path.join(EN, gid + '.json')
        if not os.path.exists(e):
            print(gid, 'BRAK')
            continue
        a = json.load(io.open(p, encoding='utf-8'))
        raw = io.open(e, encoding='utf-8').read()
        b = json.loads(raw)
        errs = []
        compare(a, b, gid, errs)
        if PLCH.search(raw):
            errs.append('polskie znaki: ' + ', '.join(sorted(set(m.group(0) for m in re.finditer(r'\w*[ąćęłńóśźż]\w*', raw, re.I)))[:8]))
        if errs:
            print(gid, 'BLEDY:', '; '.join(errs[:6]))
        else:
            ok += 1
    print('{0}/{1} spotkan bez uwag'.format(ok, len(pl_files)))


if __name__ == '__main__':
    main()
