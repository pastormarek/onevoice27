import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { loadBible, loadLangs } from '../content'
import { useI18n } from '../i18n'

export function About() {
  const { t } = useI18n()
  const { lang = 'en' } = useParams()
  // Nota o zrodle tekstu Pisma – nazwa i licencja pochodzą z pliku przekładu,
  // więc są już w języku modułu (bez dodatkowych napisów w ui.json).
  const [bible, setBible] = useState<{ name: string; license: string } | undefined>()

  useEffect(() => {
    let alive = true
    loadLangs()
      .then((l) => l.languages.find((x) => x.code === lang)?.defaultTranslation)
      .then((tr) => (tr ? loadBible(lang, tr) : undefined))
      .then((b) => { if (alive && b) setBible({ name: b.name, license: b.license }) })
      .catch(() => undefined)
    return () => { alive = false }
  }, [lang])

  return (
    <div className="prose-slate">
      <h1 className="text-xl font-semibold mb-3">{t('about.title', 'About')}</h1>
      <p className="study-prose whitespace-pre-line text-slate-700 dark:text-slate-200">{t('about.body', 'One Voice 27 brings the Bible, Bible studies, and daily prayer together in one place.\n\nNo sign-in required and no tracking. Your notes and prayer journal stay on your device, and the app works offline once content is downloaded.')}</p>
      <p className="mt-3 text-sm text-slate-500">{t('about.privacy', 'The app does not collect any personal data.')}</p>
      {bible && (
        <p className="mt-3 text-sm text-slate-500">
          {bible.name}
          {bible.license ? ` – ${bible.license}` : ''}
        </p>
      )}
      <p className="mt-6 text-sm text-slate-400">
        <a
          href={t('about.publisherUrl', 'https://www.facebook.com/pastormarek')}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-light underline-offset-2 hover:underline"
        >
          {t('about.publisher', 'Author: Marek Micyk')}
        </a>
      </p>
    </div>
  )
}
