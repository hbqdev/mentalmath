import type { ChapterMeta } from '@/content/types'

/** Sections of a chapter the reader has visited, as a fraction of all its sections. */
export function chapterCompletion(
  meta: ChapterMeta | undefined,
  visited: string[] | undefined,
): { done: number; total: number; fraction: number } {
  const total = meta?.sections.length ?? 0
  const ids = new Set(meta?.sections.map((s) => s.id) ?? [])
  const done = (visited ?? []).filter((v) => ids.has(v)).length
  return { done, total, fraction: total ? done / total : 0 }
}
