import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: string[] = []
let delay: Record<string, number> = {}
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' },
}))
vi.mock('@capacitor-community/keep-awake', () => {
  const later = (name: string) => () =>
    new Promise<void>((r) =>
      setTimeout(() => {
        calls.push(name)
        r()
      }, delay[name] ?? 0),
    )
  return { KeepAwake: { keepAwake: later('keepAwake'), allowSleep: later('allowSleep') } }
})

beforeEach(() => {
  calls.length = 0
  delay = {}
  vi.resetModules()
})

describe('keepAwake', () => {
  it('applies requests in the order they were made, even when an earlier native call is slower', async () => {
    const { keepAwake } = await import('../native')
    delay = { allowSleep: 30, keepAwake: 0 }
    void keepAwake(false)
    await keepAwake(true)
    expect(calls).toEqual(['allowSleep', 'keepAwake'])
  })

  it('does not repeat a request that is already in effect', async () => {
    const { keepAwake } = await import('../native')
    await keepAwake(true)
    await keepAwake(true)
    await keepAwake(true)
    await keepAwake(false)
    expect(calls).toEqual(['keepAwake', 'allowSleep'])
  })
})
