import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../index'

async function go(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router.currentRoute.value
}

describe('router', () => {
  it('serves the reader at /read/:chapter/:section?', async () => {
    const r = await go('/read/1/two-digit-addition')
    expect(r.name).toBe('read')
    expect(r.params).toEqual({ chapter: '1', section: 'two-digit-addition' })
  })

  it('redirects legacy /chapters/:id to the reader', async () => {
    const r = await go('/chapters/3')
    expect(r.name).toBe('read')
    expect(r.params.chapter).toBe('3')
  })

  it('keeps the legacy exercise route alive until Plan 2', async () => {
    const r = await go('/exercises/1/left-to-right-addition')
    expect(r.name).toBe('legacy-exercise')
  })

  it('falls back to not-found for unknown paths', async () => {
    const r = await go('/nothing/here')
    expect(r.name).toBe('not-found')
  })
})
