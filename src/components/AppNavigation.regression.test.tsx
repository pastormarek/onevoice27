import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppNavigation } from './AppNavigation'

vi.mock('../i18n', () => ({
  useI18n: () => ({ lang: 'en', t: (_path: string, fallback = '') => fallback }),
}))

describe('app navigation — regression', () => {
  it('opens the drawer and expands the One Voice 27 group independently', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/en']}><AppNavigation /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const drawer = screen.getByRole('complementary')
    await user.click(within(drawer).getByRole('button', { name: 'One Voice 27' }))

    expect(within(drawer).getByRole('link', { name: '40 Days of Prayer' })).toHaveAttribute('href', '/en/40-days')
    expect(within(drawer).getByRole('link', { name: 'Know God and the Bible' })).toHaveAttribute('href', '/en/know-god')
    expect(within(drawer).queryByText(/songs|hymnal/i)).toBeNull()
  })

  it('keeps three main items in the bottom navigation', () => {
    render(<MemoryRouter initialEntries={['/en']}><AppNavigation /></MemoryRouter>)

    const bottom = within(screen.getByRole('navigation'))
    expect(bottom.getAllByRole('link')).toHaveLength(3)
    expect(bottom.getByRole('link', { name: 'Bible' })).toHaveAttribute('href', '/en/bible')
    expect(bottom.getByRole('link', { name: 'Prayer' })).toHaveAttribute('href', '/en/prayer')
    expect(bottom.getByRole('link', { name: 'One Voice 27' })).toHaveAttribute('href', '/en/one-voice-27')
  })
})
