import type { BibleBookMeta, BibleBookText, BibleIndex, BibleTranslations } from '../types'
import { getInstalledBook, getInstalledIndex, listInstalled } from './bibleStore'

// Dostep do tekstu Pisma dla czytnika `/en/bible`.
// Dwa zrodla, ten sam ksztalt danych:
//   - przeklady lezace na serwerze  -> `content/{lang}/bible/{KOD}/{Osis}.json`
//   - moduly doinstalowane lokalnie -> IndexedDB (lib/bibleStore.ts)
// Wszystko trzymane po ksiegach: czytelnik pobiera 3-225 KB zamiast calych 3,9 MB.

const BASE = import.meta.env.BASE_URL
const memory = new Map<string, unknown>()

async function getJSON<T>(path: string): Promise<T> {
  const url = `${BASE}content/${path}`.replace(/\/{2,}/g, '/')
  const hit = memory.get(url)
  if (hit) return hit as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load: ${url} (${res.status})`)
  const data = (await res.json()) as T
  memory.set(url, data)
  return data
}

// Zmieniamy rewizję, gdy aktualizujemy listę wbudowanych przekładów. Dzięki temu
// aplikacja PWA nie odczyta poprzedniej listy z cache'u po wdrożeniu.
const TRANSLATIONS_REVISION = '2026-08-31-2'

export const loadTranslations = (lang: string) =>
  getJSON<BibleTranslations>(`${lang}/bible/translations.json?v=${TRANSLATIONS_REVISION}`)

/** Spis ksiag przekladu - najpierw szukamy w modulach czytelnika, potem na serwerze. */
export async function loadBibleIndex(lang: string, code: string): Promise<BibleIndex> {
  const key = `idx:${lang}:${code}`
  const hit = memory.get(key)
  if (hit) return hit as BibleIndex
  const installed = await getInstalledIndex(code)
  const index = installed || (await getJSON<BibleIndex>(`${lang}/bible/${code}/index.json`))
  memory.set(key, index)
  return index
}

export async function loadBibleBook(lang: string, code: string, osis: string): Promise<string[][]> {
  const key = `book:${lang}:${code}:${osis}`
  const hit = memory.get(key)
  if (hit) return hit as string[][]
  const installed = await getInstalledBook(code, osis)
  const chapters = installed || (await getJSON<BibleBookText>(`${lang}/bible/${code}/${osis}.json`)).chapters
  memory.set(key, chapters)
  return chapters
}

/** Wszystkie przeklady do wyboru: te z serwera plus doinstalowane. */
export async function listTranslations(lang: string) {
  const [server, installed] = await Promise.all([
    loadTranslations(lang).catch(() => null),
    listInstalled(),
  ])
  const out = (server?.translations || []).map((t) => ({ ...t, installed: false }))
  for (const m of installed) {
    if (m.index.lang && m.index.lang !== lang) continue
    const entry = {
      code: m.index.translation,
      name: m.index.name,
      license: m.index.license,
      source: m.index.source,
      sizeKB: m.sizeKB,
      installed: true,
    }
    // modul o tym samym kodzie co przeklad z serwera przeslania go przy czytaniu
    // (loadBibleIndex pyta najpierw IndexedDB) - lista ma pokazywac to, co czytelnik
    // naprawde czyta, a nie wpis z serwera
    const clash = out.findIndex((t) => t.code === entry.code)
    if (clash >= 0) out[clash] = entry
    else out.push(entry)
  }
  return { default: server?.default || out[0]?.code || 'BSB', translations: out }
}

/** Pobiera caly przeklad do cache przegladarki (service worker zachowa go offline). */
export async function downloadTranslation(
  lang: string,
  code: string,
  onProgress?: (done: number, total: number) => void
) {
  const index = await loadBibleIndex(lang, code)
  let done = 0
  const total = index.books.length
  for (const b of index.books) {
    await loadBibleBook(lang, code, b.osis).catch(() => undefined)
    done += 1
    onProgress?.(done, total)
  }
  return total
}

// --- odnosniki ---------------------------------------------------------------

/** Porownanie bez ogonkow i bez kropek: „1 kor", „1Kor", „I Kor" maja sie zejsc. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[.\s'’-]/g, '')
}

// Skroty spoza indeksu, ktore czytelnik moze wpisac z nawyku (SBL, NIV, Logos i inne).
const ALIASES: Record<string, string[]> = {
  Gen: ['gn', 'ge', 'gen', 'genesis'],
  Exod: ['ex', 'exo', 'exod', 'exodus'],
  Lev: ['lv', 'le', 'lev', 'leviticus'],
  Num: ['nm', 'nu', 'num', 'numbers'],
  Deut: ['dt', 'de', 'deut', 'deuteronomy'],
  Josh: ['jos', 'jsh', 'josh', 'joshua'],
  Judg: ['jdg', 'jg', 'jdgs', 'judg', 'judges'],
  Ruth: ['rt', 'ru', 'rth', 'ruth'],
  '1Sam': ['1sa', '1sm', '1sam', '1samuel'],
  '2Sam': ['2sa', '2sm', '2sam', '2samuel'],
  '1Kgs': ['1ki', '1kg', '1kgs', '1kin', '1kings'],
  '2Kgs': ['2ki', '2kg', '2kgs', '2kin', '2kings'],
  '1Chr': ['1ch', '1chr', '1chron', '1chronicles'],
  '2Chr': ['2ch', '2chr', '2chron', '2chronicles'],
  Ezra: ['ezr', 'ezra'],
  Neh: ['ne', 'neh', 'nehemiah'],
  Esth: ['es', 'est', 'esth', 'esther'],
  Job: ['jb', 'job'],
  Ps: ['ps', 'psa', 'pss', 'psm', 'psalm', 'psalms'],
  Prov: ['pr', 'pro', 'prv', 'prov', 'proverbs'],
  Eccl: ['ec', 'ecc', 'eccl', 'eccles', 'ecclesiastes', 'qoh', 'qoheleth'],
  Song: ['so', 'sg', 'sos', 'song', 'songofsongs', 'songofsolomon', 'canticles', 'cant'],
  Isa: ['is', 'isa', 'isaiah'],
  Jer: ['je', 'jr', 'jer', 'jeremiah'],
  Lam: ['la', 'lam', 'lamentations'],
  Ezek: ['eze', 'ezk', 'ezek', 'ezekiel'],
  Dan: ['da', 'dn', 'dan', 'daniel'],
  Hos: ['ho', 'hos', 'hosea'],
  Joel: ['jl', 'joe', 'joel'],
  Amos: ['am', 'amo', 'amos'],
  Obad: ['ob', 'oba', 'obad', 'obadiah'],
  Jonah: ['jon', 'jnh', 'jonah'],
  Mic: ['mi', 'mc', 'mic', 'micah'],
  Nah: ['na', 'nah', 'nahum'],
  Hab: ['hb', 'hab', 'habakkuk'],
  Zeph: ['zp', 'zep', 'zeph', 'zephaniah'],
  Hag: ['hg', 'hag', 'haggai'],
  Zech: ['zc', 'zec', 'zech', 'zechariah'],
  Mal: ['ml', 'mal', 'malachi'],
  Matt: ['mt', 'mat', 'matt', 'matthew'],
  Mark: ['mk', 'mr', 'mrk', 'mark'],
  Luke: ['lk', 'luk', 'luke'],
  John: ['j', 'jn', 'jhn', 'john'],
  Acts: ['ac', 'act', 'acts'],
  Rom: ['ro', 'rm', 'rom', 'romans'],
  '1Cor': ['1co', '1cor', '1corinthians'],
  '2Cor': ['2co', '2cor', '2corinthians'],
  Gal: ['ga', 'gal', 'galatians'],
  Eph: ['ep', 'eph', 'ephes', 'ephesians'],
  Phil: ['php', 'pp', 'phil', 'philippians'],
  Col: ['col', 'colossians'],
  '1Thess': ['1th', '1thes', '1thess', '1thessalonians'],
  '2Thess': ['2th', '2thes', '2thess', '2thessalonians'],
  '1Tim': ['1ti', '1tm', '1tim', '1timothy'],
  '2Tim': ['2ti', '2tm', '2tim', '2timothy'],
  Titus: ['ti', 'tit', 'titus'],
  Phlm: ['phm', 'phlm', 'philem', 'philemon'],
  Heb: ['he', 'heb', 'hebrews'],
  Jas: ['jas', 'jm', 'jam', 'james'],
  '1Pet': ['1pe', '1pt', '1pet', '1peter'],
  '2Pet': ['2pe', '2pt', '2pet', '2peter'],
  '1John': ['1jn', '1jo', '1jhn', '1john'],
  '2John': ['2jn', '2jo', '2jhn', '2john'],
  '3John': ['3jn', '3jo', '3jhn', '3john'],
  Jude: ['jud', 'jd', 'jude'],
  Rev: ['re', 'rv', 'rev', 'revelation', 'revelations', 'apocalypse'],
}

/** „First Corinthians", „2nd Kings", „II Kings", „III John" -> cyfra na poczatku. */
function ordinal(name: string): string {
  return name
    .trim()
    .replace(/^(first|1st|i)\s+/i, '1 ')
    .replace(/^(second|2nd|ii)\s+/i, '2 ')
    .replace(/^(third|3rd|iii)\s+/i, '3 ')
    .replace(/^(iii|ii)(?=[a-z])/i, (m) => String(m.length))
}

/**
 * Dopasowuje nazwe ksiegi (skrot, pelna nazwa, forma z nawyku) do spisu ksiag.
 * Uzywa tego i parser odnosnikow, i wczytywanie modulow `.yes`, gdzie nazwy ksiag
 * sa natywne dla przekladu („RDZ", „JAN").
 */
export function findBook(name: string, books: BibleBookMeta[]): BibleBookMeta | null {
  const wanted = fold(ordinal(name))
  if (!wanted) return null
  const score = (b: BibleBookMeta): number => {
    const names = [fold(b.abbr), fold(b.name), ...(ALIASES[b.osis] || []).map(fold)]
    // nazwa ksiegi bez „The Book of"/„The Gospel of" – czytelnik ich nie wpisuje
    names.push(fold(b.name.replace(/^(the\s+)?(book|gospel|letter|epistle)\s+(of|to)\s+(the\s+)?/i, '')))
    if (names.includes(wanted)) return 3
    if (names.some((n) => n.startsWith(wanted) && wanted.length >= 2)) return 2
    if (names.some((n) => n.includes(wanted) && wanted.length >= 3)) return 1
    return 0
  }
  let best: BibleBookMeta | null = null
  let bestScore = 0
  for (const b of books) {
    const s = score(b)
    if (s > bestScore) {
      best = b
      bestScore = s
    }
  }
  return bestScore > 0 ? best : null
}

export interface ParsedRef {
  book: BibleBookMeta
  chapter: number
  verse?: number
  /** koniec zakresu, gdy podany („John 3:16-18") */
  verseTo?: number
}

/**
 * Rozbiera to, co czytelnik wpisal w pole odnosnika: „John 3:16", „Jn 3:16-18",
 * „1 Cor 13", „Ps 23", „Genesis 1,1". Zwraca null, gdy ksiegi nie da sie rozpoznac.
 */
export function parseRef(input: string, books: BibleBookMeta[]): ParsedRef | null {
  const raw = input.trim()
  if (!raw) return null
  // ksiega = wszystko do pierwszej liczby, ktora nie jest czescia nazwy („1 Kor")
  const m = raw.match(/^\s*((?:[1-3IV]+\s*)?[^\d]+?)\s*(\d+)?\s*(?:[,:.\s]\s*(\d+))?\s*(?:-\s*(\d+))?\s*$/u)
  if (!m) return null
  const [, namePart, chapterPart, versePart, verseToPart] = m

  const best = findBook(namePart, books)
  if (!best) return null

  const chapter = Math.min(Math.max(1, Number(chapterPart || 1)), best.chapters.length)
  const verseCount = best.chapters[chapter - 1] || 0
  const verse = versePart ? Math.min(Number(versePart), verseCount) : undefined
  const verseTo = verse && verseToPart ? Math.min(Number(verseToPart), verseCount) : undefined
  return { book: best, chapter, verse, verseTo }
}

/** Odnosnik do pokazania: „John 3:16", „John 3:16-18", „Ps 23". */
export function formatRef(book: BibleBookMeta, chapter: number, verse?: number, verseTo?: number): string {
  const head = `${book.abbr} ${chapter}`
  if (!verse) return head
  return verseTo && verseTo > verse ? `${head}:${verse}-${verseTo}` : `${head}:${verse}`
}

/** Klucz osis - ten sam, ktorym posluguja sie studia. */
export function osisKey(osis: string, chapter: number, verse: number): string {
  return `${osis}.${chapter}.${verse}`
}

// --- wyszukiwanie ------------------------------------------------------------

export interface SearchHit {
  osis: string
  bookName: string
  abbr: string
  chapter: number
  verse: number
  text: string
}
export type SearchScope = 'all' | 'ot' | 'nt' | 'book'

/**
 * Przeszukuje przeklad ksiega po ksiedze, oddajac trafienia partiami – czytelnik
 * widzi pierwsze wyniki, zanim sciagnie sie cala Biblia. `stop()` przerywa.
 */
export async function searchBible(
  lang: string,
  code: string,
  query: string,
  opts: {
    books: BibleBookMeta[]
    scope?: SearchScope
    bookOsis?: string
    limit?: number
    onBatch: (hits: SearchHit[], done: number, total: number) => void
    shouldStop?: () => boolean
  }
): Promise<number> {
  const needle = fold(query)
  if (needle.length < 3) return 0
  const scope = opts.scope || 'all'
  const pool = opts.books.filter((b) =>
    scope === 'all' ? true : scope === 'book' ? b.osis === opts.bookOsis : b.testament === scope
  )
  const limit = opts.limit ?? 300
  let found = 0
  let done = 0

  for (const book of pool) {
    if (opts.shouldStop?.()) break
    let chapters: string[][]
    try {
      chapters = await loadBibleBook(lang, code, book.osis)
    } catch {
      done += 1
      opts.onBatch([], done, pool.length)
      continue
    }
    const hits: SearchHit[] = []
    for (let ci = 0; ci < chapters.length && found + hits.length < limit; ci++) {
      const verses = chapters[ci]
      for (let vi = 0; vi < verses.length; vi++) {
        const text = verses[vi]
        if (!text) continue
        if (fold(stripTags(text)).includes(needle)) {
          hits.push({
            osis: book.osis,
            bookName: book.name,
            abbr: book.abbr,
            chapter: ci + 1,
            verse: vi + 1,
            text,
          })
          if (found + hits.length >= limit) break
        }
      }
    }
    found += hits.length
    done += 1
    opts.onBatch(hits, done, pool.length)
    if (found >= limit) break
  }
  return found
}

/** Tekst bez znacznikow - do szukania, kopiowania i udostepniania. */
export function stripTags(text: string): string {
  return text.replace(/<\/?[ib]>/g, '')
}

// --- wybor przekladu ---------------------------------------------------------
// Wybor czytelnika zostaje na stale w tej przegladarce, jak ulubione piesni.

const CHOICE = 'zywe-slowo:bible-translation:v1'

export function getChosenTranslation(fallback = 'BSB'): string {
  try {
    return localStorage.getItem(CHOICE) || fallback
  } catch {
    return fallback
  }
}

export function setChosenTranslation(code: string): void {
  try {
    localStorage.setItem(CHOICE, code)
  } catch {
    /* prywatne okno - wybor zyje tylko do konca sesji */
  }
}

// --- czytanie dwoch przekladow naraz ------------------------------------------
// Drugi przeklad i kierunek podzialu ekranu (decyzja autora 2026-08-25).
// Pusty drugi przeklad znaczy: czytamy jeden, tak jak dotad.

const SECOND = 'zywe-slowo:bible-second:v1'
const SPLIT = 'zywe-slowo:bible-split:v1'

/** „pion" to dwie kolumny obok siebie, „poziom" to jeden tekst pod drugim. */
export type BibleSplit = 'pion' | 'poziom'

export function getSecondTranslation(): string {
  try {
    return localStorage.getItem(SECOND) || ''
  } catch {
    return ''
  }
}

export function setSecondTranslation(code: string): void {
  try {
    if (code) localStorage.setItem(SECOND, code)
    else localStorage.removeItem(SECOND)
  } catch {
    /* prywatne okno - wybor zyje tylko do konca sesji */
  }
}

export function getBibleSplit(): BibleSplit {
  try {
    return localStorage.getItem(SPLIT) === 'poziom' ? 'poziom' : 'pion'
  } catch {
    return 'pion'
  }
}

export function setBibleSplit(v: BibleSplit): void {
  try {
    localStorage.setItem(SPLIT, v)
  } catch {
    /* prywatne okno - wybor zyje tylko do konca sesji */
  }
}
