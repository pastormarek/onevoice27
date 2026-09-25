# -*- coding: utf-8 -*-
"""Nadpisy psalmow w przekladach angielskich z bolls.life siedza w wersecie 1 jako
zwykly tekst. Ten modul oddziela je i owija w <b>...</b> (tak jak nadpisy w UBG),
dzieki czemu czytnik pokazuje je inaczej, a pliki wersetow do studiow je pomijaja.

Uzycie samodzielne (raport do przejrzenia): python tools/psalm_titles.py BSB
"""
import io
import json
import os
import re
import sys

STRONG = re.compile(r'\b(Psalm|psalm|choirmaster|chief Musician|Maskil|Maschil|Miktam|Michtam|Shiggaion|'
                    r'[Ss]ong|[Pp]rayer|David|Asaph|Korah|Solomon|Moses|Heman|Ethan|Jeduthun|Neginoth|'
                    r'Sheminith|Gittith|Alamoth|Mahalath|Muth-labben|Muthlabben|Aijeleth|Shoshannim|'
                    r'Shushan|Jonath|Nehiloth|ascents|degrees|remembrance)\b')
CONT = re.compile(r'^(When |For the |For Jeduthun|For remembrance|For instruction|To the tune|To the chief|'
                  r'To bring|To be sung|According to|With stringed|A |An |Of |On |Upon |Set to|'
                  r'Concerning|After |Which |Al-)')
SENT = re.compile('(?:(?<=[.!?])|(?<=[.!?][”’"]))\\s+')


def split_title(v1):
    parts = SENT.split(v1.strip())
    if len(parts) < 2 or not STRONG.search(parts[0]):
        return None, v1
    title = [parts[0]]
    i = 1
    while i < len(parts) - 1 and CONT.match(parts[i]) and len(parts[i]) < 220:
        title.append(parts[i])
        i += 1
    return ' '.join(title), ' '.join(parts[i:])


def mark(chapters, skip=()):
    for n, c in enumerate(chapters, 1):
        if n in skip or not c or '<b>' in c[0]:
            continue
        t, rest = split_title(c[0])
        if t:
            c[0] = '<b>{0}</b> {1}'.format(t, rest)
    return chapters


if __name__ == '__main__':
    tr = sys.argv[1] if len(sys.argv) > 1 else 'BSB'
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    p = os.path.join(root, 'public', 'content', 'en', 'bible', tr, 'Ps.json')
    ch = json.load(io.open(p, encoding='utf-8'))['chapters']
    for i, c in enumerate(ch, 1):
        t, rest = split_title(re.sub(r'</?b>', '', c[0]))
        print(i, '| T:', t, '|| V:', rest[:50])
