import { describe, expect, it } from 'vitest'
import { chapterIndex, getChapterMeta, loadChapter, ChapterNotFound } from '../loader'
import { ALLOWED_TAGS } from '../../../scripts/lib/sanitize'

describe('extracted content', () => {
  it('has intro, chapters 0-9 and the epilogue in order', () => {
    expect(chapterIndex.map((c) => c.id)).toEqual([
      'intro', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'epilogue',
    ])
  })

  it('gives every chapter the book title, not a placeholder', () => {
    expect(getChapterMeta('8')?.title).toBe('The Tough Stuff Made Easy: Advanced Multiplication')
    expect(getChapterMeta('9')?.title).toBe('Presto-digit-ation: The Art of Mathematical Magic')
    expect(getChapterMeta('epilogue')?.kicker).toBe('Chapter ∞')
  })

  it('keeps section ids unique within each chapter', () => {
    for (const c of chapterIndex) {
      const ids = c.sections.map((s) => s.id)
      expect(new Set(ids).size, c.id).toBe(ids.length)
    }
  })

  it('loads a chapter document with only allowed tags in html blocks', async () => {
    const doc = await loadChapter('1')
    expect(doc.sections.length).toBeGreaterThan(1)
    for (const s of doc.sections) {
      for (const b of s.blocks) {
        if (b.type !== 'html') continue
        for (const tag of b.html.matchAll(/<([a-z0-9]+)/g)) {
          expect(ALLOWED_TAGS.has(tag[1]!), tag[1]).toBe(true)
        }
        expect(b.html).not.toMatch(/calibre|style=|onclick/)
      }
    }
  })

  it('contains the curated exercise sets exactly once each', async () => {
    const expected: Record<string, number> = { '1': 4, '2': 3, '3': 7, '4': 10, '5': 6, '6': 4, '8': 5, '9': 1 }
    for (const [id, count] of Object.entries(expected)) {
      const doc = await loadChapter(id)
      const sets = doc.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'exercise')
      const ids = sets.map((b) => (b as { setId: string }).setId)
      expect(new Set(ids).size, `chapter ${id} distinct sets`).toBe(count)
      expect(ids.length, `chapter ${id} callouts`).toBe(count)
    }
  })

  it('rejects unknown ids with ChapterNotFound', async () => {
    await expect(loadChapter('42')).rejects.toBeInstanceOf(ChapterNotFound)
  })
})
