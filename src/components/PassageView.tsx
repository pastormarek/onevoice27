import { useState } from 'react'
import { useI18n } from '../i18n'
import { LEVEL_STYLES } from './LevelToggle'
import { renderInline } from '../md'
import type { Bible, PassageItem } from '../types'

// Ucina muzyczne nagłówki psalmów doklejone do w.1 (np. „For the Chief Musician. A Psalm by David.")
// oraz znak ¶, zachowując numery wersetów „(N)".
const PSALM_SUP = /^(For the Chief Musician[^.]*\.|A Psalm[^.]*\.|A Song[^.]*\.|A Maskil[^.]*\.|A Michtam[^.]*\.|A Miktam[^.]*\.|By David\.|Of David\.)\s*/
function cleanVerse(raw: string): string {
  let t = raw.replace(/¶/g, '')
  const prefix = (t.match(/^\(\d+\)\s*/) || [''])[0] // zachowaj wiodące „(N) "
  let rest = t.slice(prefix.length)
  let prev = ''
  while (rest !== prev) { prev = rest; rest = rest.replace(PSALM_SUP, '') }
  return (prefix + rest).replace(/\s+/g, ' ').trim()
}

export function PassageView({ item, bible }: { item: PassageItem; bible?: Bible }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const s = LEVEL_STYLES[item.level]

  return (
    <div className={`rounded-lg border p-3 text-slate-800 ${s.card}`}>
      <div className="flex flex-wrap items-center gap-2">
        {item.level !== 'base' && (
          <span className={`rounded px-1.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide ${s.chip}`}>
            {t(`reader.${item.level}`, item.level)}
          </span>
        )}
        {item.passage.map((p) => (
          <button
            key={p.osis}
            onClick={() => setOpen((o) => !o)}
            className="rounded-full border border-brand/50 text-brand px-2.5 py-0.5 text-sm hover:bg-brand/10"
          >
            {p.ref}
          </button>
        ))}
        <span className="text-xs text-slate-500 no-print">
          {open ? t('reader.hideVerse', 'Hide text') : t('reader.showVerse', 'Show text')}
        </span>
      </div>

      {open && (
        <div className="verse-box mt-2 rounded-lg bg-white border border-slate-200 p-3 text-[0.97em] text-slate-800">
          {item.passage.map((p) => (
            <p key={p.osis} className="mb-1 last:mb-0">
              <span className="font-medium text-brand">{p.ref}</span>{' '}
              <span>{bible?.verses?.[p.osis] ? cleanVerse(bible.verses[p.osis]) : t('common.placeholderBible', 'The verse text will appear once a translation is available.')}</span>
            </p>
          ))}
        </div>
      )}

      {item.comment && <p className="mt-2 study-prose">{renderInline(item.comment)}</p>}

      {item.questions?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.questions.map((q) => (
            <li key={q.id} className="flex gap-2 text-slate-700">
              <span className="text-brand">•</span>
              <span>{q.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
