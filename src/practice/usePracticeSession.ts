import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import {
  createSession,
  type Session,
  type SessionOptions,
  type SessionState,
} from '@/exercises/session'
import type { Exercise } from '@/exercises/types'

/** Reactive wrapper around the pure session: refs update after each action, a ticker drives the clocks. */
export function usePracticeSession() {
  const session = shallowRef<Session | null>(null)
  const state = shallowRef<SessionState | null>(null)
  const elapsedMs = ref(0)
  const timeLeftMs = ref(Infinity)
  const shotLeftMs = ref(Infinity)
  let shotMs = 0
  let timer: ReturnType<typeof setInterval> | null = null

  function sync() {
    if (!session.value) return
    state.value = { ...session.value.state() }
    elapsedMs.value = session.value.elapsedMs()
    timeLeftMs.value = session.value.timeLeftMs()
    shotLeftMs.value = session.value.shotLeftMs()
  }

  function stopTicker() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function start(exercises: Exercise[], opts: Omit<SessionOptions, 'now'> = {}) {
    stopTicker()
    shotMs = opts.shotMs ?? 0
    session.value = createSession(exercises, opts)
    sync()
    timer = setInterval(() => {
      const s = session.value
      if (!s) return
      if (s.tick()) sync()
      else {
        elapsedMs.value = s.elapsedMs()
        timeLeftMs.value = s.timeLeftMs()
        shotLeftMs.value = s.shotLeftMs()
      }
      if (s.state().phase === 'done') stopTicker()
    }, 250)
  }

  function submit(input: string) {
    const r = session.value?.submit(input)
    sync()
    return r
  }

  function next() {
    session.value?.next()
    sync()
  }

  onBeforeUnmount(stopTicker)

  const seconds = computed(() => Math.round(elapsedMs.value / 1000))
  /** Whole seconds left on a sprint, undefined without one. */
  const timeLeft = computed(() =>
    Number.isFinite(timeLeftMs.value) ? Math.ceil(timeLeftMs.value / 1000) : undefined,
  )
  /** 1 → 0 as the shot clock runs down; undefined without one or between problems. */
  const shotFraction = computed(() =>
    shotMs && Number.isFinite(shotLeftMs.value)
      ? Math.max(0, Math.min(1, shotLeftMs.value / shotMs))
      : undefined,
  )
  return { state, seconds, timeLeft, shotFraction, start, submit, next }
}
