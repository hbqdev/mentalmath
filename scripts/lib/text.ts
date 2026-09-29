const SMALL = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

export function collapseWs(s: string): string {
  return s.replace(/[\s ]+/g, ' ').trim()
}

function capWord(word: string, first: boolean): string {
  const lower = word.toLowerCase()
  if (!first && SMALL.has(lower)) return lower
  // hyphenated tokens: after a leading digit segment, keep the rest lower ("3-by-2")
  const segments = lower.split('-')
  return segments
    .map((seg, i) => {
      if (i > 0 && SMALL.has(seg)) return seg
      if (i > 0 && /^\d/.test(segments[0] ?? '')) return seg
      return seg.charAt(0).toUpperCase() + seg.slice(1)
    })
    .join('-')
}

export function titleCase(s: string): string {
  const text = collapseWs(s)
  const isShouting = text === text.toUpperCase() && /[A-Z]/.test(text)
  if (!isShouting) return text
  return text
    .split(' ')
    .map((w, i) => capWord(w, i === 0))
    .join(' ')
}

export function slugify(s: string): string {
  return collapseWs(s)
    .toLowerCase()
    .replace(/[’'"“”‘]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function uniqueSlug(base: string, used: Set<string>): string {
  const root = base || 'section'
  let slug = root
  let n = 2
  while (used.has(slug)) slug = `${root}-${n++}`
  used.add(slug)
  return slug
}
