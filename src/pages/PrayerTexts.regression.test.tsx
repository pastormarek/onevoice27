import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadBible, loadPrayerTexts } from '../content'
import { PrayerTexts } from './PrayerTexts'

vi.mock('../content', () => ({ loadPrayerTexts: vi.fn(), loadBible: vi.fn() }))
vi.mock('../i18n', () => ({
  useI18n: () => ({ lang: 'en', t: (_path: string, fallback = '') => fallback }),
}))

const data = {
  lang: 'en',
  translation: 'WEB',
  title: 'Scriptures for Prayer',
  groups: [
    { id: 'praise', name: 'Praise', verses: [{ osis: 'Ps.150.1', ref: 'Psalm 150:1' }] },
    { id: 'confession', name: 'Confession', verses: [{ osis: 'Ps.51.1', ref: 'Psalm 51:1' }] },
    { id: 'requests', name: 'Requests', verses: [{ osis: 'Matt.7.7', ref: 'Matthew 7:7' }] },
    {
      id: 'thanksgiving',
      name: 'Thanksgiving',
      verses: [
        { osis: 'Ps.100.4', ref: 'Psalm 100:4' },
        { osis: 'Ps.118.1', ref: 'Psalm 118:1' },
      ],
    },
  ],
}

// teksty zastepcze - test sprawdza uklad, nie brzmienie przekladu
const bible = {
  translation: 'WEB',
  name: 'World English Bible',
  lang: 'en',
  verses: {
    'Ps.150.1': 'For the Chief Musician. Verse text one',
    'Ps.51.1': 'Verse text two',
    'Matt.7.7': 'Verse text three',
    'Ps.100.4': 'Verse text four',
    'Ps.118.1': 'Verse text five',
  },
}

describe('Scriptures for Prayer — regression', () => {
  beforeEach(() => {
    vi.mocked(loadPrayerTexts).mockResolvedValue(data as never)
    vi.mocked(loadBible).mockResolvedValue(bible as never)
  })

  it('in random mode shows one verse from each of the four groups', async () => {
    render(<MemoryRouter><PrayerTexts /></MemoryRouter>)

    for (const name of ['Praise', 'Confession', 'Requests', 'Thanksgiving']) {
      expect(await screen.findByRole('heading', { name })).toBeInTheDocument()
    }
    expect(screen.getAllByText(/Psalm|Matthew/)).toHaveLength(4)
  })

  it('strips the psalm superscription from the prayer text', async () => {
    render(<MemoryRouter><PrayerTexts /></MemoryRouter>)

    expect(await screen.findByText('Verse text one')).toBeInTheDocument()
  })

  it('pressing “Random” again draws a new set', async () => {
    render(<MemoryRouter><PrayerTexts /></MemoryRouter>)

    const first = (await screen.findByRole('heading', { name: 'Thanksgiving' }))
      .closest('section')!.querySelector('.text-brand')!.textContent
    await userEvent.click(screen.getByRole('button', { name: 'Random' }))

    await waitFor(() => {
      const now = screen.getByRole('heading', { name: 'Thanksgiving' })
        .closest('section')!.querySelector('.text-brand')!.textContent
      expect(now).not.toBe(first)
    })
  })

  it('in list mode shows every verse in the chosen group', async () => {
    render(<MemoryRouter><PrayerTexts /></MemoryRouter>)

    await userEvent.click(await screen.findByRole('button', { name: 'Choose from list' }))
    await userEvent.click(screen.getByRole('button', { name: /Thanksgiving/ }))

    await waitFor(() => expect(screen.getByText('Psalm 100:4')).toBeInTheDocument())
    expect(screen.getByText('Psalm 118:1')).toBeInTheDocument()
  })

  it('links back to the Prayer section', async () => {
    render(<MemoryRouter><PrayerTexts /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: /Prayer/ })).toHaveAttribute('href', '/en/prayer')
  })
})
