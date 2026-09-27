import { describe, expect, it } from 'vitest'
import { check } from '../../checker'
import { WEEKDAYS, dayOfWeek } from '../../dates'
import { sets as ch8 } from '../../generators/chapter8'
import { smallFactors, stepsBigProduct, stepsSquareNear } from '../../generators/shared'
import { sets as ch9 } from '../../generators/chapter9'
import { generatedSets } from '../../generators'
import { createRng } from '../../rng'
import type { GeneratedSetDef } from '../../types'
import { binary, checkSet, digitsOf, power } from './harness'

const byId = (xs: GeneratedSetDef[], id: string): GeneratedSetDef => {
  const s = xs.find((x) => x.id === id)
  if (!s) throw new Error(`missing set ${id}`)
  return s
}

describe('chapter 8 sets', () => {
  it('four- and five-digit squares', () => {
    checkSet(byId(ch8, 'gen8-four-digit-squares'), {
      precondition: (d) => power(d)!.exp === 2 && digitsOf(power(d)!.base) === 4,
    })
    checkSet(byId(ch8, 'gen8-five-digit-squares'), {
      precondition: (d) => power(d)!.exp === 2 && digitsOf(power(d)!.base) === 5,
    })
  })
  it('3-by-2, 3-by-3 and 5-by-5 products', () => {
    checkSet(byId(ch8, 'gen8-3-by-2'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 3 && digitsOf(binary(d)!.b) === 2,
    })
    checkSet(byId(ch8, 'gen8-3-by-3'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 3 && digitsOf(binary(d)!.b) === 3,
    })
    checkSet(byId(ch8, 'gen8-5-by-5'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 5 && digitsOf(binary(d)!.b) === 5,
    })
  })
  it('covers the chapter 8 book sets', () => {
    expect(ch8.flatMap((s) => s.coversBookSets ?? []).sort()).toEqual([
      'ch8-3-by-2-multiplication',
      'ch8-3-by-3-multiplication',
      'ch8-5-by-5-multiplication',
      'ch8-five-digit-squares',
      'ch8-four-digit-squares',
    ])
  })
})

describe('chapter 9 sets', () => {
  it('day for any date offers the seven weekdays and the right one is correct', () => {
    checkSet(byId(ch9, 'gen9-day-for-any-date'), {
      precondition: (d) =>
        d.prompt.kind === 'date' &&
        d.answer.kind === 'choice' &&
        d.answer.options.length === 7 &&
        d.answer.correct === dayOfWeek(d.prompt.iso),
      ranges: {
        easy: (d) => d.prompt.kind === 'date' && d.prompt.iso.startsWith('20'),
        hard: (d) => d.prompt.kind === 'date' && !d.prompt.iso.startsWith('20'),
      },
    })
    expect(WEEKDAYS).toHaveLength(7)
  })
  it('cube roots and square roots of perfect powers', () => {
    checkSet(byId(ch9, 'gen9-cube-roots'), {
      precondition: (d) =>
        d.prompt.kind === 'root' &&
        d.prompt.degree === 3 &&
        d.answer.kind === 'integer' &&
        d.answer.value ** 3 === d.prompt.radicand,
    })
    checkSet(byId(ch9, 'gen9-square-roots'), {
      precondition: (d) =>
        d.prompt.kind === 'root' &&
        d.prompt.degree === 2 &&
        d.answer.kind === 'integer' &&
        d.answer.value ** 2 === d.prompt.radicand,
    })
  })
  it('the magic tricks predict their forced results', () => {
    checkSet(byId(ch9, 'gen9-magic-1089'), {
      precondition: (d) => d.answer.kind === 'integer' && d.answer.value === 1089,
    })
    checkSet(byId(ch9, 'gen9-psychic-math'), { precondition: (d) => d.answer.kind === 'integer' })
    checkSet(byId(ch9, 'gen9-leapfrog'), {
      precondition: (d) =>
        d.prompt.kind === 'columns' &&
        d.prompt.numbers.length === 10 &&
        d.answer.kind === 'integer' &&
        d.answer.value === 11 * d.prompt.numbers[6]!,
    })
    checkSet(byId(ch9, 'gen9-missing-digit'), {
      precondition: (d) =>
        d.answer.kind === 'integer' && d.answer.value >= 0 && d.answer.value <= 9,
    })
  })
  it('missing digit uses the mod-9 rule correctly', () => {
    const def = byId(ch9, 'gen9-missing-digit')
    const rng = createRng(11)
    for (let i = 0; i < 50; i++) {
      const d = def.generate('medium', rng)
      if (d.prompt.kind !== 'text' || d.answer.kind !== 'integer') throw new Error('shape')
      const shown = (d.prompt.emphasis ?? '').replace(/\D/g, '')
      const sum = [...shown].reduce((s, c) => s + Number(c), 0)
      expect((sum + d.answer.value) % 9, d.prompt.text).toBe(0)
      expect(check(d.answer, String(d.answer.value)).correct).toBe(true)
    }
  })
})

describe('generated set index with chapters 8 and 9', () => {
  it('includes the new sets and keeps ids unique', () => {
    const ids = generatedSets.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expect.arrayContaining(['gen8-3-by-2', 'gen9-day-for-any-date']))
  })
})

describe('stepsBigProduct routes', () => {
  it('factors into pieces of 12 or less, two closest first', () => {
    expect(smallFactors(72)).toEqual([9, 8])
    expect(smallFactors(75)).toEqual([5, 5, 3])
    expect(smallFactors(343)).toEqual([7, 7, 7])
    expect(smallFactors(644)).toBeNull()
  })
  it("picks the book's route for its worked examples", () => {
    expect(stepsBigProduct(596, 167)).toEqual([
      '596 = 600 − 4',
      '600 × 167 = 100,200',
      '4 × 167 = 668',
      '100,200 − 668 = 99,532',
    ])
    expect(stepsBigProduct(942, 879)).toEqual([
      '942 = 900 + 42, 879 = 900 − 21',
      '900 × 921 = 828,900',
      '(+42) × (−21) = −882',
      '828,900 − 882 = 828,018',
    ])
    expect(stepsBigProduct(853, 325)).toEqual([
      '325 = 320 + 5',
      '853 × 320 = 272,960',
      '853 × 5 = 4,265',
      '272,960 + 4,265 = 277,225',
    ])
    expect(stepsBigProduct(65154, 19423).at(-1)).toBe('1,265,421,000 + 65,142 = 1,265,486,142')
  })
  it('squares four digits to the nearest thousand and five digits by splitting', () => {
    expect(stepsSquareNear(1234, 1000)).toEqual([
      '1234² = 1468 × 1000 + 234²',
      '1468 × 1000 = 1,468,000',
      '234² = 268 × 200 + 34² = 54,756',
      '34² = 38 × 30 + 4² = 1,156',
      '1,468,000 + 54,756 = 1,522,756',
    ])
    expect(stepsSquareNear(45795, 1000).at(-1)).toBe('2,096,550,000 + 632,025 = 2,097,182,025')
  })
})
