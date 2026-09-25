import { useEffect, useState } from 'react'
import { loadPray40 } from '../content'
import { useI18n } from '../i18n'
import { AppIcon } from '../components/AppNavigation'
import { BackLink } from '../components/BackLink'
import { Pray40Actions } from '../components/Pray40Actions'
import type { Pray40Index } from '../types'

export function Hope() {
  const { lang, t } = useI18n()
  const [index, setIndex] = useState<Pray40Index | null>(null)

  useEffect(() => {
    setIndex(null)
    loadPray40(lang).then(setIndex).catch(() => undefined)
  }, [lang])

  return <section className="mx-auto max-w-xl">
    <BackLink to={`/${lang}`} className="mb-4">{t('nav.home', 'Home')}</BackLink>
    <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-lg dark:border-slate-700"><img src={`${import.meta.env.BASE_URL}allthingsnew.png`} alt="#AllThingsNew" width={1280} height={256} className="block h-auto w-full" /></div>
    <h1 className="sr-only">{t('appName', 'One Voice 27')}</h1>
    <p className="mt-5 text-slate-600 dark:text-slate-300">{t('hope.intro', 'Readings and prayer that help us share hope together.')}</p>

    <div className="mt-6 space-y-3">
      <section className="gradient-panel rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-brand/10 p-3 text-brand dark:bg-sky-400/15 dark:text-sky-300"><AppIcon name="prayer" className="h-7 w-7" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('home.pray40', '40 Days of Prayer')}</h2><p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('hope.pray40Desc', 'A daily journey of prayer — continue where you left off or browse all 40 days.')}</p></div>
        </div>
        <Pray40Actions index={index} lang={lang} />
      </section>
    </div>
  </section>
}
