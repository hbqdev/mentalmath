import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import { disposeProgressStore } from '@/app/progress'
import ContentBlocks from '../ContentBlocks.vue'
import type { Block } from '@/content/types'

const router = createAppRouter(createMemoryHistory())

const blocks: Block[] = [
  { type: 'html', html: '<p>Hello <u>5</u></p>', page: 12 },
  { type: 'figure', id: 'ch4-f001', src: '/book/figures/4/ch4-f001.jpeg', width: 32, height: 70 },
  { type: 'exercise', setId: 'ch1-two-digit-addition' },
]

beforeEach(() => {
  localStorage.clear()
  disposeProgressStore()
})

describe('ContentBlocks', () => {
  it('renders prose, figures and exercise callouts in order', () => {
    const w = mount(ContentBlocks, {
      props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' },
      global: { plugins: [router] },
    })
    const kids = w.element.children
    expect(kids[0]?.classList.contains('prose')).toBe(true)
    expect(kids[0]?.innerHTML).toContain('<u>5</u>')
    expect(kids[0]?.getAttribute('data-page')).toBe('12')
    const img = w.find('img')
    expect(img.attributes('src')).toBe('/book/figures/4/ch4-f001.jpeg')
    expect(img.attributes('width')).toBe('32')
    expect(img.attributes('loading')).toBe('lazy')
    expect(w.text()).toContain('Two-Digit Addition')
  })

  it('shows the callout as locked until the section is visited', () => {
    const w = mount(ContentBlocks, {
      props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' },
      global: { plugins: [router] },
    })
    expect(w.text()).toMatch(/unlocks|locked/i)
  })
})

describe('ExerciseCallout links', () => {
  it('links Book set and Generate to their practice routes once unlocked', async () => {
    const { useProgress } = await import('@/app/progress')
    useProgress().state.value.settings.unlockAll = true
    const w = mount(ContentBlocks, {
      props: { blocks, chapterId: '1', sectionId: 'two-digit-addition' },
      global: { plugins: [router] },
    })
    expect(w.find('a[href="/practice/1/ch1-two-digit-addition"]').text()).toBe('Book set')
    const gen = w.find('a[href="/practice/1/gen1-two-digit-addition?mode=generated"]')
    expect(gen.exists()).toBe(true)
    expect(gen.text()).toBe('Generate')
  })

  it('keeps a typeset worked example ahead of the callout that follows it (ch3-f041)', async () => {
    const doc = (await import('@/content/chapters/3.json')).default as {
      sections: Array<{ id: string; blocks: Block[] }>
    }
    const sec = doc.sections.find((s) => s.id === 'three-digit-squares')!
    const i = sec.blocks.findIndex((b) => b.type === 'figure' && b.id === 'ch3-f041')
    expect(sec.blocks[i + 1]?.type).toBe('exercise')
    const w = mount(ContentBlocks, {
      props: {
        blocks: sec.blocks.slice(i, i + 2),
        chapterId: '3',
        sectionId: 'three-digit-squares',
      },
      global: { plugins: [router] },
    })
    const kids = [...w.element.children]
    expect(kids[0]?.getAttribute('data-figure')).toBe('ch3-f041')
    expect(kids[0]?.getAttribute('data-override')).toBe('stack')
    expect(kids[1]?.getAttribute('data-testid')).toBe('exercise-callout')
  })
})
