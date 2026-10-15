import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import type { EduEntry, EduIndex } from '../types'

/** Dzisiejsza data jako RRRR-MM-DD w czasie lokalnym czytelnika. */
function todayIso(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * Dzisiejszy material BeHopeful na stronie glownej (jak Czlowiek Nadziei w polskiej aplikacji,
 * 2026-10-15). Daty z `date` w edu/NN.json (kalendarz PL, tools/sync_edu_dates_en.py).
 * Dzisiejszy material, a gdy dzis nie ma nowego - ostatni z data przed dzisiaj; przed startem
 * pierwszy. W wersji angielskiej nic nie jest zablokowane - data sluzy tylko do wyboru.
 */
export function currentEdu(items: EduEntry[], now = new Date()): { entry: EduEntry; state: 'today' | 'last' | 'before' } | null {
  if (!items.length) return null
  const today = todayIso(now)
  const exact = items.find((it) => it.date === today)
  if (exact) return { entry: exact, state: 'today' }
  const started = items.filter((it) => it.date && it.date <= today)
  if (started.length) return { entry: started[started.length - 1], state: 'last' }
  return { entry: items[0], state: 'before' }
}

export function EduTodayActions({ index, lang }: { index: EduIndex | null; lang: string }) {
  const { t } = useI18n()
  const current = index && currentEdu(index.items)

  if (!current) return <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading', 'Loading…')}</p>

  const { entry, state } = current
  const lead = state === 'today'
    ? t('home.eduToday', 'Today')
    : state === 'last'
      ? t('home.eduLast', 'Latest talk')
      : t('home.eduBefore', 'To begin')

  return <>
    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
      {lead}: {t('edu.item', 'Talk')} {entry.nr}
      {entry.dateLabel && state !== 'before' ? ` · ${entry.dateLabel}` : ''}
    </p>
    <p className="mt-1 text-lg font-semibold leading-snug text-slate-900 dark:text-white">
      {entry.audio && <span className="mr-1" aria-label={t('audio.hasAudio', 'With a recording to listen to')} title={t('audio.hasAudio', 'With a recording to listen to')}>🎧</span>}
      {entry.title}
    </p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Link to={`/${lang}/behopeful/${entry.nr}`} className="rounded-xl bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-light dark:bg-sky-300 dark:text-slate-950">
        {state === 'today' ? t('home.eduOpen', 'Open today’s talk') : t('home.eduOpenOther', 'Open the talk')}
      </Link>
      <Link to={`/${lang}/behopeful`} className="rounded-xl border border-brand/40 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-brand transition hover:border-brand hover:bg-white dark:border-sky-300/40 dark:bg-slate-950/30 dark:text-sky-200 dark:hover:border-sky-300 dark:hover:bg-slate-950/60">
        {t('home.eduAll', 'All talks')}
      </Link>
    </div>
  </>
}
