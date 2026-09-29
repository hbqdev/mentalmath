import { check, type CheckResult } from './checker'
import type { Exercise } from './types'

export interface SessionOptions {
  timed?: boolean
  now?: () => number
  /** Sprint: keep drawing problems from `more` until this many ms have passed. */
  sprintMs?: number
  more?: () => Exercise[]
  /** Shot clock: a problem left unanswered this long counts as wrong. */
  shotMs?: number
  /** Continue a run: answers already given, in order, and the time spent so far. */
  resume?: { inputs: string[]; elapsedMs: number }
}

export interface SessionState {
  index: number
  total: number
  current: Exercise | null
  phase: 'answering' | 'feedback' | 'done'
  lastResult?: CheckResult & { input: string; timedOut?: boolean }
  /** True for an endless run against the clock; `total` then counts problems answered. */
  sprint: boolean
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
  /** Ms left on the sprint clock (Infinity without one). */
  timeLeftMs(): number
  /** Ms left to answer the current problem (Infinity without a shot clock). */
  shotLeftMs(): number
  /** Apply the clocks: times the problem out or ends the sprint. True when the state changed. */
  tick(): boolean
}

/** Pure state machine for one practice run; the UI wraps it in reactive refs. */
export function createSession(exercises: Exercise[], opts: SessionOptions = {}): Session {
  const now = opts.now ?? (() => Date.now())
  const startedAt = now()
  let questionStartedAt = startedAt
  const sprint = !!opts.sprintMs
  const pool = [...exercises]
  let expired = false
  const st: SessionState = {
    index: 0,
    total: pool.length,
    current: pool[0] ?? null,
    phase: pool.length ? 'answering' : 'done',
    sprint,
    correct: 0,
    startedAt,
    history: [],
  }
  if (st.phase === 'done') st.finishedAt = startedAt

  const api: Session = {
    state: () => st,
    submit(input) {
      if (st.phase === 'feedback' && st.lastResult) return st.lastResult
      if (st.phase !== 'answering' || !st.current) return { correct: false, shown: '' }
      const result = check(st.current.answer, input)
      if (!input.trim()) return result
      return settle(result, input)
    },
    next() {
      if (st.phase !== 'feedback') return
      st.lastResult = undefined
      if (expired || (!sprint && st.index >= st.total - 1)) return finish()
      if (sprint && st.index >= pool.length - 2 && opts.more) {
        pool.push(...opts.more())
        st.total = pool.length
      }
      st.index += 1
      st.current = pool[st.index] ?? null
      if (!st.current) return finish()
      st.phase = 'answering'
      questionStartedAt = now()
    },
    elapsedMs() {
      return (st.finishedAt ?? now()) - st.startedAt
    },
    timeLeftMs() {
      if (!opts.sprintMs) return Infinity
      return Math.max(0, opts.sprintMs - api.elapsedMs())
    },
    shotLeftMs() {
      if (!opts.shotMs || st.phase !== 'answering') return Infinity
      return Math.max(0, opts.shotMs - (now() - questionStartedAt))
    },
    tick() {
      if (st.phase === 'done') return false
      if (opts.sprintMs && api.timeLeftMs() <= 0) {
        if (st.phase === 'answering') {
          finish()
          return true
        }
        expired = true // let the feedback be read; next() ends the run
        return false
      }
      if (st.phase === 'answering' && st.current && api.shotLeftMs() <= 0) {
        settle({ ...check(st.current.answer, ''), timedOut: true }, '')
        return true
      }
      return false
    },
  }
  function finish() {
    st.phase = 'done'
    st.current = null
    st.lastResult = undefined
    if (sprint) st.total = st.history.length
    st.finishedAt ??= now()
  }
  function settle(result: CheckResult & { timedOut?: boolean }, input: string): CheckResult {
    if (!st.current) return result
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
    if (!sprint && st.index === st.total - 1) st.finishedAt = t
    return result
  }
  // Replay the answers of an interrupted run so the learner continues where they left off.
  if (opts.resume) {
    for (const input of opts.resume.inputs) {
      api.submit(input)
      api.next()
    }
    st.startedAt = now() - opts.resume.elapsedMs
    questionStartedAt = now()
  }
  return api
}
