import { useStorage } from '@vueuse/core'
import type { Ref } from 'vue'

export interface Attempt {
  at: string
  correct: number
  total: number
  seconds: number
  mode: 'book' | 'generated' | 'timed'
}

export interface ProgressState {
  reading: Record<string, { lastSection: string; visited: string[]; updatedAt: string }>
  practice: Record<string, { attempts: Attempt[]; best: number }>
  streak: { current: number; lastActiveDay: string }
  settings: {
    theme: 'system' | 'light' | 'dark'
    focus: boolean
    fontScale: 0 | 1 | 2
    unlockAll: boolean
  }
}

export const STORAGE_KEY = 'mentalmath.v1'

export function defaultProgress(): ProgressState {
  return {
    reading: {},
    practice: {},
    streak: { current: 0, lastActiveDay: '' },
    settings: { theme: 'system', focus: false, fontScale: 1, unlockAll: false },
  }
}

function localDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const ta = Date.UTC(ay ?? 0, (am ?? 1) - 1, ad ?? 1)
  const tb = Date.UTC(by ?? 0, (bm ?? 1) - 1, bd ?? 1)
  return Math.round((tb - ta) / 86_400_000)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Defaults win for missing keys at any depth; stored values win where present. */
export function mergeWithDefaults<T>(stored: unknown, defaults: T): T {
  if (!isPlainObject(stored) || !isPlainObject(defaults)) return defaults
  const out: Record<string, unknown> = { ...defaults }
  for (const [k, v] of Object.entries(stored)) {
    const d = (defaults as Record<string, unknown>)[k]
    out[k] = isPlainObject(v) && isPlainObject(d) ? mergeWithDefaults(v, d) : v
  }
  return out as T
}

let shared: Ref<ProgressState> | null = null

/** Drop the shared ref so the next useProgress() re-reads storage. Used by tests. */
export function disposeProgressStore() {
  shared = null
}

function createState(): Ref<ProgressState> {
  return useStorage<ProgressState>(STORAGE_KEY, defaultProgress(), localStorage, {
    mergeDefaults: (stored, defaults) => mergeWithDefaults(stored, defaults),
    onError: () => {
      /* corrupt JSON: useStorage keeps the defaults; nothing else to do */
    },
  })
}

export function useProgress() {
  // One shared ref per page so every component sees the same state.
  if (!shared) shared = createState()
  const state = shared

  function touchStreak(now = new Date()) {
    const today = localDay(now)
    const { current, lastActiveDay } = state.value.streak
    if (lastActiveDay === today) return
    const next = lastActiveDay && dayDiff(lastActiveDay, today) === 1 ? current + 1 : 1
    state.value.streak = { current: next, lastActiveDay: today }
  }

  function markVisited(chapterId: string, sectionId: string, now = new Date()) {
    const entry = state.value.reading[chapterId] ?? {
      lastSection: sectionId,
      visited: [],
      updatedAt: '',
    }
    const isNew = !entry.visited.includes(sectionId)
    if (isNew) entry.visited = [...entry.visited, sectionId]
    entry.lastSection = sectionId
    entry.updatedAt = now.toISOString()
    state.value.reading = { ...state.value.reading, [chapterId]: entry }
    if (isNew) touchStreak(now)
  }

  function isVisited(chapterId: string, sectionId: string) {
    return state.value.reading[chapterId]?.visited.includes(sectionId) ?? false
  }

  function lastSection(chapterId: string) {
    return state.value.reading[chapterId]?.lastSection
  }

  function chapterCompletion(chapterId: string, totalSections: number) {
    if (totalSections <= 0) return 0
    const n = state.value.reading[chapterId]?.visited.length ?? 0
    return Math.min(1, n / totalSections)
  }

  function recordAttempt(setId: string, attempt: Attempt) {
    const entry = state.value.practice[setId] ?? { attempts: [], best: 0 }
    entry.attempts = [...entry.attempts, attempt]
    entry.best = Math.max(entry.best, attempt.correct)
    state.value.practice = { ...state.value.practice, [setId]: entry }
    const when = Date.parse(attempt.at)
    touchStreak(Number.isNaN(when) ? new Date() : new Date(when))
  }

  function bestScore(setId: string) {
    return state.value.practice[setId]?.best
  }

  function isUnlocked(chapterId: string, sectionId: string) {
    return state.value.settings.unlockAll || isVisited(chapterId, sectionId)
  }

  function reset() {
    state.value = defaultProgress()
  }

  return {
    state,
    markVisited,
    isVisited,
    lastSection,
    chapterCompletion,
    recordAttempt,
    bestScore,
    isUnlocked,
    touchStreak,
    localDay,
    reset,
  }
}
