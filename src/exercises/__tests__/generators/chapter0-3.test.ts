import { describe, expect, it } from 'vitest'
import { sets as ch0 } from '../../generators/chapter0'
import { sets as ch1 } from '../../generators/chapter1'
import { sets as ch2 } from '../../generators/chapter2'
import { sets as ch3 } from '../../generators/chapter3'
import {
  nearestFactorPair,
  stepsLeftToRightAdd,
  stepsLeftToRightSub,
} from '../../generators/shared'
import { binary, checkSet, digitsOf, power } from './harness'

const byId = (xs: { id: string }[], id: string) => {
  const s = xs.find((x) => x.id === id)
  if (!s) throw new Error(`missing set ${id}`)
  return s as (typeof ch0)[number]
}

describe('shared step builders', () => {
  it('left-to-right addition spells out the book method', () => {
    expect(stepsLeftToRightAdd(538, 327)).toEqual([
      '538 + 300 = 838',
      '838 + 20 = 858',
      '858 + 7 = 865',
    ])
    expect(stepsLeftToRightAdd(47, 32)).toEqual(['47 + 30 = 77', '77 + 2 = 79'])
  })
  it('left-to-right subtraction uses complements when the ones digit borrows', () => {
    expect(stepsLeftToRightSub(86, 29)).toEqual([
      '86 − 29 = 86 − 30 + 1',
      '86 − 30 = 56',
      '56 + 1 = 57',
    ])
    expect(stepsLeftToRightSub(86, 25)).toEqual(['86 − 20 = 66', '66 − 5 = 61'])
  })
  it('finds factor pairs with both factors at most 12', () => {
    expect(nearestFactorPair(56)).toEqual([7, 8])
    expect(nearestFactorPair(72)).toEqual([8, 9])
    expect(nearestFactorPair(97)).toBeNull()
  })
})

describe('chapter 0 sets', () => {
  it('multiply by 11: two digits easy/medium, three digits hard', () => {
    checkSet(byId(ch0, 'gen0-multiply-by-11'), {
      precondition: (d) => binary(d)?.b === 11 && binary(d)?.op === '×',
      ranges: {
        easy: (d) => digitsOf(binary(d)!.a) === 2,
        medium: (d) => digitsOf(binary(d)!.a) === 2,
        hard: (d) => digitsOf(binary(d)!.a) === 3,
      },
    })
  })
  it('squares ending in 5 only', () => {
    checkSet(byId(ch0, 'gen0-square-ending-in-5'), {
      precondition: (d) => power(d)!.base % 10 === 5 && power(d)!.exp === 2,
    })
  })
  it('same tens digit, ones digits summing to 10', () => {
    checkSet(byId(ch0, 'gen0-same-tens-sum-10'), {
      precondition: (d) => {
        const p = binary(d)!
        return (
          Math.floor(p.a / 10) === Math.floor(p.b / 10) &&
          (p.a % 10) + (p.b % 10) === 10 &&
          p.op === '×'
        )
      },
    })
  })
  it('exports exactly the three quick-trick sets anchored to chapter 0 sections', () => {
    expect(ch0.map((s) => [s.chapterId, s.sectionId])).toEqual([
      ['0', 'instant-multiplication'],
      ['0', 'squaring-and-more'],
      ['0', 'squaring-and-more'],
    ])
  })
})

describe('chapter 1 sets', () => {
  it('two-digit addition', () => {
    checkSet(byId(ch1, 'gen1-two-digit-addition'), {
      precondition: (d) =>
        binary(d)!.op === '+' && digitsOf(binary(d)!.a) === 2 && digitsOf(binary(d)!.b) === 2,
      ranges: { easy: (d) => (binary(d)!.a % 10) + (binary(d)!.b % 10) < 10 },
    })
  })
  it('three-digit addition', () => {
    checkSet(byId(ch1, 'gen1-three-digit-addition'), {
      precondition: (d) =>
        binary(d)!.op === '+' &&
        digitsOf(binary(d)!.b) === 3 &&
        digitsOf(binary(d)!.a) >= 3 &&
        digitsOf(binary(d)!.a) <= 4,
    })
  })
  it('two-digit subtraction never goes negative', () => {
    checkSet(byId(ch1, 'gen1-two-digit-subtraction'), {
      precondition: (d) =>
        binary(d)!.op === '-' &&
        binary(d)!.a > binary(d)!.b &&
        digitsOf(binary(d)!.b) === 2 &&
        binary(d)!.a < 200,
    })
  })
  it('three-digit subtraction never goes negative', () => {
    checkSet(byId(ch1, 'gen1-three-digit-subtraction'), {
      precondition: (d) =>
        binary(d)!.op === '-' && binary(d)!.a > binary(d)!.b && digitsOf(binary(d)!.b) === 3,
    })
  })
  it('covers the four chapter 1 book sets', () => {
    expect(ch1.flatMap((s) => s.coversBookSets ?? []).sort()).toEqual([
      'ch1-three-digit-addition',
      'ch1-three-digit-subtraction',
      'ch1-two-digit-addition',
      'ch1-two-digit-subtraction',
    ])
  })
})

describe('chapter 2 sets', () => {
  it('2-by-1 and 3-by-1 multiplication', () => {
    checkSet(byId(ch2, 'gen2-2-by-1-multiplication'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 2 && binary(d)!.b >= 2 && binary(d)!.b <= 9,
    })
    checkSet(byId(ch2, 'gen2-3-by-1-multiplication'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 3 && binary(d)!.b >= 2 && binary(d)!.b <= 9,
    })
  })
  it('two-digit squares with the round-and-adjust steps', () => {
    checkSet(byId(ch2, 'gen2-two-digit-squares'), {
      precondition: (d) => power(d)!.exp === 2 && digitsOf(power(d)!.base) === 2,
    })
  })
})

describe('chapter 3 sets', () => {
  it('multiplying by 11 grows to four digits', () => {
    checkSet(byId(ch3, 'gen3-multiplying-by-11'), {
      precondition: (d) => binary(d)!.b === 11,
      ranges: { hard: (d) => digitsOf(binary(d)!.a) >= 3 },
    })
  })
  it('addition method: second factor ends in 1 to 3', () => {
    checkSet(byId(ch3, 'gen3-2-by-2-addition-method'), {
      precondition: (d) => [1, 2, 3].includes(binary(d)!.b % 10) && digitsOf(binary(d)!.a) === 2,
    })
  })
  it('subtraction method: second factor ends in 7 to 9', () => {
    checkSet(byId(ch3, 'gen3-2-by-2-subtraction-method'), {
      precondition: (d) => [7, 8, 9].includes(binary(d)!.b % 10) && digitsOf(binary(d)!.a) === 2,
    })
  })
  it('factoring method: second factor splits into two factors at most 12', () => {
    checkSet(byId(ch3, 'gen3-2-by-2-factoring-method'), {
      precondition: (d) => nearestFactorPair(binary(d)!.b) !== null,
    })
  })
  it('general 2-by-2, three-digit squares, two-digit cubes', () => {
    checkSet(byId(ch3, 'gen3-2-by-2-general'), {
      precondition: (d) => digitsOf(binary(d)!.a) === 2 && digitsOf(binary(d)!.b) === 2,
    })
    checkSet(byId(ch3, 'gen3-three-digit-squares'), {
      precondition: (d) => power(d)!.exp === 2 && digitsOf(power(d)!.base) === 3,
    })
    checkSet(byId(ch3, 'gen3-two-digit-cubes'), {
      precondition: (d) => power(d)!.exp === 3 && digitsOf(power(d)!.base) === 2,
    })
  })
})
