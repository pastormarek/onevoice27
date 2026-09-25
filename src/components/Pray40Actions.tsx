import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { currentCampaignDay } from '../lib/pray40Calendar'
import { listRead } from '../lib/progress'
import type { Pray40Index } from '../types'

/**
 * Wspólne wejście do „40 dni" i pełnego spisu. Gdy dni mają daty - prowadzi do dnia
 * z kalendarza akcji; bez dat (wydanie angielskie) - do pierwszego nieprzeczytanego.
 */
export function Pray40Actions({ index, lang }: { index: Pray40Index | null; lang: string }) {
  const { t } = useI18n()
  const campaign = index && currentCampaignDay(index.days)

  if (!index?.days.length) return <p className="text-sm text-slate-500 dark:text-slate-400">{t('pray40.loadingCalendar', 'Loading…')}</p>

  let entry = campaign?.entry ?? index.days[0]
  let description: string
  let label: string
  if (campaign) {
    description = campaign.state === 'before'
      ? t('pray40.startsOn', 'Starts on {date}. You can already open the first day.').replace('{date}', entry.dateLabel ?? entry.date ?? '')
      : campaign.state === 'after'
        ? t('pray40.finished', 'The 40 days have ended. Return to the last day or browse the full list.')
        : t('pray40.today', 'Today: Day {day} — {title}').replace('{day}', String(entry.day)).replace('{title}', entry.title)
    label = campaign.state === 'before'
      ? t('pray40.openFirst', 'Open the first day')
      : campaign.state === 'after'
        ? t('pray40.openLast', 'Open the last day')
        : t('pray40.openToday', 'Open today’s reading')
  } else {
    // bez kalendarza: pierwszy dzien, ktorego czytelnik jeszcze nie odhaczyl
    const read = listRead('pray40')
    const next = index.days.find((d) => !read.has(String(d.day)))
    if (!read.size || !next) {
      entry = index.days[0]
      description = read.size
        ? t('pray40.allDone', 'You have read all 40 days. Start again whenever you like.')
        : t('pray40.startDesc', 'Forty days of prayer, one reading a day. Begin whenever you are ready.')
      label = t('pray40.startDay1', 'Start with Day 1')
    } else {
      entry = next
      description = t('pray40.nextDesc', 'Next up: Day {day} — {title}').replace('{day}', String(next.day)).replace('{title}', next.title)
      label = t('pray40.continueDay', 'Continue: Day {day}').replace('{day}', String(next.day))
    }
  }

  return <>
    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Link to={`/${lang}/40-days/${entry.day}`} viewTransition className="rounded-xl bg-brand px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-light dark:bg-sky-300 dark:text-slate-950">
        {label}
      </Link>
      <Link to={`/${lang}/40-days`} viewTransition className="rounded-xl border border-brand/40 bg-white/70 px-3 py-2.5 text-center text-sm font-semibold text-brand transition hover:border-brand hover:bg-white dark:border-sky-300/40 dark:bg-slate-950/30 dark:text-sky-200 dark:hover:border-sky-300 dark:hover:bg-slate-950/60">
        {t('pray40.allDays', 'All 40 days')}
      </Link>
    </div>
  </>
}
