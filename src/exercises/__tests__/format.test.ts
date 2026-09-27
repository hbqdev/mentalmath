import { describe, expect, it } from 'vitest'
import { fracText, promptText } from '../format'
import type { Prompt } from '../types'

const cases: Array<[Prompt, string]> = [
  [{ kind: 'binary', a: 47, b: 32, op: '+' }, '47 + 32'],
  [{ kind: 'binary', a: 318, b: 9, op: '÷' }, '318 ÷ 9'],
  [{ kind: 'columns', numbers: [672, 1367, 107] }, '672 + 1367 + 107'],
  [{ kind: 'power', base: 14, exp: 2 }, '14²'],
  [{ kind: 'power', base: 12, exp: 3 }, '12³'],
  [{ kind: 'root', radicand: 17, degree: 2 }, '√17'],
  [{ kind: 'root', radicand: 1728, degree: 3 }, '∛1728'],
  [{ kind: 'fraction-binary', a: { num: 3, den: 5 }, b: { num: 2, den: 7 }, op: '×' }, '3/5 × 2/7'],
  [{ kind: 'fraction-task', value: { num: 14, den: 24 }, task: 'simplify' }, 'Simplify 14/24'],
  [{ kind: 'fraction-task', value: { num: 2, den: 5 }, task: 'to-decimal' }, 'Convert 2/5 to a decimal'],
  [{ kind: 'percent', percent: 15, of: 88 }, '15% of 88'],
  [{ kind: 'divisible', n: 3932, by: 4 }, 'Is 3932 divisible by 4?'],
  [{ kind: 'date', iso: '2007-01-19' }, 'January 19, 2007'],
  [{ kind: 'text', text: 'Convert 42 to a word' }, 'Convert 42 to a word'],
]

describe('promptText', () => {
  it.each(cases)('%j', (p, expected) => {
    expect(promptText(p)).toBe(expected)
  })
  it('formats fractions', () => {
    expect(fracText({ num: 7, den: 8 })).toBe('7/8')
  })
})
