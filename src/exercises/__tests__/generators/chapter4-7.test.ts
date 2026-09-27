import { describe, expect, it } from 'vitest'
import { phoneticDigits, reduce } from '../../checker'
import { sets as ch4 } from '../../generators/chapter4'
import { sets as ch5 } from '../../generators/chapter5'
import { sets as ch6 } from '../../generators/chapter6'
import { sets as ch7 } from '../../generators/chapter7'
import { generatedSets } from '../../generators'
import { chapterIndex } from '@/content/loader'
import type { ExerciseDraft, GeneratedSetDef } from '../../types'
import { binary, checkSet, digitsOf } from './harness'

const byId = (xs: GeneratedSetDef[], id: string): GeneratedSetDef => {
  const s = xs.find((x) => x.id === id)
  if (!s) throw new Error(`missing set ${id}`)
  return s
}
const fracBin = (d: ExerciseDraft) => (d.prompt.kind === 'fraction-binary' ? d.prompt : null)
const isReducedFraction = (d: ExerciseDraft) => {
  if (d.answer.kind !== 'fraction') return false
  const r = reduce(d.answer.value)
  return r.num === d.answer.value.num && r.den === d.answer.value.den && d.answer.value.den > 0
}

describe('chapter 4 sets', () => {
  it('one-digit division yields quotient and remainder', () => {
    checkSet(byId(ch4, 'gen4-one-digit-division'), {
      precondition: (d) => binary(d)!.op === '÷' && binary(d)!.b >= 2 && binary(d)!.b <= 9 && d.answer.kind === 'quotient-remainder',
    })
  })
  it('two-digit division', () => {
    checkSet(byId(ch4, 'gen4-two-digit-division'), {
      precondition: (d) => binary(d)!.op === '÷' && digitsOf(binary(d)!.b) === 2 && d.answer.kind === 'quotient-remainder',
    })
  })
  it('decimalization uses proper fractions with small denominators', () => {
    checkSet(byId(ch4, 'gen4-decimalization'), {
      precondition: (d) => d.prompt.kind === 'fraction-task' && d.prompt.task === 'to-decimal' && d.prompt.value.num < d.prompt.value.den && d.prompt.value.den <= 12,
    })
  })
  it('divisibility tests use the book divisors and yes/no answers', () => {
    checkSet(byId(ch4, 'gen4-divisibility'), {
      precondition: (d) => {
        if (d.prompt.kind !== 'divisible' || d.answer.kind !== 'choice') return false
        const yes = d.prompt.n % d.prompt.by === 0
        return [2, 3, 4, 5, 6, 7, 8, 9, 11].includes(d.prompt.by) && d.answer.correct === (yes ? 'Yes' : 'No')
      },
    })
  })
  it('fraction sets produce reduced fraction answers', () => {
    for (const id of ['gen4-multiplying-fractions', 'gen4-dividing-fractions', 'gen4-adding-fractions', 'gen4-subtracting-fractions']) {
      checkSet(byId(ch4, id), { precondition: (d) => fracBin(d) !== null && isReducedFraction(d) && d.answer.kind === 'fraction' && d.answer.value.num > 0 })
    }
    checkSet(byId(ch4, 'gen4-simplifying-fractions'), {
      precondition: (d) => d.prompt.kind === 'fraction-task' && d.prompt.task === 'simplify' && isReducedFraction(d) && reduce(d.prompt.value).den !== d.prompt.value.den,
    })
  })
})

describe('chapter 5 sets', () => {
  it('guesstimation sets accept estimates within tolerance and work on big numbers', () => {
    checkSet(byId(ch5, 'gen5-addition-guesstimation'), { precondition: (d) => d.answer.kind === 'estimate' && digitsOf(binary(d)!.a) >= 4 })
    checkSet(byId(ch5, 'gen5-subtraction-guesstimation'), { precondition: (d) => d.answer.kind === 'estimate' && binary(d)!.a > binary(d)!.b })
    checkSet(byId(ch5, 'gen5-division-guesstimation'), { precondition: (d) => d.answer.kind === 'estimate' && binary(d)!.op === '÷' })
    checkSet(byId(ch5, 'gen5-multiplication-guesstimation'), { precondition: (d) => d.answer.kind === 'estimate' && binary(d)!.op === '×' })
    checkSet(byId(ch5, 'gen5-square-root-guesstimation'), { precondition: (d) => d.prompt.kind === 'root' && d.answer.kind === 'estimate' })
  })
  it('tips, tax and interest', () => {
    checkSet(byId(ch5, 'gen5-tips'), { precondition: (d) => d.prompt.kind === 'percent' && [15, 20].includes(d.prompt.percent) })
    checkSet(byId(ch5, 'gen5-sales-tax'), { precondition: (d) => d.prompt.kind === 'percent' && d.prompt.percent >= 5 && d.prompt.percent <= 9 })
    checkSet(byId(ch5, 'gen5-doubling-time'), { precondition: (d) => d.prompt.kind === 'text' && d.answer.kind === 'integer' })
  })
})

describe('chapter 6 sets', () => {
  it('pencil-and-paper drills', () => {
    checkSet(byId(ch6, 'gen6-columns-of-numbers'), { precondition: (d) => d.prompt.kind === 'columns' && d.prompt.numbers.length >= 4 })
    checkSet(byId(ch6, 'gen6-mod-sums'), {
      precondition: (d) => d.prompt.kind === 'text' && d.answer.kind === 'integer' && d.answer.value >= 1 && d.answer.value <= 9,
    })
    checkSet(byId(ch6, 'gen6-subtracting-on-paper'), { precondition: (d) => binary(d)!.op === '-' && digitsOf(binary(d)!.a) >= 5 && binary(d)!.a > binary(d)!.b })
    checkSet(byId(ch6, 'gen6-square-roots'), { precondition: (d) => d.prompt.kind === 'root' && d.prompt.degree === 2 })
    checkSet(byId(ch6, 'gen6-criss-cross'), { precondition: (d) => binary(d)!.op === '×' && digitsOf(binary(d)!.a) >= 2 })
    checkSet(byId(ch6, 'gen6-casting-out-elevens'), {
      precondition: (d) => d.prompt.kind === 'text' && d.answer.kind === 'integer' && d.answer.value >= 0 && d.answer.value <= 10,
    })
  })
})

describe('chapter 7 sets', () => {
  it('number to word asks for the phonetic skeleton of the shown number', () => {
    checkSet(byId(ch7, 'gen7-number-to-word'), {
      precondition: (d) => d.prompt.kind === 'text' && d.answer.kind === 'phonetic' && d.prompt.text.includes(d.answer.digits),
    })
  })
  it('word to number answers agree with the checker code', () => {
    checkSet(byId(ch7, 'gen7-word-to-number'), {
      precondition: (d) => d.prompt.kind === 'text' && d.answer.kind === 'text' && phoneticDigits(d.prompt.emphasis ?? '') === d.answer.accept[0],
    })
  })
  it('digit sounds and memory chains', () => {
    checkSet(byId(ch7, 'gen7-digit-sounds'), { precondition: (d) => d.answer.kind === 'choice' && d.answer.options.length === 10 })
    checkSet(byId(ch7, 'gen7-memory-chain'), { precondition: (d) => d.answer.kind === 'phonetic' && d.answer.digits.length >= 4 })
  })
})

describe('generated set index', () => {
  it('has unique ids and anchors every set to an existing section', () => {
    const ids = generatedSets.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of generatedSets) {
      const ch = chapterIndex.find((c) => c.id === s.chapterId)
      expect(ch, s.id).toBeDefined()
      expect(ch!.sections.map((x) => x.id), `${s.id} section`).toContain(s.sectionId)
    }
    expect(generatedSets.length).toBeGreaterThanOrEqual(30)
  })
})
