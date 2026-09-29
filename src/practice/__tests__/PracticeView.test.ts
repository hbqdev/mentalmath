import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    useProgress().state.value.settings.lockUntilRead = false
    const { w } = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=42')
    const expected = generateMany(
      findGenerated('gen1-two-digit-addition')!,
      10,
      'mixed',
      createRng(42),
    )
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
    useProgress().state.value.settings.lockUntilRead = false
    const { w } = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=7')
    const expected = generateMany(
      findGenerated('gen1-two-digit-addition')!,
      10,
      'mixed',
      createRng(7),
    )
    const input = w.find('input[data-testid="answer-input"]')
    await input.setValue('0')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(w.find('[data-testid="feedback"]').text()).toContain(formatAnswer(expected[0]!.answer))
    expect(w.find('[data-testid="solution-steps"]').findAll('li').length).toBeGreaterThan(0)
  })

  it('shows a locked state with a link to the section when the reading gate is on', async () => {
    useProgress().state.value.settings.lockUntilRead = true
    const { w } = await mountAt('/practice/1/ch1-two-digit-addition')
    expect(w.find('[data-testid="locked"]').exists()).toBe(true)
    expect(w.find('a[href="/read/1/left-to-right-addition"]').exists()).toBe(true)
    expect(w.find('input[data-testid="answer-input"]').exists()).toBe(false)
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
    useProgress().state.value.settings.lockUntilRead = false
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
    useProgress().state.value.settings.lockUntilRead = false
    const { router } = await mountAt('/practice/1/ch1-two-digit-addition?mode=generated')
    await flushPromises()
    expect(router.currentRoute.value.params.set).toBe('gen1-two-digit-addition')
  })
})

describe('book sessions', () => {
  it("runs a book set with the authors' steps and records an attempt with the set length", async () => {
    const { bookExercises } = await import('@/exercises/bookSets')
    await import('@/content/book-exercises')
    useProgress().state.value.settings.lockUntilRead = false
    const { w } = await mountAt('/practice/3/ch3-multiplying-by-11?view=one')
    const problems = bookExercises('ch3-multiplying-by-11')
    expect(problems).toHaveLength(3)
    expect(w.find('[data-testid="practice-progress"]').text()).toContain('1 / 3')
    const input = w.find('input[data-testid="answer-input"]')
    await input.setValue('0')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(w.find('[data-testid="feedback"]').text()).toContain(formatAnswer(problems[0]!.answer))
    expect(w.find('[data-testid="solution-steps"]').text()).toContain(
      problems[0]!.solution!.steps[0]!,
    )
    await w.find('[data-testid="next-button"]').trigger('click')
    for (let i = 1; i < 3; i++) {
      const box = w.find('input[data-testid="answer-input"]')
      await box.setValue(formatAnswer(problems[i]!.answer))
      await box.trigger('keyup.enter')
      await flushPromises()
      await w.find('[data-testid="next-button"]').trigger('click')
      await flushPromises()
    }
    expect(w.find('[data-testid="results-score"]').text()).toContain('2 / 3')
    expect(w.find('[data-testid="generated-twin"]').attributes('href')).toContain(
      '/practice/3/gen3-multiplying-by-11',
    )
    const attempt = useProgress().state.value.practice['ch3-multiplying-by-11']?.attempts.at(-1)
    expect(attempt).toMatchObject({ correct: 2, total: 3, mode: 'book' })
  })

  it('answers a weekday choice in the chapter 9 book set', async () => {
    await import('@/content/book-exercises')
    useProgress().state.value.settings.lockUntilRead = false
    const { w } = await mountAt('/practice/9/ch9-a-day-for-any-date?view=one')
    expect(w.find('[data-testid="choice-friday"]').exists()).toBe(true)
    await w.find('[data-testid="choice-friday"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-testid="feedback"]').text()).toMatch(/Correct/)
  })

  it('shows a book set as a worksheet by default and a generated set one at a time', async () => {
    useProgress().state.value.settings.lockUntilRead = false
    const a = await mountAt('/practice/3/ch3-multiplying-by-11')
    expect(a.w.find('[data-testid="worksheet"]').exists()).toBe(true)
    expect(a.w.findAll('[data-testid^="sheet-item-"]').length).toBe(3)
    expect(a.w.find('[data-testid="answer-input"]').exists()).toBe(false)
    const b = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=1')
    expect(b.w.find('[data-testid="worksheet"]').exists()).toBe(false)
    expect(b.w.find('[data-testid="answer-input"]').exists()).toBe(true)
    await b.w.find('[data-testid="view-sheet"]').trigger('click')
    await flushPromises()
    expect(b.w.find('[data-testid="worksheet"]').exists()).toBe(true)
  })

  it("links back to the set's section when opened directly, and back in history when it came from the chapter", async () => {
    useProgress().state.value.settings.lockUntilRead = false
    const direct = await mountAt('/practice/1/gen1-two-digit-addition?mode=generated&seed=1')
    const link = direct.w.find('[data-testid="practice-back"]')
    expect(link.attributes('href')).toBe('/read/1/left-to-right-addition')
    expect(link.text()).toContain('Chapter 1')
    // arriving from the chapter page
    const router = createAppRouter(createMemoryHistory())
    await router.push('/read/1/left-to-right-addition')
    await router.push('/practice/1/gen1-two-digit-addition?mode=generated&seed=1')
    await router.isReady()
    window.history.replaceState({ back: '/read/1/left-to-right-addition' }, '')
    const w = mount(PracticeView, { global: { plugins: [router], stubs: { Teleport: true } } })
    await flushPromises()
    expect(w.find('button[data-testid="practice-back"]').text()).toContain('Back to Chapter 1')
    window.history.replaceState({}, '')
  })
})

describe('PracticeView timed', () => {
  it('runs a sprint against the clock, records the attempt and a personal best', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    try {
      useProgress().state.value.settings.lockUntilRead = false
      const { w } = await mountAt(
        '/practice/1/gen1-two-digit-addition?mode=generated&len=1m&seed=42',
      )
      expect(w.find('[data-testid="time-left"]').text()).toBe('1:00')
      expect(w.find('[data-testid="practice-progress"]').text()).toBe('0 answered')
      const expected = generateMany(
        findGenerated('gen1-two-digit-addition')!,
        10,
        'mixed',
        createRng(42),
      )
      const input = w.find('input[data-testid="answer-input"]')
      await input.setValue(formatAnswer(expected[0]!.answer))
      await input.trigger('keyup.enter')
      await flushPromises()
      await w.find('[data-testid="next-button"]').trigger('click')
      await flushPromises()
      expect(w.find('[data-testid="practice-progress"]').text()).toBe('1 answered')
      vi.advanceTimersByTime(61_000)
      await flushPromises()
      expect(w.find('[data-testid="results-score"]').text()).toBe('1 / 1')
      expect(w.find('[data-testid="results-best"]').text()).toMatch(/New best/)
      const entry = useProgress().state.value.practice['gen1-two-digit-addition']!
      expect(entry.attempts.at(-1)).toMatchObject({
        mode: 'timed',
        sprint: 60,
        correct: 1,
        total: 1,
      })
      expect(entry.bests).toEqual({ sprint60: 1 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('a shot clock times a problem out', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    try {
      useProgress().state.value.settings.lockUntilRead = false
      const { w } = await mountAt(
        '/practice/1/gen1-two-digit-addition?mode=generated&shot=10&seed=42',
      )
      expect(w.find('[data-testid="shot-clock"]').exists()).toBe(true)
      vi.advanceTimersByTime(10_500)
      await flushPromises()
      expect(w.find('[data-testid="feedback"]').text()).toMatch(/Time's up/)
    } finally {
      vi.useRealTimers()
    }
  })
})
