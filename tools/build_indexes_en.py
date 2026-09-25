# -*- coding: utf-8 -*-
"""Spisy dla Hope Groups (en/groups/index.json) i BeHopeful (en/edu/index.json).

Uklad kopiowany z polskich spisow w ../Apka_Marka (klucze po polsku, bo tak czyta je kod),
a teksty biora sie z angielskich plikow spotkan i materialow. Opisy serii sa tutaj.
Uzycie: python tools/build_indexes_en.py
"""
import glob
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en')
PL = os.path.join(ROOT, '..', 'Apka_Marka', 'public', 'content', 'pl')

SERIES = {
    'E': ('Emotions', 'Fifteen meetings about what goes on inside us and what the Bible does with it.'),
    'R': ('Relationships', 'Twelve meetings about what goes on between us: conflict, forgiveness, marriage, friendship, boundaries.'),
    'P': ('Questions People Ask', 'Twelve questions seekers bring with them: suffering, death, trusting the Bible, the church.'),
    'K': ('Crises and Turning Points', 'Eight meetings for people whose world has fallen apart: grief, illness, divorce, starting over.'),
    'S': ('The Sabbath as a Gift', 'Five meetings from exhaustion to the rest God built into the week.'),
    'PJ': ('Parables of Jesus', 'Each parable is a complete meeting. You can start anywhere.'),
    'D': ('The Book of Daniel', 'Twelve meetings, chapter by chapter: faithfulness in exile and the God who guides history.'),
}


def load(p):
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def save(p, d):
    with io.open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=1)
        f.write('\n')


def teksty_str(t):
    if isinstance(t, dict):
        return '; '.join(v for k, v in sorted(t.items()) if v)
    return t or ''


def groups():
    pl = load(os.path.join(PL, 'groups', 'index.json'))
    out = {'lang': 'en', 'title': 'Hope Groups', 'series': 'One Voice 27', 'przekladBazowy': 'BSB',
           'note': 'Scripture quotations are from the Berean Standard Bible (public domain) unless otherwise noted.',
           'serie': []}
    missing = []
    for s in pl['serie']:
        title, desc = SERIES[s['prefiks']]
        items = []
        for it in s['items']:
            p = os.path.join(EN, 'groups', it['id'] + '.json')
            if not os.path.exists(p):
                missing.append(it['id'])
                continue
            d = load(p)
            items.append({'id': it['id'], 'tytul': d['tytul'], 'opis': d['opis'],
                          'teksty': teksty_str(d.get('teksty')), 'zdanie': d.get('zdanie', ''),
                          'dlugosc': it['dlugosc'], 'liczbaPytan': it['liczbaPytan'], 'tagi': d.get('tagi', [])})
        entry = dict(s)
        entry.update({'tytul': title, 'opis': desc, 'items': items})
        out['serie'].append(entry)
    save(os.path.join(EN, 'groups', 'index.json'), out)
    return sum(len(s['items']) for s in out['serie']), missing


def edu():
    items = []
    for p in sorted(glob.glob(os.path.join(EN, 'edu', '[0-9][0-9].json'))):
        d = load(p)
        items.append({'nr': d['nr'], 'title': d['title'], 'ref': d['ref']})
    save(os.path.join(EN, 'edu', 'index.json'),
         {'lang': 'en', 'title': 'BeHopeful', 'series': 'One Voice 27', 'items': items})
    return len(items)


if __name__ == '__main__':
    n, missing = groups()
    print('groups: {0} spotkan{1}'.format(n, ', brak: ' + ' '.join(missing) if missing else ''))
    print('edu: {0} materialow'.format(edu()))
