import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { BackLink } from '../components/BackLink'
import { PageHeading } from '../components/PageHeading'
import { useSetPlace } from '../place'
import {
  getChosenTranslation,
  listTranslations,
  loadBibleIndex,
  setChosenTranslation,
} from '../lib/bible'
import { installFromFile, installFromUrl, removeModule, type InstalledMeta } from '../lib/bibleStore'
import { versificationGap } from '../lib/yesModule'
import { BIBLE_LIST_PATH } from './Bible'

// Przeklady i tryb offline.
//
// Aplikacja zawiera przeklady z domeny publicznej (BSB, WEB, KJV).
// Kazdy inny przeklad czytelnik wgrywa sobie sam – z pliku
// na swoim dysku albo spod wlasnego adresu – i modul zostaje wylacznie w jego
// przegladarce (IndexedDB, lib/bibleStore.ts).

interface Row {
  code: string
  name: string
  license: string
  source?: string
  sizeKB?: number
  installed: boolean
}

export function BibleModulesPage() {
  const { lang, t } = useI18n()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [chosen, setChosen] = useState(() => getChosenTranslation())
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [url, setUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useSetPlace(t('bible.translations', 'Translations and offline use'))

  function refresh() {
    listTranslations(lang)
      .then((r) => setRows(r.translations))
      .catch(() => setRows([]))
  }
  useEffect(refresh, [lang])

  function errorText(e: unknown): string {
    const code = e instanceof Error ? e.message : ''
    if (code === 'bad-format')
      return t('bible.installBadFormat', 'This is not a module file in a format this app can read.')
    if (code === 'quota')
      return t('bible.installQuota', 'There is not enough browser storage for this translation.')
    if (code === 'no-indexeddb')
      return t('bible.installNoDb', 'This browser does not allow saving the module (private mode?).')
    if (code === 'network') return t('bible.installNetwork', 'Could not download the file from this address.')
    if (code === 'zip-empty')
      return t('bible.installZipEmpty', 'This archive does not contain a module file we recognize.')
    if (code === 'bad-zip')
      return t('bible.installBadZip', 'Could not unpack this archive.')
    if (code === 'not-sqlite')
      return t('bible.installNotSqlite', 'This file cannot be opened as a module database.')
    if (code === 'no-books')
      return t(
        'bible.installNoBooks',
        'We could not recognize any books in this module – the book names are in an unknown language.'
      )
    if (code === 'yes-new-format')
      return t(
        'bible.installYesNew',
        'This .yes module uses a newer version of the format that the app cannot read yet.'
      )
    return t('bible.installFailed', 'Could not load the module.')
  }

  async function install(run: () => Promise<InstalledMeta>) {
    setBusy('install')
    setMsg('')
    try {
      const meta = await run()
      let note = `${t('bible.installDone', 'Translation loaded')}: ${meta.index.name} (${meta.index.books.length} ${t('bible.booksCount', 'books')})`
      // przeklady katolickie licza nadpisy psalmow jako wersety i maja dodatki w Dn i Est -
      // odnosnik ze studium trafi wtedy o werset obok; mowimy o tym od razu
      try {
        const template = await loadBibleIndex(lang, chosen)
        const gap = versificationGap(meta.index, template)
        if (gap > 20) note += ` – ${t('bible.versificationWarn', 'note: this translation numbers its verses differently from the others, so references may land one verse off')} (${gap})`
      } catch {
        /* brak wzorca do porownania - nie blokuje wczytania */
      }
      setMsg(note)
      refresh()
    } catch (e) {
      setMsg(errorText(e))
    } finally {
      setBusy('')
    }
  }

  async function drop(code: string) {
    await removeModule(code).catch(() => undefined)
    if (chosen === code) {
      const fallback = rows?.find((r) => r.code !== code && !r.installed)?.code || 'BSB'
      setChosenTranslation(fallback)
      setChosen(fallback)
    }
    refresh()
  }

  return (
    <div>
      <PageHeading icon="book" title={t('bible.availableTranslations', 'Available Translations')} />

      {msg && (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {msg}
        </p>
      )}

      {rows === null ? (
        <p className="mt-4 text-slate-400">{t('common.loading', 'Loading…')}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.code} className="gradient-panel rounded-xl border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-100">{r.name}</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200">{r.code}</span>
                {r.installed && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200 ring-1 ring-emerald-500/30">
                    {t('bible.installedTag', 'module in this browser')}
                  </span>
                )}
                {chosen === r.code && (
                  <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs text-brand-light ring-1 ring-brand/40">
                    {t('bible.current', 'reading now')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">{r.license}</p>
              {r.sizeKB ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  {Math.round(r.sizeKB / 1024 * 10) / 10} MB{r.source ? ` · ${r.source}` : ''}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setChosenTranslation(r.code)
                    setChosen(r.code)
                  }}
                  disabled={chosen === r.code}
                  className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-slate-200 hover:border-slate-300 disabled:opacity-40"
                >
                  {t('bible.choose', 'Read this translation')}
                </button>
                {r.installed && (
                  <button
                    type="button"
                    onClick={() => drop(r.code)}
                    className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-rose-200 hover:border-rose-400"
                  >
                    {t('bible.remove', 'Remove module')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="gradient-panel mt-6 rounded-xl border p-3">
        <h2 className="font-semibold text-slate-100">{t('bible.addTitle', 'Add Your Own Translation')}</h2>
        <p className="mt-1 text-sm text-slate-300">
          {t(
            'bible.addDesc',
            'We accept .yes modules (Alkitab Bible Study), MyBible/MySword SQLite files, and our own .json format. You load the file from your device – it stays in this browser and is never sent to a server.'
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".json,.yes,.sqlite3,.sqlite,.mybible,.zip,application/json,application/zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) install(async () => installFromFile(f, await loadBibleIndex(lang, chosen)))
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== ''}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-40"
          >
            {t('bible.fromFile', 'Load a module file')}
          </button>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-slate-300">{t('bible.fromUrl', 'or file address')}</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…/ASV.bible.json"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand"
            />
          </label>
          <button
            type="button"
            onClick={() => url.trim() && install(() => installFromUrl(url.trim()))}
            disabled={busy !== '' || !url.trim()}
            className="rounded-lg border border-slate-500/40 px-3 py-2 text-sm text-slate-200 hover:border-slate-300 disabled:opacity-40"
          >
            {t('bible.fromUrlGo', 'Load')}
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          {t(
            'bible.formatsNote',
            'You can build a module from formats that store plain numbered text: Zefania XML, OSIS/USFM, MyBible (SQLite), Alkitab .yes. The file address can point to any server that allows downloads from the browser (CORS). Please respect copyright: many modern translations may be kept for personal use but not redistributed.'
          )}
        </p>
      </section>

      <div className="mt-5">
        <BackLink to={`/${lang}/${BIBLE_LIST_PATH}`}>{t('bible.allBooks', 'All books')}</BackLink>
      </div>
    </div>
  )
}
