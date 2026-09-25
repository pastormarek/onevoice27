import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n'

export type IconName = 'book' | 'music' | 'prayer' | 'hope' | 'menu' | 'search' | 'download' | 'settings' | 'close' | 'notes' | 'memory' | 'occasion' | 'lesson' | 'group' | 'contact' | 'chevron'

export function AppIcon({ name, className = '' }: { name: IconName; className?: string }) {
  if (name === 'prayer') {
    const iconUrl = `${import.meta.env.BASE_URL}pray-icon.png`
    return <span aria-hidden className={`block bg-current ${className}`} style={{ maskImage: `url(${iconUrl})`, WebkitMaskImage: `url(${iconUrl})`, maskPosition: 'center', WebkitMaskPosition: 'center', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskSize: 'contain', WebkitMaskSize: 'contain' }} />
  }
  if (name === 'hope') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
        <defs><linearGradient id="hope-gradient" x1="3" y1="5" x2="29" y2="27"><stop stopColor="#5f8bff"/><stop offset=".42" stopColor="#7c6bf5"/><stop offset=".74" stopColor="#966fff"/><stop offset="1" stopColor="#b466e2"/></linearGradient></defs>
        <path d="M11 5 8 27M23 5l-3 22M4 13h24M3 20h24" stroke="url(#hope-gradient)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    )
  }
  const paths: Record<Exclude<IconName, 'hope'>, ReactNode> = {
    book: <><path d="M5 6.5c4.2-1.8 7.5-.6 11 2.1v17C12.5 23.1 9.2 22 5 23.8V6.5Z"/><path d="M27 6.5c-4.2-1.8-7.5-.6-11 2.1v17c3.5-2.5 6.8-3.6 11-1.8V6.5Z"/></>,
    music: <><path d="M11 25V8l14-3v15"/><path d="M11 12l14-3"/><circle cx="7.5" cy="25" r="3.5"/><circle cx="21.5" cy="20" r="3.5"/></>,
    download: <><path d="M16 4v16"/><path d="m10 15 6 6 6-6"/><path d="M6 27h20"/></>,
    prayer: <><path d="M16 5v16"/><path d="M16 21 12.3 15V7.7c0-1.4-1.8-1.9-2.5-.7L8.4 9.6c-.8 1.4-.8 3.1-.2 4.6l3.5 7.5c.6 1.3 1 2.8 1 4.3V27h3.3"/><path d="M16 21 19.7 15V7.7c0-1.4 1.8-1.9 2.5-.7l1.4 2.6c.8 1.4.8 3.1.2 4.6l-3.5 7.5c-.6 1.3-1 2.8-1 4.3V27H16"/><path d="M12.3 15 10.8 10M19.7 15l1.5-5"/></>,
    menu: <><path d="M4 8h24M4 16h24M4 24h24"/></>,
    search: <><circle cx="14" cy="14" r="8"/><path d="m20 20 7 7"/></>,
    settings: <><circle cx="16" cy="16" r="4"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/></>,
    close: <><path d="m6 6 20 20M26 6 6 26"/></>,
    notes: <><path d="M7 4h18v24H7zM11 10h10M11 15h10M11 20h6"/></>,
    memory: <><rect x="5" y="6" width="22" height="20" rx="3"/><path d="M10 11h12M10 16h8M10 21h5"/></>,
    occasion: <><path d="M16 27S6 21.3 6 13c0-5.5 6.6-7.7 10-2.8C19.4 5.3 26 7.5 26 13c0 8.3-10 14-10 14Z"/></>,
    lesson: <><path d="M5 7h22v18H5zM9 4v6M23 4v6M9 15h14M9 20h8"/></>,
    group: <><circle cx="12" cy="12" r="4"/><circle cx="22.5" cy="13.5" r="3"/><path d="M4 26c0-4.4 3.6-8 8-8s8 3.6 8 8M22 19.5c3.6 0 6.5 2.9 6.5 6.5"/></>,
    contact: <><rect x="4.5" y="6" width="23" height="18" rx="3"/><path d="m6 9 10 7 10-7"/></>,
    chevron: <path d="m11 7 10 9-10 9"/>,
  }
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{paths[name]}</svg>
}

function DrawerLink({ to, icon, children, onClick }: { to: string; icon: IconName; children: ReactNode; onClick: () => void }) {
  return <Link to={to} viewTransition onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"><AppIcon name={icon} className="h-5 w-5 text-brand dark:text-sky-300"/>{children}</Link>
}

function DrawerGroup({ icon, title, open, onToggle, children }: { icon: IconName; title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <div>
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"><span className="flex items-center gap-3"><AppIcon name={icon} className="h-5 w-5 text-brand dark:text-sky-300"/>{title}</span><AppIcon name="chevron" className={`h-4 w-4 transition ${open ? 'rotate-90' : ''}`}/></button>
    {open && <div className="mb-2 ml-4 border-l border-slate-200 pl-2 dark:border-slate-700">{children}</div>}
  </div>
}

export function AppNavigation() {
  const { lang, t } = useI18n()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [bibleOpen, setBibleOpen] = useState(true)
  const [hopeOpen, setHopeOpen] = useState(false)
  const [prayerOpen, setPrayerOpen] = useState(false)
  const home = `/${lang}`

  useEffect(() => setOpen(false), [pathname])

  const bottom = [
    { to: `${home}/bible`, label: t('nav.bible', 'Bible'), icon: 'book' as IconName },
    { to: `${home}/prayer`, label: t('nav.prayer', 'Prayer'), icon: 'prayer' as IconName },
    { to: `${home}/one-voice-27`, label: t('nav.oneVoice', 'One Voice 27'), icon: 'hope' as IconName },
  ]

  return <>
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <button type="button" onClick={() => setOpen(true)} aria-label={t('nav.menu', 'Menu')} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"><AppIcon name="menu" className="h-6 w-6" /></button>
        <Link to={home} viewTransition className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{t('appName', 'One Voice 27')}</Link>
        <Link to={`${home}/bible/search`} viewTransition aria-label={t('bible.search', 'Search the Bible')} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"><AppIcon name="search" className="h-5 w-5" /></Link>
      </div>
    </header>

    {open && <div className="no-print fixed inset-0 z-50 bg-slate-950/45" onMouseDown={() => setOpen(false)}>
      <aside className="h-full w-[min(86vw,340px)] overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-900" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between"><Link to={home} viewTransition onClick={() => setOpen(false)} className="text-lg font-bold text-slate-900 dark:text-white">{t('appName', 'One Voice 27')}</Link><button type="button" onClick={() => setOpen(false)} aria-label={t('common.close', 'Close')} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"><AppIcon name="close" className="h-5 w-5"/></button></div>
        <DrawerGroup icon="book" title={t('nav.bible', 'Bible')} open={bibleOpen} onToggle={() => setBibleOpen(!bibleOpen)}>
          <DrawerLink to={`${home}/bible/read`} icon="book" onClick={() => setOpen(false)}>{t('nav.bibleText', 'Read the Bible')}</DrawerLink>
          <DrawerLink to={`${home}/know-god`} icon="lesson" onClick={() => setOpen(false)}>{t('home.bars.studies', 'Know God and the Bible')}</DrawerLink>
          <DrawerLink to={`${home}/sabbath-school`} icon="lesson" onClick={() => setOpen(false)}>{t('nav.lessons', 'Sabbath School')}</DrawerLink>
          <DrawerLink to={`${home}/notes`} icon="notes" onClick={() => setOpen(false)}>{t('notes.title', 'My Bible Notes')}</DrawerLink>
          <DrawerLink to={`${home}/memory-verses`} icon="memory" onClick={() => setOpen(false)}>{t('flashcards.cta', 'Memorize Bible Verses')}</DrawerLink>
          <DrawerLink to={`${home}/occasions`} icon="occasion" onClick={() => setOpen(false)}>{t('occasions.cta', 'Verses for Every Occasion')}</DrawerLink>
        </DrawerGroup>
        <DrawerGroup icon="hope" title={t('nav.oneVoice', 'One Voice 27')} open={hopeOpen} onToggle={() => setHopeOpen(!hopeOpen)}>
          <DrawerLink to={`${home}/40-days`} icon="prayer" onClick={() => setOpen(false)}>{t('home.pray40', '40 Days of Prayer')}</DrawerLink>
          <DrawerLink to={`${home}/behopeful`} icon="lesson" onClick={() => setOpen(false)}>{t('edu.title', 'BeHopeful')}</DrawerLink>
          <DrawerLink to={`${home}/hope-groups`} icon="group" onClick={() => setOpen(false)}>{t('groups.title', 'Hope Groups')}</DrawerLink>
        </DrawerGroup>
        <DrawerGroup icon="prayer" title={t('nav.prayer', 'Prayer')} open={prayerOpen} onToggle={() => setPrayerOpen(!prayerOpen)}>
          <DrawerLink to={`${home}/prayer/texts`} icon="prayer" onClick={() => setOpen(false)}>{t('prayerTexts.cta', 'Scriptures for Prayer')}</DrawerLink>
          <DrawerLink to={`${home}/prayer-journal`} icon="prayer" onClick={() => setOpen(false)}>{t('prayers.title', 'Prayer Journal')}</DrawerLink>
        </DrawerGroup>
        <DrawerLink to={`${home}/contact`} icon="contact" onClick={() => setOpen(false)}>{t('contact.title', 'Contact')}</DrawerLink>
        <div className="my-3 border-t border-slate-200 dark:border-slate-700"/>
        <DrawerLink to={`${home}/settings`} icon="settings" onClick={() => setOpen(false)}>{t('nav.settings', 'Settings')}</DrawerLink>
      </aside>
    </div>}

    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.3rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
      <div className="mx-auto grid max-w-xl grid-cols-3">
        {bottom.map((item) => {
          const active = pathname.startsWith(item.to)
          const hope = item.icon === 'hope'
          const state = hope
            ? 'hope-bottom-nav'
            : active
              ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 ring-1 ring-blue-200 shadow-sm dark:from-sky-400/20 dark:to-indigo-400/20 dark:text-sky-200 dark:ring-sky-300/30'
              : 'text-slate-500 dark:text-slate-400'
          return <Link key={item.to} to={item.to} viewTransition aria-label={item.label} className={`flex min-h-[62px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition ${state}`}><AppIcon name={item.icon} className="h-8 w-8"/><span className="flex flex-col items-center leading-tight">{item.label}</span></Link>
        })}
      </div>
    </nav>
  </>
}
