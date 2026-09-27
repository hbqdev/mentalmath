import { describe, expect, it } from 'vitest'
import { check, formatAnswer, normalizeNumber, parseFraction, parseQuotientRemainder, phoneticDigits } from '../checker'
import type { AnswerSpec } from '../types'

describe('normalizeNumber', () => {
  it.each([
    ['1,368', 1368], [' 42 ', 42], ['+7', 7], ['3.', 3], ['−5', -5], ['0.75', 0.75], ['.5', 0.5],
    ['abc', null], ['', null], ['1 2', null],
  ])('%s -> %s', (s, n) => expect(normalizeNumber(s)).toBe(n))
})

describe('parseFraction / parseQuotientRemainder', () => {
  it('parses simple and mixed fractions', () => {
    expect(parseFraction('3/4')).toEqual({ num: 3, den: 4 })
    expect(parseFraction('3 / 4')).toEqual({ num: 3, den: 4 })
    expect(parseFraction('1 1/2')).toEqual({ num: 3, den: 2 })
    expect(parseFraction('3/0')).toBeNull()
    expect(parseFraction('x')).toBeNull()
  })
  it('parses quotient-remainder forms', () => {
    expect(parseQuotientRemainder('45 r 8')).toEqual({ q: 45, r: 8 })
    expect(parseQuotientRemainder('45R8')).toEqual({ q: 45, r: 8 })
    expect(parseQuotientRemainder('45 remainder 8')).toEqual({ q: 45, r: 8 })
    expect(parseQuotientRemainder('45 rem 8')).toEqual({ q: 45, r: 8 })
    expect(parseQuotientRemainder('45')).toEqual({ q: 45, r: 0 })
    expect(parseQuotientRemainder('45 8/9')).toBeNull()
  })
})

const ok = (spec: AnswerSpec, input: string) => expect(check(spec, input).correct, `${input}`).toBe(true)
const bad = (spec: AnswerSpec, input: string) => expect(check(spec, input).correct, `${input}`).toBe(false)

describe('check by kind', () => {
  it('integer', () => {
    const s: AnswerSpec = { kind: 'integer', value: 1368 }
    ok(s, '1368'); ok(s, '1,368'); ok(s, ' 1368 '); ok(s, '1368.0'); bad(s, '1367'); bad(s, ''); bad(s, '13 68')
    expect(formatAnswer(s)).toBe('1368')
  })
  it('decimal with tolerance', () => {
    const s: AnswerSpec = { kind: 'decimal', value: 13.2, tolerance: 0.01 }
    ok(s, '13.2'); ok(s, '13.20'); ok(s, '13.205'); bad(s, '13.3'); bad(s, 'x')
    expect(formatAnswer(s)).toBe('13.2')
  })
  it('fraction, reduced comparison, optional decimal', () => {
    const s: AnswerSpec = { kind: 'fraction', value: { num: 3, den: 4 }, acceptDecimal: true }
    ok(s, '3/4'); ok(s, '6/8'); ok(s, '0.75'); ok(s, '.75'); bad(s, '3/5'); bad(s, '0.7')
    const strict: AnswerSpec = { kind: 'fraction', value: { num: 3, den: 4 }, acceptDecimal: false }
    bad(strict, '0.75'); ok(strict, '3 / 4')
    expect(formatAnswer(s)).toBe('3/4')
  })
  it('quotient-remainder accepts r forms, fraction form and exact decimal', () => {
    const s: AnswerSpec = { kind: 'quotient-remainder', q: 45, r: 8, divisor: 9 }
    ok(s, '45 r 8'); ok(s, '45 remainder 8'); ok(s, '45 8/9'); ok(s, '45.889'); bad(s, '45'); bad(s, '45 r 7'); bad(s, '46')
    expect(formatAnswer(s)).toBe('45 remainder 8')
    const exact: AnswerSpec = { kind: 'quotient-remainder', q: 35, r: 0, divisor: 9 }
    ok(exact, '35'); ok(exact, '35 r 0'); bad(exact, '35 r 1')
    expect(formatAnswer(exact)).toBe('35')
  })
  it('choice, case-insensitive with y/n shortcuts', () => {
    const s: AnswerSpec = { kind: 'choice', options: ['Yes', 'No'], correct: 'Yes' }
    ok(s, 'yes'); ok(s, 'Y'); ok(s, ' YES '); bad(s, 'no'); bad(s, 'n'); bad(s, 'maybe')
    const days: AnswerSpec = { kind: 'choice', options: ['Monday', 'Tuesday'], correct: 'Tuesday' }
    ok(days, 'tuesday'); bad(days, 't')
  })
  it('text with normalisation modes', () => {
    ok({ kind: 'text', accept: ['Cleveland'], normalize: 'lower' }, 'cleveland ')
    ok({ kind: 'text', accept: ['312'], normalize: 'digits' }, '3-1-2')
    bad({ kind: 'text', accept: ['312'], normalize: 'none' }, '3-1-2')
  })
  it('phonetic code words', () => {
    const s: AnswerSpec = { kind: 'phonetic', digits: '42' }
    ok(s, 'rain'); ok(s, 'Rhino'); ok(s, 'urn'); bad(s, 'car'); bad(s, '')
    ok({ kind: 'phonetic', digits: '314159265' }, 'my turtle pancho will')
    ok({ kind: 'phonetic', digits: '7' }, 'cow'); ok({ kind: 'phonetic', digits: '6' }, 'shoe'); ok({ kind: 'phonetic', digits: '0' }, 'zoo')
    ok({ kind: 'phonetic', digits: '55' }, 'lily')
  })
  it('estimate within relative tolerance', () => {
    const s: AnswerSpec = { kind: 'estimate', value: 2584, relTolerance: 0.02 }
    ok(s, '2600'); ok(s, '2550'); bad(s, '2700'); bad(s, 'lots')
    expect(formatAnswer(s)).toBe('≈ 2584')
  })
})

describe('review fixes: checker', () => {
  it('word-final hard c and g are 7, silent initial k is ignored', () => {
    expect(phoneticDigits('dog')).toBe('17')
    expect(phoneticDigits('bag')).toBe('97')
    expect(phoneticDigits('mac')).toBe('37')
    expect(phoneticDigits('pig')).toBe('97')
    expect(phoneticDigits('jug')).toBe('67')
    expect(phoneticDigits('knee')).toBe('2')
    expect(phoneticDigits('cage')).toBe('76')
  })
  it('accepts a whole number for a fraction answer that reduces to n/1 and shows it as an integer', () => {
    const s: AnswerSpec = { kind: 'fraction', value: { num: 2, den: 1 }, acceptDecimal: false }
    ok(s, '2'); ok(s, '2/1'); ok(s, '4/2'); bad(s, '3')
    expect(formatAnswer(s)).toBe('2')
    const t: AnswerSpec = { kind: 'fraction', value: { num: 4, den: 4 }, acceptDecimal: false }
    ok(t, '1')
  })
  it('quotient-remainder accepts thousands separators and a trailing dot on exact answers', () => {
    expect(parseQuotientRemainder('1,000 r 1')).toEqual({ q: 1000, r: 1 })
    ok({ kind: 'quotient-remainder', q: 45, r: 0, divisor: 9 }, '45.')
    ok({ kind: 'quotient-remainder', q: 1000, r: 1, divisor: 3 }, '1,000 r 1')
  })
})
