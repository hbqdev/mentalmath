import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { overrides } from '../overrides'
import type { ColumnLine, FigureSpec } from '../types'

// Chapters whose every non-exercise figure must have an override.
const COVERED: string[] = ['0', '1', '2']

const bookMap = JSON.parse(readFileSync(path.resolve('scripts/book-map.json'), 'utf8')) as {
  exerciseSets: Record<string, unknown>
}

function figureIds(chapter: string): string[] {
  return readdirSync(path.resolve('public/book/figures', chapter))
    .filter((f) => f.endsWith('.jpeg'))
    .map((f) => f.replace('.jpeg', ''))
    .filter((id) => !(id in bookMap.exerciseSets))
}

/* ---------- arithmetic on the printed strings ---------- */

const num = (s: string): number | null => {
  const t = s.replace(/,/g, '').trim()
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  return Number(t)
}

/** Evaluates "a op b op c" left to right with + − × ÷; null when anything is not a number. */
function evalExpr(expr: string): number | null {
  const tokens = expr.replace(/,/g, '').trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  let acc = num(tokens[0]!)
  if (acc === null) return null
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]
    const b = num(tokens[i + 1] ?? '')
    if (b === null) return null
    if (op === '+') acc += b
    else if (op === '−' || op === '-') acc -= b
    else if (op === '×') acc *= b
    else if (op === '÷') acc /= b
    else return null
  }
  return acc
}

function checkColumn(lines: ColumnLine[], id: string) {
  // labelled equations: "40 × 7 =" value → the label's expression equals the value
  for (const l of lines) {
    if (l.label && l.label.trim().endsWith('=')) {
      const lhs = evalExpr(l.label.trim().slice(0, -1))
      const v = num(l.value)
      if (lhs !== null && v !== null) {
        const signed = l.op === '−' ? -v : v
        const want = l.op === '−' ? -lhs : lhs
        expect({ id, line: l, got: signed }).toEqual({ id, line: l, got: want })
      }
    }
  }
  // runs between rules: v0 op1 v1 … = the line after the rule (when that line is a plain value)
  let start = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.rule) continue
    const next = lines[i + 1]
    if (next && !next.label && !next.op) {
      const run = lines.slice(start, i + 1)
      if (run.length < 2) {
        start = i + 1
        continue
      }
      const first = num(run[0]!.value)
      const ops = run.slice(1).map((l) => (l.op === '×' && l.label ? '+' : l.op))
      if (first !== null && ops.every((o) => o === '+' || o === '−')) {
        const expr = run.map((l, k) => (k === 0 ? l.value : `${ops[k - 1]} ${l.value}`)).join(' ')
        const got = evalExpr(expr)
        const want = num(next.value)
        if (got !== null && want !== null)
          expect({ id, expr, got }).toEqual({ id, expr, got: want })
      }
    }
    start = i + 1
  }
  // multiplicand over "× multiplier": product equals the final line (or the "Answer:" line)
  if (lines.length > 2 && !lines[0]!.op && lines[1]!.op === '×' && lines[1]!.rule) {
    const a = num(lines[0]!.value)
    const b = num(lines[1]!.value)
    const last = lines[lines.length - 1]!
    const final = !last.op && (!last.label || last.label === 'Answer:') ? num(last.value) : null
    if (a !== null && b !== null && final !== null)
      expect({ id, product: a * b }).toEqual({ id, product: final })
  }
}

function checkChain(steps: string[], id: string) {
  if (steps.some((s) => s.includes('?'))) return
  const values = steps.map(evalExpr)
  for (const [i, v] of values.entries()) {
    expect({ id, step: steps[i], value: v }).toEqual({ id, step: steps[i], value: values[0] })
  }
}

function checkSplit(s: Extract<FigureSpec, { kind: 'split' }>, id: string) {
  const n = num(s.base.replace(/²$/, ''))
  const d = num(s.upLabel.replace(/^\+/, ''))
  const up = num(s.up)
  const down = num(s.down)
  expect({ id, n, d }).not.toEqual({ id, n: null, d: null })
  if (n === null || d === null) return
  expect({ id, downLabel: s.downLabel }).toEqual({ id, downLabel: `−${d}` })
  if (up !== null) expect({ id, up }).toEqual({ id, up: n + d })
  if (down !== null) expect({ id, down }).toEqual({ id, down: n - d })
  if (s.result && !s.result.includes('?')) {
    const m = /^(.+?) \+ (\d+)² = (.+)$/.exec(s.result)
    expect({ id, result: s.result, parsed: !!m }).toEqual({ id, result: s.result, parsed: true })
    if (!m) return
    expect({ id, area: num(m[1]!) }).toEqual({ id, area: (n + d) * (n - d) })
    expect({ id, square: num(m[2]!) }).toEqual({ id, square: d })
    expect({ id, total: num(m[3]!) }).toEqual({ id, total: n * n })
  }
}

function checkTable(t: Extract<FigureSpec, { kind: 'table' }>, id: string) {
  if (t.head[0] === '×') {
    for (const r of t.rows) {
      const a = num(r[0]!)!
      expect({ id, row: r }).toEqual({
        id,
        row: [r[0], ...t.head.slice(1).map((h) => String(a * num(h)!))],
      })
    }
  }
  const m = /^Numbers that\nadd to (\d+)$/.exec(t.head[0]!)
  if (m) {
    const n = Number(m[1])
    for (const r of t.rows) {
      const [a, b, dist, prod, diff] = r.map((c) => num(c)!)
      expect({ id, row: r }).toEqual({
        id,
        row: [a!, n - a!, Math.abs(n / 2 - a!), a! * b!, (n / 2) ** 2 - prod!].map(String),
      })
      expect({ id, dist, diff }).toEqual({
        id,
        dist: Math.abs(n / 2 - a!),
        diff: (n / 2) ** 2 - prod!,
      })
    }
  }
}

function checkSpec(spec: FigureSpec, id: string) {
  switch (spec.kind) {
    case 'column':
      return checkColumn(spec.lines, id)
    case 'chain':
      return checkChain(spec.steps, id)
    case 'split':
      return checkSplit(spec, id)
    case 'eleven': {
      const n = num(spec.n)!
      expect({ id, sum: num(spec.sum) }).toEqual({ id, sum: Math.floor(n / 10) + (n % 10) })
      expect({ id, result: num(spec.result) }).toEqual({ id, result: n * 11 })
      return
    }
    case 'table':
      return checkTable(spec, id)
    case 'row':
    case 'stack':
      return spec.items.forEach((s) => checkSpec(s, id))
    default:
      return
  }
}

describe('figure overrides', () => {
  it('reproduce the arithmetic printed in the book', () => {
    for (const [id, spec] of Object.entries(overrides)) checkSpec(spec, id)
  })

  it('only name figures that exist in the extracted book', () => {
    for (const id of Object.keys(overrides)) {
      const unit = id.slice(2, id.indexOf('-'))
      expect(figureIds(unit).concat(Object.keys(bookMap.exerciseSets))).toContain(id)
    }
  })

  for (const chapter of COVERED) {
    it(`cover every worked figure of chapter ${chapter}`, () => {
      const missing = figureIds(chapter).filter((id) => !(id in overrides))
      expect(missing).toEqual([])
    })
  }
})

// The recomputation must actually bite: a wrong digit fails.
describe('recomputation', () => {
  it('rejects a wrong column sum', () => {
    expect(() =>
      checkColumn([{ value: '47' }, { op: '+', value: '32', rule: true }, { value: '78' }], 'x'),
    ).toThrow()
  })
  it('rejects a wrong labelled product and a wrong chain', () => {
    expect(() => checkColumn([{ label: '40 × 7 =', value: '270' }], 'x')).toThrow()
    expect(() => checkChain(['47 + 32', '77 + 3', '79'], 'x')).toThrow()
  })
  it('rejects a wrong squaring diagram', () => {
    expect(() =>
      checkSplit(
        {
          kind: 'split',
          base: '13²',
          up: '16',
          down: '10',
          upLabel: '+3',
          downLabel: '−3',
          result: '160 + 3² = 168',
        },
        'x',
      ),
    ).toThrow()
  })
})
