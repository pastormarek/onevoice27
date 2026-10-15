import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadEdu } from '../content'
import { Home } from './Home'

vi.mock('../content', () => ({ loadEdu: vi.fn() }))
vi.mock('../i18n', () => ({
  useI18n: () => ({ lang: 'en', t: (_path: string, fallback = '') => fallback }),
}))
vi.mock('../lib/sabbathSchool', () => ({
  fallbackUrl: () => 'https://example.com',
  findCurrentLesson: vi.fn().mockResolvedValue(null),
}))
vi.mock('../components/AppNavigation', () => ({ AppIcon: () => <span /> }))
vi.mock('../components/DailyOccasionVerse', () => ({ DailyOccasionVerse: () => <div /> }))
vi.mock('../components/PageHeading', () => ({ PageHeading: () => <div /> }))

// od 2026-10-15 biezacy material na stronie glownej = dzisiejszy BeHopeful (40 dni na stronie One Voice 27)
const index = {
  lang: 'en',
  items: [
    { nr: 1, date: '2026-10-15', dateLabel: 'Thursday, October 15', title: 'First talk', ref: '', audio: true },
    { nr: 2, date: '2026-10-16', dateLabel: 'Friday, October 16', title: 'Second talk', ref: '' },
  ],
}

describe('home page — today’s BeHopeful talk', () => {
  beforeEach(() => vi.mocked(loadEdu).mockResolvedValue(index))
  afterEach(() => vi.useRealTimers())

  it('on a talk’s date opens that talk and links to the full list', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-16T10:00:00'))
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: 'Open today’s talk' })).toHaveAttribute('href', '/en/behopeful/2')
    expect(screen.getByRole('link', { name: 'All talks' })).toHaveAttribute('href', '/en/behopeful')
    expect(screen.getByText('Second talk')).toBeInTheDocument()
  })

  it('before the series starts offers the first talk', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-01T10:00:00'))
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: 'Open the talk' })).toHaveAttribute('href', '/en/behopeful/1')
  })
})
