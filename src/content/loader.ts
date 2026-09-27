import { chapterIndex, chapterLoaders } from './index'
import type { ChapterDoc, ChapterMeta } from './types'

export { chapterIndex }

export class ChapterNotFound extends Error {
  constructor(id: string) {
    super(`No chapter "${id}"`)
    this.name = 'ChapterNotFound'
  }
}

export function getChapterMeta(id: string): ChapterMeta | undefined {
  return chapterIndex.find((c) => c.id === id)
}

export function readableChapters(): ChapterMeta[] {
  return chapterIndex
}

export function neighbours(id: string): { prev?: ChapterMeta; next?: ChapterMeta } {
  const i = chapterIndex.findIndex((c) => c.id === id)
  return {
    prev: i > 0 ? chapterIndex[i - 1] : undefined,
    next: i >= 0 ? chapterIndex[i + 1] : undefined,
  }
}

export async function loadChapter(id: string): Promise<ChapterDoc> {
  const loader = chapterLoaders[id]
  if (!loader) throw new ChapterNotFound(id)
  const mod = await loader()
  return mod.default
}
