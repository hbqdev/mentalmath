import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { createSession, type Session, type SessionState } from '@/exercises/session'
import type { Exercise } from '@/exercises/types'

/** Reactive wrapper around the pure session: refs update after each action, a ticker drives the clock. */
export function usePracticeSession() {
  const session = shallowRef<Session | null>(null)
  const state = shallowRef<SessionState | null>(null)
  const elapsedMs = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function sync() {
    if (!session.value) return
    state.value = { ...session.value.state() }
    elapsedMs.value = session.value.elapsedMs()
  }

  function stopTicker() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function start(exercises: Exercise[]) {
    stopTicker()
    session.value = createSession(exercises)
    sync()
    timer = setInterval(() => {
      if (session.value?.state().phase === 'done') stopTicker()
      elapsedMs.value = session.value?.elapsedMs() ?? 0
    }, 500)
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
  return { state, seconds, start, submit, next }
}
