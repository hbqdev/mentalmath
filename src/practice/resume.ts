import type { SessionState } from '@/exercises/session'

/** A drill interrupted by a phone call or an app switch continues from here (sessionStorage, one per set URL). */
export interface SavedRun {
  key: string
  inputs: string[]
  elapsedMs: number
  savedAt: number
}

const PREFIX = 'mentalmath.run:'
const store = () => (typeof sessionStorage !== 'undefined' ? sessionStorage : null)

export function runKey(setId: string, query: Record<string, unknown>): string {
  const q = ['mode', 'seed', 'difficulty'].map((k) => `${k}=${String(query[k] ?? '')}`).join('&')
  return `${setId}?${q}`
}

export function saveRun(key: string, st: SessionState, elapsedMs: number) {
  const s = store()
  if (!s) return
  if (st.phase === 'done' || st.history.length === 0) {
    s.removeItem(PREFIX + key)
    return
  }
  const run: SavedRun = {
    key,
    inputs: st.history.map((h) => h.input),
    elapsedMs,
    savedAt: Date.now(),
  }
  try {
    s.setItem(PREFIX + key, JSON.stringify(run))
  } catch {
    /* storage full or blocked: resume is a convenience only */
  }
}

export function loadRun(key: string): SavedRun | null {
  const s = store()
  if (!s) return null
  try {
    const raw = s.getItem(PREFIX + key)
    if (!raw) return null
    const run = JSON.parse(raw) as SavedRun
    return Array.isArray(run.inputs) && run.inputs.length > 0 ? run : null
  } catch {
    return null
  }
}

export function clearRun(key: string) {
  store()?.removeItem(PREFIX + key)
}
