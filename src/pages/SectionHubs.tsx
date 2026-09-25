import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { loadIndex } from '../content'
import { AppIcon, type IconName } from '../components/AppNavigation'
import { BackLink } from '../components/BackLink'
import { PageHeading } from '../components/PageHeading'
import { StudyCard } from '../components/StudyCard'
import type { IndexFile } from '../types'

function SectionTile({ to, icon, title, description }: { to: string; icon: IconName; title: string; description: string }) {
  const content = <><span className="rounded-xl bg-brand/10 p-3 text-brand dark:bg-sky-400/15 dark:text-sky-300"><AppIcon name={icon} className="h-7 w-7" /></span><span className="min-w-0 flex-1"><span className="block text-lg font-bold text-slate-900 dark:text-white">{title}</span><span className="mt-1 block text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</span></span><span className="text-xl text-brand dark:text-sky-300" aria-hidden>›</span></>
  const className = 'gradient-panel flex items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-md dark:hover:border-sky-300/60'
  return <Link to={to} viewTransition className={className}>{content}</Link>
}

function Hub({ icon, title, intro, children }: { icon: IconName; title: string; intro: string; children: ReactNode }) {
  const { lang, t } = useI18n()
  return <section className="mx-auto max-w-xl">
    <BackLink to={`/${lang}`} className="mb-4">{t('nav.home', 'Home')}</BackLink>
    <PageHeading icon={icon} title={title} />
    <p className="mt-3 text-slate-600 dark:text-slate-300">{intro}</p>
    <div className="mt-6 space-y-3">{children}</div>
  </section>
}

export function BibleHub() {
  const { lang, t } = useI18n()
  return <Hub icon="book" title={t('bibleHub.title', 'Bible')} intro={t('bibleHub.intro', 'Choose how you would like to meet with God’s Word today.')}>
    <SectionTile to={`/${lang}/bible/read`} icon="book" title={t('nav.bibleText', 'Read the Bible')} description={t('bibleHub.readDesc', 'Books, chapters, search, bookmarks, and translations.')} />
    <SectionTile to={`/${lang}/know-god`} icon="lesson" title={t('home.bars.studies', 'Know God and the Bible')} description={t('bibleHub.studiesDesc', '5 series of 7 Bible studies for personal study.')} />
    <SectionTile to={`/${lang}/sabbath-school`} icon="lesson" title={t('nav.lessons', 'Sabbath School')} description={t('bibleHub.lessonsDesc', 'This week’s Sabbath School lesson.')} />
    <SectionTile to={`/${lang}/notes`} icon="notes" title={t('notes.title', 'My Bible Notes')} description={t('bibleHub.notesDesc', 'Write down your thoughts and come back to them later.')} />
    <SectionTile to={`/${lang}/memory-verses`} icon="memory" title={t('flashcards.cta', 'Memorize Bible Verses')} description={t('bibleHub.memoryDesc', 'Flashcards and review of key verses.')} />
    <SectionTile to={`/${lang}/occasions`} icon="occasion" title={t('occasions.cta', 'Verses for Every Occasion')} description={t('bibleHub.occasionsDesc', 'Find a Scripture passage for a specific situation.')} />
  </Hub>
}

export function PrayerHub() {
  const { lang, t } = useI18n()
  return <Hub icon="prayer" title={t('prayerHub.title', 'Prayer')} intro={t('prayerHub.intro', 'Choose how you would like to come before God today: your own requests, a 40-day journey, or Scripture for a particular moment.')}>
    <SectionTile to={`/${lang}/prayer-journal`} icon="prayer" title={t('prayers.title', 'Prayer Journal')} description={t('prayerHub.journalDesc', 'Your personal prayer list, saved only on this device.')} />
    <SectionTile to={`/${lang}/40-days`} icon="prayer" title={t('home.pray40', '40 Days of Prayer')} description={t('prayerHub.pray40Desc', 'A daily journey of prayer, one day at a time.')} />
    <SectionTile to={`/${lang}/prayer/texts`} icon="prayer" title={t('prayerTexts.cta', 'Scriptures for Prayer')} description={t('prayerHub.textsDesc', 'Praise, confession, requests, thanksgiving – pick from the list or draw a random set.')} />
    <SectionTile to={`/${lang}/occasions`} icon="occasion" title={t('occasions.cta', 'Verses for Every Occasion')} description={t('bibleHub.occasionsDesc', 'Find a Scripture passage for a specific situation.')} />
  </Hub>
}

export function BibleStudies() {
  const { lang, t } = useI18n()
  const [index, setIndex] = useState<IndexFile | null>(null)
  const [failed, setFailed] = useState(false)
  const [openSeries, setOpenSeries] = useState<string | null>(null)

  useEffect(() => {
    setIndex(null)
    setFailed(false)
    loadIndex(lang).then(setIndex).catch(() => setFailed(true))
  }, [lang])

  const series = index ? [...index.series].sort((a, b) => a.order - b.order) : []
  return <section className="mx-auto max-w-xl">
    <BackLink to={`/${lang}/bible`} className="mb-4">{t('bibleHub.title', 'Bible')}</BackLink>
    <PageHeading icon="lesson" title={t('home.bars.studies', 'Know God and the Bible')} />
    <p className="mt-3 text-slate-600 dark:text-slate-300">{t('studies.intro', 'Five series of seven studies guide you through the key themes of faith and the Bible.')}</p>
    {failed ? <p className="mt-6 text-slate-500 dark:text-slate-400">{t('studies.unavailable', 'These studies are temporarily unavailable.')}</p> : !index ? <p className="mt-6 text-slate-500 dark:text-slate-400">{t('common.loading', 'Loading…')}</p> : <div className="mt-6 space-y-3">{series.map((entry) => {
      const studies = index.studies.filter((study) => study.seriesId === entry.id).sort((a, b) => a.order - b.order)
      const open = openSeries === entry.id
      return <section key={entry.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button type="button" onClick={() => setOpenSeries(open ? null : entry.id)} aria-expanded={open} className="gradient-panel flex w-full items-center gap-3 p-4 text-left transition hover:border-brand/60 dark:hover:border-sky-300/60">
          <span className="rounded-xl bg-brand/10 p-2.5 text-brand dark:bg-sky-400/15 dark:text-sky-300"><AppIcon name="lesson" className="h-6 w-6" /></span>
          <span className="min-w-0 flex-1"><span className="block text-base font-bold text-slate-900 dark:text-white">{entry.title}</span><span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">{studies.length} {studies.length === 1 ? t('studies.topic', 'study') : t('studies.topics', 'studies')}</span></span>
          <span className={`text-xl text-brand transition-transform dark:text-sky-300 ${open ? 'rotate-90' : ''}`} aria-hidden>›</span>
        </button>
        {open && <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-700">{studies.map((study) => <StudyCard key={study.id} study={study} tile="gradient-panel border-slate-200 hover:border-brand dark:border-slate-700 dark:text-white" />)}</div>}
      </section>
    })}</div>}
  </section>
}
