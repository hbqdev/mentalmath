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
const PENDING = new Set<string>(mappedIds.filter((id) => !/^ch[1234]-/.test(id)))

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

  it('has the expected problem counts for chapters 2 and 3', () => {
    const counts = Object.fromEntries(allBookSets().filter((s) => /^ch[23]-/.test(s.id)).map((s) => [s.id, s.problems.length]))
    expect(counts).toEqual({
      'ch2-2-by-1-multiplication': 20,
      'ch2-3-by-1-multiplication': 36,
      'ch2-two-digit-squares': 20,
      'ch3-multiplying-by-11': 3,
      'ch3-2-by-2-addition-method': 11,
      'ch3-2-by-2-subtraction-method': 11,
      'ch3-2-by-2-factoring-method': 12,
      'ch3-2-by-2-general-multiplication': 33,
      'ch3-three-digit-squares': 11,
      'ch3-two-digit-cubes': 16,
    })
  })

  it('keeps the book\'s alternative routes where it printed them', () => {
    const p = allBookSets().find((s) => s.id === 'ch2-2-by-1-multiplication')!.problems[5]!
    expect(p.steps).toEqual(['50 × 9 = 450', '1 × 9 = 9', '450 − 9 = 441'])
    const f = allBookSets().find((s) => s.id === 'ch3-2-by-2-factoring-method')!.problems[0]!
    expect(f.steps[0]).toBe('14 = 7 × 2')
  })

  it('has the expected problem counts for chapter 4 and exact twelfths', () => {
    const counts = Object.fromEntries(allBookSets().filter((s) => /^ch4-/.test(s.id)).map((s) => [s.id, s.problems.length]))
    expect(counts).toEqual({
      'ch4-one-digit-division': 6,
      'ch4-two-digit-division': 6,
      'ch4-decimalization': 12,
      'ch4-testing-for-divisibility': 40,
      'ch4-multiplying-fractions': 4,
      'ch4-dividing-fractions': 3,
      'ch4-simplifying-fractions': 8,
      'ch4-adding-fractions-equal-denominators': 4,
      'ch4-adding-fractions-unequal-denominators': 7,
      'ch4-subtracting-fractions': 9,
    })
    const twelfths = allBookSets().find((s) => s.id === 'ch4-simplifying-fractions')!.problems[0]!
    expect(twelfths.prompt).toEqual({ kind: 'fraction-task', value: { num: 1, den: 3 }, task: 'rewrite', den: 12 })
    expect(check(twelfths.answer, '4/12').correct).toBe(true)
    expect(check(twelfths.answer, '1/3').correct).toBe(false)
    const div = allBookSets().find((s) => s.id === 'ch4-one-digit-division')!.problems[0]!
    expect(check(div.answer, '35 3/9').correct).toBe(true)
    expect(check(div.answer, '35 r 3').correct).toBe(true)
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
