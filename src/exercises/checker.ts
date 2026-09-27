import type { AnswerSpec, Frac } from './types'

export interface CheckResult {
  correct: boolean
  shown: string
}

/** Strips spaces, thousands separators, a leading +, a trailing dot and unicode minus. */
export function normalizeNumber(s: string): number | null {
  let t = s.trim().replace(/−/g, '-').replace(/,/g, '')
  if (t.startsWith('+')) t = t.slice(1)
  if (t.endsWith('.')) t = t.slice(0, -1)
  if (!/^-?(\d+(\.\d*)?|\.\d+)$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

export function reduce(f: Frac): Frac {
  const g = gcd(f.num, f.den)
  const sign = f.den < 0 ? -1 : 1
  return { num: (sign * f.num) / g, den: (sign * f.den) / g }
}

/** '3/4', '3 / 4', '1 1/2' (mixed number) -> improper fraction. */
export function parseFraction(s: string): Frac | null {
  const m = /^\s*(?:(-?\d+)\s+)?(-?\d+)\s*\/\s*(\d+)\s*$/.exec(s)
  if (!m) return null
  const whole = m[1] !== undefined ? Number(m[1]) : 0
  const num = Number(m[2])
  const den = Number(m[3])
  if (den === 0) return null
  const sign = whole < 0 || (whole === 0 && num < 0) ? -1 : 1
  return { num: sign * (Math.abs(whole) * den + Math.abs(num)), den }
}

/** '45 r 8', '45R8', '45 remainder 8', '45 rem 8', '45' (r = 0). Not the fraction form. */
export function parseQuotientRemainder(s: string): { q: number; r: number } | null {
  const t = s.trim().toLowerCase().replace(/,/g, '').replace(/\.$/, '')
  const m = /^(\d+)\s*(?:r|rem|remainder)\.?\s*(\d+)$/.exec(t)
  if (m) return { q: Number(m[1]), r: Number(m[2]) }
  if (/^\d+$/.test(t)) return { q: Number(t), r: 0 }
  return null
}

// Chapter 7 phonetic code. Digits by consonant sound; vowels, w, h, y carry no value.
export function phoneticDigits(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z]/g, ' ')
  let out = ''
  let lastDigit = ''
  let lastLetter = ''
  for (let i = 0; i < w.length; i++) {
    const ch = w[i]!
    const next = w[i + 1] ?? ''
    let d = ''
    let skip = 0
    if (ch === ' ') {
      lastDigit = ''
      lastLetter = ''
      continue
    }
    const atWordStart = i === 0 || w[i - 1] === ' '
    if (atWordStart && ch === 'k' && next === 'n') continue // silent k (knee, knife)
    if (ch === 'c' && next === 'k') {
      d = '7'
      skip = 1
    } else if (ch === 'p' && next === 'h') {
      d = '8'
      skip = 1
    } else if (ch === 's' && next === 'h') {
      d = '6'
      skip = 1
    } else if (ch === 'c' && next === 'h') {
      d = '6'
      skip = 1
    } else if (ch === 't' && next === 'h') {
      d = '1'
      skip = 1
    } else if (ch === 'd' && next === 'g') {
      d = '6'
      skip = 1
    } else if ('sz'.includes(ch)) d = '0'
    else if (ch === 'c') d = next !== '' && 'eiy'.includes(next) ? '0' : '7'
    else if ('td'.includes(ch)) d = '1'
    else if (ch === 'n') d = '2'
    else if (ch === 'm') d = '3'
    else if (ch === 'r') d = '4'
    else if (ch === 'l') d = '5'
    else if (ch === 'j') d = '6'
    else if (ch === 'g') d = next !== '' && 'eiy'.includes(next) ? '6' : '7'
    else if ('kq'.includes(ch)) d = '7'
    else if ('fv'.includes(ch)) d = '8'
    else if ('pb'.includes(ch)) d = '9'
    else if (ch === 'x') d = '70'
    else {
      lastLetter = ch
      continue
    } // vowels, w, h, y
    // doubled consonant letters make one sound
    if (ch === lastLetter && d === lastDigit && skip === 0) continue
    out += d
    lastDigit = d
    lastLetter = ch
    i += skip
  }
  return out
}

export function formatAnswer(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'integer':
      return String(spec.value)
    case 'decimal':
      return String(spec.value)
    case 'fraction': {
      if (spec.exact) return `${spec.value.num}/${spec.value.den}`
      const r = reduce(spec.value)
      return r.den === 1 ? String(r.num) : `${spec.value.num}/${spec.value.den}`
    }
    case 'quotient-remainder':
      return spec.r === 0 ? String(spec.q) : `${spec.q} remainder ${spec.r}`
    case 'choice':
      return spec.correct
    case 'text':
      return spec.accept[0] ?? ''
    case 'phonetic':
      return `a word whose consonants spell ${spec.digits}`
    case 'estimate':
      return `≈ ${spec.value}`
  }
}

export function check(spec: AnswerSpec, input: string): CheckResult {
  const shown = formatAnswer(spec)
  const raw = input.trim()
  if (!raw) return { correct: false, shown }
  switch (spec.kind) {
    case 'integer': {
      const n = normalizeNumber(raw)
      return { correct: n !== null && n === spec.value, shown }
    }
    case 'decimal': {
      const n = normalizeNumber(raw)
      return { correct: n !== null && Math.abs(n - spec.value) <= spec.tolerance + 1e-9, shown }
    }
    case 'fraction': {
      const f = parseFraction(raw)
      if (f) {
        if (spec.exact)
          return { correct: f.num === spec.value.num && f.den === spec.value.den, shown }
        const a = reduce(f)
        const b = reduce(spec.value)
        return { correct: a.num === b.num && a.den === b.den, shown }
      }
      if (spec.exact) return { correct: false, shown }
      const n = normalizeNumber(raw)
      if (n === null) return { correct: false, shown }
      const b = reduce(spec.value)
      if (b.den === 1 && n === b.num) return { correct: true, shown }
      if (spec.acceptDecimal) return { correct: Math.abs(n - b.num / b.den) <= 0.005, shown }
      return { correct: false, shown }
    }
    case 'quotient-remainder': {
      const qr = parseQuotientRemainder(raw)
      if (qr) return { correct: qr.q === spec.q && qr.r === spec.r, shown }
      const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(raw)
      if (mixed) {
        const f = reduce({ num: Number(mixed[2]), den: Number(mixed[3]) })
        const want = reduce({ num: spec.r, den: spec.divisor })
        return {
          correct: Number(mixed[1]) === spec.q && f.num === want.num && f.den === want.den,
          shown,
        }
      }
      const n = normalizeNumber(raw)
      const exact = spec.q + spec.r / spec.divisor
      return { correct: n !== null && spec.r !== 0 && Math.abs(n - exact) <= 0.005, shown }
    }
    case 'choice': {
      const t = raw.toLowerCase()
      const correct = spec.correct.toLowerCase()
      const yesNo = spec.options.every((o) => /^(yes|no)$/i.test(o))
      return { correct: t === correct || (yesNo && t === correct[0]), shown }
    }
    case 'text': {
      const norm = (s: string) =>
        spec.normalize === 'lower'
          ? s.toLowerCase().trim()
          : spec.normalize === 'digits'
            ? s.replace(/\D/g, '')
            : s.trim()
      const t = norm(raw)
      return { correct: spec.accept.some((a) => norm(a) === t), shown }
    }
    case 'phonetic':
      return { correct: phoneticDigits(raw) === spec.digits, shown }
    case 'estimate': {
      const n = normalizeNumber(raw)
      return {
        correct:
          n !== null &&
          Math.abs(n - spec.value) / Math.abs(spec.value || 1) <= spec.relTolerance + 1e-9,
        shown,
      }
    }
  }
}
