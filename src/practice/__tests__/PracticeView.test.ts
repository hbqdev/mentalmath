import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { disposeProgressStore, useProgress } from '@/app/progress'
import { formatAnswer } from '@/exercises/checker'
import { findGenerated } from '@/exercises/generators'
import { generateMany } from '@/exercises/generators/shared'
import { createRng } from '@/exercises/rng'
import { createAppRouter } from '@/router'
import PracticeView from '../PracticeView.vue'

async function mountAt(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const w = mount(PracticeView, { global: { plugins: [router], stubs: { Teleport: true } } })
  await flushPromises()
  return { w, router }
}

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('PracticeView', () => {
  it('runs a seeded generated session to the results and records the attempt', async () => {
    useProgress().state.value.settings.unlockAll = true
    const { w } = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=42')
    const expected = generateMany(findGenerated('gen1-two-digit-addition')!, 10, 'mixed', createRng(42))
    for (let i = 0; i < 10; i++) {
      expect(w.find('[data-testid="practice-progress"]').text()).toContain(`${i + 1} / 10`)
      const input = w.find('input[data-testid="answer-input"]')
      await input.setValue(formatAnswer(expected[i]!.answer))
      await input.trigger('keyup.enter')
      await flushPromises()
      expect(w.find('[data-testid="feedback"]').text()).toMatch(/correct/i)
      await w.find('[data-testid="next-button"]').trigger('click')
      await flushPromises()
    }
    expect(w.find('[data-testid="results-score"]').text()).toContain('10 / 10')
    expect(w.text()).toContain('42')
    const p = useProgress()
    expect(p.bestScore('gen1-two-digit-addition')).toBe(10)
    expect(p.state.value.practice['gen1-two-digit-addition']?.attempts).toHaveLength(1)
  })

  it('shows the canonical answer and steps after a wrong answer', async () => {
    useProgress().state.value.settings.unlockAll = true
    const { w } = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=7')
    const expected = generateMany(findGenerated('gen1-two-digit-addition')!, 10, 'mixed', createRng(7))
    const input = w.find('input[data-testid="answer-input"]')
    await input.setValue('0')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(w.find('[data-testid="feedback"]').text()).toContain(formatAnswer(expected[0]!.answer))
    expect(w.find('[data-testid="solution-steps"]').findAll('li').length).toBeGreaterThan(0)
  })

  it('shows a locked state with a link to the section when the set is not unlocked yet', async () => {
    const { w } = await mountAt('/practice/1/ch1-two-digit-addition')
    expect(w.find('[data-testid="locked"]').exists()).toBe(true)
    expect(w.find('a[href="/read/1/left-to-right-addition"]').exists()).toBe(true)
    expect(w.find('input[data-testid="answer-input"]').exists()).toBe(false)
  })

  it('offers the generated twin when a book set has no problems yet', async () => {
    useProgress().state.value.settings.unlockAll = true
    const { w } = await mountAt('/practice/1/ch1-two-digit-addition')
    expect(w.text()).toMatch(/soon/i)
    expect(w.find('a[href*="/practice/1/gen1-two-digit-addition"]').exists()).toBe(true)
  })

  it('shows not-found for an unknown set or a set from another chapter', async () => {
    const a = await mountAt('/practice/1/nope')
    expect(a.w.find('[data-testid="set-not-found"]').exists()).toBe(true)
    const b = await mountAt('/practice/2/gen1-two-digit-addition')
    expect(b.w.find('[data-testid="set-not-found"]').exists()).toBe(true)
  })
})

describe('review fixes: practice flow', () => {
  it('Enter advances after feedback and focus stays usable', async () => {
    useProgress().state.value.settings.unlockAll = true
    const { w } = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=42')
    const input = w.find('input[data-testid="answer-input"]')
    await input.setValue('0')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(w.find('[data-testid="feedback"]').exists()).toBe(true)
    await w.find('input[data-testid="answer-input"]').trigger('keyup.enter')
    await flushPromises()
    expect(w.find('[data-testid="practice-progress"]').text()).toContain('2 / 10')
    expect(w.find('[data-testid="feedback"]').exists()).toBe(false)
  })

  it('a book set opened in generated mode redirects to its generated twin', async () => {
    useProgress().state.value.settings.unlockAll = true
    const { router } = await mountAt('/practice/1/ch1-two-digit-addition?mode=generated')
    await flushPromises()
    expect(router.currentRoute.value.params.set).toBe('gen1-two-digit-addition')
  })
})
