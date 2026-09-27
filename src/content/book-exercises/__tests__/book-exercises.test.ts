// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { check, formatAnswer } from '@/exercises/checker'
import { allBookSets, bookExercises } from '@/exercises/bookSets'
import { answerMatchesReference } from '@/exercises/__tests__/generators/harness'
import '../index'

const bookMap = JSON.parse(
  readFileSync(new URL('../../../../scripts/book-map.json', import.meta.url), 'utf8'),
) as {
  exerciseSets: Record<string, string>
  exerciseAfter: Record<string, string>
}
const mappedIds = [
  ...new Set([...Object.values(bookMap.exerciseSets), ...Object.values(bookMap.exerciseAfter)]),
].sort()

// Sets whose data lands in later tasks of this plan; each task removes its ids from here.
const PENDING = new Set<string>()

describe('book exercise data', () => {
  it('covers every curated set id and nothing else', () => {
    const registered = allBookSets()
      .map((s) => s.id)
      .sort()
    const expected = mappedIds.filter((id) => !PENDING.has(id))
    expect(registered).toEqual(expected)
  })

  it('numbers problems 1..n and gives every problem steps ending at the answer', () => {
    for (const set of allBookSets()) {
      expect(
        set.problems.map((p) => p.n),
        set.id,
      ).toEqual(set.problems.map((_, i) => i + 1))
      for (const p of set.problems) {
        const label = `${set.id} #${p.n}`
        expect(p.steps.length, label).toBeGreaterThan(0)
        if (
          p.answer.kind !== 'phonetic' &&
          p.answer.kind !== 'text' &&
          p.answer.kind !== 'choice'
        ) {
          const shown = formatAnswer(p.answer)
            .replace(/^≈ /, '')
            .replace(/ remainder .*/, '')
            .replace(/,/g, '')
          expect(p.steps.at(-1)!.replace(/,/g, ''), label).toContain(shown)
        }
      }
    }
  })

  it('answers agree with an independent computation wherever one exists', () => {
    for (const set of allBookSets()) {
      for (const p of set.problems) {
        expect(
          answerMatchesReference(p.prompt, p.answer),
          `${set.id} #${p.n} ${JSON.stringify(p.prompt)}`,
        ).toBe(true)
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
    expect(xs[0]).toMatchObject({
      id: 'ch1-two-digit-addition-1',
      setId: 'ch1-two-digit-addition',
      source: 'book',
    })
    expect(xs[0]?.solution?.steps).toEqual(['23 + 10 = 33', '33 + 6 = 39'])
    expect(xs[14]).toBeUndefined()
  })

  it('has the expected problem counts for chapters 2 and 3', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => /^ch[23]-/.test(s.id))
        .map((s) => [s.id, s.problems.length]),
    )
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

  it("keeps the book's alternative routes where it printed them", () => {
    const p = allBookSets().find((s) => s.id === 'ch2-2-by-1-multiplication')!.problems[5]!
    expect(p.steps).toEqual([
      '40 × 9 = 360',
      '9 × 9 = 81',
      '360 + 81 = 441',
      'or 50 × 9 − 9 = 450 − 9 = 441',
    ])
    const f = allBookSets().find((s) => s.id === 'ch3-2-by-2-factoring-method')!.problems[0]!
    expect(f.steps[0]).toBe('14 = 7 × 2')
  })

  it('has the expected problem counts for chapter 4 and exact twelfths', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => /^ch4-/.test(s.id))
        .map((s) => [s.id, s.problems.length]),
    )
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
    expect(twelfths.prompt).toEqual({
      kind: 'fraction-task',
      value: { num: 1, den: 3 },
      task: 'rewrite',
      den: 12,
    })
    expect(check(twelfths.answer, '4/12').correct).toBe(true)
    expect(check(twelfths.answer, '1/3').correct).toBe(false)
    const div = allBookSets().find((s) => s.id === 'ch4-one-digit-division')!.problems[0]!
    expect(check(div.answer, '35 3/9').correct).toBe(true)
    expect(check(div.answer, '35 r 3').correct).toBe(true)
  })

  it('has the expected problem counts for chapter 5 and accepts the book estimates', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => /^ch5-/.test(s.id))
        .map((s) => [s.id, s.problems.length]),
    )
    expect(counts).toEqual({
      'ch5-addition-guesstimation': 5,
      'ch5-subtraction-guesstimation': 4,
      'ch5-division-guesstimation': 5,
      'ch5-multiplication-guesstimation': 10,
      'ch5-square-root-guesstimation': 5,
      'ch5-everyday-math': 9,
    })
    const add = allBookSets().find((s) => s.id === 'ch5-addition-guesstimation')!.problems
    expect(check(add[0]!.answer, '2600').correct).toBe(true)
    expect(check(add[0]!.answer, '2584').correct).toBe(true)
    expect(check(add[4]!.answer, '47').correct).toBe(true)
    const sq = allBookSets().find((s) => s.id === 'ch5-square-root-guesstimation')!.problems
    expect(check(sq[0]!.answer, '4.1').correct).toBe(true)
    const every = allBookSets().find((s) => s.id === 'ch5-everyday-math')!.problems
    expect(check(every[0]!.answer, '13.20').correct).toBe(true)
    expect(check(every[4]!.answer, '12').correct).toBe(true)
  })

  it('has the expected problem counts for chapter 6 and checks cents', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => /^ch6-/.test(s.id))
        .map((s) => [s.id, s.problems.length]),
    )
    expect(counts).toEqual({
      'ch6-columns-of-numbers': 2,
      'ch6-subtracting-on-paper': 4,
      'ch6-square-root-guesstimation': 4,
      'ch6-pencil-and-paper-multiplication': 6,
    })
    const cols = allBookSets().find((s) => s.id === 'ch6-columns-of-numbers')!.problems
    expect(cols[1]!.prompt).toMatchObject({ kind: 'columns', unit: '$' })
    expect(check(cols[1]!.answer, '288.72').correct).toBe(true)
    expect(check(cols[1]!.answer, '288.70').correct).toBe(false)
    const roots = allBookSets().find((s) => s.id === 'ch6-square-root-guesstimation')!.problems
    expect(check(roots[3]!.answer, '19').correct).toBe(true)
    expect(check(roots[0]!.answer, '3.87').correct).toBe(true)
  })

  it('has the expected problem counts for chapters 8 and 9', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => /^ch[89]-/.test(s.id))
        .map((s) => [s.id, s.problems.length]),
    )
    expect(counts).toEqual({
      'ch8-four-digit-squares': 6,
      'ch8-3-by-2-multiplication': 34,
      'ch8-five-digit-squares': 6,
      'ch8-3-by-3-multiplication': 19,
      'ch8-5-by-5-multiplication': 4,
      'ch9-a-day-for-any-date': 10,
    })
    const dates = allBookSets().find((s) => s.id === 'ch9-a-day-for-any-date')!.problems
    expect(dates[0]!.answer).toMatchObject({ kind: 'choice', correct: 'Friday' })
    expect(dates[6]!.answer).toMatchObject({ kind: 'choice', correct: 'Thursday' })
    expect(dates[8]!.prompt).toMatchObject({ kind: 'text' })
    expect(check(dates[8]!.answer, 'No such date').correct).toBe(true)
    const big = allBookSets().find((s) => s.id === 'ch8-5-by-5-multiplication')!.problems[0]!
    expect(big.answer).toEqual({ kind: 'integer', value: 65154 * 19423 })
  })

  it('has the expected problem counts for chapter 1', () => {
    const counts = Object.fromEntries(
      allBookSets()
        .filter((s) => s.id.startsWith('ch1-'))
        .map((s) => [s.id, s.problems.length]),
    )
    expect(counts).toEqual({
      'ch1-two-digit-addition': 10,
      'ch1-three-digit-addition': 15,
      'ch1-two-digit-subtraction': 10,
      'ch1-three-digit-subtraction': 15,
    })
  })

  it('accepts every guesstimate the book prints (last step before the exact value)', () => {
    const scale: Record<string, number> = { million: 1e6, billion: 1e9, trillion: 1e12 }
    for (const set of allBookSets().filter((s) => /^ch5-.*guesstimation$/.test(s.id))) {
      for (const p of set.problems) {
        const shown = p.steps.filter((st) => !st.startsWith('Exact')).at(-1)!
        for (const segment of shown.split(' (or ')) {
          const tokens = [
            ...segment.matchAll(/\$?([\d][\d,]*(?:\.\d+)?)(?:\s*(million|billion|trillion))?/g),
          ]
          const last = tokens.at(-1)!
          const value = Number(last[1]!.replace(/,/g, '')) * (scale[last[2] ?? ''] ?? 1)
          expect(
            check(p.answer, String(value)).correct,
            `${set.id} #${p.n}: ${segment} -> ${value}`,
          ).toBe(true)
        }
      }
    }
  })

  it('keeps chapter 3 operands in the order the exercise figures print them', () => {
    const order = (id: string) =>
      allBookSets()
        .find((s) => s.id === id)!
        .problems.map((p) =>
          p.prompt.kind === 'binary'
            ? [p.prompt.a, p.prompt.b]
            : p.prompt.kind === 'power'
              ? [p.prompt.base, p.prompt.base]
              : [],
        )
    // ch3-f027
    expect(order('ch3-2-by-2-factoring-method')).toEqual([
      [27, 14],
      [86, 28],
      [57, 14],
      [81, 48],
      [56, 29],
      [83, 18],
      [72, 17],
      [85, 42],
      [33, 16],
      [62, 77],
      [45, 36],
      [48, 37],
    ])
    // ch3-f030, f031, f032 (#20 is printed 53 × 15; the Answers key works 53²)
    expect(order('ch3-2-by-2-general-multiplication')).toEqual([
      [53, 39],
      [81, 57],
      [73, 18],
      [89, 55],
      [77, 36],
      [92, 53],
      [87, 87],
      [67, 58],
      [56, 37],
      [59, 21],
      [37, 72],
      [57, 73],
      [38, 63],
      [43, 76],
      [43, 75],
      [74, 62],
      [61, 37],
      [36, 41],
      [54, 53],
      [53, 15],
      [83, 58],
      [91, 46],
      [52, 47],
      [29, 26],
      [41, 15],
      [65, 19],
      [34, 27],
      [69, 78],
      [95, 81],
      [65, 47],
      [65, 69],
      [95, 26],
      [41, 93],
    ])
  })

  it('splits and factors the way the book does where it differs from the default', () => {
    const by = (id: string, n: number) => allBookSets().find((s) => s.id === id)!.problems[n - 1]!
    expect(by('ch3-2-by-2-addition-method', 3).steps[0]).toBe('59 = 50 + 9')
    expect(by('ch3-2-by-2-addition-method', 8).steps[0]).toBe('88 = 80 + 8')
    expect(by('ch3-2-by-2-general-multiplication', 6).steps[0]).toBe('53 = 50 + 3')
    expect(by('ch3-2-by-2-general-multiplication', 32).steps[0]).toBe('26 = 20 + 6')
    expect(by('ch3-2-by-2-general-multiplication', 15).steps).toEqual([
      '75 = 5 × 5 × 3',
      '43 × 5 = 215',
      '215 × 5 = 1075',
      '1075 × 3 = 3225',
    ])
    expect(by('ch3-2-by-2-general-multiplication', 20).steps[0]).toBe('15 = 5 × 3')
    // chapter 4: the book's route for 7 and 17, and shared denominators when one divides the other
    const div = allBookSets().find((s) => /^ch4-.*divisib/.test(s.id))!.problems
    const seven = div.find(
      (p) => p.prompt.kind === 'divisible' && p.prompt.by === 7 && p.prompt.n === 5784,
    )
    if (seven) expect(seven.steps[0]).toContain('57 is not a multiple of 7')
    const fr = allBookSets()
      .flatMap((s) => s.problems)
      .find(
        (p) =>
          p.prompt.kind === 'fraction-binary' &&
          p.prompt.op === '+' &&
          p.prompt.a.den !== p.prompt.b.den &&
          p.prompt.b.den % p.prompt.a.den === 0,
      )
    if (fr) expect(fr.steps[0]).toMatch(/^\d+\/\d+ = \d+\/\d+$/)
    // chapter 8 follows the printed routes
    const three = allBookSets().find((s) => s.id === 'ch8-3-by-3-multiplication')!.problems
    expect(three[1]!.steps[0]).toBe('596 = 600 − 4')
    expect(three[3]!.steps[0]).toBe('343 = 7 × 7 × 7')
    expect(three[5]!.steps[0]).toBe('942 = 900 + 42, 879 = 900 − 21')
    expect(three[6]!.steps[0]).toBe('692 = 700 − 8, 644 = 700 − 56')
    const five = allBookSets().find((s) => s.id === 'ch8-five-digit-squares')!.problems
    expect(five[0]!.steps).toContain('35,775 × 2,000 = 71,550,000')
    expect(five[1]!.steps).toContain('231² = 262 × 200 + 31² = 53,361')
    const big5 = allBookSets().find((s) => s.id === 'ch8-5-by-5-multiplication')!.problems[0]!
    expect(big5.steps).toContain('(27,495 + 2,926) × 1,000 = 30,421,000')
  })
})
