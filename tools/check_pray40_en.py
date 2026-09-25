# -*- coding: utf-8 -*-
"""Porownanie angielskich czytanek z polskim oryginalem: schemat, liczba sekcji i pytan,
proporcja dlugosci, pauzy (em dash). Uzycie: python tools/check_pray40_en.py"""
import glob, io, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en', 'pray40')
PL = os.path.join(ROOT, '..', 'Apka_Marka', 'public', 'content', 'pl', 'pray40')
L = lambda x, v: sum(len(p) for s in x['versions'][v]['sections'] for p in s['paragraphs'])
for f in sorted(glob.glob(os.path.join(EN, '[0-9][0-9].json'))):
    d = json.load(io.open(f, encoding='utf-8'))
    pl = json.load(io.open(os.path.join(PL, os.path.basename(f)), encoding='utf-8'))
    ok = (set(d) == {'day', 'title', 'ref', 'lead', 'questions', 'note', 'versions'}
          and all(len(d['versions'][v]['sections']) == len(pl['versions'][v]['sections']) for v in ('short', 'long'))
          and len(d['questions']) == len(pl['questions']))
    em = sum(p.count('—') for v in d['versions'].values() for s in v['sections'] for p in s['paragraphs'])
    print(d['day'], 'OK' if ok else 'SCHEMA?', round(L(d, 'short') / L(pl, 'short'), 2),
          round(L(d, 'long') / L(pl, 'long'), 2), 'emdash:', em, '|', d['title'], '|', d['ref'])
