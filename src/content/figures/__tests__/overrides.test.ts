import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { overrides } from '../overrides'
import type { ColumnLine, FigureSpec } from '../types'

// Chapters whose every non-exercise figure must have an override.
const COVERED: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

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

/** A plain number, a decimal with an overlined repeating part (".~09~"), a fraction ({a/b}) or a mixed number (25{4/7}). */
const num = (s: string): number | null => {
  const t = s.replace(/,/g, '').replace(/^[$]/, '').trim()
  const mixed = /^(-?\d*)\{(-?[\d.]+)\/([\d.]+)\}$/.exec(t)
  if (mixed) {
    const whole = mixed[1] ? Number(mixed[1]) : 0
    const frac = Number(mixed[2]) / Number(mixed[3])
    return whole < 0 || mixed[1] === '-' ? whole - frac : whole + frac
  }
  const rep = /^(-?\d*)\.(\d*)~(\d+)~$/.exec(t)
  if (rep) {
    const head = Number(`${rep[1] || '0'}.${rep[2]}`)
    const k = rep[3]!.length
    return head + Number(rep[3]) / (10 ** k - 1) / 10 ** rep[2]!.length
  }
  if (!/^-?\d*\.?\d+$/.test(t) || t === '' || t === '-') return null
  return Number(t)
}

const close = (a: number, b: number, tol: number) =>
  Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))

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

/** "(40 + 2)" / "(600 − 4)" / "(20 + 9) or (30 − 1)": the first bracketed breakdown must equal the line's value. */
function checkNote(note: string | undefined, value: string, id: string) {
  const m = note && /^\((\d[\d,]* (?:[+−] \d[\d,]* ?)+)\)/.exec(note)
  if (!m) return
  const got = evalExpr(m[1]!)
  const want = num(value)
  if (got !== null && want !== null) expect({ id, note, got }).toEqual({ id, note, got: want })
}

function checkColumn(lines: ColumnLine[], id: string) {
  for (const l of lines) checkNote(l.note, l.value, id)
  lines = lines.filter((l) => !l.carry)
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

/** Every "=" separated term of a line must agree (truncated decimals such as ".333 . . ." within a few thousandths). */
function checkEqualities(line: string, id: string) {
  if (/^(Answer|Divide)/.test(line)) return
  for (const part of line
    .replace(/^\d+\.\s+/, '')
    .replace(/\([^)]*\)/g, '')
    .split(' and ')) {
    const terms = part.split(/ = |\s=\s/)
    if (terms.length < 2) continue
    const values = terms.map((t) => {
      const approx = t.includes('. . .')
      const v = evalExpr(t.replace(/\s*\. \. \.$/, '').trim())
      return v === null ? null : { v, tol: approx ? 0.002 : 1e-9 }
    })
    if (values.some((v) => v === null)) continue
    const first = values[0]!.v
    for (const val of values)
      expect({ id, line, ok: close(val!.v, first, Math.max(val!.tol, values[0]!.tol)) }).toEqual({
        id,
        line,
        ok: true,
      })
  }
}

function checkChain(steps: string[], id: string, notes: Array<string | undefined> = []) {
  if (steps.some((s) => s.includes('?'))) return
  const values = steps.map((s) => evalExpr(s.replace(/^[≈<] ?/, '')))
  const first = values[0]
  for (const [i, v] of values.entries()) {
    if (v === null || first == null) continue
    const tol = steps[i]!.startsWith('≈') ? 0.02 : 1e-9
    expect({ id, step: steps[i], ok: close(v, first, tol) }).toEqual({
      id,
      step: steps[i],
      ok: true,
    })
  }
  // the note under each "=" names the amount moved: the change in the leading operand
  const lead = (s: string) => num(s.trim().split(/\s+/)[0]!)!
  notes.forEach((note, i) => {
    const m = note && !/[×÷]/.test(note) && /(\d[\d,]*)/.exec(note)
    if (!m || !steps[i + 1]) return
    const moved = Math.abs(lead(steps[i]!) - lead(steps[i + 1]!))
    if (moved === 0) return // a "(switch)" step
    expect({ id, note, moved }).toEqual({ id, note, moved: num(m[1]!) })
  })
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
  if (t.head[0] === 'Year') {
    // chapter 9 year codes: (yy + floor(yy / 4)) mod 7
    for (const r of t.rows) {
      for (let c = 0; c < r.length; c += 2) {
        const yy = Number(r[c]) % 100
        expect({ id, year: r[c], code: r[c + 1] }).toEqual({
          id,
          year: r[c],
          code: String((yy + Math.floor(yy / 4)) % 7),
        })
      }
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

/** Integer long division: divisor × quotient + final remainder = dividend. */
function checkLongDiv(s: Extract<FigureSpec, { kind: 'longdiv' }>, id: string) {
  const d = num(s.divisor)
  const q = num(s.quotient)
  const n = num(s.dividend)
  if (d === null || q === null || n === null || !Number.isInteger(q) || !Number.isInteger(n)) return
  if (s.lines.length === 0 || s.lines.some((l) => /\s$/.test(l.value))) return // unworked, or worked to one digit
  const rems = s.lines.filter((l) => !l.value.trim().startsWith('−')).map((l) => num(l.value))
  const r = rems.length ? (rems[rems.length - 1] ?? null) : 0
  if (r === null) return
  expect({ id, check: d * q + r }).toEqual({ id, check: n })
  // every subtraction line takes the previous remainder (or the dividend's leading part) down to the next one
  let prev: number | null = null
  for (const l of s.lines) {
    const v = num(l.value.replace(/^\s*−\s*/, ''))
    if (v === null) continue
    if (l.value.trim().startsWith('−')) {
      prev = prev === null ? null : prev - v
    } else if (prev !== null) {
      expect({ id, remainder: v }).toEqual({ id, remainder: prev })
      prev = v
    } else prev = v
  }
}

function checkSpec(spec: FigureSpec, id: string) {
  switch (spec.kind) {
    case 'longdiv':
      if (spec.answer) checkEqualities(spec.answer, id)
      return checkLongDiv(spec, id)
    case 'text':
    case 'pre':
      return spec.lines.forEach((l) => checkEqualities(l, id))
    case 'grid':
      return spec.rows.forEach((r) => r.forEach((c) => checkEqualities(c, id)))
    case 'inline':
      return checkEqualities(spec.text, id)
    case 'column':
      return checkColumn(spec.lines, id)
    case 'chain':
      return checkChain(spec.steps, id, spec.notes ?? [])
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
    case 'row': {
      // a magic square followed by "= N": every row, column and diagonal sums to N
      const [sq, eq] = spec.items
      if (
        sq?.kind === 'table' &&
        sq.plain &&
        eq?.kind === 'text' &&
        /^= \d+$/.test(eq.lines[0] ?? '')
      ) {
        const want = Number(eq.lines[0]!.slice(2))
        const m = sq.rows.map((r) => r.map(Number))
        const n = m.length
        const sums = [
          ...m.map((r) => r.reduce((a, b) => a + b, 0)),
          ...m[0]!.map((_, c) => m.reduce((a, r) => a + r[c]!, 0)),
          m.reduce((a, r, i) => a + r[i]!, 0),
          m.reduce((a, r, i) => a + r[n - 1 - i]!, 0),
        ]
        expect({ id, sums }).toEqual({ id, sums: sums.map(() => want) })
      }
      return spec.items.forEach((s) => checkSpec(s, id))
    }
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

  // A correct spec under the wrong id passes every arithmetic check; the image's shape does not.
  it('have a shape compatible with the image they replace', () => {
    const dims = new Map<string, { width: number; height: number }>()
    for (const unit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const doc = JSON.parse(
        readFileSync(path.resolve('src/content/chapters', `${unit}.json`), 'utf8'),
      ) as {
        sections: Array<{
          blocks: Array<{ type: string; id?: string; width?: number; height?: number }>
        }>
      }
      for (const sec of doc.sections)
        for (const b of sec.blocks)
          if (b.type === 'figure' && b.id) dims.set(b.id, { width: b.width!, height: b.height! })
    }
    for (const [id, spec] of Object.entries(overrides)) {
      const d = dims.get(id)!
      const lines = spec.kind === 'column' ? spec.lines.filter((l) => !l.carry).length : 0
      const shape = { id, kind: spec.kind, ...d }
      if (spec.kind === 'row')
        expect(shape.width, JSON.stringify(shape)).toBeGreaterThanOrEqual(150)
      if (spec.kind === 'column' && lines <= 2)
        expect(shape.height, JSON.stringify(shape)).toBeLessThanOrEqual(80)
      if (spec.kind === 'column' && lines >= 4)
        expect(shape.height, JSON.stringify(shape)).toBeGreaterThanOrEqual(100)
      if ((spec.kind === 'split' && spec.result) || spec.kind === 'chain')
        expect(shape.width, JSON.stringify(shape)).toBeGreaterThanOrEqual(200)
    }
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
  it('rejects a wrong labelled product, a wrong chain, a wrong breakdown note and a wrong chain note', () => {
    expect(() => checkColumn([{ label: '40 × 7 =', value: '270' }], 'x')).toThrow()
    expect(() => checkChain(['47 + 32', '77 + 3', '79'], 'x')).toThrow()
    expect(() =>
      checkColumn([{ value: '47' }, { op: '+', value: '32', rule: true, note: '(30 + 3)' }], 'x'),
    ).toThrow()
    expect(() => checkChain(['538 + 327', '838 + 27', '865'], 'x', ['+ 30', '+ 27'])).toThrow()
    expect(() => checkChain(['538 + 327', '838 + 27', '865'], 'x', ['+ 300', '+ 27'])).not.toThrow()
  })
  it('rejects a wrong fraction or decimal equality', () => {
    expect(() => checkEqualities('{1/3} + {2/15} = {5/15} + {2/15} = {8/15}', 'x')).toThrow()
    expect(() => checkEqualities('{2/11} = .~18~', 'x')).not.toThrow()
    expect(() => checkEqualities('{2/11} = .~19~', 'x')).toThrow()
    expect(() => checkEqualities('{1/3} = .333 . . .', 'x')).not.toThrow()
    expect(() => checkChain(['{29/45}', '{58/90}', '.6~44~'], 'x', ['× 2', '÷ 10'])).not.toThrow()
    expect(() => checkChain(['{29/45}', '{58/91}'], 'x')).toThrow()
  })

  it('rejects a wrong long division', () => {
    expect(() =>
      checkLongDiv(
        {
          kind: 'longdiv',
          divisor: '7',
          dividend: '179',
          quotient: '25',
          lines: [
            { value: '− 140', rule: true },
            { value: '39' },
            { value: '− 35', rule: true },
            { value: '5' },
          ],
        },
        'x',
      ),
    ).toThrow()
    expect(() =>
      checkLongDiv(
        {
          kind: 'longdiv',
          divisor: '7',
          dividend: '179',
          quotient: '25',
          lines: [
            { value: '− 140', rule: true },
            { value: '39' },
            { value: '− 35', rule: true },
            { value: '4' },
          ],
        },
        'x',
      ),
    ).not.toThrow()
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

  it('keeps the worked example of a figure that also carries an exercise list', () => {
    const bm = JSON.parse(readFileSync(path.resolve('scripts/book-map.json'), 'utf8')) as {
      exerciseAfter: Record<string, string>
    }
    for (const id of Object.keys(bm.exerciseAfter).filter((k) => /^ch[0-3]-/.test(k)))
      expect(overrides[id], id).toBeDefined()
  })
})
