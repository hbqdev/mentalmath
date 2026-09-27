// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { check, formatAnswer } from '@/exercises/checker'
import { allBookSets, bookExercises } from '@/exercises/bookSets'
import { answerMatchesReference } from '@/exercises/__tests__/generators/harness'
import '../index'

const bookMap = JSON.parse(readFileSync(new URL('../../../../scripts/book-map.json', import.meta.url), 'utf8')) as {
  exerciseSets: Record<string, string>
  exerciseAfter: Record<string, string>
}
const mappedIds = [...new Set([...Object.values(bookMap.exerciseSets), ...Object.values(bookMap.exerciseAfter)])].sort()

// Sets whose data lands in later tasks of this plan; each task removes its ids from here.
const PENDING = new Set<string>(mappedIds.filter((id) => !id.startsWith('ch1-')))

describe('book exercise data', () => {
  it('covers every curated set id and nothing else', () => {
    const registered = allBookSets().map((s) => s.id).sort()
    const expected = mappedIds.filter((id) => !PENDING.has(id))
    expect(registered).toEqual(expected)
  })

  it('numbers problems 1..n and gives every problem steps ending at the answer', () => {
    for (const set of allBookSets()) {
      expect(set.problems.map((p) => p.n), set.id).toEqual(set.problems.map((_, i) => i + 1))
      for (const p of set.problems) {
        const label = `${set.id} #${p.n}`
        expect(p.steps.length, label).toBeGreaterThan(0)
        if (p.answer.kind !== 'phonetic' && p.answer.kind !== 'text' && p.answer.kind !== 'choice') {
          const shown = formatAnswer(p.answer).replace(/^≈ /, '').replace(/ remainder .*/, '').replace(/,/g, '')
          expect(p.steps.at(-1)!.replace(/,/g, ''), label).toContain(shown)
        }
      }
    }
  })

  it('answers agree with an independent computation wherever one exists', () => {
    for (const set of allBookSets()) {
      for (const p of set.problems) {
        expect(answerMatchesReference(p.prompt, p.answer), `${set.id} #${p.n} ${JSON.stringify(p.prompt)}`).toBe(true)
      }
    }
  })

  it('accepts the shown answer through the checker', () => {
    for (const set of allBookSets()) {
      for (const p of set.problems) {
        if (p.answer.kind === 'phonetic' || p.answer.kind === 'text') continue
        const shown = formatAnswer(p.answer).replace(/^≈ /, '')
        expect(check(p.answer, shown).correct, `${set.id} #${p.n} -> ${shown}`).toBe(true)
      }
    }
  })

  it('exposes book exercises with ids, source and solution steps', () => {
    const xs = bookExercises('ch1-two-digit-addition')
    expect(xs).toHaveLength(10)
    expect(xs[0]).toMatchObject({ id: 'ch1-two-digit-addition-1', setId: 'ch1-two-digit-addition', source: 'book' })
    expect(xs[0]?.solution?.steps).toEqual(['23 + 10 = 33', '33 + 6 = 39'])
    expect(xs[14]).toBeUndefined()
  })

  it('has the expected problem counts for chapter 1', () => {
    const counts = Object.fromEntries(allBookSets().filter((s) => s.id.startsWith('ch1-')).map((s) => [s.id, s.problems.length]))
    expect(counts).toEqual({
      'ch1-two-digit-addition': 10,
      'ch1-three-digit-addition': 15,
      'ch1-two-digit-subtraction': 10,
      'ch1-three-digit-subtraction': 15,
    })
  })
})
