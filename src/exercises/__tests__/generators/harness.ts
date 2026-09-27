import { expect } from 'vitest'
import { formatAnswer, reduce } from '../../checker'
import { createRng } from '../../rng'
import type { AnswerSpec, Difficulty, ExerciseDraft, Frac, GeneratedSetDef, Prompt } from '../../types'

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']

function fracOp(a: Frac, b: Frac, op: string): Frac {
  switch (op) {
    case '+': return reduce({ num: a.num * b.den + b.num * a.den, den: a.den * b.den })
    case '-': return reduce({ num: a.num * b.den - b.num * a.den, den: a.den * b.den })
    case '×': return reduce({ num: a.num * b.num, den: a.den * b.den })
    default: return reduce({ num: a.num * b.den, den: a.den * b.num })
  }
}

/** Independent reference value for a prompt, used to cross-check generator answers. */
export function referenceFor(p: Prompt): number | Frac | null {
  switch (p.kind) {
    case 'binary':
      return p.op === '+' ? p.a + p.b : p.op === '-' ? p.a - p.b : p.op === '×' ? p.a * p.b : p.a / p.b
    case 'columns':
      return p.numbers.reduce((s, n) => s + n, 0)
    case 'power':
      return p.base ** p.exp
    case 'root':
      return p.degree === 2 ? Math.sqrt(p.radicand) : Math.cbrt(p.radicand)
    case 'fraction-binary':
      return fracOp(p.a, p.b, p.op)
    case 'fraction-task':
      return p.task === 'simplify' ? reduce(p.value) : p.value.num / p.value.den
    case 'percent':
      return (p.percent / 100) * p.of
    default:
      return null
  }
}

export function answerMatchesReference(p: Prompt, a: AnswerSpec): boolean {
  const ref = referenceFor(p)
  if (ref === null) return true
  switch (a.kind) {
    case 'integer':
      return typeof ref === 'number' && ref === a.value
    case 'decimal':
    case 'estimate':
      return typeof ref === 'number' && Math.abs(ref - a.value) <= (a.kind === 'decimal' ? a.tolerance : 1e-9)
    case 'quotient-remainder':
      return p.kind === 'binary' && a.q === Math.floor(p.a / p.b) && a.r === p.a % p.b && a.divisor === p.b
    case 'fraction': {
      if (typeof ref === 'number') return Math.abs(ref - a.value.num / a.value.den) < 1e-9
      const r = reduce(a.value)
      return r.num === ref.num && r.den === ref.den
    }
    default:
      return true
  }
}

export function lastStepMentionsAnswer(d: ExerciseDraft): boolean {
  const steps = d.solution?.steps ?? []
  const last = steps[steps.length - 1] ?? ''
  const shown = formatAnswer(d.answer).replace(/^≈ /, '')
  const bare = shown.replace(/ remainder .*/, '')
  return last.replace(/,/g, '').includes(bare.replace(/,/g, ''))
}

export interface SuiteOptions {
  draws?: number
  precondition?: (d: ExerciseDraft, difficulty: Difficulty) => boolean
  ranges?: Partial<Record<Difficulty, (d: ExerciseDraft) => boolean>>
}

/** Runs the shared property checks for one set across difficulties. */
export function checkSet(def: GeneratedSetDef, opts: SuiteOptions = {}) {
  const draws = opts.draws ?? 150
  for (const difficulty of DIFFS) {
    const rng = createRng(1234)
    for (let i = 0; i < draws; i++) {
      const d = def.generate(difficulty, rng)
      const label = `${def.id} [${difficulty}] #${i} ${JSON.stringify(d.prompt)}`
      expect(answerMatchesReference(d.prompt, d.answer), `answer vs reference: ${label}`).toBe(true)
      expect(d.solution?.steps.length ?? 0, `steps present: ${label}`).toBeGreaterThan(0)
      expect(lastStepMentionsAnswer(d), `last step ends with answer: ${label} :: ${d.solution?.steps.at(-1)}`).toBe(true)
      if (opts.precondition) expect(opts.precondition(d, difficulty), `precondition: ${label}`).toBe(true)
      const range = opts.ranges?.[difficulty]
      if (range) expect(range(d), `range: ${label}`).toBe(true)
    }
  }
  // determinism
  const a = def.generate('medium', createRng(5))
  const b = def.generate('medium', createRng(5))
  expect(a).toEqual(b)
}

export const binary = (d: ExerciseDraft) => (d.prompt.kind === 'binary' ? d.prompt : null)
export const power = (d: ExerciseDraft) => (d.prompt.kind === 'power' ? d.prompt : null)
export const digitsOf = (n: number) => String(Math.abs(n)).length
