import type { Frac, Prompt } from './types'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function fracText(f: Frac): string {
  return `${f.num}/${f.den}`
}

export function dateText(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`
}

export function promptText(p: Prompt): string {
  switch (p.kind) {
    case 'binary':
      return `${p.a} ${p.op} ${p.b}`
    case 'columns':
      return p.numbers.map((n) => (p.unit === '$' ? `$${n.toFixed(2)}` : String(n))).join(' + ')
    case 'power':
      return `${p.base}${p.exp === 2 ? '²' : '³'}`
    case 'root':
      return `${p.degree === 2 ? '√' : '∛'}${p.radicand}`
    case 'fraction-binary':
      return `${fracText(p.a)} ${p.op} ${fracText(p.b)}`
    case 'fraction-task':
      return p.task === 'simplify'
        ? `Simplify ${fracText(p.value)}`
        : p.task === 'rewrite'
          ? `Write ${fracText(p.value)} with denominator ${p.den}`
          : `Convert ${fracText(p.value)} to a decimal`
    case 'percent':
      return `${p.percent}% of ${p.of}`
    case 'divisible':
      return `Is ${p.n} divisible by ${p.by}?`
    case 'date':
      return dateText(p.iso)
    case 'text':
      return p.text
  }
}
