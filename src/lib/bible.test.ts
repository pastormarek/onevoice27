import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { formatRef, parseRef } from './bible'
import type { BibleIndex } from '../types'

const index = JSON.parse(readFileSync('public/content/en/bible/BSB/index.json', 'utf8')) as BibleIndex
const books = index.books

const parsed = (input: string) => {
  const r = parseRef(input, books)
  return r && [r.book.osis, r.chapter, r.verse, r.verseTo]
}

describe('English reference parser', () => {
  it('reads full names, abbreviations and both separators', () => {
    expect(parsed('John 3:16')).toEqual(['John', 3, 16, undefined])
    expect(parsed('Jn 3,16')).toEqual(['John', 3, 16, undefined])
    expect(parsed('Gen 3:1-5')).toEqual(['Gen', 3, 1, 5])
    expect(parsed('Gn 1')).toEqual(['Gen', 1, undefined, undefined])
    expect(parsed('Genesis 1:1')).toEqual(['Gen', 1, 1, undefined])
  })

  it('handles numbered books and ordinals', () => {
    expect(parsed('1 Corinthians 13:4')).toEqual(['1Cor', 13, 4, undefined])
    expect(parsed('1 Cor 13')).toEqual(['1Cor', 13, undefined, undefined])
    expect(parsed('1Cor 13:1')).toEqual(['1Cor', 13, 1, undefined])
    expect(parsed('First John 4:8')).toEqual(['1John', 4, 8, undefined])
    expect(parsed('II Kings 2:11')).toEqual(['2Kgs', 2, 11, undefined])
  })

  it('knows Psalm/Psalms and Song of Songs/Solomon', () => {
    expect(parsed('Psalm 23')).toEqual(['Ps', 23, undefined, undefined])
    expect(parsed('Psalms 23:1')).toEqual(['Ps', 23, 1, undefined])
    expect(parsed('Ps 119:105')).toEqual(['Ps', 119, 105, undefined])
    expect(parsed('Song of Songs 2:4')).toEqual(['Song', 2, 4, undefined])
    expect(parsed('Song of Solomon 2:4')).toEqual(['Song', 2, 4, undefined])
    expect(parsed('Isaiah 53:5')).toEqual(['Isa', 53, 5, undefined])
    expect(parsed('Rev 21:4')).toEqual(['Rev', 21, 4, undefined])
  })

  it('formats references with a colon', () => {
    const john = books.find((b) => b.osis === 'John')!
    expect(formatRef(john, 3, 16)).toBe('John 3:16')
    expect(formatRef(john, 3, 16, 18)).toBe('John 3:16-18')
    expect(formatRef(john, 3)).toBe('John 3')
  })
})
