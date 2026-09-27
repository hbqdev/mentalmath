import { check, type CheckResult } from './checker'
import type { Exercise } from './types'

export interface SessionOptions {
  timed?: boolean
  now?: () => number
}

export interface SessionState {
  index: number
  total: number
  current: Exercise | null
  phase: 'answering' | 'feedback' | 'done'
  lastResult?: CheckResult & { input: string }
  correct: number
  startedAt: number
  finishedAt?: number
  history: Array<{ exercise: Exercise; input: string; correct: boolean; ms: number }>
}

export interface Session {
  state: () => SessionState
  submit(input: string): CheckResult
  next(): void
  elapsedMs(): number
}

/** Pure state machine for one practice run; the UI wraps it in reactive refs. */
export function createSession(exercises: Exercise[], opts: SessionOptions = {}): Session {
  const now = opts.now ?? (() => Date.now())
  const startedAt = now()
  let questionStartedAt = startedAt
  const st: SessionState = {
    index: 0,
    total: exercises.length,
    current: exercises[0] ?? null,
    phase: exercises.length ? 'answering' : 'done',
    correct: 0,
    startedAt,
    history: [],
  }
  if (st.phase === 'done') st.finishedAt = startedAt

  return {
    state: () => st,
    submit(input) {
      if (st.phase === 'feedback' && st.lastResult) return st.lastResult
      if (st.phase !== 'answering' || !st.current) return { correct: false, shown: '' }
      const result = check(st.current.answer, input)
      if (!input.trim()) return result
      const t = now()
      st.lastResult = { ...result, input }
      st.history.push({
        exercise: st.current,
        input,
        correct: result.correct,
        ms: t - questionStartedAt,
      })
      if (result.correct) st.correct += 1
      st.phase = 'feedback'
      if (st.index === st.total - 1) st.finishedAt = t
      return result
    },
    next() {
      if (st.phase !== 'feedback') return
      st.lastResult = undefined
      if (st.index >= st.total - 1) {
        st.phase = 'done'
        st.current = null
        st.finishedAt ??= now()
        return
      }
      st.index += 1
      st.current = exercises[st.index] ?? null
      st.phase = 'answering'
      questionStartedAt = now()
    },
    elapsedMs() {
      return (st.finishedAt ?? now()) - st.startedAt
    },
  }
}
