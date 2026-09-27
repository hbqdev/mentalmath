import { chapterIndex } from '@/content/loader'
import { generatedSets } from './generators'
import type { BookSetRef, GeneratedSetDef } from './types'

export type SetRef = { kind: 'book'; ref: BookSetRef } | { kind: 'generated'; def: GeneratedSetDef }

const SMALL = new Set(['of', 'for', 'by', 'and', 'on', 'a', 'the', 'to', 'in'])
const PAREN = new Set(['equal', 'unequal'])

/** 'ch1-two-digit-addition' -> 'Two-Digit Addition'; 'ch8-3-by-2-multiplication' -> '3-by-2 Multiplication' */
export function setTitle(setId: string): string {
  const words = setId.replace(/^ch[^-]+-/, '').split('-')
  const out: string[] = []
  for (let i = 0; i < words.length; i++) {
    const w = words[i] ?? ''
    if (/^\d+$/.test(w) && words[i + 1] === 'by' && /^\d+$/.test(words[i + 2] ?? '')) {
      out.push(`${w}-by-${words[i + 2]}`)
      i += 2
      continue
    }
    if (w === 'digit' && out.length) {
      out[out.length - 1] = `${out[out.length - 1]}-Digit`
      continue
    }
    const cap = w.charAt(0).toUpperCase() + w.slice(1)
    if (PAREN.has(w)) {
      // 'equal denominators' -> '(Equal Denominators)'
      const rest = words.slice(i + 1).map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      out.push(`(${[cap, ...rest].join(' ')})`)
      break
    }
    out.push(i > 0 && SMALL.has(w) ? w : cap)
  }
  return out.join(' ')
}

export function bookSetsFor(chapterId: string): BookSetRef[] {
  const ch = chapterIndex.find((c) => c.id === chapterId)
  if (!ch) return []
  return ch.sets.map((s) => ({ id: s.id, chapterId, sectionId: s.sectionId, title: setTitle(s.id) }))
}

export function generatedSetsFor(chapterId: string): GeneratedSetDef[] {
  return generatedSets.filter((s) => s.chapterId === chapterId)
}

/** Every set for a chapter, ordered by section (reading order); book sets before generated within a section. */
export function allSetsFor(chapterId: string): SetRef[] {
  const ch = chapterIndex.find((c) => c.id === chapterId)
  if (!ch) return []
  const order = new Map(ch.sections.map((s, i) => [s.id, i]))
  const refs: SetRef[] = [
    ...bookSetsFor(chapterId).map((ref): SetRef => ({ kind: 'book', ref })),
    ...generatedSetsFor(chapterId).map((def): SetRef => ({ kind: 'generated', def })),
  ]
  const sectionOf = (s: SetRef) => order.get(s.kind === 'book' ? s.ref.sectionId : s.def.sectionId) ?? 999
  return refs
    .map((s, i) => ({ s, i }))
    .sort((a, b) => sectionOf(a.s) - sectionOf(b.s) || (a.s.kind === b.s.kind ? a.i - b.i : a.s.kind === 'book' ? -1 : 1))
    .map((x) => x.s)
}

export function findSet(chapterId: string, setId: string): SetRef | undefined {
  return allSetsFor(chapterId).find((s) => (s.kind === 'book' ? s.ref.id : s.def.id) === setId)
}

export function generatedTwin(bookSetId: string): GeneratedSetDef | undefined {
  return generatedSets.find((s) => s.coversBookSets?.includes(bookSetId))
}
