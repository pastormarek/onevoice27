# -*- coding: utf-8 -*-
"""Spis 40 dni (en/pray40/index.json) z plikow dni. Wydanie angielskie nie ma dat akcji."""
import glob, io, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'public', 'content', 'en', 'pray40')
days = []
for f in sorted(glob.glob(os.path.join(DIR, '[0-9][0-9].json'))):
    d = json.load(io.open(f, encoding='utf-8'))
    days.append({k: d[k] for k in ('day', 'title', 'ref', 'lead')})
with io.open(os.path.join(DIR, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump({'lang': 'en', 'title': '40 Days of Prayer', 'series': 'One Voice 27', 'days': days},
              f, ensure_ascii=False, indent=1)
print(len(days), 'dni')
