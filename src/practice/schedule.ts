import type { Attempt, ProgressState } from '@/app/progress'
import { findGenerated } from '@/exercises/generators'
import { generatedTwin, setTitle } from '@/exercises/registry'

export interface DueItem {
  setId: string
  chapterId: string
  title: string
  /** ISO time the technique came (or comes) due. */
  dueAt: string
  lastAt: string
  lastPct: number
  /** Whole days past due; negative while still waiting. */
  overdueDays: number
}

const DAY = 86_400_000

/**
 * Days to wait after the latest attempt: a weak score comes back tomorrow, a fair one in three
 * days, a strong one doubles the gap since the previous attempt (three days at least, thirty at most).
 */
export function intervalDays(attempts: Attempt[]): number {
  const sorted = [...attempts].sort((a, b) => a.at.localeCompare(b.at))
  const last = sorted.at(-1)
  if (!last) return 0
  const pct = last.total ? last.correct / last.total : 0
  if (pct < 0.7) return 1
  if (pct < 0.9) return 3
  const prev = sorted.at(-2)
  const gap = prev ? Math.round((Date.parse(last.at) - Date.parse(prev.at)) / DAY) : 0
  return Math.min(30, Math.max(3, gap * 2))
}

/** Practice on a book set counts for its generated twin; only techniques with a drill are scheduled. */
function techniqueOf(setId: string): string | undefined {
  if (setId.startsWith('gen')) return setId
  return generatedTwin(setId)?.id
}

export function dueTechniques(
  practice: ProgressState['practice'],
  now: Date = new Date(),
  limit = 5,
): { due: DueItem[]; next: DueItem | undefined } {
  const byTechnique = new Map<string, Attempt[]>()
  for (const [setId, entry] of Object.entries(practice)) {
    const key = techniqueOf(setId)
    if (!key || entry.attempts.length === 0) continue
    byTechnique.set(key, [...(byTechnique.get(key) ?? []), ...entry.attempts])
  }
  const items: DueItem[] = []
  for (const [setId, attempts] of byTechnique) {
    const sorted = attempts.sort((a, b) => a.at.localeCompare(b.at))
    const last = sorted.at(-1)!
    const lastMs = Date.parse(last.at)
    if (Number.isNaN(lastMs)) continue
    const dueMs = lastMs + intervalDays(sorted) * DAY
    const def = findGenerated(setId)
    items.push({
      setId,
      chapterId: def?.chapterId ?? setId.replace(/^gen([^-]+)-.*/, '$1'),
      title: def?.title ?? setTitle(setId),
      dueAt: new Date(dueMs).toISOString(),
      lastAt: last.at,
      lastPct: last.total ? Math.round((100 * last.correct) / last.total) : 0,
      overdueDays: Math.floor((now.getTime() - dueMs) / DAY),
    })
  }
  const due = items
    .filter((i) => Date.parse(i.dueAt) <= now.getTime())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, limit)
  const next = items
    .filter((i) => Date.parse(i.dueAt) > now.getTime())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0]
  return { due, next }
}
