import { chapterIndex } from '@/content/loader'

export interface PracticeSetRef {
  id: string
  chapterId: string
  sectionId: string
  title: string
  kind: 'book' | 'generated'
  count?: number
}

const SMALL = new Set(['of', 'for', 'by', 'and', 'on', 'a', 'any'])

/** 'ch1-two-digit-addition' -> 'Two-Digit Addition'; 'ch8-3-by-2-multiplication' -> '3-by-2 Multiplication' */
export function setTitle(setId: string): string {
  const slug = setId.replace(/^ch[^-]+-/, '')
  const words = slug.split('-')
  const out: string[] = []
  for (let i = 0; i < words.length; i++) {
    const w = words[i] ?? ''
    const prev = words[i - 1] ?? ''
    const next = words[i + 1] ?? ''
    // digit-by-digit tokens stay hyphenated: 3-by-2
    if (/^\d+$/.test(w) && next === 'by' && /^\d+$/.test(words[i + 2] ?? '')) {
      out.push(`${w}-by-${words[i + 2]}`)
      i += 2
      continue
    }
    // 'two-digit' style compound words stay hyphenated
    if (w === 'digit' && prev) {
      out[out.length - 1] = `${out[out.length - 1]}-Digit`
      continue
    }
    if (i > 0 && SMALL.has(w)) out.push(w)
    else out.push(w.charAt(0).toUpperCase() + w.slice(1))
  }
  return out.join(' ')
}

// Plan 1: sets are discovered from exercise blocks in the extracted content; the reader
// registers them when it loads a chapter. Plan 2 replaces this with the real registry of
// book + generated sets and their anchoring sections.
const discovered = new Map<string, PracticeSetRef[]>()

export function registerDiscoveredSets(chapterId: string, sets: PracticeSetRef[]) {
  discovered.set(chapterId, sets)
}

export function practiceSetsFor(chapterId: string): PracticeSetRef[] {
  if (!chapterIndex.some((c) => c.id === chapterId)) return []
  return discovered.get(chapterId) ?? []
}
