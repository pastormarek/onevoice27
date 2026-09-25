import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { BackLink } from '../components/BackLink'
import { PageHeading } from '../components/PageHeading'
import { deleteNote, exportNotes, getNote, importNotes, listNotes, saveNote } from '../lib/notes'
import type { BibleNote } from '../types'

function formatDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}

/** Lista notatek - na stronie notatek i wewnatrz belki na stronie glownej. */
export function NotesList({ limit }: { limit?: number }) {
  const { lang, t } = useI18n()
  const notes = useMemo(() => listNotes(), [])
  const shown = limit ? notes.slice(0, limit) : notes

  if (notes.length === 0)
    return (
      <p className="text-sm text-slate-300">
        {t('notes.empty', 'You don’t have any notes yet. Start with the “New note” button.')}
      </p>
    )

  return (
    <div className="space-y-1.5">
      {shown.map((n) => (
        <Link
          key={n.id}
          to={`/${lang}/notes/${n.id}`}
          className="block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 transition hover:border-brand hover:shadow-sm"
        >
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate font-medium leading-snug">
              {n.title || t('notes.untitled', 'Untitled')}
            </span>
            <span className="shrink-0 text-xs text-slate-500">{formatDate(n.updatedAt, lang)}</span>
          </div>
          {(n.ref || n.source) && (
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {[n.ref, n.source?.label].filter(Boolean).join(' · ')}
            </div>
          )}
        </Link>
      ))}
      {limit && notes.length > limit && (
        <Link to={`/${lang}/notes`} className="mt-1 block text-sm text-brand-light hover:underline">
          {t('notes.showAll', 'See all')} ({notes.length})
        </Link>
      )}
    </div>
  )
}

export function Notes() {
  const { lang, t } = useI18n()
  const [, force] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const notes = listNotes()

  function download() {
    const blob = new Blob([exportNotes()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-bible-notes.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function upload(file: File) {
    try {
      const n = importNotes(await file.text())
      force((v) => v + 1)
      alert(t('notes.imported', 'Notes imported:') + ' ' + n)
    } catch {
      alert(t('notes.importFailed', 'Could not read this file.'))
    }
  }

  return (
    <div>
      <BackLink to={`/${lang}`} className="mb-4">
        {t('nav.home', 'Home')}
      </BackLink>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageHeading icon="notes" title={t('notes.title', 'My Bible Notes')} />
        <Link
          to={`/${lang}/notes/new`}
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-light"
        >
          + {t('notes.new', 'New note')}
        </Link>
      </div>

      <p className="gradient-panel mb-5 rounded-xl border p-3 text-sm text-slate-300">
        {t(
          'notes.privacy',
          'Your notes are saved only in this browser – we never send them anywhere and cannot see them. Clearing your browser data will delete them, so it’s a good idea to make a backup.'
        )}
      </p>

      <NotesList />

      <div className="no-print mt-8 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={download}
          disabled={notes.length === 0}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-slate-200 hover:border-slate-300 disabled:opacity-40"
        >
          {t('notes.export', 'Save a backup file')}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-slate-200 hover:border-slate-300"
        >
          {t('notes.import', 'Restore from a backup file')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

export function NoteEdit() {
  const { id } = useParams()
  const { lang, t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const isNew = !id || id === 'new'

  const existing: BibleNote | undefined = isNew ? undefined : getNote(id!)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [ref, setRef] = useState(existing?.ref ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [error, setError] = useState('')

  // przy nowej notatce zapamietujemy, z ktorego ekranu powstala
  const source = isNew
    ? params.get('from')
      ? { label: params.get('label') || params.get('from')!, path: params.get('from')! }
      : undefined
    : existing?.source

  useEffect(() => {
    if (!isNew && !existing) setError(t('notes.missing', 'This note could not be found.'))
  }, [isNew, existing, t])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() && !body.trim()) return
    const saved = saveNote({
      id: isNew ? undefined : id,
      title: title.trim() || t('notes.untitled', 'Untitled'),
      body,
      ref,
      source,
    })
    if (!saved) {
      setError(
        t('notes.saveFailed', 'Could not save – your browser is blocking storage (for example, in private mode).')
      )
      return
    }
    navigate(`/${lang}/notes`)
  }

  function remove() {
    if (!id || isNew) return
    if (!confirm(t('notes.confirmDelete', 'Delete this note?'))) return
    deleteNote(id)
    navigate(`/${lang}/notes`)
  }

  if (error && !isNew && !existing)
    return (
      <div>
        <p className="text-slate-300">{error}</p>
        <BackLink to={`/${lang}/notes`} className="mt-3">
          {t('notes.backToList', 'Back to notes')}
        </BackLink>
      </div>
    )

  return (
    <form onSubmit={submit}>
      <BackLink to={`/${lang}/notes`}>{t('notes.backToList', 'Back to notes')}</BackLink>

      <h1 className="mb-4 mt-2 text-2xl font-bold text-slate-100">
        {isNew ? t('notes.new', 'New note') : t('notes.edit', 'Edit note')}
      </h1>

      {source && (
        <p className="mb-3 text-sm text-slate-400">
          {t('notes.from', 'From:')} <Link to={source.path} className="text-brand-light hover:underline">{source.label}</Link>
        </p>
      )}

      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-300">{t('notes.fieldTitle', 'Title')}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand"
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm text-slate-300">
          {t('notes.fieldRef', 'Bible reference (optional)')}
        </span>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={t('notes.refPlaceholder', 'e.g. John 3:16')}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm text-slate-300">{t('notes.fieldBody', 'Note')}</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 leading-relaxed text-slate-900 outline-none focus:border-brand"
        />
      </label>

      {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-light"
        >
          {t('notes.save', 'Save')}
        </button>
        {!isNew && (
          <button
            type="button"
            onClick={remove}
            className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm text-rose-300 hover:border-rose-400"
          >
            {t('notes.delete', 'Delete')}
          </button>
        )}
      </div>
    </form>
  )
}
