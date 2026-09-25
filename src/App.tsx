import { useEffect } from 'react'
import { createBrowserRouter, Outlet, useLocation, useParams } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { I18nProvider } from './i18n'
import { PlaceProvider } from './place'
import { ThemeProvider } from './theme'
import { AppNavigation } from './components/AppNavigation'
import { AddNoteFab } from './components/AddNoteFab'
import { usePinchFontScale } from './components/FontScale'
import { LangGate } from './pages/LangGate'
import { Home } from './pages/Home'
import { CategoryPage } from './pages/CategoryPage'
import { SearchPage } from './pages/SearchPage'
import { Reader } from './pages/Reader'
import { About } from './pages/About'
import { Flashcards } from './pages/Flashcards'
import { Occasions } from './pages/Occasions'
import { Notes, NoteEdit } from './pages/Notes'
import { Prayers } from './pages/Prayers'
import { PrayerTexts } from './pages/PrayerTexts'
import { Pray40, Pray40DayPage } from './pages/Pray40'
import { Edu, EduItemPage } from './pages/Edu'
import { Groups, GroupItemPage } from './pages/Groups'
import { Account } from './pages/Account'
import { BibleBookmarksPage, BibleChapterPage, BiblePage } from './pages/Bible'
import { BibleSearchPage } from './pages/BibleSearch'
import { BibleModulesPage } from './pages/BibleModules'
import { Hope } from './pages/Hope'
import { Settings } from './pages/Settings'
import { Contact } from './pages/Contact'
import { BibleHub, BibleStudies, PrayerHub } from './pages/SectionHubs'
import { BibleLessons } from './pages/BibleLessons'
import { initAppInstall } from './lib/installApp'
import { trackPageView } from './lib/analytics'

registerSW({ immediate: true })
initAppInstall()

function LangLayout() {
  const { lang = 'en' } = useParams()
  const location = useLocation()
  // szczypanie dwoma palcami w tresci do czytania zmienia wielkosc tekstu
  usePinchFontScale()
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])
  return (
    <ThemeProvider>
      <I18nProvider lang={lang}>
        <PlaceProvider>
          <div className="min-h-full flex flex-col">
            <AppNavigation />
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24">
              <Outlet />
            </main>
            <AddNoteFab />
          </div>
        </PlaceProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export const router = createBrowserRouter(
  [
    { path: '/', element: <LangGate /> },
    {
      path: '/:lang',
      element: <LangLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'c/:category', element: <CategoryPage /> },
        { path: 'search', element: <SearchPage /> },
        { path: 's/:id', element: <Reader /> },
        { path: 'about', element: <About /> },
        { path: 'bible', element: <BibleHub /> },
        { path: 'bible/read', element: <BiblePage /> },
        { path: 'bible/search', element: <BibleSearchPage /> },
        { path: 'bible/bookmarks', element: <BibleBookmarksPage /> },
        { path: 'bible/translations', element: <BibleModulesPage /> },
        { path: 'bible/:book/:chapter', element: <BibleChapterPage /> },
        { path: 'memory-verses', element: <Flashcards /> },
        { path: 'occasions', element: <Occasions /> },
        { path: 'prayer', element: <PrayerHub /> },
        { path: 'prayer/texts', element: <PrayerTexts /> },
        { path: 'prayer-journal', element: <Prayers /> },
        { path: '40-days', element: <Pray40 /> },
        { path: '40-days/:day', element: <Pray40DayPage /> },
        { path: 'behopeful', element: <Edu /> },
        { path: 'behopeful/:nr', element: <EduItemPage /> },
        { path: 'hope-groups', element: <Groups /> },
        { path: 'hope-groups/:id', element: <GroupItemPage /> },
        { path: 'know-god', element: <BibleStudies /> },
        { path: 'sabbath-school', element: <BibleLessons /> },
        { path: 'one-voice-27', element: <Hope /> },
        { path: 'settings', element: <Settings /> },
        { path: 'contact', element: <Contact /> },
        { path: 'account', element: <Account /> },
        { path: 'notes', element: <Notes /> },
        { path: 'notes/:id', element: <NoteEdit /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
)
