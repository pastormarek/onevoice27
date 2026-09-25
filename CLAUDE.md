# CLAUDE.md – One Voice 27 (angielska wersja #JestNadzieja)

Angielskojęzyczne wydanie aplikacji #JestNadzieja (decyzja autora 2026-09-25).
Kod wyszedł z klonu `../Apka_Marka` (stan z 2026-09-25) i od tej chwili żyje osobno:
zmiany w polskiej aplikacji **nie przechodzą tu same** – trzeba je przenieść ręcznie.

- Nazwa: **One Voice 27**, grafika hasła: **#AllThingsNew** (`public/allthingsnew.png`).
- Jedyny język: `en`. Trasy po angielsku (`/en/bible`, `/en/40-days`, `/en/know-god`…).
- **Bez pieśni** (decyzja autora). „Materiały edukacyjne" nazywają się tu **BeHopeful**
  (`/en/behopeful`), „Grupy Nadziei" – **Hope Groups** (`/en/hope-groups`); oba moduły
  na stronie One Voice 27 i w menu (decyzja autora 2026-09-25).
- Repozytorium: **`pastormarek/onevoice27`**, publikacja: GitHub Actions
  (`.github/workflows/deploy-pages.yml`, każdy push na `main`) →
  **https://pastormarek.github.io/onevoice27/**. `VITE_BASE=/onevoice27/`.

## Komendy

```
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b + vite + PWA (jedyna bramka jakości)
npx vitest run     # testy
```

## Treść (`public/content/en/`)

| co | skąd |
|---|---|
| `bible/{BSB,WEB,KJV}/` – pełne przekłady | `python tools/build_bible_full.py BSB` (WEB, KJV) – bolls.life, cache w `tools/.cache/` |
| `bibles/{BSB,WEB,KJV}.json` – wersety do studiów, okazji, fiszek, tekstów modlitwy | `python tools/build_bibles_en.py` (offline, z pełnych przekładów) |
| `prayer-texts.json` | ten sam skrypt – `osis` z polskiego pliku w `../Apka_Marka`, angielskie `ref` |
| `studies/`, `index.json` – „Know God and the Bible" | gotowe tłumaczenie 35 studiów (sprzed tej sesji), nie tłumaczone na nowo |
| `pray40/NN.json` – „40 Days of Prayer" | **napisane na nowo po angielsku** na podstawie finalnych polskich czytanek (po korekcie) |
| `pray40/index.json` | `python tools/build_pray40_index_en.py` |
| `edu/NN.json` – BeHopeful | napisane na nowo po angielsku z polskich `edu/` (dwie wersje, cytat z BSB) |
| `groups/<ID>.json` – Hope Groups | 76 spotkań napisanych na nowo z polskich `groups/`; **klucze i wartości `typ` zostają po polsku** (czyta je kod), po angielsku tylko teksty |
| `groups/index.json`, `edu/index.json` | `python tools/build_indexes_en.py` (opisy serii są w skrypcie) |
| tekst Pisma w spotkaniach | `python tools/fill_scripture_groups.py [ID]` – wstawia wersety z BSB/WEB/KJV według `odnosnik`; nigdy nie wpisujemy ich ręcznie |
| `ui.json` | wszystkie napisy interfejsu |

Domyślny przekład: **BSB** (Berean Standard Bible, domena publiczna od 2023, „the LORD").
WEB używa imienia „Yahweh", dlatego nie jest domyślny. KJV z bolls.life ma numery Stronga –
`build_bible_full.py` je wycina. Nadpisy psalmów oddziela `tools/psalm_titles.py`
(owija w `<b>`), a pliki wersetów do studiów je pomijają.

## Twarde reguły

- **Pismo tylko z plików przekładów**, nigdy z pamięci. Cytaty w czytankach 40 dni są
  z BSB, a gdy argument opiera się na innym brzmieniu – z WEB/KJV z oznaczeniem „(WEB)"/„(KJV)".
  Kontrola: `python tools/check_quotes_pray40.py` (zgłoszone pozycje to w większości
  mowa ludzi i tytuły serii – przejrzeć ręcznie). Podgląd wersetu: `python tools/verse.py "John 3:16"`.
- Czytanki 40 dni **nie mają dat** (akcja angielska ma inny kalendarz). Gdy daty będą
  znane, dopisz `date` i `dateLabel` w plikach dni – kod je obsłuży.
- Pytania do czytanek zachowują osobę z oryginału („I" tam, gdzie polskie „ja", „you" tam,
  gdzie polskie „ty").
- „Sabbath", nigdy „Saturday" w znaczeniu religijnym. Bez pauz (em dash) poza cytatami z BSB.
- Każdy napis UI z `ui.json`; w kodzie `t('klucz', 'English fallback')`.
- Prywatność: bez analityki (`trackPageView` jest pusty), notatki i dziennik w `localStorage`.
- Teologia ADS jak w `../Materiały/_BRIEF_dla_autorow.md`.

## Znane sprawy otwarte

- Komentarze w angielskich studiach cytują Pismo luźno (tłumaczone z polskiego): na ~650
  cytatów w cudzysłowie ok. 220 jest dosłownie w BSB. Do przejrzenia, jeśli studia mają iść szeroko.
- Hope Groups: kontrola struktury wobec polskiego oryginału – `python tools/check_groups_en.py`.
  Polskie telefony zaufania zastąpione ogólnym „a crisis line in your country" / „your local
  emergency number" – bez numerów, bo aplikacja jest międzynarodowa.
- Kontakt: formularz otwiera pocztę na `marek.micyk@adwent.pl` (`ui.json` → `contact.address`).
