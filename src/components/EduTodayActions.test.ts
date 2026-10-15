import { describe, expect, it } from 'vitest'
import { currentEdu } from './EduTodayActions'

const items = [
  { nr: 1, title: 'a', ref: '', date: '2026-10-15' },
  { nr: 2, title: 'b', ref: '', date: '2026-10-16' },
  { nr: 3, title: 'c', ref: '', date: '2026-10-18' },
]

describe('dzisiejszy material BeHopeful', () => {
  it('dzien z materialem', () => {
    expect(currentEdu(items, new Date('2026-10-16T09:00:00'))).toMatchObject({ entry: { nr: 2 }, state: 'today' })
  })
  it('dzien bez nowego - ostatni z data przed dzisiaj', () => {
    expect(currentEdu(items, new Date('2026-10-17T09:00:00'))).toMatchObject({ entry: { nr: 2 }, state: 'last' })
    expect(currentEdu(items, new Date('2026-11-30T09:00:00'))).toMatchObject({ entry: { nr: 3 }, state: 'last' })
  })
  it('przed startem - pierwszy', () => {
    expect(currentEdu(items, new Date('2026-10-01T09:00:00'))).toMatchObject({ entry: { nr: 1 }, state: 'before' })
  })
})
