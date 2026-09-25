import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { BackLink } from '../components/BackLink'
import { useSetPlace } from '../place'
import { VerseText } from '../components/VerseText'
import { PageHeading } from '../components/PageHeading'
import { formatRef, parseRef, searchBible, type SearchHit, type SearchScope } from '../lib/bible'
import { BIBLE_LIST_PATH, BIBLE_PATH, TranslationPicker, useBibleIndex } from './Bible'

// Wyszukiwarka po calym przekladzie. Tekst pobiera sie ksiega po ksiedze, wiec
// pierwsze trafienia widac, zanim sciagnie sie cala Biblia. Po pobraniu offline
// wszystko jest juz w cache i szukanie idzie od razu.

const MIN = 3
const LIMIT = 300

export function BibleSearchPage() {
  const { lang, t } = useI18n()
  const { code, index, failed, choose } = useBibleIndex()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [scope, setScope] = useState<SearchScope>((params.get('z') as SearchScope) || 'all')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [ran, setRan] = useState('')
  const runId = useRef(0)

  useSetPlace(t('bible.search', 'Search the Bible'))

  // szukanie rusza z adresu (?q=…), zeby wynik dalo sie odeslac linkiem
  useEffect(() => {
    const query = params.get('q') || ''
    const z = (params.get('z') as SearchScope) || 'all'
    if (!index || query.trim().length < MIN) return
    if (ran === `${code}|${z}|${query}`) return

    const id = ++runId.current
    setRan(`${code}|${z}|${query}`)
    setHits([])
    setProgress({ done: 0, total: index.books.length })
    searchBible(lang, code, query, {
      books: index.books,
      scope: z,
      limit: LIMIT,
      shouldStop: () => runId.current !== id,
      onBatch: (batch, done, total) => {
        if (runId.current !== id) return
        setProgress({ done, total })
        if (batch.length) setHits((prev) => [...prev, ...batch])
      },
    })
      .then(() => {
        if (runId.current === id) setProgress(null)
      })
      .catch(() => {
        if (runId.current === id) setProgress(null)
      })
  }, [lang, code, index, params, ran])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (query.length < MIN) return
    setParams({ q: query, z: scope })
  }

  const query = params.get('q') || ''
  const running = progress !== null
  // wpisany odnosnik („John 3:16") nie jest szukaniem slowa - dajemy skrot wprost do wersetu.
  // Bez cyfry to zwykle slowo („the", „mark") - wtedy skrotu nie proponujemy.
  const jump = index && /\d/.test(query) ? parseRef(query, index.books) : null

  if (failed) return <p className="text-slate-400">{t('bible.unavailable', 'The Bible text is unavailable.')}</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeading icon="search" title={t('bible.search', 'Search the Bible')} />
        <TranslationPicker code={code} onChange={choose} />
      </div>

      <form onSubmit={submit} className="gradient-panel mt-4 space-y-2 rounded-xl border p-3">
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-slate-300">{t('bible.searchLabel', 'Words to find')}</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
              placeholder={t('bible.searchPlaceholder', 'e.g. good shepherd or John 3:16')}
              aria-label={t('bible.searchLabel', 'Words to find')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand"
            />
          </label>
          <button
            type="submit"
            disabled={q.trim().length < MIN}
            className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-40"
          >
            {t('bible.searchGo', 'Search')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
          {(
            [
              ['all', t('bible.scopeAll', 'whole Bible')],
              ['ot', t('bible.ot', 'Old Testament')],
              ['nt', t('bible.nt', 'New Testament')],
            ] as [SearchScope, string][]
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="bible-scope"
                checked={scope === value}
                onChange={() => setScope(value)}
              />
              {label}
            </label>
          ))}
          <BackLink to={`/${lang}/${BIBLE_LIST_PATH}`} className="ml-auto">
            {t('bible.allBooks', 'All books')}
          </BackLink>
        </div>
      </form>

      {jump && (
        <Link
          to={`/${lang}/${BIBLE_PATH}/${jump.book.osis}/${jump.chapter}${jump.verse ? `?w=${jump.verse}` : ''}`}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-brand/50 bg-brand/10 px-3 py-1.5 text-sm text-brand-light"
        >
          <span aria-hidden>→</span>
          {t('bible.goToRef', 'Go to')}: {formatRef(jump.book, jump.chapter, jump.verse, jump.verseTo)}
        </Link>
      )}

      {query.length >= MIN && (
        <div className="mt-4">
          <p className="text-xs text-slate-400">
            {t('bible.found', 'Found')}: {hits.length}
            {hits.length >= LIMIT && ` – ${t('bible.limit', 'showing the first')} ${LIMIT}`}
            {running && progress && ` · ${t('bible.searching', 'searching')} ${progress.done}/${progress.total}`}
          </p>

          <ul className="mt-2 space-y-1.5">
            {hits.map((h) => (
              <li key={`${h.osis}.${h.chapter}.${h.verse}`}>
                <Link
                  to={`/${lang}/${BIBLE_PATH}/${h.osis}/${h.chapter}?w=${h.verse}`}
                  className="block rounded-lg border border-slate-200 bg-white p-2.5 text-slate-800 transition hover:border-brand"
                >
                  <span className="text-sm font-semibold text-brand">
                    {h.abbr} {h.chapter}:{h.verse}
                  </span>
                  <p className="mt-0.5 text-sm">
                    <VerseText text={h.text} mark={query} />
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {!running && hits.length === 0 && (
            <p className="mt-2 text-sm text-slate-400">{t('bible.noResults', 'Nothing found.')}</p>
          )}
        </div>
      )}
    </div>
  )
}
