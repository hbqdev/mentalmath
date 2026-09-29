import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { disposeProgressStore, useProgress } from '@/app/progress'
import { createAppRouter } from '@/router'
import DueToday from '../DueToday.vue'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

function mountIt() {
  return mount(DueToday, { global: { plugins: [createAppRouter(createMemoryHistory())] } })
}

describe('DueToday', () => {
  it('renders nothing before any practice', () => {
    expect(mountIt().find('[data-testid="due-today"]').exists()).toBe(false)
  })

  it('lists due techniques with a one-tap generated drill', () => {
    const p = useProgress()
    p.recordAttempt('gen1-two-digit-addition', {
      at: daysAgo(5),
      correct: 4,
      total: 10,
      seconds: 60,
      mode: 'generated',
    })
    p.recordAttempt('gen2-2-by-1-multiplication', {
      at: daysAgo(1),
      correct: 10,
      total: 10,
      seconds: 60,
      mode: 'generated',
    })
    const w = mountIt()
    const items = w.findAll('[data-testid^="due-item-"]')
    expect(items).toHaveLength(1)
    expect(items[0]!.text()).toContain('Two-digit addition')
    expect(items[0]!.text()).toContain('40%')
    const href = items[0]!.find('a').attributes('href')!
    expect(href).toMatch(/^\/practice\/1\/gen1-two-digit-addition\?mode=generated&seed=\d+/)
    expect(w.find('[data-testid="due-empty"]').exists()).toBe(false)
  })

  it('says when nothing is due and points at what comes next', () => {
    useProgress().recordAttempt('gen1-two-digit-addition', {
      at: daysAgo(0),
      correct: 9,
      total: 10,
      seconds: 60,
      mode: 'generated',
    })
    const w = mountIt()
    expect(w.find('[data-testid="due-empty"]').text()).toMatch(/Nothing due today/)
    expect(w.find('[data-testid="due-next"]').text()).toContain('Two-digit addition')
  })
})
