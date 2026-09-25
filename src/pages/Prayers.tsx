import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { BackLink } from '../components/BackLink'
import { PrayerJournal } from '../components/PrayerJournal'
import { PageHeading } from '../components/PageHeading'
import { exportPrayers, importPrayers, listPrayers } from '../lib/prayers'

export function Prayers() {
  const { lang, t } = useI18n()
  const [key, setKey] = useState(0) // przeladowanie dziennika po wczytaniu kopii
  const fileRef = useRef<HTMLInputElement>(null)

  function download() {
    const blob = new Blob([exportPrayers()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prayer-journal.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function upload(file: File) {
    try {
      const n = importPrayers(await file.text())
      setKey((v) => v + 1)
      alert(t('prayers.imported', 'Entries imported:') + ' ' + n)
    } catch {
      alert(t('prayers.importFailed', 'Could not read this file.'))
    }
  }

  return (
    <div>
      <BackLink to={`/${lang}`} className="mb-4">
        {t('nav.home', 'Home')}
      </BackLink>
      <PageHeading icon="prayer" title={t('prayers.title', 'Prayer Journal')} className="mb-4" />

      <p className="gradient-panel mb-5 rounded-xl border p-3 text-sm text-slate-300">
        {t(
          'prayers.privacy',
          'Your journal is saved only in this browser – we never send it anywhere and cannot see it. Clearing your browser data will delete it, so save a backup file from time to time.'
        )}
      </p>

      <PrayerJournal key={key} />

      <div className="no-print mt-8 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={download}
          disabled={listPrayers().length === 0}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-slate-200 hover:border-slate-300 disabled:opacity-40"
        >
          {t('prayers.export', 'Save a backup file')}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-slate-200 hover:border-slate-300"
        >
          {t('prayers.import', 'Restore from a backup file')}
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
