import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { BackLink } from '../components/BackLink'
import { useSetPlace } from '../place'

// Strona konta. Samo logowanie czeka na projekt w Firebase (etap 0
// w _PROPOZYCJA_konta-i-powiadomienia.md) - do tego czasu strona mowi wprost,
// co konto da i jak zrobic kopie swoich rzeczy bez niego.

export function Account() {
  const { lang, t } = useI18n()
  useSetPlace(t('account.title', 'Your Account'))

  return (
    <div>
      <BackLink to={`/${lang}`} className="mb-4">
        {t('nav.home', 'Home')}
      </BackLink>
      <h1 className="mb-3 text-2xl font-bold text-slate-100">{t('account.title', 'Your Account')}</h1>
      <p className="text-slate-300">{t('account.lead', '')}</p>

      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="font-semibold text-amber-100">{t('account.soon', 'Sign-in is not available yet.')}</p>
        <p className="mt-1 text-sm text-amber-100/80">{t('account.soonBody', '')}</p>
      </div>

      <p className="mt-6 text-sm text-slate-400">{t('account.backup', '')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to={`/${lang}/notes`}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-sm text-slate-200 hover:border-brand"
        >
          {t('account.notes', 'My notes')}
        </Link>
        <Link
          to={`/${lang}/prayer-journal`}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-sm text-slate-200 hover:border-brand"
        >
          {t('prayers.title', 'Prayer Journal')}
        </Link>
        <Link
          to={`/${lang}/bible/bookmarks`}
          className="rounded-lg border border-slate-500/40 px-3 py-1.5 text-sm text-slate-200 hover:border-brand"
        >
          {t('bible.bookmarks', 'Bookmarks')}
        </Link>
      </div>
    </div>
  )
}
