import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPray40 } from '../content'
import { setRead } from '../lib/progress'
import { Home } from './Home'

vi.mock('../content', () => ({ loadPray40: vi.fn() }))
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

// wydanie angielskie: dni bez dat akcji
const index = {
  lang: 'en',
  days: [
    { day: 1, title: 'First reading', ref: 'Gen 1', lead: '...' },
    { day: 2, title: 'Second reading', ref: 'Gen 2', lead: '...' },
  ],
}

describe('home page — current reading regression', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(loadPray40).mockResolvedValue(index)
  })
  afterEach(() => localStorage.clear())

  it('without dates starts with Day 1 and links to the full list', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: 'Start with Day 1' })).toHaveAttribute('href', '/en/40-days/1')
    expect(screen.getByRole('link', { name: 'All 40 days' })).toHaveAttribute('href', '/en/40-days')
  })

  it('without dates continues with the first unread day', async () => {
    setRead('pray40', 1, true)
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: 'Continue: Day 2' })).toHaveAttribute('href', '/en/40-days/2')
  })
})
