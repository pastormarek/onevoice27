# -*- coding: utf-8 -*-
"""Wersje angielskie: teksty do modlitwy + pliki wersetow dla studiow, okazji, fiszek.

1. prayer-texts.json (en) powstaje z polskiego pliku w ../Apka_Marka: te same `osis`
   (numeracja KJV, zgodna z BSB/WEB/KJV), angielskie `ref` i opisy dzialow.
2. bibles/{BSB,WEB,KJV}.json – teksty wszystkich `osis` uzytych w en/studies,
   occasions.json, flashcards.json i prayer-texts.json, wyciete z pelnych przekladow
   w en/bible/{KOD}/ (bez sieci). Uklad jak dotad: wiele wersetow = "(n) tekst (n+1) ...".

Uzycie:  python tools/build_bibles_en.py
"""
import glob
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN = os.path.join(ROOT, 'public', 'content', 'en')
PL_PRAYER = os.path.join(ROOT, '..', 'Apka_Marka', 'public', 'content', 'pl', 'prayer-texts.json')
TAG = re.compile(r'<[^>]+>')
TITLE = re.compile(r'<b>.*?</b>\s*', re.S)   # nadpis psalmu nie jest czescia wersetu

NAMES = {
    'BSB': ('Berean Standard Bible', 'Public domain (dedicated to the public domain in 2023).'),
    'WEB': ('World English Bible', 'Public domain.'),
    'KJV': ('King James Version (1769)', 'Public domain (outside the United Kingdom).'),
}

GROUPS_EN = {
    'uwielbienie': ('Praise', 'Tell God who he is, not what you need.'),
    'skrucha': ('Confession', 'Stand before God in the truth about yourself and receive forgiveness.'),
    'prosby': ('Requests', 'Bring God your concerns and the people you carry in your heart.'),
    'wdziecznosc': ('Thanksgiving', 'Name what you have already received.'),
}


def load(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def save(path, data, compact=False):
    with io.open(path, 'w', encoding='utf-8') as f:
        if compact:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        else:
            json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')


def book_names():
    return {b['osis']: b['name'] for b in load(os.path.join(EN, 'bible', 'BSB', 'index.json'))['books']}


def en_ref(osis, names):
    book, rest = osis.split('.', 1)
    name = names[book]
    if book == 'Ps':
        name = 'Psalm'
    parts = rest.split('.')
    if len(parts) == 1:
        return '{0} {1}'.format(name, parts[0])
    return '{0} {1}:{2}'.format(name, parts[0], parts[1])


def build_prayer_texts(names):
    pl = load(PL_PRAYER)
    out = {
        'lang': 'en',
        'translation': 'BSB',
        'title': 'Praying with Scripture',
        'intro': ('Prayer in four steps: first tell God who he is, then stand before him in the '
                  'truth about yourself, bring your requests, and give thanks.'),
        'groups': [],
    }
    for g in pl['groups']:
        name, intro = GROUPS_EN[g['id']]
        out['groups'].append({
            'id': g['id'], 'name': name, 'icon': g['icon'], 'intro': intro,
            'verses': [{'osis': v['osis'], 'ref': en_ref(v['osis'], names)} for v in g['verses']],
        })
    save(os.path.join(EN, 'prayer-texts.json'), out)
    return sum(len(g['verses']) for g in out['groups'])


def collect():
    found = set()

    def walk(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k == 'osis':
                    for o in (v if isinstance(v, list) else [v]):
                        if isinstance(o, str):
                            found.add(o)
                else:
                    walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    for p in glob.glob(os.path.join(EN, 'studies', '*.json')):
        walk(load(p))
    for name in ('occasions.json', 'flashcards.json', 'prayer-texts.json'):
        p = os.path.join(EN, name)
        if os.path.exists(p):
            walk(load(p))
    return sorted(found)


def text_for(osis, tr, cache):
    book, rest = osis.split('.', 1)
    if book not in cache:
        cache[book] = load(os.path.join(EN, 'bible', tr, book + '.json'))['chapters']
    chapters = cache[book]
    parts = rest.split('.')
    ch = int(parts[0])
    verses = chapters[ch - 1]
    if len(parts) == 1:
        a, b = 1, len(verses)
    else:
        m = re.match(r'^(\d+)(?:-(\d+))?$', parts[1])
        a = int(m.group(1))
        b = int(m.group(2) or a)
    picked = [(n, TAG.sub('', TITLE.sub('', verses[n - 1])).strip()) for n in range(a, min(b, len(verses)) + 1)]
    picked = [(n, t) for n, t in picked if t]
    if not picked:
        return None
    if len(picked) == 1 and a == b:
        return picked[0][1]
    return ' '.join('({0}) {1}'.format(n, t) for n, t in picked)


def main():
    names = book_names()
    n = build_prayer_texts(names)
    print('prayer-texts.json: {0} odnosnikow'.format(n))
    refs = collect()
    for tr, (name, lic) in NAMES.items():
        cache, verses, missing = {}, {}, []
        for o in refs:
            try:
                t = text_for(o, tr, cache)
            except Exception:
                t = None
            if t:
                verses[o] = t
            else:
                missing.append(o)
        save(os.path.join(EN, 'bibles', tr + '.json'),
             {'translation': tr, 'name': name, 'lang': 'en', 'license': lic, 'verses': verses}, compact=True)
        print('{0}: {1} odnosnikow, brak: {2}'.format(tr, len(verses), ', '.join(missing) or '-'))


if __name__ == '__main__':
    main()
