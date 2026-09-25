import { useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import { useTheme, type FontSet, type Theme } from '../theme'
import {
  getInstallDiagnostics,
  getInstallState,
  initAppInstall,
  requestInstall,
  subscribeInstall,
  subscribeInstallDiagnostics,
  type InstallDiagnostic,
  type InstallState,
} from '../lib/installApp'
import { downloadModule } from '../content'
import { AppIcon, type IconName } from '../components/AppNavigation'
import { PageHeading } from '../components/PageHeading'

function ExpandablePanel({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
      <span className="rounded-lg bg-brand/10 p-2 text-brand dark:bg-sky-400/15 dark:text-sky-300"><AppIcon name={icon} className="h-5 w-5" /></span>
      <span className="flex-1 font-semibold text-slate-900 dark:text-white">{title}</span>
      <span className={`text-lg text-brand transition-transform dark:text-sky-300 ${open ? 'rotate-90' : ''}`} aria-hidden>›</span>
    </button>
    {open && <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-700">{children}</div>}
  </section>
}

function installReport(entries: InstallDiagnostic[], state: InstallState, labels: { title: string; generated: string; state: string; empty: string }) {
  const events = entries.map((entry) => {
    const details = entry.details ? ` ${JSON.stringify(entry.details)}` : ''
    return `[${entry.timestamp}] ${entry.event}${details}`
  })
  return [
    labels.title,
    `${labels.generated}: ${new Date().toISOString()}`,
    `${labels.state}: ${state}`,
    '',
    ...(events.length > 0 ? events : [labels.empty]),
  ].join('\n')
}

export function Settings() {
  const { lang, t } = useI18n()
  const { theme, setTheme, fontSet, setFontSet } = useTheme()
  const [installState, setInstallState] = useState<InstallState>(getInstallState)
  const [installDiagnostics, setInstallDiagnostics] = useState<InstallDiagnostic[]>(getInstallDiagnostics)
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'failed'>('idle')
  const [showIosSteps, setShowIosSteps] = useState(false)
  const [installedNow, setInstalledNow] = useState(false)
  const [offlineState, setOfflineState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  const [offlineProgress, setOfflineProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    initAppInstall()
    const refresh = () => setInstallState(getInstallState())
    const refreshDiagnostics = () => setInstallDiagnostics(getInstallDiagnostics())
    refresh()
    refreshDiagnostics()
    const unsubscribeInstall = subscribeInstall(refresh)
    const unsubscribeDiagnostics = subscribeInstallDiagnostics(refreshDiagnostics)
    return () => {
      unsubscribeInstall()
      unsubscribeDiagnostics()
    }
  }, [])

  function option(value: Theme, title: string, desc: string) {
    const active = theme === value
    return <button type="button" onClick={() => setTheme(value)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-brand bg-brand/10 dark:border-sky-300 dark:bg-sky-300/10' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-full ${value === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>{value === 'dark' ? '◐' : '☼'}</span>
      <span className="flex-1"><span className="block font-semibold text-slate-900 dark:text-white">{title}</span><span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{desc}</span></span>
      <span className={`h-4 w-4 rounded-full border-2 ${active ? 'border-brand bg-brand ring-2 ring-brand/20 dark:border-sky-300 dark:bg-sky-300' : 'border-slate-300 dark:border-slate-600'}`} />
    </button>
  }

  function fontOption(value: FontSet, title: string, reading: string, desc: string) {
    const active = fontSet === value
    return <button type="button" onClick={() => setFontSet(value)} className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-brand bg-brand/10 ring-2 ring-brand/15 dark:border-sky-300 dark:bg-sky-300/10 dark:ring-sky-300/15' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'}`}>
      <div className="flex items-start gap-3"><span className={`font-preview-${value} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-base font-bold text-white`}>Aa</span><span className="min-w-0 flex-1"><span className={`font-preview-${value} block font-bold text-slate-900 dark:text-white`}>{title}</span><span className="block text-sm font-medium text-slate-600 dark:text-slate-300">+ {reading}</span><span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{desc}</span></span><span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${active ? 'border-brand bg-brand ring-2 ring-brand/20 dark:border-sky-300 dark:bg-sky-300' : 'border-slate-300 dark:border-slate-600'}`} /></div>
    </button>
  }

  async function install() {
    if (installState === 'ios') {
      setShowIosSteps(!showIosSteps)
      return
    }
    if (await requestInstall() === 'accepted') setInstalledNow(true)
  }

  async function copyInstallReport() {
    try {
      await navigator.clipboard.writeText(diagnosticsReport)
      setCopyState('done')
    } catch {
      setCopyState('failed')
    }
  }

  async function downloadOffline() {
    if (offlineState === 'busy') return
    setOfflineState('busy')
    setOfflineProgress(null)
    try {
      await downloadModule(lang, (done, total) => setOfflineProgress({ done, total }))
      setOfflineState('done')
    } catch {
      setOfflineState('failed')
    } finally {
      setOfflineProgress(null)
    }
  }

  const diagnosticsReport = installReport(installDiagnostics, installState, {
    title: t('settings.installDiagnosticsReportTitle', 'PWA installation diagnostics'),
    generated: t('settings.installDiagnosticsGenerated', 'Generated'),
    state: t('settings.installDiagnosticsState', 'Installation state'),
    empty: t('settings.installDiagnosticsEmpty', 'No diagnostic events.'),
  })

  return <section className="mx-auto max-w-xl">
    <PageHeading icon="settings" eyebrow={t('nav.menu', 'Menu')} title={t('nav.settings', 'Settings')} />
    <p className="mt-2 text-slate-600 dark:text-slate-300">{t('settings.intro', 'Choose the look that is most comfortable for you.')}</p>
    <div className="mt-6 space-y-2.5">
      <ExpandablePanel icon="settings" title={t('settings.appearance', 'Appearance')}>
        <div className="space-y-2.5">
          {option('light', t('settings.light', 'Light mode'), t('settings.lightDesc', 'A bright, easy-to-read look for daytime.'))}
          {option('dark', t('settings.dark', 'Dark mode'), t('settings.darkDesc', 'A dark look that is easy on the eyes at night.'))}
        </div>
      </ExpandablePanel>
      <ExpandablePanel icon="notes" title={t('settings.fonts', 'Fonts')}>
        <div className="space-y-2.5">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('settings.fontsIntro', 'The first font is used for the interface, the second for longer reading.')}</p>
          {fontOption('nunito', 'Montserrat', 'Libre Baskerville', t('settings.fontMontserrat', 'Clear and well organized.'))}
          {fontOption('outfit', 'Outfit', 'Newsreader', t('settings.fontOutfit', 'Light and editorial.'))}
        </div>
      </ExpandablePanel>
    </div>
    <div className="mt-2.5 space-y-2.5">
      <ExpandablePanel icon="settings" title={t('settings.installTitle', 'Add the app to your phone')}>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('settings.installDesc', 'It opens like a regular app and stays available even without internet.')}</p>
        {installedNow || installState === 'installed' ? <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('settings.installed', 'The app is already on your home screen.')}</p> : installState === 'unavailable' ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('settings.installUnavailable', 'Open this page in Chrome on Android or Safari on iPhone to add the app to your home screen.')}</p> : <><button type="button" onClick={install} aria-expanded={installState === 'ios' ? showIosSteps : undefined} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-light dark:bg-sky-300 dark:text-slate-950">{installState === 'ios' ? t('settings.installHow', 'How to do it') : t('settings.installButton', 'Add the app')}</button>{installState === 'ios' && showIosSteps && <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300"><li>{t('settings.iosStep1', 'Tap the “Share” icon in the Safari toolbar.')}</li><li>{t('settings.iosStep2', 'Scroll down and choose “Add to Home Screen”.')}</li><li>{t('settings.iosStep3', 'Tap “Add” in the top-right corner.')}</li><li className="text-slate-500 dark:text-slate-400">{t('settings.iosStep4', 'On iPhone, use Safari — other browsers may not offer this option.')}</li></ol>}</>}
      </ExpandablePanel>
      {installState !== 'installed' && <ExpandablePanel icon="settings" title={t('settings.installDiagnostics', 'Installation diagnostics')}>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t('settings.installDiagnosticsLimit', 'The report shows only the information available to this page. Android and Samsung Internet do not share private installer or Android Package Manager errors with it.')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t('settings.installDiagnosticsHint', 'Try installing the app, then come back to this panel and copy the report.')}
        </p>
        <pre
          tabIndex={0}
          aria-label={t('settings.installDiagnosticsReport', 'Installation diagnostic report')}
          className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >{diagnosticsReport}</pre>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={copyInstallReport} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-light dark:bg-sky-300 dark:text-slate-950">
            {t('settings.copyInstallDiagnostics', 'Copy report')}
          </button>
          <span role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
            {copyState === 'done' ? t('settings.installDiagnosticsCopied', 'Report copied.') : copyState === 'failed' ? t('settings.installDiagnosticsCopyFailed', 'Could not copy the report.') : ''}
          </span>
        </div>
      </ExpandablePanel>}
      <ExpandablePanel icon="download" title={t('settings.offlineTitle', 'Download content for offline use')}>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('settings.offlineDesc', 'Downloads the Bible, Bible studies, the “40 Days of Prayer” readings, memory verses, and verses for every occasion to this device. Once finished, they will be available without internet.')}</p>
        <button type="button" onClick={downloadOffline} disabled={offlineState === 'busy' || offlineState === 'done'} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-light disabled:cursor-default disabled:opacity-70 dark:bg-sky-300 dark:text-slate-950">
          {offlineState === 'busy' ? `${t('settings.offlineBusy', 'Downloading…')}${offlineProgress ? ` ${offlineProgress.done}/${offlineProgress.total}` : ''}` : offlineState === 'done' ? t('settings.offlineDone', 'Content is available offline') : t('settings.offlineButton', 'Download content')}
        </button>
        {offlineState === 'failed' && <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{t('settings.offlineFailed', 'Not all content could be downloaded. Check your internet connection and try again.')}</p>}
      </ExpandablePanel>
      <ExpandablePanel icon="contact" title={t('about.title', 'About')}>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">{t('about.body', 'One Voice 27 brings the Bible, Bible studies, and daily prayer together in one place.\n\nNo sign-in required and no tracking. Your notes and prayer journal stay on your device, and the app works offline once content is downloaded.')}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t('about.privacy', 'The app does not collect any personal data.')}</p>
        <a href={t('about.publisherUrl', 'https://www.facebook.com/pastormarek')} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline dark:text-sky-300">{t('about.publisher', 'Author: Marek Micyk')}</a>
      </ExpandablePanel>
    </div>
  </section>
}
