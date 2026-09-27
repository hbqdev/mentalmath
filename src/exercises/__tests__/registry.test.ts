// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chapterIndex } from '@/content/loader'
import { allSetsFor, bookSetsFor, findSet, generatedSetsFor, generatedTwin, setTitle } from '../registry'

const bookMap = JSON.parse(readFileSync(new URL('../../../scripts/book-map.json', import.meta.url), 'utf8')) as {
  exerciseSets: Record<string, string>
  exerciseAfter: Record<string, string>
}
const mappedIds = new Set([...Object.values(bookMap.exerciseSets), ...Object.values(bookMap.exerciseAfter)])

describe('registry', () => {
  it('lists every curated book set with its anchoring section', () => {
    const all = chapterIndex.flatMap((c) => bookSetsFor(c.id))
    expect(new Set(all.map((s) => s.id))).toEqual(mappedIds)
    for (const s of all) {
      const ch = chapterIndex.find((c) => c.id === s.chapterId)!
      expect(ch.sections.map((x) => x.id), s.id).toContain(s.sectionId)
    }
  })
  it('orders sets by section then book before generated', () => {
    const sets = allSetsFor('1')
    const sectionOrder = chapterIndex.find((c) => c.id === '1')!.sections.map((s) => s.id)
    const idx = sets.map((s) => sectionOrder.indexOf(s.kind === 'book' ? s.ref.sectionId : s.def.sectionId))
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
    expect(sets[0]?.kind).toBe('book')
    expect(generatedSetsFor('1')).toHaveLength(4)
  })
  it('finds sets by id within a chapter only', () => {
    expect(findSet('1', 'ch1-two-digit-addition')?.kind).toBe('book')
    expect(findSet('1', 'gen1-two-digit-addition')?.kind).toBe('generated')
    expect(findSet('2', 'gen1-two-digit-addition')).toBeUndefined()
    expect(findSet('1', 'nope')).toBeUndefined()
  })
  it('resolves generated twins and every twin id exists', () => {
    expect(generatedTwin('ch1-two-digit-addition')?.id).toBe('gen1-two-digit-addition')
    expect(generatedTwin('ch4-adding-fractions-unequal-denominators')?.id).toBe('gen4-adding-fractions')
    for (const def of chapterIndex.flatMap((c) => generatedSetsFor(c.id))) {
      for (const b of def.coversBookSets ?? []) expect(mappedIds.has(b), `${def.id} covers ${b}`).toBe(true)
    }
  })
  it('titles set ids like the book', () => {
    expect(setTitle('ch9-a-day-for-any-date')).toBe('A Day for Any Date')
    expect(setTitle('ch8-3-by-2-multiplication')).toBe('3-by-2 Multiplication')
    expect(setTitle('ch4-adding-fractions-equal-denominators')).toBe('Adding Fractions (Equal Denominators)')
    expect(setTitle('ch1-two-digit-addition')).toBe('Two-Digit Addition')
    expect(setTitle('ch2-2-by-1-multiplication')).toBe('2-by-1 Multiplication')
  })
})
