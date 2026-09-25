# -*- coding: utf-8 -*-
"""Buduje PELNY przeklad Biblii dla czytnika (`/pl/biblia`), ksiega po ksiedze.

Zrodlo: bolls.life – endpoint `get-text/{kod}/{nr_ksiegi}/{rozdzial}/` oddaje caly
rozdzial jednym zapytaniem, bez klucza i bez rate-limitu (tak samo jak
`fetch_bible_bolls.py`, ktory bierze stamtad pojedyncze wersety do studiow).

Wynik – `public/content/{lang}/bible/{TRANSLATION}/`:
    index.json    spis ksiag: osis, nazwa PL, skrot, testament, liczba wersetow
                  w kazdym rozdziale (selektor ksiega/rozdzial/werset dziala
                  bez pobierania tekstu)
    {osis}.json   tekst jednej ksiegi: {"osis": "...", "chapters": [[w1, w2, ...], ...]}

Podzial na ksiegi jest kompromisem: czytelnik pobiera 3-330 KB zamiast calych 3,5 MB,
a wyszukiwarka ma do sciagniecia 66 plikow zamiast 1189.

Uzycie:
  python tools/build_bible_full.py                     # UBG (pl), z cache
  python tools/build_bible_full.py --check             # sam raport, bez zapisu
  python tools/build_bible_full.py --only Ps,John      # wybrane ksiegi
  python tools/build_bible_full.py --fresh             # zignoruj cache pobrania

UWAGA – numeracja. bolls oddaje UBG18 w numeracji KJV (Ps 3 ma 8 wersetow, nadpis
psalmu siedzi w wersecie 1 jako <b>...</b>), czyli w tej samej, w ktorej sa `osis`
w studiach. Nie mieszaj tego z Biblia Ekumeniczna (`build_bible_be.py`), ktora idzie
za tekstem hebrajskim i przesuwa numery psalmow.
"""
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'public', 'content')
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache')

# --- przeklady, ktore ten skrypt umie zbudowac -------------------------------
# klucz = katalog w aplikacji; 'bolls' = kod modulu w bolls.life
TRANSLATIONS = {
    'BSB': {
        'bolls': 'BSB',
        'lang': 'en',
        'name': 'Berean Standard Bible',
        'license': 'Public domain (dedicated to the public domain in 2023).',
        'source': 'bolls.life (BSB module)',
    },
    'WEB': {
        'bolls': 'WEB',
        'lang': 'en',
        'name': 'World English Bible',
        'license': 'Public domain.',
        'source': 'bolls.life (WEB module)',
    },
    'KJV': {
        'bolls': 'KJV',
        'lang': 'en',
        'name': 'King James Version (1769)',
        'license': 'Public domain (outside the United Kingdom).',
        'source': 'bolls.life (KJV module)',
    },
    'UBG': {
        'bolls': 'UBG18',
        'lang': 'pl',
        'name': 'Uwspółcześniona Biblia Gdańska (2018)',
        'license': ('Uwspółcześniona Biblia Gdańska © Fundacja Wrota Nadziei. '
                    'Rozpowszechnianie bezpłatne dozwolone, tekstu nie wolno zmieniać; '
                    'użytek komercyjny wymaga pisemnej zgody.'),
        'source': 'bolls.life (moduł UBG18)',
    },
    'BG': {
        'bolls': 'BG',
        'lang': 'pl',
        'name': 'Biblia Gdańska (1881)',
        'license': 'Domena publiczna.',
        'source': 'bolls.life (moduł BG)',
    },
}

# Kolejnosc kanonu = numeracja ksiag w bolls (1-66).
BOOKS = [
    ('Gen', 'Księga Rodzaju', 'Rdz'), ('Exod', 'Księga Wyjścia', 'Wj'),
    ('Lev', 'Księga Kapłańska', 'Kpł'), ('Num', 'Księga Liczb', 'Lb'),
    ('Deut', 'Księga Powtórzonego Prawa', 'Pwt'), ('Josh', 'Księga Jozuego', 'Joz'),
    ('Judg', 'Księga Sędziów', 'Sdz'), ('Ruth', 'Księga Rut', 'Rt'),
    ('1Sam', '1 Księga Samuela', '1 Sm'), ('2Sam', '2 Księga Samuela', '2 Sm'),
    ('1Kgs', '1 Księga Królewska', '1 Krl'), ('2Kgs', '2 Księga Królewska', '2 Krl'),
    ('1Chr', '1 Księga Kronik', '1 Krn'), ('2Chr', '2 Księga Kronik', '2 Krn'),
    ('Ezra', 'Księga Ezdrasza', 'Ezd'), ('Neh', 'Księga Nehemiasza', 'Ne'),
    ('Esth', 'Księga Estery', 'Est'), ('Job', 'Księga Hioba', 'Hi'),
    ('Ps', 'Księga Psalmów', 'Ps'), ('Prov', 'Księga Przysłów', 'Prz'),
    ('Eccl', 'Księga Kaznodziei', 'Koh'), ('Song', 'Pieśń nad Pieśniami', 'Pnp'),
    ('Isa', 'Księga Izajasza', 'Iz'), ('Jer', 'Księga Jeremiasza', 'Jr'),
    ('Lam', 'Treny', 'Lm'), ('Ezek', 'Księga Ezechiela', 'Ez'),
    ('Dan', 'Księga Daniela', 'Dn'), ('Hos', 'Księga Ozeasza', 'Oz'),
    ('Joel', 'Księga Joela', 'Jl'), ('Amos', 'Księga Amosa', 'Am'),
    ('Obad', 'Księga Abdiasza', 'Ab'), ('Jonah', 'Księga Jonasza', 'Jon'),
    ('Mic', 'Księga Micheasza', 'Mi'), ('Nah', 'Księga Nahuma', 'Na'),
    ('Hab', 'Księga Habakuka', 'Ha'), ('Zeph', 'Księga Sofoniasza', 'So'),
    ('Hag', 'Księga Aggeusza', 'Ag'), ('Zech', 'Księga Zachariasza', 'Za'),
    ('Mal', 'Księga Malachiasza', 'Ml'), ('Matt', 'Ewangelia Mateusza', 'Mt'),
    ('Mark', 'Ewangelia Marka', 'Mk'), ('Luke', 'Ewangelia Łukasza', 'Łk'),
    ('John', 'Ewangelia Jana', 'J'), ('Acts', 'Dzieje Apostolskie', 'Dz'),
    ('Rom', 'List do Rzymian', 'Rz'), ('1Cor', '1 List do Koryntian', '1 Kor'),
    ('2Cor', '2 List do Koryntian', '2 Kor'), ('Gal', 'List do Galatów', 'Ga'),
    ('Eph', 'List do Efezjan', 'Ef'), ('Phil', 'List do Filipian', 'Flp'),
    ('Col', 'List do Kolosan', 'Kol'), ('1Thess', '1 List do Tesaloniczan', '1 Tes'),
    ('2Thess', '2 List do Tesaloniczan', '2 Tes'), ('1Tim', '1 List do Tymoteusza', '1 Tm'),
    ('2Tim', '2 List do Tymoteusza', '2 Tm'), ('Titus', 'List do Tytusa', 'Tt'),
    ('Phlm', 'List do Filemona', 'Flm'), ('Heb', 'List do Hebrajczyków', 'Hbr'),
    ('Jas', 'List Jakuba', 'Jk'), ('1Pet', '1 List Piotra', '1 P'),
    ('2Pet', '2 List Piotra', '2 P'), ('1John', '1 List Jana', '1 J'),
    ('2John', '2 List Jana', '2 J'), ('3John', '3 List Jana', '3 J'),
    ('Jude', 'List Judy', 'Jud'), ('Rev', 'Objawienie Jana', 'Ap'),
]
# nazwy angielskie, w tej samej kolejnosci co BOOKS
EN_BOOKS = [
    ('Genesis','Gen'),('Exodus','Exod'),('Leviticus','Lev'),('Numbers','Num'),('Deuteronomy','Deut'),
    ('Joshua','Josh'),('Judges','Judg'),('Ruth','Ruth'),('1 Samuel','1 Sam'),('2 Samuel','2 Sam'),
    ('1 Kings','1 Kgs'),('2 Kings','2 Kgs'),('1 Chronicles','1 Chr'),('2 Chronicles','2 Chr'),
    ('Ezra','Ezra'),('Nehemiah','Neh'),('Esther','Esth'),('Job','Job'),('Psalms','Ps'),
    ('Proverbs','Prov'),('Ecclesiastes','Eccl'),('Song of Songs','Song'),('Isaiah','Isa'),
    ('Jeremiah','Jer'),('Lamentations','Lam'),('Ezekiel','Ezek'),('Daniel','Dan'),('Hosea','Hos'),
    ('Joel','Joel'),('Amos','Amos'),('Obadiah','Obad'),('Jonah','Jonah'),('Micah','Mic'),
    ('Nahum','Nah'),('Habakkuk','Hab'),('Zephaniah','Zeph'),('Haggai','Hag'),('Zechariah','Zech'),
    ('Malachi','Mal'),('Matthew','Matt'),('Mark','Mark'),('Luke','Luke'),('John','John'),
    ('Acts','Acts'),('Romans','Rom'),('1 Corinthians','1 Cor'),('2 Corinthians','2 Cor'),
    ('Galatians','Gal'),('Ephesians','Eph'),('Philippians','Phil'),('Colossians','Col'),
    ('1 Thessalonians','1 Thess'),('2 Thessalonians','2 Thess'),('1 Timothy','1 Tim'),
    ('2 Timothy','2 Tim'),('Titus','Titus'),('Philemon','Phlm'),('Hebrews','Heb'),('James','Jas'),
    ('1 Peter','1 Pet'),('2 Peter','2 Pet'),('1 John','1 John'),('2 John','2 John'),
    ('3 John','3 John'),('Jude','Jude'),('Revelation','Rev'),
]
OT_COUNT = 39   # pierwsze 39 pozycji to Stary Testament

# kursywa = slowa dopowiedziane przez tlumaczy, pogrubienie = nadpis psalmu
KEEP = re.compile(r'</?(?![ib]>)[a-zA-Z][a-zA-Z0-9]*[^>]*>')
TAG = re.compile(r'</?([a-zA-Z][a-zA-Z0-9]*)[^>]*>')
WS = re.compile('[ \t\u00a0]+')


def get(url, tries=5):
    delay = 1.5
    for attempt in range(1, tries + 1):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 bibleapp/0.1'})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception:
            if attempt == tries:
                raise
            time.sleep(delay)
            delay *= 2
    return None


def clean(text, stats):
    """Zostawia tylko <i> i <b>; reszte znacznikow odnotowuje w raporcie i usuwa."""
    text = text or ''
    # numery Stronga (KJV w bolls) i przypisy w <sup> wylatuja razem z trescia
    text = re.sub(r'<S>[^<]*</S>', '', text, flags=re.I)
    text = re.sub(r'<sup>.*?</sup>', '', text, flags=re.I | re.S)
    text = text.replace('<I>', '<i>').replace('</I>', '</i>')
    text = text.replace('<B>', '<b>').replace('</B>', '</b>')
    for m in TAG.finditer(text):
        name = m.group(1).lower()
        if name not in ('i', 'b'):
            stats['tagi'][name] = stats['tagi'].get(name, 0) + 1
    text = KEEP.sub('', text)
    return WS.sub(' ', text).strip()


def chapter(code, booknr, ch, fresh=False):
    """Jeden rozdzial – z cache na dysku, zeby powtorzenie skryptu nie bilo w serwer."""
    path = os.path.join(CACHE, code, str(booknr), str(ch) + '.json')
    if not fresh and os.path.exists(path):
        try:
            with io.open(path, encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    data = get('https://bolls.life/get-text/{0}/{1}/{2}/'.format(code, booknr, ch))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    return data


def build(translation, only=None, check=False, fresh=False):
    cfg = TRANSLATIONS[translation]
    code, lang = cfg['bolls'], cfg['lang']
    out_dir = os.path.join(CONTENT, lang, 'bible', translation)

    meta = get('https://bolls.life/get-books/{0}/'.format(code))
    counts = dict((b['bookid'], b['chapters']) for b in meta)
    if code == 'WEB':
        # bolls podaje dla WEB zle liczby rozdzialow (1Pet: 3, 2Pet: 6) - bierzemy je z KJV
        counts = dict((b['bookid'], b['chapters']) for b in get('https://bolls.life/get-books/KJV/'))
    if len(counts) != 66:
        print('UWAGA: modul {0} ma {1} ksiag zamiast 66 – sprawdz kanon.'.format(code, len(counts)))

    books = BOOKS if lang != 'en' else [(o, n, a) for (o, _, _), (n, a) in zip(BOOKS, EN_BOOKS)]
    picked = [(i + 1, osis, name, abbr) for i, (osis, name, abbr) in enumerate(books)
              if not only or osis in only]
    stats = {'wersety': 0, 'luki': [], 'puste': [], 'tagi': {}}
    index_books = []

    if not check:
        os.makedirs(out_dir, exist_ok=True)

    for booknr, osis, name, abbr in picked:
        n_ch = counts.get(booknr)
        if not n_ch:
            print('  {0}: brak w module – pomijam'.format(osis))
            continue
        with ThreadPoolExecutor(max_workers=6) as pool:
            raw = list(pool.map(lambda c: chapter(code, booknr, c, fresh), range(1, n_ch + 1)))

        chapters, lengths = [], []
        for ci, verses in enumerate(raw, start=1):
            byno = {}
            for v in verses or []:
                try:
                    byno[int(v['verse'])] = clean(v.get('text', ''), stats)
                except (KeyError, TypeError, ValueError):
                    continue
            top = max(byno) if byno else 0
            # tablica od wersetu 1; brakujacy numer zostaje pustym stringiem i idzie do raportu
            row = []
            for n in range(1, top + 1):
                t = byno.get(n, '')
                if not t:
                    stats['luki'].append('{0} {1},{2}'.format(osis, ci, n))
                row.append(t)
            if not row and ci > 1 and all(not r for r in raw[ci - 1:]):
                break   # bolls zawyza liczbe rozdzialow (WEB: 2Pet 4-6)
            if not row:
                stats['puste'].append('{0} {1}'.format(osis, ci))
            chapters.append(row)
            lengths.append(len(row))
            stats['wersety'] += sum(1 for t in row if t)

        if lang == 'en' and osis == 'Ps':
            # nadpisy psalmow -> <b>...</b> (bolls wkleja je w werset 1 jako zwykly tekst)
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            import psalm_titles
            psalm_titles.mark(chapters)

        index_books.append({
            'osis': osis, 'name': name, 'abbr': abbr,
            'testament': 'ot' if booknr <= OT_COUNT else 'nt',
            'chapters': lengths,
        })
        if not check:
            with io.open(os.path.join(out_dir, osis + '.json'), 'w', encoding='utf-8') as f:
                json.dump({'osis': osis, 'chapters': chapters}, f, ensure_ascii=False,
                          separators=(',', ':'))
        print('  {0:7s} {1:3d} rozdz. {2:5d} wers.'.format(osis, len(chapters), sum(lengths)))
        sys.stdout.flush()

    if not check and not only:
        index = {
            'translation': translation, 'name': cfg['name'], 'lang': lang,
            'license': cfg['license'], 'source': cfg['source'],
            'books': index_books,
        }
        with io.open(os.path.join(out_dir, 'index.json'), 'w', encoding='utf-8') as f:
            json.dump(index, f, ensure_ascii=False, separators=(',', ':'))

    print('\n{0}: {1} ksiag, {2} wersetow'.format(translation, len(index_books), stats['wersety']))
    if stats['tagi']:
        print('  usuniete znaczniki: ' + ', '.join(
            '{0}×{1}'.format(k, v) for k, v in sorted(stats['tagi'].items())))
    if stats['luki']:
        print('  brakujace wersety ({0}): {1}{2}'.format(
            len(stats['luki']), ', '.join(stats['luki'][:20]), ' …' if len(stats['luki']) > 20 else ''))
    if stats['puste']:
        print('  puste rozdzialy ({0}): {1}'.format(len(stats['puste']), ', '.join(stats['puste'][:20])))
    if not check:
        total = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir))
        print('  zapisano do {0} – {1:.2f} MB'.format(out_dir, total / 1024.0 / 1024.0))


def main(argv):
    flags = [a for a in argv if a.startswith('--')]
    rest = [a for a in argv if not a.startswith('--')]
    only = None
    for f in flags:
        if f.startswith('--only='):
            only = set(f.split('=', 1)[1].split(','))
    if only is None and '--only' in flags:
        i = argv.index('--only')
        if i + 1 < len(argv):
            only = set(argv[i + 1].split(','))
            rest = [a for a in rest if a != argv[i + 1]]
    translation = rest[0] if rest else 'UBG'
    if translation not in TRANSLATIONS:
        print('Nieznany przeklad: {0}. Dostepne: {1}'.format(translation, ', '.join(TRANSLATIONS)))
        return 2
    build(translation, only=only, check='--check' in flags, fresh='--fresh' in flags)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
