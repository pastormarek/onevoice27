import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPray40 } from '../content'
import { Hope } from './Hope'

vi.mock('../content', () => ({ loadPray40: vi.fn() }))
vi.mock('../i18n', () => ({
  useI18n: () => ({ lang: 'en', t: (_path: string, fallback = '') => fallback }),
}))

// kalendarz z datami nadal ma dzialac, gdyby daty kiedys wrocily
const index = {
  lang: 'en',
  days: [
    { day: 1, date: '2099-09-05', dateLabel: 'September 5', title: 'First reading', ref: 'Gen 1', lead: '...' },
    { day: 2, date: '2099-09-06', dateLabel: 'September 6', title: 'This title stays on the list', ref: 'Gen 2', lead: '...' },
  ],
}

describe('One Voice 27 — landing page regression', () => {
  beforeEach(() => vi.mocked(loadPray40).mockResolvedValue(index))

  it('shows two entries into the 40 days and does not expand the list', async () => {
    render(<MemoryRouter><Hope /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: 'Open the first day' })).toHaveAttribute('href', '/en/40-days/1')
    expect(screen.getByRole('link', { name: 'All 40 days' })).toHaveAttribute('href', '/en/40-days')
    expect(screen.queryByText('This title stays on the list')).not.toBeInTheDocument()
  })

  it('shows the #AllThingsNew theme banner under the One Voice 27 heading', async () => {
    render(<MemoryRouter><Hope /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'One Voice 27' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '#AllThingsNew' }).getAttribute('src')).toMatch(/allthingsnew\.png$/)
  })

  it('links to the BeHopeful and Hope Groups lists, not to a single item', async () => {
    render(<MemoryRouter><Hope /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: /BeHopeful/ })).toHaveAttribute('href', '/en/behopeful')
    expect(screen.getByRole('link', { name: /Hope Groups/ })).toHaveAttribute('href', '/en/hope-groups')
  })

  it('keeps a visible way back to the home page', async () => {
    render(<MemoryRouter><Hope /></MemoryRouter>)

    expect(await screen.findByRole('link', { name: /Home/ })).toHaveAttribute('href', '/en')
  })
})
