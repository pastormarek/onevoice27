import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { loadEdu, loadEduItem, loadGroupItem, loadGroups } from '../content'
import { Edu, EduItemPage } from './Edu'
import { GroupItemPage, Groups } from './Groups'

vi.mock('../content', () => ({
  loadEdu: vi.fn(),
  loadEduItem: vi.fn(),
  loadGroups: vi.fn(),
  loadGroupItem: vi.fn(),
}))
vi.mock('../i18n', () => ({
  useI18n: () => ({ lang: 'en', t: (_path: string, fallback = '') => fallback }),
}))

// tresc angielska dopiero powstaje - brak pliku ma dawac zwykly komunikat, nie bialy ekran
describe('BeHopeful and Hope Groups without content yet', () => {
  it('shows the unavailable state for missing lists', async () => {
    vi.mocked(loadEdu).mockRejectedValue(new Error('404'))
    vi.mocked(loadGroups).mockRejectedValue(new Error('404'))
    render(<MemoryRouter><Edu /><Groups /></MemoryRouter>)

    expect(await screen.findByText('These talks are unavailable right now.')).toBeInTheDocument()
    expect(await screen.findByText('Hope Groups materials are temporarily unavailable.')).toBeInTheDocument()
  })

  it('shows a way back when a single item is missing', async () => {
    vi.mocked(loadEdu).mockRejectedValue(new Error('404'))
    vi.mocked(loadEduItem).mockRejectedValue(new Error('404'))
    vi.mocked(loadGroups).mockRejectedValue(new Error('404'))
    vi.mocked(loadGroupItem).mockRejectedValue(new Error('404'))
    render(
      <MemoryRouter initialEntries={['/en/behopeful/3']}>
        <Routes><Route path="/:lang/behopeful/:nr" element={<EduItemPage />} /></Routes>
      </MemoryRouter>
    )
    expect(await screen.findByRole('link', { name: /Back to all talks/ })).toHaveAttribute('href', '/en/behopeful')

    render(
      <MemoryRouter initialEntries={['/en/hope-groups/X1']}>
        <Routes><Route path="/:lang/hope-groups/:id" element={<GroupItemPage />} /></Routes>
      </MemoryRouter>
    )
    expect(await screen.findByRole('link', { name: /Back to Hope Groups/ })).toHaveAttribute('href', '/en/hope-groups')
  })

  it('labels a Scripture fragment with its translation code and marks key questions', async () => {
    vi.mocked(loadGroups).mockRejectedValue(new Error('404'))
    vi.mocked(loadGroupItem).mockResolvedValue({
      id: 'X1', tytul: 'Test meeting', seria: 'Series', tryb: '', poprzedni: null, nastepny: null,
      teksty: { p1: '', p2: '', p3: '' }, przekladBazowy: 'BSB', dlugosc: { p1: 30 }, liczbaPytan: { p1: 1 },
      tagi: [], wersja: 1, zdanie: '',
      bloki: [{
        typ: 'blok', poziom: 1, tytul: 'Read', numer: 1, elementy: [
          { typ: 'pismo', poziom: 1, fragmenty: [{ odnosnik: 'John 3:16', przeklad: 'BSB', akapity: ['Placeholder text'] }] },
          { typ: 'pytanie', poziom: 1, id: 'q1', kluczowe: true, opcjonalne: false, tekst: 'What stands out?' },
        ],
      }],
    })
    render(
      <MemoryRouter initialEntries={['/en/hope-groups/X1']}>
        <Routes><Route path="/:lang/hope-groups/:id" element={<GroupItemPage />} /></Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('(BSB)')).toBeInTheDocument()
    expect(screen.getByText('Key question')).toBeInTheDocument()
    expect(screen.getByText('about 30 min · 1 question')).toBeInTheDocument()
  })
})
