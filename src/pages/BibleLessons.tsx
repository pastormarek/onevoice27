import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { fallbackUrl, findCurrentLesson, type CurrentLesson } from '../lib/sabbathSchool'
import { BackLink } from '../components/BackLink'
import { PageHeading } from '../components/PageHeading'

export function BibleLessons() {
  const { lang, t } = useI18n()
  const [lesson, setLesson] = useState<CurrentLesson | null>(null)

  useEffect(() => {
    let alive = true
    findCurrentLesson(lang).then((value) => alive && setLesson(value)).catch(() => alive && setLesson(null))
    return () => { alive = false }
  }, [lang])

  return <section className="mx-auto max-w-xl">
    <BackLink to={`/${lang}/bible`} className="mb-4">{t('bibleHub.title', 'Bible')}</BackLink>
    <PageHeading icon="lesson" title={t('sabbathSchool.title', 'Sabbath School')} />
    <p className="mt-3 text-slate-600 dark:text-slate-300">{t('sabbathSchool.intro', 'This week’s Sabbath School lesson with study materials.')}</p>
    <article className="gradient-panel mt-6 rounded-2xl border p-5">
      <p className="text-sm font-semibold text-brand dark:text-sky-300">{t('home.sabbathSchool', 'Sabbath School')}</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{lesson?.lessonTitle || t('home.sabbathTitle', 'This Week’s Lesson')}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{lesson?.quarterTitle || t('home.sabbathDesc', 'This week’s lesson and study materials.')}</p>
      <a href={lesson?.url || fallbackUrl(lang)} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-light dark:bg-sky-300 dark:text-slate-950">{t('home.openLesson', 'Open lesson')} <span className="ml-1" aria-hidden>↗</span></a>
    </article>
  </section>
}
